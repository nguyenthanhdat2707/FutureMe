import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import '@testing-library/jest-dom';
import DecisionsPage from './DecisionsPage';
import { decisionsApi } from '../api/client';
import type { DecisionApiResponse, DecisionPolicyOutcome, DecisionFeasibility } from '../types/domain';

vi.mock('../api/client', () => ({
  decisionsApi: {
    query: vi.fn(),
    getHistory: vi.fn()
  }
}));

const mockQuery = decisionsApi.query as MockedFunction<typeof decisionsApi.query>;

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

    expect(screen.getByText(/This recommendation is non-binding/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Choose|Accept|Persist/i })).not.toBeInTheDocument();
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
});
