/**
 * Outcome Routes
 */

import { Router, Request, Response } from 'express';
import { OutcomeRepository } from '../repositories/outcome.repository';
import { FeedbackRepository } from '../repositories/feedback.repository';

export const outcomeRouter = Router();

// Record decision outcome
outcomeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const outcomeRepo = new OutcomeRepository();
    const userId = req.body.userId || 'demo-user';
    const outcome = {
      decisionId: req.body.decisionId,
      userId,
      description: req.body.description,
      observedAt: req.body.observedAt ? new Date(req.body.observedAt) : new Date()
    };
    
    const created = outcomeRepo.create(outcome);
    
    res.json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit feedback
outcomeRouter.post('/feedback', async (req: Request, res: Response) => {
  try {
    const feedbackRepo = new FeedbackRepository();
    const userId = req.body.userId || 'demo-user';
    const feedback = {
      userId,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      feedbackText: req.body.feedbackText
    };
    
    const created = feedbackRepo.create(feedback);
    
    res.json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
