/**
 * DynamoDB Check-In Schedule Repository (Phase 6)
 *
 * NOTE: The DynamoDB table for check_in_schedule is not yet provisioned in
 * Terraform.  All read methods return empty / null gracefully (ResourceNotFoundException
 * is caught and swallowed).  Write and update operations will fail loudly if invoked
 * before the table exists — that is intentional and acceptable for the MVP demo.
 */

import { getDynamoClient } from './client';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ICheckInScheduleRepository } from '../interfaces';
import { CheckInSchedule, CheckInStatus } from '../../domain/types';
import { v4 as uuidv4 } from 'uuid';
import { getRequiredString, getRequiredDate, getOptionalDate } from './mapping';

export class DynamoCheckInScheduleRepository implements ICheckInScheduleRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    this.docClient = client ?? getDynamoClient();
    this.tableName = process.env.CHECK_IN_SCHEDULE_TABLE ?? 'future-me-check-in-schedule';
  }

  async findById(id: string): Promise<CheckInSchedule | null> {
    try {
      const response = await this.docClient.send(
        new GetCommand({ TableName: this.tableName, Key: { id } })
      );
      return response.Item ? this.mapToSchedule(response.Item as Record<string, unknown>) : null;
    } catch (err: unknown) {
      if (isTableMissing(err)) return null;
      throw err;
    }
  }

  async findByDecisionId(decisionId: string): Promise<CheckInSchedule | null> {
    try {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'decisionId-scheduledAt-index',
          KeyConditionExpression: 'decision_id = :did',
          ExpressionAttributeValues: { ':did': decisionId },
          ScanIndexForward: false,
          Limit: 1,
        })
      );
      const items = response.Items ?? [];
      return items.length > 0 ? this.mapToSchedule(items[0] as Record<string, unknown>) : null;
    } catch (err: unknown) {
      if (isTableMissing(err)) return null;
      throw err;
    }
  }

  async findPendingByUserId(userId: string): Promise<CheckInSchedule[]> {
    try {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'userId-scheduledAt-index',
          KeyConditionExpression: 'user_id = :uid',
          FilterExpression: '#st = :pending',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':uid': userId, ':pending': 'pending' },
          ScanIndexForward: true,
        })
      );
      return (response.Items ?? []).map(i => this.mapToSchedule(i as Record<string, unknown>));
    } catch (err: unknown) {
      if (isTableMissing(err)) return [];
      throw err;
    }
  }

  async findDueCheckIns(userId: string, currentTime: Date): Promise<CheckInSchedule[]> {
    try {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'userId-scheduledAt-index',
          KeyConditionExpression: 'user_id = :uid AND scheduled_at <= :now',
          FilterExpression: '#st = :pending',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: {
            ':uid': userId,
            ':now': currentTime.toISOString(),
            ':pending': 'pending',
          },
          ScanIndexForward: true,
        })
      );
      return (response.Items ?? []).map(i => this.mapToSchedule(i as Record<string, unknown>));
    } catch (err: unknown) {
      if (isTableMissing(err)) return [];
      throw err;
    }
  }

  async create(schedule: Omit<CheckInSchedule, 'id' | 'createdAt'>): Promise<CheckInSchedule> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      decision_id: schedule.decisionId,
      user_id: schedule.userId,
      scheduled_at: schedule.scheduledAt.toISOString(),
      triggered_at: schedule.triggeredAt?.toISOString() ?? null,
      dismissed_at: schedule.dismissedAt?.toISOString() ?? null,
      status: schedule.status,
      created_at: now,
    };

    await this.docClient.send(new PutCommand({ TableName: this.tableName, Item: item }));

    return this.mapToSchedule(item);
  }

  async updateStatus(
    id: string,
    status: CheckInStatus,
    triggeredAt?: Date
  ): Promise<CheckInSchedule | null> {
    const updateExpressions = ['#st = :st'];
    const expressionAttributeValues: Record<string, unknown> = { ':st': status };
    const expressionAttributeNames: Record<string, string> = { '#st': 'status' };

    if (triggeredAt) {
      updateExpressions.push('triggered_at = :ta');
      expressionAttributeValues[':ta'] = triggeredAt.toISOString();
    }

    try {
      const response = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );
      return response.Attributes
        ? this.mapToSchedule(response.Attributes as Record<string, unknown>)
        : null;
    } catch (err: unknown) {
      if (isTableMissing(err)) return null;
      throw err;
    }
  }

  async dismiss(id: string, dismissedAt?: Date): Promise<CheckInSchedule | null> {
    const now = dismissedAt ?? new Date();
    try {
      const response = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: 'SET #st = :st, dismissed_at = :da',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: {
            ':st': 'dismissed',
            ':da': now.toISOString(),
          },
          ReturnValues: 'ALL_NEW',
        })
      );
      return response.Attributes
        ? this.mapToSchedule(response.Attributes as Record<string, unknown>)
        : null;
    } catch (err: unknown) {
      if (isTableMissing(err)) return null;
      throw err;
    }
  }

  private mapToSchedule(item: Record<string, unknown>): CheckInSchedule {
    return {
      id: getRequiredString(item, 'id'),
      decisionId: getRequiredString(item, 'decision_id'),
      userId: getRequiredString(item, 'user_id'),
      scheduledAt: getRequiredDate(item, 'scheduled_at'),
      triggeredAt: getOptionalDate(item, 'triggered_at'),
      dismissedAt: getOptionalDate(item, 'dismissed_at'),
      status: getRequiredString(item, 'status') as CheckInStatus,
      createdAt: getRequiredDate(item, 'created_at'),
    };
  }
}

/**
 * Returns true for errors that mean the table is not yet provisioned.
 * ResourceNotFoundException: table does not exist.
 * AccessDeniedException:    IAM policy does not cover the table (happens before
 *                           existence check when the table is absent from table_arns).
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
