/**
 * Mock Decision Engine
 * MVP: Uses mock LLM for decision support
 * PROVISIONAL - replaceable with real Bedrock integration
 */

import { DecisionQuery, DecisionSupport, Decision, DecisionStatus } from '../domain/types';
import { IDecisionEngine, IContextEngine } from './interfaces';
import { ILLMProvider } from '../adapters/llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';

export class MockDecisionEngine implements IDecisionEngine {
  constructor(
    private llmProvider: ILLMProvider,
    private contextEngine: IContextEngine
  ) {}

  async supportDecision(userId: string, query: DecisionQuery): Promise<DecisionSupport> {
    // Get relevant context
    const relevantContext = await this.contextEngine.getRelevantContext(userId, query);
    
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

Please analyze this decision.`;

    const response = await this.llmProvider.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    let parsed: any;
    try {
      parsed = JSON.parse(response.content);
    } catch (e) {
      // Fallback if LLM doesn't return valid JSON
      parsed = {
        recommendation: {
          option: 'uncertain',
          confidence: 0.5,
          reasoning: 'Unable to generate recommendation'
        },
        tradeoffs: []
      };
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
      tradeoffs: parsed.tradeoffs || [],
      recommendation: parsed.recommendation,
      reasoning: parsed.recommendation.reasoning,
      confidence: parsed.recommendation.confidence,
      status: DecisionStatus.PENDING,
      createdAt: new Date()
    };

    return {
      decision,
      clarificationNeeded: []
    };
  }
}
