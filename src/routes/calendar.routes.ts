/**
 * Calendar Routes
 */

import { Router, Request, Response } from 'express';
import { getCalendarAdapter } from '../services/service-container';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';

import { getErrorMessage } from '../utils/error';

export const calendarRouter = Router();

// List calendar events
calendarRouter.get('/events', (req: Request, res: Response) => {
  try {
    const calendarRepo = new CalendarEventRepository();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'demo-user';
    const events = calendarRepo.findUpcoming(userId);
    
    res.json({ events });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Trigger sync
calendarRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const calendarRepo = new CalendarEventRepository();
    const body = req.body as { userId?: string };
    const userId = typeof body.userId === 'string' ? body.userId : 'demo-user';
    
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
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get sync status
calendarRouter.get('/status', (req: Request, res: Response) => {
  try {
    const calendarRepo = new CalendarEventRepository();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'demo-user';
    const events = calendarRepo.findByUserId(userId, 1);
    
    const lastSync = events.length > 0 ? events[0].syncedAt : null;
    
    res.json({
      lastSync,
      status: lastSync ? 'synced' : 'never'
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
