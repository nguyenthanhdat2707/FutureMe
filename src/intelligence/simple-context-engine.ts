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

    const busyHoursToday = (upcomingEvents as any[])
      .filter((e) => e.startTime < todayEnd && e.endTime > now)
      .reduce((sum, e) => {
        const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

    return {
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
      await this.contextRepo.update(attributeId, {
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0
      });
    }
  }

  async correctContext(userId: string, correction: ContextCorrection): Promise<PersonalContext> {
    const attr = await this.contextRepo.findById(correction.attributeId);
    if (attr && attr.userId === userId) {
      await this.contextRepo.update(correction.attributeId, {
        value: correction.correctedValue,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0
      });
    }
    return this.getCurrentContext(userId);
  }
}
