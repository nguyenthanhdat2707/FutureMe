/**
 * Simple Intervention Policy
 * MVP: Threshold-based rules
 * PROVISIONAL - replaceable
 */

import { PersonalContext, StateEstimate, InterventionDecision, InterventionLevel, PersonalState, DecisionStatus } from '../domain/types';
import { IInterventionPolicy } from './interfaces';

export class SimpleInterventionPolicy implements IInterventionPolicy {
  shouldIntervene(
    state: StateEstimate,
    context: PersonalContext
  ): Promise<InterventionDecision> {
    // Rule: UNCERTAIN state with pending decisions → SUGGESTION
    if (state.state === PersonalState.UNCERTAIN && context.recentDecisions.length > 0) {
      const pendingDecision = context.recentDecisions.find(d => d.status === DecisionStatus.PENDING);

      if (pendingDecision) {
        return Promise.resolve({
          shouldIntervene: true,
          level: InterventionLevel.SUGGESTION,
          reason: 'Uncertain state with pending decision',
          prompt: 'You have a pending decision. Would you like to review it?',
          suggestedAction: 'Review pending decisions'
        });
      }
    }

    // Rule: OVERLOADED state → AMBIENT notification
    if (state.state === PersonalState.OVERLOADED) {
      return Promise.resolve({
        shouldIntervene: true,
        level: InterventionLevel.AMBIENT,
        reason: 'High workload detected',
        prompt: 'Your schedule is quite full today. Consider prioritizing.',
        suggestedAction: 'Review priorities'
      });
    }

    // Default: no intervention
    return Promise.resolve({
      shouldIntervene: false,
      level: InterventionLevel.NONE,
      reason: 'No intervention needed'
    });
  }
}
