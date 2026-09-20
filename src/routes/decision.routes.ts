/**
 * Decision Support Routes
 */

import { Router, Request, Response } from 'express';
import { getDecisionEngine } from '../services/service-container';
import { DecisionRepository } from '../repositories/decision.repository';

export const decisionRouter = Router();

// Ask a decision
decisionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const userId = req.body.userId || 'demo-user';
    const query = req.body.query;
    
    const engine = getDecisionEngine();
    const support = await engine.supportDecision(userId, query);
    
    // Save decision to database
    decisionRepo.create(support.decision);
    
    res.json(support);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get decision details
decisionRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const decision = decisionRepo.findById(req.params.id);
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record user choice
decisionRouter.post('/:id/choice', async (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const userChoice = req.body.choice;
    const decision = decisionRepo.updateChoice(req.params.id, userChoice);
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List user decisions
decisionRouter.get('/', async (req: Request, res: Response) => {
  try {
    const decisionRepo = new DecisionRepository();
    const userId = req.query.userId as string || 'demo-user';
    const limit = parseInt(req.query.limit as string) || 50;
    
    const decisions = decisionRepo.findByUserId(userId, limit);
    
    res.json({ decisions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
