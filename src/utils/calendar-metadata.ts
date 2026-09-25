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

  if (typeof record.flexibility === 'string' && VALID_FLEXIBILITY.has(record.flexibility)) {
    result.flexibility = record.flexibility as CommitmentFlexibility;
  }

  if (typeof record.priority === 'string' && VALID_PRIORITY.has(record.priority)) {
    result.priority = record.priority as CommitmentPriority;
  }

  if (typeof record.consequence === 'string' && VALID_CONSEQUENCE.has(record.consequence)) {
    result.consequence = record.consequence as CommitmentConsequence;
  }

  if (typeof record.category === 'string' && VALID_CATEGORY.has(record.category)) {
    result.category = record.category as CalendarEventCategory;
  }

  const rawGoalId = typeof record.linkedGoalId === 'string'
    ? record.linkedGoalId
    : (typeof record.goalId === 'string' ? record.goalId : undefined);
  if (rawGoalId && rawGoalId.trim().length > 0) {
    result.linkedGoalId = rawGoalId.trim();
  }

  if (typeof record.attendanceRequirement === 'string' && VALID_ATTENDANCE.has(record.attendanceRequirement)) {
    result.attendanceRequirement = record.attendanceRequirement as AttendanceRequirement;
  }

  if (typeof record.focusQuality === 'string' && VALID_FOCUS_QUALITY.has(record.focusQuality)) {
    result.focusQuality = record.focusQuality as FocusQuality;
  }

  return result;
}
