/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as ok').get() as any;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: result.ok === 1 ? 'connected' : 'disconnected',
      version: '0.1.0'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
