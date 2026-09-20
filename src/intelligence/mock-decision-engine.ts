/**
 * Mock Decision Engine
 * MVP: Uses mock LLM for decision support
 * PROVISIONAL - replaceable with real Bedrock integration
 */

import { DecisionQuery, DecisionSupport, Decision, DecisionStatus, Tradeoff } from '../domain/types';
import { IDecisionEngine, IContextEngine } from './interfaces';
import { ILLMProvider } from '../adapters/llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import { assessDecisionFeasibility } from './deterministic-feasibility-assessment';

export class MockDecisionEngine implements IDecisionEngine {
  constructor(
    private llmProvider: ILLMProvider,
    private contextEngine: IContextEngine
  ) {}

  async supportDecision(userId: string, query: DecisionQuery): Promise<DecisionSupport> {
    // Get relevant context
    const relevantContext = await this.contextEngine.getRelevantContext(userId, query);
    const assessment = assessDecisionFeasibility(query.impactProfile);
    
    // Build LLM prompt
    const systemPrompt = `You are a decision support assistant. Analyze the user's question in context of their goals, commitments, and constraints. Provide a recommendation with clear tradeoffs.

Return your response as JSON with this structure:
{
  "recommendation": {
    "option": "string",
    "confidence": 0.0-1.0,
    "reasoning": "string"
  },
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

    let tradeoffs: Tradeoff[] = [];
    try {
      const parsed: unknown = JSON.parse(response.content);
      if (hasTradeoffs(parsed)) {
        tradeoffs = parsed.tradeoffs;
      }
    } catch {
      // Fallback if LLM doesn't return valid JSON
      tradeoffs = [];
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
      reasoning: assessment.recommendation.reasoning,
      confidence: assessment.recommendation.confidence,
      status: DecisionStatus.PENDING,
      createdAt: new Date()
    };

    return {
      decision,
      assessment,
      clarificationNeeded: clarificationQuestions(assessment.missingData)
    };
  }
}

function hasTradeoffs(value: unknown): value is { tradeoffs: Tradeoff[] } {
  return typeof value === 'object' && value !== null && Array.isArray((value as { tradeoffs?: unknown }).tradeoffs);
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
