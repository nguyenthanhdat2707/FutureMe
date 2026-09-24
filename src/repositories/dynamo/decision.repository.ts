import { getRequiredString, getOptionalString, getRequiredDate, getOptionalNumber, getOptionalObject, toItem } from './mapping';

import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IDecisionRepository } from "../interfaces";
import { Decision, DecisionStatus, ContextSnapshot, Recommendation, DecisionOption, Tradeoff } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoDecisionRepository implements IDecisionRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.DECISIONS_TABLE || "future-me-decisions";
  }

  async findById(id: string): Promise<Decision | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToDecision(toItem(response.Item)) : null;
  }

  async findByUserId(userId: string, limit: number = 50): Promise<Decision[]> {
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
    return (response.Items || []).map(i => this.mapToDecision(toItem(i)));
  }

  async create(decision: Omit<Decision, "createdAt">): Promise<Decision> {
    const id = decision.id || uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      user_id: decision.userId,
      question: decision.question,
      context_snapshot: JSON.stringify(decision.relevantContext),
      recommendation: JSON.stringify(decision.recommendation),
      user_choice: decision.userChoice ? JSON.stringify(decision.userChoice) : null,
      status: decision.status,
      created_at: now
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToDecision(item);
  }

  async updateChoice(id: string, userChoice: string): Promise<Decision | null> {
    try {
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: "SET user_choice = :uc, #st = :st",
        ExpressionAttributeNames: {
          "#st": "status"
        },
        ExpressionAttributeValues: {
          ":uc": JSON.stringify(userChoice),
          ":st": DecisionStatus.CHOSEN
        },
        ReturnValues: "ALL_NEW"
      }));
      return response.Attributes ? this.mapToDecision(toItem(response.Attributes)) : null;
    } catch (e: unknown) {
      const error = e as Error;
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: DecisionStatus): Promise<Decision | null> {
    try {
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: "SET #st = :st",
        ExpressionAttributeNames: {
          "#st": "status"
        },
        ExpressionAttributeValues: {
          ":st": status
        },
        ReturnValues: "ALL_NEW"
      }));
      return response.Attributes ? this.mapToDecision(toItem(response.Attributes)) : null;
    } catch (e: unknown) {
      const error = e as Error;
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  private mapToDecision(item: Record<string, unknown>): Decision {

    return {
      id: getRequiredString(item, 'id'),
      userId: getRequiredString(item, 'user_id'),
      question: getRequiredString(item, 'question'),
      options: getOptionalObject<DecisionOption[]>(item, 'options') || [],
      relevantContext: getOptionalObject<ContextSnapshot>(item, 'context_snapshot') || { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] },
      tradeoffs: getOptionalObject<Tradeoff[]>(item, 'tradeoffs') || [],
      recommendation: getOptionalObject<Recommendation>(item, 'recommendation') || { option: '', confidence: 0, reasoning: '' },
      reasoning: getOptionalString(item, 'reasoning') || '',
      confidence: getOptionalNumber(item, 'confidence') || 0,
      userChoice: getOptionalString(item, 'user_choice'),
      status: (getRequiredString(item, 'status') as DecisionStatus) || 'pending',
      createdAt: getRequiredDate(item, 'created_at'),
      query: (getOptionalObject<ContextSnapshot>(item, 'context_snapshot') || { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] }).query
    };
  }
}

