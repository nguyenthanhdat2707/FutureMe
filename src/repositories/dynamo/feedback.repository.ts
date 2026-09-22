import { getRequiredString, getRequiredDate, toItem } from './mapping';

import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IFeedbackRepository } from "../interfaces";
import { Feedback, FeedbackTargetType } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoFeedbackRepository implements IFeedbackRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.FEEDBACK_TABLE || "future-me-feedback";
  }

  async findById(id: string): Promise<Feedback | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToFeedback(toItem(response.Item)) : null;
  }

  async findByTargetId(targetId: string, limit: number = 50): Promise<Feedback[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "targetId-createdAt-index",
      KeyConditionExpression: "target_id = :targetId",
      ExpressionAttributeValues: {
        ":targetId": targetId
      },
      ScanIndexForward: false,
      Limit: limit
    }));
    return (response.Items || []).map(i => this.mapToFeedback(toItem(i)));
  }

  async findByUserId(userId: string, limit: number = 50): Promise<Feedback[]> {
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
    return (response.Items || []).map(i => this.mapToFeedback(toItem(i)));
  }

  async create(feedback: Omit<Feedback, "id" | "createdAt">): Promise<Feedback> {
    const id = uuidv4();

    const item: Record<string, unknown> = {
      id,
      user_id: feedback.userId,
      target_type: feedback.targetType,
      target_id: feedback.targetId,
      feedback_text: feedback.feedbackText ?? undefined,
      created_at: new Date().toISOString()
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToFeedback(item);
  }

  private mapToFeedback(item: Record<string, unknown>): Feedback {
    return {
      id: getRequiredString(item, 'id'),
      userId: getRequiredString(item, 'user_id'),
      targetType: getRequiredString(item, 'target_type') as FeedbackTargetType,
      targetId: getRequiredString(item, 'target_id'),
      feedbackText: getRequiredString(item, 'feedback_text'),
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
