export type Provenance = 'user-reported' | 'imported-source-data' | 'observed-history' | 'inferred' | 'derived';
export type Fit = 'very-strong' | 'strong' | 'moderate' | 'conditional' | 'weak' | 'poor';
export type DecisionStage = 'expected-outcome' | 'commitment-flexibility' | 'recommendation' | 'team-availability' | 'plan-preview' | 'applied' | 'completed';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  kind: 'fixed' | 'flexible' | 'protected' | 'deadline' | 'free' | 'new' | 'consolidated';
  focus: 'high' | 'medium' | 'low' | 'none';
  priority: 'high' | 'medium' | 'low';
  taskId?: string;
  note?: string;
}

export interface DemoTask {
  id: string;
  title: string;
  status: 'pending' | 'planned' | 'complete';
  priority: 'high' | 'medium' | 'low';
  flexibility: 'fixed' | 'flexible' | 'protected';
  focus: 'high' | 'medium' | 'low';
  scheduledEventId?: string;
  deadlineEventId?: string;
}

export interface Goal {
  id: string;
  horizon: 'short-term' | 'long-term';
  title: string;
  priority: 'high' | 'medium';
  provenance: Provenance;
  editable: true;
}

export interface Opportunity {
  id: string;
  title: string;
  status: 'available' | 'considering' | 'planned' | 'completed' | 'declined-live';
  priority: 'high' | 'medium';
  value: { level: 'high' | 'moderate' | 'low'; provenance: Provenance; overridden?: boolean };
  requiredCommitment: string;
  decisionId?: string;
  scheduledEventId?: string;
  recordingAvailable?: boolean;
  optional?: boolean;
}

export interface Clarification {
  id: 'expected-outcome' | 'commitment-flexibility';
  label: string;
  question: string;
  options: Array<{ id: string; label: string }>;
  answer?: string;
}

export interface Alternative {
  id: 'reject' | 'full-two-weeks' | 'focused-session';
  title: string;
  fit: Fit;
  recommended: boolean;
  benefits: string[];
  tradeoffs: string[];
}

export interface PlanOperation {
  kind: 'consolidate' | 'relocate' | 'insert';
  title: string;
  from?: string;
  to: string;
  reason: string;
}

export interface PlanProposal {
  id: 'plan.focused-mentoring';
  status: 'preview' | 'applied';
  availability: 'thursday-afternoon' | 'friday-afternoon' | 'flexible-best-fit' | 'another-time';
  beforeEventIds: string[];
  afterEventIds: string[];
  operations: PlanOperation[];
}

export interface ActiveDecision {
  id: 'decision.mentoring';
  prompt: string;
  priority: 'high';
  stage: DecisionStage;
  clarifications: Clarification[];
}

export interface DecisionRecord {
  id: string;
  title: string;
  chosenOption: string;
  status: 'planned' | 'completed' | 'declined-live';
  createdOn: string;
  actualOutcome?: string;
  learned?: string;
}

export interface OutcomeRecord {
  id: string;
  decisionId: string;
  status: 'completed';
  estimatedPreparationMinutes: { min: number; max: number };
  actualPreparationMinutes: number;
}

export interface LearnedSignal {
  id: string;
  text: string;
  provenance: 'observed-history';
}

export interface DemoWorld {
  demoVersion: string;
  persona: { id: 'persona-a'; label: 'Persona A'; roles: string[] };
  period: { start: '2026-10-05'; end: '2026-10-18' };
  calendarEvents: CalendarEvent[];
  tasks: DemoTask[];
  goals: Goal[];
  priorities: string[];
  capacityProfile: {
    workload: 'high';
    mentalWellbeing: { value: 'slightly-strained' | 'steady'; provenance: 'user-reported' };
    focusWindows: string[];
    weekendProtected: true;
    projection: 'limited' | 'limited-restructured';
  };
  historicalPreferences: Array<{ id: string; text: string; provenance: 'inferred' | 'observed-history'; corrected?: boolean }>;
  opportunities: Opportunity[];
  decisions: DecisionRecord[];
  outcomes: OutcomeRecord[];
  learnedSignals: LearnedSignal[];
  activeDecision?: ActiveDecision;
  activePlan?: PlanProposal;
  ui: { scenarioBInsightOpen: boolean };
}

export type DemoWorldAction =
  | { type: 'start-mentoring-decision' }
  | { type: 'answer-expected-outcome'; answer: string }
  | { type: 'answer-commitment-flexibility'; answer: string }
  | { type: 'use-mentoring-plan' }
  | { type: 'set-team-availability'; availability: PlanProposal['availability'] }
  | { type: 'apply-active-plan' }
  | { type: 'use-workshop-recording' }
  | { type: 'toggle-scenario-b-insight'; open: boolean }
  | { type: 'update-mental-wellbeing'; value: 'slightly-strained' | 'steady' }
  | { type: 'update-goal'; goalId: string; title: string }
  | { type: 'override-opportunity-value'; opportunityId: string; value: 'high' | 'moderate' | 'low' }
  | { type: 'correct-historical-preference'; preferenceId: string; text: string }
  | { type: 'complete-mentoring-with-reflection'; actualPreparationMinutes: 75 }
  | { type: 'reset-demo-world' };

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
  removeItem(key: string): unknown;
}
