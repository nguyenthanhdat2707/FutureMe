import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { generatePhase4Dataset, SEED_VERSION, type DynamoRecord, type TableKey } from '../../demo/phase4-evaluation-dataset';
import { getDemoPersonaById, type DemoPersonaId } from '../../demo/personas';
import { getDynamoClient } from './client';
import type { DemoResetResult, IDemoResetRepository } from '../demo-reset.repository';

interface UserOwnedTable {
  tableName: string;
  indexName: string;
  baselineTable?: TableKey;
}

const RESET_CLEAR_PASSES = 3;
const RESET_PROPAGATION_DELAY_MS = 75;

function requiredTable(envName: string, fallback: string): string {
  return process.env[envName] || fallback;
}

export class DynamoDemoResetRepository implements IDemoResetRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly userTableName: string;
  private readonly userOwnedTables: UserOwnedTable[];
  private readonly pause: (milliseconds: number) => Promise<void>;

  constructor(
    client: DynamoDBDocumentClient = getDynamoClient(),
    pause: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  ) {
    this.docClient = client;
    this.pause = pause;
    this.userTableName = requiredTable('USERS_TABLE', 'future-me-users');
    this.userOwnedTables = [
      { tableName: requiredTable('CONTEXT_TABLE', 'future-me-personal-context'), indexName: 'userId-observedAt-index', baselineTable: 'personalContext' },
      { tableName: requiredTable('OBS_TABLE', 'future-me-observations'), indexName: 'userId-timestamp-index', baselineTable: 'observations' },
      { tableName: requiredTable('CALENDAR_TABLE', 'future-me-calendar-events'), indexName: 'userId-startTime-index', baselineTable: 'calendarEvents' },
      { tableName: requiredTable('DECISIONS_TABLE', 'future-me-decisions'), indexName: 'userId-createdAt-index', baselineTable: 'decisions' },
      { tableName: requiredTable('OUTCOMES_TABLE', 'future-me-outcomes'), indexName: 'userId-recordedAt-index' },
      { tableName: requiredTable('FEEDBACK_TABLE', 'future-me-feedback'), indexName: 'userId-createdAt-index' },
      ...(process.env.INTERVENTIONS_TABLE
        ? [{ tableName: process.env.INTERVENTIONS_TABLE, indexName: 'userId-createdAt-index' }]
        : []),
    ];
  }

  async resetPersona(userId: DemoPersonaId): Promise<DemoResetResult> {
    const persona = getDemoPersonaById(userId);
    const userResponse = await this.docClient.send(new GetCommand({
      TableName: this.userTableName,
      Key: { id: userId },
      ConsistentRead: true,
    }));
    const userItem = userResponse.Item as Record<string, unknown> | undefined;
    const rawAnchor: unknown = userItem?.seeded_at ?? userItem?.created_at;
    const existingAnchor = typeof rawAnchor === 'string' ? new Date(rawAnchor) : null;
    const seededAt = existingAnchor && !Number.isNaN(existingAnchor.getTime()) ? existingAnchor : new Date();
    const dataset = generatePhase4Dataset(seededAt);
    const baselineByTable = new Map<TableKey, DynamoRecord[]>(
      (['users', 'personalContext', 'observations', 'calendarEvents', 'decisions'] as const).map((table) => [
        table,
        dataset.records[table].filter((record) => record.persona === persona.slug),
      ]),
    );

    for (let pass = 0; pass < RESET_CLEAR_PASSES; pass += 1) {
      await Promise.all(this.userOwnedTables.map(async (table) => {
        const items = await this.queryAllForUser(table, userId);
        await Promise.all(items.map((item) => this.docClient.send(new DeleteCommand({
          TableName: table.tableName,
          Key: { id: item.id },
        }))));
      }));
      if (pass < RESET_CLEAR_PASSES - 1) await this.pause(RESET_PROPAGATION_DELAY_MS);
    }

    const userRecords = baselineByTable.get('users') ?? [];
    await Promise.all(userRecords.map((record) => this.docClient.send(new PutCommand({
      TableName: this.userTableName,
      Item: record,
    }))));

    await Promise.all(this.userOwnedTables.map(async (table) => {
      if (!table.baselineTable) return;
      const records = baselineByTable.get(table.baselineTable) ?? [];
      await Promise.all(records.map((record) => this.docClient.send(new PutCommand({
        TableName: table.tableName,
        Item: record,
      }))));
    }));

    return {
      success: true,
      userId,
      seedVersion: SEED_VERSION,
      seededAt: seededAt.toISOString(),
      restored: {
        users: userRecords.length,
        personalContext: baselineByTable.get('personalContext')?.length ?? 0,
        observations: baselineByTable.get('observations')?.length ?? 0,
        calendarEvents: baselineByTable.get('calendarEvents')?.length ?? 0,
        decisions: baselineByTable.get('decisions')?.length ?? 0,
      },
    };
  }

  private async queryAllForUser(table: UserOwnedTable, userId: DemoPersonaId): Promise<Array<{ id: string }>> {
    const items: Array<{ id: string }> = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const response = await this.docClient.send(new QueryCommand({
        TableName: table.tableName,
        IndexName: table.indexName,
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ProjectionExpression: 'id, user_id',
        ExclusiveStartKey: exclusiveStartKey,
      }));
      for (const item of response.Items ?? []) {
        if (item.user_id !== userId || typeof item.id !== 'string') {
          throw new Error(`Refusing to reset record with invalid ownership in ${table.tableName}`);
        }
        items.push({ id: item.id });
      }
      exclusiveStartKey = response.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return items;
  }
}
