/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import { createApp } from '../app';
import { closeDatabase, initDatabase } from '../database/connection';

describe('Decision Routes Integration', () => {
  const app = createApp();
  const databasePath = path.join(
    tmpdir(),
    `future-me-decision-routes-${process.pid}-${Date.now()}.db`
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

  it('rejects malformed clarification.attempted', async () => {
    const response = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question: 'test',
          clarification: { attempted: 'not-a-boolean' }
        }
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/must be a boolean/);
  });

  it('rejects oversized clarification arrays', async () => {
    const response = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question: 'test',
          clarification: {
            attempted: true,
            unresolvedFields: Array(21).fill('a')
          }
        }
      });
    expect(response.status).toBe(400);
  });

  it('rejects non-string entries in clarification arrays', async () => {
    const response = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question: 'test',
          clarification: {
            attempted: true,
            unresolvedFields: [123]
          }
        }
      });
    expect(response.status).toBe(400);
  });

  it('rejects overlong strings in clarification arrays', async () => {
    const response = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question: 'test',
          clarification: {
            attempted: true,
            unresolvedFields: ['a'.repeat(201)]
          }
        }
      });
    expect(response.status).toBe(400);
  });

  it('rejects blank strings in clarification arrays', async () => {
    const response = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question: 'test',
          clarification: {
            attempted: true,
            unresolvedFields: ['   ']
          }
        }
      });
    expect(response.status).toBe(400);
  });

  it('accepts valid clarification payload and returns typed policy output', async () => {
    const response = await request(app)
      .post('/api/decisions')
      .send({
        query: {
          question: 'Should I take this task?',
          impactProfile: {
            timeCostHours: undefined, // trigger missing data -> ASK / ABSTAIN
            deadline: new Date(Date.now() + 10 * 3600000).toISOString()
          },
          clarification: {
            attempted: true,
            unresolvedFields: ['timeCostHours']
          }
        }

      });

    expect(response.status).toBe(200);
    expect(response.body.policy.outcome).toBe('ABSTAIN');
    expect(response.body.policy.unresolvedMaterialFields).toContain('timeCostHours');
  });
});
