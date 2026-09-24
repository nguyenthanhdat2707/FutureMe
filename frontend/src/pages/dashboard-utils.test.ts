import { describe, expect, it } from 'vitest';
import type { CalendarEvent, PersonalContext } from '../types/domain';
import { ObservationSource } from '../types/domain';
import {
  buildDashboardRange,
  buildDeadlines,
  buildSuggestions,
  calculateWorkload,
  parseEventMetadata,
} from './dashboard-utils';

const atLocalTime = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date(2026, 8, 24 + dayOffset, hour, minute, 0, 0);
  return date.toISOString();
};

const event = (
  id: string,
  dayOffset: number,
  startHour: number,
  endHour: number,
  category: string,
): CalendarEvent => ({
  id,
  title: id,
  startTime: atLocalTime(dayOffset, startHour),
  endTime: atLocalTime(dayOffset, endHour),
  source: ObservationSource.CALENDAR,
  rawData: JSON.stringify({ category, meetingLink: category === 'meeting' ? 'https://meet.example.test/room' : undefined }),
});

const context: PersonalContext = {
  userId: 'demo',
  setupCompleted: true,
  goals: [{ id: 'goal', description: 'Ship dashboard', deadline: atLocalTime(2, 17), priority: 'high' }],
  commitments: [{ id: 'commitment', description: 'Demo review', startTime: atLocalTime(1, 15), endTime: atLocalTime(1, 16) }],
  preferences: [{ id: 'preference', category: 'work', description: 'Best focus time', value: 'morning deep work' }],
  calendar: { status: 'synced', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
  recentDecisions: [],
  lastUpdated: atLocalTime(0, 8),
};

describe('dashboard data derivation', () => {
  it('creates a bounded range and defaults to seven consecutive days starting today', () => {
    const range = buildDashboardRange(new Date(2026, 8, 24, 14));
    expect(range.min).toEqual(new Date(2026, 8, 21));
    expect(range.max).toEqual(new Date(2026, 9, 4));
    expect(range.visibleDays).toHaveLength(7);
    expect(range.visibleDays[0]).toEqual(new Date(2026, 8, 24));
    expect(range.visibleDays[6]).toEqual(new Date(2026, 8, 30));
  });

  it('reads category and meeting link from rawData without guessing', () => {
    expect(parseEventMetadata(event('Meet', 0, 10, 11, 'meeting'))).toEqual({
      category: 'meeting',
      meetingLink: 'https://meet.example.test/room',
    });
    expect(parseEventMetadata({ ...event('Unknown', 0, 10, 11, 'meeting'), rawData: '{bad json' })).toEqual({
      category: 'other',
      meetingLink: undefined,
    });
  });

  it('calculates workload hours and percentages from bounded event durations', () => {
    const workload = calculateWorkload([
      event('Focus', 0, 9, 12, 'deep_work'),
      event('Meet', 0, 13, 14, 'meeting'),
      event('Recover', 0, 16, 17, 'recovery'),
    ]);
    expect(workload).toEqual([
      { category: 'deep_work', hours: 3, percentage: 60 },
      { category: 'meeting', hours: 1, percentage: 20 },
      { category: 'other', hours: 1, percentage: 20 },
    ]);
  });

  it('combines commitments and goals due within seven days with urgency labels', () => {
    const deadlines = buildDeadlines(context, new Date(2026, 8, 24, 8));
    expect(deadlines.map((deadline) => deadline.title)).toEqual(['Demo review', 'Ship dashboard']);
    expect(deadlines[0].urgency).toBe('tomorrow');
    expect(deadlines[1].urgency).toBe('this week');
  });

  it('produces at least two deterministic, explained suggestions from gaps, workload, deadlines, and preferences', () => {
    const events = [event('Meet', 0, 10, 12, 'meeting'), event('Focus', 1, 9, 10, 'deep_work')];
    const suggestions = buildSuggestions(events, context, new Date(2026, 8, 24, 8));
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].actionLabel).toBe('Schedule deep work');
    expect(suggestions[0].explanation).toMatch(/open|gap/i);
    expect(suggestions[1].actionLabel).toBe('Review commitments');
    expect(suggestions[1].explanation).toMatch(/deadline|meeting|planned/i);
    expect(buildSuggestions(events, context, new Date(2026, 8, 24, 8))).toEqual(suggestions);
  });
});
