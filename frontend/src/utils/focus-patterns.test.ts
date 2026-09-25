import { describe, expect, it } from 'vitest';
import { ObservationSource, type CalendarEvent, type PersonalContext, type Preference } from '../types/domain';
import { bestFocusWindow, buildEstimatedFocusPattern } from './focus-patterns';

function context(preference: Preference, busyHoursToday = 2): PersonalContext {
  return {
    userId: 'demo',
    setupCompleted: true,
    goals: [],
    commitments: [],
    preferences: [preference],
    calendar: {
      status: 'synced',
      lastSync: '2026-09-25T00:00:00.000Z',
      upcomingEvents: 1,
      busyHoursToday,
      busyHoursThisWeek: 8,
    },
    recentDecisions: [],
    lastUpdated: '2026-09-25T00:00:00.000Z',
  };
}

const morningPreference: Preference = {
  id: 'focus',
  category: 'work',
  description: 'Strongest focus conditions are in the morning',
  value: 'morning',
};

function event(category: string, startTime: string, endTime: string): CalendarEvent {
  return {
    id: `${category}-${startTime}`,
    title: category,
    startTime,
    endTime,
    source: ObservationSource.CALENDAR,
    rawData: JSON.stringify({ category }),
  };
}

describe('estimated focus patterns', () => {
  it('is deterministic and uses Asia/Ho_Chi_Minh schedule hours', () => {
    const events = [
      event('deep_work', '2026-09-25T02:00:00.000Z', '2026-09-25T04:00:00.000Z'),
      event('meeting', '2026-09-25T07:00:00.000Z', '2026-09-25T09:00:00.000Z'),
    ];

    const first = buildEstimatedFocusPattern(context(morningPreference), events);
    const second = buildEstimatedFocusPattern(context(morningPreference), events);

    expect(second).toEqual(first);
    expect(first.find((point) => point.hour === 10)?.focus).toBeGreaterThan(
      first.find((point) => point.hour === 14)?.focus ?? 100,
    );
    expect(bestFocusWindow(first)).toMatch(/^\d{2}:00–\d{2}:00$/);
  });

  it('produces persona-specific output from preferences and fragmentation', () => {
    const afternoonPreference: Preference = {
      id: 'focus',
      category: 'work',
      description: 'Protect open afternoons for writing',
      value: 'afternoon',
    };

    const morning = buildEstimatedFocusPattern(context(morningPreference, 1), []);
    const afternoon = buildEstimatedFocusPattern(context(afternoonPreference, 6), []);

    expect(morning).not.toEqual(afternoon);
    expect(morning.find((point) => point.hour === 10)?.focus).toBeGreaterThan(
      afternoon.find((point) => point.hour === 10)?.focus ?? 100,
    );
  });
});
