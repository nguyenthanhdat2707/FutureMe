import {
  CalendarEventCategory,
  CommitmentFlexibility,
  CommitmentPriority,
  CommitmentConsequence,
  AttendanceRequirement,
  FocusQuality
} from '../domain/types';

export interface ParsedCalendarMetadata {
  flexibility: CommitmentFlexibility;
  priority?: CommitmentPriority;
  consequence?: CommitmentConsequence;
  category?: CalendarEventCategory;
  linkedGoalId?: string;
  attendanceRequirement?: AttendanceRequirement;
  focusQuality?: FocusQuality;
}

const VALID_FLEXIBILITY: ReadonlySet<string> = new Set<CommitmentFlexibility>(['fixed', 'movable', 'optional']);
const VALID_PRIORITY: ReadonlySet<string> = new Set<CommitmentPriority>(['low', 'medium', 'high']);
const VALID_CONSEQUENCE: ReadonlySet<string> = new Set<CommitmentConsequence>(['low', 'medium', 'high']);
const VALID_CATEGORY: ReadonlySet<string> = new Set<CalendarEventCategory>(['deep_work', 'meeting', 'deadline', 'recovery', 'other']);
const VALID_ATTENDANCE: ReadonlySet<string> = new Set<AttendanceRequirement>(['required', 'optional', 'unknown']);
const VALID_FOCUS_QUALITY: ReadonlySet<string> = new Set<FocusQuality>(['high', 'medium', 'low']);

function normalizedEnumValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value.toLowerCase() : undefined;
}

export function parseCalendarEventMetadata(rawData?: string | null): ParsedCalendarMetadata {
  const result: ParsedCalendarMetadata = {
    flexibility: 'fixed'
  };

  if (!rawData || typeof rawData !== 'string') {
    return result;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData);
  } catch {
    return result;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return result;
  }

  const record = parsed as Record<string, unknown>;

  const flexibility = normalizedEnumValue(record.flexibility);
  const priority = normalizedEnumValue(record.priority);
  const consequence = normalizedEnumValue(record.consequence);
  const category = normalizedEnumValue(record.category);
  const attendanceRequirement = normalizedEnumValue(record.attendanceRequirement);
  const focusQuality = normalizedEnumValue(record.focusQuality);

  if (flexibility && VALID_FLEXIBILITY.has(flexibility)) {
    result.flexibility = flexibility as CommitmentFlexibility;
  }

  if (priority && VALID_PRIORITY.has(priority)) {
    result.priority = priority as CommitmentPriority;
  }

  if (consequence && VALID_CONSEQUENCE.has(consequence)) {
    result.consequence = consequence as CommitmentConsequence;
  }

  if (category && VALID_CATEGORY.has(category)) {
    result.category = category as CalendarEventCategory;
  }

  const rawGoalId = typeof record.linkedGoalId === 'string'
    ? record.linkedGoalId
    : (typeof record.goalId === 'string' ? record.goalId : undefined);
  if (rawGoalId && rawGoalId.trim().length > 0) {
    result.linkedGoalId = rawGoalId.trim();
  }

  if (attendanceRequirement && VALID_ATTENDANCE.has(attendanceRequirement)) {
    result.attendanceRequirement = attendanceRequirement as AttendanceRequirement;
  }

  if (focusQuality && VALID_FOCUS_QUALITY.has(focusQuality)) {
    result.focusQuality = focusQuality as FocusQuality;
  }

  return result;
}
