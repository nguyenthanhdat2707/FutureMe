/**
 * Calendar Routes
 */

import { Router, Request, Response } from 'express';
import { getCalendarAdapter } from '../services/service-container';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';

export const calendarRouter = Router();

// List calendar events
calendarRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const calendarRepo = new CalendarEventRepository();
    const userId = req.query.userId as string || 'demo-user';
    const events = calendarRepo.findUpcoming(userId);
    
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger sync
calendarRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const calendarRepo = new CalendarEventRepository();
    const userId = req.body.userId || 'demo-user';
    
    const adapter = getCalendarAdapter();
    const events = await adapter.syncEvents(userId);
    
    // Store events
    for (const event of events) {
      calendarRepo.upsert(event);
    }
    
    res.json({
      success: true,
      synced: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get sync status
calendarRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const calendarRepo = new CalendarEventRepository();
    const userId = req.query.userId as string || 'demo-user';
    const events = calendarRepo.findByUserId(userId, 1);
    
    const lastSync = events.length > 0 ? events[0].syncedAt : null;
    
    res.json({
      lastSync,
      status: lastSync ? 'synced' : 'never'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
