/**
 * Service Container
 * Dependency injection for replaceable components
 */

import { IContextEngine, IDecisionEngine, IStateEstimator, IInterventionPolicy } from '../intelligence/interfaces';
import { ICalendarAdapter } from '../adapters/calendar-adapter.interface';
import { ILLMProvider } from '../adapters/llm-provider.interface';
import { SimpleContextEngine } from '../intelligence/simple-context-engine';
import { SimpleStateEstimator } from '../intelligence/simple-state-estimator';
import { SimpleInterventionPolicy } from '../intelligence/simple-intervention-policy';
import { MockDecisionEngine } from '../intelligence/mock-decision-engine';
import { MockCalendarAdapter } from '../adapters/mock-calendar-adapter';
import { MockLLMProvider } from '../adapters/mock-llm-provider';
import { PersonalContextRepository } from '../repositories/personal-context.repository';
import { DecisionRepository } from '../repositories/decision.repository';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { ObservationRepository } from '../repositories/observation.repository';

// Singleton instances
let contextEngine: IContextEngine | null = null;
let stateEstimator: IStateEstimator | null = null;
let decisionEngine: IDecisionEngine | null = null;
let interventionPolicy: IInterventionPolicy | null = null;
let calendarAdapter: ICalendarAdapter | null = null;
let llmProvider: ILLMProvider | null = null;

export function getContextEngine(): IContextEngine {
  if (!contextEngine) {
    const contextRepo = new PersonalContextRepository();
    const decisionRepo = new DecisionRepository();
    const calendarRepo = new CalendarEventRepository();
    const observationRepo = new ObservationRepository();
    
    contextEngine = new SimpleContextEngine(
      contextRepo,
      decisionRepo,
      calendarRepo,
      observationRepo
    );
  }
  return contextEngine;
}

export function getStateEstimator(): IStateEstimator {
  if (!stateEstimator) {
    stateEstimator = new SimpleStateEstimator();
  }
  return stateEstimator;
}

export function getDecisionEngine(): IDecisionEngine {
  if (!decisionEngine) {
    decisionEngine = new MockDecisionEngine(
      getLLMProvider(),
      getContextEngine()
    );
  }
  return decisionEngine;
}

export function getInterventionPolicy(): IInterventionPolicy {
  if (!interventionPolicy) {
    interventionPolicy = new SimpleInterventionPolicy();
  }
  return interventionPolicy;
}

export function getCalendarAdapter(): ICalendarAdapter {
  if (!calendarAdapter) {
    // TODO: Check for real Google Calendar credentials
    // For MVP, always use mock
    calendarAdapter = new MockCalendarAdapter();
  }
  return calendarAdapter;
}

export function getLLMProvider(): ILLMProvider {
  if (!llmProvider) {
    // TODO: Check for real AWS Bedrock credentials
    // For MVP, always use mock
    llmProvider = new MockLLMProvider();
  }
  return llmProvider;
}
