/**
 * Observation Routes
 */

import { Router, Request, Response } from 'express';
import { ObservationRepository } from '../repositories/observation.repository';

import { getErrorMessage } from '../utils/error';
import { ObservationType, ObservationSource } from '../domain/types';

export const observationRouter = Router();

interface ObservationRequestBody {
  userId?: string;
  type?: ObservationType;
  data?: Record<string, unknown>;
  source?: ObservationSource;
  confidence?: number;
  timestamp?: string;
}

// Create observation (manual)
observationRouter.post('/', (req: Request, res: Response) => {
  try {
    const observationRepo = new ObservationRepository();
    const body = req.body as ObservationRequestBody;
    const userId = body.userId || 'demo-user';
    const observation = {
      userId,
      type: body.type || ('USER_REPORTED' as ObservationType),
      data: body.data || {},
      source: body.source || ('USER_CONFIRMED' as ObservationSource),
      confidence: body.confidence || 1.0,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
    };
    
    const created = observationRepo.create(observation);
    
    res.json(created);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
