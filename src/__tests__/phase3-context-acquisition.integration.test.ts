/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call */
import request from 'supertest';
import { createApp } from '../app';
import { ObservationSource, ObservationType } from '../domain/types';
import { initDatabase, closeDatabase } from '../database/connection';
import { getContextRepository } from '../services/service-container';

describe('Phase 3 Context Acquisition API', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    app = createApp();
  });

  describe('Context Setup and Sparse Calendar', () => {
    it('POST /api/context/setup validates <=4 answers, allows all-skip, and sets setupCompleted', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;

      const noBodyRes = await request(app)
        .post('/api/context/setup')
        .send({ userId, answers: "not-an-array" });
      expect(noBodyRes.status).toBe(400);

      const arrayBodyRes = await request(app)
        .post('/api/context/setup')
        .send([]);
      expect(arrayBodyRes.status).toBe(400);

      const malformedRes = await request(app)
        .post('/api/context/setup')
        .send({ userId, answers: [{ questionId: 123, text: null }] });
      expect(malformedRes.status).toBe(400);

      const overLimitRes = await request(app)
        .post('/api/context/setup')
        .send({ userId, answers: [
          { questionId: 'q1', text: 'a1' },
          { questionId: 'q2', text: 'a2' },
          { questionId: 'q3', text: 'a3' },
          { questionId: 'q4', text: 'a4' },
          { questionId: 'q5', text: 'a5' }
        ]});
      expect(overLimitRes.status).toBe(400);

      const emptyRes = await request(app)
        .post('/api/context/setup')
        .send({ userId, answers: [] });
      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.setupCompleted).toBe(true);

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      expect(ctxRes.status).toBe(200);
      expect(ctxRes.body.setupCompleted).toBe(true);
    });

    it('POST /api/context/setup creates USER_CONFIRMED context evidence for each answer', async () => {
      const userId = `phase3-setup-evidence-user-${Date.now()}`;

      const setupRes = await request(app)
        .post('/api/context/setup')
        .send({ userId, answers: [
          { questionId: 'q1', text: 'my answer' }
        ]});
      expect(setupRes.status).toBe(200);

      const contextRepo = getContextRepository();
      const allAttrs = await contextRepo.findByUserId(userId, 100);

      // Look for the onboarding attribute
      const onboardingAttrs = allAttrs.filter(a => a.attribute === 'onboarding_answer');
      expect(onboardingAttrs.length).toBe(1);

      const attr = onboardingAttrs[0];
      expect(attr.source).toBe('USER_CONFIRMED');
      expect(attr.confidence).toBe(1.0);
      expect(attr.observedAt).toBeDefined();
      expect(attr.userId).toBe(userId);

      const val = JSON.parse(attr.value);
      expect(val.questionId).toBe('q1');
      expect(val.text).toBe('my answer');
    });

    it('GET /api/context for never-synced user reports calendar status never/unknown and busy hours null', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      expect(ctxRes.status).toBe(200);
      expect(ctxRes.body.calendar.status).toBe('unknown');
      expect(ctxRes.body.calendar.busyHoursToday).toBeNull();
      expect(ctxRes.body.calendar.busyHoursThisWeek).toBeNull();
    });
    it('direct empty-marker coverage reports synced with null busy hours', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const contextRepo = getContextRepository();

      const testDate = new Date();
      await contextRepo.create({
        userId,
        attribute: 'calendar_last_sync',
        value: JSON.stringify(testDate.toISOString()),
        source: ObservationSource.SYSTEM_OBSERVED,
        confidence: 1.0,
        observedAt: testDate
      });

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      expect(ctxRes.status).toBe(200);

      expect(ctxRes.body.calendar.status).toBe('synced');
      expect(ctxRes.body.calendar.busyHoursToday).toBeNull();
      expect(ctxRes.body.calendar.busyHoursThisWeek).toBeNull();

      const statusRes = await request(app).get(`/api/calendar/status?userId=${userId}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.status).toBe('synced');
      expect(new Date(statusRes.body.lastSync as string).getTime()).toBe(testDate.getTime());
    });
  });

  describe('Calendar Sync and Commitments', () => {
    it('POST /api/calendar/sync populates CALENDAR commitments in context', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;

      const syncRes = await request(app)
        .post('/api/calendar/sync')
        .send({ userId });
      expect(syncRes.status).toBe(200);
      expect(syncRes.body.synced).toBeGreaterThan(0);

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      expect(ctxRes.status).toBe(200);

      const commitments = ctxRes.body.commitments;
      const calendarCommitments = commitments.filter((c: any) => c.source === 'CALENDAR');

      expect(calendarCommitments.length).toBeGreaterThan(0);
      const c1 = calendarCommitments[0];

      expect(c1.source).toBe('CALENDAR');
      expect(c1.confidence).toBe(1.0);
      expect(c1.attributeId).toBeDefined();
      expect(c1.startTime).toBeDefined();
      expect(c1.endTime).toBeDefined();
      expect(c1.status).toBeDefined();
      expect(c1.observedAt).toBeDefined();
      expect(c1.validUntil).toBeDefined();

      expect(ctxRes.body.calendar.status).toBe('synced');
      expect(ctxRes.body.calendar.busyHoursToday).not.toBeNull();
      expect(ctxRes.body.calendar.busyHoursThisWeek).not.toBeNull();
    });
  });

  describe('Confirm and Correct Context', () => {
    it('confirm appends USER_CONFIRMED, original row remains, records CONTEXT_CHANGE', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const contextRepo = getContextRepository();
      const initialAttr = await contextRepo.create({
        userId,
        attribute: 'preference',
        value: JSON.stringify({ id: 'p1', description: 'Early mornings', category: 'work' }),
        source: ObservationSource.SYSTEM_OBSERVED,
        confidence: 0.6,
        observedAt: new Date()
      });

      const confirmRes = await request(app)
        .post('/api/context/confirm')
        .send({ userId, attributeId: initialAttr.id });
      expect(confirmRes.status).toBe(200);

      const allAttrs = await contextRepo.findByUserId(userId, 100);
      const prefAttrs = allAttrs.filter(a => a.attribute === 'preference');
      expect(prefAttrs.length).toBeGreaterThanOrEqual(2);
      expect(prefAttrs.find(a => a.id === initialAttr.id)).toBeDefined();

      const observationRepo = await import('../services/service-container').then(m => m.getObservationRepository());
      const obs = await observationRepo.findByUserId(userId);
      const confirmObs = obs.find(o => o.type === ObservationType.CONTEXT_CHANGE && o.data.attributeId === initialAttr.id && o.data.reason === 'Confirmation');
      expect(confirmObs).toBeDefined();

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      const prefs = ctxRes.body.preferences;
      expect(prefs.length).toBe(1);
      expect(prefs[0].source).toBe('USER_CONFIRMED');
    });

    it('plain-text correction preserves object id/shape and records CONTEXT_CHANGE', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const contextRepo = getContextRepository();
      const initialAttr = await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({ id: 'g1', description: 'Run a marathon', priority: 'medium' }),
        source: ObservationSource.SYSTEM_OBSERVED,
        confidence: 0.6,
        observedAt: new Date()
      });

      const correctRes = await request(app)
        .post('/api/context/correct')
        .send({ userId, correction: { attributeId: initialAttr.id, correctedValue: 'Run a 5k', reason: 'User says no marathon' } });
      expect(correctRes.status).toBe(200);

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      const goals = ctxRes.body.goals;
      expect(goals.length).toBe(1);
      expect(goals[0].description).toBe('Run a 5k');
      expect(goals[0].id).toBe('g1');
      expect(goals[0].priority).toBe('medium');

      const observationRepo = await import('../services/service-container').then(m => m.getObservationRepository());
      const obs = await observationRepo.findByUserId(userId);
      const correctObs = obs.find(o => o.type === ObservationType.CONTEXT_CHANGE && o.data.attributeId === initialAttr.id && o.data.reason === 'User says no marathon');
      expect(correctObs).toBeDefined();
    });

    it('JSON-object correction merges shape/id', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const contextRepo = getContextRepository();
      const initialAttr = await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({ id: 'g2', description: 'Swim', priority: 'low' }),
        source: ObservationSource.SYSTEM_OBSERVED,
        confidence: 0.6,
        observedAt: new Date()
      });

      const correctRes = await request(app)
        .post('/api/context/correct')
        .send({ userId, correction: { attributeId: initialAttr.id, correctedValue: JSON.stringify({ priority: 'high' }) } });
      expect(correctRes.status).toBe(200);

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      const goals = ctxRes.body.goals;
      expect(goals.length).toBe(1);
      expect(goals[0].description).toBe('Swim'); // preserved
      expect(goals[0].priority).toBe('high'); // updated
      expect(goals[0].id).toBe('g2'); // preserved
    });

    it('deterministically resolves latest entity during timestamp ties', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const contextRepo = getContextRepository();

      const sameDate = new Date();

      // Creating two rows with exactly the same observedAt. We want the one with the latest createdAt or ID to win.
      // SQLite createdAt might also tie, so let's rely on ID fallback if needed.
      const attr1 = await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({ id: 'tie', description: 'First' }),
        source: ObservationSource.SYSTEM_OBSERVED,
        confidence: 0.5,
        observedAt: sameDate
      });
      // sleep slightly so createdAt is different if DB supports it, but since we test determinism, we can just ensure they tie
      const attr2 = await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({ id: 'tie', description: 'Second' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: sameDate
      });

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      expect(ctxRes.body.goals.length).toBe(1);
      // Since attr2 was created later, its ID / createdAt will win the tiebreak.
      // So 'Second' should be returned.
      // To be robust, let's just make sure it returns exactly one of them and it matches the later created one.
      const goal = ctxRes.body.goals[0];
      // Wait, since we created attr2 after attr1, createdAt should be >=. If ==, id is lexically greater? UUIDs v4 are not lexically ordered by time.
      // Let's just assert that it deterministically returns the expected based on the tie-breaker rule.
      const resolvedList = [attr1, attr2].sort((a, b) => {
        const obsDiff = a.observedAt.getTime() - b.observedAt.getTime();
        if (obsDiff !== 0) return obsDiff;
        const creDiff = a.createdAt.getTime() - b.createdAt.getTime();
        if (creDiff !== 0) return creDiff;
        return a.id.localeCompare(b.id);
      });
      const expectedWinner = resolvedList[1];
      const expectedText = JSON.parse(expectedWinner.value).description;
      expect(goal.description).toBe(expectedText);
    });

    it('populates typed evidence metadata (observedAt, validUntil) for goals, commitments, preferences', async () => {
      const userId = `phase3-user-${Date.now()}-${Math.random()}`;
      const contextRepo = getContextRepository();

      const testDate = new Date();
      const validUntilDate = new Date(testDate.getTime() + 86400000);

      await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({ id: 'meta-g1', description: 'Test Goal', priority: 'high' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: testDate,
        validUntil: validUntilDate
      });

      const ctxRes = await request(app).get(`/api/context?userId=${userId}`);
      expect(ctxRes.status).toBe(200);

      const goal = ctxRes.body.goals[0];
      expect(goal).toBeDefined();
      expect(new Date(goal.observedAt as string).getTime()).toBe(testDate.getTime());
      expect(new Date(goal.validUntil as string).getTime()).toBe(validUntilDate.getTime());
    });
  });
});
