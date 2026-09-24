/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call */
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import { createApp } from '../app';
import { closeDatabase, initDatabase } from '../database/connection';
import {
  DecisionStatus,
  InterventionLevel,
  ObservationType,
  PersonalState
} from '../domain/types';
import {
  getDecisionRepository,
  getObservationRepository,
  getInterventionRepository,
} from '../services/service-container';
import { SimpleInterventionPolicy } from '../intelligence/simple-intervention-policy';
import { SqliteInterventionRepository } from '../repositories/intervention.repository';
import { DynamoInterventionRepository } from '../repositories/dynamo/intervention.repository';

describe('Phase 5 Proactive Interventions & Maintenance', () => {
  const app = createApp();
  const databasePath = path.join(
    tmpdir(),
    `future-me-interventions-${process.pid}-${Date.now()}.db`
  );

  beforeAll(async () => {
    await initDatabase(databasePath);
  });

  afterAll(() => {
    closeDatabase();
    if (existsSync(databasePath)) {
      rmSync(databasePath);
    }
  });

  describe('SqliteInterventionRepository', () => {
    it('creates, finds, updates, and dismisses interventions', async () => {
      const repo = new SqliteInterventionRepository();
      const testUser = 'user-repo-test';

      const created = await repo.create({
        id: 'int-test-1',
        userId: testUser,
        decisionId: 'dec-1',
        issueKey: 'issue-1',
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'Test reason',
        prompt: 'Test prompt',
        suggestedActions: ['Action 1', 'Action 2'],
        severity: 'medium'
      });

      expect(created.id).toBe('int-test-1');
      expect(created.status).toBe('ACTIVE');
      expect(created.suggestedActions).toEqual(['Action 1', 'Action 2']);

      const found = await repo.findById('int-test-1');
      expect(found).not.toBeNull();
      expect(found?.issueKey).toBe('issue-1');

      const byUser = await repo.findByUserId(testUser);
      expect(byUser.length).toBeGreaterThanOrEqual(1);

      const activeList = await repo.findActiveByUserId(testUser);
      expect(activeList.length).toBe(1);

      const byKey = await repo.findByIssueKey(testUser, 'issue-1');
      expect(byKey?.id).toBe('int-test-1');

      // Update status
      const updated = await repo.updateStatus('int-test-1', 'RESPONDED');
      expect(updated?.status).toBe('RESPONDED');

      // Dismiss
      const dismissed = await repo.dismiss('int-test-1');
      expect(dismissed?.status).toBe('DISMISSED');
      expect(dismissed?.dismissedAt).toBeDefined();

      const activeAfterDismiss = await repo.findActiveByUserId(testUser);
      expect(activeAfterDismiss.length).toBe(0);
    });

    it('returns null when updating or dismissing non-existent intervention', async () => {
      const repo = new SqliteInterventionRepository();
      const updateResult = await repo.updateStatus('non-existent', 'RESPONDED');
      expect(updateResult).toBeNull();

      const dismissResult = await repo.dismiss('non-existent');
      expect(dismissResult).toBeNull();
    });
  });

  describe('DynamoInterventionRepository', () => {
    it('implements CRUD and error handling with mock Dynamo client', async () => {
      const mockDocClient = {
        send: jest.fn().mockImplementation((command: any) => {
          if (command.constructor.name === 'GetCommand' || command.TableName?.includes('interventions')) {
            return Promise.resolve({
              Item: {
                id: 'dynamo-int-1',
                user_id: 'user-dynamo',
                issue_key: 'issue-dyn-1',
                type: 'CONTEXT_CHECK',
                level: 'PROACTIVE',
                status: 'ACTIVE',
                reason: 'Dynamo test reason',
                prompt: 'Dynamo prompt',
                suggested_actions: ['Yes', 'No'],
                created_at: new Date().toISOString()
              }
            });
          }
          return Promise.resolve({ Items: [] });
        })
      };

      const dynamoRepo = new DynamoInterventionRepository(mockDocClient as any);
      const item = await dynamoRepo.findById('dynamo-int-1');
      expect(item).not.toBeNull();
      expect(item?.userId).toBe('user-dynamo');
      expect(item?.type).toBe('CONTEXT_CHECK');

      // Test create
      mockDocClient.send.mockResolvedValueOnce({});
      const created = await dynamoRepo.create({
        id: 'dynamo-int-2',
        userId: 'user-dynamo',
        issueKey: 'issue-dyn-2',
        type: 'CONSEQUENTIAL_DISRUPTION',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'Dynamo disruption',
        suggestedActions: ['Review']
      });
      expect(created.id).toBe('dynamo-int-2');

      // Test updateStatus and dismiss
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'dynamo-int-2',
          user_id: 'user-dynamo',
          issue_key: 'issue-dyn-2',
          type: 'CONSEQUENTIAL_DISRUPTION',
          level: 'PROACTIVE',
          status: 'DISMISSED',
          reason: 'Dynamo disruption',
          dismissed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      });
      const dismissed = await dynamoRepo.dismiss('dynamo-int-2');
      expect(dismissed?.status).toBe('DISMISSED');

      // Test ConditionalCheckFailedException handling
      mockDocClient.send.mockRejectedValueOnce({ name: 'ConditionalCheckFailedException' });
      const conditionalNull = await dynamoRepo.updateStatus('dynamo-missing', 'RESPONDED');
      expect(conditionalNull).toBeNull();
    });
  });

  describe('SimpleInterventionPolicy Unit Rules', () => {
    const policy = new SimpleInterventionPolicy();

    it('returns explicit NO_OP when user has no active decisions', async () => {
      const state = {
        state: PersonalState.FLOW,
        confidence: 0.9,
        evidence: [],
        timestamp: new Date()
      };
      const context = {
        userId: 'user-no-decisions',
        goals: [],
        commitments: [],
        preferences: [],
        calendar: { upcomingEvents: 0, busyHoursToday: 0, busyHoursThisWeek: 0 },
        recentDecisions: [],
        lastUpdated: new Date()
      };

      const result = await policy.shouldIntervene(state, context, {
        userId: 'user-no-decisions',
        activeDecisions: []
      });

      expect(result.shouldIntervene).toBe(false);
      expect(result.interventionType).toBe('NONE');
      expect(result.level).toBe(InterventionLevel.NONE);
      expect(result.reason).toMatch(/No active decisions/i);
    });

    it('enforces maximum 1 active intervention burden control', async () => {
      const userId = 'user-burden-test';
      const intRepo = getInterventionRepository();
      const decRepo = getDecisionRepository();

      // Create an active decision
      await decRepo.create({
        id: 'dec-burden-1',
        userId,
        question: 'Pending Decision',
        options: [],
        relevantContext: { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] },
        tradeoffs: [],
        recommendation: { option: 'A', confidence: 0.8, reasoning: 'ok' },
        reasoning: 'ok',
        confidence: 0.8,
        status: DecisionStatus.PENDING
      });

      // Create pre-existing active intervention
      await intRepo.create({
        id: 'int-existing-active',
        userId,
        issueKey: 'existing-active-key',
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'Existing active intervention',
        prompt: 'Existing prompt',
        suggestedActions: ['Dismiss']
      });

      const state = {
        state: PersonalState.FLOW,
        confidence: 0.9,
        evidence: [],
        timestamp: new Date()
      };
      const context = {
        userId,
        goals: [],
        commitments: [],
        preferences: [],
        calendar: { upcomingEvents: 0, busyHoursToday: 0, busyHoursThisWeek: 0 },
        recentDecisions: [],
        lastUpdated: new Date()
      };

      const result = await policy.shouldIntervene(state, context, { userId });

      expect(result.shouldIntervene).toBe(true);
      expect(result.interventionId).toBe('int-existing-active');
      expect(result.prompt).toBe('Existing prompt');
    });
  });

  describe('Intervention API Routes Integration', () => {
    it('evaluates GET /api/interventions/check and returns NO_OP when clean', async () => {
      const response = await request(app)
        .get('/api/interventions/check')
        .set('X-Demo-User', 'focused-builder');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('interventions');
      expect(response.body).toHaveProperty('hasInterventions');
    });

    it('validates POST /api/interventions/respond input', async () => {
      const emptyRes = await request(app)
        .post('/api/interventions/respond')
        .send({});
      expect(emptyRes.status).toBe(400);

      const missingResp = await request(app)
        .post('/api/interventions/respond')
        .send({ interventionId: 'some-id' });
      expect(missingResp.status).toBe(400);

      const notFoundRes = await request(app)
        .post('/api/interventions/respond')
        .send({ interventionId: 'non-existent-id', response: 'dismiss' });
      expect(notFoundRes.status).toBe(404);
    });

    it('rejects response if intervention belongs to another user (403)', async () => {
      const intRepo = getInterventionRepository();
      const created = await intRepo.create({
        id: 'int-other-user',
        userId: 'other-user-999',
        issueKey: 'other-key',
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'other reason'
      });

      const response = await request(app)
        .post('/api/interventions/respond')
        .set('X-Demo-User', 'focused-builder')
        .send({ interventionId: created.id, response: 'dismiss' });

      expect(response.status).toBe(403);
    });

    it('handles affirmative response to CONTEXT_CHECK and records TASK_COMPLETED', async () => {
      const intRepo = getInterventionRepository();
      const obsRepo = getObservationRepository();
      const userId = 'focused-builder';

      const created = await intRepo.create({
        id: 'int-affirm-test',
        userId,
        issueKey: 'stale:event:test-affirm',
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'Stale event',
        prompt: 'Did you finish?'
      });

      const response = await request(app)
        .post('/api/interventions/respond')
        .set('X-Demo-User', userId)
        .send({ interventionId: created.id, response: 'yes' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('RESPONDED');

      // Verify observation created
      const observations = await obsRepo.findByUserId(userId, 5);
      const taskCompletedObs = observations.find(o => o.type === ObservationType.TASK_COMPLETED);
      expect(taskCompletedObs).toBeDefined();
      expect((taskCompletedObs?.data as any).confirmed).toBe(true);
    });

    it('handles negative response to CONTEXT_CHECK and records CONTEXT_CHANGE', async () => {
      const intRepo = getInterventionRepository();
      const obsRepo = getObservationRepository();
      const userId = 'focused-builder';

      const created = await intRepo.create({
        id: 'int-negative-test',
        userId,
        issueKey: 'stale:event:test-negative',
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'Stale event',
        prompt: 'Did you finish?'
      });

      const response = await request(app)
        .post('/api/interventions/respond')
        .set('X-Demo-User', userId)
        .send({ interventionId: created.id, response: 'no' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('RESPONDED');

      const observations = await obsRepo.findByUserId(userId, 5);
      const stillWorkingObs = observations.find(o => o.type === ObservationType.CONTEXT_CHANGE);
      expect(stillWorkingObs).toBeDefined();
      expect((stillWorkingObs?.data as any).stillWorking).toBe(true);
    });

    it('handles dismiss response and applies dismissal', async () => {
      const intRepo = getInterventionRepository();
      const userId = 'focused-builder';

      const created = await intRepo.create({
        id: 'int-dismiss-test',
        userId,
        issueKey: 'stale:event:test-dismiss',
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'ACTIVE',
        reason: 'Stale event'
      });

      const response = await request(app)
        .post('/api/interventions/respond')
        .set('X-Demo-User', userId)
        .send({ interventionId: created.id, response: 'dismiss' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DISMISSED');

      const updated = await intRepo.findById(created.id);
      expect(updated?.status).toBe('DISMISSED');
      expect(updated?.dismissedAt).toBeDefined();
    });

    it('lists active interventions via GET /api/interventions/active', async () => {
      const response = await request(app)
        .get('/api/interventions/active')
        .set('X-Demo-User', 'focused-builder');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.interventions)).toBe(true);
    });
  });

  describe('5 Demo Scenarios End-to-End Verification', () => {
    const demoUser = 'demo-tester';

    it('Scenario 1: Stale Context Check triggers CONTEXT_CHECK', async () => {
      // 1. Seed stale-context scenario
      const seedRes = await request(app)
        .post('/api/demo/seed')
        .set('X-Demo-User', demoUser)
        .send({ scenario: 'stale-context' });
      expect(seedRes.status).toBe(200);

      // 2. Check interventions
      const checkRes = await request(app)
        .get('/api/interventions/check')
        .set('X-Demo-User', demoUser);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.hasInterventions).toBe(true);
      expect(checkRes.body.interventions.length).toBe(1);
      const intervention = checkRes.body.interventions[0];
      expect(intervention.interventionType).toBe('CONTEXT_CHECK');
      expect(intervention.prompt).toMatch(/Team Roadmap Alignment/);
      expect(intervention.suggestedActions).toContain('Yes, completed');
    });

    it('Scenario 2: Calendar Conflict Disruption triggers CONSEQUENTIAL_DISRUPTION', async () => {
      const conflictUser = 'conflict-user';

      // 1. Seed calendar-conflict scenario
      const seedRes = await request(app)
        .post('/api/demo/seed')
        .set('X-Demo-User', conflictUser)
        .send({ scenario: 'calendar-conflict' });
      expect(seedRes.status).toBe(200);

      // 2. Check interventions
      const checkRes = await request(app)
        .get('/api/interventions/check')
        .set('X-Demo-User', conflictUser);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.hasInterventions).toBe(true);
      const intervention = checkRes.body.interventions[0];
      expect(intervention.interventionType).toBe('CONSEQUENTIAL_DISRUPTION');
      expect(intervention.suggestedActions).toContain('Review Decision');
    });

    it('Scenario 3: Workload Disruption triggers CONSEQUENTIAL_DISRUPTION', async () => {
      const workloadUser = 'workload-user';

      // 1. Seed workload-disruption scenario
      const seedRes = await request(app)
        .post('/api/demo/seed')
        .set('X-Demo-User', workloadUser)
        .send({ scenario: 'workload-disruption' });
      expect(seedRes.status).toBe(200);

      // 2. Check interventions
      const checkRes = await request(app)
        .get('/api/interventions/check')
        .set('X-Demo-User', workloadUser);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.hasInterventions).toBe(true);
      const intervention = checkRes.body.interventions[0];
      expect(intervention.interventionType).toBe('CONSEQUENTIAL_DISRUPTION');
    });

    it('Scenario 4: 4-Hour Dismiss Cooldown suppresses repeat interventions', async () => {
      const cooldownUser = 'cooldown-user';

      // 1. Seed dismiss-cooldown scenario
      const seedRes = await request(app)
        .post('/api/demo/seed')
        .set('X-Demo-User', cooldownUser)
        .send({ scenario: 'dismiss-cooldown' });
      expect(seedRes.status).toBe(200);

      // 2. Check interventions - should return NO_OP because dismissed 20 minutes ago
      const checkRes = await request(app)
        .get('/api/interventions/check')
        .set('X-Demo-User', cooldownUser);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.hasInterventions).toBe(false);
      expect(checkRes.body.interventions.length).toBe(0);
    });

    it('Scenario 5: Explicit NO_OP / Silence Proof returns hasInterventions: false', async () => {
      const silenceUser = 'silence-user';

      // 1. Seed noop-silence scenario (no active decisions)
      const seedRes = await request(app)
        .post('/api/demo/seed')
        .set('X-Demo-User', silenceUser)
        .send({ scenario: 'noop-silence' });
      expect(seedRes.status).toBe(200);

      // 2. Check interventions
      const checkRes = await request(app)
        .get('/api/interventions/check')
        .set('X-Demo-User', silenceUser);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.hasInterventions).toBe(false);
      expect(checkRes.body.interventions).toEqual([]);
    });
  });
});
