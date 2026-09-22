/**
 * Mock Decision Engine
 * MVP: Uses mock LLM for decision support
 * PROVISIONAL - replaceable with real Bedrock integration
 */

import { DecisionQuery, DecisionSupport, Decision, DecisionStatus, Tradeoff } from '../domain/types';
import { IDecisionEngine, IContextEngine } from './interfaces';
import { ILLMProvider } from '../adapters/llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { assessDecisionFeasibility } from './deterministic-feasibility-assessment';
import { evaluateDecisionPolicy } from './decision-policy-evaluator';

const tradeoffSchema: z.ZodType<Tradeoff> = z.object({
  option: z.string().trim().min(1).max(200),
  gains: z.array(z.string().trim().min(1).max(500)).min(1).max(10),
  costs: z.array(z.string().trim().min(1).max(500)).min(1).max(10)
}).strict();

const tradeoffEnvelopeSchema = z.object({
  tradeoffs: z.array(z.unknown()).max(20)
}).strict();

export class MockDecisionEngine implements IDecisionEngine {
  constructor(
    private llmProvider: ILLMProvider,
    private contextEngine: IContextEngine
  ) {}

  async supportDecision(userId: string, query: DecisionQuery): Promise<DecisionSupport> {
    // Get relevant context
    const relevantContext = await this.contextEngine.getRelevantContext(userId, query);
    const assessment = assessDecisionFeasibility(query.impactProfile, new Date(), relevantContext);

    // Evaluate policy
    const policyResult = evaluateDecisionPolicy(assessment, query.clarification);

    let tradeoffs: Tradeoff[] = [];

    if (policyResult.outcome === 'RECOMMEND') {
      // Build LLM prompt
      const systemPrompt = `You are a decision support assistant. Analyze the user's question in context of their goals, commitments, and constraints. Describe clear tradeoffs.

Return your response as JSON with this structure:
{
  "tradeoffs": [
    {
      "option": "string",
      "gains": ["string"],
      "costs": ["string"]
    }
  ]
}`;

      const userPrompt = `Question: ${query.question}

Context:
- Goals: ${JSON.stringify(relevantContext.goals)}
- Commitments: ${JSON.stringify(relevantContext.commitments)}
- Current State: ${relevantContext.state.state}
- Candidate Impact: ${JSON.stringify(query.impactProfile ?? null)}

Please describe meaningful tradeoffs without inventing feasibility facts.`;

      const response = await this.llmProvider.generate([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
      tradeoffs = parseTradeoffs(response.content);
    }

    // Create decision object
    const decision: Decision = {
      id: uuidv4(),
      userId,
      question: query.question,
      options: query.options?.map(opt => ({ id: uuidv4(), label: opt })) || [],
      relevantContext: {
        capturedAt: new Date(),
        goals: relevantContext.goals,
        commitments: relevantContext.commitments,
        constraints: relevantContext.constraints,
        relevantHistory: relevantContext.recentHistory
      },
      tradeoffs,
      recommendation: assessment.recommendation,
      reasoning: policyResult.outcome === 'ABSTAIN' ? policyResult.reason : assessment.recommendation.reasoning,
      confidence: assessment.recommendation.confidence,
      status: DecisionStatus.PENDING,
      createdAt: new Date()
    };

    let clarificationNeeded: string[] | undefined;
    if (policyResult.outcome === 'ASK') {
      clarificationNeeded = Array.from(new Set(clarificationQuestions(policyResult.unresolvedMaterialFields || [])));
      if (policyResult.unresolvedMaterialConflicts && policyResult.unresolvedMaterialConflicts.length > 0) {
        clarificationNeeded.push('Please resolve the conflicting information provided.');
      }
    }

    return {
      decision,
      assessment,
      clarificationNeeded,
      policy: policyResult,
      state: relevantContext.state
    };
  }
}

function parseTradeoffs(content: string): Tradeoff[] {
  try {
    const envelope = tradeoffEnvelopeSchema.safeParse(JSON.parse(content));
    if (!envelope.success) {
      return [];
    }

    return envelope.data.tradeoffs.flatMap(candidate => {
      const tradeoff = tradeoffSchema.safeParse(candidate);
      return tradeoff.success ? [tradeoff.data] : [];
    });
  } catch {
    return [];
  }
}

function clarificationQuestions(missingData: string[]): string[] {
  return missingData.map(field => {
    switch (field) {
      case 'timeCostHours':
        return 'How many hours will this candidate commitment require?';
      case 'availableHoursBeforeDeadline or deadline':
        return 'What is the deadline, or how many hours are available before it?';
      case 'workloadHoursBeforeDeadline':
        return 'How many hours of existing workload remain before the deadline?';
      case 'energyCost':
        return 'How much energy will the candidate commitment require?';
      case 'availableEnergy':
        return 'How much energy is currently available?';
      default:
        return `Please provide ${field}.`;
    }
  });
}
