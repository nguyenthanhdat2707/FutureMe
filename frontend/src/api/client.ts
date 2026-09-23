/**
 * Mock API client for Future Me MVP
 * Replace with real API calls when backend is ready
 */

import type {
  PersonalContext,
  ContextUpdateObservation,
  ContextCorrection,
  Goal,
  Role,
  TimeBlock,
  DecisionQuery,
  DecisionApiRequest,
  DecisionApiResponse,
  Intervention,
  ClarificationRequest,
  DemoScenario,
  SetupAnswers,
  SetupResponse,
  CalendarStatusResponse,
  CalendarSyncResponse,
  CalendarEvent,
} from '../types/domain';

import {
  EnergyLevel,
  CognitiveLoad,
  Priority,
  TimeBlockType,
  TimeBlockStatus,
  FlexibilityLevel,
  InterventionType,
  InterventionIntensity,
} from '../types/domain';

export function resolveApiBaseUrl(envBaseUrl?: string, mode?: string): string {
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, '');
  }
  if (mode === 'production') {
    throw new Error('VITE_API_BASE_URL is not configured. The application cannot reach the backend API.');
  }
  return 'http://localhost:3001/api';
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.MODE);

// ============================================================================
// Mock Data Helpers
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { getAuthToken, isCognitoMode } from '../auth/cognito';
import { getSelectedDemoPersonaId, isDemoMode } from '../config/demo-personas';

const usesClientSuppliedUserId = () => !isCognitoMode && !isDemoMode;

async function authFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (isCognitoMode) {
    const token = await getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      throw new Error('Authentication required');
    }
  } else if (isDemoMode) {
    headers.set('X-Demo-User', getSelectedDemoPersonaId());
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    throw new Error(isDemoMode ? 'Invalid demo persona selection.' : 'Unauthorized session. Please sign in again.');
  }
  return response;
}


// ============================================================================
// Context API
// ============================================================================

export const contextApi = {
  async getCurrent(userId: string = 'demo-user'): Promise<PersonalContext> {
    const response = await authFetch(usesClientSuppliedUserId() ? `${API_BASE_URL}/context?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/context`);

    if (!response.ok) {
      throw new Error(`Failed to fetch context: ${response.status}`);
    }

    return response.json();
  },

  async update(observation: ContextUpdateObservation, userId: string = 'demo-user'): Promise<PersonalContext> {
    const response = await authFetch(`${API_BASE_URL}/context/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usesClientSuppliedUserId() ? {
        userId,
        observation,
      } : { observation }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update context: ${response.status}`);
    }

    return response.json();
  },

  async confirm(attributeId: string, userId: string = 'demo-user'): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/context/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usesClientSuppliedUserId() ? {
        userId,
        attributeId,
      } : { attributeId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm attribute: ${response.status}`);
    }
  },

  async correct(correction: ContextCorrection, userId: string = 'demo-user'): Promise<PersonalContext> {
    const response = await authFetch(`${API_BASE_URL}/context/correct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usesClientSuppliedUserId() ? {
        userId,
        correction,
      } : { correction }),
    });

    if (!response.ok) {
      throw new Error(`Failed to correct context: ${response.status}`);
    }

    return response.json();
  },

  async setup(answers: SetupAnswers, userId: string = 'demo-user'): Promise<SetupResponse> {
    const formattedAnswers = Object.entries(answers)
      .filter(([, text]) => text && text.trim().length > 0)
      .map(([questionId, text]) => ({ questionId, text }));

    const body = usesClientSuppliedUserId() ? { answers: formattedAnswers, userId } : { answers: formattedAnswers };

    const response = await authFetch(`${API_BASE_URL}/context/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Failed to setup context: ${response.status}`);
    }
    return response.json();
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
        description: 'Complete Future Me MVP within 5-day hackathon timeline',
        priority: 'high',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'goal-2',
        description: 'Maintain daily exercise routine',
        priority: 'medium',
      },
    ];
  },

  async create(goal: Partial<Goal>): Promise<Goal> {
    await delay(200);
    return {
      id: `goal-${Date.now()}`,
      description: goal.description || 'New Goal',
      priority: goal.priority || 'medium',
      deadline: goal.deadline,
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

  async sync(userId: string = 'demo-user'): Promise<CalendarSyncResponse> {
    const response = await authFetch(`${API_BASE_URL}/calendar/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usesClientSuppliedUserId() ? { userId } : {}),
    });
    if (!response.ok) {
      throw new Error(`Failed to sync calendar: ${response.status}`);
    }
    return response.json();
  },

  async getStatus(userId: string = 'demo-user'): Promise<CalendarStatusResponse> {
    const url = usesClientSuppliedUserId() ? `${API_BASE_URL}/calendar/status?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/calendar/status`;
    const response = await authFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar status: ${response.status}`);
    }
    return response.json();
  },

  async getEvents(userId: string = 'demo-user'): Promise<CalendarEvent[]> {
    const url = usesClientSuppliedUserId() ? `${API_BASE_URL}/calendar/events?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/calendar/events`;
    const response = await authFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.status}`);
    }
    const data = await response.json();
    return data.events || [];
  }
};

// ============================================================================
// Decisions API
// ============================================================================

export const decisionsApi = {
  async query(request: DecisionApiRequest): Promise<DecisionApiResponse> {
    const requestBody = (() => {
      if (!usesClientSuppliedUserId()) {
        const { userId: _userId, ...rest } = request;
        return rest;
      }
      return request;
    })();

    const response = await authFetch(`${API_BASE_URL}/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let message = `Decision request failed (${response.status})`;

      try {
        const body: unknown = await response.json();
        if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
          message = body.error;
        }
      } catch {
        // Keep the status-based message when the server does not return JSON.
      }

      throw new Error(message);
    }

    return response.json() as Promise<DecisionApiResponse>;
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
        id: 'hackathon-deadline',
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
    const response = await authFetch(`${API_BASE_URL}/demo/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: scenarioId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to load scenario: ${response.statusText}`);
    }
  },

  async reset(): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/demo/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to reset demo: ${response.statusText}`);
    }
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
