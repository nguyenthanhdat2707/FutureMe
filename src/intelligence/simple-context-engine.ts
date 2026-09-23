/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-template-expressions */
/**
 * Simple Context Engine Implementation
 * MVP: Key-value storage with recency-based retrieval
 * PROVISIONAL - replaceable
 */

import {
  PersonalContext,
  Observation,
  DecisionQuery,
  RelevantContext,
  ContextCorrection,
  ObservationSource,
  Goal,
  Commitment,
  Preference,
  ObservationType,
  ContextAttribute
} from '../domain/types';
import { IContextEngine, IStateEstimator } from './interfaces';
import { IPersonalContextRepository, IDecisionRepository, ICalendarEventRepository, IObservationRepository } from '../repositories/interfaces';
import { safeJsonParse } from '../utils/json';
import { calculateUnionHours } from '../utils/interval';

function sourceAuthority(source: ObservationSource): number {
  switch (source) {
    case ObservationSource.USER_CONFIRMED:
      return 4;
    case ObservationSource.CALENDAR:
      return 3;
    case ObservationSource.SYSTEM_OBSERVED:
      return 2;
    default:
      return 1;
  }
}

function isExpired(attribute: ContextAttribute, now: Date): boolean {
  return attribute.validUntil !== undefined && attribute.validUntil.getTime() <= now.getTime();
}

function compareContextAuthority(candidate: ContextAttribute, current: ContextAttribute): number {
  const authorityDifference = sourceAuthority(candidate.source) - sourceAuthority(current.source);
  if (authorityDifference !== 0) return authorityDifference;

  const observedDifference = candidate.observedAt.getTime() - current.observedAt.getTime();
  if (observedDifference !== 0) return observedDifference;

  const createdDifference = candidate.createdAt.getTime() - current.createdAt.getTime();
  if (createdDifference !== 0) return createdDifference;

  return candidate.id.localeCompare(current.id);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export class SimpleContextEngine implements IContextEngine {
  constructor(
    private contextRepo: IPersonalContextRepository,
    private decisionRepo: IDecisionRepository,
    private calendarRepo: ICalendarEventRepository,
    private observationRepo: IObservationRepository,
    private stateEstimator: IStateEstimator
  ) {}

  async getCurrentContext(userId: string): Promise<PersonalContext> {
    const attributes = await this.contextRepo.findByUserId(userId, 100);
    const recentDecisions = await this.decisionRepo.findByUserId(userId, 10);
    const upcomingEvents = await this.calendarRepo.findUpcoming(userId);

    // Extract structured data from attributes
    const goals: Goal[] = [];
    const commitments: Commitment[] = [];
    const preferences: Preference[] = [];
    let setupCompleted = false;

    const latestEntities = new Map<string, { attribute: ContextAttribute; entity: any }>();
    const now = new Date();

    // attributes are usually returned descending by some repos, but let's sort ascending by observedAt so later ones overwrite
    const sortedAttrs = [...attributes].sort((a, b) => {
      const obsDiff = a.observedAt.getTime() - b.observedAt.getTime();
      if (obsDiff !== 0) return obsDiff;
      const creDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (creDiff !== 0) return creDiff;
      return a.id.localeCompare(b.id);
    });

    for (const attr of sortedAttrs) {
      try {
        const parsed = safeJsonParse(attr.value);
        if (typeof parsed === 'object' && parsed !== null) {
          const entityId = (parsed as any).id || attr.id;
          const entity = {
            ...parsed,
            source: attr.source,
            confidence: attr.confidence,
            attributeId: attr.id,
            observedAt: attr.observedAt,
            validUntil: attr.validUntil
          };
          if (!isExpired(attr, now) && ['goal', 'commitment', 'preference'].includes(attr.attribute)) {
            const key = `${attr.attribute}_${entityId}`;
            const current = latestEntities.get(key);
            if (!current || compareContextAuthority(attr, current.attribute) > 0) {
              latestEntities.set(key, { attribute: attr, entity });
            }
          }
        }
        if (attr.attribute === 'setup_completed' && parsed === true) {
            setupCompleted = true;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    for (const [key, selected] of latestEntities.entries()) {
      if (key.startsWith('goal_')) goals.push(selected.entity as Goal);
      if (key.startsWith('commitment_')) commitments.push(selected.entity as Commitment);
      if (key.startsWith('preference_')) preferences.push(selected.entity as Preference);
    }

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59);

    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + (7 - now.getDay())); // end of week roughly

    let busyHoursToday: number | null = null;
    let busyHoursThisWeek: number | null = null;
    let calendarStatus = 'unknown';
    let lastSync: Date | undefined = undefined;

    const syncMarkers = sortedAttrs.filter(a => a.attribute === 'calendar_last_sync');
    const latestSyncMarker = syncMarkers.length > 0 ? syncMarkers[syncMarkers.length - 1] : undefined;

    if (latestSyncMarker) {
      try {
        const parsedValue = JSON.parse(latestSyncMarker.value);
        const parsedDate = new Date(parsedValue);
        if (!isNaN(parsedDate.getTime())) {
          lastSync = parsedDate;
        }
      } catch {
        // Fallback or ignore
      }
    }

    if (lastSync) {
      calendarStatus = 'synced';
    } else if (upcomingEvents.length > 0) {
      calendarStatus = 'synced';
      lastSync = upcomingEvents[0].syncedAt;
    }

    if (upcomingEvents.length > 0) {
      const nowMs = now.getTime();
      const todayEndMs = todayEnd.getTime();
      const weekEndMs = weekEnd.getTime();

      const intervals = upcomingEvents.map(e => ({
        start: e.startTime.getTime(),
        end: e.endTime.getTime()
      }));

      busyHoursToday = calculateUnionHours(intervals, nowMs, todayEndMs);
      busyHoursThisWeek = calculateUnionHours(intervals, nowMs, weekEndMs);

      for (const event of upcomingEvents) {
        commitments.push({
          id: `cal-${event.id}`,
          description: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status || 'confirmed',
          source: ObservationSource.CALENDAR,
          confidence: 1.0,
          attributeId: event.id,
          observedAt: event.syncedAt,
          validUntil: event.endTime
        });
      }
    }

    return {
      userId,
      goals,
      commitments,
      preferences,
      setupCompleted,
      calendar: {
        upcomingEvents: upcomingEvents.length,
        busyHoursToday,
        busyHoursThisWeek,
        status: calendarStatus,
        lastSync
      },
      recentDecisions,
      lastUpdated: new Date()
    };
  }

  async updateContext(userId: string, observation: Observation): Promise<PersonalContext> {
    const timestamp = observation.timestamp ? new Date(observation.timestamp) : new Date();
    const confidence = Number.isFinite(observation.confidence)
      ? Math.min(1, Math.max(0, observation.confidence))
      : 1;

    await this.observationRepo.create({
      userId,
      type: observation.type ?? ObservationType.USER_REPORTED,
      data: observation.data ?? {},
      source: observation.source ?? ObservationSource.USER_CONFIRMED,
      confidence,
      timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp
    });

    return this.getCurrentContext(userId);
  }

  // Helper for simple text token matching
  private isLexicallyRelevant(text: string | undefined, queryTokens: string[]): boolean {
    if (!text) return false;
    const textTokens = new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    return queryTokens.some(token => textTokens.has(token));
  }

  private extractTokens(query: DecisionQuery): string[] {
    const textParts = [
      query.question,
      ...(query.options || []),
      query.impactProfile?.target || ''
    ];
    const text = textParts.join(' ').toLowerCase();

    const stopWords = new Set(['should', 'could', 'would', 'this', 'that', 'attend', 'the', 'and', 'for', 'with']);
    const words = text.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
    return Array.from(new Set(words));
  }

  private isRelevantConflictCandidate(
    attribute: ContextAttribute,
    parsed: Record<string, unknown>,
    tokens: string[],
    deadline: Date | null,
    now: Date
  ): boolean {
    if (attribute.attribute === 'goal') {
      return this.isLexicallyRelevant(typeof parsed.description === 'string' ? parsed.description : undefined, tokens);
    }

    if (attribute.attribute === 'preference') {
      return [parsed.description, parsed.category, parsed.value].some(value =>
        this.isLexicallyRelevant(typeof value === 'string' ? value : undefined, tokens)
      );
    }

    if (attribute.attribute === 'commitment') {
      const start = new Date(typeof parsed.startTime === 'string' ? parsed.startTime : '');
      const end = new Date(typeof parsed.endTime === 'string' ? parsed.endTime : '');
      if (!Number.isNaN(end.getTime()) && end <= now) return false;
      if (deadline && !Number.isNaN(start.getTime()) && start < deadline) return true;
      return this.isLexicallyRelevant(typeof parsed.description === 'string' ? parsed.description : undefined, tokens);
    }

    return false;
  }

  private findUnresolvedConflicts(
    attributes: ContextAttribute[],
    tokens: string[],
    deadline: Date | null,
    now: Date
  ): string[] {
    const groups = new Map<string, { attribute: ContextAttribute; parsed: Record<string, unknown> }[]>();

    for (const attribute of attributes) {
      if (!['goal', 'commitment', 'preference'].includes(attribute.attribute) || isExpired(attribute, now)) {
        continue;
      }

      const parsed = safeJsonParse(attribute.value);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
      const entityId = (parsed as Record<string, unknown>).id;
      if (typeof entityId !== 'string' || entityId.trim().length === 0) continue;

      const key = `${attribute.attribute}:${entityId}`;
      const candidates = groups.get(key) ?? [];
      candidates.push({ attribute, parsed: parsed as Record<string, unknown> });
      groups.set(key, candidates);
    }

    const conflicts: string[] = [];
    for (const [key, candidates] of groups.entries()) {
      if (candidates.length < 2 || !candidates.some(candidate =>
        this.isRelevantConflictCandidate(candidate.attribute, candidate.parsed, tokens, deadline, now)
      )) {
        continue;
      }

      const highestAuthority = Math.max(...candidates.map(candidate => sourceAuthority(candidate.attribute.source)));
      const authoritative = candidates.filter(candidate => sourceAuthority(candidate.attribute.source) === highestAuthority);
      const freshestAt = Math.max(...authoritative.map(candidate => candidate.attribute.observedAt.getTime()));
      const finalists = authoritative.filter(candidate => candidate.attribute.observedAt.getTime() === freshestAt);
      const distinctValues = new Set(finalists.map(candidate => canonicalJson(candidate.parsed)));

      if (distinctValues.size > 1) {
        const separator = key.indexOf(':');
        const attribute = key.slice(0, separator);
        const entityId = key.slice(separator + 1);
        conflicts.push(`Conflicting ${attribute} evidence for ${entityId}.`);
      }
    }

    return conflicts.sort();
  }

  async getRelevantContext(userId: string, decision: DecisionQuery): Promise<RelevantContext> {
    const context = await this.getCurrentContext(userId);
    const attributes = await this.contextRepo.findByUserId(userId, 100);
    const recentObs = await this.observationRepo.findRecent(userId, 24);
    const state = await this.stateEstimator.estimateCurrentState(context, recentObs);

    const tokens = this.extractTokens(decision);
    let deadline: Date | null = null;
    if (decision.impactProfile?.deadline) {
      deadline = new Date(decision.impactProfile.deadline);
      if (isNaN(deadline.getTime())) {
        deadline = null;
      }
    }

    const relevantGoals = context.goals.filter(g =>
      this.isLexicallyRelevant(g.description, tokens)
    );

    const relevantCommitments = context.commitments.filter(c => {
      const now = new Date();
      const cStart = new Date(c.startTime);
      const cEnd = c.endTime ? new Date(c.endTime) : null;

      if (cEnd && !isNaN(cEnd.getTime()) && cEnd <= now) {
        return false;
      }

      if (deadline) {
        if (!isNaN(cStart.getTime()) && cStart < deadline) {
          return true;
        }
      }
      return this.isLexicallyRelevant(c.description, tokens);
    });

    const constraints = context.preferences
      .filter(p => this.isLexicallyRelevant(p.description, tokens) || this.isLexicallyRelevant(p.category, tokens) || this.isLexicallyRelevant(p.value, tokens))
      .map(p => `${p.category}: ${p.value}`);

    const relevantHistory = recentObs.filter((o: Observation) => {
      const typeStr = String(o.type).toLowerCase();
      if (typeStr.includes('deadline') ||
          typeStr.includes('context') ||
          typeStr.includes('disruption') ||
          typeStr.includes('workload') ||
          typeStr.includes('energy')) {
        return true;
      }

      const dataStr = JSON.stringify(o.data || {}).toLowerCase();
      if (dataStr.includes('workload') || dataStr.includes('energy') || dataStr.includes('deadline') || dataStr.includes('disruption')) return true;

      if (this.isLexicallyRelevant(dataStr, tokens)) return true;

      return false;
    }).map((o: Observation) => `${o.type}: ${JSON.stringify(o.data)}`);

    const unresolvedConflicts = this.findUnresolvedConflicts(
      attributes,
      tokens,
      deadline,
      new Date()
    );

    return {
      goals: relevantGoals,
      commitments: relevantCommitments,
      constraints,
      recentHistory: relevantHistory,
      unresolvedConflicts,
      state
    };
  }

  async confirmContextAttribute(userId: string, attributeId: string): Promise<void> {
    const attr = await this.contextRepo.findById(attributeId);
    if (attr && attr.userId === userId) {
      await this.contextRepo.create({
        userId,
        attribute: attr.attribute,
        value: attr.value,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: new Date()
      });

      await this.observationRepo.create({
        userId,
        type: ObservationType.CONTEXT_CHANGE,
        data: { attributeId, reason: 'Confirmation' },
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        timestamp: new Date()
      });
    }
  }

  async correctContext(userId: string, correction: ContextCorrection): Promise<PersonalContext> {
    const attr = await this.contextRepo.findById(correction.attributeId);
    if (attr && attr.userId === userId) {
      let newValue = correction.correctedValue;
      try {
        const oldParsed = JSON.parse(attr.value);
        try {
          const newParsed = JSON.parse(correction.correctedValue);
          newValue = JSON.stringify({ ...oldParsed, ...newParsed });
        } catch {
          newValue = JSON.stringify({ ...oldParsed, description: correction.correctedValue });
        }
      } catch {
        // Fallback if not json
      }

      await this.contextRepo.create({
        userId,
        attribute: attr.attribute,
        value: newValue,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: new Date()
      });

      await this.observationRepo.create({
        userId,
        type: ObservationType.CONTEXT_CHANGE,
        data: { attributeId: correction.attributeId, reason: correction.reason || 'Correction' },
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        timestamp: new Date()
      });
    }
    return this.getCurrentContext(userId);
  }
}
