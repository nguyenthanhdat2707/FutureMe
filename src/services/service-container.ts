/**
 * Service Container
 * Dependency injection for replaceable components
 */

import { IContextEngine, IDecisionEngine, IStateEstimator, IInterventionPolicy, ILLMContextAnalyst } from '../intelligence/interfaces';
import { ICalendarAdapter } from '../adapters/calendar-adapter.interface';
import { ILLMProvider } from '../adapters/llm-provider.interface';
import { SimpleContextEngine } from '../intelligence/simple-context-engine';
import { SimpleStateEstimator } from '../intelligence/simple-state-estimator';
import { SimpleInterventionPolicy } from '../intelligence/simple-intervention-policy';
import { MockDecisionEngine } from '../intelligence/mock-decision-engine';
import { MockCalendarAdapter } from '../adapters/mock-calendar-adapter';
import { MockLLMProvider } from '../adapters/mock-llm-provider';
import { BedrockLLMProvider } from '../adapters/bedrock-llm-provider';
import { BoundedLLMContextAnalyst } from '../intelligence/bounded-llm-context-analyst';
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
let llmContextAnalyst: ILLMContextAnalyst | null = null;

let contextRepo: PersonalContextRepository | null = null;
let observationRepo: ObservationRepository | null = null;
let decisionRepo: DecisionRepository | null = null;
let calendarRepo: CalendarEventRepository | null = null;

export function getContextRepository(): PersonalContextRepository {
  if (!contextRepo) contextRepo = new PersonalContextRepository();
  return contextRepo;
}

export function getObservationRepository(): ObservationRepository {
  if (!observationRepo) observationRepo = new ObservationRepository();
  return observationRepo;
}

export function getDecisionRepository(): DecisionRepository {
  if (!decisionRepo) decisionRepo = new DecisionRepository();
  return decisionRepo;
}

export function getCalendarEventRepository(): CalendarEventRepository {
  if (!calendarRepo) calendarRepo = new CalendarEventRepository();
  return calendarRepo;
}

export function getContextEngine(): IContextEngine {
  if (!contextEngine) {
    contextEngine = new SimpleContextEngine(
      getContextRepository(),
      getDecisionRepository(),
      getCalendarEventRepository(),
      getObservationRepository(),
      getStateEstimator()
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
    if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('Using BedrockLLMProvider for LLM capabilities');
      llmProvider = new BedrockLLMProvider();
    } else {
      console.log('Using MockLLMProvider for LLM capabilities');
      llmProvider = new MockLLMProvider();
    }
  }
  return llmProvider;
}

export function getLLMContextAnalyst(): ILLMContextAnalyst {
  if (!llmContextAnalyst) {
    llmContextAnalyst = new BoundedLLMContextAnalyst(getLLMProvider());
  }
  return llmContextAnalyst;
}
