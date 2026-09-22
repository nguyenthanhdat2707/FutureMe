/**
 * Calendar Routes
 */

import { Router, Request, Response } from 'express';
import { getCalendarAdapter, getCalendarEventRepository } from '../services/service-container';
import { getUserId } from '../utils/identity';

import { getErrorMessage } from '../utils/error';

export const calendarRouter = Router();

// List calendar events
calendarRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const calendarRepo = getCalendarEventRepository();
    const userId = getUserId(req);
    const events = await calendarRepo.findUpcoming(userId);
    
    res.json({ events });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Trigger sync
calendarRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const calendarRepo = getCalendarEventRepository();
    const userId = getUserId(req);
    
    const adapter = getCalendarAdapter();
    const events = await adapter.syncEvents(userId);
    
    // Store events
    for (const event of events) {
      await calendarRepo.upsert(event);
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
calendarRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const calendarRepo = getCalendarEventRepository();
    const userId = getUserId(req);
    const events = await calendarRepo.findByUserId(userId, 1);
    
    const lastSync = events.length > 0 ? events[0].syncedAt : null;
    
    res.json({
      lastSync,
      status: lastSync ? 'synced' : 'never'
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
