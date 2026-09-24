/**
 * Outcome Routes (Phase 6)
 */

import { Router, Request, Response } from 'express';
import { getOutcomeRepository, getFeedbackRepository, getDecisionRepository } from '../services/service-container';
import { getUserId } from '../utils/identity';
import { getErrorMessage } from '../utils/error';
import { OutcomeStatus } from '../domain/types';

export const outcomeRouter = Router();

interface OutcomeRequestBody {
  decisionId?: string;
  outcomeStatus?: string;
  wouldRepeat?: boolean | null;
  outcomeNotes?: string;
}

interface FeedbackRequestBody {
  targetType?: 'decision' | 'intervention' | 'forecast';
  targetId?: string;
  feedbackText?: string;
}

// Record or update outcome for a decision
outcomeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const outcomeRepo = getOutcomeRepository();
    const decisionRepo = getDecisionRepository();
    
    const body = req.body as OutcomeRequestBody;

    if (!body.decisionId || typeof body.decisionId !== 'string') {
      res.status(400).json({ error: 'decisionId is required' });
      return;
    }

    if (!body.outcomeStatus || !['positive', 'neutral', 'negative', 'pending'].includes(body.outcomeStatus)) {
      res.status(400).json({ error: 'outcomeStatus must be one of: positive, neutral, negative, pending' });
      return;
    }

    // Verify decision belongs to user
    const decision = await decisionRepo.findById(body.decisionId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }
    if (decision.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Check if outcome already exists
    const existing = await outcomeRepo.findByDecisionId(body.decisionId);
    
    let outcome;
    if (existing) {
      // Update existing outcome
      outcome = await outcomeRepo.update(existing.id, {
        outcomeStatus: body.outcomeStatus as OutcomeStatus,
        wouldRepeat: body.wouldRepeat !== undefined ? body.wouldRepeat : undefined,
        outcomeNotes: body.outcomeNotes !== undefined ? body.outcomeNotes : undefined
      });
    } else {
      // Create new outcome
      outcome = await outcomeRepo.create({
        decisionId: body.decisionId,
        userId,
        outcomeStatus: body.outcomeStatus as OutcomeStatus,
        wouldRepeat: body.wouldRepeat ?? null,
        outcomeNotes: body.outcomeNotes || null,
        recordedAt: new Date()
      });
    }

    res.json(outcome);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get outcome for a decision
outcomeRouter.get('/decision/:decisionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const outcomeRepo = getOutcomeRepository();
    const decisionRepo = getDecisionRepository();
    
    // Verify decision belongs to user
    const decision = await decisionRepo.findById(req.params.decisionId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }
    if (decision.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const outcome = await outcomeRepo.findByDecisionId(req.params.decisionId);
    if (!outcome) {
      res.status(404).json({ error: 'No outcome recorded for this decision' });
      return;
    }

    res.json(outcome);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// List user's outcomes
outcomeRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const outcomeRepo = getOutcomeRepository();
    const limitParam = typeof req.query.limit === 'string' ? req.query.limit : '50';
    const limit = parseInt(limitParam, 10) || 50;

    const outcomes = await outcomeRepo.findByUserId(userId, limit);
    res.json({ outcomes });
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
