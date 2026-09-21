/**
 * Mock Calendar Adapter
 * Used when Google Calendar credentials not available
 */

import { ICalendarAdapter } from './calendar-adapter.interface';
import { CalendarEvent } from '../domain/types';

export class MockCalendarAdapter implements ICalendarAdapter {
  syncEvents(userId: string): Promise<CalendarEvent[]> {
    console.log('[MockCalendarAdapter] Syncing events for user:', userId);
    
    // Return mock events for demo
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mockEvents: Omit<CalendarEvent, 'id' | 'createdAt'>[] = [
      {
        userId,
        externalId: 'mock-event-1',
        title: 'Team Standup',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
        status: 'confirmed',
        rawData: JSON.stringify({ mock: true }),
        syncedAt: now
      },
      {
        userId,
        externalId: 'mock-event-2',
        title: 'Project Review',
        startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        status: 'confirmed',
        rawData: JSON.stringify({ mock: true }),
        syncedAt: now
      },
      {
        userId,
        externalId: 'mock-event-3',
        title: 'Hackathon Deep Work',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
        status: 'confirmed',
        rawData: JSON.stringify({ mock: true }),
        syncedAt: now
      }
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
