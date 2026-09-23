/**
 * Decision Support Routes
 */

import { Router, Request, Response } from 'express';
import { getDecisionEngine, getDecisionRepository } from '../services/service-container';
import type { DecisionQuery } from '../domain/types';
import { getUserId } from '../utils/identity';

import { getErrorMessage } from '../utils/error';

interface DecisionRequestBody {
  query?: DecisionQuery;
}

export const decisionRouter = Router();

// Ask a decision
decisionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const decisionRepo = getDecisionRepository();
    const body = req.body as DecisionRequestBody;
    const userId = getUserId(req);
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
    if (query?.clarification) {
      const c = query.clarification;
      if (typeof c.attempted !== 'boolean') {
        return res.status(400).json({ error: 'clarification.attempted must be a boolean.' });
      }
      if (c.unresolvedFields !== undefined) {
        if (!Array.isArray(c.unresolvedFields) || c.unresolvedFields.length > 20 || c.unresolvedFields.some(f => typeof f !== 'string' || f.trim().length === 0 || f.trim().length > 200)) {
          return res.status(400).json({ error: 'clarification.unresolvedFields must be a reasonable array of strings.' });
        }
      }
      if (c.unresolvedConflicts !== undefined) {
        if (!Array.isArray(c.unresolvedConflicts) || c.unresolvedConflicts.length > 20 || c.unresolvedConflicts.some(f => typeof f !== 'string' || f.trim().length === 0 || f.trim().length > 200)) {
          return res.status(400).json({ error: 'clarification.unresolvedConflicts must be a reasonable array of strings.' });
        }
      }
    }

    const engine = getDecisionEngine();
    const support = await engine.supportDecision(userId, query);

    // Save decision to database with query attached
    support.decision.relevantContext.query = query;
    support.decision.query = query;
    await decisionRepo.create(support.decision);

    res.json(support);

  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get decision details
decisionRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const decisionRepo = getDecisionRepository();
    const decision = await decisionRepo.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    if (decision.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(decision);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Record user choice
decisionRouter.post('/:id/choice', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const decisionRepo = getDecisionRepository();
    const body = req.body as { choice?: string };
    const userChoice = body.choice;

    if (typeof userChoice !== 'string') {
      return res.status(400).json({ error: 'Choice must be a string' });
    }

    const decision = await decisionRepo.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    if (decision.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await decisionRepo.updateChoice(req.params.id, userChoice);

    res.json(updated);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// List user decisions
decisionRouter.get('/', async (req: Request, res: Response) => {
  try {
    const decisionRepo = getDecisionRepository();
    const userId = getUserId(req);
    const limitParam = typeof req.query.limit === 'string' ? req.query.limit : '50';
    const limit = parseInt(limitParam, 10) || 50;

    const decisions = await decisionRepo.findByUserId(userId, limit);

    res.json({ decisions });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
