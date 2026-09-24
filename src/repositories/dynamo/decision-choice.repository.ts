/**
 * DynamoDB Decision Choice Repository (Phase 6)
 *
 * NOTE: The DynamoDB table for decision_choices is not yet provisioned in
 * Terraform.  All read methods return empty / null gracefully so the Decision
 * Engine's history-retrieval path (which calls findByDecisionId) simply gets
 * no history rather than a 500.  Write operations (create) will fail loudly if
 * invoked before the table exists, which is the correct behaviour — those paths
 * are not on the hot POST /api/decisions critical path.
 */

import { getDynamoClient } from './client';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { IDecisionChoiceRepository } from '../interfaces';
import { DecisionChoice, ChosenAction, ChoiceStatus } from '../../domain/types';
import { v4 as uuidv4 } from 'uuid';
import { getRequiredString, getOptionalString, getRequiredDate } from './mapping';

export class DynamoDecisionChoiceRepository implements IDecisionChoiceRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    this.docClient = client ?? getDynamoClient();
    this.tableName = process.env.DECISION_CHOICES_TABLE ?? 'future-me-decision-choices';
  }

  async findById(id: string): Promise<DecisionChoice | null> {
    try {
      const response = await this.docClient.send(
        new GetCommand({ TableName: this.tableName, Key: { id } })
      );
      return response.Item ? this.mapToChoice(response.Item as Record<string, unknown>) : null;
    } catch (err: unknown) {
      if (isTableMissing(err)) return null;
      throw err;
    }
  }

  async findByDecisionId(decisionId: string): Promise<DecisionChoice | null> {
    try {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'decisionId-chosenAt-index',
          KeyConditionExpression: 'decision_id = :did',
          ExpressionAttributeValues: { ':did': decisionId },
          ScanIndexForward: false,
          Limit: 1,
        })
      );
      const items = response.Items ?? [];
      return items.length > 0 ? this.mapToChoice(items[0] as Record<string, unknown>) : null;
    } catch (err: unknown) {
      if (isTableMissing(err)) return null;
      throw err;
    }
  }

  async findByUserId(userId: string, limit = 50): Promise<DecisionChoice[]> {
    try {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'userId-chosenAt-index',
          KeyConditionExpression: 'user_id = :uid',
          ExpressionAttributeValues: { ':uid': userId },
          ScanIndexForward: false,
          Limit: limit,
        })
      );
      return (response.Items ?? []).map(i => this.mapToChoice(i as Record<string, unknown>));
    } catch (err: unknown) {
      if (isTableMissing(err)) return [];
      throw err;
    }
  }

  async create(choice: Omit<DecisionChoice, 'id' | 'createdAt'>): Promise<DecisionChoice> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      decision_id: choice.decisionId,
      user_id: choice.userId,
      chosen_action: choice.chosenAction,
      chosen_action_display: choice.chosenActionDisplay,
      custom_notes: choice.customNotes ?? null,
      ai_recommendation: choice.aiRecommendation,
      chosen_at: choice.chosenAt.toISOString(),
      status: choice.status,
      created_at: now,
    };

    await this.docClient.send(new PutCommand({ TableName: this.tableName, Item: item }));

    return this.mapToChoice(item);
  }

  private mapToChoice(item: Record<string, unknown>): DecisionChoice {
    return {
      id: getRequiredString(item, 'id'),
      decisionId: getRequiredString(item, 'decision_id'),
      userId: getRequiredString(item, 'user_id'),
      chosenAction: (getRequiredString(item, 'chosen_action') as ChosenAction),
      chosenActionDisplay: getRequiredString(item, 'chosen_action_display'),
      customNotes: getOptionalString(item, 'custom_notes'),
      aiRecommendation: getRequiredString(item, 'ai_recommendation'),
      chosenAt: getRequiredDate(item, 'chosen_at'),
      status: (getRequiredString(item, 'status') as ChoiceStatus),
      createdAt: getRequiredDate(item, 'created_at'),
    };
  }
}

/**
 * Returns true for errors that mean the table is not yet provisioned.
 * ResourceNotFoundException: table does not exist.
 * AccessDeniedException:    IAM policy does not cover the table (happens before
 *                           existence check when the table is absent from table_arns).
 * Both are safe to swallow here because the history-retrieval caller treats an
 * empty result set as "no prior history" — the decision still flows to RECOMMEND/ASK/ABSTAIN.
 */
function isTableMissing(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const name = (err as { name?: string }).name ?? '';
    const code = (err as { code?: string }).code ?? '';
    return (
      name === 'ResourceNotFoundException' ||
      code === 'ResourceNotFoundException' ||
      name === 'AccessDeniedException' ||
      code === 'AccessDeniedException'
    );
  }
  return false;
}
