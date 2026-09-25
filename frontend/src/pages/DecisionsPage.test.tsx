import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import '@testing-library/jest-dom';
import DecisionsPage from './DecisionsPage';
import { decisionsApi, contextApi } from '../api/client';
import type { DecisionApiResponse, DecisionPolicyOutcome, DecisionFeasibility, PersonalContext } from '../types/domain';

vi.mock('../api/client', () => ({
  decisionsApi: {
    query: vi.fn(),
    getHistory: vi.fn()
  },
  contextApi: {
    update: vi.fn()
  }
}));

const mockQuery = decisionsApi.query as MockedFunction<typeof decisionsApi.query>;
const mockContextUpdate = contextApi.update as MockedFunction<typeof contextApi.update>;

const dummyContext: PersonalContext = {
  userId: 'test-user',
  setupCompleted: true,
  goals: [],
  commitments: [],
  preferences: [],
  calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
  recentDecisions: [],
  lastUpdated: new Date().toISOString()
};

function buildFixture(
  outcome: DecisionPolicyOutcome,
  feasibility: DecisionFeasibility,
  option: 'proceed' | 'proceed-with-caution' | 'do-not-proceed' | '',
  overrides: Partial<DecisionApiResponse> = {}
): DecisionApiResponse {
  return {
    decision: {
      recommendation: { option, confidence: outcome === 'RECOMMEND' ? 0.9 : 0, reasoning: 'Reason' },
      tradeoffs: []
    },
    assessment: {
      feasibility,
      deadlinePressure: 'low',
      energyFit: 'good',
      projectedRemainingCapacityHours: 10,
      availableTimeBeforeDeadlineHours: 20,
      assumptions: ['Assumed true'],
      missingData: [],
      invalidInputs: [],
      evidence: [
        { fact: 'Confirmed cost', value: 10, source: 'user-confirmed', explanation: '' },
        { fact: 'Derived speed', value: 'fast', source: 'calculated', explanation: '' }
      ],
      recommendation: { option, confidence: outcome === 'RECOMMEND' ? 0.9 : 0, reasoning: 'Reason' }
    },
    policy: {
      outcome,
      reason: outcome === 'ABSTAIN' ? 'I do not know enough to make a useful recommendation.' : 'Sufficient evidence.'
    },
    ...overrides
  };
}

describe('DecisionsPage - RECOMMEND', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders recommendation option, reason, and boundary clearly, without choice persistence', async () => {
    const mockResponse = buildFixture('RECOMMEND', 'feasible', 'proceed');
    mockQuery.mockResolvedValueOnce(mockResponse);

    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getByText(/proceed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/What will you do\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accept & Add to Schedule/i })).toBeInTheDocument();
    expect(screen.queryByText('AI')).not.toBeInTheDocument(); // No standalone AI badge
  });

  it('renders ASK structured-field clarification and submits correct structure', async () => {
    const mockResponse = buildFixture('ASK', 'needs-info', '', {
      policy: {
        outcome: 'ASK',
        reason: 'Missing material information.',
        unresolvedMaterialFields: ['timeCostHours', 'availableHoursBeforeDeadline']
      }
    });

    mockQuery.mockResolvedValueOnce(mockResponse);

    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getByText('Needs your input')).toBeInTheDocument();
    });

    const timeCostInput = screen.getByRole('spinbutton', { name: 'timeCostHours' });
    const availableHoursInput = screen.getByRole('spinbutton', { name: 'availableHoursBeforeDeadline' });

    expect(timeCostInput).toBeInTheDocument();
    expect(availableHoursInput).toBeInTheDocument();

    fireEvent.change(timeCostInput, { target: { value: '2' } });
    fireEvent.change(availableHoursInput, { target: { value: '10' } });

    const submitBtn = screen.getByRole('button', { name: /Re-assess with Clarifications/i });

    const mockResolvedResponse = buildFixture('RECOMMEND', 'feasible', 'proceed');
    mockQuery.mockResolvedValueOnce(mockResolvedResponse);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      query: expect.objectContaining({
        impactProfile: expect.objectContaining({
          timeCostHours: 2,
          availableHoursBeforeDeadline: 10
        }),
        clarification: {
          attempted: true,
          unresolvedFields: [],
          unresolvedConflicts: undefined
        }
      })
    }));
  });

  it('submits unresolved fields and renders ABSTAIN when skipping clarification', async () => {
    const mockAskResponse = buildFixture('ASK', 'needs-info', '', {
      policy: { outcome: 'ASK', reason: 'Missing info', unresolvedMaterialFields: ['timeCostHours'] }
    });

    const mockAbstainResponse = buildFixture('ABSTAIN', 'needs-info', '');

    mockQuery.mockResolvedValueOnce(mockAskResponse);

    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getByText('Needs your input')).toBeInTheDocument();
    });

    mockQuery.mockResolvedValueOnce(mockAbstainResponse);

    const skipBtn = screen.getByRole('button', { name: /I'm not sure \/ continue without resolving/i });
    fireEvent.click(skipBtn);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      query: expect.objectContaining({
        clarification: {
          attempted: true,
          unresolvedFields: ['timeCostHours'],
          unresolvedConflicts: undefined
        }
      })
    }));

    await waitFor(() => {
      expect(screen.getByText('I do not know enough to make a useful recommendation.')).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: 'Recommendation' })).not.toBeInTheDocument();
  });

  it('RECOMMEND explanation separates confirmed facts, derived context, assumptions, uncertainty, and trade-offs', async () => {
    const mockResponse = buildFixture('RECOMMEND', 'feasible', 'proceed-with-caution', {
      decision: {
        recommendation: { option: 'proceed-with-caution', confidence: 0.8, reasoning: 'Looks okay' },
        tradeoffs: [
          { option: 'proceed-with-caution', gains: ['Fast'], costs: ['Risk'] }
        ]
      }
    });

    mockQuery.mockResolvedValueOnce(mockResponse);
    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getByText('Trade-offs')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Confirmed facts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Derived context' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assumptions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uncertainty' })).toBeInTheDocument();

    expect(screen.getByText('Confirmed cost')).toBeInTheDocument();
    expect(screen.getByText('Derived speed')).toBeInTheDocument();
    expect(screen.getByText('Assumed true')).toBeInTheDocument();
    expect(screen.getByText('No missing data.')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Trade-offs' })).toBeInTheDocument();
    expect(screen.getByText('Gains')).toBeInTheDocument();
    expect(screen.getByText('Costs')).toBeInTheDocument();
    expect(screen.getByText(/Input Completeness & Trustworthiness - not chance of success/i)).toBeInTheDocument();
  });

  it('renders conflict ASK display and includes unresolvedConflicts in payload when skipping', async () => {
    const mockAskResponse = buildFixture('ASK', 'needs-info', '', {
      policy: {
        outcome: 'ASK',
        reason: 'You have conflicting information.',
        unresolvedMaterialConflicts: ['Your deadline is today, but time cost is 100 hours.']
      }
    });

    const mockAbstainResponse = buildFixture('ABSTAIN', 'needs-info', '');

    mockQuery.mockResolvedValueOnce(mockAskResponse);

    render(<DecisionsPage />);
    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I do this?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getByText('Needs your input')).toBeInTheDocument();
    });

    expect(screen.getByText('Your deadline is today, but time cost is 100 hours.')).toBeInTheDocument();

    mockQuery.mockResolvedValueOnce(mockAbstainResponse);

    const skipBtn = screen.getByRole('button', { name: /I'm not sure \/ continue without resolving/i });
    fireEvent.click(skipBtn);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      query: expect.objectContaining({
        clarification: {
          attempted: true,
          unresolvedFields: [],
          unresolvedConflicts: ['Your deadline is today, but time cost is 100 hours.']
        }
      })
    }));
  });

  it('keeps unknown metadata fields in unresolvedFields and does not mutate form state on clarification submit', async () => {
    const mockResponse = buildFixture('ASK', 'needs-info', '', {
      policy: {
        outcome: 'ASK',
        reason: 'Missing material information.',
        unresolvedMaterialFields: ['timeCostHours', 'unknownMetadataField']
      }
    });

    mockQuery.mockResolvedValueOnce(mockResponse);

    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Test unknown field' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getByText('Needs your input')).toBeInTheDocument();
    });

    const timeCostInput = screen.getByRole('spinbutton', { name: 'timeCostHours' });
    const unknownInput = screen.getByRole('textbox', { name: 'unknownMetadataField' });

    fireEvent.change(timeCostInput, { target: { value: '3' } });
    fireEvent.change(unknownInput, { target: { value: 'some value' } });

    const submitBtn = screen.getByRole('button', { name: /Re-assess with Clarifications/i });

    const mockResolvedResponse = buildFixture('ABSTAIN', 'needs-info', '');
    mockQuery.mockResolvedValueOnce(mockResolvedResponse);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      query: expect.objectContaining({
        impactProfile: expect.objectContaining({
          timeCostHours: 3
        }),
        clarification: {
          attempted: true,
          unresolvedFields: ['unknownMetadataField'],
          unresolvedConflicts: undefined
        }
      })
    }));

    const lastCallQuery = mockQuery.mock.calls[1][0].query;
    expect(lastCallQuery.impactProfile).not.toHaveProperty('unknownMetadataField');
  });
  it('handles context change and before/after reassessment comparison', async () => {
    // Arrange: Initial result with facts to be changed, removed, and kept
    const initialResponse = buildFixture('RECOMMEND', 'feasible', 'proceed', {
      decision: {
        recommendation: { option: 'proceed', confidence: 0.9, reasoning: 'Initial reason' },
        tradeoffs: []
      },
      policy: { outcome: 'RECOMMEND', reason: 'ok' },
      assessment: {
        feasibility: 'feasible',
        deadlinePressure: 'low',
        energyFit: 'good',
        projectedRemainingCapacityHours: 10,
        availableTimeBeforeDeadlineHours: 20,
        assumptions: [],
        missingData: [],
        invalidInputs: [],
        recommendation: { option: 'proceed', confidence: 1.0, reasoning: 'Assessment reason' },
        evidence: [
          { fact: 'Stable fact', value: 'yes', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Value change fact', value: 'old-val', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Source change fact', value: 'same-val', source: 'estimated', explanation: 'ok' },
          { fact: 'Explanation change fact', value: 'same-val', source: 'user-confirmed', explanation: 'old explanation' },
          { fact: 'Removed fact', value: 'gone', source: 'estimated', explanation: 'old' }
        ]
      }
    });

    mockQuery.mockResolvedValueOnce(initialResponse);

    render(<DecisionsPage />);

    // Act: Request initial decision
    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Initial reason')[0]).toBeInTheDocument();
    });

    // Act: Submit observation causing stale context
    fireEvent.click(screen.getByRole('button', { name: /Add Context Change/i }));

    const obsCategory = screen.getByLabelText(/Change category/i);
    const obsDesc = screen.getByLabelText(/Description/i);
    const obsSev = screen.getByLabelText(/Severity/i);

    fireEvent.change(obsCategory, { target: { value: 'workload-increase' } });
    fireEvent.change(obsDesc, { target: { value: 'Urgent production task' } });
    fireEvent.change(obsSev, { target: { value: 'high' } });

    mockContextUpdate.mockResolvedValueOnce(dummyContext);

    fireEvent.click(screen.getByRole('button', { name: /Submit Observation/i }));

    await waitFor(() => {
      expect(mockContextUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workload-increase',
          data: { description: 'Urgent production task', severity: 'high' },
          source: 'USER_CONFIRMED',
          confidence: 1.0
        })
      );
    });

    // Assert: Verify stale status and button
    await waitFor(() => {
      expect(screen.getByText(/Context changed. Your current result is stale./i)).toBeInTheDocument();
    });

    const reassessBtn = screen.getByRole('button', { name: /Re-assess same decision/i });
    expect(reassessBtn).toBeInTheDocument();

    // Arrange: Updated result with added, changed, and removed facts
    const updatedResponse = buildFixture('RECOMMEND', 'at-risk', 'proceed-with-caution', {
      decision: {
        recommendation: { option: 'proceed-with-caution', confidence: 0.8, reasoning: 'New reason due to workload' },
        tradeoffs: []
      },
      policy: { outcome: 'RECOMMEND', reason: 'ok' },
      assessment: {
        feasibility: 'at-risk',
        deadlinePressure: 'high',
        energyFit: 'good',
        projectedRemainingCapacityHours: 10,
        availableTimeBeforeDeadlineHours: 20,
        assumptions: [],
        missingData: [],
        invalidInputs: [],
        recommendation: { option: 'proceed-with-caution', confidence: 1.0, reasoning: 'Assessment reason' },
        evidence: [
          { fact: 'Stable fact', value: 'yes', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Value change fact', value: 'new-val', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Source change fact', value: 'same-val', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Explanation change fact', value: 'same-val', source: 'user-confirmed', explanation: 'new explanation' },
          { fact: 'Added fact', value: 'new-val', source: 'provided', explanation: 'new' }
        ]
      }
    });

    // Act: Re-assess decision
    mockQuery.mockResolvedValueOnce(updatedResponse);
    fireEvent.click(reassessBtn);

    // Assert: Verify before/after comparison and delta
    await waitFor(() => {
      expect(screen.getByText(/Recommendation changed/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText('Initial reason')[0]).toBeInTheDocument();
    expect(screen.getAllByText('New reason due to workload')[0]).toBeInTheDocument();

    expect(screen.getByText(/Value change fact:/i).parentElement).toHaveTextContent(/Changed from old-val \(user-confirmed\) -> new-val \(user-confirmed\)/);
    expect(screen.getByText(/Source change fact:/i).parentElement).toHaveTextContent(/Changed from same-val \(estimated\) -> same-val \(user-confirmed\)/);
    expect(screen.getByText(/Explanation change fact:/i).parentElement).toHaveTextContent(/Changed from same-val \(user-confirmed\) -> same-val \(user-confirmed\)/);
    expect(screen.getByText(/Added fact:/i).parentElement).toHaveTextContent(/Added: new-val \(provided\)/);
    expect(screen.getByText(/Removed fact:/i).parentElement).toHaveTextContent(/Removed gone \(estimated\)/);
  });

  it('handles reassessment with unchanged recommendation option but updated reasoning', async () => {
    // Arrange: Initial result with facts to be changed, removed, and kept
    const initialResponse = buildFixture('RECOMMEND', 'feasible', 'proceed', {
      decision: {
        recommendation: { option: 'proceed', confidence: 0.9, reasoning: 'Initial reason' },
        tradeoffs: []
      },
      policy: { outcome: 'RECOMMEND', reason: 'ok' },
      assessment: {
        feasibility: 'feasible',
        deadlinePressure: 'low',
        energyFit: 'good',
        projectedRemainingCapacityHours: 10,
        availableTimeBeforeDeadlineHours: 20,
        assumptions: [],
        missingData: [],
        invalidInputs: [],
        recommendation: { option: 'proceed', confidence: 1.0, reasoning: 'Assessment reason' },
        evidence: [
          { fact: 'Stable fact', value: 'yes', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Value change fact', value: 'old-val', source: 'user-confirmed', explanation: 'ok' },
          { fact: 'Source change fact', value: 'same-val', source: 'estimated', explanation: 'ok' },
          { fact: 'Explanation change fact', value: 'same-val', source: 'user-confirmed', explanation: 'old explanation' },
          { fact: 'Removed fact', value: 'gone', source: 'estimated', explanation: 'old' }
        ]
      }
    });

    mockQuery.mockResolvedValueOnce(initialResponse);

    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Initial reason')[0]).toBeInTheDocument();
    });

    // Act: Submit observation causing stale context
    fireEvent.click(screen.getByRole('button', { name: /Add Context Change/i }));
    fireEvent.change(screen.getByLabelText(/Change category/i), { target: { value: 'workload-increase' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Minor extra task' } });
    fireEvent.change(screen.getByLabelText(/Severity/i), { target: { value: 'low' } });

    mockContextUpdate.mockResolvedValueOnce(dummyContext);
    fireEvent.click(screen.getByRole('button', { name: /Submit Observation/i }));

    // Assert: Verify stale status
    await waitFor(() => {
      expect(screen.getByText(/Context changed. Your current result is stale./i)).toBeInTheDocument();
    });

    // Arrange: Updated result with same option but new reasoning
    const updatedResponse = buildFixture('RECOMMEND', 'feasible', 'proceed', {
      decision: {
        recommendation: { option: 'proceed', confidence: 0.9, reasoning: 'Still ok but keep an eye on it' },
        tradeoffs: []
      },
      policy: { outcome: 'RECOMMEND', reason: 'ok' },
      assessment: {
        feasibility: 'feasible',
        deadlinePressure: 'low',
        energyFit: 'good',
        projectedRemainingCapacityHours: 10,
        availableTimeBeforeDeadlineHours: 20,
        assumptions: [],
        missingData: [],
        invalidInputs: [],
        recommendation: { option: 'proceed', confidence: 1.0, reasoning: 'Assessment reason' },
        evidence: [
          { fact: 'Stable fact', value: 'yes', source: 'user-confirmed', explanation: 'ok' }
        ]
      }
    });

    // Act: Re-assess decision
    mockQuery.mockResolvedValueOnce(updatedResponse);
    fireEvent.click(screen.getByRole('button', { name: /Re-assess same decision/i }));

    // Assert: Verify unchanged recommendation handling
    await waitFor(() => {
      expect(screen.getByText(/Recommendation unchanged/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText('Initial reason')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Still ok but keep an eye on it')[0]).toBeInTheDocument();
  });


  it('keeps prior result visible and leaves comparison unset on reassessment failure', async () => {
    const initialResponse = buildFixture('RECOMMEND', 'feasible', 'proceed', {
      decision: {
        recommendation: { option: 'proceed', confidence: 0.9, reasoning: 'Initial reason' },
        tradeoffs: []
      }
    });

    mockQuery.mockResolvedValueOnce(initialResponse);
    render(<DecisionsPage />);

    fireEvent.change(screen.getByLabelText(/What decision do you need help with\?/i), { target: { value: 'Should I work?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Future Me/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Initial reason')[0]).toBeInTheDocument();
    });

    // Act: Submit observation causing stale context
    fireEvent.click(screen.getByRole('button', { name: /Add Context Change/i }));
    fireEvent.change(screen.getByLabelText(/Change category/i), { target: { value: 'workload-increase' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Urgent production task' } });
    fireEvent.change(screen.getByLabelText(/Severity/i), { target: { value: 'high' } });

    mockContextUpdate.mockResolvedValueOnce(dummyContext);
    fireEvent.click(screen.getByRole('button', { name: /Submit Observation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Context changed. Your current result is stale./i)).toBeInTheDocument();
    });

    const reassessBtn = screen.getByRole('button', { name: /Re-assess same decision/i });

    // Act: Attempt to re-assess and fail
    mockQuery.mockRejectedValueOnce(new Error('Network error'));
    fireEvent.click(reassessBtn);

    // Assert: Verify error state and preserved prior context
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Initial reason')[0]).toBeInTheDocument();
    expect(screen.getByText(/Context changed. Your current result is stale./i)).toBeInTheDocument();
    expect(screen.queryByText('Assessment Updated')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Re-assess same decision/i })).toBeInTheDocument();
  });
});
