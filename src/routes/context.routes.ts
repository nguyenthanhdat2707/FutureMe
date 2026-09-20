/**
 * Context Management Routes
 */

import { Router, Request, Response } from 'express';
import { getContextEngine } from '../services/service-container';

export const contextRouter = Router();

// Get current context
contextRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'demo-user';
    const contextEngine = getContextEngine();
    
    const context = await contextEngine.getCurrentContext(userId);
    
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update context (manual or observation)
contextRouter.post('/update', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'demo-user';
    const observation = req.body.observation;
    
    const contextEngine = getContextEngine();
    const context = await contextEngine.updateContext(userId, observation);
    
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm inferred attribute
contextRouter.post('/confirm', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'demo-user';
    const attributeId = req.body.attributeId;
    
    const contextEngine = getContextEngine();
    await contextEngine.confirmContextAttribute(userId, attributeId);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Correct wrong context
contextRouter.post('/correct', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'demo-user';
    const correction = req.body.correction;
    
    const contextEngine = getContextEngine();
    const context = await contextEngine.correctContext(userId, correction);
    
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
