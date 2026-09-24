/**
 * Mock Decision Engine
 * MVP: Uses mock LLM for decision support
 * PROVISIONAL - replaceable with real Bedrock integration
 */

import { DecisionQuery, DecisionSupport, Decision, DecisionStatus, Tradeoff, HistoricalDecision } from '../domain/types';
import { IDecisionEngine, IContextEngine } from './interfaces';
import { ILLMProvider } from '../adapters/llm-provider.interface';
import { IDecisionRepository, IDecisionChoiceRepository, IOutcomeRepository } from '../repositories/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { assessDecisionFeasibility } from './deterministic-feasibility-assessment';
import { evaluateDecisionPolicy } from './decision-policy-evaluator';
import { retrieveRelevantHistory, inferCategory } from './decision-history-retrieval';

const tradeoffSchema: z.ZodType<Tradeoff> = z.object({
  option: z.string().trim().min(1).max(200),
  gains: z.array(z.string().trim().min(1).max(500)).min(1).max(10),
  costs: z.array(z.string().trim().min(1).max(500)).min(1).max(10)
}).strict();

const tradeoffEnvelopeSchema = z.object({
  tradeoffs: z.array(z.unknown()).max(20)
}).strict();

/**
 * Format history for AI prompt context
 */
function formatHistoryForPrompt(h: HistoricalDecision): string {
  const date = h.date.toISOString().split('T')[0];
  const outcome = h.outcomeStatus === 'positive' ? '✓' : h.outcomeStatus === 'negative' ? '✗' : '~';
  const repeat = h.wouldRepeat !== null ? (h.wouldRepeat ? ' (would repeat)' : ' (would not repeat)') : '';
  return `[${date}] "${h.question}" → ${h.chosenActionDisplay} ${outcome}${repeat}${h.outcomeNotes ? ` - "${h.outcomeNotes}"` : ''}`;
}

/**
 * Format history for user display
 */
function formatHistoryForUser(h: HistoricalDecision): string {
  const date = h.date.toISOString().split('T')[0];
  const outcome = h.outcomeStatus.charAt(0).toUpperCase() + h.outcomeStatus.slice(1);
  const repeat = h.wouldRepeat !== null ? `, would repeat: ${h.wouldRepeat ? 'Yes' : 'No'}` : '';
  return `${date}: ${h.chosenActionDisplay} (${outcome}${repeat})${h.outcomeNotes ? ` - "${h.outcomeNotes}"` : ''}`;
}

export class MockDecisionEngine implements IDecisionEngine {
  constructor(
    private llmProvider: ILLMProvider,
    private contextEngine: IContextEngine,
    private decisionRepo: IDecisionRepository,
    private choiceRepo: IDecisionChoiceRepository,
    private outcomeRepo: IOutcomeRepository
  ) {}

  async supportDecision(userId: string, query: DecisionQuery): Promise<DecisionSupport> {
    // PHASE 6: Retrieve relevant history BEFORE recommendation generation
    const relevantHistory = await retrieveRelevantHistory(
      userId,
      query,
      this.decisionRepo,
      this.choiceRepo,
      this.outcomeRepo
    );

    // Get relevant context
    const relevantContext = await this.contextEngine.getRelevantContext(userId, query);
    const assessment = assessDecisionFeasibility(query.impactProfile, new Date(), relevantContext);

    // Evaluate policy
    const policyResult = evaluateDecisionPolicy(
      assessment,
      query.clarification,
      relevantContext.unresolvedConflicts ?? []
    );

    let tradeoffs: Tradeoff[] = [];

    if (policyResult.outcome === 'RECOMMEND') {
      // Build LLM prompt with history injected
      const systemPrompt = `You are a decision support assistant. Analyze the user's question in context of their goals, commitments, and constraints. Describe clear tradeoffs.

${relevantHistory.length > 0 ? `IMPORTANT: The user has relevant past experience with similar decisions. Consider this history in your reasoning, but apply it contextually - don't mechanically repeat past choices. Reference specific past decisions naturally in your reasoning.

Past Experience:
${relevantHistory.map(h => `- ${formatHistoryForPrompt(h)}`).join('\n')}
` : ''}
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

${relevantHistory.length > 0 ? `Your Past Experience:
${relevantHistory.map(h => `- ${formatHistoryForUser(h)}`).join('\n')}
` : ''}
Please describe meaningful tradeoffs without inventing feasibility facts.${relevantHistory.length > 0 ? ' Reference your past experience where relevant.' : ''}`;

      const response = await this.llmProvider.generate([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
      tradeoffs = parseTradeoffs(response.content);
    }

    const finalReasoning = (policyResult.outcome === 'ABSTAIN' ? policyResult.reason : assessment.recommendation.reasoning) +
      (relevantHistory.length > 0 ? `\n\nPast experience considered:\n${relevantHistory.map(h => formatHistoryForUser(h)).join('\n')}` : '');

    // Create decision object
    const decision: Decision = {
      id: uuidv4(),
      userId,
      question: query.question,
      category: inferCategory(query.question),
      options: query.options?.map(opt => ({ id: uuidv4(), label: opt })) || [],
      relevantContext: {
        capturedAt: new Date(),
        goals: relevantContext.goals,
        commitments: relevantContext.commitments,
        constraints: relevantContext.constraints,
        relevantHistory: relevantHistory.map(h => 
          `${h.date.toISOString().split('T')[0]}: ${h.chosenActionDisplay} (${h.outcomeStatus}${h.wouldRepeat !== null ? ', would repeat: ' + (h.wouldRepeat ? 'yes' : 'no') : ''})`
        )
      },
      tradeoffs,
      recommendation: {
        ...assessment.recommendation,
        reasoning: finalReasoning
      },
      reasoning: finalReasoning,
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
      state: relevantContext.state,
      relevantHistory
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
      case 'availableHoursBeforeDeadline':
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
