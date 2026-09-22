import { User, Decision, Observation, CalendarEvent, Outcome, Feedback, DecisionStatus, ContextAttribute } from '../domain/types';

export type Awaitable<T> = T | Promise<T>;

export interface ICalendarEventRepository {
  findById(id: string): Awaitable<CalendarEvent | null>;
  findByUserId(userId: string, limit?: number): Awaitable<CalendarEvent[]>;
  findUpcoming(userId: string, fromDate?: Date): Awaitable<CalendarEvent[]>;
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
  findByDecisionId(decisionId: string): Awaitable<Outcome[]>;
  findByUserId(userId: string, limit?: number): Awaitable<Outcome[]>;
  create(outcome: Omit<Outcome, 'id' | 'createdAt'>): Awaitable<Outcome>;
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

