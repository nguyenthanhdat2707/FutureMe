/**
 * Outcome Routes
 */

import { Router, Request, Response } from 'express';
import { OutcomeRepository } from '../repositories/outcome.repository';
import { FeedbackRepository } from '../repositories/feedback.repository';

import { getErrorMessage } from '../utils/error';

export const outcomeRouter = Router();

interface OutcomeRequestBody {
  userId?: string;
  decisionId?: string;
  description?: string;
  observedAt?: string;
}

interface FeedbackRequestBody {
  userId?: string;
  targetType?: 'decision' | 'intervention' | 'forecast';
  targetId?: string;
  feedbackText?: string;
}

// Record decision outcome
outcomeRouter.post('/', (req: Request, res: Response) => {
  try {
    const outcomeRepo = new OutcomeRepository();
    const body = req.body as OutcomeRequestBody;
    const userId = body.userId || 'demo-user';
    const outcome = {
      decisionId: body.decisionId || '',
      userId,
      description: body.description || '',
      observedAt: body.observedAt ? new Date(body.observedAt) : new Date()
    };
    
    const created = outcomeRepo.create(outcome);
    
    res.json(created);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Submit feedback
outcomeRouter.post('/feedback', (req: Request, res: Response) => {
  try {
    const feedbackRepo = new FeedbackRepository();
    const body = req.body as FeedbackRequestBody;
    const userId = body.userId || 'demo-user';
    const feedback = {
      userId,
      targetType: body.targetType || 'decision',
      targetId: body.targetId || '',
      feedbackText: body.feedbackText || ''
    };
    
    const created = feedbackRepo.create(feedback);
    
    res.json(created);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
