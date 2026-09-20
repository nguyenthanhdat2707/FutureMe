import {
  DeadlinePressure,
  DecisionFeasibility,
  DecisionFeasibilityAssessment,
  DecisionImpactProfile,
  DecisionImpactSource,
  EnergyFit,
  FeasibilityEvidence,
  Recommendation
} from '../domain/types';

const HOURS_TO_MILLISECONDS = 60 * 60 * 1000;

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
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

function recommendationFor(
  feasibility: DecisionFeasibility,
  deadlinePressure: DeadlinePressure,
  energyFit: EnergyFit,
  confidence: number
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
      ? 'The supplied hours produce high deadline pressure and negative remaining capacity.'
      : 'The supplied energy requirement exceeds the available energy.';
    return { option: 'do-not-proceed', confidence, reasoning: reason };
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
    reasoning: `The supplied impact values leave positive capacity without high deadline pressure.${energyCaveat}`
  };
}

function confidenceFor(
  source: DecisionImpactSource,
  hasEnergyInputs: boolean,
  hasGoalRelevance: boolean,
  usedWorkloadAssumption: boolean,
  needsCoreInputs: boolean
): number {
  if (needsCoreInputs) {
    return 0;
  }

  let confidence = source === 'user-confirmed' ? 0.8 : source === 'estimated' ? 0.55 : 0.65;
  if (hasEnergyInputs) confidence += 0.1;
  if (hasGoalRelevance) confidence += 0.05;
  if (!usedWorkloadAssumption) confidence += 0.05;
  return Math.min(0.95, roundHours(confidence));
}

export function assessDecisionFeasibility(
  profile: DecisionImpactProfile | undefined,
  now: Date = new Date()
): DecisionFeasibilityAssessment {
  const assumptions: string[] = [];
  const missingData: string[] = [];
  const evidence: FeasibilityEvidence[] = [];
  const source = profile?.source ?? 'provided';

  const timeCostHours = profile?.timeCostHours;
  if (!isNonNegativeNumber(timeCostHours)) {
    missingData.push('timeCostHours');
  } else {
    evidence.push(inputEvidence('Candidate time cost', timeCostHours, source));
  }

  let availableTimeBeforeDeadlineHours: number | null = null;
  if (isNonNegativeNumber(profile?.availableHoursBeforeDeadline)) {
    availableTimeBeforeDeadlineHours = roundHours(profile.availableHoursBeforeDeadline);
    evidence.push(inputEvidence(
      'Available time before deadline',
      availableTimeBeforeDeadlineHours,
      source
    ));
  } else if (profile?.deadline !== undefined) {
    const deadline = new Date(profile.deadline);
    if (!Number.isNaN(deadline.getTime())) {
      availableTimeBeforeDeadlineHours = roundHours(
        Math.max(0, (deadline.getTime() - now.getTime()) / HOURS_TO_MILLISECONDS)
      );
      evidence.push(inputEvidence('Deadline', deadline.toISOString(), source));
      evidence.push({
        fact: 'Available time before deadline',
        value: availableTimeBeforeDeadlineHours,
        source: 'calculated',
        explanation: 'Elapsed hours from the assessment time to the supplied deadline, floored at zero.'
      });
      assumptions.push('Deadline-derived time is elapsed clock time, not guaranteed schedulable work time.');
    } else {
      missingData.push('availableHoursBeforeDeadline or deadline');
    }
  } else {
    missingData.push('availableHoursBeforeDeadline or deadline');
  }

  const suppliedWorkloadHours = profile?.workloadHoursBeforeDeadline;
  const usedWorkloadAssumption = !isNonNegativeNumber(suppliedWorkloadHours);
  const workloadHours = usedWorkloadAssumption ? 0 : suppliedWorkloadHours;
  if (usedWorkloadAssumption) {
    assumptions.push('No workload hours were supplied; projected capacity accounts only for the candidate commitment.');
    missingData.push('workloadHoursBeforeDeadline');
  } else {
    evidence.push(inputEvidence('Existing workload before deadline', workloadHours, source));
  }

  let projectedRemainingCapacityHours: number | null = null;
  if (isNonNegativeNumber(timeCostHours) && availableTimeBeforeDeadlineHours !== null) {
    projectedRemainingCapacityHours = roundHours(
      availableTimeBeforeDeadlineHours - workloadHours - timeCostHours
    );
    evidence.push({
      fact: 'Projected remaining capacity',
      value: projectedRemainingCapacityHours,
      source: 'calculated',
      explanation: 'Available time minus supplied workload and candidate time cost.'
    });
  }

  let deadlinePressure: DeadlinePressure = 'unknown';
  if (projectedRemainingCapacityHours !== null && availableTimeBeforeDeadlineHours !== null) {
    if (projectedRemainingCapacityHours < 0) {
      deadlinePressure = 'high';
    } else if (
      availableTimeBeforeDeadlineHours === 0 ||
      projectedRemainingCapacityHours <= availableTimeBeforeDeadlineHours * 0.25
    ) {
      deadlinePressure = 'moderate';
    } else {
      deadlinePressure = 'low';
    }
  }

  const energyCost = profile?.energyCost;
  const availableEnergy = profile?.availableEnergy;
  const hasEnergyInputs = isNonNegativeNumber(energyCost) && isNonNegativeNumber(availableEnergy);
  let energyFit: EnergyFit = 'unknown';
  if (hasEnergyInputs) {
    evidence.push(inputEvidence('Candidate energy cost', energyCost, source));
    evidence.push(inputEvidence('Available energy', availableEnergy, source));
    const remainingEnergy = availableEnergy - energyCost;
    if (remainingEnergy < 0) {
      energyFit = 'poor';
    } else if (availableEnergy === 0 || remainingEnergy <= availableEnergy * 0.2) {
      energyFit = 'strained';
    } else {
      energyFit = 'good';
    }
  } else {
    if (!isNonNegativeNumber(energyCost)) missingData.push('energyCost');
    if (!isNonNegativeNumber(availableEnergy)) missingData.push('availableEnergy');
  }

  if (profile?.target) evidence.push(inputEvidence('Decision target', profile.target, source));
  if (profile?.goalRelevance) {
    evidence.push(inputEvidence('Goal relevance', profile.goalRelevance, source));
  }

  const needsCoreInputs = !isNonNegativeNumber(timeCostHours) || availableTimeBeforeDeadlineHours === null;
  let feasibility: DecisionFeasibility;
  if (needsCoreInputs) {
    feasibility = 'needs-info';
  } else if (
    projectedRemainingCapacityHours !== null && projectedRemainingCapacityHours < 0 ||
    energyFit === 'poor'
  ) {
    feasibility = 'not-feasible';
  } else if (deadlinePressure === 'moderate' || energyFit === 'strained') {
    feasibility = 'at-risk';
  } else {
    feasibility = 'feasible';
  }

  const confidence = confidenceFor(
    source,
    hasEnergyInputs,
    profile?.goalRelevance !== undefined,
    usedWorkloadAssumption,
    needsCoreInputs
  );

  return {
    availableTimeBeforeDeadlineHours,
    projectedRemainingCapacityHours,
    deadlinePressure,
    energyFit,
    feasibility,
    recommendation: recommendationFor(feasibility, deadlinePressure, energyFit, confidence),
    assumptions,
    missingData,
    evidence
  };
}
