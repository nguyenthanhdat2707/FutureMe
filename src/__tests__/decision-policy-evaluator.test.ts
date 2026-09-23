import { evaluateDecisionPolicy } from '../intelligence/decision-policy-evaluator';
import { DecisionFeasibilityAssessment, DecisionClarificationMetadata, Recommendation } from '../domain/types';

describe('evaluateDecisionPolicy', () => {
  const baseRecommendation: Recommendation = {
    option: 'proceed',
    confidence: 0.8,
    reasoning: 'Looks good'
  };

  const createAssessment = (
    feasibility: DecisionFeasibilityAssessment['feasibility'],
    missingData: string[] = [],
    invalidInputs: string[] = []
  ): DecisionFeasibilityAssessment => ({
    availableTimeBeforeDeadlineHours: 10,
    projectedRemainingCapacityHours: 5,
    deadlinePressure: 'low',
    energyFit: 'good',
    feasibility,
    recommendation: baseRecommendation,
    assumptions: [],
    missingData,
    invalidInputs,
    evidence: []
  });

  it('feasible returns RECOMMEND', () => {
    const assessment = createAssessment('feasible');
    const result = evaluateDecisionPolicy(assessment, undefined);
    expect(result.outcome).toBe('RECOMMEND');
    expect(result.reason).toBe('Sufficient evidence to make a recommendation.');
  });

  it('at-risk returns RECOMMEND', () => {
    const assessment = createAssessment('at-risk');
    const result = evaluateDecisionPolicy(assessment, undefined);
    expect(result.outcome).toBe('RECOMMEND');
  });

  it('not-feasible returns RECOMMEND', () => {
    const assessment = createAssessment('not-feasible');
    const result = evaluateDecisionPolicy(assessment, undefined);
    expect(result.outcome).toBe('RECOMMEND');
  });

  it('needs-info on first request returns ASK', () => {
    const assessment = createAssessment('needs-info', ['timeCostHours']);
    const result = evaluateDecisionPolicy(assessment, undefined);
    expect(result.outcome).toBe('ASK');
    expect(result.unresolvedMaterialFields).toEqual(['timeCostHours']);
  });

  it('needs-info after attempted clarification returns ABSTAIN', () => {
    const assessment = createAssessment('needs-info', ['timeCostHours']);
    const clarification: DecisionClarificationMetadata = {
      attempted: true,
      unresolvedFields: ['timeCostHours']
    };
    const result = evaluateDecisionPolicy(assessment, clarification);
    expect(result.outcome).toBe('ABSTAIN');
    expect(result.reason).toBe('I do not know enough to make a useful recommendation.');
    expect(result.unresolvedMaterialFields).toEqual(['timeCostHours']);
  });

  it('material conflict on first request returns ASK', () => {
    const assessment = createAssessment('feasible');
    const result = evaluateDecisionPolicy(assessment, undefined, ['time_conflict']);
    expect(result.outcome).toBe('ASK');
    expect(result.unresolvedMaterialConflicts).toEqual(['time_conflict']);
  });

  it('material conflict after attempted clarification returns ABSTAIN', () => {
    const assessment = createAssessment('feasible');
    const clarification: DecisionClarificationMetadata = {
      attempted: true,
      unresolvedConflicts: ['time_conflict']
    };
    const result = evaluateDecisionPolicy(assessment, clarification, ['time_conflict']);
    expect(result.outcome).toBe('ABSTAIN');
    expect(result.reason).toBe('I do not know enough to make a useful recommendation.');
    expect(result.unresolvedMaterialConflicts).toEqual(['time_conflict']);
  });

  it('invalid material inputs at boundary returns ABSTAIN', () => {
    const assessment = createAssessment('needs-info', [], ['negative timeCostHours']);
    const result = evaluateDecisionPolicy(assessment, undefined);
    expect(result.outcome).toBe('ABSTAIN');
    expect(result.reason).toBe('I do not know enough to make a useful recommendation.');
  });
});
