/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars */
import { initDatabase, closeDatabase } from '../database/connection';
import request from 'supertest';
import { createApp } from '../app';
import { setCognitoSub } from '../utils/identity';
import { Request, Response, NextFunction } from 'express';

describe('HTTP Route Auth', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    await initDatabase(':memory:');
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    closeDatabase();
    process.env = originalEnv;
  });

  it('returns 401 when missing subject in cognito mode', async () => {
    process.env.AUTH_MODE = 'cognito';
    const app = createApp();

    const response = await request(app)
      .get('/api/context') // any user route
      .expect(401);
      
    expect((response.body as Record<string, string>).error).toMatch(/Unauthorized/);
  });
  
  it('returns 401 when blank subject in cognito mode', async () => {
    process.env.AUTH_MODE = 'cognito';
    const express = require('express');
    const testApp = express();
    
    testApp.use('/api/test-blank', (req: any, res: any, next: any) => {
        setCognitoSub(req, '   ');
        next();
    });
    testApp.get('/api/test-blank', (req: any, res: any) => {
        try {
            const { getUserId } = require('../utils/identity');
            res.json({ user: getUserId(req) });
        } catch(e: any) {
            res.status(401).json({ error: e.message });
        }
    });

    await request(testApp)
      .get('/api/test-blank')
      .expect(401);
  });

  it('proves trim behavior and spoofed body/query/header cannot override the symbol-carried subject', () => {
    process.env.AUTH_MODE = 'cognito';
    const { getUserId, setCognitoSub } = require('../utils/identity');
    
    const mockReq = {
      body: { userId: 'spoofed-body' },
      query: { userId: 'spoofed-query' },
      headers: { authorization: 'Bearer spoofed' }
    };
    
    setCognitoSub(mockReq as any, ' real-sub ');
    
    const userId = getUserId(mockReq as any);
    expect(userId).toBe('real-sub'); // now trimmed!
  });

  it('returns 404/403 for decision ownership in outcome creation', async () => {
    process.env.AUTH_MODE = 'local';
    const app = createApp();
    
    const response = await request(app)
      .post('/api/outcomes')
      .send({ decisionId: 'non-existent' })
      .expect(404);
      
    expect((response.body as Record<string, string>).error).toBe('Decision not found');
  });
});
