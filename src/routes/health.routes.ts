/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  let database: 'connected' | 'disconnected' = 'disconnected';

  try {
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as ok').get() as { ok?: number };
    database = result.ok === 1 ? 'connected' : 'disconnected';
  } catch {
    // The liveness endpoint remains available while the database is starting.
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'future-me-backend',
    database,
    version: '0.1.0'
  });
});
