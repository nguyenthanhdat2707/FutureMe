/**
 * Calendar Adapter Interface
 */

import { CalendarEvent } from '../domain/types';

export interface ICalendarAdapter {
  syncEvents(userId: string): Promise<CalendarEvent[]>;
  getUpcomingEvents(userId: string, daysAhead: number): Promise<CalendarEvent[]>;
}
