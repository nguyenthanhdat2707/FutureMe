import type { CalendarEvent, PersonalContext } from '../types/domain';

export type EventCategory = 'deep_work' | 'meeting' | 'deadline' | 'recovery' | 'other';
export type WorkloadCategory = 'deep_work' | 'meeting' | 'other';

export interface EventMetadata {
  category: EventCategory;
  meetingLink?: string;
}

export interface DashboardRange {
  min: Date;
  max: Date;
  visibleDays: Date[];
}

export interface WorkloadSlice {
  category: WorkloadCategory;
  hours: number;
  percentage: number;
}

export interface DashboardDeadline {
  id: string;
  title: string;
  deadline: Date;
  urgency: 'today' | 'tomorrow' | 'this week';
  kind: 'commitment' | 'goal';
  priority: 'high' | 'medium';
}

export interface SmartSuggestion {
  id: string;
  title: string;
  explanation: string;
  actionLabel: 'Schedule deep work' | 'Review commitments';
  proposedTime?: Date;
}

const DAY_MS = 86_400_000;
const VALID_CATEGORIES = new Set<EventCategory>(['deep_work', 'meeting', 'deadline', 'recovery', 'other']);

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(value: Date, amount: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

export function buildDashboardRange(now: Date, dayCount = 7): DashboardRange {
  const today = startOfDay(now);
  return {
    min: addDays(today, -3),
    max: addDays(today, 10),
    visibleDays: Array.from({ length: Math.min(14, Math.max(1, dayCount)) }, (_, index) => addDays(today, index)),
  };
}

export function parseEventMetadata(event: CalendarEvent): EventMetadata {
  if (!event.rawData) return { category: 'other', meetingLink: undefined };
  try {
    const parsed: unknown = JSON.parse(event.rawData);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { category: 'other', meetingLink: undefined };
    const record = parsed as Record<string, unknown>;
    const category = typeof record.category === 'string' && VALID_CATEGORIES.has(record.category as EventCategory)
      ? record.category as EventCategory
      : 'other';
    const meetingLink = typeof record.meetingLink === 'string' && /^https:\/\//.test(record.meetingLink)
      ? record.meetingLink
      : undefined;
    return { category, meetingLink };
  } catch {
    return { category: 'other', meetingLink: undefined };
  }
}

export function filterEventsToRange(events: CalendarEvent[], start: Date, end: Date): CalendarEvent[] {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return events
    .filter((event) => new Date(event.endTime).getTime() > startTime && new Date(event.startTime).getTime() < endTime)
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
}

export function calculateWorkload(events: CalendarEvent[]): WorkloadSlice[] {
  const hours: Record<WorkloadCategory, number> = { deep_work: 0, meeting: 0, other: 0 };
  for (const event of events) {
    const duration = Math.max(0, new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 3_600_000;
    const category = parseEventMetadata(event).category;
    const bucket: WorkloadCategory = category === 'deep_work' || category === 'meeting' ? category : 'other';
    hours[bucket] += duration;
  }

  const total = hours.deep_work + hours.meeting + hours.other;
  const categories: WorkloadCategory[] = ['deep_work', 'meeting', 'other'];
  let allocated = 0;
  return categories.map((category, index) => {
    const percentage = total === 0 ? 0 : index === categories.length - 1
      ? 100 - allocated
      : Math.round((hours[category] / total) * 100);
    allocated += percentage;
    return { category, hours: Number(hours[category].toFixed(1)), percentage };
  });
}

function dayDistance(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function buildDeadlines(context: PersonalContext | null, now: Date): DashboardDeadline[] {
  if (!context) return [];
  const end = addDays(now, 7).getTime();
  const candidates: DashboardDeadline[] = [];

  for (const commitment of context.commitments) {
    const deadline = new Date(commitment.endTime);
    if (deadline.getTime() < now.getTime() || deadline.getTime() > end) continue;
    const days = dayDistance(now, deadline);
    candidates.push({
      id: `commitment-${commitment.id}`,
      title: commitment.description,
      deadline,
      urgency: days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'this week',
      kind: 'commitment',
      priority: days <= 1 ? 'high' : 'medium',
    });
  }

  for (const goal of context.goals) {
    if (!goal.deadline) continue;
    const deadline = new Date(goal.deadline);
    if (deadline.getTime() < now.getTime() || deadline.getTime() > end) continue;
    const days = dayDistance(now, deadline);
    candidates.push({
      id: `goal-${goal.id}`,
      title: goal.description,
      deadline,
      urgency: days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'this week',
      kind: 'goal',
      priority: goal.priority === 'high' || days <= 1 ? 'high' : 'medium',
    });
  }

  return candidates.sort((left, right) => left.deadline.getTime() - right.deadline.getTime()).slice(0, 3);
}

function findOpenFocusSlot(events: CalendarEvent[], now: Date): Date | undefined {
  const today = startOfDay(now);
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(today, offset);
    const workStart = new Date(day);
    workStart.setHours(9, 0, 0, 0);
    const workEnd = new Date(day);
    workEnd.setHours(17, 0, 0, 0);
    let cursor = offset === 0 && now > workStart ? new Date(now) : workStart;
    cursor.setMinutes(Math.ceil(cursor.getMinutes() / 30) * 30, 0, 0);

    const dayEvents = events
      .filter((event) => startOfDay(new Date(event.startTime)).getTime() === day.getTime())
      .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());

    for (const event of dayEvents) {
      const eventStart = new Date(event.startTime);
      if (eventStart.getTime() - cursor.getTime() >= 90 * 60_000) return cursor;
      const eventEnd = new Date(event.endTime);
      if (eventEnd > cursor) cursor = eventEnd;
    }
    if (workEnd.getTime() - cursor.getTime() >= 90 * 60_000) return cursor;
  }
  return undefined;
}

export function buildSuggestions(events: CalendarEvent[], context: PersonalContext | null, now: Date): SmartSuggestion[] {
  const workload = calculateWorkload(events);
  const deadlines = buildDeadlines(context, now);
  const openSlot = findOpenFocusSlot(events, now);
  const preference = context?.preferences.find((item) => /focus|deep|morning/i.test(`${item.category} ${item.description} ${item.value}`));
  const suggestions: SmartSuggestion[] = [];

  if (openSlot) {
    suggestions.push({
      id: 'protect-focus-gap',
      title: 'Protect an open focus block',
      explanation: `${openSlot.toLocaleDateString(undefined, { weekday: 'long' })} has an open 90-minute gap${preference ? ' that matches your focus preference' : ''}.`,
      actionLabel: 'Schedule deep work',
      proposedTime: openSlot,
    });
  } else {
    suggestions.push({
      id: 'create-focus-gap',
      title: 'Make room for focused work',
      explanation: 'No 90-minute workday gap is open in the next seven days.',
      actionLabel: 'Review commitments',
    });
  }

  const meetings = workload.find((slice) => slice.category === 'meeting');
  const meetingReason = meetings && meetings.hours > 0
    ? `${meetings.hours} meeting hours are already planned`
    : 'Your planned calendar has limited structured focus time';
  const deadlineReason = deadlines.length > 0
    ? ` and ${deadlines.length} deadline${deadlines.length === 1 ? ' is' : 's are'} due within seven days`
    : '';
  suggestions.push({
    id: 'review-load',
    title: deadlines.length > 0 ? 'Review work before the next deadline' : 'Check the week before adding more',
    explanation: `${meetingReason}${deadlineReason}.`,
    actionLabel: 'Review commitments',
  });

  return suggestions.slice(0, 2);
}
