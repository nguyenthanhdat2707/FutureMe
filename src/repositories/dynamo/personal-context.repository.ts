import { getRequiredString, getRequiredDate, getOptionalDate, getRequiredNumber, toItem } from './mapping';

import { getDynamoClient } from './client';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { IPersonalContextRepository } from "../interfaces";
import { ContextAttribute, ObservationSource } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class DynamoPersonalContextRepository implements IPersonalContextRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      this.docClient = getDynamoClient();
    }
    this.tableName = process.env.CONTEXT_TABLE || "future-me-personal-context";
  }

  async findById(id: string): Promise<ContextAttribute | null> {
    const response = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));
    return response.Item ? this.mapToContext(toItem(response.Item)) : null;
  }

  async findByUserId(userId: string): Promise<ContextAttribute[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-observedAt-index",
      KeyConditionExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ScanIndexForward: false
    }));
    return (response.Items || []).map(i => this.mapToContext(toItem(i)));
  }

  async findByUserIdAndAttribute(userId: string, attribute: string): Promise<ContextAttribute[]> {
    const response = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "userId-attribute-index",
      KeyConditionExpression: "user_id = :userId AND attribute = :attribute",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":attribute": attribute
      },
      ScanIndexForward: false
    }));
    return (response.Items || []).map(i => this.mapToContext(toItem(i)));
  }

  async create(attr: Omit<ContextAttribute, "id" | "createdAt">): Promise<ContextAttribute> {
    const id = uuidv4();
    const item: Record<string, unknown> = {
      id,
      user_id: attr.userId,
      attribute: attr.attribute,
      value: typeof attr.value === 'string' ? attr.value : JSON.stringify(attr.value),
      confidence: attr.confidence,
      source: attr.source,
      observed_at: attr.observedAt.toISOString(),
      created_at: new Date().toISOString(),
      valid_until: attr.validUntil ? attr.validUntil.toISOString() : undefined
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return this.mapToContext(item);
  }

  async update(id: string, updates: Partial<Omit<ContextAttribute, "id" | "userId" | "createdAt">>): Promise<ContextAttribute | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    const fieldMap: Record<string, string> = {
      attribute: 'attribute',
      value: 'value',
      confidence: 'confidence',
      source: 'source',
      observedAt: 'observed_at',
      validUntil: 'valid_until'
    };

    let prefix = "a";
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const attrName = fieldMap[key] ?? key;
        const attrKey = `#${prefix}`;
        const valKey = `:${prefix}`;
        const serialized = (key === 'observedAt' || key === 'validUntil') && value instanceof Date
          ? value.toISOString()
          : (key === 'value' && typeof value !== 'string' ? JSON.stringify(value) : value);
        updateExpressions.push(`${attrKey} = ${valKey}`);
        expressionAttributeNames[attrKey] = attrName;
        expressionAttributeValues[valKey] = serialized;
        prefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
      }
    }

    if (updateExpressions.length === 0) {
      return this.findById(id);
    }

    try {
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      }));
      return response.Attributes ? this.mapToContext(toItem(response.Attributes)) : null;
    } catch (e: unknown) {
      const error = e as Error;
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  private mapToContext(item: Record<string, unknown>): ContextAttribute {
    return {
      id: getRequiredString(item, 'id'),
      userId: getRequiredString(item, 'user_id'),
      attribute: getRequiredString(item, 'attribute'),
      value: getRequiredString(item, 'value'),
      source: getRequiredString(item, 'source') as ObservationSource,
      confidence: getRequiredNumber(item, 'confidence'),
      observedAt: getRequiredDate(item, 'observed_at'),
      validUntil: getOptionalDate(item, 'valid_until'),
      createdAt: getRequiredDate(item, 'created_at')
    };
  }
}
