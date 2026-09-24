/**
 * Understanding History Derivation Service
 * Pure helper for deriving historical points and change logs for the Understanding Evolution chart
 */

import { ContextAttribute, Decision } from '../domain/types';
import { safeJsonParse } from '../utils/json';

export type HistoryChangeCategory = 'goals' | 'commitments' | 'preferences' | 'decisions';
export type HistoryChangeDirection = 'added' | 'expired';

export interface HistoryChange {
  id: string;
  category: HistoryChangeCategory;
  direction: HistoryChangeDirection;
  label: string;
  source: string;
}

export interface UnderstandingHistoryPoint {
  date: string; // YYYY-MM-DD
  goals: number;
  commitments: number;
  preferences: number;
  decisions: number;
  changes: HistoryChange[];
}

export interface UnderstandingHistoryResponse {
  days: 7 | 30 | 90;
  points: UnderstandingHistoryPoint[];
  hasHistory: boolean;
}

export interface HistoryDerivationOptions {
  days?: number;
  now?: Date;
}

function resolveCategory(attribute: string): 'goals' | 'commitments' | 'preferences' | null {
  const lower = attribute.toLowerCase().trim();
  if (lower === 'goal' || lower.startsWith('goal:') || lower === 'goals' || lower.startsWith('goals:')) {
    return 'goals';
  }
  if (lower === 'commitment' || lower.startsWith('commitment:') || lower === 'commitments' || lower.startsWith('commitments:')) {
    return 'commitments';
  }
  if (lower === 'preference' || lower.startsWith('preference:') || lower === 'preferences' || lower.startsWith('preferences:')) {
    return 'preferences';
  }
  return null;
}

function extractLabel(attr: ContextAttribute): string {
  try {
    const parsed = typeof attr.value === 'string' ? safeJsonParse(attr.value) : attr.value;
    if (parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>;
      if (typeof p.description === 'string' && p.description.trim().length > 0) {
        return p.description.trim();
      }
      if (typeof p.title === 'string' && p.title.trim().length > 0) {
        return p.title.trim();
      }
      if (typeof p.value === 'string' && p.value.trim().length > 0) {
        return p.value.trim();
      }
    } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
      return parsed.trim();
    }
  } catch {
    // fallback
  }
  return attr.attribute;
}

function toDate(d: Date | string | number | undefined): Date | undefined {
  if (d === undefined || d === null) return undefined;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? undefined : d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIsoDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function deriveUnderstandingHistory(
  attributes: ContextAttribute[],
  decisions: Decision[],
  options?: HistoryDerivationOptions
): UnderstandingHistoryResponse {
  const rawDays = options?.days;
  const days: 7 | 30 | 90 = rawDays === 7 || rawDays === 90 ? rawDays : 30;
  const now = options?.now instanceof Date && !Number.isNaN(options.now.getTime())
    ? options.now
    : new Date();

  // Normalize attributes
  interface NormalizedAttribute {
    id: string;
    category: 'goals' | 'commitments' | 'preferences';
    label: string;
    source: string;
    observedAt: Date;
    validUntil?: Date;
    observedDateStr: string;
    validUntilDateStr?: string;
  }

  const normalizedAttrs: NormalizedAttribute[] = [];
  for (const attr of attributes) {
    const category = resolveCategory(attr.attribute);
    if (!category) continue;

    const observedAt = toDate(attr.observedAt);
    if (!observedAt) continue;

    const validUntil = toDate(attr.validUntil);
    normalizedAttrs.push({
      id: attr.id,
      category,
      label: extractLabel(attr),
      source: String(attr.source || 'USER_CONFIRMED'),
      observedAt,
      validUntil,
      observedDateStr: toIsoDateStr(observedAt),
      validUntilDateStr: validUntil ? toIsoDateStr(validUntil) : undefined,
    });
  }

  // Normalize decisions
  interface NormalizedDecision {
    id: string;
    createdAt: Date;
    createdDateStr: string;
    label: string;
    source: string;
  }

  const normalizedDecisions: NormalizedDecision[] = [];
  for (const dec of decisions) {
    const createdAt = toDate(dec.createdAt);
    if (!createdAt) continue;

    normalizedDecisions.push({
      id: dec.id,
      createdAt,
      createdDateStr: toIsoDateStr(createdAt),
      label: dec.question || 'Decision',
      source: 'decision',
    });
  }

  // Generate daily points for exactly `days` days
  const points: UnderstandingHistoryPoint[] = [];

  for (let i = 0; i < days; i++) {
    const offsetDays = (days - 1) - i;
    const targetDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - offsetDays
    ));
    const dateStr = toIsoDateStr(targetDate);

    // Sample timestamp D: end of that UTC day, capped at now for today
    const eodTimestamp = Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      23, 59, 59, 999
    );
    const sampleTimestamp = Math.min(eodTimestamp, now.getTime());

    // Count active attributes at sampleTimestamp
    let goalsCount = 0;
    let commitmentsCount = 0;
    let preferencesCount = 0;

    for (const attr of normalizedAttrs) {
      if (attr.observedAt.getTime() <= sampleTimestamp) {
        if (!attr.validUntil || attr.validUntil.getTime() > sampleTimestamp) {
          if (attr.category === 'goals') goalsCount++;
          else if (attr.category === 'commitments') commitmentsCount++;
          else if (attr.category === 'preferences') preferencesCount++;
        }
      }
    }

    // Count decisions at sampleTimestamp
    let decisionsCount = 0;
    for (const dec of normalizedDecisions) {
      if (dec.createdAt.getTime() <= sampleTimestamp) {
        decisionsCount++;
      }
    }

    // Determine changes on this day
    const dayChanges: HistoryChange[] = [];

    // 1. Attributes added on this date
    for (const attr of normalizedAttrs) {
      if (attr.observedDateStr === dateStr && attr.observedAt.getTime() <= now.getTime()) {
        dayChanges.push({
          id: attr.id,
          category: attr.category,
          direction: 'added',
          label: attr.label,
          source: attr.source,
        });
      }
    }

    // 2. Attributes expired on this date
    for (const attr of normalizedAttrs) {
      if (
        attr.validUntilDateStr === dateStr &&
        attr.validUntil &&
        attr.validUntil.getTime() <= now.getTime()
      ) {
        dayChanges.push({
          id: attr.id,
          category: attr.category,
          direction: 'expired',
          label: attr.label,
          source: attr.source,
        });
      }
    }

    // 3. Decisions added on this date
    for (const dec of normalizedDecisions) {
      if (dec.createdDateStr === dateStr && dec.createdAt.getTime() <= now.getTime()) {
        dayChanges.push({
          id: dec.id,
          category: 'decisions',
          direction: 'added',
          label: dec.label,
          source: dec.source,
        });
      }
    }

    // Sort changes deterministically: added before expired, then category, then id
    dayChanges.sort((a, b) => {
      if (a.direction !== b.direction) {
        return a.direction === 'added' ? -1 : 1;
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.id.localeCompare(b.id);
    });

    points.push({
      date: dateStr,
      goals: goalsCount,
      commitments: commitmentsCount,
      preferences: preferencesCount,
      decisions: decisionsCount,
      changes: dayChanges,
    });
  }

  // hasHistory is false when there is no actual addition/expiry/decision within the requested range
  const hasHistory = points.some((p) => p.changes.length > 0);

  return {
    days,
    points,
    hasHistory,
  };
}
