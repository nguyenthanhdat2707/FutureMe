/**
 * Outcome Routes
 */

import { Router, Request, Response } from 'express';
import { getOutcomeRepository, getFeedbackRepository, getDecisionRepository } from '../services/service-container';
import { getUserId } from '../utils/identity';

import { getErrorMessage } from '../utils/error';

export const outcomeRouter = Router();

interface OutcomeRequestBody {
  decisionId?: string;
  description?: string;
  observedAt?: string;
}

interface FeedbackRequestBody {
  targetType?: 'decision' | 'intervention' | 'forecast';
  targetId?: string;
  feedbackText?: string;
}

// Record decision outcome
outcomeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const outcomeRepo = getOutcomeRepository();
    const decisionRepo = getDecisionRepository();
    const body = req.body as OutcomeRequestBody;
    const userId = getUserId(req);

    if (!body.decisionId || typeof body.decisionId !== 'string' || body.decisionId.trim() === '') {
      res.status(400).json({ error: 'Missing decisionId' });
      return;
    }

    const decision = await decisionRepo.findById(body.decisionId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }
    if (decision.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this decision' });
      return;
    }

    let obsDate = new Date();
    if (body.observedAt) {
      const parsed = new Date(body.observedAt);
      if (!isNaN(parsed.getTime())) {
        obsDate = parsed;
      } else {
        res.status(400).json({ error: 'Invalid observedAt date' });
        return;
      }
    }

    const outcome = {
      decisionId: body.decisionId,
      userId,
      description: body.description || '',
      observedAt: obsDate,
      createdAt: new Date()
    };

    const created = await outcomeRepo.create(outcome);

    res.json(created);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Submit feedback
outcomeRouter.post('/feedback', async (req: Request, res: Response) => {
  try {
    const feedbackRepo = getFeedbackRepository();
    const decisionRepo = getDecisionRepository();
    const body = req.body as FeedbackRequestBody;
    const userId = getUserId(req);

    const targetType = body.targetType || 'decision';
    if (!body.targetId || typeof body.targetId !== 'string' || body.targetId.trim() === '') {
      res.status(400).json({ error: 'Missing targetId' });
      return;
    }

    if (targetType === 'decision') {
      const decision = await decisionRepo.findById(body.targetId);
      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }
      if (decision.userId !== userId) {
        res.status(403).json({ error: 'Forbidden: You do not own this decision' });
        return;
      }
    }

    const feedback = {
      userId,
      targetType: targetType,
      targetId: body.targetId,
      feedbackText: body.feedbackText || ''
    };

    const created = await feedbackRepo.create(feedback);

    res.json(created);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
