/**
 * Intelligence Component Interfaces
 * Based on docs/ARCHITECTURE.md Section 5
 * 
 * PROVISIONAL IMPLEMENTATIONS - Keep simple and replaceable
 */

import {
  PersonalContext,
  StateEstimate,
  Observation,
  Forecast,
  DecisionQuery,
  DecisionSupport,
  InterventionDecision,
  ContextAnalystRequest,
  ContextAnalystResult,
  RelevantContext,
  ContextCorrection
} from '../domain/types';

// ========================================
// Context Engine Interface
// ========================================

export interface IContextEngine {
  getCurrentContext(userId: string): Promise<PersonalContext>;
  updateContext(userId: string, observation: Observation): Promise<PersonalContext>;
  getRelevantContext(userId: string, decision: DecisionQuery): Promise<RelevantContext>;
  confirmContextAttribute(userId: string, attributeId: string): Promise<void>;
  correctContext(userId: string, correction: ContextCorrection): Promise<PersonalContext>;
}

// ========================================
// State Estimator Interface
// ========================================

export interface IStateEstimator {
  estimateCurrentState(
    context: PersonalContext,
    observations: Observation[]
  ): Promise<StateEstimate>;
}

// ========================================
// Forecast Engine Interface
// ========================================

export interface IForecastEngine {
  forecastDisruption(
    context: PersonalContext,
    horizon: number
  ): Promise<Forecast | null>;
}

// ========================================
// Decision Engine Interface
// ========================================

export interface IDecisionEngine {
  supportDecision(
    userId: string,
    query: DecisionQuery
  ): Promise<DecisionSupport>;
}

// ========================================
// Intervention Policy Interface
// ========================================

export interface IInterventionPolicy {
  shouldIntervene(
    state: StateEstimate,
    context: PersonalContext
  ): Promise<InterventionDecision>;
}

// ========================================
// LLM Context Analyst Interface
// ========================================

export interface ILLMContextAnalyst {
  analyze(request: ContextAnalystRequest): Promise<ContextAnalystResult>;
}
