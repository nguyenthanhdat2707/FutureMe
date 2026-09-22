import { getRequiredString, getOptionalString, getRequiredDate, toItem } from './mapping';

import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IUserRepository } from "../interfaces";
import { User } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoUserRepository implements IUserRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.USERS_TABLE || "future-me-users";
  }

  async findById(id: string): Promise<User | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToUser(toItem(response.Item)) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    }));
    return response.Items && response.Items.length > 0 ? this.mapToUser(toItem(response.Items[0])) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "googleId-index",
      KeyConditionExpression: "google_id = :googleId",
      ExpressionAttributeValues: {
        ":googleId": googleId
      }
    }));
    return response.Items && response.Items.length > 0 ? this.mapToUser(toItem(response.Items[0])) : null;
  }

  async create(user: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    const id = user.id || uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      email: user.email,
      google_id: user.googleId ?? undefined,
      display_name: user.displayName ?? undefined,
      tokens: user.tokens ?? undefined,
      created_at: now,
      updated_at: now
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToUser(item);
  }

  async update(id: string, updates: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    let prefix = "a";
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const attrName = key === 'googleId' ? 'google_id' : key === 'displayName' ? 'display_name' : key;
        const attrKey = `#${prefix}`;
        const valKey = `:${prefix}`;
        updateExpressions.push(`${attrKey} = ${valKey}`);
        expressionAttributeNames[attrKey] = attrName;
        expressionAttributeValues[valKey] = value;
        prefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
      }
    }

    if (updateExpressions.length === 0) {
      return this.findById(id);
    }

    const valKey = `:${prefix}`;
    const attrKey = `#${prefix}`;
    updateExpressions.push(`${attrKey} = ${valKey}`);
    expressionAttributeNames[attrKey] = "updated_at";
    expressionAttributeValues[valKey] = new Date().toISOString();

    try {
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      }));
      return response.Attributes ? this.mapToUser(toItem(response.Attributes)) : null;
    } catch (e: unknown) {
      const error = e as Error;
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  private mapToUser(item: Record<string, unknown>): User {
    return {
      id: getRequiredString(item, 'id'),
      email: getRequiredString(item, 'email'),
      googleId: getOptionalString(item, 'google_id'),
      displayName: getOptionalString(item, 'display_name'),
      tokens: getOptionalString(item, 'tokens'),
      createdAt: getRequiredDate(item, 'created_at'),
      updatedAt: getRequiredDate(item, 'updated_at')
    };
  }
}
