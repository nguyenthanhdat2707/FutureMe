/**
 * Context Management Routes
 */

import { Router, Request, Response } from 'express';
import { getContextEngine, getLLMContextAnalyst, getContextRepository, getObservationRepository } from '../services/service-container';

import { getErrorMessage } from '../utils/error';
import type { Observation, ContextCorrection, ContextAnalystRequest } from '../domain/types';

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

// Analyze context for uncertainty and hypotheses
contextRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const userId = typeof req.body.userId === 'string' ? req.body.userId : 'demo-user';
    const contextRepo = getContextRepository();
    const observationRepo = getObservationRepository();
    const llmAnalyst = getLLMContextAnalyst();

    // Identify UNCERTAIN context attributes
    const allContext = await contextRepo.findByUserId(userId);
    const uncertainAttributes = allContext
      .filter(attr => attr.source !== 'USER_CONFIRMED' && attr.confidence < 1.0)
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
      .slice(0, 10);

    // Get recent observations (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allObservations = await observationRepo.findByUserId(userId);
    const recentObservations = allObservations
      .filter(obs => obs.timestamp >= twentyFourHoursAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    // Build ContextAnalystRequest
    const analystRequest: ContextAnalystRequest = {
      signals: recentObservations.map(obs => ({
        id: obs.id,
        description: `${obs.type}: ${JSON.stringify(obs.data)}`,
        evidenceIds: [obs.id]
      })),
      evidence: recentObservations.map(obs => ({
        id: obs.id,
        description: `${obs.type}: ${JSON.stringify(obs.data)}`
      })),
      contextAttributes: uncertainAttributes.map(attr => ({
        id: attr.id,
        value: typeof attr.value === 'string' ? attr.value : JSON.stringify(attr.value)
      }))
    };

    if (analystRequest.signals.length === 0 || analystRequest.contextAttributes.length === 0) {
      console.log('Skipping analyze. Signals:', analystRequest.signals.length, 'Attributes:', analystRequest.contextAttributes.length);
      return res.status(200).json({
        proposedHypotheses: [],
        candidateClarificationQuestions: [],
        validation: { status: 'accepted' },
        skipped: true,
        reason: 'no-signals-or-attributes'
      });
    }

    const result = await llmAnalyst.analyze(analystRequest);
    return res.status(200).json(result);
  } catch (error: unknown) {
    // If the analyst throws unexpectedly, we return 200 with rejected validation per specs
    return res.status(200).json({
      proposedHypotheses: [],
      candidateClarificationQuestions: [],
      validation: { status: 'rejected', reason: 'invalid-request', errors: [getErrorMessage(error)] }
    });
  }
});

// Clarify an uncertain context attribute
contextRouter.post('/clarify', async (req: Request, res: Response) => {
  try {
    const body = req.body as { userId?: string; attributeId?: string; answer?: string; questionText?: string };
    const userId = typeof body.userId === 'string' ? body.userId : 'demo-user';
    const attributeId = body.attributeId;
    const answer = body.answer;
    const questionText = body.questionText;

    if (!attributeId || typeof attributeId !== 'string') {
      return res.status(400).json({ error: 'attributeId is required and must be a string' });
    }
    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({ error: 'answer is required and must be a string' });
    }
    if (answer.length > 500) {
      return res.status(400).json({ error: 'answer must be at most 500 characters' });
    }

    const contextRepo = getContextRepository();
    const existingAttr = await contextRepo.findById(attributeId);
    
    if (!existingAttr || existingAttr.userId !== userId) {
      return res.status(404).json({ error: 'Attribute not found for this user' });
    }

    const contextEngine = getContextEngine();
    const correction: ContextCorrection = {
      attributeId,
      correctedValue: answer.trim(),
      reason: questionText || 'User clarification via prompt'
    };

    const updatedContext = await contextEngine.correctContext(userId, correction);
    return res.json(updatedContext);
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
});
