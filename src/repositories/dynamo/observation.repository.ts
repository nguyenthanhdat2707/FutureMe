import { getRequiredString, getRequiredDate, getRequiredNumber, getRequiredObject, toItem } from './mapping';

import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IObservationRepository } from "../interfaces";
import { Observation, ObservationType, ObservationSource } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoObservationRepository implements IObservationRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.OBS_TABLE || "future-me-observations";
  }

  async findById(id: string): Promise<Observation | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToObservation(toItem(response.Item)) : null;
  }

  async findByUserId(userId: string, limit: number = 100): Promise<Observation[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-timestamp-index",
      KeyConditionExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ScanIndexForward: false,
      Limit: limit
    }));
    return (response.Items || []).map(i => this.mapToObservation(toItem(i)));
  }

  async findRecent(userId: string, hoursBack: number = 24): Promise<Observation[]> {
    const fromDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-timestamp-index",
      KeyConditionExpression: "user_id = :userId AND #ts >= :from",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":from": fromDate
      },
      ScanIndexForward: false
    }));
    return (response.Items || []).map(i => this.mapToObservation(toItem(i)));
  }

  async create(observation: Omit<Observation, "id" | "createdAt">): Promise<Observation> {
    const id = uuidv4();

    const item: Record<string, unknown> = {
      id,
      user_id: observation.userId,
      type: observation.type,
      data: typeof observation.data === 'string' ? observation.data : JSON.stringify(observation.data),
      source: observation.source,
      timestamp: observation.timestamp.toISOString(),
      confidence: observation.confidence,
      created_at: new Date().toISOString()
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToObservation(item);
  }

  private mapToObservation(item: Record<string, unknown>): Observation {
    return {
      id: getRequiredString(item, 'id'),
      userId: getRequiredString(item, 'user_id'),
      type: getRequiredString(item, 'type') as ObservationType,
      data: getRequiredObject<Record<string, unknown>>(item, 'data'),
      source: getRequiredString(item, 'source') as ObservationSource,
      confidence: getRequiredNumber(item, 'confidence'),
      timestamp: getRequiredDate(item, 'timestamp'),
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
