import { MockDecisionEngine } from '../intelligence/mock-decision-engine';
import { IContextEngine } from '../intelligence/interfaces';
import { ILLMProvider, LLMMessage } from '../adapters/llm-provider.interface';
import { DecisionQuery, RelevantContext, Observation, PersonalContext, ContextCorrection, PersonalState } from '../domain/types';

class CountingFakeLLM implements ILLMProvider {
  callCount = 0;
  // eslint-disable-next-line @typescript-eslint/require-await
  async generate(_messages: LLMMessage[]): Promise<{ role: string; content: string }> {
    this.callCount++;
    return {
      role: 'assistant',
      content: JSON.stringify({
        tradeoffs: [
          { option: 'proceed', gains: ['gain1'], costs: ['cost1'] }
        ]
      })
    };
  }
}

class FakeContextEngine implements IContextEngine {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getRelevantContext(_userId: string, _query: DecisionQuery): Promise<RelevantContext> {
    return {
      goals: [],
      commitments: [],
      constraints: [],
      recentHistory: [],
      state: { state: PersonalState.FLOW, timestamp: new Date(), confidence: 1, evidence: [] }
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getCurrentContext(_userId: string): Promise<PersonalContext> {
    return {
      userId: _userId,
      goals: [],
      commitments: [],
      preferences: [],
      calendar: { upcomingEvents: 0, busyHoursToday: 0, busyHoursThisWeek: 0 },
      recentDecisions: [],
      lastUpdated: new Date()
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updateContext(_userId: string, _observation: Observation): Promise<PersonalContext> {
    return await this.getCurrentContext(_userId);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async confirmContextAttribute(_attributeId: string): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async correctContext(_userId: string, _correction: ContextCorrection): Promise<PersonalContext> {
    return await this.getCurrentContext(_userId);
  }
}

describe('MockDecisionEngine Integration', () => {
  let engine: MockDecisionEngine;
  let llm: CountingFakeLLM;
  let contextEngine: FakeContextEngine;

  beforeEach(() => {
    llm = new CountingFakeLLM();
    contextEngine = new FakeContextEngine();
    engine = new MockDecisionEngine(llm, contextEngine);
  });

  const baseQuery: DecisionQuery = {
    question: 'Should I do this?',
    options: ['proceed', 'do-not-proceed', 'proceed-with-caution'],
    impactProfile: {
      timeCostHours: 5,
      availableHoursBeforeDeadline: 10,
      workloadHoursBeforeDeadline: 2,
      energyCost: 10,
      availableEnergy: 50
    }
  };

  it('feasible -> policy RECOMMEND, exact existing option proceed, LLM called once', async () => {
    const result = await engine.supportDecision('user1', baseQuery);
    expect(result.policy.outcome).toBe('RECOMMEND');
    expect(result.decision.recommendation.option).toBe('proceed');
    expect(llm.callCount).toBe(1);
    expect(result.clarificationNeeded).toBeUndefined();
  });

  it('at-risk -> RECOMMEND, exact option proceed-with-caution', async () => {
    const query: DecisionQuery = {
      ...baseQuery,
      impactProfile: {
        ...baseQuery.impactProfile,
        workloadHoursBeforeDeadline: 3
      }
    };

    const result = await engine.supportDecision('user1', query);
    expect(result.policy.outcome).toBe('RECOMMEND');
    expect(result.decision.recommendation.option).toBe('proceed-with-caution');
    expect(llm.callCount).toBe(1);
  });

  it('not-feasible -> RECOMMEND, exact option do-not-proceed', async () => {
    const query: DecisionQuery = {
      ...baseQuery,
      impactProfile: {
        ...baseQuery.impactProfile,
        workloadHoursBeforeDeadline: 6
      }
    };
    const result = await engine.supportDecision('user1', query);
    expect(result.policy.outcome).toBe('RECOMMEND');
    expect(result.decision.recommendation.option).toBe('do-not-proceed');
    expect(llm.callCount).toBe(1);
  });

  it('first missing material data -> ASK, minimum clarification strings, empty tradeoffs, LLM never called', async () => {
    const query: DecisionQuery = {
      ...baseQuery,
      impactProfile: {
        ...baseQuery.impactProfile,
        timeCostHours: undefined, // missing
      }
    };
    const result = await engine.supportDecision('user1', query);
    expect(result.policy.outcome).toBe('ASK');
    expect(result.clarificationNeeded).toEqual(['How many hours will this candidate commitment require?']);
    expect(result.decision.tradeoffs).toEqual([]);
    expect(llm.callCount).toBe(0);
  });

  it('attempted clarification with same missing data -> ABSTAIN, empty tradeoffs, LLM never called, policy reason exactly the deterministic abstention sentence', async () => {
    const query: DecisionQuery = {
      ...baseQuery,
      impactProfile: {
        ...baseQuery.impactProfile,
        timeCostHours: undefined
      },
      clarification: {
        attempted: true,
        unresolvedFields: ['timeCostHours']
      }
    };
    const result = await engine.supportDecision('user1', query);
    expect(result.policy.outcome).toBe('ABSTAIN');
    expect(result.policy.reason).toBe('I do not know enough to make a useful recommendation.');
    expect(result.decision.tradeoffs).toEqual([]);
    expect(llm.callCount).toBe(0);
    expect(result.clarificationNeeded).toBeUndefined();
  });

  it('conflict first pass ASK; attempted unresolved conflict ABSTAIN; both skip LLM', async () => {
    const firstPassQuery: DecisionQuery = {
      ...baseQuery,
      clarification: {
        attempted: false,
        unresolvedConflicts: ['deadline_conflict']
      }
    };
    const result1 = await engine.supportDecision('user1', firstPassQuery);
    expect(result1.policy.outcome).toBe('ASK');
    expect(result1.clarificationNeeded).toContain('Please resolve the conflicting information provided.');
    expect(llm.callCount).toBe(0);

    const secondPassQuery: DecisionQuery = {
      ...baseQuery,
      clarification: {
        attempted: true,
        unresolvedConflicts: ['deadline_conflict']
      }
    };
    const result2 = await engine.supportDecision('user1', secondPassQuery);
    expect(result2.policy.outcome).toBe('ABSTAIN');
    expect(llm.callCount).toBe(0);
    expect(result2.clarificationNeeded).toBeUndefined();
  });

  it('threads a conflict detected by the context engine into ASK then ABSTAIN without calling the LLM', async () => {
    class ConflictingContextEngine extends FakeContextEngine {
      // eslint-disable-next-line @typescript-eslint/require-await
      async getRelevantContext(): Promise<RelevantContext> {
        return {
          goals: [],
          commitments: [],
          constraints: [],
          recentHistory: [],
          unresolvedConflicts: ['Conflicting goal evidence for aws-goal.'],
          state: { state: PersonalState.FLOW, timestamp: new Date(), confidence: 1, evidence: [] }
        };
      }
    }

    const conflictLlm = new CountingFakeLLM();
    const conflictEngine = new MockDecisionEngine(conflictLlm, new ConflictingContextEngine());
    const first = await conflictEngine.supportDecision('user1', baseQuery);

    expect(first.policy.outcome).toBe('ASK');
    expect(first.policy.unresolvedMaterialConflicts).toEqual(['Conflicting goal evidence for aws-goal.']);
    expect(first.decision.tradeoffs).toEqual([]);
    expect(conflictLlm.callCount).toBe(0);

    const second = await conflictEngine.supportDecision('user1', {
      ...baseQuery,
      clarification: { attempted: true }
    });

    expect(second.policy.outcome).toBe('ABSTAIN');
    expect(second.policy.unresolvedMaterialConflicts).toEqual(['Conflicting goal evidence for aws-goal.']);
    expect(second.decision.tradeoffs).toEqual([]);
    expect(conflictLlm.callCount).toBe(0);
  });

  it('Invalid inputs at engine boundary ABSTAIN and skip LLM', async () => {
    const query: DecisionQuery = {
      ...baseQuery,
      impactProfile: {
        ...baseQuery.impactProfile,
        timeCostHours: -5 // invalid
      }
    };
    const result = await engine.supportDecision('user1', query);
    expect(result.policy.outcome).toBe('ABSTAIN');
    expect(result.policy.reason).toBe('I do not know enough to make a useful recommendation.');
    expect(llm.callCount).toBe(0);
  });

  it('complete inputs but unresolvedFields forces ASK and returns field question, skipping LLM', async () => {
    const query: DecisionQuery = {
      ...baseQuery,
      clarification: {
        attempted: false,
        unresolvedFields: ['energyCost']
      }
    };
    const result = await engine.supportDecision('user1', query);
    expect(result.policy.outcome).toBe('ASK');
    expect(result.clarificationNeeded).toContain('How much energy will the candidate commitment require?');
    expect(llm.callCount).toBe(0);
  });
});
