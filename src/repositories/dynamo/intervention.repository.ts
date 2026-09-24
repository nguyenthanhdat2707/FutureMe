import { getRequiredString, getOptionalString, getRequiredDate, getOptionalArray, toItem } from './mapping';

import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IInterventionRepository } from "../interfaces";
import { Intervention, InterventionLevel, InterventionStatus, InterventionType } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoInterventionRepository implements IInterventionRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.INTERVENTIONS_TABLE || "future-me-interventions";
  }

  async findById(id: string): Promise<Intervention | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToIntervention(toItem(response.Item)) : null;
  }

  async findByUserId(userId: string, limit: number = 50): Promise<Intervention[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ScanIndexForward: false,
      Limit: limit
    }));
    return (response.Items || []).map(i => this.mapToIntervention(toItem(i)));
  }

  async findActiveByUserId(userId: string): Promise<Intervention[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-status-index",
      KeyConditionExpression: "user_id = :userId AND #st = :status",
      ExpressionAttributeNames: {
        "#st": "status"
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":status": "ACTIVE"
      },
      ScanIndexForward: false
    }));
    return (response.Items || []).map(i => this.mapToIntervention(toItem(i)));
  }

  async findByIssueKey(userId: string, issueKey: string): Promise<Intervention | null> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-issueKey-index",
      KeyConditionExpression: "user_id = :userId AND issue_key = :issueKey",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":issueKey": issueKey
      },
      ScanIndexForward: false,
      Limit: 1
    }));
    if (!response.Items || response.Items.length === 0) return null;
    return this.mapToIntervention(toItem(response.Items[0]));
  }

  async create(intervention: Omit<Intervention, "createdAt">): Promise<Intervention> {
    const id = intervention.id || uuidv4();
    const now = new Date().toISOString();

    const suggestedActions = intervention.suggestedActions || (intervention.suggestedAction ? [intervention.suggestedAction] : []);

    const item: Record<string, unknown> = {
      id,
      user_id: intervention.userId,
      decision_id: intervention.decisionId || null,
      issue_key: intervention.issueKey,
      type: intervention.type,
      level: intervention.level,
      status: intervention.status || 'ACTIVE',
      reason: intervention.reason,
      prompt: intervention.prompt || null,
      suggested_actions: suggestedActions.length > 0 ? JSON.stringify(suggestedActions) : null,
      severity: intervention.severity || null,
      dismissed_at: intervention.dismissedAt ? intervention.dismissedAt.toISOString() : null,
      last_material_change_at: intervention.lastMaterialChangeAt ? intervention.lastMaterialChangeAt.toISOString() : null,
      created_at: now
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToIntervention(item);
  }

  async updateStatus(id: string, status: InterventionStatus, updates?: Partial<Intervention>): Promise<Intervention | null> {
    try {
      const dismissedAt = updates?.dismissedAt ? updates.dismissedAt.toISOString() : null;
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: dismissedAt
          ? "SET #st = :status, dismissed_at = :dismissedAt"
          : "SET #st = :status",
        ExpressionAttributeNames: {
          "#st": "status"
        },
        ExpressionAttributeValues: dismissedAt
          ? { ":status": status, ":dismissedAt": dismissedAt }
          : { ":status": status },
        ReturnValues: "ALL_NEW"
      }));
      return response.Attributes ? this.mapToIntervention(toItem(response.Attributes)) : null;
    } catch (e: unknown) {
      const error = e as Error;
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  async dismiss(id: string, dismissedAt?: Date): Promise<Intervention | null> {
    const at = (dismissedAt || new Date()).toISOString();
    return this.updateStatus(id, 'DISMISSED', { dismissedAt: new Date(at) });
  }

  private mapToIntervention(item: Record<string, unknown>): Intervention {
    const rawSuggestedActions = getOptionalArray<string>(item, 'suggested_actions');
    const suggestedActions = Array.isArray(rawSuggestedActions) ? rawSuggestedActions : [];


    const rawDismissedAt = getOptionalString(item, 'dismissed_at');
    const rawLastChangeAt = getOptionalString(item, 'last_material_change_at');

    return {
      id: getRequiredString(item, 'id'),
      userId: getRequiredString(item, 'user_id'),
      decisionId: getOptionalString(item, 'decision_id'),
      issueKey: getRequiredString(item, 'issue_key'),
      type: (getRequiredString(item, 'type') as InterventionType) || 'NONE',
      level: (getRequiredString(item, 'level') as InterventionLevel) || InterventionLevel.NONE,
      status: (getRequiredString(item, 'status') as InterventionStatus) || 'ACTIVE',
      reason: getRequiredString(item, 'reason'),
      prompt: getOptionalString(item, 'prompt'),
      suggestedAction: suggestedActions.length > 0 ? suggestedActions[0] : undefined,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      severity: getOptionalString(item, 'severity') as 'low' | 'medium' | 'high' | undefined,
      dismissedAt: rawDismissedAt ? new Date(rawDismissedAt) : undefined,
      lastMaterialChangeAt: rawLastChangeAt ? new Date(rawLastChangeAt) : undefined,
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
