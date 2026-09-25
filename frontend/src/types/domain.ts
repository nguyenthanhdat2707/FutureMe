/**
 * Core domain types for Future Me MVP
 * These types match the backend domain objects
 */

// ============================================================================
// Context & User State
// ============================================================================

export interface UserContext {
  id: string;
  userId: string;
  timestamp: string;
  energyLevel: EnergyLevel;
  mood?: string;
  physicalState?: PhysicalState;
  cognitiveLoad?: CognitiveLoad;
  stressLevel?: number; // 0-10 scale
  currentLocation?: string;
  updatedAt: string;
}

export enum ObservationSource {
  USER_CONFIRMED = 'USER_CONFIRMED',
  CALENDAR = 'CALENDAR',
  SYSTEM_OBSERVED = 'SYSTEM_OBSERVED',
  SYSTEM_INFERRED = 'SYSTEM_INFERRED',
  HISTORICAL_PATTERN = 'HISTORICAL_PATTERN',
  EXTERNAL_SOURCE = 'EXTERNAL_SOURCE',
}

export interface ContextAttribute {
  id: string;
  userId: string;
  attribute: string;
  value: string; // JSON serialized
  source: ObservationSource;
  confidence: number;
  observedAt: string;
  validUntil?: string;
  createdAt: string;
}

export interface PersonalContext {
  userId: string;
  setupCompleted: boolean;
  goals: Goal[];
  commitments: Commitment[];
  preferences: Preference[];
  calendar: CalendarSummary;
  recentDecisions: DecisionQuery[];
  lastUpdated: string;
}

export interface Commitment {
  id: string;
  description: string;
  startTime: string;
  endTime: string;
  recurring?: boolean;
  source?: ObservationSource;
  confidence?: number;
  attributeId?: string;
  observedAt?: string;
  validUntil?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
  flexibility?: 'fixed' | 'movable' | 'optional';
  consequence?: 'low' | 'medium' | 'high';
  category?: 'deep_work' | 'meeting' | 'deadline' | 'recovery' | 'other';
  linkedGoalId?: string;
  attendanceRequirement?: 'required' | 'optional' | 'unknown';
  focusQuality?: 'high' | 'medium' | 'low';
}

export interface Preference {
  id: string;
  category: string;
  description: string;
  value: string;
  source?: ObservationSource;
  confidence?: number;
  attributeId?: string;
  observedAt?: string;
  validUntil?: string;
}

export interface CalendarSummary {
  status: 'synced' | 'unknown';
  lastSync: string | null;
  upcomingEvents: number;
  busyHoursToday: number | null;
  busyHoursThisWeek: number | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  source: ObservationSource;
  status?: string;
  rawData?: string;
}

export interface CalendarStatusResponse {
  status: 'synced' | 'never';
  lastSync: string | null;
}

export interface CalendarSyncResponse {
  success: boolean;
  synced: number;
  timestamp: string;
}

export interface SetupAnswers {
  priorities?: string;
  deadlines?: string;
  tracking?: string;
}

export interface SetupResponse {
  setupCompleted: boolean;
}

export interface ContextUpdateObservation {
  type: string;
  data: Record<string, unknown>;
  source: ObservationSource;
  confidence: number;
}

export interface ContextCorrection {
  attributeId: string;
  correctedValue: string;
  reason?: string;
}

export enum EnergyLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum PhysicalState {
  RESTED = 'RESTED',
  TIRED = 'TIRED',
  SICK = 'SICK',
  ENERGIZED = 'ENERGIZED',
}

export enum CognitiveLoad {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  OVERLOADED = 'OVERLOADED',
}

// ============================================================================
// Goals & Roles
// ============================================================================

export interface Goal {
  id: string;
  description: string;
  deadline?: Date | string;
  priority: 'low' | 'medium' | 'high';
  source?: ObservationSource;
  confidence?: number;
  attributeId?: string; // Link to ContextAttribute for confirm/correct
  observedAt?: string;
  validUntil?: string;
  status?: 'active' | 'paused' | 'completed';
  progressPercent?: number;
  remainingEffortHours?: number;
}

export enum GoalCategory {
  CAREER = 'CAREER',
  HEALTH = 'HEALTH',
  RELATIONSHIPS = 'RELATIONSHIPS',
  LEARNING = 'LEARNING',
  CREATIVE = 'CREATIVE',
  FINANCIAL = 'FINANCIAL',
  PERSONAL = 'PERSONAL',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface Role {
  id: string;
  userId: string;
  name: string;
  description?: string;
  timeCommitmentHours: number; // per week
  active: boolean;
  createdAt: string;
}

// ============================================================================
// Calendar & Time Blocks
// ============================================================================

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  type: TimeBlockType;
  status: TimeBlockStatus;
  flexibility: FlexibilityLevel;
  linkedGoalId?: string;
  linkedRoleId?: string;
  energyRequired?: EnergyLevel;
  createdAt: string;
  updatedAt: string;
}

export enum TimeBlockType {
  FIXED_COMMITMENT = 'FIXED_COMMITMENT', // Solid blocks (meetings, appointments)
  FLEXIBLE_INTENTION = 'FLEXIBLE_INTENTION', // Lighter tint (planned work)
  GHOST_SLOT = 'GHOST_SLOT', // Dashed border (AI proposals)
  RECOVERY_BUFFER = 'RECOVERY_BUFFER', // Diagonal stripes (rest time)
}

export enum TimeBlockStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NEEDS_RESCHEDULING = 'NEEDS_RESCHEDULING',
}

export enum FlexibilityLevel {
  RIGID = 'RIGID', // Cannot move
  LOW = 'LOW', // Prefer not to move
  MEDIUM = 'MEDIUM', // Can move with notice
  HIGH = 'HIGH', // Easily movable
}

// ============================================================================
// AI Reasoning & Decisions
// ============================================================================

export interface DecisionQuery {
  id: string;
  userId: string;
  question: string;
  context?: Record<string, any>;
  timestamp: string;
  response?: DecisionResponse;
}

export interface DecisionResponse {
  queryId: string;
  recommendation: string;
  reasoning: AIReasoning;
  tradeoffs: Tradeoff[];
  alternatives: Alternative[];
  confidence: number; // 0-1
  impactAnalysis: ImpactAnalysis;
  timestamp: string;
}

export interface AIReasoning {
  summary: string;
  factors: ReasoningFactor[];
  constraintsConsidered: string[];
  assumptionsMade: string[];
}

export interface ReasoningFactor {
  factor: string;
  weight: number; // 0-1
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  explanation: string;
}

export interface Tradeoff {
  aspect: string;
  gain: string;
  cost: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Alternative {
  option: string;
  pros: string[];
  cons: string[];
  suitability: number; // 0-1
}

export interface ImpactAnalysis {
  shortTerm: string[]; // Today/this week
  longTerm: string[]; // Future goals/commitments
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  affectedGoals: string[]; // Goal IDs
}

export type DecisionImpactSource = 'user-confirmed' | 'provided' | 'estimated' | 'context';

export interface DecisionImpactProfile {
  timeCostHours?: number;
  target?: string;
  deadline?: string;
  proposedStart?: string;
  proposedEnd?: string;
  availableHoursBeforeDeadline?: number;
  workloadHoursBeforeDeadline?: number;
  energyCost?: number;
  availableEnergy?: number;
  goalRelevance?: 'low' | 'medium' | 'high';
  priority?: 'low' | 'medium' | 'high';
  flexibility?: 'fixed' | 'movable' | 'optional';
  focusRequirement?: 'high' | 'medium' | 'low';
  source?: DecisionImpactSource;
}

export interface DecisionClarificationMetadata {
  attempted: boolean;
  unresolvedFields?: string[];
  unresolvedConflicts?: string[];
}

export interface DecisionApiRequest {
  userId?: string;
  query: {
    question: string;
    impactProfile?: DecisionImpactProfile;
    clarification?: DecisionClarificationMetadata;
  };
}

export interface DecisionRecommendation {
  option: string;
  confidence: number;
  reasoning: string;
}

export type DecisionPolicyOutcome = 'RECOMMEND' | 'ASK' | 'ABSTAIN';

export interface DecisionPolicyResult {
  outcome: DecisionPolicyOutcome;
  reason: string;
  unresolvedMaterialFields?: string[];
  unresolvedMaterialConflicts?: string[];
}

export type DeadlinePressure = 'low' | 'moderate' | 'high' | 'unknown';
export type EnergyFit = 'good' | 'strained' | 'poor' | 'unknown';
export type DecisionFeasibility = 'feasible' | 'at-risk' | 'not-feasible' | 'needs-info';

export interface FeasibilityEvidence {
  fact: string;
  value: string | number;
  source: DecisionImpactSource | 'calculated';
  explanation: string;
}

export interface DisplacementCandidate {
  commitmentId: string;
  description: string;
  action: 'move' | 'skip';
  recoverableHours: number;
  reason: string;
}

export interface DecisionFeasibilityAssessment {
  availableTimeBeforeDeadlineHours: number | null;
  projectedRemainingCapacityHours: number | null;
  deadlinePressure: DeadlinePressure;
  energyFit: EnergyFit;
  feasibility: DecisionFeasibility;
  recommendation: DecisionRecommendation;
  assumptions: string[];
  missingData: string[];
  invalidInputs: string[];
  evidence: FeasibilityEvidence[];
  impactHorizonEnd?: string | null;
  derivedWorkloadHours?: number;
  linkedScheduledHours?: number;
  recoveredCapacityHours?: number;
  displacementCandidates?: DisplacementCandidate[];
  focusQualityRisk?: boolean;
}

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
  timestamp: string;
}

export interface DecisionTradeoff {
  option: string;
  gains: string[];
  costs: string[];
}

export interface DecisionApiResponse {
  decision: {
    id?: string;
    recommendation: DecisionRecommendation;
    tradeoffs?: DecisionTradeoff[];
  };
  assessment: DecisionFeasibilityAssessment;
  clarificationNeeded?: string[];
  policy: DecisionPolicyResult;
  state?: StateEstimate;
}

// ============================================================================
// Interventions & Clarifications
// ============================================================================

export interface Intervention {
  id: string;
  userId: string;
  type: InterventionType;
  intensity: InterventionIntensity;
  title: string;
  message: string;
  reasoning: string;
  suggestedActions?: Action[];
  triggeredBy: string; // What caused this intervention
  timestamp: string;
  userResponse?: UserResponse;
}

export enum InterventionType {
  OVERCOMMITMENT_WARNING = 'OVERCOMMITMENT_WARNING',
  ENERGY_MISMATCH = 'ENERGY_MISMATCH',
  GOAL_DRIFT = 'GOAL_DRIFT',
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  REST_REMINDER = 'REST_REMINDER',
  DEADLINE_ALERT = 'DEADLINE_ALERT',
}

export enum InterventionIntensity {
  AMBIENT = 'AMBIENT', // Subtle badge
  SUGGESTION = 'SUGGESTION', // Dismissible card
  PROACTIVE = 'PROACTIVE', // Requires action
}

// Phase 5 Proactive Interventions
export type ProactiveInterventionType = 'CONTEXT_CHECK' | 'CONSEQUENTIAL_DISRUPTION' | 'NONE';
export type ProactiveInterventionStatus = 'ACTIVE' | 'DISMISSED' | 'RESPONDED';

export interface ProactiveIntervention {
  id?: string;
  interventionId?: string;
  userId?: string;
  decisionId?: string;
  issueKey?: string;
  interventionType?: ProactiveInterventionType;
  type?: ProactiveInterventionType;
  level?: string;
  status?: ProactiveInterventionStatus;
  reason: string;
  prompt?: string;
  suggestedAction?: string;
  suggestedActions?: string[];
  severity?: 'low' | 'medium' | 'high';
  timestamp?: string;
  createdAt?: string;
  dismissedAt?: string;
}

export interface InterventionCheckResponse {
  interventions: ProactiveIntervention[];
  hasInterventions: boolean;
}

export interface Action {
  id: string;
  label: string;
  type: 'RESCHEDULE' | 'POSTPONE' | 'DELEGATE' | 'ACCEPT' | 'DISMISS';
  impact?: string;
}

export interface UserResponse {
  action: string;
  feedback?: string;
  timestamp: string;
}

export interface ClarificationRequest {
  id: string;
  userId: string;
  question: string;
  context: string;
  options?: string[];
  priority: Priority;
  timestamp: string;
  response?: ClarificationResponse;
}

export interface ClarificationResponse {
  requestId: string;
  answer: string;
  timestamp: string;
}

// ============================================================================
// Demo Mode
// ============================================================================

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  preloadedContext: Partial<UserContext>;
  preloadedGoals: Goal[];
  preloadedTimeBlocks: TimeBlock[];
  simulatedInterventions: Intervention[];
}

// ============================================================================
// Phase 6: User Choice, Outcomes, Feedback, and Reusable History
// ============================================================================

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
  chosenAt: string;
  status: ChoiceStatus;
  createdAt: string;
}

export type OutcomeStatus = 'positive' | 'neutral' | 'negative' | 'pending';

export interface Outcome {
  id: string;
  decisionId: string;
  userId: string;
  outcomeStatus: OutcomeStatus;
  wouldRepeat: boolean | null;
  outcomeNotes: string | null;
  recordedAt: string;
  updatedAt: string;
  createdAt: string;
}

export type CheckInStatus = 'pending' | 'triggered' | 'completed' | 'dismissed';

export interface CheckInSchedule {
  id: string;
  decisionId: string;
  userId: string;
  scheduledAt: string;
  triggeredAt?: string;
  dismissedAt?: string;
  status: CheckInStatus;
  createdAt: string;
}

export type DecisionCategory = 'opportunity' | 'commitment' | 'workload' | 'priority' | 'deadline' | 'learning' | 'collaboration' | 'personal-wellbeing' | 'other';

export interface HistoricalDecision {
  decisionId: string;
  date: string;
  category: DecisionCategory;
  question: string;
  chosenAction: ChosenAction;
  chosenActionDisplay: string;
  outcomeStatus: OutcomeStatus;
  wouldRepeat: boolean | null;
  outcomeNotes: string | null;
  keywords: string[];
  relevantGoals: string[];
}

export interface DecisionWithHistory {
  decision: DecisionApiResponse;
  relevantHistory: HistoricalDecision[];
}
