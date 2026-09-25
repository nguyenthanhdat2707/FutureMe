/**
 * Mock Calendar Adapter
 * Used when Google Calendar credentials not available.
 * Events use a rolling horizon from the current local day so the mock remains
 * useful on every weekday instead of expiring near the end of a calendar week.
 */

import { ICalendarAdapter } from './calendar-adapter.interface';
import { CalendarEvent } from '../domain/types';

export class MockCalendarAdapter implements ICalendarAdapter {
  syncEvents(userId: string): Promise<CalendarEvent[]> {
    console.log('[MockCalendarAdapter] Syncing events for user:', userId);

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const makeEvent = (
      dayOffset: number,
      startHour: number,
      durationHours: number,
      title: string,
      category: string,
    ): Omit<CalendarEvent, 'id' | 'createdAt'> => {
      const start = new Date(dayStart);
      start.setDate(start.getDate() + dayOffset);
      start.setHours(startHour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(startHour + Math.floor(durationHours));
      end.setMinutes((durationHours % 1) * 60);
      return {
        userId,
        externalId: `mock-${title.toLowerCase().replace(/\s+/g, '-')}-day${dayOffset}`,
        title,
        startTime: start,
        endTime: end,
        status: 'confirmed',
        rawData: JSON.stringify({
          mock: true,
          category,
          flexibility: category === 'meeting' ? 'MOVABLE' : 'FIXED',
          priority: category === 'deep_work' ? 'HIGH' : 'MEDIUM',
          consequence: category === 'deep_work' ? 'HIGH' : 'MEDIUM',
          origin: 'RUNTIME',
          confidence: 1,
        }),
        syncedAt: now,
      };
    };

    const mockEvents = [
      makeEvent(0, 9, 2, 'Deep Work', 'deep_work'),
      makeEvent(1, 9, 0.5, 'Team Standup', 'meeting'),
      makeEvent(1, 14, 1, 'Project Review', 'meeting'),
      makeEvent(2, 9, 2, 'Deep Work', 'deep_work'),
      makeEvent(3, 10, 1, 'Weekly Sync', 'meeting'),
      makeEvent(4, 9, 1, 'Sprint Review', 'meeting'),
    ];

    return Promise.resolve(mockEvents as CalendarEvent[]);
  }

  async getUpcomingEvents(userId: string, daysAhead: number): Promise<CalendarEvent[]> {
    console.log('[MockCalendarAdapter] Getting upcoming events for user:', userId);

    const allEvents = await this.syncEvents(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return allEvents.filter(e => e.startTime < cutoff);
  }
}
