/**
 * Materiality Detector and Disruption Finder
 * Phase 5 deterministic rules per docs/DECISION_POLICY.md and PHASE5_ANTIGRAVITY_CONTRACT.md
 */

import {
  Decision,
  DecisionStatus,
  CalendarEvent,
  ObservationType,
  InterventionLevel,
  InterventionType,
  RelevantContext,
  DecisionQuery,
  PersonalState
} from '../domain/types';

import {
  IDecisionRepository,
  ICalendarEventRepository,
  IObservationRepository,
  IInterventionRepository
} from '../repositories/interfaces';
import { IContextEngine } from './interfaces';
import { assessDecisionFeasibility } from './deterministic-feasibility-assessment';
import { evaluateDecisionPolicy } from './decision-policy-evaluator';

export interface DisruptionCandidate {
  decision: Decision;
  issueKey: string;
  level: InterventionLevel;
  type: InterventionType;
  reason: string;
  prompt: string;
  suggestedActions: string[];
  severity: 'low' | 'medium' | 'high';
  materialChangeReason: string;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

/**
 * 1. Find active decisions for user.
 * Active decisions are persisted decisions with status === 'PENDING'.
 */
export async function findActiveDecisions(
  userId: string,
  decisionRepo: IDecisionRepository,
  contextDecisions?: Decision[]
): Promise<Decision[]> {
  if (contextDecisions && contextDecisions.length > 0) {
    const active = contextDecisions.filter(d => d.status === DecisionStatus.PENDING);
    if (active.length > 0) return active;
  }

  const userDecisions = await decisionRepo.findByUserId(userId, 50);
  return userDecisions.filter(d => d.status === DecisionStatus.PENDING);
}

/**
 * 2. Detect stale calendar events:
 * Event ended > 1 hour ago without completion observation confirmation.
 */
export async function detectStaleCalendarEvents(
  userId: string,
  calendarRepo: ICalendarEventRepository,
  observationRepo: IObservationRepository,
  now: Date = new Date()
): Promise<CalendarEvent[]> {
  const events = await calendarRepo.findByUserId(userId, 100);
  const observations = await observationRepo.findByUserId(userId, 100);

  const staleEvents: CalendarEvent[] = [];

  for (const event of events) {
    const endTime = new Date(event.endTime).getTime();
    const elapsedSinceEnd = now.getTime() - endTime;

    // Must have ended > 1 hour ago, and within the last 48 hours
    if (elapsedSinceEnd > ONE_HOUR_MS && elapsedSinceEnd < TWO_DAYS_MS) {
      // Check if any observation confirms completion
      const isConfirmed = observations.some(obs => {
        if (
          obs.type === ObservationType.TASK_COMPLETED ||
          obs.type === ObservationType.CALENDAR_EVENT_ENDED
        ) {
          const data = obs.data || {};
          if (data.eventId === event.id || data.externalId === event.externalId || data.title === event.title) {
            return true;
          }
          if (data.confirmed === true) {
            return true;
          }
        }
        return false;
      });

      if (!isConfirmed) {
        staleEvents.push(event);
      }
    }
  }

  return staleEvents;
}

/**
 * 3. Detect consequential disruptions on active decisions:
 * Re-evaluate active decisions with current context and check for material changes.
 */
export async function detectConsequentialDisruptions(
  userId: string,
  activeDecisions: Decision[],
  contextEngine: IContextEngine,
  now: Date = new Date()
): Promise<DisruptionCandidate[]> {
  const disruptions: DisruptionCandidate[] = [];

  for (const decision of activeDecisions) {
    // Reconstruct or extract query
    const query: DecisionQuery = decision.query || decision.relevantContext?.query || {
      question: decision.question,
      impactProfile: {
        target: decision.question,
        timeCostHours: 2,
        deadline: new Date(now.getTime() + 24 * ONE_HOUR_MS)
      }
    };

    // Get live relevant context
    const currentRelevantContext = await contextEngine.getRelevantContext(userId, query);

    // Old assessment from original captured snapshot
    const baselineContext: RelevantContext = {
      goals: decision.relevantContext?.goals || [],
      commitments: decision.relevantContext?.commitments || [],
      constraints: decision.relevantContext?.constraints || [],
      recentHistory: decision.relevantContext?.relevantHistory || [],
      state: {
        state: PersonalState.FLOW,
        confidence: 1.0,
        evidence: [],
        timestamp: decision.createdAt || now
      }
    };

    const oldAssessment = assessDecisionFeasibility(query.impactProfile, decision.createdAt || now, baselineContext);
    const oldPolicy = evaluateDecisionPolicy(oldAssessment, query.clarification, baselineContext.unresolvedConflicts || []);

    // Incorporate live commitments before deadline into new workload
    let additionalCommitmentHours = 0;
    const deadlineTime = query.impactProfile?.deadline
      ? new Date(query.impactProfile.deadline).getTime()
      : (now.getTime() + 24 * ONE_HOUR_MS);

    if (currentRelevantContext.commitments && currentRelevantContext.commitments.length > 0) {
      for (const commitment of currentRelevantContext.commitments) {
        const start = new Date(commitment.startTime).getTime();
        const end = new Date(commitment.endTime).getTime();
        if (!isNaN(start) && !isNaN(end) && start < deadlineTime) {
          const overlapStart = Math.max(now.getTime(), start);
          const overlapEnd = Math.min(deadlineTime, end);
          if (overlapEnd > overlapStart) {
            additionalCommitmentHours += (overlapEnd - overlapStart) / ONE_HOUR_MS;
          }
        }
      }
    }

    const adjustedProfile = query.impactProfile ? {
      ...query.impactProfile,
      workloadHoursBeforeDeadline: query.impactProfile.workloadHoursBeforeDeadline !== undefined
        ? query.impactProfile.workloadHoursBeforeDeadline + additionalCommitmentHours
        : (additionalCommitmentHours > 0 ? additionalCommitmentHours : undefined)
    } : undefined;

    // New assessment with current context and live calendar commitments
    const newAssessment = assessDecisionFeasibility(adjustedProfile, now, currentRelevantContext);
    const newPolicy = evaluateDecisionPolicy(newAssessment, query.clarification, currentRelevantContext.unresolvedConflicts || []);

    // Materiality Evaluation:
    // a) Policy outcome change (RECOMMEND -> ASK / ABSTAIN)
    const outcomeChanged = oldPolicy.outcome !== newPolicy.outcome;

    // b) Feasibility change (e.g. feasible -> at-risk or not-feasible)
    const feasibilityChanged = oldAssessment.feasibility !== newAssessment.feasibility;

    // c) Confidence drop >= 0.10
    const confidenceDropped = (oldAssessment.recommendation.confidence - newAssessment.recommendation.confidence) >= 0.10;

    // d) Usable capacity change >= 30m (0.5h) or >= 25% caused by workload/calendar shifts
    const oldCap = oldAssessment.projectedRemainingCapacityHours ?? oldAssessment.availableTimeBeforeDeadlineHours ?? 0;
    const newCap = newAssessment.projectedRemainingCapacityHours ?? newAssessment.availableTimeBeforeDeadlineHours ?? 0;
    const capacityDelta = Math.abs(oldCap - newCap);

    const hasContextShift = additionalCommitmentHours > 0 || (currentRelevantContext.recentHistory && currentRelevantContext.recentHistory.length > (decision.relevantContext?.relevantHistory?.length || 0));
    const capacityMaterialChange = hasContextShift && (capacityDelta >= 0.5 || (oldCap > 0 && (capacityDelta / oldCap) >= 0.25));

    const isMaterial = outcomeChanged || feasibilityChanged || confidenceDropped || capacityMaterialChange;

    if (isMaterial) {
      let severity: 'low' | 'medium' | 'high' = 'medium';
      if (newAssessment.feasibility === 'not-feasible' || newAssessment.deadlinePressure === 'high') {
        severity = 'high';
      }

      const hasConflictOrOverload = (currentRelevantContext.unresolvedConflicts && currentRelevantContext.unresolvedConflicts.length > 0) || additionalCommitmentHours > 0;

      let reason = `Schedule or workload changes have altered feasibility of "${decision.question}" from ${oldAssessment.feasibility} to ${newAssessment.feasibility}.`;
      let prompt = `Your schedule has changed. This may affect your decision: "${decision.question}". Feasibility is now ${newAssessment.feasibility}.`;

      if (hasConflictOrOverload && newAssessment.feasibility === 'not-feasible') {
        reason = `A calendar conflict or workload surge leaves negative remaining capacity for "${decision.question}".`;
        prompt = `Your time is now constrained for "${decision.question}". Would you like to review or adjust this decision?`;
      } else if (capacityMaterialChange) {
        reason = `Remaining capacity for "${decision.question}" changed by ${capacityDelta.toFixed(1)} hours.`;
        prompt = `Available capacity for "${decision.question}" has shifted by ${capacityDelta.toFixed(1)} hours. Would you like to review it?`;
      }

      disruptions.push({
        decision,
        issueKey: `disruption:decision:${decision.id}:${newAssessment.feasibility}`,
        level: InterventionLevel.PROACTIVE,
        type: 'CONSEQUENTIAL_DISRUPTION',
        reason,
        prompt,
        suggestedActions: ['Review Decision', 'Adjust Schedule', 'Dismiss'],
        severity,
        materialChangeReason: outcomeChanged ? 'outcome_change' : feasibilityChanged ? 'feasibility_change' : 'capacity_change'
      });
    }
  }

  return disruptions;
}

/**
 * 4. Cooldown and burden control:
 * - 4-hour cooldown after user dismissal on the same deterministic issue_key.
 * - Cooldown bypassed if severity escalated or feasibility became 'not-feasible'.
 */
export async function checkCooldown(
  userId: string,
  issueKey: string,
  newSeverity: 'low' | 'medium' | 'high',
  interventionRepo: IInterventionRepository,
  now: Date = new Date(),
  alternateKey?: string
): Promise<{ inCooldown: boolean; bypassed: boolean }> {
  let existing = await interventionRepo.findByIssueKey(userId, issueKey);
  if ((!existing || existing.status !== 'DISMISSED') && alternateKey) {
    existing = await interventionRepo.findByIssueKey(userId, alternateKey);
  }
  if (!existing || existing.status !== 'DISMISSED' || !existing.dismissedAt) {
    return { inCooldown: false, bypassed: false };
  }


  const elapsedMs = now.getTime() - new Date(existing.dismissedAt).getTime();
  if (elapsedMs >= FOUR_HOURS_MS) {
    return { inCooldown: false, bypassed: false };
  }

  // Check bypass conditions: severity escalated from medium/low to high
  const oldSeverity = existing.severity || 'low';
  const escalated = (oldSeverity === 'low' && (newSeverity === 'medium' || newSeverity === 'high')) ||
                    (oldSeverity === 'medium' && newSeverity === 'high');

  if (escalated) {
    return { inCooldown: false, bypassed: true };
  }

  return { inCooldown: true, bypassed: false };
}
