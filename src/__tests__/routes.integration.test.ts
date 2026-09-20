/* Supertest exposes response bodies as `any`; assertions validate their runtime shape. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import { createApp } from '../app';
import { closeDatabase, initDatabase } from '../database/connection';
import { ObservationSource } from '../domain/types';
import { FeedbackRepository } from '../repositories/feedback.repository';
import { ObservationRepository } from '../repositories/observation.repository';
import { OutcomeRepository } from '../repositories/outcome.repository';
import { PersonalContextRepository } from '../repositories/personal-context.repository';

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
      message: 'Demo state reset',
      userId: 'demo-user',
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

    const eventsResponse = await request(app)
      .get('/api/calendar/events')
      .query({ userId: 'demo-user' });

    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.body.events).toHaveLength(syncResponse.body.synced);
    expect(eventsResponse.body.events[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: 'demo-user',
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
        userId: 'demo-user',
        query: {
          question,
          options: ['Task A', 'Task B'],
        },
      });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.decision).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: 'demo-user',
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
        userId: 'demo-user',
        question,
        status: 'PENDING',
        recommendation: expect.any(Object),
        createdAt: expect.any(String),
      })
    );

    const listResponse = await request(app)
      .get('/api/decisions')
      .query({ userId: 'demo-user', limit: 5 });

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
        userId: 'demo-user',
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
        userId: 'demo-user',
        type: 'USER_REPORTED',
        data: { note: 'Generic observation' },
        source: 'USER_CONFIRMED',
        confidence: 0.8,
        timestamp,
        createdAt: expect.any(String),
      })
    );

    const persisted = new ObservationRepository().findById(response.body.id);
    expect(persisted).toEqual(
      expect.objectContaining({
        id: response.body.id,
        userId: 'demo-user',
        data: { note: 'Generic observation' },
      })
    );
  });

  it('creates and persists an outcome and feedback for the decision', async () => {
    const observedAt = new Date().toISOString();
    const outcomeResponse = await request(app)
      .post('/api/outcomes')
      .send({
        userId: 'demo-user',
        decisionId,
        description: 'The generic task was completed.',
        observedAt,
      });

    expect(outcomeResponse.status).toBe(200);
    expect(outcomeResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        decisionId,
        userId: 'demo-user',
        description: 'The generic task was completed.',
        observedAt,
        createdAt: expect.any(String),
      })
    );
    expect(new OutcomeRepository().findById(outcomeResponse.body.id)).toEqual(
      expect.objectContaining({
        decisionId,
        description: 'The generic task was completed.',
      })
    );

    const feedbackResponse = await request(app)
      .post('/api/outcomes/feedback')
      .send({
        userId: 'demo-user',
        targetType: 'decision',
        targetId: decisionId,
        feedbackText: 'The generic recommendation was useful.',
      });

    expect(feedbackResponse.status).toBe(200);
    expect(feedbackResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: 'demo-user',
        targetType: 'decision',
        targetId: decisionId,
        feedbackText: 'The generic recommendation was useful.',
        createdAt: expect.any(String),
      })
    );
    expect(new FeedbackRepository().findById(feedbackResponse.body.id)).toEqual(
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
        userId: 'demo-user',
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
        userId: 'demo-user',
        observation: {
          type: 'USER_REPORTED',
          data: { note: 'Generic context update' },
        },
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        userId: 'demo-user',
        goals: expect.any(Array),
        preferences: expect.any(Array),
      })
    );

    const contextRepo = new PersonalContextRepository();
    const inferredAttribute = contextRepo.create({
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
        userId: 'demo-user',
        attributeId: inferredAttribute.id,
      });

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body).toEqual({ success: true });
    expect(contextRepo.findById(inferredAttribute.id)).toEqual(
      expect.objectContaining({
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
      })
    );

    const correctedValue = JSON.stringify({
      description: 'Corrected generic preference',
    });
    const correctResponse = await request(app)
      .post('/api/context/correct')
      .send({
        userId: 'demo-user',
        correction: {
          attributeId: inferredAttribute.id,
          correctedValue,
          reason: 'The original value was inaccurate.',
        },
      });

    expect(correctResponse.status).toBe(200);
    expect(correctResponse.body.preferences).toEqual(
      expect.arrayContaining([
        { description: 'Corrected generic preference' },
      ])
    );
    expect(contextRepo.findById(inferredAttribute.id)).toEqual(
      expect.objectContaining({
        value: correctedValue,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
      })
    );
  });

  it('returns JSON 404 details for an unknown route', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      path: '/api/unknown-route',
    });
  });
});
