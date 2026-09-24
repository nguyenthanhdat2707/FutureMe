import { User, Decision, Observation, CalendarEvent, Outcome, Feedback, DecisionStatus, ContextAttribute, Intervention, InterventionStatus, DecisionChoice, CheckInSchedule, CheckInStatus } from '../domain/types';

export type Awaitable<T> = T | Promise<T>;

export interface IInterventionRepository {
  findById(id: string): Awaitable<Intervention | null>;
  findByUserId(userId: string, limit?: number): Awaitable<Intervention[]>;
  findActiveByUserId(userId: string): Awaitable<Intervention[]>;
  findByIssueKey(userId: string, issueKey: string): Awaitable<Intervention | null>;
  create(intervention: Omit<Intervention, 'createdAt'>): Awaitable<Intervention>;
  updateStatus(id: string, status: InterventionStatus, updates?: Partial<Intervention>): Awaitable<Intervention | null>;
  dismiss(id: string, dismissedAt?: Date): Awaitable<Intervention | null>;
}


export interface ICalendarEventRepository {
  findById(id: string): Awaitable<CalendarEvent | null>;
  findByUserId(userId: string, limit?: number): Awaitable<CalendarEvent[]>;
  findUpcoming(userId: string, fromDate?: Date): Awaitable<CalendarEvent[]>;
  findByRange(userId: string, from: Date, to: Date): Awaitable<CalendarEvent[]>;
  findByExternalId(userId: string, externalId: string): Awaitable<CalendarEvent | null>;
  create(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Awaitable<CalendarEvent>;
  upsert(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Awaitable<CalendarEvent>;
}

export interface IDecisionRepository {
  findById(id: string): Awaitable<Decision | null>;
  findByUserId(userId: string, limit?: number): Awaitable<Decision[]>;
  create(decision: Omit<Decision, 'createdAt'>): Awaitable<Decision>;
  updateChoice(id: string, userChoice: string): Awaitable<Decision | null>;
  updateStatus(id: string, status: DecisionStatus): Awaitable<Decision | null>;
}

export interface IFeedbackRepository {
  findById(id: string): Awaitable<Feedback | null>;
  findByTargetId(targetId: string): Awaitable<Feedback[]>;
  findByUserId(userId: string, limit?: number): Awaitable<Feedback[]>;
  create(feedback: Omit<Feedback, 'id' | 'createdAt'>): Awaitable<Feedback>;
}

export interface IObservationRepository {
  findById(id: string): Awaitable<Observation | null>;
  findByUserId(userId: string, limit?: number): Awaitable<Observation[]>;
  findRecent(userId: string, hoursBack?: number): Awaitable<Observation[]>;
  create(observation: Omit<Observation, 'id' | 'createdAt'>): Awaitable<Observation>;
}

export interface IOutcomeRepository {
  findById(id: string): Awaitable<Outcome | null>;
  findByDecisionId(decisionId: string): Awaitable<Outcome | null>;
  findByUserId(userId: string, limit?: number): Awaitable<Outcome[]>;
  create(outcome: Omit<Outcome, 'id' | 'createdAt' | 'updatedAt'>): Awaitable<Outcome>;
  update(id: string, updates: Partial<Pick<Outcome, 'outcomeStatus' | 'wouldRepeat' | 'outcomeNotes'>>): Awaitable<Outcome | null>;
}

export interface IPersonalContextRepository {
  findByUserId(userId: string, limit?: number): Awaitable<ContextAttribute[]>;
  findByUserIdAndAttribute(userId: string, attribute: string): Awaitable<ContextAttribute[]>;
  findById(id: string): Awaitable<ContextAttribute | null>;
  create(attr: Omit<ContextAttribute, 'id' | 'createdAt'>): Awaitable<ContextAttribute>;
  update(id: string, updates: Partial<Omit<ContextAttribute, 'id' | 'userId' | 'createdAt'>>): Awaitable<ContextAttribute | null>;
}

export interface IUserRepository {
  findById(id: string): Awaitable<User | null>;
  findByEmail(email: string): Awaitable<User | null>;
  findByGoogleId(googleId: string): Awaitable<User | null>;
  create(user: Omit<User, 'createdAt' | 'updatedAt'>): Awaitable<User>;
  update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Awaitable<User | null>;
}

export interface IDecisionChoiceRepository {
  findById(id: string): Awaitable<DecisionChoice | null>;
  findByDecisionId(decisionId: string): Awaitable<DecisionChoice | null>;
  findByUserId(userId: string, limit?: number): Awaitable<DecisionChoice[]>;
  create(choice: Omit<DecisionChoice, 'id' | 'createdAt'>): Awaitable<DecisionChoice>;
}

export interface ICheckInScheduleRepository {
  findById(id: string): Awaitable<CheckInSchedule | null>;
  findByDecisionId(decisionId: string): Awaitable<CheckInSchedule | null>;
  findPendingByUserId(userId: string): Awaitable<CheckInSchedule[]>;
  findDueCheckIns(userId: string, currentTime: Date): Awaitable<CheckInSchedule[]>;
  create(schedule: Omit<CheckInSchedule, 'id' | 'createdAt'>): Awaitable<CheckInSchedule>;
  updateStatus(id: string, status: CheckInStatus, triggeredAt?: Date): Awaitable<CheckInSchedule | null>;
  dismiss(id: string, dismissedAt?: Date): Awaitable<CheckInSchedule | null>;
}


