/**
 * Demo Mode Routes
 */

import { Router, Request, Response } from 'express';
import { ObservationSource, ObservationType, DecisionStatus, InterventionLevel, type ContextSnapshot, type Recommendation } from '../domain/types';
import {
  getUserRepository,
  getContextRepository,
  getCalendarEventRepository,
  getDecisionRepository,
  getObservationRepository,
  getInterventionRepository
} from '../services/service-container';
import { getUserId } from '../utils/identity';
import { getErrorMessage } from '../utils/error';
import { generatePhase4Dataset, PERSONA_SLUGS, type PersonaSlug } from '../demo/phase4-evaluation-dataset';

export const demoRouter = Router();

function parseRecordJson<T>(value: unknown, label: string): T {
  if (typeof value !== 'string') throw new Error(`Invalid phase 4 ${label}`);
  return JSON.parse(value) as T;
}

function contextEntityId(value: string): string | undefined {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && 'id' in parsed) {
      const id = (parsed as { id?: unknown }).id;
      if (typeof id === 'string' || typeof id === 'number') return String(id);
    }
  } catch {
    // Scalar context records are identified by attribute and source.
  }
  return undefined;
}

async function seedPhase4Persona(personaSlug: PersonaSlug, seededAt: Date): Promise<void> {
  const userRepo = getUserRepository();
  const contextRepo = getContextRepository();
  const calendarRepo = getCalendarEventRepository();
  const decisionRepo = getDecisionRepository();
  const observationRepo = getObservationRepository();
  const dataset = generatePhase4Dataset(seededAt);
  const persona = dataset.personas.find((candidate) => candidate.slug === personaSlug);
  if (!persona) throw new Error(`Unknown phase 4 persona: ${personaSlug}`);

  if (!await userRepo.findById(persona.userId)) {
    await userRepo.create({
      id: persona.userId,
      email: persona.email,
      displayName: persona.displayName,
    });
  }

  const contextRecords = dataset.records.personalContext.filter((record) => record.user_id === persona.userId);
  const existingContext = await contextRepo.findByUserId(persona.userId, 500);
  for (const record of contextRecords) {
    const attribute = record.attribute as string;
    const value = record.value as string;
    const source = record.source as ObservationSource;
    const entityId = contextEntityId(value);
    const alreadySeeded = existingContext.some((existing) =>
      existing.attribute === attribute &&
      existing.source === source &&
      (entityId === undefined ? contextEntityId(existing.value) === undefined : existing.value === value)
    );
    if (!alreadySeeded) {
      await contextRepo.create({
        userId: persona.userId,
        attribute,
        value,
        source,
        confidence: record.confidence as number,
        observedAt: new Date(record.observed_at as string),
        validUntil: typeof record.valid_until === 'string' ? new Date(record.valid_until) : undefined,
      });
    }
  }

  for (const record of dataset.records.calendarEvents.filter((candidate) => candidate.user_id === persona.userId)) {
    await calendarRepo.upsert({
      userId: persona.userId,
      externalId: record.external_id as string,
      title: record.title as string,
      startTime: new Date(record.start_time as string),
      endTime: new Date(record.end_time as string),
      status: record.status as string,
      rawData: record.raw_data as string,
      syncedAt: new Date(record.synced_at as string),
    });
  }

  for (const record of dataset.records.decisions.filter((candidate) => candidate.user_id === persona.userId)) {
    if (await decisionRepo.findById(record.id)) continue;
    const relevantContext = parseRecordJson<ContextSnapshot>(record.context_snapshot, 'decision context');
    relevantContext.capturedAt = new Date(relevantContext.capturedAt);
    const recommendation = parseRecordJson<Recommendation>(record.recommendation, 'decision recommendation');
    await decisionRepo.create({
      id: record.id,
      userId: persona.userId,
      question: record.question as string,
      options: [],
      relevantContext,
      tradeoffs: [],
      recommendation,
      reasoning: recommendation.reasoning,
      confidence: recommendation.confidence,
      userChoice: typeof record.user_choice === 'string' ? record.user_choice : undefined,
      status: record.status as DecisionStatus,
    });
  }

  const existingObservations = await observationRepo.findByUserId(persona.userId, 500);
  for (const record of dataset.records.observations.filter((candidate) => candidate.user_id === persona.userId)) {
    const data = parseRecordJson<Record<string, unknown>>(record.data, 'observation data');
    const timestamp = new Date(record.timestamp as string);
    const alreadySeeded = existingObservations.some((existing) =>
      existing.type === record.type && JSON.stringify(existing.data) === JSON.stringify(data)
    );
    if (!alreadySeeded) {
      await observationRepo.create({
        userId: persona.userId,
        type: record.type as ObservationType,
        data,
        source: record.source as ObservationSource,
        confidence: record.confidence as number,
        timestamp,
      });
    }
  }
}

// Clear data for demo user
demoRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Reset stub executed
    res.json({ success: true, clearedUserId: userId, message: "Reset stub executed" });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get current demo scenario
demoRouter.get('/state', async (req: Request, res: Response) => {
  try {
    const userRepo = getUserRepository();
    const contextRepo = getContextRepository();
    const calendarRepo = getCalendarEventRepository();
    const userId = getUserId(req);

    const user = await userRepo.findById(userId);
    const contextAttrs = await contextRepo.findByUserId(userId, 10);
    const upcomingEvents = await calendarRepo.findUpcoming(userId);

    res.json({
      user,
      contextAttributes: contextAttrs.length,
      upcomingEvents: upcomingEvents.length,
      scenario: 'hackathon-deadline'
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Seed specific scenario
demoRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const userRepo = getUserRepository();
    const contextRepo = getContextRepository();
    const calendarRepo = getCalendarEventRepository();
    const decisionRepo = getDecisionRepository();
    const observationRepo = getObservationRepository();
    const interventionRepo = getInterventionRepository();

    const body = req.body as { scenario?: string };
    const scenario = typeof body.scenario === 'string' ? body.scenario : 'hackathon-deadline';
    const userId = getUserId(req);
    const personaSlug = PERSONA_SLUGS.find((slug) => userId.includes(slug));
    const isPhase4Seed = scenario === 'phase4-eval-v3' || personaSlug !== undefined;

    if (isPhase4Seed) {
      if (!personaSlug) {
        return res.status(400).json({
          error: `X-Demo-User must contain one of: ${PERSONA_SLUGS.join(', ')}`,
        });
      }
      await seedPhase4Persona(personaSlug, new Date());
      return res.json({
        success: true,
        scenario: 'phase4-eval-v3',
        message: `Demo scenario 'phase4-eval-v3' seeded for ${personaSlug}`,
      });
    }

    // Ensure demo user exists
    let user = await userRepo.findById(userId);
    if (!user) {
      user = await userRepo.findByEmail('demo@future-me.app');
      if (!user) {
        user = await userRepo.create({
          id: userId,
          email: 'demo@future-me.app',
          displayName: 'Demo User'
        });
      }
    }

    const now = new Date();

    // 1. Hackathon Deadline (existing)
    if (scenario === 'hackathon-deadline') {
      await contextRepo.create({
        userId,
        attribute: 'goal',
        value: JSON.stringify({
          id: 'g1',
          description: 'Complete Future Me MVP',
          deadline: '2026-09-25T23:59:00Z',
          priority: 'high'
        }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: now
      });

      await contextRepo.create({
        userId,
        attribute: 'preference',
        value: JSON.stringify({
          id: 'p1',
          category: 'work',
          description: 'Prefer deep work blocks in morning',
          value: 'morning-focus'
        }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        observedAt: now
      });
    }

    // 2. Scenario 1: Stale Context Check (Flow #15)
    else if (scenario === 'stale-context') {
      // Pending active decision
      await decisionRepo.create({
        id: `dec-stale-${Date.now()}`,
        userId,
        question: 'Prepare Quarterly Strategy Deck',
        options: [{ id: 'opt-1', label: 'Proceed' }, { id: 'opt-2', label: 'Postpone' }],
        relevantContext: {
          capturedAt: now,
          goals: [],
          commitments: [],
          constraints: [],
          relevantHistory: [],
          query: {
            question: 'Prepare Quarterly Strategy Deck',
            impactProfile: {
              target: 'Strategy Deck',
              timeCostHours: 2,
              deadline: new Date(now.getTime() + 24 * 3600000).toISOString()
            }
          }
        },
        tradeoffs: [],
        recommendation: { option: 'Proceed', confidence: 0.8, reasoning: 'Sufficient time available' },
        reasoning: 'Sufficient time available',
        confidence: 0.8,
        status: DecisionStatus.PENDING
      });


      // Calendar event that ended 2 hours ago without completion confirmation
      await calendarRepo.create({
        userId,
        externalId: `stale-sync-${Date.now()}`,
        title: 'Team Roadmap Alignment',
        startTime: new Date(now.getTime() - 3 * 3600000),
        endTime: new Date(now.getTime() - 2 * 3600000),
        status: 'CONFIRMED',
        syncedAt: now
      });
    }

    // 3. Scenario 2: Calendar Conflict Disruption (Flow #16)
    else if (scenario === 'calendar-conflict') {
      const deadline = new Date(now.getTime() + 6 * 3600000);
      await decisionRepo.create({
        id: `dec-conflict-${Date.now()}`,
        userId,
        question: 'Attend 4-Hour AWS Solutions Workshop',
        options: [{ id: 'opt-1', label: 'Attend' }, { id: 'opt-2', label: 'Skip' }],
        relevantContext: {
          capturedAt: now,
          goals: [],
          commitments: [],
          constraints: [],
          relevantHistory: [],
          query: {
            question: 'Attend 4-Hour AWS Solutions Workshop',
            impactProfile: {
              target: 'AWS Workshop',
              timeCostHours: 4,
              availableHoursBeforeDeadline: 6,
              workloadHoursBeforeDeadline: 0,
              deadline: deadline.toISOString(),
              source: 'provided'
            }
          }
        },
        tradeoffs: [],
        recommendation: { option: 'Attend', confidence: 0.75, reasoning: 'Workshop fits in schedule' },
        reasoning: 'Workshop fits in schedule',
        confidence: 0.75,
        status: DecisionStatus.PENDING
      });


      // New conflicting calendar event occupying 4 hours in that 6-hour window
      await calendarRepo.create({
        userId,
        externalId: `conflict-evt-${Date.now()}`,
        title: 'Mandatory Executive All-Hands',
        startTime: new Date(now.getTime() + 1 * 3600000),
        endTime: new Date(now.getTime() + 5 * 3600000),
        status: 'CONFIRMED',
        syncedAt: now
      });
    }

    // 4. Scenario 3: Workload Disruption
    else if (scenario === 'workload-disruption') {
      const deadline = new Date(now.getTime() + 8 * 3600000);
      await decisionRepo.create({
        id: `dec-workload-${Date.now()}`,
        userId,
        question: 'Refactor Core Payment Pipeline',
        options: [{ id: 'opt-1', label: 'Start now' }, { id: 'opt-2', label: 'Defer' }],
        relevantContext: {
          capturedAt: now,
          goals: [],
          commitments: [],
          constraints: [],
          relevantHistory: [],
          query: {
            question: 'Refactor Core Payment Pipeline',
            impactProfile: {
              target: 'Payment Pipeline',
              timeCostHours: 3,
              availableHoursBeforeDeadline: 8,
              workloadHoursBeforeDeadline: 1,
              deadline: deadline.toISOString(),
              source: 'provided'
            }
          }
        },
        tradeoffs: [],
        recommendation: { option: 'Start now', confidence: 0.8, reasoning: 'Capacity is available' },
        reasoning: 'Capacity is available',
        confidence: 0.8,
        status: DecisionStatus.PENDING
      });


      // Add high severity workload increase observation
      await observationRepo.create({
        userId,
        type: ObservationType.CONTEXT_CHANGE,
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0,
        data: {
          description: 'workload-increase',
          severity: 'high',
          additionalHours: 4
        },
        timestamp: now
      });
    }

    // 5. Scenario 4: 4-Hour Dismiss Cooldown Proof
    else if (scenario === 'dismiss-cooldown') {
      const issueKey = `stale:event:cooldown-meeting-${Date.now()}`;
      await decisionRepo.create({
        id: `dec-cooldown-${Date.now()}`,
        userId,
        question: 'Write Performance Review Summary',
        options: [{ id: 'opt-1', label: 'Write' }],
        relevantContext: {
          capturedAt: now,
          goals: [],
          commitments: [],
          constraints: [],
          relevantHistory: [],
          query: {
            question: 'Write Performance Review Summary',
            impactProfile: {
              target: 'Performance Review',
              timeCostHours: 1,
              deadline: new Date(now.getTime() + 24 * 3600000).toISOString()
            }
          }
        },
        tradeoffs: [],
        recommendation: { option: 'Write', confidence: 0.8, reasoning: 'Feasible' },
        reasoning: 'Feasible',
        confidence: 0.8,
        status: DecisionStatus.PENDING
      });


      // Stale calendar event
      const createdEvent = await calendarRepo.create({
        userId,
        externalId: issueKey,
        title: 'Project Retrospective',
        startTime: new Date(now.getTime() - 3 * 3600000),
        endTime: new Date(now.getTime() - 2 * 3600000),
        status: 'CONFIRMED',
        syncedAt: now
      });

      // Create pre-existing dismissed intervention (dismissed 20 minutes ago)
      await interventionRepo.create({
        id: `int-dismissed-${Date.now()}`,
        userId,
        issueKey: `stale:event:${createdEvent.id || createdEvent.externalId}`,
        type: 'CONTEXT_CHECK',
        level: InterventionLevel.PROACTIVE,
        status: 'DISMISSED',
        reason: 'Event ended over 1 hour ago without completion confirmation.',
        prompt: 'Are you still working on "Project Retrospective"? Did you complete it?',
        severity: 'medium',
        dismissedAt: new Date(now.getTime() - 20 * 60 * 1000)
      });

    }

    // 6. Scenario 5: Explicit NO_OP / Silence Proof (Flow #17)
    else if (scenario === 'noop-silence') {
      // Clean state: all decisions resolved/cancelled (no pending decision)
      // Any calendar events or observations are immaterial because no active decision depends on them
      await calendarRepo.create({
        userId,
        externalId: `cal-tranquil-${Date.now()}`,
        title: 'Regular Standup',
        startTime: new Date(now.getTime() + 1 * 3600000),
        endTime: new Date(now.getTime() + 1.25 * 3600000), // 15 min standup
        status: 'CONFIRMED',
        syncedAt: now
      });
    }

    res.json({
      success: true,
      scenario,
      message: `Demo scenario '${scenario}' seeded`
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

