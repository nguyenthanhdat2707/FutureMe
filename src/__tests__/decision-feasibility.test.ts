import { ILLMProvider } from '../adapters/llm-provider.interface';
import {
  ContextCorrection,
  DecisionImpactProfile,
  DecisionQuery,
  Observation,
  PersonalContext,
  PersonalState,
  RelevantContext
} from '../domain/types';
import { IContextEngine } from '../intelligence/interfaces';
import { MockDecisionEngine } from '../intelligence/mock-decision-engine';

class FakeContextEngine implements IContextEngine {
  private readonly context: PersonalContext = {
    userId: 'user-1',
    goals: [],
    commitments: [],
    preferences: [],
    calendar: {
      upcomingEvents: 0,
      busyHoursToday: 0,
      busyHoursThisWeek: 0
    },
    recentDecisions: [],
    lastUpdated: new Date('2026-09-21T00:00:00.000Z')
  };

  async getCurrentContext(): Promise<PersonalContext> {
    await Promise.resolve();
    return this.context;
  }

  async updateContext(_userId: string, _observation: Observation): Promise<PersonalContext> {
    await Promise.resolve();
    return this.context;
  }

  async getRelevantContext(): Promise<RelevantContext> {
    await Promise.resolve();
    return {
      goals: [],
      commitments: [],
      constraints: [],
      recentHistory: [],
      state: {
        state: PersonalState.FLOW,
        confidence: 0.8,
        evidence: [],
        timestamp: new Date('2026-09-21T00:00:00.000Z')
      }
    };
  }

  async confirmContextAttribute(): Promise<void> {}

  async correctContext(_userId: string, _correction: ContextCorrection): Promise<PersonalContext> {
    await Promise.resolve();
    return this.context;
  }
}

const llmProvider: ILLMProvider = {
  async generate() {
    await Promise.resolve();
    return {
      content: JSON.stringify({
        recommendation: {
          option: 'invented-by-llm',
          confidence: 1,
          reasoning: 'This must not control feasibility.'
        },
        tradeoffs: [
          {
            option: 'candidate commitment',
            gains: ['Narrative benefit'],
            costs: ['Narrative cost']
          }
        ]
      })
    };
  }
};

function queryWithImpact(question: string, impactProfile: DecisionImpactProfile): DecisionQuery {
  return { question, impactProfile };
}

async function assess(query: DecisionQuery) {
  const engine = new MockDecisionEngine(llmProvider, new FakeContextEngine(),
    { findById: async () => null, findByUserId: async () => [], create: async (d: any) => ({...d, createdAt: new Date()}), updateChoice: async () => null, updateStatus: async () => null } as any,
    { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (c: any) => ({...c, id: 'test', createdAt: new Date()}) } as any,
    { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (o: any) => ({...o, id: 'test', createdAt: new Date(), updatedAt: new Date()}), update: async () => null } as any
  );
  return engine.supportDecision('user-1', query);
}

describe('deterministic decision feasibility assessment', () => {
  it('returns feasible when capacity and energy are sufficient', async () => {
    const support = await assess(queryWithImpact('Should I accept this commitment?', {
      timeCostHours: 4,
      availableHoursBeforeDeadline: 20,
      workloadHoursBeforeDeadline: 8,
      energyCost: 3,
      availableEnergy: 8,
      goalRelevance: 'high',
      source: 'user-confirmed'
    }));

    expect(support.assessment).toMatchObject({
      availableTimeBeforeDeadlineHours: 20,
      projectedRemainingCapacityHours: 8,
      deadlinePressure: 'low',
      energyFit: 'good',
      feasibility: 'feasible'
    });
    expect(support.assessment.recommendation.option).toBe('proceed');
    expect(support.assessment.recommendation.confidence).toBeGreaterThan(0.8);
    expect(support.assessment.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'user-confirmed' })
    ]));
    expect(support.decision.recommendation.option).not.toBe('invented-by-llm');
  });

  it('warns about high deadline pressure when the commitment exceeds capacity', async () => {
    const support = await assess(queryWithImpact('Can I add this obligation?', {
      timeCostHours: 10,
      availableHoursBeforeDeadline: 8,
      workloadHoursBeforeDeadline: 2,
      energyCost: 2,
      availableEnergy: 8,
      source: 'user-confirmed'
    }));

    expect(support.assessment.feasibility).toBe('not-feasible');
    expect(support.assessment.projectedRemainingCapacityHours).toBe(-4);
    expect(support.assessment.deadlinePressure).toBe('high');
    expect(support.assessment.recommendation.reasoning).toMatch(/deadline pressure/i);
  });

  it('requests clarification instead of inventing an assessment when inputs are missing', async () => {
    const support = await assess({ question: 'Should I do this?' });

    expect(support.assessment).toMatchObject({
      availableTimeBeforeDeadlineHours: null,
      projectedRemainingCapacityHours: null,
      deadlinePressure: 'unknown',
      energyFit: 'unknown',
      feasibility: 'needs-info'
    });
    expect(support.assessment.missingData).toEqual(expect.arrayContaining([
      'timeCostHours',
      'availableHoursBeforeDeadline'
    ]));
    expect(support.clarificationNeeded).toEqual(expect.arrayContaining([
      expect.stringMatching(/time|hours/i),
      expect.stringMatching(/deadline|available/i)
    ]));
    expect(support.decision.recommendation.option).toBe('clarify');
  });

  it('reports negative values as invalid inputs instead of missing data', async () => {
    const support = await assess(queryWithImpact('Should I do this?', {
      timeCostHours: -5,
      availableHoursBeforeDeadline: 8,
      workloadHoursBeforeDeadline: 0,
      energyCost: 1,
      availableEnergy: 5
    }));

    expect(support.assessment.invalidInputs).toContain('timeCostHours');
    expect(support.assessment.missingData).not.toContain('timeCostHours');
  });

  it('uses supplied impact values for a generic question rather than workshop-specific matching', async () => {
    const feasible = await assess(queryWithImpact('Is this the right choice?', {
      timeCostHours: 2,
      availableHoursBeforeDeadline: 16,
      workloadHoursBeforeDeadline: 4,
      energyCost: 1,
      availableEnergy: 6
    }));
    const infeasible = await assess(queryWithImpact('Is this the right choice?', {
      timeCostHours: 12,
      availableHoursBeforeDeadline: 8,
      workloadHoursBeforeDeadline: 3,
      energyCost: 7,
      availableEnergy: 4
    }));

    expect(feasible.assessment.feasibility).toBe('feasible');
    expect(infeasible.assessment.feasibility).toBe('not-feasible');
    expect(feasible.assessment.projectedRemainingCapacityHours).toBe(10);
    expect(infeasible.assessment.projectedRemainingCapacityHours).toBe(-7);
  });

  it('applies context workload increases and energy decreases', async () => {
    class ContextEngineWithHistory extends FakeContextEngine {
      async getRelevantContext(): Promise<RelevantContext> {
        await Promise.resolve();
        return {
          goals: [],
          commitments: [],
          constraints: [],
          recentHistory: [
            'CONTEXT_CHANGE: {"type":"workload-increase","severity":"high"}', // +4h
            'CONTEXT_CHANGE: {"type":"energy-decrease"}' // -1 energy
          ],
          state: {
            state: PersonalState.FLOW,
            confidence: 0.8,
            evidence: [],
            timestamp: new Date()
          }
        };
      }
    }
    const engine = new MockDecisionEngine(llmProvider, new ContextEngineWithHistory(), { findById: async () => null, findByUserId: async () => [], create: async (d: any) => ({...d, createdAt: new Date()}), updateChoice: async () => null, updateStatus: async () => null } as any, { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (c: any) => ({...c, id: "test", createdAt: new Date()}) } as any, { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (o: any) => ({...o, id: "test", createdAt: new Date(), updatedAt: new Date()}), update: async () => null } as any);
    const support = await engine.supportDecision('user-1', queryWithImpact('Test', {
      timeCostHours: 4,
      availableHoursBeforeDeadline: 10,
      workloadHoursBeforeDeadline: 2,
      energyCost: 3,
      availableEnergy: 4,
    }));

    expect(support.assessment.projectedRemainingCapacityHours).toBe(0); // 10 - (2+4) - 4 = 0
    expect(support.assessment.energyFit).toBe('strained'); // available = 4 - 1 = 3, cost 3 -> remaining 0 -> strained
    expect(support.assessment.deadlinePressure).toBe('moderate'); // 0 hours remaining
  });

  it('reports missing workload data even if context provides workload adjustments', async () => {
    class ContextEngineWithHistory extends FakeContextEngine {
      async getRelevantContext(): Promise<RelevantContext> {
        await Promise.resolve();
        return {
          goals: [],
          commitments: [],
          constraints: [],
          recentHistory: [
            'CONTEXT_CHANGE: {"type":"workload-increase","severity":"high"}' // +4h
          ],
          state: {
            state: PersonalState.FLOW,
            confidence: 0.8,
            evidence: [],
            timestamp: new Date()
          }
        };
      }
    }
    const engine = new MockDecisionEngine(llmProvider, new ContextEngineWithHistory(), { findById: async () => null, findByUserId: async () => [], create: async (d: any) => ({...d, createdAt: new Date()}), updateChoice: async () => null, updateStatus: async () => null } as any, { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (c: any) => ({...c, id: "test", createdAt: new Date()}) } as any, { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (o: any) => ({...o, id: "test", createdAt: new Date(), updatedAt: new Date()}), update: async () => null } as any);
    const support = await engine.supportDecision('user-1', queryWithImpact('Test', {
      timeCostHours: 2,
      availableHoursBeforeDeadline: 10
      // workloadHoursBeforeDeadline intentionally omitted
    }));

    expect(support.assessment.missingData).toContain('workloadHoursBeforeDeadline');
    expect(support.assessment.projectedRemainingCapacityHours).toBe(4); // 10 - (0 + 4) - 2 = 4
  });

  it('rejects overloaded state plus disruption context as not-feasible', async () => {
    class ContextEngineWithHistory extends FakeContextEngine {
      async getRelevantContext(): Promise<RelevantContext> {
        await Promise.resolve();
        return {
          goals: [],
          commitments: [],
          constraints: [],
          recentHistory: [
            'CONTEXT_CHANGE: {"type":"disruption"}'
          ],
          state: {
            state: PersonalState.OVERLOADED,
            confidence: 1,
            evidence: [],
            timestamp: new Date()
          }
        };
      }
    }
    const engine = new MockDecisionEngine(llmProvider, new ContextEngineWithHistory(), { findById: async () => null, findByUserId: async () => [], create: async (d: any) => ({...d, createdAt: new Date()}), updateChoice: async () => null, updateStatus: async () => null } as any, { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (c: any) => ({...c, id: "test", createdAt: new Date()}) } as any, { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (o: any) => ({...o, id: "test", createdAt: new Date(), updatedAt: new Date()}), update: async () => null } as any);
    const support = await engine.supportDecision('user-1', queryWithImpact('Test', {
      timeCostHours: 1,
      availableHoursBeforeDeadline: 10,
      workloadHoursBeforeDeadline: 2,
      energyCost: 1,
      availableEnergy: 4,
    }));

    expect(support.assessment.feasibility).toBe('not-feasible');
  });
  it('does not require energy inputs to produce a feasible recommendation', async () => {
    const support = await assess(queryWithImpact('Should I do this?', {
      timeCostHours: 4,
      availableHoursBeforeDeadline: 20,
      workloadHoursBeforeDeadline: 8
    }));

    expect(support.assessment.missingData).not.toContain('energyCost');
    expect(support.assessment.missingData).not.toContain('availableEnergy');
    expect(support.assessment.feasibility).toBe('feasible');
    expect(support.decision.recommendation.option).toBe('proceed');
    expect(support.policy.outcome).toBe('RECOMMEND');
  });
});
