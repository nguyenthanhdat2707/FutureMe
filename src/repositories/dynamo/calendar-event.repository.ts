import { getRequiredString, getOptionalString, getRequiredDate } from './mapping';
import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ICalendarEventRepository } from "../interfaces";
import { CalendarEvent } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoCalendarEventRepository implements ICalendarEventRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.CALENDAR_TABLE || "future-me-calendar-events";
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToEvent(response.Item as Record<string, unknown>) : null;
  }

  async findByUserId(userId: string, limit?: number): Promise<CalendarEvent[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-startTime-index",
      KeyConditionExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ScanIndexForward: false,
      Limit: limit
    }));
    return (response.Items || []).map(i => this.mapToEvent(i as Record<string, unknown>));
  }

  async findUpcoming(userId: string, fromDate?: Date): Promise<CalendarEvent[]> {
    const from = fromDate || new Date();
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-startTime-index",
      KeyConditionExpression: "user_id = :userId AND start_time >= :from",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":from": from.toISOString()
      },
      ScanIndexForward: true,
      Limit: 50
    }));
    return (response.Items || []).map(i => this.mapToEvent(i as Record<string, unknown>));
  }

  async findByExternalId(userId: string, externalId: string): Promise<CalendarEvent | null> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-externalId-index",
      KeyConditionExpression: "user_id = :userId AND external_id = :externalId",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":externalId": externalId
      }
    }));
    return response.Items && response.Items.length > 0 ? this.mapToEvent(response.Items[0] as Record<string, unknown>) : null;
  }

  async create(event: Omit<CalendarEvent, "id" | "createdAt">): Promise<CalendarEvent> {
    const id = uuidv4();

    const item: Record<string, unknown> = {
      id,
      user_id: event.userId,
      external_id: event.externalId,
      title: event.title,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      status: event.status ?? undefined,
      raw_data: event.rawData ?? undefined,
      synced_at: event.syncedAt.toISOString(),
      created_at: new Date().toISOString()
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToEvent(item);
  }

  async upsert(event: Omit<CalendarEvent, "id" | "createdAt">): Promise<CalendarEvent> {
    const existing = await this.findByExternalId(event.userId, event.externalId);
    const id = existing ? existing.id : uuidv4();

    const item: Record<string, unknown> = {
      id,
      user_id: event.userId,
      external_id: event.externalId,
      title: event.title,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      status: event.status ?? undefined,
      raw_data: event.rawData ?? undefined,
      synced_at: event.syncedAt.toISOString()
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToEvent(item);
  }

  private mapToEvent(item: Record<string, unknown>): CalendarEvent {
    return {
      id: getRequiredString(item, 'id'),
      userId: getRequiredString(item, 'user_id'),
      externalId: getRequiredString(item, 'external_id'),
      title: getRequiredString(item, 'title'),
      startTime: getRequiredDate(item, 'start_time'),
      endTime: getRequiredDate(item, 'end_time'),
      status: getOptionalString(item, 'status'),
      rawData: getOptionalString(item, 'raw_data'),
      syncedAt: getRequiredDate(item, 'synced_at'),
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
