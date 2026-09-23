/**
 * Intervention Routes
 * Phase 5 endpoints for checking and responding to in-app interventions
 */

import { Router, Request, Response } from 'express';
import {
  getContextEngine,
  getStateEstimator,
  getInterventionPolicy,
  getInterventionRepository,
  getObservationRepository
} from '../services/service-container';
import { getUserId } from '../utils/identity';
import { getErrorMessage } from '../utils/error';
import { ObservationType, ObservationSource } from '../domain/types';

export const interventionRouter = Router();

// GET /api/interventions/check - Catch-up and event-driven intervention evaluation
interventionRouter.get('/check', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contextEngine = getContextEngine();
    const stateEstimator = getStateEstimator();
    const interventionPolicy = getInterventionPolicy();

    // 1. Get current context & state estimate
    const context = await contextEngine.getCurrentContext(userId);
    const state = await stateEstimator.estimateCurrentState(context, []);

    // 2. Evaluate deterministic intervention policy
    const decision = await interventionPolicy.shouldIntervene(state, context, {
      userId,
      now: new Date()
    });

    if (decision.shouldIntervene && decision.interventionType !== 'NONE') {
      return res.json({
        interventions: [decision],
        hasInterventions: true
      });
    }

    return res.json({
      interventions: [],
      hasInterventions: false
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// GET /api/interventions/active - Get currently persisted active interventions
interventionRouter.get('/active', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const interventionRepo = getInterventionRepository();
    const active = await interventionRepo.findActiveByUserId(userId);

    res.json({ interventions: active });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// POST /api/interventions/respond - User response to intervention
interventionRouter.post('/respond', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const body = req.body as { interventionId?: unknown; response?: unknown };

    if (!body || typeof body.interventionId !== 'string' || body.interventionId.trim().length === 0) {
      return res.status(400).json({ error: 'interventionId must be a non-empty string' });
    }

    if (typeof body.response !== 'string' || body.response.trim().length === 0) {
      return res.status(400).json({ error: 'response must be a non-empty string' });
    }

    const interventionId = body.interventionId.trim();
    const userResponse = body.response.trim().toLowerCase();

    const interventionRepo = getInterventionRepository();
    const intervention = await interventionRepo.findById(interventionId);

    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    if (intervention.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();

    if (userResponse === 'dismiss') {
      await interventionRepo.dismiss(interventionId, now);
      return res.json({ success: true, status: 'DISMISSED' });
    }

    // Handle responses like 'yes', 'confirm', 'completed'
    const isAffirmative = ['yes', 'completed', 'confirm', 'yes, completed'].includes(userResponse);
    await interventionRepo.updateStatus(interventionId, 'RESPONDED');

    const observationRepo = getObservationRepository();

    if (intervention.type === 'CONTEXT_CHECK') {
      if (isAffirmative) {
        // Record task completed observation
        await observationRepo.create({
          userId,
          type: ObservationType.TASK_COMPLETED,
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          data: {
            interventionId,
            issueKey: intervention.issueKey,
            confirmed: true,
            completedAt: now.toISOString()
          },
          timestamp: now
        });
      } else {
        // Record still working / not completed observation
        await observationRepo.create({
          userId,
          type: ObservationType.CONTEXT_CHANGE,
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          data: {
            interventionId,
            issueKey: intervention.issueKey,
            completed: false,
            stillWorking: true,
            reportedAt: now.toISOString()
          },
          timestamp: now
        });
      }
    } else {
      // Disruption response (e.g. 'review decision', 'adjust schedule', etc.)
      await observationRepo.create({
        userId,
        type: ObservationType.USER_REPORTED,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        data: {
          interventionId,
          issueKey: intervention.issueKey,
          response: userResponse,
          acknowledgedAt: now.toISOString()
        },
        timestamp: now
      });
    }

    return res.json({
      success: true,
      status: 'RESPONDED',
      response: userResponse
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
