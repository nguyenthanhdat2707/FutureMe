/**
 * Calendar Routes
 */

import { Router, Request, Response } from 'express';
import { getCalendarAdapter, getCalendarEventRepository, getContextRepository } from '../services/service-container';
import { ObservationSource } from '../domain/types';
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
    const contextRepo = getContextRepository();
    const userId = getUserId(req);

    const adapter = getCalendarAdapter();
    const events = await adapter.syncEvents(userId);

    // Store events
    for (const event of events) {
      await calendarRepo.upsert(event);
    }

    const now = new Date();
    await contextRepo.create({
      userId,
      attribute: 'calendar_last_sync',
      value: JSON.stringify(now.toISOString()),
      source: ObservationSource.SYSTEM_OBSERVED,
      confidence: 1.0,
      observedAt: now
    });

    res.json({
      success: true,
      synced: events.length,
      timestamp: now.toISOString()
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get sync status
calendarRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const calendarRepo = getCalendarEventRepository();
    const contextRepo = getContextRepository();
    const userId = getUserId(req);

    const attrs = await contextRepo.findByUserId(userId, 100);
    // Sort descending by observedAt to get latest
    const syncMarkers = attrs
      .filter(a => a.attribute === 'calendar_last_sync')
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());

    let lastSync: Date | null = null;
    if (syncMarkers.length > 0) {
      try {
        const parsed = JSON.parse(syncMarkers[0].value) as string | number;
        const parsedDate = new Date(parsed);
        if (!isNaN(parsedDate.getTime())) {
          lastSync = parsedDate;
        }
      } catch {
        // Fallback
      }
    }

    if (!lastSync) {
      const events = await calendarRepo.findByUserId(userId, 1);
      lastSync = events.length > 0 ? events[0].syncedAt : null;
    }

    res.json({
      lastSync,
      status: lastSync ? 'synced' : 'never'
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
