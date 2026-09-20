/**
 * Mock API client for Future Me MVP
 * Replace with real API calls when backend is ready
 */

import type {
  UserContext,
  Goal,
  Role,
  TimeBlock,
  DecisionQuery,
  DecisionResponse,
  Intervention,
  ClarificationRequest,
  DemoScenario,
} from '../types/domain';

import {
  EnergyLevel,
  CognitiveLoad,
  GoalCategory,
  Priority,
  GoalStatus,
  TimeBlockType,
  TimeBlockStatus,
  FlexibilityLevel,
  InterventionType,
  InterventionIntensity,
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Silence unused - will be used when connecting real API
void API_BASE_URL;

// ============================================================================
// Mock Data Helpers
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// Context API
// ============================================================================

export const contextApi = {
  async getCurrent(): Promise<UserContext> {
    await delay(300);
    return {
      id: 'ctx-1',
      userId: 'user-1',
      timestamp: new Date().toISOString(),
      energyLevel: EnergyLevel.MEDIUM,
      mood: 'focused',
      cognitiveLoad: CognitiveLoad.MEDIUM,
      stressLevel: 5,
      updatedAt: new Date().toISOString(),
    };
  },

  async update(context: Partial<UserContext>): Promise<UserContext> {
    await delay(200);
    return {
      id: 'ctx-1',
      userId: 'user-1',
      timestamp: new Date().toISOString(),
      energyLevel: context.energyLevel || EnergyLevel.MEDIUM,
      mood: context.mood,
      cognitiveLoad: context.cognitiveLoad,
      stressLevel: context.stressLevel,
      updatedAt: new Date().toISOString(),
    };
  },
};

// ============================================================================
// Goals API
// ============================================================================

export const goalsApi = {
  async getAll(): Promise<Goal[]> {
    await delay(300);
    return [
      {
        id: 'goal-1',
        userId: 'user-1',
        title: 'Launch MVP at Hackathon',
        description: 'Complete Future Me MVP within 5-day hackathon timeline',
        category: GoalCategory.CAREER,
        priority: Priority.CRITICAL,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: GoalStatus.ACTIVE,
        progress: 35,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'goal-2',
        userId: 'user-1',
        title: 'Daily Exercise Routine',
        category: GoalCategory.HEALTH,
        priority: Priority.MEDIUM,
        status: GoalStatus.ACTIVE,
        progress: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async create(goal: Partial<Goal>): Promise<Goal> {
    await delay(200);
    return {
      id: `goal-${Date.now()}`,
      userId: 'user-1',
      title: goal.title || 'New Goal',
      category: goal.category || GoalCategory.PERSONAL,
      priority: goal.priority || Priority.MEDIUM,
      status: GoalStatus.ACTIVE,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

// ============================================================================
// Roles API
// ============================================================================

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    await delay(300);
    return [
      {
        id: 'role-1',
        userId: 'user-1',
        name: 'Software Engineer',
        description: 'Primary professional role',
        timeCommitmentHours: 40,
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'role-2',
        userId: 'user-1',
        name: 'Hackathon Participant',
        description: 'Building Future Me MVP',
        timeCommitmentHours: 50,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

// ============================================================================
// Calendar / Time Blocks API
// ============================================================================

export const calendarApi = {
  async getTimeBlocks(startDate: string, endDate: string): Promise<TimeBlock[]> {
    await delay(400);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Silence unused params - will be used when real API is connected
    void startDate;
    void endDate;
    
    return [
      {
        id: 'block-1',
        userId: 'user-1',
        title: 'Team Standup',
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
        type: TimeBlockType.FIXED_COMMITMENT,
        status: TimeBlockStatus.SCHEDULED,
        flexibility: FlexibilityLevel.RIGID,
        energyRequired: EnergyLevel.MEDIUM,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'block-2',
        userId: 'user-1',
        title: 'Deep Work: Frontend Implementation',
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000).toISOString(),
        type: TimeBlockType.FLEXIBLE_INTENTION,
        status: TimeBlockStatus.SCHEDULED,
        flexibility: FlexibilityLevel.MEDIUM,
        linkedGoalId: 'goal-1',
        energyRequired: EnergyLevel.HIGH,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'block-3',
        userId: 'user-1',
        title: 'Suggested: Review & Testing',
        description: 'AI suggests allocating time for quality checks',
        startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000).toISOString(),
        type: TimeBlockType.GHOST_SLOT,
        status: TimeBlockStatus.SCHEDULED,
        flexibility: FlexibilityLevel.HIGH,
        energyRequired: EnergyLevel.MEDIUM,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async createTimeBlock(block: Partial<TimeBlock>): Promise<TimeBlock> {
    await delay(200);
    return {
      id: `block-${Date.now()}`,
      userId: 'user-1',
      title: block.title || 'New Time Block',
      startTime: block.startTime || new Date().toISOString(),
      endTime: block.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: block.type || TimeBlockType.FLEXIBLE_INTENTION,
      status: TimeBlockStatus.SCHEDULED,
      flexibility: block.flexibility || FlexibilityLevel.MEDIUM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

// ============================================================================
// Decisions API
// ============================================================================

export const decisionsApi = {
  async query(question: string, context?: Record<string, any>): Promise<DecisionResponse> {
    await delay(800);
    // Silence unused params - will be used when connecting real API
    void question;
    void context;
    return {
      queryId: `query-${Date.now()}`,
      recommendation: 'Postpone the client meeting to tomorrow afternoon and use this time slot for focused MVP development.',
      reasoning: {
        summary: 'Based on your current energy level, looming deadline, and available capacity, prioritizing MVP work now maximizes progress toward your critical goal.',
        factors: [
          {
            factor: 'Hackathon deadline proximity',
            weight: 0.9,
            direction: 'POSITIVE',
            explanation: 'Only 3 days remaining until demo day',
          },
          {
            factor: 'Current energy level',
            weight: 0.7,
            direction: 'POSITIVE',
            explanation: 'Your energy is medium-high, suitable for deep work',
          },
          {
            factor: 'Meeting flexibility',
            weight: 0.6,
            direction: 'POSITIVE',
            explanation: 'Client meeting can be rescheduled with 24h notice',
          },
        ],
        constraintsConsidered: ['Available time capacity', 'Energy levels', 'Goal priorities'],
        assumptionsMade: ['Client is flexible with meeting time', 'No other urgent deadlines today'],
      },
      tradeoffs: [
        {
          aspect: 'Client relationship',
          gain: 'Complete critical MVP milestone',
          cost: 'Need to reschedule meeting (minor inconvenience)',
          severity: 'LOW',
        },
      ],
      alternatives: [
        {
          option: 'Keep meeting, work on MVP in evening',
          pros: ['Maintain scheduled commitment', 'No rescheduling needed'],
          cons: ['Evening energy typically lower', 'Risk of incomplete work', 'Potential burnout'],
          suitability: 0.4,
        },
      ],
      confidence: 0.85,
      impactAnalysis: {
        shortTerm: ['MVP progress accelerates', 'Meeting moves to tomorrow'],
        longTerm: ['Increases likelihood of successful hackathon demo', 'Maintains sustainable work pace'],
        riskLevel: 'LOW',
        affectedGoals: ['goal-1'],
      },
      timestamp: new Date().toISOString(),
    };
  },

  async getHistory(): Promise<DecisionQuery[]> {
    await delay(300);
    return [];
  },
};

// ============================================================================
// Interventions API
// ============================================================================

export const interventionsApi = {
  async getActive(): Promise<Intervention[]> {
    await delay(300);
    return [
      {
        id: 'int-1',
        userId: 'user-1',
        type: InterventionType.OVERCOMMITMENT_WARNING,
        intensity: InterventionIntensity.SUGGESTION,
        title: 'Schedule Capacity Alert',
        message: 'You have 8 hours of planned work but only 5 hours of available time today.',
        reasoning: 'Your fixed commitments leave limited capacity. Consider moving lower-priority tasks to tomorrow.',
        suggestedActions: [
          {
            id: 'action-1',
            label: 'Review schedule',
            type: 'RESCHEDULE',
            impact: 'Rebalance workload across next 2 days',
          },
          {
            id: 'action-2',
            label: 'Dismiss for today',
            type: 'DISMISS',
          },
        ],
        triggeredBy: 'Calendar capacity analysis',
        timestamp: new Date().toISOString(),
      },
    ];
  },

  async respond(interventionId: string, action: string, feedback?: string): Promise<void> {
    await delay(200);
    void interventionId;
    void action;
    void feedback;
  },
};

// ============================================================================
// Clarifications API
// ============================================================================

export const clarificationsApi = {
  async getPending(): Promise<ClarificationRequest[]> {
    await delay(300);
    return [
      {
        id: 'clar-1',
        userId: 'user-1',
        question: 'What is your preferred morning routine duration?',
        context: 'This helps me schedule recovery buffers and avoid early meetings',
        options: ['30 minutes', '1 hour', '1.5 hours', '2 hours'],
        priority: Priority.MEDIUM,
        timestamp: new Date().toISOString(),
      },
    ];
  },

  async respond(requestId: string, answer: string): Promise<void> {
    await delay(200);
    void requestId;
    void answer;
  },
};

// ============================================================================
// Demo API
// ============================================================================

export const demoApi = {
  async getScenarios(): Promise<DemoScenario[]> {
    await delay(300);
    return [
      {
        id: 'demo-1',
        name: 'Overcommitted Developer',
        description: 'A developer juggling too many commitments with an approaching deadline',
        preloadedContext: {
          energyLevel: EnergyLevel.LOW,
          cognitiveLoad: CognitiveLoad.HIGH,
          stressLevel: 7,
        },
        preloadedGoals: [],
        preloadedTimeBlocks: [],
        simulatedInterventions: [],
      },
    ];
  },

  async loadScenario(scenarioId: string): Promise<void> {
    await delay(400);
    void scenarioId; // Will be used when scenarios are implemented
  },
};

export const api = {
  context: contextApi,
  goals: goalsApi,
  roles: rolesApi,
  calendar: calendarApi,
  decisions: decisionsApi,
  interventions: interventionsApi,
  clarifications: clarificationsApi,
  demo: demoApi,
};

export default api;
