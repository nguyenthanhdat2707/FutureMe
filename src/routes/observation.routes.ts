/**
 * Observation Routes
 */

import { Router, Request, Response } from 'express';
import { getObservationRepository, getContextEngine, getStateEstimator, getInterventionPolicy } from '../services/service-container';
import { getUserId } from '../utils/identity';

import { getErrorMessage } from '../utils/error';
import { ObservationType, ObservationSource } from '../domain/types';

export const observationRouter = Router();

interface ObservationRequestBody {
  type?: ObservationType;
  data?: Record<string, unknown>;
  source?: ObservationSource;
  confidence?: number;
  timestamp?: string;
}

// Create observation (manual)
observationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const observationRepo = getObservationRepository();
    const body = req.body as ObservationRequestBody;
    const userId = getUserId(req);
    const observation = {
      userId,
      type: body.type || ('USER_REPORTED' as ObservationType),
      data: body.data || {},
      source: body.source || ('USER_CONFIRMED' as ObservationSource),
      confidence: body.confidence || 1.0,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
    };
    
    const created = await observationRepo.create(observation);
    
    try {
      const contextEngine = getContextEngine();
      const stateEstimator = getStateEstimator();
      const policy = getInterventionPolicy();
      const context = await contextEngine.getCurrentContext(userId);
      const state = await stateEstimator.estimateCurrentState(context, []);
      await policy.shouldIntervene(state, context, { userId, now: new Date() });
    } catch {
      // Non-blocking catch-up evaluation
    }

    res.json(created);

  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
