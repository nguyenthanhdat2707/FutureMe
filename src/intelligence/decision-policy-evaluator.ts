import {
  DecisionFeasibilityAssessment,
  DecisionClarificationMetadata,
  DecisionPolicyResult
} from '../domain/types';

export function evaluateDecisionPolicy(
  assessment: DecisionFeasibilityAssessment,
  clarification?: DecisionClarificationMetadata,
  detectedConflicts: string[] = []
): DecisionPolicyResult {
  if (assessment.invalidInputs.length > 0) {
    return {
      outcome: 'ABSTAIN',
      reason: 'I do not know enough to make a useful recommendation.'
    };
  }

  const conflicts = Array.from(new Set([
    ...(clarification?.unresolvedConflicts || []),
    ...detectedConflicts
  ]));

  const missingData = Array.from(new Set([
    ...assessment.missingData,
    ...(clarification?.unresolvedFields || [])
  ]));

  if (assessment.feasibility === 'needs-info' || missingData.length > 0 || conflicts.length > 0) {
    if (clarification?.attempted) {
      return {
        outcome: 'ABSTAIN',
        reason: 'I do not know enough to make a useful recommendation.',
        unresolvedMaterialFields: missingData,
        unresolvedMaterialConflicts: conflicts
      };
    }
    return {
      outcome: 'ASK',
      reason: 'Missing material information or unresolved conflicts require clarification.',
      unresolvedMaterialFields: missingData,
      unresolvedMaterialConflicts: conflicts
    };
  }

  return {
    outcome: 'RECOMMEND',
    reason: 'Sufficient evidence to make a recommendation.'
  };
}
