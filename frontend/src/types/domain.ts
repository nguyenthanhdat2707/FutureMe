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
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: Priority;
  deadline?: string;
  status: GoalStatus;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
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

export type DecisionImpactSource = 'user-confirmed' | 'provided' | 'estimated';

export interface DecisionImpactProfile {
  timeCostHours?: number;
  target?: string;
  deadline?: string;
  availableHoursBeforeDeadline?: number;
  workloadHoursBeforeDeadline?: number;
  energyCost?: number;
  availableEnergy?: number;
  goalRelevance?: 'low' | 'medium' | 'high';
  source?: DecisionImpactSource;
}

export interface DecisionApiRequest {
  userId?: string;
  query: {
    question: string;
    impactProfile?: DecisionImpactProfile;
  };
}

export interface DecisionRecommendation {
  option: string;
  confidence: number;
  reasoning: string;
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

export interface DecisionFeasibilityAssessment {
  availableTimeBeforeDeadlineHours: number | null;
  projectedRemainingCapacityHours: number | null;
  deadlinePressure: DeadlinePressure;
  energyFit: EnergyFit;
  feasibility: DecisionFeasibility;
  recommendation: DecisionRecommendation;
  assumptions: string[];
  missingData: string[];
  evidence: FeasibilityEvidence[];
}

export interface DecisionApiResponse {
  decision: {
    recommendation: DecisionRecommendation;
  };
  assessment: DecisionFeasibilityAssessment;
  clarificationNeeded: string[];
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
