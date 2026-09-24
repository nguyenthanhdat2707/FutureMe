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

function extractEntityId(attr: ContextAttribute): string {
  try {
    const parsed = typeof attr.value === 'string' ? safeJsonParse(attr.value) : attr.value;
    if (parsed && typeof parsed === 'object') {
      const id = (parsed as Record<string, unknown>).id;
      if (typeof id === 'string' || typeof id === 'number') return String(id);
    }
  } catch {
    // Fall back to the immutable context-row ID when the value is not structured.
  }
  return attr.id;
}

function sourceAuthority(source: string): number {
  switch (source) {
    case 'USER_CONFIRMED': return 4;
    case 'CALENDAR': return 3;
    case 'SYSTEM_OBSERVED': return 2;
    default: return 1;
  }
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
    entityKey: string;
    category: 'goals' | 'commitments' | 'preferences';
    label: string;
    source: string;
    observedAt: Date;
    createdAt: Date;
    validUntil?: Date;
  }

  const normalizedAttrs: NormalizedAttribute[] = [];
  for (const attr of attributes) {
    const category = resolveCategory(attr.attribute);
    if (!category) continue;

    const observedAt = toDate(attr.observedAt);
    if (!observedAt) continue;

    const createdAt = toDate(attr.createdAt) ?? observedAt;
    const validUntil = toDate(attr.validUntil);
    const entityId = extractEntityId(attr);
    normalizedAttrs.push({
      id: attr.id,
      entityKey: `${category}_${entityId}`,
      category,
      label: extractLabel(attr),
      source: String(attr.source || 'USER_CONFIRMED'),
      observedAt,
      createdAt,
      validUntil,
    });
  }

  const attributesByEntity = new Map<string, NormalizedAttribute[]>();
  for (const attr of normalizedAttrs) {
    const versions = attributesByEntity.get(attr.entityKey) ?? [];
    versions.push(attr);
    attributesByEntity.set(attr.entityKey, versions);
  }

  function compareAuthority(candidate: NormalizedAttribute, current: NormalizedAttribute): number {
    const authorityDifference = sourceAuthority(candidate.source) - sourceAuthority(current.source);
    if (authorityDifference !== 0) return authorityDifference;
    const observedDifference = candidate.observedAt.getTime() - current.observedAt.getTime();
    if (observedDifference !== 0) return observedDifference;
    const createdDifference = candidate.createdAt.getTime() - current.createdAt.getTime();
    if (createdDifference !== 0) return createdDifference;
    return candidate.id.localeCompare(current.id);
  }

  function selectedVersionAt(versions: NormalizedAttribute[], timestamp: number): NormalizedAttribute | undefined {
    let selected: NormalizedAttribute | undefined;
    for (const version of versions) {
      if (version.observedAt.getTime() > timestamp) continue;
      if (version.validUntil && version.validUntil.getTime() <= timestamp) continue;
      if (!selected || compareAuthority(version, selected) > 0) selected = version;
    }
    return selected;
  }

  const attributeEvents = new Map<string, HistoryChange[]>();
  for (const versions of attributesByEntity.values()) {
    const eventTimestamps = new Set<number>();
    for (const version of versions) {
      eventTimestamps.add(version.observedAt.getTime());
      if (version.validUntil) eventTimestamps.add(version.validUntil.getTime());
    }

    for (const timestamp of [...eventTimestamps].sort((left, right) => left - right)) {
      if (timestamp > now.getTime()) continue;
      const before = selectedVersionAt(versions, timestamp - 1);
      const after = selectedVersionAt(versions, timestamp);
      if ((!before && !after) || (before && after)) continue;

      const changedVersion = after ?? before;
      if (!changedVersion) continue;
      const dateStr = toIsoDateStr(new Date(timestamp));
      const changes = attributeEvents.get(dateStr) ?? [];
      changes.push({
        id: changedVersion.id,
        category: changedVersion.category,
        direction: after ? 'added' : 'expired',
        label: changedVersion.label,
        source: changedVersion.source,
      });
      attributeEvents.set(dateStr, changes);
    }
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

    for (const versions of attributesByEntity.values()) {
      const selected = selectedVersionAt(versions, sampleTimestamp);
      if (selected?.category === 'goals') goalsCount++;
      else if (selected?.category === 'commitments') commitmentsCount++;
      else if (selected?.category === 'preferences') preferencesCount++;
    }

    // Count decisions at sampleTimestamp
    let decisionsCount = 0;
    for (const dec of normalizedDecisions) {
      if (dec.createdAt.getTime() <= sampleTimestamp) {
        decisionsCount++;
      }
    }

    // Determine changes on this day. Entity-version replacements (confirm/correct)
    // do not create false additions or expirations.
    const dayChanges: HistoryChange[] = [...(attributeEvents.get(dateStr) ?? [])];

    // Decisions added on this date
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
