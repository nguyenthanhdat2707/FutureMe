/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { DecisionStatus, ObservationType, ObservationSource } from "../domain/types";
import { DynamoCalendarEventRepository } from '../repositories/dynamo/calendar-event.repository';
import { DynamoDecisionRepository } from '../repositories/dynamo/decision.repository';
import { DynamoFeedbackRepository } from '../repositories/dynamo/feedback.repository';
import { DynamoObservationRepository } from '../repositories/dynamo/observation.repository';
import { DynamoOutcomeRepository } from '../repositories/dynamo/outcome.repository';
import { DynamoPersonalContextRepository } from '../repositories/dynamo/personal-context.repository';
import { DynamoUserRepository } from '../repositories/dynamo/user.repository';

const mockSend = jest.fn();
jest.mock('../repositories/dynamo/client', () => ({
  getDynamoClient: () => ({
    send: mockSend
  })
}));

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";



describe('DynamoDB Repositories', () => {
  beforeEach(() => {
    mockSend.mockClear();
    process.env.USERS_TABLE = 'test-users';
    process.env.CONTEXT_TABLE = 'test-context';
    process.env.DECISIONS_TABLE = 'test-decisions';
    process.env.OBS_TABLE = 'test-obs';
    process.env.CALENDAR_TABLE = 'test-calendar';
    process.env.OUTCOMES_TABLE = 'test-outcomes';
    process.env.FEEDBACK_TABLE = 'test-feedback';
  });

  describe('DynamoUserRepository', () => {
    it('creates and finds user', async () => {
      const repo = new DynamoUserRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      const created = await repo.create({ email: 'test@test.com', id: 'u1' });
      
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
      const putCall = mockSend.mock.calls[0][0].input;
      expect(putCall.TableName).toBe('test-users');
      expect(putCall.Item.email).toBe('test@test.com');
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({
        Item: { id: created.id, email: 'test@test.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      });
      const found = await repo.findById(created.id);
      expect(mockSend).toHaveBeenCalledWith(expect.any(GetCommand));
      const getCall = mockSend.mock.calls[0][0].input;
      expect(getCall.TableName).toBe('test-users');
      expect(found?.email).toBe('test@test.com');
      
      // Test GSI
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [{ id: 'u1', email: 'test@test.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] });
      await repo.findByEmail('test@test.com');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const queryCall = mockSend.mock.calls[0][0].input;
      expect(queryCall.TableName).toBe('test-users');
      expect(queryCall.IndexName).toBe('email-index');
      expect(queryCall.KeyConditionExpression).toContain('email = :email');
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByGoogleId('g1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const qg = mockSend.mock.calls[0][0].input;
      expect(qg.TableName).toBe('test-users');
      
      expect(qg.KeyConditionExpression).toContain('google_id = :googleId');
    });
  });

  describe('DynamoDecisionRepository', () => {
    it('creates, updates choice and finds by user', async () => {
      const repo = new DynamoDecisionRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      await repo.create({
        id: 'd1', userId: 'u1', question: 't', status: DecisionStatus.PENDING, options: [], relevantContext: { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] }, tradeoffs: [], recommendation: { option: '', confidence: 0, reasoning: '' }, reasoning: '', confidence: 0
      });
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
      const putCall = mockSend.mock.calls[0][0].input;
      expect(putCall.TableName).toBe('test-decisions');
      expect(putCall.Item.user_id).toBe('u1');
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Attributes: { id: 'd1', user_id: 'u1', question: 't', status: 'MADE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }});
      await repo.updateChoice('d1', 'o1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
      const upd = mockSend.mock.calls[0][0].input;
      expect(upd.TableName).toBe('test-decisions');
      expect(upd.UpdateExpression).toContain('user_choice');
      expect(upd.UpdateExpression).toContain('#st');
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByUserId('u1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const q = mockSend.mock.calls[0][0].input;
      expect(q.TableName).toBe('test-decisions');
      
      expect(q.KeyConditionExpression).toContain('user_id = :userId');
    });
  });

  describe('DynamoCalendarEventRepository', () => {
    it('upserts a new event with a valid created_at', async () => {
      const repo = new DynamoCalendarEventRepository();
      const startTime = new Date('2026-09-23T01:00:00.000Z');
      const endTime = new Date('2026-09-23T02:00:00.000Z');
      const syncedAt = new Date('2026-09-23T00:30:00.000Z');
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({});

      const event = await repo.upsert({
        userId: 'u1',
        externalId: 'ext-new',
        title: 'New event',
        startTime,
        endTime,
        syncedAt
      });

      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(QueryCommand));
      expect(mockSend.mock.calls[0][0].input).toEqual({
        TableName: 'test-calendar',
        IndexName: 'userId-externalId-index',
        KeyConditionExpression: 'user_id = :userId AND external_id = :externalId',
        ExpressionAttributeValues: {
          ':userId': 'u1',
          ':externalId': 'ext-new'
        }
      });

      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(PutCommand));
      const putInput = mockSend.mock.calls[1][0].input;
      expect(putInput).toEqual({
        TableName: 'test-calendar',
        Item: {
          id: event.id,
          user_id: 'u1',
          external_id: 'ext-new',
          title: 'New event',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: undefined,
          raw_data: undefined,
          synced_at: syncedAt.toISOString(),
          created_at: event.createdAt.toISOString()
        }
      });
      expect(Number.isNaN(event.createdAt.getTime())).toBe(false);
      expect(event.createdAt.toISOString()).toBe(putInput.Item.created_at);
    });

    it('uses synced_at as createdAt for a legacy event without created_at', async () => {
      const repo = new DynamoCalendarEventRepository();
      const syncedAt = new Date('2026-09-20T04:30:00.000Z');
      mockSend.mockResolvedValueOnce({
        Items: [{
          id: 'legacy-event',
          user_id: 'u1',
          external_id: 'ext-legacy',
          title: 'Legacy event',
          start_time: '2026-09-20T05:00:00.000Z',
          end_time: '2026-09-20T06:00:00.000Z',
          synced_at: syncedAt.toISOString()
        }]
      });

      const event = await repo.findByExternalId('u1', 'ext-legacy');

      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(mockSend.mock.calls[0][0].input).toEqual({
        TableName: 'test-calendar',
        IndexName: 'userId-externalId-index',
        KeyConditionExpression: 'user_id = :userId AND external_id = :externalId',
        ExpressionAttributeValues: {
          ':userId': 'u1',
          ':externalId': 'ext-legacy'
        }
      });
      expect(event?.createdAt.toISOString()).toBe(syncedAt.toISOString());
      expect(event?.syncedAt.toISOString()).toBe(syncedAt.toISOString());
    });

    it('preserves created_at when upserting an existing event', async () => {
      const repo = new DynamoCalendarEventRepository();
      const createdAt = new Date('2026-08-01T02:00:00.000Z');
      const startTime = new Date('2026-09-24T01:00:00.000Z');
      const endTime = new Date('2026-09-24T02:00:00.000Z');
      const syncedAt = new Date('2026-09-23T23:30:00.000Z');
      mockSend
        .mockResolvedValueOnce({
          Items: [{
            id: 'existing-event',
            user_id: 'u1',
            external_id: 'ext-existing',
            title: 'Original title',
            start_time: '2026-09-22T01:00:00.000Z',
            end_time: '2026-09-22T02:00:00.000Z',
            synced_at: '2026-09-22T00:30:00.000Z',
            created_at: createdAt.toISOString()
          }]
        })
        .mockResolvedValueOnce({});

      const event = await repo.upsert({
        userId: 'u1',
        externalId: 'ext-existing',
        title: 'Updated title',
        startTime,
        endTime,
        syncedAt
      });

      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(QueryCommand));
      expect(mockSend.mock.calls[0][0].input).toEqual({
        TableName: 'test-calendar',
        IndexName: 'userId-externalId-index',
        KeyConditionExpression: 'user_id = :userId AND external_id = :externalId',
        ExpressionAttributeValues: {
          ':userId': 'u1',
          ':externalId': 'ext-existing'
        }
      });

      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(PutCommand));
      expect(mockSend.mock.calls[1][0].input).toEqual({
        TableName: 'test-calendar',
        Item: {
          id: 'existing-event',
          user_id: 'u1',
          external_id: 'ext-existing',
          title: 'Updated title',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: undefined,
          raw_data: undefined,
          synced_at: syncedAt.toISOString(),
          created_at: createdAt.toISOString()
        }
      });
      expect(event.createdAt.toISOString()).toBe(createdAt.toISOString());
    });

    it('creates and finds by time range', async () => {
      const repo = new DynamoCalendarEventRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      await repo.create({ userId: 'u1', externalId: 'ext', startTime: new Date(), endTime: new Date(), syncedAt: new Date(), title: 'test' });
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findUpcoming('u1', new Date(0));
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const q = mockSend.mock.calls[0][0].input;
      expect(q.TableName).toBe('test-calendar');
      
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByExternalId('u1', 'ext');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const qe = mockSend.mock.calls[0][0].input;
      expect(qe.TableName).toBe('test-calendar');
      
    });
  });

  describe('DynamoObservationRepository', () => {
    it('creates and finds by user', async () => {
      const repo = new DynamoObservationRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      await repo.create({ userId: 'u1', type: ObservationType.USER_REPORTED, data: {}, source: ObservationSource.USER_CONFIRMED, confidence: 1, timestamp: new Date() });
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByUserId('u1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const q = mockSend.mock.calls[0][0].input;
      expect(q.TableName).toBe('test-obs');
      
    });
  });

  describe('DynamoPersonalContextRepository', () => {
    it('creates, updates and finds by user', async () => {
      const repo = new DynamoPersonalContextRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      await repo.create({ userId: 'u1', attribute: 'a', value: 'v', source: ObservationSource.USER_CONFIRMED, confidence: 1, observedAt: new Date() });
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByUserId('u1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const q = mockSend.mock.calls[0][0].input;
      expect(q.TableName).toBe('test-context');
      
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByUserIdAndAttribute('u1', 'a');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const qa = mockSend.mock.calls[0][0].input;
      expect(qa.TableName).toBe('test-context');
      
    });
  });

  describe('DynamoOutcomeRepository', () => {
    it('creates and finds by decision id', async () => {
      const repo = new DynamoOutcomeRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      await repo.create({ decisionId: 'd1', userId: 'u1', description: 'desc', observedAt: new Date() });
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByDecisionId('d1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const q = mockSend.mock.calls[0][0].input;
      expect(q.TableName).toBe('test-outcomes');
      
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByUserId('u1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const qu = mockSend.mock.calls[0][0].input;
      expect(qu.TableName).toBe('test-outcomes');
    });
  });

  describe('DynamoFeedbackRepository', () => {
    it('creates and finds by target', async () => {
      const repo = new DynamoFeedbackRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: DecisionStatus.PENDING, title: 't', external_id: 'ext', start_time: new Date().toISOString(), end_time: new Date().toISOString(), type: 'T', source: 'S', target_type: 'T', target_id: 'T' } });
      await repo.create({ userId: 'u1', targetType: 'decision', targetId: 'd1', feedbackText: 't' });
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByTargetId('d1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const q = mockSend.mock.calls[0][0].input;
      expect(q.TableName).toBe('test-feedback');
      
      
      mockSend.mockClear();
      mockSend.mockResolvedValueOnce({ Items: [] });
      await repo.findByUserId('u1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      const qu = mockSend.mock.calls[0][0].input;
      expect(qu.TableName).toBe('test-feedback');
    });
  });

  describe('Edge cases and optional fields', () => {
    it('handles malformed required fields mapping', async () => {
      const repo = new DynamoDecisionRepository();
      mockSend.mockResolvedValueOnce({ Item: { id: 'd1', user_id: 'u1' } }); // missing required fields like created_at
      await expect(repo.findById('d1')).rejects.toThrow();
    });
  });
});
