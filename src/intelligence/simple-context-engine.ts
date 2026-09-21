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
import { PersonalContextRepository } from '../repositories/personal-context.repository';
import { DecisionRepository } from '../repositories/decision.repository';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { ObservationRepository } from '../repositories/observation.repository';
import { safeJsonParse } from '../utils/json';

export class SimpleContextEngine implements IContextEngine {
  constructor(
    private contextRepo: PersonalContextRepository,
    private decisionRepo: DecisionRepository,
    private calendarRepo: CalendarEventRepository,
    private observationRepo: ObservationRepository,
    private stateEstimator: IStateEstimator
  ) {}

  getCurrentContext(userId: string): Promise<PersonalContext> {
    const attributes = this.contextRepo.findByUserId(userId, 100);
    const recentDecisions = this.decisionRepo.findByUserId(userId, 10);
    const upcomingEvents = this.calendarRepo.findUpcoming(userId);

    // Extract structured data from attributes
    const goals: Goal[] = [];
    const commitments: Commitment[] = [];
    const preferences: Preference[] = [];

    for (const attr of attributes) {
      try {
        const parsed = safeJsonParse(attr.value);
        if (typeof parsed === 'object' && parsed !== null) {
          if (attr.attribute === 'goal') {
            goals.push({
              ...(parsed as unknown as Goal),
              source: attr.source,
              confidence: attr.confidence,
              attributeId: attr.id
            });
          } else if (attr.attribute === 'commitment') {
            commitments.push({
              ...(parsed as unknown as Commitment),
              source: attr.source,
              confidence: attr.confidence,
              attributeId: attr.id
            });
          } else if (attr.attribute === 'preference') {
            preferences.push({
              ...(parsed as unknown as Preference),
              source: attr.source,
              confidence: attr.confidence,
              attributeId: attr.id
            });
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59);

    const busyHoursToday = upcomingEvents
      .filter(e => e.startTime < todayEnd && e.endTime > now)
      .reduce((sum, e) => {
        const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

    return Promise.resolve({
      userId,
      goals,
      commitments,
      preferences,
      calendar: {
        upcomingEvents: upcomingEvents.length,
        busyHoursToday,
        busyHoursThisWeek: 0 // TODO: Calculate
      },
      recentDecisions,
      lastUpdated: new Date()
    });
  }

  updateContext(userId: string, observation: Observation): Promise<PersonalContext> {
    const timestamp = observation.timestamp ? new Date(observation.timestamp) : new Date();
    const confidence = Number.isFinite(observation.confidence)
      ? Math.min(1, Math.max(0, observation.confidence))
      : 1;

    this.observationRepo.create({
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
    const recentObs = this.observationRepo.findRecent(userId, 24);
    const state = await this.stateEstimator.estimateCurrentState(context, recentObs);

    // PROVISIONAL: Return all context as "relevant"
    // Real implementation would filter based on decision query
    return {
      goals: context.goals,
      commitments: context.commitments,
      constraints: [],
      recentHistory: recentObs.map(o => `${o.type}: ${JSON.stringify(o.data)}`),
      state
    };
  }

  confirmContextAttribute(userId: string, attributeId: string): Promise<void> {
    const attr = this.contextRepo.findById(attributeId);
    if (attr && attr.userId === userId) {
      this.contextRepo.update(attributeId, {
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0
      });
    }
    return Promise.resolve();
  }

  correctContext(userId: string, correction: ContextCorrection): Promise<PersonalContext> {
    const attr = this.contextRepo.findById(correction.attributeId);
    if (attr && attr.userId === userId) {
      this.contextRepo.update(correction.attributeId, {
        value: correction.correctedValue,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0
      });
    }
    return this.getCurrentContext(userId);
  }
}
