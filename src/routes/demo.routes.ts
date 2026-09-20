/**
 * Demo Mode Routes
 */

import { Router, Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { PersonalContextRepository } from '../repositories/personal-context.repository';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { ObservationSource } from '../domain/types';

export const demoRouter = Router();

// Reset to initial demo state
demoRouter.post('/reset', async (req: Request, res: Response) => {
  try {
    const userRepo = new UserRepository();
    const userId = 'demo-user';
    
    // Create or get demo user
    let user = userRepo.findById(userId);
    if (!user) {
      user = userRepo.create({
        email: 'demo@future-me.app',
        displayName: 'Demo User'
      });
    }
    
    res.json({
      success: true,
      message: 'Demo state reset',
      userId: user.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current demo scenario
demoRouter.get('/state', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Seed specific scenario
demoRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const userRepo = new UserRepository();
    const contextRepo = new PersonalContextRepository();
    const scenario = req.body.scenario || 'hackathon-deadline';
    const userId = 'demo-user';
    
    // Ensure demo user exists - check by ID first, then by email
    let user = userRepo.findById(userId);
    if (!user) {
      user = userRepo.findByEmail('demo@future-me.app');
      if (!user) {
        user = userRepo.create({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
