import { getRequiredString, getRequiredDate } from './mapping';
import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IOutcomeRepository } from "../interfaces";
import { Outcome } from "../../domain/types";
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

  async findByDecisionId(decisionId: string): Promise<Outcome[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "decisionId-observedAt-index",
      KeyConditionExpression: "decision_id = :decisionId",
      ExpressionAttributeValues: {
        ":decisionId": decisionId
      },
      ScanIndexForward: false
    }));
    return (response.Items || []).map(i => this.mapToOutcome(i as Record<string, unknown>));
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

  async create(outcome: Omit<Outcome, "id" | "createdAt">): Promise<Outcome> {
    const id = uuidv4();

    const item: Record<string, unknown> = {
      id,
      decision_id: outcome.decisionId,
      user_id: outcome.userId,
      description: outcome.description,
      observed_at: outcome.observedAt.toISOString(),
      created_at: new Date().toISOString()
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToOutcome(item);
  }

  private mapToOutcome(item: Record<string, unknown>): Outcome {
    return {
      id: getRequiredString(item, 'id'),
      decisionId: getRequiredString(item, 'decision_id'),
      userId: getRequiredString(item, 'user_id'),
      description: getRequiredString(item, 'description'),
      observedAt: getRequiredDate(item, 'observed_at'),
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
