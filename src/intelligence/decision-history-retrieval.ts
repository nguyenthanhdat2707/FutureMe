/**
 * Decision History Retrieval Service (Phase 6)
 * 
 * Retrieves relevant historical decisions to inject into AI reasoning context.
 * Must be called BEFORE recommendation generation, not after.
 */

import { 
  HistoricalDecision, 
  DecisionCategory,
  DecisionQuery
} from '../domain/types';
import { IDecisionRepository, IDecisionChoiceRepository, IOutcomeRepository } from '../repositories/interfaces';

export interface HistoryRetrievalOptions {
  category?: DecisionCategory;
  keywords?: string[];
  relevantGoals?: string[];
  maxResults?: number;
  maxAgeMonths?: number;
}

/**
 * Extract keywords from decision question for matching
 */
export function extractKeywords(question: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'should', 'i', 'my']);
  
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10);
}

/**
 * Calculate keyword overlap score between two keyword sets
 */
export function calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const set1 = new Set(keywords1.map(k => k.toLowerCase()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase()));
  
  let matches = 0;
  for (const keyword of set1) {
    if (set2.has(keyword)) matches++;
  }
  
  return matches / Math.max(set1.size, set2.size);
}

/**
 * Infer decision category from question content
 */
export function inferCategory(question: string): DecisionCategory {
  const lower = question.toLowerCase();
  
  if (lower.includes('opportunity') || lower.includes('offer') || lower.includes('invitation')) {
    return 'opportunity';
  }
  if (lower.includes('commit') || lower.includes('promise') || lower.includes('agree')) {
    return 'commitment';
  }
  if (lower.includes('workload') || lower.includes('busy') || lower.includes('capacity')) {
    return 'workload';
  }
  if (lower.includes('priority') || lower.includes('focus') || lower.includes('important')) {
    return 'priority';
  }
  if (lower.includes('deadline') || lower.includes('due') || lower.includes('timeline')) {
    return 'deadline';
  }
  if (lower.includes('learn') || lower.includes('study') || lower.includes('course')) {
    return 'learning';
  }
  if (lower.includes('collaborate') || lower.includes('team') || lower.includes('work with')) {
    return 'collaboration';
  }
  if (lower.includes('health') || lower.includes('wellbeing') || lower.includes('rest') || lower.includes('balance')) {
    return 'personal-wellbeing';
  }
  
  return 'other';
}

/**
 * Retrieve relevant historical decisions for a current decision context
 */
export async function retrieveRelevantHistory(
  userId: string,
  currentDecision: DecisionQuery,
  decisionRepo: IDecisionRepository,
  choiceRepo: IDecisionChoiceRepository,
  outcomeRepo: IOutcomeRepository,
  options: HistoryRetrievalOptions = {}
): Promise<HistoricalDecision[]> {
  const {
    maxResults = 2,
    maxAgeMonths = 6
  } = options;

  // Extract keywords from current decision
  const currentKeywords = extractKeywords(currentDecision.question);
  const currentCategory = options.category || inferCategory(currentDecision.question);
  
  // Get all user decisions
  const allDecisions = await decisionRepo.findByUserId(userId, 100);
  
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);
  
  // Collect candidates with their scores
  const candidates: Array<{
    decision: HistoricalDecision;
    score: number;
  }> = [];
  
  for (const decision of allDecisions) {
    // Skip if too old
    if (decision.createdAt < cutoffDate) continue;
    
    // Get choice and outcome
    const choice = await choiceRepo.findByDecisionId(decision.id);
    const outcome = await outcomeRepo.findByDecisionId(decision.id);
    
    // Skip if no choice recorded
    if (!choice) continue;
    
    // Skip if outcome is still pending
    if (!outcome || outcome.outcomeStatus === 'pending') continue;
    
    // Skip if deferred (not a final decision)
    if (choice.status === 'deferred') continue;
    
    // Infer category if not stored
    const decisionCategory = decision.category || inferCategory(decision.question);
    
    // Category must match (required filter)
    if (decisionCategory !== currentCategory) continue;
    
    // Extract keywords from historical decision
    const historicalKeywords = extractKeywords(decision.question);
    
    // Calculate keyword overlap score
    const keywordScore = calculateKeywordOverlap(currentKeywords, historicalKeywords);
    
    // Skip if keyword overlap is too low
    if (keywordScore < 0.3) continue;
    
    // Calculate recency score (0-1, more recent = higher)
    const ageMs = Date.now() - decision.createdAt.getTime();
    const maxAgeMs = maxAgeMonths * 30 * 24 * 60 * 60 * 1000;
    const recencyScore = 1 - (ageMs / maxAgeMs);
    
    // Combined score: keyword overlap (70%) + recency (30%)
    const score = keywordScore * 0.7 + recencyScore * 0.3;
    
    candidates.push({
      decision: {
        decisionId: decision.id,
        date: decision.createdAt,
        category: decisionCategory,
        question: decision.question,
        chosenAction: choice.chosenAction,
        chosenActionDisplay: choice.chosenActionDisplay,
        outcomeStatus: outcome.outcomeStatus,
        wouldRepeat: outcome.wouldRepeat,
        outcomeNotes: outcome.outcomeNotes,
        keywords: historicalKeywords,
        relevantGoals: [] // Could extract from context snapshot if needed
      },
      score
    });
  }
  
  // Sort by score descending and return top N
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates.slice(0, maxResults).map(c => c.decision);
}
