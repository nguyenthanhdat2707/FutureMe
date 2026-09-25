import {
  Commitment,
  CommitmentPriority,
  DeadlinePressure,
  DecisionFeasibility,
  DecisionFeasibilityAssessment,
  DecisionImpactProfile,
  DecisionImpactSource,
  DisplacementCandidate,
  EnergyFit,
  FeasibilityEvidence,
  Goal,
  PersonalState,
  Recommendation,
  RelevantContext
} from '../domain/types';
import { calculateUnionHours } from '../utils/interval';

const HOURS_TO_MILLISECONDS = 60 * 60 * 1000;
const DAYS_TO_MILLISECONDS = 24 * HOURS_TO_MILLISECONDS;
const MAX_IMPACT_DAYS = 14;
const VIETNAM_OFFSET_MS = 7 * HOURS_TO_MILLISECONDS;

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value < 0;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function validDate(value: Date | string | undefined): Date | null {
  if (value === undefined) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function commitmentInterval(commitment: Commitment): { start: number; end: number } | null {
  const start = new Date(commitment.startTime).getTime();
  const end = new Date(commitment.endTime).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start < end ? { start, end } : null;
}

function inputEvidence(
  fact: string,
  value: string | number,
  source: DecisionImpactSource
): FeasibilityEvidence {
  return {
    fact,
    value,
    source,
    explanation: `Supplied in the decision impact profile as ${source}.`
  };
}

function impactHorizon(
  profile: DecisionImpactProfile | undefined,
  goals: Goal[],
  now: Date
): Date | null {
  const maximum = now.getTime() + MAX_IMPACT_DAYS * DAYS_TO_MILLISECONDS;
  const explicitDeadline = validDate(profile?.deadline);
  if (explicitDeadline && explicitDeadline.getTime() > now.getTime()) {
    return new Date(Math.min(explicitDeadline.getTime(), maximum));
  }
  const candidates = [validDate(profile?.proposedEnd)]
    .filter((candidate): candidate is Date => candidate !== null && candidate.getTime() > now.getTime())
    .map(candidate => Math.min(candidate.getTime(), maximum));
  for (const goal of goals) {
    if (goal.status === 'completed') continue;
    const deadline = validDate(goal.deadline);
    if (deadline && deadline.getTime() > now.getTime() && deadline.getTime() <= maximum) {
      candidates.push(deadline.getTime());
    }
  }
  return candidates.length > 0 ? new Date(Math.max(...candidates)) : null;
}

function deriveCandidateHours(profile: DecisionImpactProfile | undefined): number | undefined {
  if (isNonNegativeNumber(profile?.timeCostHours)) return profile.timeCostHours;
  const start = validDate(profile?.proposedStart);
  const end = validDate(profile?.proposedEnd);
  if (!start || !end || end <= start) return undefined;
  return roundHours((end.getTime() - start.getTime()) / HOURS_TO_MILLISECONDS);
}

function deriveUsableCapacity(
  now: Date,
  horizon: Date,
  commitments: Commitment[]
): number {
  const intervals = commitments
    .map(commitmentInterval)
    .filter((interval): interval is { start: number; end: number } => interval !== null);
  const localStart = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const localEnd = new Date(horizon.getTime() + VIETNAM_OFFSET_MS);
  const cursor = new Date(Date.UTC(
    localStart.getUTCFullYear(),
    localStart.getUTCMonth(),
    localStart.getUTCDate()
  ));
  const lastDay = Date.UTC(
    localEnd.getUTCFullYear(),
    localEnd.getUTCMonth(),
    localEnd.getUTCDate()
  );
  let usableHours = 0;

  while (cursor.getTime() <= lastDay) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      const workStart = cursor.getTime() + 8 * HOURS_TO_MILLISECONDS - VIETNAM_OFFSET_MS;
      const workEnd = cursor.getTime() + 18 * HOURS_TO_MILLISECONDS - VIETNAM_OFFSET_MS;
      const clippedStart = Math.max(now.getTime(), workStart);
      const clippedEnd = Math.min(horizon.getTime(), workEnd);
      if (clippedStart < clippedEnd) {
        const gross = (clippedEnd - clippedStart) / HOURS_TO_MILLISECONDS;
        usableHours += gross - calculateUnionHours(intervals, clippedStart, clippedEnd);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return roundHours(Math.max(0, usableHours));
}

interface WorkloadDerivation {
  hours: number;
  linkedScheduledHours: number;
  hasKnownEffort: boolean;
  urgentFocusedWork: boolean;
}

function deriveWorkload(
  goals: Goal[],
  commitments: Commitment[],
  now: Date,
  horizon: Date,
  evidence: FeasibilityEvidence[]
): WorkloadDerivation {
  let hours = 0;
  let linkedScheduledHours = 0;
  let hasKnownEffort = false;
  let urgentFocusedWork = false;

  for (const goal of goals) {
    const deadline = validDate(goal.deadline);
    if (
      goal.status === 'completed' ||
      !deadline ||
      deadline <= now ||
      deadline > horizon ||
      !isNonNegativeNumber(goal.remainingEffortHours)
    ) {
      continue;
    }

    hasKnownEffort = true;
    const linkedIntervals = commitments
      .filter(commitment => commitment.linkedGoalId === goal.id && commitment.category === 'deep_work')
      .map(commitmentInterval)
      .filter((interval): interval is { start: number; end: number } => interval !== null);
    const linked = roundHours(calculateUnionHours(
      linkedIntervals,
      now.getTime(),
      Math.min(deadline.getTime(), horizon.getTime())
    ));
    const unscheduled = roundHours(Math.max(0, goal.remainingEffortHours - linked));
    linkedScheduledHours += linked;
    hours += unscheduled;
    urgentFocusedWork ||= goal.priority === 'high' && unscheduled > 0;
    evidence.push({
      fact: `Remaining work for ${goal.description}`,
      value: unscheduled,
      source: 'context',
      explanation: `${goal.remainingEffortHours}h total remaining minus ${linked}h already allocated to linked focus blocks.`
    });
  }

  return {
    hours: roundHours(hours),
    linkedScheduledHours: roundHours(linkedScheduledHours),
    hasKnownEffort,
    urgentFocusedWork
  };
}

function priorityRank(priority: CommitmentPriority | undefined): number {
  return priority === 'high' ? 3 : priority === 'medium' ? 2 : priority === 'low' ? 1 : 0;
}

function selectDisplacements(
  deficitHours: number,
  profile: DecisionImpactProfile | undefined,
  commitments: Commitment[],
  now: Date,
  horizon: Date
): { candidates: DisplacementCandidate[]; recoveredHours: number } {
  const candidatePriority = priorityRank(profile?.priority ?? profile?.goalRelevance);
  if (deficitHours <= 0 || candidatePriority === 0) return { candidates: [], recoveredHours: 0 };

  const eligible = commitments.filter(commitment => {
    const interval = commitmentInterval(commitment);
    if (!interval || interval.end <= now.getTime() || interval.start >= horizon.getTime()) return false;
    if (commitment.flexibility !== 'optional' && commitment.flexibility !== 'movable') return false;
    if (commitment.linkedGoalId && commitment.category === 'deep_work') return false;
    if (commitment.priority === 'high' || commitment.consequence === 'high') return false;
    if (priorityRank(commitment.priority) >= candidatePriority) return false;
    if (priorityRank(commitment.consequence) >= candidatePriority) return false;
    return true;
  }).sort((left, right) => {
    const flexibility = (left.flexibility === 'optional' ? 0 : 1) - (right.flexibility === 'optional' ? 0 : 1);
    if (flexibility !== 0) return flexibility;
    const priority = priorityRank(left.priority) - priorityRank(right.priority);
    if (priority !== 0) return priority;
    const consequence = priorityRank(left.consequence) - priorityRank(right.consequence);
    if (consequence !== 0) return consequence;
    const start = new Date(left.startTime).getTime() - new Date(right.startTime).getTime();
    return start !== 0 ? start : left.id.localeCompare(right.id);
  });

  const selected: DisplacementCandidate[] = [];
  const selectedIntervals: { start: number; end: number }[] = [];
  let recoveredHours = 0;
  for (const commitment of eligible) {
    const interval = commitmentInterval(commitment);
    if (!interval) continue;
    const before = calculateUnionHours(selectedIntervals, now.getTime(), horizon.getTime());
    selectedIntervals.push(interval);
    const after = calculateUnionHours(selectedIntervals, now.getTime(), horizon.getTime());
    const incrementalHours = roundHours(after - before);
    if (incrementalHours <= 0) continue;
    recoveredHours = roundHours(after);
    selected.push({
      commitmentId: commitment.id,
      description: commitment.description,
      action: commitment.flexibility === 'optional' ? 'skip' : 'move',
      recoverableHours: incrementalHours,
      reason: `${commitment.flexibility} ${commitment.priority ?? 'unspecified'}-priority commitment with ${commitment.consequence ?? 'unspecified'} consequence.`
    });
    if (recoveredHours >= deficitHours) break;
  }

  return { candidates: selected, recoveredHours };
}

function hasImportantActiveGoalInHorizon(
  context: RelevantContext | undefined,
  horizon: Date | null
): boolean {
  if (!horizon) return false;
  return (context?.goals ?? []).some(g =>
    g.status !== 'completed' &&
    g.priority === 'high' &&
    isNonNegativeNumber(g.remainingEffortHours) &&
    g.remainingEffortHours > 0 &&
    validDate(g.deadline) !== null &&
    (validDate(g.deadline) as Date).getTime() <= horizon.getTime()
  );
}

function isHighQualityFocusRisk(
  profile: DecisionImpactProfile | undefined,
  context: RelevantContext | undefined,
  urgentFocusedWork: boolean,
  horizon: Date | null
): boolean {
  if (profile?.priority !== 'low') return false;
  if (profile.flexibility !== 'movable' && profile.flexibility !== 'optional') return false;
  const start = validDate(profile.proposedStart);
  const end = validDate(profile.proposedEnd);
  if (!start || !end || end <= start) return false;

  const localStartHour = new Date(start.getTime() + VIETNAM_OFFSET_MS).getUTCHours();
  const morningPreference = context?.constraints.some(constraint => constraint.toLowerCase().includes('morning')) ?? false;

  // Direct evidence: the proposed slot overlaps a calendar block explicitly tagged as high-quality focus time.
  // This is meaningful only when there is also materially important work that benefits from that capacity.
  const highQualityMetadata = context?.commitments.some(commitment => {
    const interval = commitmentInterval(commitment);
    return commitment.focusQuality === 'high' && interval !== null &&
      interval.start < end.getTime() && interval.end > start.getTime();
  }) ?? false;
  const competingImportantWork = urgentFocusedWork ||
    hasImportantActiveGoalInHorizon(context, horizon) ||
    (isNonNegativeNumber(profile?.workloadHoursBeforeDeadline) && profile.workloadHoursBeforeDeadline > 0);

  // Morning-hour inference: soft signal, requires competing important work in the horizon.
  if (morningPreference && localStartHour >= 8 && localStartHour < 12 && competingImportantWork) return true;
  // Premium-block overlap: direct signal, requires any active high-priority goal in the horizon.
  if (highQualityMetadata && competingImportantWork) return true;
  return false;
}

function overlappingUnknownAttendance(
  profile: DecisionImpactProfile | undefined,
  commitments: Commitment[]
): Commitment | undefined {
  const start = validDate(profile?.proposedStart);
  const end = validDate(profile?.proposedEnd);
  if (!start || !end || end <= start) return undefined;
  return commitments.find(commitment => {
    const interval = commitmentInterval(commitment);
    const overlapMilliseconds = interval === null ? 0 : Math.max(
      0,
      Math.min(interval.end, end.getTime()) - Math.max(interval.start, start.getTime())
    );
    return overlapMilliseconds >= 0.25 * HOURS_TO_MILLISECONDS &&
      commitment.status?.toLowerCase() === 'tentative' &&
      commitment.attendanceRequirement === 'unknown';
  });
}

function recommendationFor(
  feasibility: DecisionFeasibility,
  deadlinePressure: DeadlinePressure,
  energyFit: EnergyFit,
  confidence: number,
  displacementCandidates: DisplacementCandidate[],
  recoveredCapacityHours: number,
  focusQualityRisk: boolean
): Recommendation {
  if (feasibility === 'needs-info') {
    return {
      option: 'clarify',
      confidence,
      reasoning: 'More impact information is required before making a supported recommendation.'
    };
  }
  if (feasibility === 'not-feasible') {
    const reason = deadlinePressure === 'high'
      ? 'The impact horizon has high deadline pressure and negative remaining capacity, with no safe lower-value displacement path.'
      : 'The candidate energy requirement exceeds the available energy.';
    return { option: 'do-not-proceed', confidence, reasoning: reason };
  }
  if (focusQualityRisk) {
    return {
      option: 'proceed-with-caution',
      confidence,
      reasoning: 'You have enough overall capacity, but this low-priority movable commitment overlaps a high-quality focus window while important work depends on that time. Move it to a lower-cost period to preserve the premium focus capacity for higher-value execution.'
    };
  }
  if (displacementCandidates.length > 0 && recoveredCapacityHours > 0) {
    const actions = displacementCandidates.map(candidate => `${candidate.action} ${candidate.description}`).join(', ');
    return {
      option: 'proceed-with-caution',
      confidence,
      reasoning: `Proceed only with these lower-cost adjustments: ${actions}. They recover ${recoveredCapacityHours}h of capacity.`
    };
  }
  if (feasibility === 'at-risk') {
    return {
      option: 'proceed-with-caution',
      confidence,
      reasoning: 'The commitment fits only with limited remaining capacity or energy, so the inputs should be rechecked.'
    };
  }
  const energyCaveat = energyFit === 'unknown'
    ? ' Energy fit remains unknown because energy inputs were not supplied.'
    : '';
  return {
    option: 'proceed',
    confidence,
    reasoning: `The impact horizon leaves positive capacity without high deadline pressure.${energyCaveat}`
  };
}

function confidenceFor(
  source: DecisionImpactSource,
  hasEnergyInputs: boolean,
  hasGoalRelevance: boolean,
  usedWorkloadAssumption: boolean,
  needsCoreInputs: boolean
): number {
  if (needsCoreInputs) return 0;
  let confidence = source === 'user-confirmed' ? 0.8 : source === 'estimated' ? 0.55 : 0.65;
  if (hasEnergyInputs) confidence += 0.1;
  if (hasGoalRelevance) confidence += 0.05;
  if (!usedWorkloadAssumption) confidence += 0.05;
  return Math.min(0.95, roundHours(confidence));
}

export function assessDecisionFeasibility(
  profile: DecisionImpactProfile | undefined,
  now: Date = new Date(),
  context?: RelevantContext
): DecisionFeasibilityAssessment {
  const assumptions: string[] = [];
  const missingData: string[] = [];
  const invalidInputs: string[] = [];
  const evidence: FeasibilityEvidence[] = [];
  const source = profile?.source ?? 'provided';
  const goals = context?.goals ?? [];
  const commitments = context?.commitments ?? [];
  const horizon = impactHorizon(profile, goals, now);

  let additionalWorkload = 0;
  let energyReduction = 0;
  let hasDisruption = false;
  let isOverloaded = false;
  for (const history of context?.recentHistory ?? []) {
    if (history.includes('workload-increase')) {
      const increment = history.includes('"severity":"high"') ? 4 : history.includes('"severity":"medium"') ? 2 : 1;
      additionalWorkload += increment;
      evidence.push({
        fact: 'Context effect',
        value: `+${increment}h workload`,
        source: 'context',
        explanation: 'Applied a recent observed workload increase after the explicit or derived base workload.'
      });
    }
    if (history.includes('energy-decrease')) {
      energyReduction += 1;
      evidence.push({ fact: 'Context effect', value: '-1 energy', source: 'context', explanation: 'Applied energy decrease from recent observations.' });
    }
    if (history.includes('disruption')) {
      hasDisruption = true;
      evidence.push({ fact: 'Context effect', value: 'Disrupted', source: 'context', explanation: 'Recent disruption observed.' });
    }
  }
  if (context?.state?.state === PersonalState.OVERLOADED) {
    isOverloaded = true;
    evidence.push({ fact: 'Context state', value: 'Overloaded', source: 'context', explanation: 'Current state is OVERLOADED.' });
  }

  const invalidTimeCost = isNegativeNumber(profile?.timeCostHours);
  if (invalidTimeCost) invalidInputs.push('timeCostHours');
  const timeCostHours = invalidTimeCost ? undefined : deriveCandidateHours(profile);
  if (timeCostHours === undefined) {
    if (!invalidTimeCost) missingData.push('timeCostHours');
  } else {
    evidence.push(profile?.timeCostHours !== undefined
      ? inputEvidence('Candidate time cost', timeCostHours, source)
      : { fact: 'Candidate time cost', value: timeCostHours, source: 'calculated', explanation: 'Derived from the proposed start and end times.' });
  }

  if (isNegativeNumber(profile?.availableHoursBeforeDeadline)) invalidInputs.push('availableHoursBeforeDeadline');
  let availableTimeBeforeDeadlineHours: number | null = null;
  if (isNonNegativeNumber(profile?.availableHoursBeforeDeadline)) {
    availableTimeBeforeDeadlineHours = roundHours(profile.availableHoursBeforeDeadline);
    evidence.push(inputEvidence('Available time before deadline', availableTimeBeforeDeadlineHours, source));
  } else if (horizon) {
    availableTimeBeforeDeadlineHours = deriveUsableCapacity(now, horizon, commitments);
    evidence.push({ fact: 'Usable capacity in impact horizon', value: availableTimeBeforeDeadlineHours, source: 'calculated', explanation: 'Weekday 08:00-18:00 Asia/Ho_Chi_Minh capacity minus the union of occupied calendar time.' });
  } else {
    missingData.push('availableHoursBeforeDeadline');
  }

  const workloadDerivation = horizon
    ? deriveWorkload(goals, commitments, now, horizon, evidence)
    : { hours: 0, linkedScheduledHours: 0, hasKnownEffort: false, urgentFocusedWork: false };
  if (isNegativeNumber(profile?.workloadHoursBeforeDeadline)) invalidInputs.push('workloadHoursBeforeDeadline');
  const explicitWorkload = isNonNegativeNumber(profile?.workloadHoursBeforeDeadline);
  const usedWorkloadAssumption = !explicitWorkload && !workloadDerivation.hasKnownEffort;
  let baseWorkload = 0;
  if (explicitWorkload) {
    baseWorkload = profile?.workloadHoursBeforeDeadline ?? 0;
    evidence.push(inputEvidence('Existing workload before deadline', baseWorkload, source));
  } else if (workloadDerivation.hasKnownEffort) {
    baseWorkload = workloadDerivation.hours;
    evidence.push({ fact: 'Derived unscheduled workload', value: baseWorkload, source: 'calculated', explanation: 'Sum of relevant remaining work after subtracting linked scheduled focus blocks.' });
  } else {
    assumptions.push('No deterministic workload hours were supplied or available from relevant goals.');
    missingData.push('workloadHoursBeforeDeadline');
  }
  const workloadHours = roundHours(baseWorkload + additionalWorkload);

  let projectedRemainingCapacityHours: number | null = null;
  if (timeCostHours !== undefined && availableTimeBeforeDeadlineHours !== null) {
    projectedRemainingCapacityHours = roundHours(availableTimeBeforeDeadlineHours - workloadHours - timeCostHours);
    evidence.push({ fact: 'Projected remaining capacity', value: projectedRemainingCapacityHours, source: 'calculated', explanation: 'Authoritative available time minus existing unscheduled workload, observed workload adjustments, and candidate time cost.' });
  }

  let deadlinePressure: DeadlinePressure = 'unknown';
  if (projectedRemainingCapacityHours !== null && availableTimeBeforeDeadlineHours !== null) {
    if (projectedRemainingCapacityHours < 0) deadlinePressure = 'high';
    else if (availableTimeBeforeDeadlineHours === 0 || projectedRemainingCapacityHours <= availableTimeBeforeDeadlineHours * 0.25) deadlinePressure = 'moderate';
    else deadlinePressure = 'low';
  }

  const energyCost = profile?.energyCost;
  const suppliedAvailableEnergy = profile?.availableEnergy;
  const availableEnergy = isNonNegativeNumber(suppliedAvailableEnergy) ? Math.max(0, suppliedAvailableEnergy - energyReduction) : undefined;
  const hasEnergyInputs = isNonNegativeNumber(energyCost) && isNonNegativeNumber(availableEnergy);
  let energyFit: EnergyFit = 'unknown';
  if (hasEnergyInputs) {
    evidence.push(inputEvidence('Candidate energy cost', energyCost, source));
    evidence.push(inputEvidence('Available energy', availableEnergy, source));
    const remainingEnergy = availableEnergy - energyCost;
    if (remainingEnergy < 0) energyFit = 'poor';
    else if (availableEnergy === 0 || remainingEnergy <= availableEnergy * 0.2) energyFit = 'strained';
    else energyFit = 'good';
  } else {
    if (isNegativeNumber(energyCost)) invalidInputs.push('energyCost');
    if (isNegativeNumber(suppliedAvailableEnergy)) invalidInputs.push('availableEnergy');
  }

  if (profile?.target) evidence.push(inputEvidence('Decision target', profile.target, source));
  if (profile?.goalRelevance) evidence.push(inputEvidence('Goal relevance', profile.goalRelevance, source));

  const uncertainCommitment = overlappingUnknownAttendance(profile, commitments);
  if (uncertainCommitment) {
    missingData.push(`attendanceRequirement:${uncertainCommitment.id}:${uncertainCommitment.description}`);
  }

  const deficitHours = projectedRemainingCapacityHours !== null ? Math.max(0, -projectedRemainingCapacityHours) : 0;
  const displacement = horizon
    ? selectDisplacements(deficitHours, profile, commitments, now, horizon)
    : { candidates: [], recoveredHours: 0 };
  const displacementSolvesDeficit = deficitHours > 0 && displacement.recoveredHours >= deficitHours;
  const focusQualityRisk = isHighQualityFocusRisk(
    profile,
    context,
    !explicitWorkload && workloadDerivation.urgentFocusedWork,
    horizon
  );
  const needsCoreInputs = timeCostHours === undefined || availableTimeBeforeDeadlineHours === null;

  let feasibility: DecisionFeasibility;
  if (needsCoreInputs || uncertainCommitment) feasibility = 'needs-info';
  else if (projectedRemainingCapacityHours !== null && projectedRemainingCapacityHours < 0 && !displacementSolvesDeficit) feasibility = 'not-feasible';
  else if (energyFit === 'poor' || (isOverloaded && hasDisruption)) feasibility = 'not-feasible';
  else if (displacementSolvesDeficit || focusQualityRisk || deadlinePressure === 'moderate' || energyFit === 'strained' || isOverloaded || hasDisruption) feasibility = 'at-risk';
  else feasibility = 'feasible';

  const confidence = confidenceFor(source, hasEnergyInputs, profile?.goalRelevance !== undefined, usedWorkloadAssumption, needsCoreInputs);
  return {
    availableTimeBeforeDeadlineHours,
    projectedRemainingCapacityHours,
    deadlinePressure,
    energyFit,
    feasibility,
    recommendation: recommendationFor(feasibility, deadlinePressure, energyFit, confidence, displacement.candidates, displacement.recoveredHours, focusQualityRisk),
    assumptions,
    missingData,
    invalidInputs,
    evidence,
    impactHorizonEnd: horizon,
    derivedWorkloadHours: explicitWorkload ? undefined : workloadDerivation.hours,
    linkedScheduledHours: workloadDerivation.linkedScheduledHours,
    recoveredCapacityHours: displacement.recoveredHours,
    displacementCandidates: displacement.candidates,
    focusQualityRisk
  };
}