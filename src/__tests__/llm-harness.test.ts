/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars */
import { ILLMProvider, LLMMessage } from '../adapters/llm-provider.interface';
import { MockLLMProvider } from '../adapters/mock-llm-provider';
import {
  ContextAnalystRequest,
  ContextCorrection,
  DecisionQuery,
  Observation,
  PersonalContext,
  PersonalState,
  RelevantContext
} from '../domain/types';
import { BoundedLLMContextAnalyst } from '../intelligence/bounded-llm-context-analyst';
import { IContextEngine } from '../intelligence/interfaces';
import { MockDecisionEngine } from '../intelligence/mock-decision-engine';

const request: ContextAnalystRequest = {
  signals: [
    {
      id: 'signal-1',
      description: 'Three caller-derived late work blocks this week',
      evidenceIds: ['evidence-1']
    }
  ],
  evidence: [
    {
      id: 'evidence-1',
      description: 'Deterministic schedule summary: 9 evening hours'
    }
  ],
  contextAttributes: [
    {
      id: 'preferred-work-time',
      value: 'unknown'
    }
  ]
};

function validProviderResponse(): string {
  return JSON.stringify({
    proposedHypotheses: [
      {
        statement: 'The user may currently prefer evening work.',
        signalIds: ['signal-1'],
        evidenceIds: ['evidence-1'],
        contextAttributeIds: ['preferred-work-time']
      }
    ],
    candidateClarificationQuestions: [
      {
        question: 'When do you prefer to do focused work?',
        resolvesContextAttributeIds: ['preferred-work-time'],
        signalIds: ['signal-1'],
        evidenceIds: ['evidence-1'],
        responseFormat: {
          type: 'quick-choice',
          options: ['Morning', 'Afternoon', 'Evening']
        }
      }
    ]
  });
}

describe('bounded LLM context analyst', () => {
  it('sends only the compact caller-supplied request and returns proposals', async () => {
    const generate = jest.fn(async (
      _messages: LLMMessage[],
      _options?: { temperature?: number; maxTokens?: number }
    ) => {
      await Promise.resolve();
      return {
        content: validProviderResponse()
      };
    });
    const analyst = new BoundedLLMContextAnalyst({ generate });

    const result = await analyst.analyze(request);

    expect(generate).toHaveBeenCalledTimes(1);
    const [messages, options] = generate.mock.calls[0];
    expect(JSON.parse(messages[1].content)).toEqual(request);
    expect(messages[1].content).not.toContain('startTime');
    expect(messages[1].content).not.toContain('rawData');
    expect(messages[0].content).toContain('untrusted data');
    expect(options).toEqual(expect.objectContaining({ temperature: 0 }));
    expect(result.validation).toEqual({ status: 'accepted' });
    expect(result.proposedHypotheses[0]).toMatchObject({
      status: 'proposed',
      signalIds: ['signal-1'],
      evidenceIds: ['evidence-1']
    });
    expect(result.candidateClarificationQuestions[0]).toMatchObject({
      status: 'proposed',
      resolvesContextAttributeIds: ['preferred-work-time'],
      evidenceIds: ['evidence-1'],
      responseFormat: {
        type: 'quick-choice',
        options: ['Morning', 'Afternoon', 'Evening']
      }
    });
  });

  it.each([
    ['invalid-json', 'not json'],
    ['invalid-schema', JSON.stringify({ proposedHypotheses: [] })],
    ['unknown-reference', validProviderResponse().replace('evidence-1', 'unknown-evidence')]
  ])('returns no proposals for %s output', async (reason, content) => {
    const analyst = new BoundedLLMContextAnalyst({
      async generate() {
        await Promise.resolve();
        return { content };
      }
    });

    const result = await analyst.analyze(request);

    expect(result).toEqual({
      proposedHypotheses: [],
      candidateClarificationQuestions: [],
      validation: { status: 'rejected', reason }
    });
  });

  it('works with the deterministic mock provider', async () => {
    const analyst = new BoundedLLMContextAnalyst(new MockLLMProvider());

    const result = await analyst.analyze(request);

    expect(result.validation).toEqual({ status: 'accepted' });
    expect(result.proposedHypotheses).toHaveLength(1);
    expect(result.candidateClarificationQuestions).toHaveLength(1);
  });

  it('rejects an oversized request before calling the provider', async () => {
    const generate = jest.fn(async () => {
      await Promise.resolve();
      return { content: validProviderResponse() };
    });
    const analyst = new BoundedLLMContextAnalyst({ generate });
    const oversizedRequest: ContextAnalystRequest = {
      ...request,
      signals: [{ ...request.signals[0], description: 'x'.repeat(501) }]
    };

    await expect(analyst.analyze(oversizedRequest)).resolves.toEqual({
      proposedHypotheses: [],
      candidateClarificationQuestions: [],
      validation: { status: 'rejected', reason: 'invalid-request' }
    });
    expect(generate).not.toHaveBeenCalled();
  });
});

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
    return Promise.resolve(this.context);
  }

  async updateContext(_userId: string, _observation: Observation): Promise<PersonalContext> {
    return Promise.resolve(this.context);
  }

  async getRelevantContext(): Promise<RelevantContext> {
    return Promise.resolve({
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
    });
  }

  async confirmContextAttribute(): Promise<void> {
    return Promise.resolve();
  }

  async correctContext(_userId: string, _correction: ContextCorrection): Promise<PersonalContext> {
    return Promise.resolve(this.context);
  }
}

describe('decision tradeoff validation', () => {
  it('discards malformed tradeoffs individually and keeps deterministic authority', async () => {
    const provider: ILLMProvider = {
      async generate() {
        return Promise.resolve({
          content: JSON.stringify({
            tradeoffs: [
              {
                option: 'valid option',
                gains: ['Valid gain'],
                costs: ['Valid cost']
              },
              {
                option: 'missing costs',
                gains: ['Gain']
              },
              {
                option: 'wrong gain type',
                gains: [42],
                costs: ['Cost']
              },
              {
                option: 'unexpected field',
                gains: ['Gain'],
                costs: ['Cost'],
                score: 1
              }
            ]
          })
        });
      }
    };
    const engine = new MockDecisionEngine(provider, new FakeContextEngine(),
      { findById: async () => null, findByUserId: async () => [], create: async (d: any) => ({...d, createdAt: new Date()}), updateChoice: async () => null, updateStatus: async () => null } as any,
      { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (c: any) => ({...c, id: 'test', createdAt: new Date()}) } as any,
      { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (o: any) => ({...o, id: 'test', createdAt: new Date(), updatedAt: new Date()}), update: async () => null } as any
    );
    const query: DecisionQuery = {
      question: 'Should I accept this commitment?',
      impactProfile: {
        timeCostHours: 2,
        availableHoursBeforeDeadline: 12,
        workloadHoursBeforeDeadline: 4,
        energyCost: 2,
        availableEnergy: 8,
        source: 'user-confirmed'
      }
    };

    const result = await engine.supportDecision('user-1', query);

    expect(result.decision.tradeoffs).toEqual([
      {
        option: 'valid option',
        gains: ['Valid gain'],
        costs: ['Valid cost']
      }
    ]);
    expect(result.decision.recommendation.option).toBe(result.assessment.recommendation.option);
    expect(result.decision.reasoning).toBe(result.assessment.recommendation.reasoning);
    expect(result.decision.confidence).toBe(result.assessment.recommendation.confidence);
  });

  it('rejects a tradeoff envelope with unexpected model-controlled fields', async () => {
    const provider: ILLMProvider = {
      async generate() {
        await Promise.resolve();
        return {
          content: JSON.stringify({
            recommendation: { option: 'model-controlled' },
            tradeoffs: [{ option: 'valid option', gains: ['Gain'], costs: ['Cost'] }]
          })
        };
      }
    };
    const engine = new MockDecisionEngine(provider, new FakeContextEngine(),
      { findById: async () => null, findByUserId: async () => [], create: async (d: any) => ({...d, createdAt: new Date()}), updateChoice: async () => null, updateStatus: async () => null } as any,
      { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (c: any) => ({...c, id: 'test', createdAt: new Date()}) } as any,
      { findById: async () => null, findByDecisionId: async () => null, findByUserId: async () => [], create: async (o: any) => ({...o, id: 'test', createdAt: new Date(), updatedAt: new Date()}), update: async () => null } as any
    );

    const result = await engine.supportDecision('user-1', {
      question: 'Should I accept this commitment?',
      impactProfile: {
        timeCostHours: 2,
        availableHoursBeforeDeadline: 12,
        workloadHoursBeforeDeadline: 4,
        energyCost: 2,
        availableEnergy: 8,
        source: 'user-confirmed'
      }
    });

    expect(result.decision.tradeoffs).toEqual([]);
    expect(result.decision.recommendation).toEqual(result.assessment.recommendation);
  });
});
