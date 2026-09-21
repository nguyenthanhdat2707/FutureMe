/**
 * Simple State Estimator
 * MVP: Deterministic rules
 * PROVISIONAL - replaceable
 */

import { PersonalContext, PersonalState, StateEstimate, Observation } from '../domain/types';
import { IStateEstimator } from './interfaces';

export class SimpleStateEstimator implements IStateEstimator {
  estimateCurrentState(
    context: PersonalContext,
    observations: Observation[]
  ): Promise<StateEstimate> {
    const now = new Date();
    const evidence: string[] = [];

    // Rule 1: No observations in last 30 minutes → UNCERTAIN
    const recentObs = observations.filter(o => {
      const diff = now.getTime() - o.timestamp.getTime();
      return diff < 30 * 60 * 1000; // 30 minutes
    });

    if (recentObs.length === 0) {
      return Promise.resolve({
        state: PersonalState.UNCERTAIN,
        confidence: 0.7,
        evidence: ['No recent observations in last 30 minutes'],
        timestamp: now
      });
    }

    // Rule 2: Check calendar overload
    const busyHours = context.calendar.busyHoursToday;
    if (busyHours > 8) {
      evidence.push(`Busy hours today: ${busyHours.toFixed(1)}`);
      return Promise.resolve({
        state: PersonalState.OVERLOADED,
        confidence: 0.65,
        evidence,
        timestamp: now
      });
    }

    // Default: FLOW
    evidence.push('Normal activity level detected');
    return Promise.resolve({
      state: PersonalState.FLOW,
      confidence: 0.6,
      evidence,
      timestamp: now
    });
  }
}
