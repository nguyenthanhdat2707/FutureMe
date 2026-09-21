/**
 * Demo Mode Routes
 */

import { Router, Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { PersonalContextRepository } from '../repositories/personal-context.repository';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { ObservationSource } from '../domain/types';

import { getErrorMessage } from '../utils/error';

export const demoRouter = Router();

// Reset to initial demo state
demoRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const userRepo = new UserRepository();
    const userId = 'demo-user';
    
    // Create or get demo user
    let user = userRepo.findById(userId);
    if (!user) {
      user = userRepo.create({
        id: userId,
        email: 'demo@future-me.app',
        displayName: 'Demo User'
      });
    }
    
    res.json({
      success: true,
      message: 'Demo state reset',
      userId: user.id
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get current demo scenario
demoRouter.get('/state', (req: Request, res: Response) => {
  try {
    const userRepo = new UserRepository();
    const contextRepo = new PersonalContextRepository();
    const calendarRepo = new CalendarEventRepository();
    const userId = 'demo-user';
    
    const user = userRepo.findById(userId);
    const contextAttrs = contextRepo.findByUserId(userId, 10);
    const upcomingEvents = calendarRepo.findUpcoming(userId);
    
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
demoRouter.post('/seed', (req: Request, res: Response) => {
  try {
    const userRepo = new UserRepository();
    const contextRepo = new PersonalContextRepository();
    const body = req.body as { scenario?: string };
    const scenario = typeof body.scenario === 'string' ? body.scenario : 'hackathon-deadline';
    const userId = 'demo-user';
    
    // Ensure demo user exists - check by ID first, then by email
    let user = userRepo.findById(userId);
    if (!user) {
      user = userRepo.findByEmail('demo@future-me.app');
      if (!user) {
        user = userRepo.create({
          id: userId,
          email: 'demo@future-me.app',
          displayName: 'Demo User'
        });
      }
    }
    
    // Seed context based on scenario
    if (scenario === 'hackathon-deadline') {
      // Add hackathon goal
      contextRepo.create({
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
      contextRepo.create({
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
