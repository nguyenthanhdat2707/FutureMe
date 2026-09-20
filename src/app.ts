/**
 * Express Server Setup
 */

import express, { Request, Response, NextFunction } from 'express';
import { healthRouter } from './routes/health.routes';
import { contextRouter } from './routes/context.routes';
import { decisionRouter } from './routes/decision.routes';
import { calendarRouter } from './routes/calendar.routes';
import { observationRouter } from './routes/observation.routes';
import { outcomeRouter } from './routes/outcome.routes';
import { demoRouter } from './routes/demo.routes';

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/context', contextRouter);
  app.use('/api/decisions', decisionRouter);
  app.use('/api/calendar', calendarRouter);
  app.use('/api/observations', observationRouter);
  app.use('/api/outcomes', outcomeRouter);
  app.use('/api/demo', demoRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path
    });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  });

  return app;
}
