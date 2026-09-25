/* Supertest exposes response bodies as `any`; assertions validate their runtime shape. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import { createApp } from '../app';
import { closeDatabase, initDatabase } from '../database/connection';
import { ObservationSource, DecisionStatus, Decision } from '../domain/types';
import { SqliteFeedbackRepository } from '../repositories/feedback.repository';
import { SqliteObservationRepository } from '../repositories/observation.repository';
import { SqliteOutcomeRepository } from '../repositories/outcome.repository';
import { SqlitePersonalContextRepository } from '../repositories/personal-context.repository';

describe('API route integration', () => {
  const app = createApp();
  const databasePath = path.join(
    tmpdir(),
    `future-me-routes-${process.pid}-${Date.now()}.db`
  );
  let decisionId: string;

  beforeAll(async () => {
    await initDatabase(databasePath);
  });

  afterAll(() => {
    closeDatabase();
    if (existsSync(databasePath)) {
      rmSync(databasePath);
    }
  });

  it('resets, seeds, and reports the persisted demo state', async () => {
    const resetResponse = await request(app).post('/api/demo/reset');

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toMatchObject({
      success: true,
      message: 'Reset stub executed',
      clearedUserId: 'demo-user',
    });

    const seedResponse = await request(app)
      .post('/api/demo/seed')
      .send({ scenario: 'hackathon-deadline' });

    expect(seedResponse.status).toBe(200);
    expect(seedResponse.body).toMatchObject({
      success: true,
      scenario: 'hackathon-deadline',
    });

    const stateResponse = await request(app).get('/api/demo/state');

    expect(stateResponse.status).toBe(200);
    expect(stateResponse.body).toMatchObject({
      user: expect.objectContaining({
        id: 'demo-user',
        email: 'demo@future-me.app',
      }),
      scenario: 'hackathon-deadline',
    });
    expect(stateResponse.body.contextAttributes).toBeGreaterThanOrEqual(2);
  });

  it('syncs calendar events and reports persisted events and status', async () => {
    const syncResponse = await request(app)
      .post('/api/calendar/sync')
      .send({ userId: 'demo-user' });

    expect(syncResponse.status).toBe(200);
    expect(syncResponse.body).toEqual({
      success: true,
      synced: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(syncResponse.body.synced).toBeGreaterThan(0);

    const now = new Date();
    const horizonStart = new Date(now);
    horizonStart.setHours(0, 0, 0, 0);
    const horizonEnd = new Date(horizonStart.getTime() + 7 * 86_400_000);

    const eventsResponse = await request(app)
      .get('/api/calendar/events')
      .query({
        userId: 'demo-user',
        start: horizonStart.toISOString(),
        end: horizonEnd.toISOString(),
      });

    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.body.events).toHaveLength(syncResponse.body.synced);
    expect(eventsResponse.body.events[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        externalId: expect.any(String),
        title: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String),
        syncedAt: expect.any(String),
      })
    );

    const statusResponse = await request(app)
      .get('/api/calendar/status')
      .query({ userId: 'demo-user' });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toEqual({
      lastSync: expect.any(String),
      status: 'synced',
    });
  });

  it('creates a decision and exposes the same persisted record through get, list, and choice', async () => {
    const question = 'Which generic task should I do first?';
    const createResponse = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question,
          options: ['Task A', 'Task B'],
        },
      });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.decision).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        question,
        status: 'PENDING',
        recommendation: expect.any(Object),
      })
    );
    decisionId = createResponse.body.decision.id;

    const getResponse = await request(app).get(`/api/decisions/${decisionId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(
      expect.objectContaining({
        id: decisionId,
        question,
        status: 'PENDING',
        recommendation: expect.any(Object),
        createdAt: expect.any(String),
      })
    );

    const listResponse = await request(app)
      .get('/api/decisions')

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: decisionId, question }),
      ])
    );

    const choiceResponse = await request(app)
      .post(`/api/decisions/${decisionId}/choice`)
      .send({ choice: 'Task A' });

    expect(choiceResponse.status).toBe(200);
    expect(choiceResponse.body).toEqual(
      expect.objectContaining({
        id: decisionId,
        userChoice: 'Task A',
        status: 'CHOSEN',
      })
    );

    const persistedResponse = await request(app).get(`/api/decisions/${decisionId}`);
    expect(persistedResponse.body).toEqual(
      expect.objectContaining({
        id: decisionId,
        userChoice: 'Task A',
        status: 'CHOSEN',
      })
    );
  });

  it('creates and persists a manual observation', async () => {
    const timestamp = new Date().toISOString();
    const response = await request(app)
      .post('/api/observations')
      .send({
        type: 'USER_REPORTED',
        data: { note: 'Generic observation' },
        source: 'USER_CONFIRMED',
        confidence: 0.8,
        timestamp,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'USER_REPORTED',
        data: { note: 'Generic observation' },
        source: 'USER_CONFIRMED',
        confidence: 0.8,
        timestamp,
        createdAt: expect.any(String),
      })
    );

    const persisted = await new SqliteObservationRepository().findById(response.body.id);
    expect(persisted).toEqual(
      expect.objectContaining({
        id: response.body.id,
        data: { note: 'Generic observation' },
      })
    );
  });

  it('creates and persists an outcome and feedback for the decision', async () => {
    const outcomeResponse = await request(app)
      .post('/api/outcomes')
      .send({
        decisionId,
        outcomeStatus: 'positive',
        wouldRepeat: true,
        outcomeNotes: 'The generic task was completed.',
      });

    expect(outcomeResponse.status).toBe(200);
    expect(outcomeResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        decisionId,
        outcomeStatus: 'positive',
        wouldRepeat: true,
        outcomeNotes: 'The generic task was completed.',
        createdAt: expect.any(String),
      })
    );
    expect(await new SqliteOutcomeRepository().findById(outcomeResponse.body.id)).toEqual(
      expect.objectContaining({
        decisionId,
        outcomeStatus: 'positive',
        outcomeNotes: 'The generic task was completed.',
      })
    );

    const feedbackResponse = await request(app)
      .post('/api/outcomes/feedback')
      .send({
        targetType: 'decision',
        targetId: decisionId,
        feedbackText: 'The generic recommendation was useful.',
      });

    expect(feedbackResponse.status).toBe(200);
    expect(feedbackResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        targetType: 'decision',
        targetId: decisionId,
        feedbackText: 'The generic recommendation was useful.',
        createdAt: expect.any(String),
      })
    );
    expect(await new SqliteFeedbackRepository().findById(feedbackResponse.body.id)).toEqual(
      expect.objectContaining({
        targetId: decisionId,
        feedbackText: 'The generic recommendation was useful.',
      })
    );
  });

  it('gets, updates, confirms, and corrects context where implemented', async () => {
    const getResponse = await request(app)
      .get('/api/context')
      .query({ userId: 'demo-user' });

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(
      expect.objectContaining({
        goals: expect.any(Array),
        commitments: expect.any(Array),
        preferences: expect.any(Array),
        calendar: expect.objectContaining({
          upcomingEvents: expect.any(Number),
        }),
        recentDecisions: expect.any(Array),
        lastUpdated: expect.any(String),
      })
    );

    const updateResponse = await request(app)
      .post('/api/context/update')
      .send({
        observation: {
          type: 'USER_REPORTED',
          data: { note: 'Generic context update' },
        },
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        goals: expect.any(Array),
        preferences: expect.any(Array),
      })
    );

    const contextRepo = new SqlitePersonalContextRepository();
    const inferredAttribute = await contextRepo.create({
      userId: 'demo-user',
      attribute: 'preference',
      value: JSON.stringify({ description: 'Original generic preference' }),
      source: ObservationSource.SYSTEM_INFERRED,
      confidence: 0.4,
      observedAt: new Date(),
    });

    const confirmResponse = await request(app)
      .post('/api/context/confirm')
      .send({
        attributeId: inferredAttribute.id,
      });

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body).toEqual({ success: true });
    const allConfirmAttrs = await contextRepo.findByUserId('demo-user', 10);
    const confirmedAttr = allConfirmAttrs.find(a => a.value === inferredAttribute.value && a.source === ObservationSource.USER_CONFIRMED);
    expect(confirmedAttr).toBeDefined();
    expect(confirmedAttr?.confidence).toBe(1);

    const correctedValue = JSON.stringify({
      description: 'Corrected generic preference',
    });
    const correctResponse = await request(app)
      .post('/api/context/correct')
      .send({
        correction: {
          attributeId: inferredAttribute.id,
          correctedValue,
          reason: 'The original value was inaccurate.',
        },
      });

    expect(correctResponse.status).toBe(200);
    expect(correctResponse.body.preferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: 'Corrected generic preference' }),
      ])
    );
    const allCorrectAttrs = await contextRepo.findByUserId('demo-user', 10);
    const correctAttr = allCorrectAttrs.find(a => a.value === correctedValue && a.source === ObservationSource.USER_CONFIRMED);
    expect(correctAttr).toBeDefined();
    expect(correctAttr?.confidence).toBe(1);
  });

  it('returns JSON 404 details for an unknown route', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      path: '/api/unknown-route',
    });
  });

  it('should reject feedback if decision belongs to another user', async () => {
    const decisionRepo = (await import('../services/service-container')).getDecisionRepository();
    const otherDecision = await decisionRepo.create({
      id: 'd-other',
      userId: 'other-user',
      question: 'Other User Decision',
      status: DecisionStatus.PENDING,
      options: [],
      relevantContext: { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] },
      tradeoffs: [],
      recommendation: { option: '', confidence: 0, reasoning: '' },
      reasoning: '',
      confidence: 1
    } as Omit<Decision, "createdAt">);

    const feedbackResponse = await request(app)
      .post('/api/outcomes/feedback')
      .send({
        targetType: 'decision',
        targetId: otherDecision.id,
        feedbackText: 'Great decision!'
      });

    expect(feedbackResponse.status).toBe(403);
    expect(feedbackResponse.body.error).toMatch(/Forbidden/);
  });

});
