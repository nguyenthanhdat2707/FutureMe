/**
 * Decision Support Routes
 */

import { Router, Request, Response } from 'express';
import { getDecisionEngine } from '../services/service-container';
import { DecisionRepository } from '../repositories/decision.repository';
import type { DecisionQuery } from '../domain/types';

import { getErrorMessage } from '../utils/error';

interface DecisionRequestBody {
  userId?: string;
  query?: DecisionQuery;
}

export const decisionRouter = Router();

// Ask a decision
decisionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const body = req.body as DecisionRequestBody;
    const userId = body.userId || 'demo-user';
    const query = body.query;

    if (!query) {
      return res.status(400).json({ error: 'A decision query is required.' });
    }

    if (query?.impactProfile) {
      const p = query.impactProfile;
      const values = [p.timeCostHours, p.availableHoursBeforeDeadline, p.workloadHoursBeforeDeadline, p.energyCost, p.availableEnergy];
      if (values.some(v => typeof v === 'number' && v < 0)) {
        return res.status(400).json({ error: 'Numeric values cannot be negative.' });
      }
    }

    const engine = getDecisionEngine();
    const support = await engine.supportDecision(userId, query);

    // Save decision to database
    decisionRepo.create(support.decision);

    res.json(support);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get decision details
decisionRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const decision = decisionRepo.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    res.json(decision);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Record user choice
decisionRouter.post('/:id/choice', (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const body = req.body as { choice?: string };
    const userChoice = body.choice;

    if (typeof userChoice !== 'string') {
      return res.status(400).json({ error: 'Choice must be a string' });
    }

    const decision = decisionRepo.updateChoice(req.params.id, userChoice);

    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    res.json(decision);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// List user decisions
decisionRouter.get('/', (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'demo-user';
    const limitParam = typeof req.query.limit === 'string' ? req.query.limit : '50';
    const limit = parseInt(limitParam, 10) || 50;

    const decisions = decisionRepo.findByUserId(userId, limit);

    res.json({ decisions });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
