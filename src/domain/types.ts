/**
 * Domain Type Definitions
 * Based on docs/DOMAIN_CONTRACT.md and docs/ARCHITECTURE.md
 */

// ========================================
// Personal Context
// ========================================

export interface PersonalContext {
  userId: string;
  goals: Goal[];
  commitments: Commitment[];
  preferences: Preference[];
  calendar: CalendarSummary;
  recentDecisions: Decision[];
  lastUpdated: Date;
}

export interface Goal {
  id: string;
  description: string;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface Commitment {
  id: string;
  description: string;
  startTime: Date;
  endTime: Date;
  recurring?: boolean;
}

export interface Preference {
  id: string;
  category: string;
  description: string;
  value: string;
}

export interface CalendarSummary {
  upcomingEvents: number;
  busyHoursToday: number;
  busyHoursThisWeek: number;
}

// ========================================
// Personal State
// ========================================

export enum PersonalState {
  FLOW = 'FLOW',
  UNCERTAIN = 'UNCERTAIN',
  DRIFTING = 'DRIFTING',
  DISRUPTED = 'DISRUPTED',
  OVERLOADED = 'OVERLOADED'
}

export interface StateEstimate {
  state: PersonalState;
  confidence: number;
  evidence: string[];
  timestamp: Date;
}

// ========================================
// Observation
// ========================================

export enum ObservationType {
  CALENDAR_EVENT_STARTED = 'CALENDAR_EVENT_STARTED',
  CALENDAR_EVENT_ENDED = 'CALENDAR_EVENT_ENDED',
  CONTEXT_CHANGE = 'CONTEXT_CHANGE',
  TASK_COMPLETED = 'TASK_COMPLETED',
  DEADLINE_MOVED = 'DEADLINE_MOVED',
  USER_REPORTED = 'USER_REPORTED'
}

export enum ObservationSource {
  USER_CONFIRMED = 'USER_CONFIRMED',
  CALENDAR = 'CALENDAR',
  SYSTEM_OBSERVED = 'SYSTEM_OBSERVED',
  SYSTEM_INFERRED = 'SYSTEM_INFERRED',
  HISTORICAL_PATTERN = 'HISTORICAL_PATTERN',
  EXTERNAL_SOURCE = 'EXTERNAL_SOURCE'
}

export interface Observation {
  id: string;
  userId: string;
  type: ObservationType;
  data: Record<string, unknown>;
  source: ObservationSource;
  confidence: number;
  timestamp: Date;
  createdAt: Date;
}

// ========================================
// Forecast
// ========================================

export interface Forecast {
  id: string;
  userId: string;
  target: string;
  prediction: string;
  probability?: number;
  horizon: number; // hours
  drivers: string[];
  generatedAt: Date;
}

// ========================================
// Decision
// ========================================

export enum DecisionStatus {
  PENDING = 'PENDING',
  CHOSEN = 'CHOSEN',
  CANCELLED = 'CANCELLED'
}

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
}

export interface Tradeoff {
  option: string;
  gains: string[];
  costs: string[];
}

export interface Recommendation {
  option: string;
  confidence: number;
  reasoning: string;
}

export type DecisionImpactSource = 'user-confirmed' | 'provided' | 'estimated';

export interface DecisionImpactProfile {
  timeCostHours?: number;
  target?: string;
  deadline?: Date | string;
  availableHoursBeforeDeadline?: number;
  workloadHoursBeforeDeadline?: number;
  energyCost?: number;
  availableEnergy?: number;
  goalRelevance?: 'low' | 'medium' | 'high';
  source?: DecisionImpactSource;
}

export type DecisionFeasibility = 'feasible' | 'at-risk' | 'not-feasible' | 'needs-info';
export type DeadlinePressure = 'low' | 'moderate' | 'high' | 'unknown';
export type EnergyFit = 'good' | 'strained' | 'poor' | 'unknown';

export interface FeasibilityEvidence {
  fact: string;
  value: string | number;
  source: DecisionImpactSource | 'calculated';
  explanation: string;
}

export interface DecisionFeasibilityAssessment {
  availableTimeBeforeDeadlineHours: number | null;
  projectedRemainingCapacityHours: number | null;
  deadlinePressure: DeadlinePressure;
  energyFit: EnergyFit;
  feasibility: DecisionFeasibility;
  recommendation: Recommendation;
  assumptions: string[];
  missingData: string[];
  evidence: FeasibilityEvidence[];
}

export interface ContextSnapshot {
  capturedAt: Date;
  goals: Goal[];
  commitments: Commitment[];
  constraints: string[];
  relevantHistory: string[];
}

export interface Decision {
  id: string;
  userId: string;
  question: string;
  options: DecisionOption[];
  relevantContext: ContextSnapshot;
  tradeoffs: Tradeoff[];
  recommendation: Recommendation;
  reasoning: string;
  confidence: number;
  userChoice?: string;
  status: DecisionStatus;
  createdAt: Date;
}

export interface DecisionQuery {
  question: string;
  options?: string[];
  context?: Record<string, unknown>;
  impactProfile?: DecisionImpactProfile;
}

export interface DecisionSupport {
  decision: Decision;
  assessment: DecisionFeasibilityAssessment;
  clarificationNeeded?: string[];
}

// ========================================
// Intervention
// ========================================

export enum InterventionLevel {
  NONE = 'NONE',
  AMBIENT = 'AMBIENT',
  SUGGESTION = 'SUGGESTION',
  PROACTIVE = 'PROACTIVE'
}

export interface Intervention {
  id: string;
  userId: string;
  level: InterventionLevel;
  reason: string;
  prompt?: string;
  suggestedAction?: string;
  createdAt: Date;
}

export interface InterventionDecision {
  shouldIntervene: boolean;
  level: InterventionLevel;
  reason: string;
  prompt?: string;
  suggestedAction?: string;
}

// ========================================
// Outcome
// ========================================

export interface Outcome {
  id: string;
  decisionId: string;
  userId: string;
  description: string;
  observedAt: Date;
  createdAt: Date;
}

// ========================================
// Feedback
// ========================================

export type FeedbackTargetType = 'decision' | 'intervention' | 'forecast';

export interface Feedback {
  id: string;
  userId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  feedbackText: string;
  createdAt: Date;
}

// ========================================
// Context Evidence
// ========================================

export interface ContextAttribute {
  id: string;
  userId: string;
  attribute: string;
  value: string; // JSON serialized
  source: ObservationSource;
  confidence: number;
  observedAt: Date;
  validUntil?: Date;
  createdAt: Date;
}

// ========================================
// Calendar
// ========================================

export interface CalendarEvent {
  id: string;
  userId: string;
  externalId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status?: string;
  rawData?: string; // JSON
  syncedAt: Date;
  createdAt: Date;
}

// ========================================
// User
// ========================================

export interface User {
  id: string;
  email: string;
  googleId?: string;
  displayName?: string;
  tokens?: string; // JSON encrypted OAuth tokens
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// Context Analysis
// ========================================

export interface ContextHypotheses {
  goals: Goal[];
  commitments: Commitment[];
  preferences: Preference[];
  confidence: number;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  context: string;
  importance: 'low' | 'medium' | 'high';
}

export interface RelevantContext {
  goals: Goal[];
  commitments: Commitment[];
  constraints: string[];
  recentHistory: string[];
  state: StateEstimate;
}

// ========================================
// Context Correction
// ========================================

export interface ContextCorrection {
  attributeId: string;
  correctedValue: string;
  reason?: string;
}
