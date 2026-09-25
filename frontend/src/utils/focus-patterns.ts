import type { CalendarEvent, PersonalContext, Preference } from '../types/domain';

export const FOCUS_HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22] as const;
export const DEMO_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export interface FocusPatternPoint {
  hour: number;
  time: string;
  focus: number;
}

function localHour(dateValue: string): number | null {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DEMO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour + minute / 60 : null;
}

function preferenceText(preferences: Preference[]): string {
  return preferences.map((preference) => JSON.stringify(preference)).join(' ').toLowerCase();
}

function eventCategory(event: CalendarEvent): string {
  try {
    const parsed = JSON.parse(event.rawData ?? '{}') as Record<string, unknown>;
    return typeof parsed.category === 'string' ? parsed.category.toLowerCase() : 'other';
  } catch {
    return 'other';
  }
}

function overlapsBucket(event: CalendarEvent, hour: number): boolean {
  const start = localHour(event.startTime);
  const end = localHour(event.endTime);
  return start !== null && end !== null && start < hour + 2 && end > hour;
}

function clampScore(value: number): number {
  return Math.max(5, Math.min(95, Math.round(value)));
}

export function buildEstimatedFocusPattern(
  context: PersonalContext,
  events: CalendarEvent[],
): FocusPatternPoint[] {
  const preferences = preferenceText(context.preferences);
  const morningPreferred = /morning|early/.test(preferences);
  const afternoonPreferred = /afternoon/.test(preferences);
  const protectEvenings = /protect-evenings|avoid late|recovery/.test(preferences);
  const fragmentationPenalty = Math.min(12, (context.calendar.busyHoursToday ?? 0) * 1.5);

  return FOCUS_HOURS.map((hour) => {
    let score = hour < 8 ? 50 : hour < 12 ? 72 : hour === 12 ? 36 : hour < 16 ? 66 : hour < 18 ? 48 : 28;
    if (morningPreferred && hour >= 8 && hour < 12) score += 18;
    if (morningPreferred && hour >= 14) score -= 8;
    if (afternoonPreferred && hour >= 13 && hour < 17) score += 16;
    if (protectEvenings && hour >= 18) score -= 12;

    const overlapping = events.filter((event) => overlapsBucket(event, hour));
    const categories = overlapping.map(eventCategory);
    score += categories.filter((category) => category === 'deep_work').length * 8;
    score -= categories.filter((category) => category === 'meeting').length * 11;
    score -= categories.filter((category) => category === 'recovery').length * 5;
    if (overlapping.length >= 2) score -= 8;
    if (hour >= 9 && hour < 17) score -= fragmentationPenalty;

    return {
      hour,
      time: `${String(hour).padStart(2, '0')}:00`,
      focus: clampScore(score),
    };
  });
}

export function bestFocusWindow(pattern: FocusPatternPoint[]): string | null {
  if (pattern.length === 0) return null;
  const best = pattern.reduce((current, candidate) => candidate.focus > current.focus ? candidate : current);
  return `${best.time}–${String((best.hour + 2) % 24).padStart(2, '0')}:00`;
}
