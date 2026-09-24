/**
 * Simple Intervention Policy
 * Phase 5 implementation: Deterministic rules for proactive context checks,
 * consequential disruptions, cooldowns, and explicit NO_OP silence.
 */

import {
  PersonalContext,
  StateEstimate,
  InterventionDecision,
  InterventionLevel
} from '../domain/types';
import { IInterventionPolicy, IContextEngine } from './interfaces';
import {
  IDecisionRepository,
  IInterventionRepository,
  ICalendarEventRepository,
  IObservationRepository
} from '../repositories/interfaces';
import {
  getDecisionRepository,
  getInterventionRepository,
  getCalendarEventRepository,
  getObservationRepository,
  getContextEngine
} from '../services/service-container';
import {
  findActiveDecisions,
  detectStaleCalendarEvents,
  detectConsequentialDisruptions,
  checkCooldown
} from './materiality-detector';

export interface InterventionEvaluationOptions {
  userId?: string;
  now?: Date;
  activeDecisions?: import('../domain/types').Decision[];
}

export class SimpleInterventionPolicy implements IInterventionPolicy {
  constructor(
    private decisionRepo?: IDecisionRepository,
    private interventionRepo?: IInterventionRepository,
    private calendarRepo?: ICalendarEventRepository,
    private observationRepo?: IObservationRepository,
    private contextEngine?: IContextEngine
  ) {}

  private getDecRepo(): IDecisionRepository {
    return this.decisionRepo || getDecisionRepository();
  }

  private getIntRepo(): IInterventionRepository {
    return this.interventionRepo || getInterventionRepository();
  }

  private getCalRepo(): ICalendarEventRepository {
    return this.calendarRepo || getCalendarEventRepository();
  }

  private getObsRepo(): IObservationRepository {
    return this.observationRepo || getObservationRepository();
  }

  private getCtxEngine(): IContextEngine {
    return this.contextEngine || getContextEngine();
  }

  async shouldIntervene(
    state: StateEstimate,
    context: PersonalContext,
    options?: InterventionEvaluationOptions
  ): Promise<InterventionDecision> {
    const userId = options?.userId || context.userId || 'demo-user';
    const now = options?.now || new Date();

    const intRepo = this.getIntRepo();
    const decRepo = this.getDecRepo();
    const calRepo = this.getCalRepo();
    const obsRepo = this.getObsRepo();
    const ctxEngine = this.getCtxEngine();

    // 1. Burden control: Check if there is already an active intervention
    const activeInterventions = await intRepo.findActiveByUserId(userId);
    if (activeInterventions.length > 0) {
      const active = activeInterventions[0];
      return {
        shouldIntervene: true,
        level: active.level,
        interventionType: active.type,
        reason: active.reason,
        prompt: active.prompt,
        suggestedAction: active.suggestedAction,
        suggestedActions: active.suggestedActions,
        interventionId: active.id,
        decisionId: active.decisionId,
        issueKey: active.issueKey,
        severity: active.severity,
        timestamp: active.createdAt
      };
    }

    // 2. Active decisions invariant:
    // "A context change alone is NOT sufficient to trigger intervention.
    // An intervention is only evaluated against persisted, active decisions (status === 'PENDING').
    // If no active decisions exist, return NO_OP immediately."
    const activeDecisions = options?.activeDecisions || await findActiveDecisions(userId, decRepo, context.recentDecisions);
    if (activeDecisions.length === 0) {
      return {
        shouldIntervene: false,
        level: InterventionLevel.NONE,
        interventionType: 'NONE',
        reason: 'No active decisions to intervene on'
      };
    }

    // 3. Consequential Disruption check:
    // Check if new context materially affects any active decision
    const disruptions = await detectConsequentialDisruptions(userId, activeDecisions, ctxEngine, now);
    for (const disruption of disruptions) {
      const cooldownStatus = await checkCooldown(userId, disruption.issueKey, disruption.severity, intRepo, now);
      if (!cooldownStatus.inCooldown) {
        // Persist new active intervention
        const created = await intRepo.create({
          id: undefined as unknown as string,
          userId,
          decisionId: disruption.decision.id,
          issueKey: disruption.issueKey,
          type: disruption.type,
          level: disruption.level,
          status: 'ACTIVE',
          reason: disruption.reason,
          prompt: disruption.prompt,
          suggestedActions: disruption.suggestedActions,
          severity: disruption.severity,
          lastMaterialChangeAt: now
        });

        return {
          shouldIntervene: true,
          level: disruption.level,
          interventionType: disruption.type,
          reason: disruption.reason,
          prompt: disruption.prompt,
          suggestedAction: disruption.suggestedActions[0],
          suggestedActions: disruption.suggestedActions,
          interventionId: created.id,
          decisionId: disruption.decision.id,
          issueKey: disruption.issueKey,
          severity: disruption.severity,
          timestamp: now
        };
      }
    }

    // 4. Stale context check (Flow #15):
    // Calendar event ended >1 hour ago without completion confirmation
    const staleEvents = await detectStaleCalendarEvents(userId, calRepo, obsRepo, now);
    if (staleEvents.length > 0) {
      const staleEvent = staleEvents[0];
      const issueKey = `stale:event:${staleEvent.id || staleEvent.externalId}`;
      const cooldownStatus = await checkCooldown(userId, issueKey, 'medium', intRepo, now);

      if (!cooldownStatus.inCooldown) {
        const prompt = `Are you still working on "${staleEvent.title}"? Did you complete it?`;
        const reason = `Event "${staleEvent.title}" ended over 1 hour ago without completion confirmation.`;
        const suggestedActions = ['Yes, completed', 'No, still working', 'Dismiss'];

        const created = await intRepo.create({
          id: undefined as unknown as string,
          userId,
          decisionId: activeDecisions[0]?.id,
          issueKey,
          type: 'CONTEXT_CHECK',
          level: InterventionLevel.PROACTIVE,
          status: 'ACTIVE',
          reason,
          prompt,
          suggestedActions,
          severity: 'medium',
          lastMaterialChangeAt: now
        });

        return {
          shouldIntervene: true,
          level: InterventionLevel.PROACTIVE,
          interventionType: 'CONTEXT_CHECK',
          reason,
          prompt,
          suggestedAction: suggestedActions[0],
          suggestedActions,
          interventionId: created.id,
          decisionId: activeDecisions[0]?.id,
          issueKey,
          severity: 'medium',
          timestamp: now
        };
      }
    }

    // 5. Explicit Silence / NO_OP (Flow #17):
    return {
      shouldIntervene: false,
      level: InterventionLevel.NONE,
      interventionType: 'NONE',
      reason: 'No material context changes affecting active decisions'
    };
  }
}
