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
import { interventionRouter } from './routes/intervention.routes';
import { UnauthorizedError, getUserId } from './utils/identity';


export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // API Gateway handles production CORS. We only emit bounded CORS locally for testing.
    if (process.env.NODE_ENV !== 'production') {
      const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://main.d6nuwvgegqhns.amplifyapp.com'];
      const origin = req.headers.origin as string;
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'origin, x-requested-with, content-type, accept, authorization, x-demo-user');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api/health', healthRouter);

  app.use('/api', (req: Request, _res: Response, next: NextFunction) => {
    try {
      getUserId(req);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/context', contextRouter);
  app.use('/api/decisions', decisionRouter);
  app.use('/api/calendar', calendarRouter);
  app.use('/api/observations', observationRouter);
  app.use('/api/outcomes', outcomeRouter);
  app.use('/api/interventions', interventionRouter);
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
    if (err instanceof UnauthorizedError || err.name === 'UnauthorizedError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: err.message
      });
      return;
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  });

  return app;
}
