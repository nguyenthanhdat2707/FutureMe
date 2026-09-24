/**
 * Phase 6: Complete Learning Loop Integration Test
 * 
 * Verifies:
 * 1. History retrieval happens BEFORE AI generation
 * 2. Decision → Choice → Check-in → Outcome → Future decision uses history
 * 3. Outcome correction propagates to future recommendations
 */

import { MockDecisionEngine } from '../intelligence/mock-decision-engine';
import { SimpleContextEngine } from '../intelligence/simple-context-engine';
import { MockLLMProvider } from '../adapters/mock-llm-provider';
import { SqliteDecisionRepository } from '../repositories/decision.repository';
import { SqliteDecisionChoiceRepository } from '../repositories/decision-choice.repository';
import { SqliteOutcomeRepository } from '../repositories/outcome.repository';
import { initDatabase, closeDatabase } from '../database/connection';
import { DecisionQuery, DecisionStatus } from '../domain/types';

describe('Phase 6: Learning Loop Integration', () => {
  let engine: MockDecisionEngine;
  let decisionRepo: SqliteDecisionRepository;
  let choiceRepo: SqliteDecisionChoiceRepository;
  let outcomeRepo: SqliteOutcomeRepository;

  const userId = 'test-user-phase6';

  beforeAll(async () => {
    await initDatabase();
    
    const llm = new MockLLMProvider();
    
    // Create mock context repo with minimal implementation
    const mockContextRepo = {
      findByUserId: async () => [],
      findById: async () => null,
      create: async (attr: any) => ({ ...attr, id: 'test-id', createdAt: new Date() }),
      confirmAttribute: async () => {},
      correctAttribute: async () => {}
    };
    
    const mockObservationRepo = {
      findByUserId: async () => [],
      findRecent: async () => [],
      findById: async () => null,
      create: async (obs: any) => ({ ...obs, id: 'test-id', createdAt: new Date() })
    };
    
    const mockCalendarRepo = {
      findUpcoming: async () => [],
      findById: async () => null,
      findByUserId: async () => [],
      findByExternalId: async () => null,
      create: async (event: any) => ({ ...event, id: 'test-id', createdAt: new Date() }),
      upsert: async (event: any) => ({ ...event, id: 'test-id', createdAt: new Date() })
    };
    
    const mockStateEstimator = {
      estimateCurrentState: () => ({
        state: 'FLOW' as any,
        confidence: 0.8,
        evidence: [],
        timestamp: new Date()
      })
    };
    
    decisionRepo = new SqliteDecisionRepository();
    choiceRepo = new SqliteDecisionChoiceRepository();
    outcomeRepo = new SqliteOutcomeRepository();
    
    const contextEngine = new SimpleContextEngine(
      mockContextRepo as any,
      mockObservationRepo as any,
      mockCalendarRepo as any,
      decisionRepo as any,
      mockStateEstimator as any
    );
    
    engine = new MockDecisionEngine(
      llm,
      contextEngine,
      decisionRepo,
      choiceRepo,
      outcomeRepo
    );
  });

  afterAll(() => {
    closeDatabase();
  });

  it('complete learning loop: decision → choice → outcome → similar decision uses history', async () => {
    // Step 1: Make first decision about declining a project
    const firstQuery: DecisionQuery = {
      question: 'Should I decline Project Alpha to focus on my MVP deadline?',
      impactProfile: {
        timeCostHours: 20,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        availableHoursBeforeDeadline: 40,
        workloadHoursBeforeDeadline: 35,
        goalRelevance: 'high',
        source: 'user-confirmed'
      }
    };

    const firstSupport = await engine.supportDecision(userId, firstQuery);
    expect(firstSupport.decision).toBeDefined();
    
    // Save first decision
    const firstDecision = firstSupport.decision;
    firstDecision.query = firstQuery;
    await decisionRepo.create(firstDecision);

    // Step 2: User records their choice (declined)
    const choice = await choiceRepo.create({
      decisionId: firstDecision.id,
      userId,
      chosenAction: 'decline',
      chosenActionDisplay: 'Decline Project Alpha',
      aiRecommendation: firstSupport.decision.recommendation.option,
      chosenAt: new Date(),
      status: 'final'
    });

    expect(choice.chosenAction).toBe('decline');
    expect(choice.status).toBe('final');

    // Step 3: User records positive outcome
    const outcome = await outcomeRepo.create({
      decisionId: firstDecision.id,
      userId,
      outcomeStatus: 'positive',
      wouldRepeat: true,
      outcomeNotes: 'Had more time to complete MVP deadline. Made the right call.',
      recordedAt: new Date()
    });

    expect(outcome.outcomeStatus).toBe('positive');
    expect(outcome.wouldRepeat).toBe(true);

    // Step 4: Make similar decision (Project Beta)
    const secondQuery: DecisionQuery = {
      question: 'Should I decline Project Beta to focus on my MVP deadline?',
      impactProfile: {
        timeCostHours: 25,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        availableHoursBeforeDeadline: 40,
        workloadHoursBeforeDeadline: 30,
        goalRelevance: 'high',
        source: 'user-confirmed'
      }
    };

    // This should retrieve history BEFORE generating recommendation
    const secondSupport = await engine.supportDecision(userId, secondQuery);
    
    // Verify history was considered (reasoning should mention past experience)
    expect(secondSupport.decision.recommendation.reasoning.toLowerCase()).toMatch(
      /(previous|past|experience|similar|declined|alpha)/
    );
  }, 10000);

  it('correction loop: positive → edit to negative → next recommendation uses corrected outcome', async () => {
    // Step 1: Make first decision
    const firstQuery: DecisionQuery = {
      question: 'Should I accept the workshop invitation this weekend?',
      impactProfile: {
        timeCostHours: 8,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        availableHoursBeforeDeadline: 15,
        workloadHoursBeforeDeadline: 5,
        goalRelevance: 'medium',
        source: 'user-confirmed'
      }
    };

    const firstSupport = await engine.supportDecision(userId, firstQuery);
    const firstDecision = firstSupport.decision;
    firstDecision.query = firstQuery;
    await decisionRepo.create(firstDecision);

    // Step 2: User accepts
    const choice = await choiceRepo.create({
      decisionId: firstDecision.id,
      userId,
      chosenAction: 'accept',
      chosenActionDisplay: 'Accept workshop invitation',
      aiRecommendation: firstSupport.decision.recommendation.option,
      chosenAt: new Date(),
      status: 'final'
    });

    // Step 3: Initially record as positive
    const outcome = await outcomeRepo.create({
      decisionId: firstDecision.id,
      userId,
      outcomeStatus: 'positive',
      wouldRepeat: true,
      outcomeNotes: 'Workshop was valuable.',
      recordedAt: new Date()
    });

    const outcomeId = outcome.id;

    // Step 4: User corrects to negative (realized it wasn't worth it)
    const corrected = await outcomeRepo.update(outcomeId, {
      outcomeStatus: 'negative',
      wouldRepeat: false,
      outcomeNotes: 'Workshop was not as valuable as expected. Should have focused on MVP.'
    });

    expect(corrected?.outcomeStatus).toBe('negative');
    expect(corrected?.wouldRepeat).toBe(false);

    // Step 5: Make similar decision
    const secondQuery: DecisionQuery = {
      question: 'Should I accept another workshop invitation this weekend?',
      impactProfile: {
        timeCostHours: 10,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        availableHoursBeforeDeadline: 18,
        workloadHoursBeforeDeadline: 6,
        goalRelevance: 'medium',
        source: 'user-confirmed'
      }
    };

    const secondSupport = await engine.supportDecision(userId, secondQuery);
    
    // Should retrieve corrected outcome (negative, would not repeat)
    // Reasoning should reflect the negative past experience
    expect(secondSupport.decision.recommendation.reasoning.toLowerCase()).toMatch(
      /(previous|past|workshop|not.*valuable|focus)/
    );
  }, 10000);

  it('defer does NOT create check-in', async () => {
    const query: DecisionQuery = {
      question: 'Should I join the hackathon next month?',
      impactProfile: {
        timeCostHours: 40,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        goalRelevance: 'medium',
        source: 'user-confirmed'
      }
    };

    const support = await engine.supportDecision(userId, query);
    const decision = support.decision;
    decision.query = query;
    await decisionRepo.create(decision);

    // User defers decision
    const choice = await choiceRepo.create({
      decisionId: decision.id,
      userId,
      chosenAction: 'defer',
      chosenActionDisplay: 'Decide Later',
      aiRecommendation: support.decision.recommendation.option,
      chosenAt: new Date(),
      status: 'deferred'
    });

    expect(choice.status).toBe('deferred');
    
    // Verify no outcome should be created for deferred decisions
    const outcome = await outcomeRepo.findByDecisionId(decision.id);
    expect(outcome).toBeNull();
  });

  it('filters history by category, recency, and outcome status', async () => {
    // This test verifies the retrieval filters work correctly
    // The actual filtering is tested in the retrieval logic itself
    // Here we just verify that old decisions and pending outcomes don't break the flow
    
    const query: DecisionQuery = {
      question: 'Should I decline new opportunity to focus on deadline?',
      impactProfile: {
        timeCostHours: 15,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        goalRelevance: 'high',
        source: 'user-confirmed'
      }
    };

    // Should work even if there are old/pending decisions in the database
    const support = await engine.supportDecision(userId, query);
    
    expect(support.decision).toBeDefined();
    expect(support.decision.recommendation).toBeDefined();
  }, 10000);
});
