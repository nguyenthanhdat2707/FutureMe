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

// Repositories
import {
  IPersonalContextRepository,
  IObservationRepository,
  IDecisionRepository,
  ICalendarEventRepository,
  IUserRepository,
  IOutcomeRepository,
  IFeedbackRepository,
  IInterventionRepository,
  IDecisionChoiceRepository,
  ICheckInScheduleRepository
} from '../repositories/interfaces';

import { SqlitePersonalContextRepository } from '../repositories/personal-context.repository';
import { SqliteDecisionRepository } from '../repositories/decision.repository';
import { SqliteCalendarEventRepository } from '../repositories/calendar-event.repository';
import { SqliteObservationRepository } from '../repositories/observation.repository';
import { SqliteUserRepository } from '../repositories/user.repository';
import { SqliteOutcomeRepository } from '../repositories/outcome.repository';
import { SqliteFeedbackRepository } from '../repositories/feedback.repository';
import { SqliteInterventionRepository } from '../repositories/intervention.repository';
import { SqliteDecisionChoiceRepository } from '../repositories/decision-choice.repository';
import { SqliteCheckInScheduleRepository } from '../repositories/check-in-schedule.repository';
import { IDemoResetRepository, SqliteDemoResetRepository } from '../repositories/demo-reset.repository';

import { DynamoPersonalContextRepository } from '../repositories/dynamo/personal-context.repository';
import { DynamoDecisionRepository } from '../repositories/dynamo/decision.repository';
import { DynamoCalendarEventRepository } from '../repositories/dynamo/calendar-event.repository';
import { DynamoObservationRepository } from '../repositories/dynamo/observation.repository';
import { DynamoUserRepository } from '../repositories/dynamo/user.repository';
import { DynamoOutcomeRepository } from '../repositories/dynamo/outcome.repository';
import { DynamoFeedbackRepository } from '../repositories/dynamo/feedback.repository';
import { DynamoInterventionRepository } from '../repositories/dynamo/intervention.repository';
import { DynamoDemoResetRepository } from '../repositories/dynamo/demo-reset.repository';

// Singleton instances
let contextEngine: IContextEngine | null = null;
let stateEstimator: IStateEstimator | null = null;
let decisionEngine: IDecisionEngine | null = null;
let interventionPolicy: IInterventionPolicy | null = null;
let calendarAdapter: ICalendarAdapter | null = null;
let llmProvider: ILLMProvider | null = null;
let llmContextAnalyst: ILLMContextAnalyst | null = null;

let contextRepo: IPersonalContextRepository | null = null;
let observationRepo: IObservationRepository | null = null;
let decisionRepo: IDecisionRepository | null = null;
let calendarRepo: ICalendarEventRepository | null = null;
let userRepo: IUserRepository | null = null;
let outcomeRepo: IOutcomeRepository | null = null;
let feedbackRepo: IFeedbackRepository | null = null;
let interventionRepo: IInterventionRepository | null = null;
let decisionChoiceRepo: IDecisionChoiceRepository | null = null;
let checkInScheduleRepo: ICheckInScheduleRepository | null = null;
let demoResetRepo: IDemoResetRepository | null = null;


const isDynamo = process.env.PERSISTENCE_PROVIDER === 'dynamodb';

export function getContextRepository(): IPersonalContextRepository {
  if (!contextRepo) contextRepo = isDynamo ? new DynamoPersonalContextRepository() : new SqlitePersonalContextRepository();
  return contextRepo;
}

export function getObservationRepository(): IObservationRepository {
  if (!observationRepo) observationRepo = isDynamo ? new DynamoObservationRepository() : new SqliteObservationRepository();
  return observationRepo;
}

export function getDecisionRepository(): IDecisionRepository {
  if (!decisionRepo) decisionRepo = isDynamo ? new DynamoDecisionRepository() : new SqliteDecisionRepository();
  return decisionRepo;
}

export function getCalendarEventRepository(): ICalendarEventRepository {
  if (!calendarRepo) calendarRepo = isDynamo ? new DynamoCalendarEventRepository() : new SqliteCalendarEventRepository();
  return calendarRepo;
}

export function getUserRepository(): IUserRepository {
  if (!userRepo) userRepo = isDynamo ? new DynamoUserRepository() : new SqliteUserRepository();
  return userRepo;
}

export function getOutcomeRepository(): IOutcomeRepository {
  if (!outcomeRepo) outcomeRepo = isDynamo ? new DynamoOutcomeRepository() : new SqliteOutcomeRepository();
  return outcomeRepo;
}

export function getFeedbackRepository(): IFeedbackRepository {
  if (!feedbackRepo) feedbackRepo = isDynamo ? new DynamoFeedbackRepository() : new SqliteFeedbackRepository();
  return feedbackRepo;
}

export function getInterventionRepository(): IInterventionRepository {
  if (!interventionRepo) interventionRepo = isDynamo ? new DynamoInterventionRepository() : new SqliteInterventionRepository();
  return interventionRepo;
}

export function getDecisionChoiceRepository(): IDecisionChoiceRepository {
  if (!decisionChoiceRepo) decisionChoiceRepo = new SqliteDecisionChoiceRepository();
  return decisionChoiceRepo;
}

export function getCheckInScheduleRepository(): ICheckInScheduleRepository {
  if (!checkInScheduleRepo) checkInScheduleRepo = new SqliteCheckInScheduleRepository();
  return checkInScheduleRepo;
}

export function getDemoResetRepository(): IDemoResetRepository {
  if (!demoResetRepo) demoResetRepo = isDynamo ? new DynamoDemoResetRepository() : new SqliteDemoResetRepository();
  return demoResetRepo;
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
      getContextEngine(),
      getDecisionRepository(),
      getDecisionChoiceRepository(),
      getOutcomeRepository()
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
    // For MVP, always use mock
    calendarAdapter = new MockCalendarAdapter();
  }
  return calendarAdapter;
}

export function getLLMProvider(): ILLMProvider {
  if (!llmProvider) {
    if (process.env.LLM_PROVIDER === 'bedrock') {
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
