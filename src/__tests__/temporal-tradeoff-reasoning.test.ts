import {
  Commitment,
  DecisionImpactProfile,
  Goal,
  PersonalState,
  RelevantContext
} from '../domain/types';
import { assessDecisionFeasibility } from '../intelligence/deterministic-feasibility-assessment';

const NOW = new Date('2026-09-21T01:00:00.000Z'); // 08:00 Asia/Ho_Chi_Minh
const hours = (value: number) => new Date(NOW.getTime() + value * 3_600_000);
const days = (value: number) => new Date(NOW.getTime() + value * 86_400_000);

function commitment(
  id: string,
  startHour: number,
  durationHours: number,
  overrides: Partial<Commitment> = {}
): Commitment {
  return {
    id,
    description: id,
    startTime: hours(startHour),
    endTime: hours(startHour + durationHours),
    status: 'confirmed',
    priority: 'low',
    flexibility: 'fixed',
    consequence: 'low',
    ...overrides
  };
}

function goal(id: string, deadlineDays: number, remainingEffortHours: number, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    description: id,
    deadline: days(deadlineDays),
    priority: 'high',
    status: 'active',
    remainingEffortHours,
    ...overrides
  };
}

function context(goals: Goal[] = [], commitments: Commitment[] = [], constraints: string[] = []): RelevantContext {
  return {
    goals,
    commitments,
    constraints,
    recentHistory: [],
    state: {
      state: PersonalState.FLOW,
      confidence: 1,
      evidence: [],
      timestamp: NOW
    }
  };
}

function assess(profile: DecisionImpactProfile, relevantContext: RelevantContext) {
  return assessDecisionFeasibility(profile, NOW, relevantContext);
}

describe('temporal capacity and trade-off mechanism', () => {
  it('recovers a deficit by selecting only lower-value flexible commitments', () => {
    const result = assess({
      timeCostHours: 4,
      availableHoursBeforeDeadline: 5,
      workloadHoursBeforeDeadline: 3,
      deadline: days(3),
      priority: 'high'
    }, context([], [
      commitment('networking drinks', 5, 1, { flexibility: 'optional' }),
      commitment('internal planning', 8, 1.5, { flexibility: 'movable' })
    ]));

    expect(result.projectedRemainingCapacityHours).toBe(-2);
    expect(result.feasibility).toBe('at-risk');
    expect(result.recommendation.option).toBe('proceed-with-caution');
    expect(result.recoveredCapacityHours).toBeGreaterThanOrEqual(2);
    expect(result.displacementCandidates?.map(candidate => candidate.commitmentId)).toEqual([
      'networking drinks',
      'internal planning'
    ]);
    expect(result.recommendation.reasoning).toMatch(/networking drinks|internal planning/i);
  });

  it('does not manufacture capacity by displacing fixed or equally valuable commitments', () => {
    const result = assess({
      timeCostHours: 4,
      availableHoursBeforeDeadline: 5,
      workloadHoursBeforeDeadline: 3,
      deadline: days(3),
      priority: 'high'
    }, context([], [
      commitment('fixed customer presentation', 5, 2, { flexibility: 'fixed', priority: 'high', consequence: 'high' }),
      commitment('high value review', 8, 2, { flexibility: 'movable', priority: 'high', consequence: 'high' })
    ]));

    expect(result.feasibility).toBe('not-feasible');
    expect(result.displacementCandidates).toEqual([]);
    expect(result.recommendation.option).toBe('do-not-proceed');
  });

  it('treats unscheduled goal effort as workload even when the calendar is empty', () => {
    const result = assess({
      timeCostHours: 4,
      availableHoursBeforeDeadline: 10,
      deadline: days(3),
      priority: 'high'
    }, context([goal('certification prep', 3, 8)]));

    expect(result.derivedWorkloadHours).toBe(8);
    expect(result.projectedRemainingCapacityHours).toBe(-2);
    expect(result.feasibility).toBe('not-feasible');
  });

  it('can reject a high-value opportunity when no lower-cost displacement covers its opportunity cost', () => {
    const result = assess({
      timeCostHours: 3,
      availableHoursBeforeDeadline: 6,
      deadline: days(4),
      priority: 'high',
      goalRelevance: 'high'
    }, context([
      goal('investor update', 2, 4),
      goal('customer proposal', 4, 3)
    ]));

    expect(result.derivedWorkloadHours).toBe(7);
    expect(result.feasibility).toBe('not-feasible');
    expect(result.recommendation.option).toBe('do-not-proceed');
  });

  it('protects a preferred morning focus window as a soft signal', () => {
    const result = assess({
      timeCostHours: 1,
      proposedStart: new Date('2026-09-23T02:00:00.000Z'), // 09:00 ICT
      proposedEnd: new Date('2026-09-23T03:00:00.000Z'),
      availableHoursBeforeDeadline: 10,
      priority: 'low',
      flexibility: 'movable',
      focusRequirement: 'low'
    }, context([goal('Friday release', 4, 4)], [], ['work: morning']));

    expect(result.focusQualityRisk).toBe(true);
    expect(result.feasibility).toBe('at-risk');
    expect(result.recommendation.reasoning).toMatch(/morning focus|protected/i);
  });

  it('keeps tentative unknown attendance as material uncertainty', () => {
    const result = assess({
      timeCostHours: 1,
      proposedStart: hours(30),
      proposedEnd: hours(31),
      availableHoursBeforeDeadline: 4,
      workloadHoursBeforeDeadline: 1,
      deadline: days(3),
      priority: 'high'
    }, context([], [commitment('Faculty review', 30, 1, {
      status: 'tentative',
      attendanceRequirement: 'unknown',
      flexibility: 'movable'
    })]));

    expect(result.feasibility).toBe('needs-info');
    expect(result.missingData).toEqual(['attendanceRequirement:Faculty review:Faculty review']);
    expect(result.recommendation.option).toBe('clarify');
  });

  it('extends the impact horizon to a relevant deadline several days after the candidate', () => {
    const result = assess({
      proposedStart: hours(24),
      proposedEnd: hours(26)
    }, context([goal('feature freeze', 4, 5)]));

    expect(result.impactHorizonEnd?.toISOString()).toBe(days(4).toISOString());
    expect(result.derivedWorkloadHours).toBe(5);
    expect(result.missingData).not.toContain('timeCostHours');
  });

  it('excludes distant workload outside the bounded relevance horizon', () => {
    const result = assess({
      timeCostHours: 2,
      deadline: days(3),
      availableHoursBeforeDeadline: 8
    }, context([goal('unrelated board report', 18, 20)]));

    expect(result.derivedWorkloadHours).toBe(0);
    expect(result.missingData).toContain('workloadHoursBeforeDeadline');
    expect(result.projectedRemainingCapacityHours).toBe(6);
  });

  it('subtracts linked scheduled focus blocks from remaining effort exactly once', () => {
    const result = assess({
      timeCostHours: 4,
      deadline: days(3),
      availableHoursBeforeDeadline: 8
    }, context([
      goal('release', 3, 5)
    ], [
      commitment('release focus', 24, 2, {
        category: 'deep_work',
        linkedGoalId: 'release',
        priority: 'high'
      })
    ]));

    expect(result.linkedScheduledHours).toBe(2);
    expect(result.derivedWorkloadHours).toBe(3);
    expect(result.projectedRemainingCapacityHours).toBe(1);
    const remainingWorkEvidence = result.evidence.find(item => item.fact === 'Remaining work for release');
    expect(remainingWorkEvidence?.value).toBe(3);
    expect(remainingWorkEvidence?.explanation).toContain('5h total remaining minus 2h');
  });

  it('uses explicit current capacity and workload instead of conflicting derived values', () => {
    const result = assess({
      timeCostHours: 2,
      deadline: days(3),
      availableHoursBeforeDeadline: 20,
      workloadHoursBeforeDeadline: 1,
      source: 'user-confirmed'
    }, context([goal('large contextual workload', 3, 18)], [
      commitment('calendar occupancy', 2, 8)
    ]));

    expect(result.availableTimeBeforeDeadlineHours).toBe(20);
    expect(result.derivedWorkloadHours).toBeUndefined();
    expect(result.projectedRemainingCapacityHours).toBe(17);
    expect(result.feasibility).toBe('feasible');
  });

  it('conservatively refuses displacement when the candidate value is unspecified', () => {
    const result = assess({
      timeCostHours: 4,
      availableHoursBeforeDeadline: 5,
      workloadHoursBeforeDeadline: 3,
      deadline: days(3)
    }, context([], [commitment('optional admin', 5, 3, {
      flexibility: 'optional',
      priority: 'low'
    })]));

    expect(result.feasibility).toBe('not-feasible');
    expect(result.displacementCandidates).toEqual([]);
  });

  it('does not displace equal-priority commitments or linked goal work', () => {
    const result = assess({
      timeCostHours: 4,
      availableHoursBeforeDeadline: 5,
      workloadHoursBeforeDeadline: 3,
      deadline: days(3),
      priority: 'medium'
    }, context([], [
      commitment('equal priority', 5, 2, { flexibility: 'movable', priority: 'medium' }),
      commitment('linked focus', 8, 2, {
        flexibility: 'movable',
        priority: 'low',
        category: 'deep_work',
        linkedGoalId: 'release'
      })
    ]));

    expect(result.feasibility).toBe('not-feasible');
    expect(result.displacementCandidates).toEqual([]);
  });
});
