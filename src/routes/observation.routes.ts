/**
 * Observation Routes
 */

import { Router, Request, Response } from 'express';
import { ObservationRepository } from '../repositories/observation.repository';

export const observationRouter = Router();

// Create observation (manual)
observationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const observationRepo = new ObservationRepository();
    const userId = req.body.userId || 'demo-user';
    const observation = {
      userId,
      type: req.body.type,
      data: req.body.data,
      source: req.body.source || 'USER_CONFIRMED',
      confidence: req.body.confidence || 1.0,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
    };
    
    const created = observationRepo.create(observation);
    
    res.json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
