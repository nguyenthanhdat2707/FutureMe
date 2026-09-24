import { getRequiredString, getRequiredDate } from './mapping';
import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { IOutcomeRepository } from "../interfaces";
import { Outcome, OutcomeStatus } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoOutcomeRepository implements IOutcomeRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.OUTCOMES_TABLE || "future-me-outcomes";
  }

  async findById(id: string): Promise<Outcome | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToOutcome(response.Item as Record<string, unknown>) : null;
  }

  async findByDecisionId(decisionId: string): Promise<Outcome | null> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "decisionId-observedAt-index",
      KeyConditionExpression: "decision_id = :decisionId",
      ExpressionAttributeValues: {
        ":decisionId": decisionId
      },
      ScanIndexForward: false,
      Limit: 1
    }));
    const items = response.Items || [];
    return items.length > 0 ? this.mapToOutcome(items[0] as Record<string, unknown>) : null;
  }

  async findByUserId(userId: string, limit: number = 50): Promise<Outcome[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-observedAt-index",
      KeyConditionExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ScanIndexForward: false,
      Limit: limit
    }));
    return (response.Items || []).map(i => this.mapToOutcome(i as Record<string, unknown>));
  }

  async create(outcome: Omit<Outcome, "id" | "createdAt" | "updatedAt">): Promise<Outcome> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      decision_id: outcome.decisionId,
      user_id: outcome.userId,
      outcome_status: outcome.outcomeStatus,
      would_repeat: outcome.wouldRepeat === null ? null : (outcome.wouldRepeat ? 1 : 0),
      outcome_notes: outcome.outcomeNotes,
      recorded_at: outcome.recordedAt.toISOString(),
      updated_at: now,
      created_at: now
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToOutcome(item);
  }

  async update(id: string, updates: Partial<Pick<Outcome, 'outcomeStatus' | 'wouldRepeat' | 'outcomeNotes'>>): Promise<Outcome | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (updates.outcomeStatus !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'outcome_status';
      expressionAttributeValues[':status'] = updates.outcomeStatus;
    }
    if (updates.wouldRepeat !== undefined) {
      updateExpressions.push('would_repeat = :repeat');
      expressionAttributeValues[':repeat'] = updates.wouldRepeat === null ? null : (updates.wouldRepeat ? 1 : 0);
    }
    if (updates.outcomeNotes !== undefined) {
      updateExpressions.push('outcome_notes = :notes');
      expressionAttributeValues[':notes'] = updates.outcomeNotes;
    }

    if (updateExpressions.length === 0) return existing;

    updateExpressions.push('updated_at = :updated');
    expressionAttributeValues[':updated'] = new Date().toISOString();

    await this.docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 ? { ExpressionAttributeNames: expressionAttributeNames } : {})
    }));

    return this.findById(id);
  }

  private mapToOutcome(item: Record<string, unknown>): Outcome {
    let wouldRepeat: boolean | null = null;
    if (item.would_repeat === 1) wouldRepeat = true;
    else if (item.would_repeat === 0) wouldRepeat = false;

    return {
      id: getRequiredString(item, 'id'),
      decisionId: getRequiredString(item, 'decision_id'),
      userId: getRequiredString(item, 'user_id'),
      outcomeStatus: (typeof item.outcome_status === 'string' ? item.outcome_status : 'pending') as OutcomeStatus,
      wouldRepeat,
      outcomeNotes: typeof item.outcome_notes === 'string' ? item.outcome_notes : null,
      recordedAt: getRequiredDate(item, 'recorded_at'),
      updatedAt: getRequiredDate(item, 'updated_at'),
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
