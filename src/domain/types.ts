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
  setupCompleted?: boolean;
}

export type GoalStatusType = 'active' | 'paused' | 'completed';
export type CommitmentPriority = 'low' | 'medium' | 'high';
export type CommitmentFlexibility = 'fixed' | 'movable' | 'optional';
export type CommitmentConsequence = 'low' | 'medium' | 'high';
export type CalendarEventCategory = 'deep_work' | 'meeting' | 'deadline' | 'recovery' | 'other';
export type AttendanceRequirement = 'required' | 'optional' | 'unknown';
export type FocusQuality = 'high' | 'medium' | 'low';

export interface Goal {
  id: string;
  description: string;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  source?: ObservationSource;
  confidence?: number;
  attributeId?: string;
  observedAt?: Date;
  validUntil?: Date;
  status?: GoalStatusType;
  progressPercent?: number;
  remainingEffortHours?: number;
}

export interface Commitment {
  id: string;
  description: string;
  startTime: Date;
  endTime: Date;
  recurring?: boolean;
  source?: ObservationSource;
  confidence?: number;
  attributeId?: string;
  observedAt?: Date;
  validUntil?: Date;
  status?: string;
  priority?: CommitmentPriority;
  flexibility?: CommitmentFlexibility;
  consequence?: CommitmentConsequence;
  category?: CalendarEventCategory;
  linkedGoalId?: string;
  attendanceRequirement?: AttendanceRequirement;
  focusQuality?: FocusQuality;
}

export interface Preference {
  id: string;
  category: string;
  description: string;
  value: string;
  source?: ObservationSource;
  confidence?: number;
  attributeId?: string;
  observedAt?: Date;
  validUntil?: Date;
}

export interface CalendarSummary {
  upcomingEvents: number;
  busyHoursToday: number | null;
  busyHoursThisWeek: number | null;
  status?: string;
  lastSync?: Date;
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

export type DecisionCategory = 
  | 'opportunity'
  | 'commitment'
  | 'workload'
  | 'priority'
  | 'deadline'
  | 'resource-allocation'
  | 'learning'
  | 'collaboration'
  | 'personal-wellbeing'
  | 'other';

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

export type DecisionImpactSource = 'user-confirmed' | 'provided' | 'estimated' | 'context';

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
  invalidInputs: string[];
  evidence: FeasibilityEvidence[];
}

export interface ContextSnapshot {
  capturedAt: Date;
  goals: Goal[];
  commitments: Commitment[];
  constraints: string[];
  relevantHistory: string[];
  query?: DecisionQuery;
}

export interface Decision {
  id: string;
  userId: string;
  question: string;
  category?: DecisionCategory;
  options: DecisionOption[];
  relevantContext: ContextSnapshot;
  tradeoffs: Tradeoff[];
  recommendation: Recommendation;
  reasoning: string;
  confidence: number;
  userChoice?: string;
  status: DecisionStatus;
  createdAt: Date;
  query?: DecisionQuery;
}



export type DecisionPolicyOutcome = 'RECOMMEND' | 'ASK' | 'ABSTAIN';

export interface DecisionPolicyResult {
  outcome: DecisionPolicyOutcome;
  reason: string;
  unresolvedMaterialFields?: string[];
  unresolvedMaterialConflicts?: string[];
}

export interface DecisionClarificationMetadata {
  attempted: boolean;
  unresolvedFields?: string[];
  unresolvedConflicts?: string[];
}

export interface DecisionQuery {
  question: string;
  options?: string[];
  context?: Record<string, unknown>;
  impactProfile?: DecisionImpactProfile;
  clarification?: DecisionClarificationMetadata;
}

// ========================================
// Historical Decision (Phase 6) - moved before DecisionSupport
// ========================================

export interface HistoricalDecision {
  decisionId: string;
  date: Date;
  category: DecisionCategory;
  question: string;
  chosenAction: string;
  chosenActionDisplay: string;
  outcomeStatus: OutcomeStatus;
  wouldRepeat: boolean | null;
  outcomeNotes: string | null;
  keywords: string[];
  relevantGoals: string[];
}

export interface DecisionSupport {
  decision: Decision;
  assessment: DecisionFeasibilityAssessment;
  clarificationNeeded?: string[];
  policy: DecisionPolicyResult;
  state?: StateEstimate;
  relevantHistory?: HistoricalDecision[];
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

export type InterventionType = 'CONTEXT_CHECK' | 'CONSEQUENTIAL_DISRUPTION' | 'NONE';
export type InterventionStatus = 'ACTIVE' | 'DISMISSED' | 'RESPONDED';

export interface Intervention {
  id: string;
  userId: string;
  decisionId?: string;
  issueKey: string;
  type: InterventionType;
  level: InterventionLevel;
  status: InterventionStatus;
  reason: string;
  prompt?: string;
  suggestedAction?: string;
  suggestedActions?: string[];
  severity?: 'low' | 'medium' | 'high';
  dismissedAt?: Date;
  lastMaterialChangeAt?: Date;
  createdAt: Date;
}

export interface InterventionDecision {
  shouldIntervene: boolean;
  level: InterventionLevel;
  interventionType: InterventionType;
  reason: string;
  prompt?: string;
  suggestedAction?: string;
  suggestedActions?: string[];
  interventionId?: string;
  decisionId?: string;
  issueKey?: string;
  severity?: 'low' | 'medium' | 'high';
  timestamp?: Date;
}


// ========================================
// Outcome
// ========================================

export type OutcomeStatus = 'positive' | 'neutral' | 'negative' | 'pending';

export interface Outcome {
  id: string;
  decisionId: string;
  userId: string;
  outcomeStatus: OutcomeStatus;
  wouldRepeat: boolean | null;
  outcomeNotes: string | null;
  recordedAt: Date;
  updatedAt: Date;
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
// LLM Context Analysis
// ========================================

export interface ContextAnalystSignal {
  id: string;
  description: string;
  evidenceIds: string[];
}

export interface ContextAnalystEvidence {
  id: string;
  description: string;
}

export interface ContextAnalystAttribute {
  id: string;
  value: string | number | boolean | null;
}

export interface ContextAnalystRequest {
  signals: ContextAnalystSignal[];
  evidence: ContextAnalystEvidence[];
  contextAttributes: ContextAnalystAttribute[];
}

export interface ProposedContextHypothesis {
  status: 'proposed';
  statement: string;
  signalIds: string[];
  evidenceIds: string[];
  contextAttributeIds: string[];
}

export type ClarificationResponseFormat =
  | {
    type: 'quick-choice';
    options: string[];
  }
  | {
    type: 'free-text';
  };

export interface CandidateClarificationQuestion {
  status: 'proposed';
  question: string;
  resolvesContextAttributeIds: string[];
  signalIds: string[];
  evidenceIds: string[];
  responseFormat: ClarificationResponseFormat;
}

export interface ContextAnalystValidationTrace {
  status: 'accepted' | 'rejected';
  reason?: 'invalid-request' | 'invalid-json' | 'invalid-schema' | 'unknown-reference';
}

export interface ContextAnalystResult {
  proposedHypotheses: ProposedContextHypothesis[];
  candidateClarificationQuestions: CandidateClarificationQuestion[];
  validation: ContextAnalystValidationTrace;
}

export interface RelevantContext {
  goals: Goal[];
  commitments: Commitment[];
  constraints: string[];
  recentHistory: string[];
  unresolvedConflicts?: string[];
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

// ========================================
// Decision Choice (Phase 6)
// ========================================

export type ChosenAction = 'accept' | 'decline' | 'defer' | 'custom';
export type ChoiceStatus = 'final' | 'deferred';

export interface DecisionChoice {
  id: string;
  decisionId: string;
  userId: string;
  chosenAction: ChosenAction;
  chosenActionDisplay: string;
  customNotes?: string;
  aiRecommendation: string;
  chosenAt: Date;
  status: ChoiceStatus;
  createdAt: Date;
}

// ========================================
// Check-in Schedule (Phase 6)
// ========================================

export type CheckInStatus = 'pending' | 'triggered' | 'dismissed' | 'completed';

export interface CheckInSchedule {
  id: string;
  decisionId: string;
  userId: string;
  scheduledAt: Date;
  triggeredAt?: Date;
  dismissedAt?: Date;
  status: CheckInStatus;
  createdAt: Date;
}
