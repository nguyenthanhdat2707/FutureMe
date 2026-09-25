import { SimpleContextEngine } from '../intelligence/simple-context-engine';
import { ContextAttribute, ObservationType, ObservationSource, PersonalState } from '../domain/types';
import { IPersonalContextRepository, IDecisionRepository, ICalendarEventRepository, IObservationRepository } from '../repositories/interfaces';
import { IStateEstimator } from '../intelligence/interfaces';

describe('SimpleContextEngine - getRelevantContext Relevance Logic', () => {
  let engine: SimpleContextEngine;
  let mockContextRepo: jest.Mocked<IPersonalContextRepository>;
  let mockDecisionRepo: jest.Mocked<IDecisionRepository>;
  let mockCalendarRepo: jest.Mocked<ICalendarEventRepository>;
  let mockObservationRepo: jest.Mocked<IObservationRepository>;
  let mockStateEstimator: jest.Mocked<IStateEstimator>;


  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockContextRepo = {
      findByUserId: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IPersonalContextRepository>;

    mockDecisionRepo = {
      findByUserId: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<IDecisionRepository>;

    mockCalendarRepo = {
      findUpcoming: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<ICalendarEventRepository>;

    mockObservationRepo = {
      findRecent: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<IObservationRepository>;

    mockStateEstimator = {
      estimateCurrentState: jest.fn().mockResolvedValue({
        state: PersonalState.FLOW,
        confidence: 0.8,
        evidence: [],
        timestamp: new Date('2026-09-22T10:00:00Z')
      })
    } as jest.Mocked<IStateEstimator>;

    engine = new SimpleContextEngine(
      mockContextRepo,
      mockDecisionRepo,
      mockCalendarRepo,
      mockObservationRepo,
      mockStateEstimator
    );
  });

  const createGoalAttr = (id: string, description: string) => ({
    id: `attr-${id}`,
    userId: 'user1',
    attribute: 'goal',
    value: JSON.stringify({ id, description, priority: 'high' }),
    source: ObservationSource.USER_CONFIRMED,
    confidence: 1,
    observedAt: new Date(),
    createdAt: new Date(),
  });

  const createCommitmentAttr = (id: string, description: string, startTime: Date, endTime: Date) => ({
    id: `attr-${id}`,
    userId: 'user1',
    attribute: 'commitment',
    value: JSON.stringify({ id, description, startTime, endTime }),
    source: ObservationSource.USER_CONFIRMED,
    confidence: 1,
    observedAt: new Date(),
    createdAt: new Date(),
  });

  const createPreferenceAttr = (id: string, category: string, description: string, value: string) => ({
    id: `attr-${id}`,
    userId: 'user1',
    attribute: 'preference',
    value: JSON.stringify({ id, category, description, value }),
    source: ObservationSource.USER_CONFIRMED,
    confidence: 1,
    observedAt: new Date(),
    createdAt: new Date(),
  });

  const createVersionedGoalAttr = (
    attrId: string,
    entityId: string,
    description: string,
    source: ObservationSource,
    observedAt: Date,
    validUntil?: Date
  ): ContextAttribute => ({
    id: attrId,
    userId: 'user1',
    attribute: 'goal',
    value: JSON.stringify({ id: entityId, description, priority: 'high' }),
    source,
    confidence: 1,
    observedAt,
    validUntil,
    createdAt: observedAt,
  });

  it('exact token relevance: selects AWS goal and excludes unrelated entities based on substrings or stop words', async () => {
    mockContextRepo.findByUserId.mockResolvedValue([
      createGoalAttr('g1', 'Pass AWS Solution Architect exam'),
      createGoalAttr('g2', 'Recover from shoulder injury'),
      createGoalAttr('g3', 'Attend this meeting')
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I attend this AWS workshop?',
    });

    // 'should' is a stop word, so 'shoulder' should not match
    // 'attend' and 'this' are stop words, so 'Attend this meeting' should not match
    // 'AWS' is not a stop word, so 'AWS' should match g1
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].description).toContain('AWS');
  });

  it('capacity interval: includes only commitments overlapping interval through deadline', async () => {
    const fixedNow = new Date('2026-09-22T10:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    const endedCommitment = createCommitmentAttr('c1', 'Already ended', new Date('2026-09-22T08:00:00Z'), new Date('2026-09-22T09:00:00Z'));
    const overlappingCommitment = createCommitmentAttr('c2', 'Overlaps', new Date('2026-09-22T12:00:00Z'), new Date('2026-09-22T13:00:00Z'));
    const afterDeadlineCommitment = createCommitmentAttr('c3', 'After deadline', new Date('2026-09-23T12:00:00Z'), new Date('2026-09-23T13:00:00Z'));

    const decisionDeadline = new Date('2026-09-22T18:00:00Z'); // Deadline is later today

    mockContextRepo.findByUserId.mockResolvedValue([
      endedCommitment,
      overlappingCommitment,
      afterDeadlineCommitment
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I take on this new coding task?',
      impactProfile: {
        deadline: decisionDeadline,
      }
    });

    expect(result.commitments).toHaveLength(1);
    expect(result.commitments[0].description).toContain('Overlaps');

  });

  it('converts relevant preference to constraint, excludes unrelated preference', async () => {
    mockContextRepo.findByUserId.mockResolvedValue([
      createPreferenceAttr('p1', 'work', 'I prefer morning work sessions', 'morning'),
      createPreferenceAttr('p2', 'diet', 'I prefer vegan food', 'vegan'),
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Can I schedule a morning work session for the project?',
    });

    expect(result.constraints.length).toBeGreaterThan(0);
    expect(result.constraints.some(c => c.includes('morning'))).toBe(true);
    expect(result.constraints.some(c => c.includes('vegan'))).toBe(false);
  });

  it('material observation: retains disruption observations and context change semantics', async () => {
    mockObservationRepo.findRecent.mockResolvedValue([
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.DEADLINE_MOVED, data: { task: 'x' }, timestamp: new Date() },
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: 'disruption' as ObservationType, data: { severity: 'high' }, timestamp: new Date() },
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.USER_REPORTED, data: { workload: 'high' }, timestamp: new Date() },
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.CONTEXT_CHANGE, data: { reason: 'some context' }, timestamp: new Date() },
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.USER_REPORTED, data: { info: 'bought a book on cooking' }, timestamp: new Date() },
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.TASK_COMPLETED, data: { name: 'coding the feature' }, timestamp: new Date() }
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I take on a new coding task?',
    });

    const historyText = result.recentHistory.join(' ');
    expect(historyText).toContain('DEADLINE_MOVED');
    expect(historyText).toContain('severity'); // from the disruption
    expect(historyText).toContain('workload');
    expect(historyText).toContain('CONTEXT_CHANGE');
    expect(historyText).toContain('coding'); // Lexically relevant task completion
    expect(historyText).not.toContain('cooking'); // Unrelated
  });

  it('returns empty arrays if no matches instead of all context', async () => {
    mockContextRepo.findByUserId.mockResolvedValue([
      createGoalAttr('g1', 'Marathon'),
    ]);

    mockObservationRepo.findRecent.mockResolvedValue([
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.USER_REPORTED, data: { info: 'bought a book on cooking' }, timestamp: new Date() }
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I learn AWS?',
    });

    expect(result.goals).toHaveLength(0);
    expect(result.recentHistory).toHaveLength(0);
  });

  it('calls stateEstimator with the full current context and full recent observations, not filtered ones', async () => {
    mockContextRepo.findByUserId.mockResolvedValue([
      createGoalAttr('g1', 'Marathon'),
    ]);
    mockObservationRepo.findRecent.mockResolvedValue([
      { id: 'obs-x', userId: 'user1', source: ObservationSource.SYSTEM_INFERRED, confidence: 1, createdAt: new Date(), type: ObservationType.USER_REPORTED, data: { info: 'cooking book' }, timestamp: new Date() }
    ]);

    await engine.getRelevantContext('user1', {
      question: 'Should I learn AWS?',
    });

    expect(mockStateEstimator.estimateCurrentState.mock.calls.length).toBeGreaterThan(0);

    const [calledContext, calledObs] = mockStateEstimator.estimateCurrentState.mock.calls[0];
    // calledContext should have the full goals
    expect(calledContext.goals).toHaveLength(1);
    expect(calledContext.goals[0].description).toContain('Marathon');

    // calledObs should have the full obs
    expect(calledObs).toHaveLength(1);
    expect(calledObs[0].data.info).toBe('cooking book');
  });

  it('resolves relevant entity versions by source authority before freshness and ignores expired evidence', async () => {
    const fixedNow = new Date('2026-09-22T10:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    mockContextRepo.findByUserId.mockResolvedValue([
      createVersionedGoalAttr('confirmed-old', 'aws-goal', 'Pass the AWS exam this month', ObservationSource.USER_CONFIRMED, new Date('2026-09-20T10:00:00Z')),
      createVersionedGoalAttr('inferred-new', 'aws-goal', 'Postpone the AWS exam until next year', ObservationSource.SYSTEM_INFERRED, new Date('2026-09-22T09:00:00Z')),
      createVersionedGoalAttr('confirmed-expired', 'aws-goal', 'Cancel the AWS exam', ObservationSource.USER_CONFIRMED, new Date('2026-09-22T09:30:00Z'), new Date('2026-09-22T09:59:00Z'))
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I schedule time for the AWS exam?'
    });

    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].description).toBe('Pass the AWS exam this month');
    expect(result.unresolvedConflicts).toEqual([]);
  });

  it('reports only a relevant equal-authority equal-freshness value tie as unresolved', async () => {
    const tiedAt = new Date('2026-09-22T09:00:00Z');
    mockContextRepo.findByUserId.mockResolvedValue([
      createVersionedGoalAttr('aws-a', 'aws-goal', 'Pass the AWS exam this month', ObservationSource.USER_CONFIRMED, tiedAt),
      createVersionedGoalAttr('aws-b', 'aws-goal', 'Postpone the AWS exam until next year', ObservationSource.USER_CONFIRMED, tiedAt),
      createVersionedGoalAttr('marathon-a', 'marathon-goal', 'Run the marathon this month', ObservationSource.USER_CONFIRMED, tiedAt),
      createVersionedGoalAttr('marathon-b', 'marathon-goal', 'Skip the marathon this year', ObservationSource.USER_CONFIRMED, tiedAt),
      createVersionedGoalAttr('unrelated-id', 'other-aws-goal', 'Study AWS networking', ObservationSource.USER_CONFIRMED, tiedAt)
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I schedule time for the AWS exam?'
    });

    expect(result.unresolvedConflicts).toEqual(['Conflicting goal evidence for aws-goal.']);
  });

  it('uses freshness within the same authority without reporting a conflict', async () => {
    mockContextRepo.findByUserId.mockResolvedValue([
      createVersionedGoalAttr('older', 'aws-goal', 'Postpone the AWS exam', ObservationSource.USER_CONFIRMED, new Date('2026-09-21T09:00:00Z')),
      createVersionedGoalAttr('newer', 'aws-goal', 'Pass the AWS exam this month', ObservationSource.USER_CONFIRMED, new Date('2026-09-22T09:00:00Z'))
    ]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I schedule time for the AWS exam?'
    });

    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].description).toBe('Pass the AWS exam this month');
    expect(result.unresolvedConflicts).toEqual([]);
  });

  it('classifies namespaced attributes while preserving authority and expiry semantics', async () => {
    const now = new Date('2026-09-22T10:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);
    mockContextRepo.findByUserId.mockResolvedValue([
      {
        ...createVersionedGoalAttr('confirmed', 'ship', 'Ship the payment flow', ObservationSource.USER_CONFIRMED, new Date('2026-09-20T10:00:00Z')),
        attribute: 'goal:ship',
      },
      {
        ...createVersionedGoalAttr('inferred', 'ship', 'Defer the payment flow', ObservationSource.SYSTEM_INFERRED, new Date('2026-09-22T09:00:00Z')),
        attribute: 'goal:ship',
      },
      {
        ...createVersionedGoalAttr('expired', 'old', 'Old expired goal', ObservationSource.USER_CONFIRMED, new Date('2026-09-20T10:00:00Z'), new Date('2026-09-22T09:00:00Z')),
        attribute: 'goal:old',
      },
    ]);

    const context = await engine.getCurrentContext('user1');

    expect(context.goals).toHaveLength(1);
    expect(context.goals[0].description).toBe('Ship the payment flow');
  });

  it('maps explicit calendar metadata and conservatively defaults malformed metadata to fixed', async () => {
    const start = new Date(Date.now() + 3_600_000);
    const end = new Date(start.getTime() + 3_600_000);
    const baseEvent = {
      userId: 'user1',
      startTime: start,
      endTime: end,
      status: 'CONFIRMED',
      syncedAt: new Date(),
      createdAt: new Date(),
    };
    mockCalendarRepo.findUpcoming.mockResolvedValue([
      {
        ...baseEvent,
        id: 'calendar-1',
        externalId: 'external-1',
        title: 'Movable release preparation',
        rawData: JSON.stringify({
          category: 'deep_work',
          flexibility: 'movable',
          priority: 'high',
          consequence: 'high',
          linkedGoalId: 'release',
          attendanceRequirement: 'optional',
          focusQuality: 'high',
        }),
      },
      {
        ...baseEvent,
        id: 'calendar-2',
        externalId: 'external-2',
        title: 'Unknown calendar item',
        rawData: '{not-json',
      },
    ]);

    const context = await engine.getCurrentContext('user1');

    expect(context.commitments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'cal-calendar-1',
        flexibility: 'movable',
        category: 'deep_work',
        priority: 'high',
        linkedGoalId: 'release',
        focusQuality: 'high',
      }),
      expect.objectContaining({
        id: 'cal-calendar-2',
        flexibility: 'fixed',
      }),
    ]));
  });

  it('includes urgent hidden workload but excludes a distant unrelated goal', async () => {
    const now = new Date('2026-09-22T10:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);
    const urgent = createGoalAttr('urgent', 'Finish the investor update');
    urgent.value = JSON.stringify({
      id: 'urgent',
      description: 'Finish the investor update',
      priority: 'high',
      status: 'active',
      deadline: new Date(now.getTime() + 3 * 86_400_000),
      remainingEffortHours: 4
    });
    const distant = createGoalAttr('distant', 'Prepare the board report');
    distant.value = JSON.stringify({
      id: 'distant',
      description: 'Prepare the board report',
      priority: 'high',
      status: 'active',
      deadline: new Date(now.getTime() + 18 * 86_400_000),
      remainingEffortHours: 12
    });
    mockContextRepo.findByUserId.mockResolvedValue([urgent, distant]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Can I accept a partnership meeting?'
    });

    expect(result.goals.map(item => item.id)).toEqual(['urgent']);
  });

  it('requires lexical relevance for goals beyond the seven-day urgent horizon', async () => {
    const now = new Date('2026-09-22T10:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);
    const partnership = createGoalAttr('partnership', 'Prepare the partnership proposal');
    partnership.value = JSON.stringify({
      id: 'partnership',
      description: 'Prepare the partnership proposal',
      priority: 'high',
      status: 'active',
      deadline: new Date(now.getTime() + 12 * 86_400_000),
      remainingEffortHours: 5
    });
    const unrelated = createGoalAttr('legal', 'Review unrelated legal contracts');
    unrelated.value = JSON.stringify({
      id: 'legal',
      description: 'Review unrelated legal contracts',
      priority: 'high',
      status: 'active',
      deadline: new Date(now.getTime() + 12 * 86_400_000),
      remainingEffortHours: 10
    });
    mockContextRepo.findByUserId.mockResolvedValue([partnership, unrelated]);

    const result = await engine.getRelevantContext('user1', {
      question: 'Should I accept the partnership meeting?',
      impactProfile: { deadline: new Date(now.getTime() + 14 * 86_400_000) }
    });

    expect(result.goals.map(item => item.id)).toEqual(['partnership']);
  });
});
