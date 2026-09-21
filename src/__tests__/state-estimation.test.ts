/**
 * State Estimation Tests
 */

import { SimpleStateEstimator } from '../intelligence/simple-state-estimator';
import { PersonalContext, PersonalState, Observation, ObservationType, ObservationSource } from '../domain/types';

describe('SimpleStateEstimator', () => {
  let estimator: SimpleStateEstimator;
  let baseContext: PersonalContext;

  beforeEach(() => {
    estimator = new SimpleStateEstimator();
    baseContext = {
      userId: 'test-user',
      goals: [],
      commitments: [],
      preferences: [],
      calendar: {
        upcomingEvents: 3,
        busyHoursToday: 4,
        busyHoursThisWeek: 20
      },
      recentDecisions: [],
      lastUpdated: new Date()
    };
  });

  describe('estimateCurrentState', () => {
    it('returns UNCERTAIN when no recent observations', async () => {
      const observations: Observation[] = [];
      
      const state = await estimator.estimateCurrentState(baseContext, observations);
      
      expect(state.state).toBe(PersonalState.UNCERTAIN);
      expect(state.confidence).toBeGreaterThan(0);
      expect(state.evidence).toContain('No recent observations in last 30 minutes');
    });

    it('returns UNCERTAIN when observations are older than 30 minutes', async () => {
      const oldTimestamp = new Date(Date.now() - 40 * 60 * 1000); // 40 minutes ago
      const observations: Observation[] = [
        {
          id: 'obs-1',
          userId: 'test-user',
          type: ObservationType.USER_REPORTED,
          data: { description: 'Old observation' },
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          timestamp: oldTimestamp,
          createdAt: oldTimestamp
        }
      ];
      
      const state = await estimator.estimateCurrentState(baseContext, observations);
      
      expect(state.state).toBe(PersonalState.UNCERTAIN);
    });

    it('returns OVERLOADED when busy hours exceed 8', async () => {
      const overloadedContext = {
        ...baseContext,
        calendar: {
          upcomingEvents: 5,
          busyHoursToday: 10,
          busyHoursThisWeek: 50
        }
      };

      const recentObs: Observation[] = [
        {
          id: 'obs-1',
          userId: 'test-user',
          type: ObservationType.USER_REPORTED,
          data: { description: 'Recent activity' },
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          timestamp: new Date(),
          createdAt: new Date()
        }
      ];
      
      const state = await estimator.estimateCurrentState(overloadedContext, recentObs);
      
      expect(state.state).toBe(PersonalState.OVERLOADED);
      expect(state.evidence.some(e => e.includes('Busy hours today'))).toBe(true);
    });

    it('returns FLOW when activity is normal with recent observations', async () => {
      const recentObs: Observation[] = [
        {
          id: 'obs-1',
          userId: 'test-user',
          type: ObservationType.USER_REPORTED,
          data: { description: 'Normal activity' },
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          timestamp: new Date(),
          createdAt: new Date()
        }
      ];
      
      const state = await estimator.estimateCurrentState(baseContext, recentObs);
      
      expect(state.state).toBe(PersonalState.FLOW);
      expect(state.confidence).toBeGreaterThan(0);
      expect(state.evidence).toContain('Normal activity level detected');
    });

    it('considers only observations within 30 minute window', async () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
      const old = new Date(now.getTime() - 40 * 60 * 1000); // 40 minutes ago
      
      const observations: Observation[] = [
        {
          id: 'obs-1',
          userId: 'test-user',
          type: ObservationType.USER_REPORTED,
          data: { description: 'Recent' },
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          timestamp: recent,
          createdAt: recent
        },
        {
          id: 'obs-2',
          userId: 'test-user',
          type: ObservationType.USER_REPORTED,
          data: { description: 'Old' },
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          timestamp: old,
          createdAt: old
        }
      ];
      
      const state = await estimator.estimateCurrentState(baseContext, observations);
      
      // Should have recent observation, so not UNCERTAIN
      expect(state.state).toBe(PersonalState.FLOW);
    });

    it('returns valid timestamp in state estimate', async () => {
      const observations: Observation[] = [];
      const beforeCall = new Date();
      
      const state = await estimator.estimateCurrentState(baseContext, observations);
      
      const afterCall = new Date();
      expect(state.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(state.timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('always includes evidence array', async () => {
      const observations: Observation[] = [];
      
      const state = await estimator.estimateCurrentState(baseContext, observations);
      
      expect(Array.isArray(state.evidence)).toBe(true);
      expect(state.evidence.length).toBeGreaterThan(0);
    });

    it('confidence is between 0 and 1', async () => {
      const observations: Observation[] = [
        {
          id: 'obs-1',
          userId: 'test-user',
          type: ObservationType.USER_REPORTED,
          data: {},
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1.0,
          timestamp: new Date(),
          createdAt: new Date()
        }
      ];
      
      const state = await estimator.estimateCurrentState(baseContext, observations);
      
      expect(state.confidence).toBeGreaterThanOrEqual(0);
      expect(state.confidence).toBeLessThanOrEqual(1);
    });
  });
});
