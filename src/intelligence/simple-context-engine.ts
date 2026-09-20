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
  Preference
} from '../domain/types';
import { IContextEngine } from './interfaces';
import { PersonalContextRepository } from '../repositories/personal-context.repository';
import { DecisionRepository } from '../repositories/decision.repository';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { ObservationRepository } from '../repositories/observation.repository';

export class SimpleContextEngine implements IContextEngine {
  constructor(
    private contextRepo: PersonalContextRepository,
    private decisionRepo: DecisionRepository,
    private calendarRepo: CalendarEventRepository,
    private observationRepo: ObservationRepository
  ) {}

  async getCurrentContext(userId: string): Promise<PersonalContext> {
    const attributes = this.contextRepo.findByUserId(userId, 100);
    const recentDecisions = this.decisionRepo.findByUserId(userId, 10);
    const upcomingEvents = this.calendarRepo.findUpcoming(userId);

    // Extract structured data from attributes
    const goals: Goal[] = [];
    const commitments: Commitment[] = [];
    const preferences: Preference[] = [];

    for (const attr of attributes) {
      try {
        const parsed = JSON.parse(attr.value);
        if (attr.attribute === 'goal') {
          goals.push(parsed);
        } else if (attr.attribute === 'commitment') {
          commitments.push(parsed);
        } else if (attr.attribute === 'preference') {
          preferences.push(parsed);
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
    // Simple implementation: just return current context
    // In real implementation, would analyze observation and update context attributes
    return this.getCurrentContext(userId);
  }

  async getRelevantContext(userId: string, decision: DecisionQuery): Promise<RelevantContext> {
    const context = await this.getCurrentContext(userId);
    const recentObs = this.observationRepo.findRecent(userId, 24);

    // PROVISIONAL: Return all context as "relevant"
    // Real implementation would filter based on decision query
    return {
      goals: context.goals,
      commitments: context.commitments,
      constraints: [],
      recentHistory: recentObs.map(o => `${o.type}: ${JSON.stringify(o.data)}`),
      state: {
        state: 'FLOW' as any,
        confidence: 0.5,
        evidence: [],
        timestamp: new Date()
      }
    };
  }

  async confirmContextAttribute(userId: string, attributeId: string): Promise<void> {
    const attr = this.contextRepo.findById(attributeId);
    if (attr && attr.userId === userId) {
      await this.contextRepo.update(attributeId, {
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0
      });
    }
  }

  async correctContext(userId: string, correction: ContextCorrection): Promise<PersonalContext> {
    const attr = this.contextRepo.findById(correction.attributeId);
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
