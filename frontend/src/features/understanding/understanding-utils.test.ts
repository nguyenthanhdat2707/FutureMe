import { describe, it, expect } from 'vitest';
import {
  calculateCategoryBreakdown,
  deriveLearnedInsights,
  computeLineChartLayout,
  formatShortDate,
  formatRelativeDate,
} from './understanding-utils';
import type { PersonalContext, UnderstandingHistoryResponse } from '../../types/domain';
import { ObservationSource } from '../../types/domain';

describe('understanding-utils', () => {
  describe('calculateCategoryBreakdown', () => {
    it('returns empty breakdown for null context without history', () => {
      const result = calculateCategoryBreakdown(null);
      expect(result.isEmpty).toBe(true);
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('returns empty breakdown when all categories are empty', () => {
      const mockContext: PersonalContext = {
        userId: 'u1',
        setupCompleted: true,
        goals: [],
        commitments: [],
        preferences: [],
        calendar: { status: 'synced', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: new Date().toISOString(),
      };
      const result = calculateCategoryBreakdown(mockContext);
      expect(result.isEmpty).toBe(true);
      expect(result.total).toBe(0);
      expect(result.items.every((it) => it.count === 0)).toBe(true);
    });

    it('computes 4 count bars (Goals, Commitments, Preferences, Decisions) without percentages', () => {
      const mockContext: PersonalContext = {
        userId: 'u1',
        setupCompleted: true,
        goals: [
          { id: 'g1', description: 'Goal 1', priority: 'high' },
          { id: 'g2', description: 'Goal 2', priority: 'medium' },
        ],
        commitments: [
          { id: 'c1', description: 'Commitment 1', startTime: '', endTime: '' },
        ],
        preferences: [
          { id: 'p1', category: 'work', description: 'Pref 1', value: 'morning' },
        ],
        calendar: { status: 'synced', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [
          { id: 'd1', userId: 'u1', question: 'Q1', timestamp: '' },
        ],
        lastUpdated: new Date().toISOString(),
      };

      const result = calculateCategoryBreakdown(mockContext);
      expect(result.isEmpty).toBe(false);
      expect(result.total).toBe(5);
      expect(result.items.length).toBe(4);

      const goalsItem = result.items.find((i) => i.id === 'goals');
      const commItem = result.items.find((i) => i.id === 'commitments');
      const prefItem = result.items.find((i) => i.id === 'preferences');
      const decItem = result.items.find((i) => i.id === 'decisions');

      expect(goalsItem?.count).toBe(2);
      expect(commItem?.count).toBe(1);
      expect(prefItem?.count).toBe(1);
      expect(decItem?.count).toBe(1);

      // Verify absence of percentage properties
      expect((goalsItem as unknown as Record<string, unknown>).percentage).toBeUndefined();
      expect((commItem as unknown as Record<string, unknown>).percentage).toBeUndefined();
      expect((prefItem as unknown as Record<string, unknown>).percentage).toBeUndefined();
      expect((decItem as unknown as Record<string, unknown>).percentage).toBeUndefined();
    });

    it('derives Decisions count from latest returned history point when available', () => {
      const mockContext: PersonalContext = {
        userId: 'u1',
        setupCompleted: true,
        goals: [],
        commitments: [],
        preferences: [],
        calendar: { status: 'synced', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [
          { id: 'd1', userId: 'u1', question: 'Old Q', timestamp: '' },
        ],
        lastUpdated: new Date().toISOString(),
      };

      const mockHistory: UnderstandingHistoryResponse = {
        days: 30,
        hasHistory: true,
        points: [
          { date: '2026-09-01', goals: 0, commitments: 0, preferences: 0, decisions: 1, changes: [] },
          { date: '2026-09-25', goals: 0, commitments: 0, preferences: 0, decisions: 5, changes: [] },
        ],
      };

      const result = calculateCategoryBreakdown(mockContext, mockHistory);
      const decItem = result.items.find((i) => i.id === 'decisions');
      expect(decItem?.count).toBe(5);
    });
  });

  describe('deriveLearnedInsights', () => {
    it('returns empty array when context is null and history is empty', () => {
      expect(deriveLearnedInsights(null, null)).toEqual([]);
    });

    it('generates deterministic summaries with truthful source labels', () => {
      const mockContext: PersonalContext = {
        userId: 'u1',
        setupCompleted: true,
        goals: [
          { id: 'g1', description: 'Goal 1', priority: 'high', source: ObservationSource.USER_CONFIRMED },
        ],
        commitments: [
          { id: 'c1', description: 'Sync', startTime: '', endTime: '', source: ObservationSource.CALENDAR },
        ],
        preferences: [
          { id: 'p1', category: 'schedule', description: 'Morning work', value: 'early', source: ObservationSource.SYSTEM_INFERRED },
        ],
        calendar: { status: 'synced', lastSync: null, upcomingEvents: 1, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: new Date().toISOString(),
      };

      const insights = deriveLearnedInsights(mockContext, null);
      expect(insights.length).toBeLessThanOrEqual(3);

      const goalInsight = insights.find((i) => i.category === 'goals');
      expect(goalInsight?.title).toContain('1 Active Goal Tracked');
      expect(goalInsight?.sourceLabel).toBe('User confirmed');

      const commInsight = insights.find((i) => i.category === 'commitments');
      expect(commInsight?.title).toContain('1 Active Commitment');
      expect(commInsight?.sourceLabel).toBe('From Calendar');

      const prefInsight = insights.find((i) => i.category === 'preferences');
      expect(prefInsight?.detail).toContain('schedule');
      expect(prefInsight?.sourceLabel).toBe('Inferred');
    });

    it('explains expiry changes without mislabeling non-calendar context as commitments', () => {
      const mockContext: PersonalContext = {
        userId: 'u1',
        setupCompleted: true,
        goals: [],
        commitments: [],
        preferences: [],
        calendar: { status: 'synced', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: new Date().toISOString(),
      };

      const mockHistory: UnderstandingHistoryResponse = {
        days: 30,
        hasHistory: true,
        points: [
          {
            date: '2026-09-20',
            goals: 2,
            commitments: 1,
            preferences: 1,
            decisions: 1,
            changes: [
              { id: 'p1', category: 'preferences', direction: 'expired', label: 'Old focus preference', source: 'USER_CONFIRMED' },
            ],
          },
        ],
      };

      const insights = deriveLearnedInsights(mockContext, mockHistory);
      const expiryInsight = insights.find((i) => i.category === 'lifecycle');
      expect(expiryInsight).toBeDefined();
      expect(expiryInsight?.title).toBe('1 Context Record Expired Naturally');
      expect(expiryInsight?.detail).toContain('A previously valid context record reached its validity boundary');
      expect(expiryInsight?.sourceLabel).toBe('User confirmed');
      expect(expiryInsight?.sourceLabel).not.toBe('From Calendar');
    });
  });

  describe('computeLineChartLayout', () => {
    it('returns valid layout for empty points without throwing', () => {
      const layout = computeLineChartLayout([]);
      expect(layout.series).toEqual([]);
      expect(layout.maxValue).toBe(1);
    });

    it('computes 4 independent series (Goals, Commitments, Preferences, Decisions) and limits X ticks to max 4', () => {
      const points = [
        { date: '2026-09-01', goals: 2, commitments: 1, preferences: 1, decisions: 0, changes: [] },
        { date: '2026-09-05', goals: 2, commitments: 1, preferences: 2, decisions: 0, changes: [] },
        { date: '2026-09-10', goals: 3, commitments: 2, preferences: 2, decisions: 1, changes: [] },
        { date: '2026-09-15', goals: 3, commitments: 2, preferences: 3, decisions: 2, changes: [] },
        { date: '2026-09-20', goals: 4, commitments: 3, preferences: 3, decisions: 2, changes: [] },
        { date: '2026-09-25', goals: 4, commitments: 3, preferences: 4, decisions: 3, changes: [] },
      ];

      const layout = computeLineChartLayout(points, 600, 240);
      expect(layout.series.length).toBe(4);
      expect(layout.series.map((s) => s.name)).toEqual(['Goals', 'Commitments', 'Preferences', 'Decisions']);
      expect(layout.xTicks.length).toBeLessThanOrEqual(4);

      const prefSeries = layout.series.find((s) => s.name === 'Preferences')!;
      expect(prefSeries.points.length).toBe(6);
      expect(prefSeries.points[0]?.value).toBe(1);
      expect(prefSeries.points[5]?.value).toBe(4);
      expect(prefSeries.pathD).toMatch(/^M /);
    });
  });

  describe('formatting helpers', () => {
    it('formats short dates correctly', () => {
      expect(formatShortDate('2026-09-24')).toBe('Sep 24');
      expect(formatShortDate('2026-01-05')).toBe('Jan 5');
    });

    it('formats relative date correctly', () => {
      expect(formatRelativeDate(null)).toBe('Recently');
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(formatRelativeDate(fiveMinsAgo)).toBe('5m ago');
    });
  });
});
