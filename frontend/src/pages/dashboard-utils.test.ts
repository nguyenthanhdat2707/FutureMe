import { describe, expect, it } from 'vitest';
import type { CalendarEvent, PersonalContext } from '../types/domain';
import { ObservationSource } from '../types/domain';
import {
  buildDashboardRange,
  buildDeadlines,
  buildSuggestions,
  calculateWorkload,
  computeEventLanes,
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
      { category: 'recovery', hours: 1, percentage: 20 },
    ]);
  });

  it('ignores deadline, other, and malformed metadata in workload allocation to preserve truth', () => {
    const workload = calculateWorkload([
      event('Deadline Task', 0, 9, 11, 'deadline'),
      event('Random Other', 0, 11, 13, 'other'),
      { ...event('Broken', 0, 13, 15, 'recovery'), rawData: 'not valid json' },
    ]);
    expect(workload).toEqual([
      { category: 'deep_work', hours: 0, percentage: 0 },
      { category: 'meeting', hours: 0, percentage: 0 },
      { category: 'recovery', hours: 0, percentage: 0 },
    ]);
  });

  it('assigns deterministic lanes to concurrent events on the same day', () => {
    const day = new Date(2026, 8, 24);
    const dayEvents = [
      event('Event-1', 0, 10, 12, 'deep_work'),
      event('Event-2', 0, 11, 13, 'meeting'),
      event('Event-3', 0, 14, 15, 'recovery'),
    ];
    const lanes = computeEventLanes(dayEvents, day);

    expect(lanes.get('Event-1')).toEqual({
      lane: 0,
      totalLanes: 2,
      visibleStart: new Date(2026, 8, 24, 10).getTime(),
      visibleEnd: new Date(2026, 8, 24, 12).getTime(),
    });
    expect(lanes.get('Event-2')).toEqual({
      lane: 1,
      totalLanes: 2,
      visibleStart: new Date(2026, 8, 24, 11).getTime(),
      visibleEnd: new Date(2026, 8, 24, 13).getTime(),
    });
    expect(lanes.get('Event-3')).toEqual({
      lane: 0,
      totalLanes: 1,
      visibleStart: new Date(2026, 8, 24, 14).getTime(),
      visibleEnd: new Date(2026, 8, 24, 15).getTime(),
    });
  });

  it('combines commitments and goals due within seven days with urgency labels', () => {
    const deadlines = buildDeadlines(context, new Date(2026, 8, 24, 8));
    expect(deadlines.map((deadline) => deadline.title)).toEqual(['Demo review', 'Ship dashboard']);
    expect(deadlines[0].urgency).toBe('tomorrow');
    expect(deadlines[1].urgency).toBe('this week');
  });

  it('includes active overdue items with overdue urgency in the current week but keeps future weeks range-relevant', () => {
    const contextWithOverdue: PersonalContext = {
      ...context,
      goals: [
        { id: 'overdue-goal', description: 'Past due report', deadline: atLocalTime(-2, 17), priority: 'medium' },
        { id: 'future-goal', description: 'Next week launch', deadline: atLocalTime(8, 17), priority: 'high' },
      ],
      commitments: [
        { id: 'upcoming-commitment', description: 'Current week demo', startTime: atLocalTime(1, 10), endTime: atLocalTime(1, 11) },
      ],
    };

    const currentWeekStart = new Date(2026, 8, 21);
    const now = new Date(2026, 8, 24, 10);
    const currentWeekDeadlines = buildDeadlines(contextWithOverdue, currentWeekStart, now);

    expect(currentWeekDeadlines.map((d) => d.title)).toEqual(['Past due report', 'Current week demo']);
    expect(currentWeekDeadlines[0].urgency).toBe('overdue');
    expect(currentWeekDeadlines[0].priority).toBe('high');
    expect(currentWeekDeadlines[1].urgency).toBe('tomorrow');

    const nextWeekStart = new Date(2026, 8, 28);
    const nextWeekDeadlines = buildDeadlines(contextWithOverdue, nextWeekStart, now);

    expect(nextWeekDeadlines.map((d) => d.title)).toEqual(['Next week launch']);
    expect(nextWeekDeadlines.find((d) => d.title === 'Past due report')).toBeUndefined();
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
