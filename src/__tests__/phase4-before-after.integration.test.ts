import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import { createApp } from '../app';
import { initDatabase, closeDatabase } from '../database/connection';

interface DecisionResponse {
  policy: { outcome: string; reason?: string };
  decision: { recommendation: { option: string } };
  assessment: {
    evidence: Array<{ fact: string; value: string | number; source: string; explanation: string }>;
  };
}

describe('Phase 4 Before/After Explanation', () => {
  let app: ReturnType<typeof createApp>;
  const databasePath = path.join(tmpdir(), `future-me-phase4-routes-${process.pid}-${Date.now()}.db`);

  beforeAll(async () => {
    await initDatabase(databasePath);
  });

  afterAll(() => {
    closeDatabase();
    if (existsSync(databasePath)) {
      rmSync(databasePath);
    }
  });

  beforeEach(() => {
    app = createApp();
  });

  it('determines before/after deterministic feasibility from context updates', async () => {
    const userId = `phase4-user-${Date.now()}-${Math.random()}`;
    const question = 'Should I take on this new task?';

    const firstDecisionBody = {
      userId,
      query: {
        question,
        impactProfile: {
          timeCostHours: 4,
          availableHoursBeforeDeadline: 10,
          workloadHoursBeforeDeadline: 1,
          energyCost: 3,
          availableEnergy: 8,
          source: 'user-confirmed'
        }
      }
    };

    const firstRes = await request(app).post('/api/decisions').send(firstDecisionBody);
    expect(firstRes.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const firstBody: DecisionResponse = firstRes.body;
    expect(firstBody.policy.outcome).toBe('RECOMMEND');
    expect(firstBody.decision.recommendation.option).toBe('proceed');

    // Same decision.question both
    const firstReqBody = firstDecisionBody;
    expect(firstReqBody.query.question).toBe(question);

    const obsBody = {
      userId,
      observation: {
        type: 'workload-increase',
        data: { description: 'Urgent production task', severity: 'high' },
        source: 'USER_CONFIRMED',
        confidence: 1.0
      }
    };

    const obsRes = await request(app).post('/api/context/update').send(obsBody);
    expect(obsRes.status).toBe(200);

    const secondRes = await request(app).post('/api/decisions').send(firstDecisionBody);
    expect(secondRes.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secondBody: DecisionResponse = secondRes.body;
    expect(secondBody.policy.outcome).toBe('RECOMMEND');
    expect(secondBody.decision.recommendation.option).toBe('proceed-with-caution');

    const workloadEvidence = secondBody.assessment.evidence.find(e => e.fact === 'Context effect');
    expect(workloadEvidence).toBeDefined();
    expect(workloadEvidence?.source).toBe('context');
    expect(workloadEvidence?.value).toBe('+4h workload');
  });
});
