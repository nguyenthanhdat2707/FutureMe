import { describe, expect, it } from 'vitest';
import {
  DEMO_WORLD_STORAGE_KEY,
  DEMO_WORLD_VERSION,
  buildMentoringPlanPreview,
  createDemoWorldBaseline,
  demoWorldReducer,
  hydrateDemoWorld,
  selectCapacitySummary,
  selectCurrentOpportunity,
  selectHistoryAndLearnedSignal,
  selectMentoringAlternatives,
  selectScenarioBReasoning,
} from './index';

function canonicalRecommendationState() {
  let world = createDemoWorldBaseline();
  world = demoWorldReducer(world, { type: 'start-mentoring-decision' });
  world = demoWorldReducer(world, {
    type: 'answer-expected-outcome',
    answer: 'meaningful-limited',
  });
  return demoWorldReducer(world, {
    type: 'answer-commitment-flexibility',
    answer: 'scope-and-schedule-adjustable',
  });
}

function previewState() {
  let world = canonicalRecommendationState();
  world = demoWorldReducer(world, { type: 'use-mentoring-plan' });
  return demoWorldReducer(world, {
    type: 'set-team-availability',
    availability: 'flexible-best-fit',
  });
}

describe('demo world baseline', () => {
  it('creates one pristine Persona A world on the fixed October 5-18, 2026 timeline', () => {
    const world = createDemoWorldBaseline();

    expect(world.demoVersion).toBe(DEMO_WORLD_VERSION);
    expect(world.persona.id).toBe('persona-a');
    expect(world.period).toEqual({ start: '2026-10-05', end: '2026-10-18' });
    expect(world.calendarEvents[0]?.start.startsWith('2026-10-05')).toBe(true);
    expect(world.calendarEvents[world.calendarEvents.length - 1]?.start.startsWith('2026-10-18')).toBe(true);
    expect(world.capacityProfile.workload).toBe('high');
    expect(world.capacityProfile.mentalWellbeing.value).toBe('slightly-strained');
    expect(world.capacityProfile.mentalWellbeing.provenance).toBe('user-reported');
  });

  it('links stable task, event, opportunity, deadline, and decision IDs', () => {
    const world = createDemoWorldBaseline();
    const monthlyReport = world.tasks.find((task) => task.id === 'task.monthly-report');
    const mentoring = world.opportunities.find((item) => item.id === 'opportunity.student-startup-mentoring');

    expect(monthlyReport?.scheduledEventId).toBe('event.monthly-report.2026-10-16');
    expect(mentoring?.decisionId).toBe('decision.mentoring');
    expect(world.tasks.find((task) => task.id === 'deadline.client-proposal')?.deadlineEventId)
      .toBe('event.client-proposal-deadline.2026-10-08');
  });
});

describe('Scenario A decision and execution', () => {
  it('asks exactly two material decision clarifications and exposes exactly three alternatives', () => {
    const world = canonicalRecommendationState();

    expect(world.activeDecision?.clarifications).toHaveLength(2);
    expect(world.activeDecision?.stage).toBe('recommendation');
    expect(selectMentoringAlternatives(world)).toHaveLength(3);
    expect(selectMentoringAlternatives(world)).toContainEqual(expect.objectContaining({
      id: 'focused-session',
      title: 'Focused Mentoring Session',
      fit: 'strong',
      recommended: true,
    }));
  });

  it('keeps scheduling unavailable until the user chooses Use this plan', () => {
    const recommended = canonicalRecommendationState();
    expect(recommended.activePlan).toBeUndefined();
    expect(recommended.activeDecision?.stage).toBe('recommendation');

    const executing = demoWorldReducer(recommended, { type: 'use-mentoring-plan' });
    expect(executing.activeDecision?.stage).toBe('team-availability');
    expect(executing.activePlan).toBeUndefined();
  });

  it('builds a pure preview with consolidation, relocation, preparation, and mentoring insertions', () => {
    const world = canonicalRecommendationState();
    const snapshot = structuredClone(world);
    const preview = buildMentoringPlanPreview(world, 'flexible-best-fit');

    expect(preview.operations.map((operation) => operation.kind)).toEqual([
      'consolidate',
      'relocate',
      'insert',
      'insert',
    ]);
    expect(preview.afterEventIds).toEqual(expect.arrayContaining([
      'event.teaching-monthly-report.2026-10-16',
      'event.weekly-planning.2026-10-13',
      'event.mentoring-preparation.2026-10-16',
      'event.focused-mentoring.2026-10-16',
    ]));
    expect(world).toEqual(snapshot);
  });

  it('applies the preview consistently while leaving the actual outcome empty', () => {
    const proposed = previewState();
    const applied = demoWorldReducer(proposed, { type: 'apply-active-plan' });

    expect(applied.calendarEvents.some((event) => event.id === 'event.focused-mentoring.2026-10-16')).toBe(true);
    expect(applied.tasks.find((task) => task.id === 'task.weekly-planning')?.scheduledEventId)
      .toBe('event.weekly-planning.2026-10-13');
    expect(applied.opportunities.find((item) => item.id === 'opportunity.student-startup-mentoring')?.status)
      .toBe('planned');
    expect(applied.decisions).toContainEqual(expect.objectContaining({
      id: 'decision.mentoring',
      status: 'planned',
    }));
    expect(applied.outcomes).toHaveLength(0);
    expect(selectCapacitySummary(applied).availableCapacity).toBe('limited');
    expect(applied.activePlan?.status).toBe('applied');
  });
});

describe('Scenario B and Understanding', () => {
  it('derives no-clarification free-time versus usable-capacity reasoning', () => {
    const reasoning = selectScenarioBReasoning(createDemoWorldBaseline());

    expect(reasoning.clarificationRequired).toBe(false);
    expect(reasoning.calendarConflict).toBe(false);
    expect(reasoning.timeAvailable).toBe(true);
    expect(reasoning.usableCapacity).toBe('low');
    expect(reasoning.recommendation).toBe('use-recording-instead');
  });

  it('supports user-owned correction and inferred override without writable derived values', () => {
    const baseline = createDemoWorldBaseline();
    const corrected = demoWorldReducer(baseline, {
      type: 'update-mental-wellbeing',
      value: 'steady',
    });
    const overridden = demoWorldReducer(corrected, {
      type: 'override-opportunity-value',
      opportunityId: 'opportunity.professional-workshop',
      value: 'low',
    });
    const ignored = demoWorldReducer(overridden, {
      type: 'set-available-capacity',
      value: 'high',
    } as never);

    expect(corrected.capacityProfile.mentalWellbeing).toMatchObject({
      value: 'steady',
      provenance: 'user-reported',
    });
    expect(selectCurrentOpportunity(overridden, 'opportunity.professional-workshop')?.value)
      .toMatchObject({ level: 'low', provenance: 'user-reported', overridden: true });
    expect(ignored).toBe(overridden);
    expect(selectCapacitySummary(ignored).availableCapacity).toBe('limited');
  });

  it('records completion separately and learns from 75 minutes versus an estimated 30-45', () => {
    const applied = demoWorldReducer(previewState(), { type: 'apply-active-plan' });
    const completed = demoWorldReducer(applied, {
      type: 'complete-mentoring-with-reflection',
      actualPreparationMinutes: 75,
    });
    const history = selectHistoryAndLearnedSignal(completed);

    expect(completed.outcomes).toContainEqual(expect.objectContaining({
      id: 'outcome.mentoring.2026-10-16',
      estimatedPreparationMinutes: { min: 30, max: 45 },
      actualPreparationMinutes: 75,
    }));
    expect(history.learnedSignals).toContainEqual(expect.objectContaining({
      id: 'learned-signal.mentoring-preparation-buffer',
    }));
  });
});

describe('persistence and reset', () => {
  it('hydrates only matching versioned state and safely falls back for incompatible data', () => {
    const storage = new Map<string, string>();
    const adapter = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    const changed = demoWorldReducer(createDemoWorldBaseline(), {
      type: 'update-mental-wellbeing',
      value: 'steady',
    });
    adapter.setItem(DEMO_WORLD_STORAGE_KEY, JSON.stringify(changed));
    expect(hydrateDemoWorld(adapter).capacityProfile.mentalWellbeing.value).toBe('steady');

    adapter.setItem(DEMO_WORLD_STORAGE_KEY, JSON.stringify({ ...changed, demoVersion: 'old' }));
    expect(hydrateDemoWorld(adapter)).toEqual(createDemoWorldBaseline());
    adapter.setItem(DEMO_WORLD_STORAGE_KEY, '{broken');
    expect(hydrateDemoWorld(adapter)).toEqual(createDemoWorldBaseline());
  });

  it('deep-restores the exact pristine baseline and returns a fresh object graph', () => {
    const changed = demoWorldReducer(previewState(), { type: 'apply-active-plan' });
    const reset = demoWorldReducer(changed, { type: 'reset-demo-world' });
    const pristine = createDemoWorldBaseline();

    expect(reset).toEqual(pristine);
    expect(reset).not.toBe(pristine);
    expect(reset.calendarEvents).not.toBe(pristine.calendarEvents);
  });
});
