/**
 * Context Management Routes
 */

import { Router, Request, Response } from 'express';
import { getContextEngine } from '../services/service-container';

import { getErrorMessage } from '../utils/error';
import type { Observation, ContextCorrection } from '../domain/types';

export const contextRouter = Router();

// Get current context
contextRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'demo-user';
    const contextEngine = getContextEngine();
    
    const context = await contextEngine.getCurrentContext(userId);
    
    res.json(context);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update context (manual or observation)
contextRouter.post('/update', async (req: Request, res: Response) => {
  try {
    const body = req.body as { userId?: string; observation?: Observation };
    const userId = typeof body.userId === 'string' ? body.userId : 'demo-user';
    const observation = body.observation;
    
    if (!observation) {
      return res.status(400).json({ error: 'Observation is required' });
    }

    const contextEngine = getContextEngine();
    const context = await contextEngine.updateContext(userId, observation);
    
    res.json(context);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Confirm inferred attribute
contextRouter.post('/confirm', async (req: Request, res: Response) => {
  try {
    const body = req.body as { userId?: string; attributeId?: string };
    const userId = typeof body.userId === 'string' ? body.userId : 'demo-user';
    const attributeId = body.attributeId;
    
    if (!attributeId) {
      return res.status(400).json({ error: 'attributeId is required' });
    }

    const contextEngine = getContextEngine();
    await contextEngine.confirmContextAttribute(userId, attributeId);
    
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Correct wrong context
contextRouter.post('/correct', async (req: Request, res: Response) => {
  try {
    const body = req.body as { userId?: string; correction?: ContextCorrection };
    const userId = typeof body.userId === 'string' ? body.userId : 'demo-user';
    const correction = body.correction;
    
    if (!correction || typeof correction.attributeId !== 'string' || typeof correction.correctedValue !== 'string') {
      return res.status(400).json({ error: 'Valid correction object is required' });
    }

    const contextEngine = getContextEngine();
    const context = await contextEngine.correctContext(userId, correction);
    
    res.json(context);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
