import { describe, expect, it } from 'vitest';
import { demoLocalDateTimeToIso, formatDemoTime, nextDemoDayAt } from './demo-time';

describe('demo timezone', () => {
  it('creates next-day schedule instants at the intended Vietnam wall time', () => {
    const now = new Date('2026-09-25T16:30:00.000Z'); // 23:30 in Vietnam
    const scheduled = nextDemoDayAt(9, 0, now);

    expect(scheduled.toISOString()).toBe('2026-09-26T02:00:00.000Z');
    expect(formatDemoTime(scheduled, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })).toBe('09:00');
  });

  it('converts datetime-local values from Vietnam wall time without using the runtime timezone', () => {
    expect(demoLocalDateTimeToIso('2026-09-23T09:00')).toBe('2026-09-23T02:00:00.000Z');
    expect(demoLocalDateTimeToIso('2026-09-23T10:00:30')).toBe('2026-09-23T03:00:30.000Z');
    expect(() => demoLocalDateTimeToIso('2026-02-30T09:00')).toThrow('Invalid demo date and time');
  });
});
