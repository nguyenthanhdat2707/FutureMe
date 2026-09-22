/**
 * Demo Mode Routes
 */

import { Router, Request, Response } from 'express';
import { ObservationSource } from '../domain/types';
import { getUserRepository, getContextRepository, getCalendarEventRepository } from '../services/service-container';
import { getUserId } from '../utils/identity';

import { getErrorMessage } from '../utils/error';

export const demoRouter = Router();

// Clear data for demo user
demoRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // We would need delete methods on repositories,
    // but for now this is just a stub since it's a demo route.
    // In a real implementation we'd clear the user's data.

    res.json({ success: true, clearedUserId: userId, message: "Reset stub executed" });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get current demo scenario
demoRouter.get('/state', async (req: Request, res: Response) => {
  try {
    const userRepo = getUserRepository();
    const contextRepo = getContextRepository();
    const calendarRepo = getCalendarEventRepository();
    const userId = getUserId(req);

    const user = await userRepo.findById(userId);
    const contextAttrs = await contextRepo.findByUserId(userId, 10);
    const upcomingEvents = await calendarRepo.findUpcoming(userId);

    res.json({
      user,
      contextAttributes: contextAttrs.length,
      upcomingEvents: upcomingEvents.length,
      scenario: 'hackathon-deadline'
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Seed specific scenario
demoRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const userRepo = getUserRepository();
    const contextRepo = getContextRepository();
    const body = req.body as { scenario?: string };
    const scenario = typeof body.scenario === 'string' ? body.scenario : 'hackathon-deadline';
    const userId = getUserId(req);

    // Ensure demo user exists - check by ID first, then by email
    let user = await userRepo.findById(userId);
    if (!user) {
      user = await userRepo.findByEmail('demo@future-me.app');
      if (!user) {
        user = await userRepo.create({
          id: userId,
          email: 'demo@future-me.app',
          displayName: 'Demo User'
        });
      }
    }

    // Seed context based on scenario
    if (scenario === 'hackathon-deadline') {
      // Add hackathon goal
      await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({
          id: 'g1',
          description: 'Complete Future Me MVP',
          deadline: '2026-09-25T23:59:00Z',
          priority: 'high'
        }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: new Date()
      });

      // Add preference
      await contextRepo.create({
        userId,
        attribute: 'preference',
        value: JSON.stringify({
          id: 'p1',
          category: 'work',
          description: 'Prefer deep work blocks in morning',
          value: 'morning-focus'
        }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: new Date()
      });
    }

    res.json({
      success: true,
      scenario,
      message: `Demo scenario '${scenario}' seeded`
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
