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
  ObservationType
} from '../domain/types';
import { IContextEngine, IStateEstimator } from './interfaces';
import { IPersonalContextRepository, IDecisionRepository, ICalendarEventRepository, IObservationRepository } from '../repositories/interfaces';
import { safeJsonParse } from '../utils/json';
import { calculateUnionHours } from '../utils/interval';

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

    const latestEntities = new Map<string, any>();

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
          if (attr.attribute === 'goal') {
            latestEntities.set(`goal_${entityId}`, entity);
          } else if (attr.attribute === 'commitment') {
            latestEntities.set(`commitment_${entityId}`, entity);
          } else if (attr.attribute === 'preference') {
            latestEntities.set(`preference_${entityId}`, entity);
          }
        }
        if (attr.attribute === 'setup_completed' && parsed === true) {
            setupCompleted = true;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    for (const [key, entity] of latestEntities.entries()) {
      if (key.startsWith('goal_')) goals.push(entity as Goal);
      if (key.startsWith('commitment_')) commitments.push(entity as Commitment);
      if (key.startsWith('preference_')) preferences.push(entity as Preference);
    }

    const now = new Date();
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

  async getRelevantContext(userId: string, _decision: DecisionQuery): Promise<RelevantContext> {
    const context = await this.getCurrentContext(userId);
    const recentObs = await this.observationRepo.findRecent(userId, 24);
    const state = await this.stateEstimator.estimateCurrentState(context, recentObs);

    // PROVISIONAL: Return all context as "relevant"
    // Real implementation would filter based on decision query
    return {
      goals: context.goals,
      commitments: context.commitments,
      constraints: [],
      recentHistory: recentObs.map((o: any) => `${o.type}: ${JSON.stringify(o.data)}`),
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
