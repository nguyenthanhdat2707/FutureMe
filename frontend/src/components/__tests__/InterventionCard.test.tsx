import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterventionCard } from '../InterventionCard';
import type { ProactiveIntervention } from '../../types/domain';

describe('InterventionCard Component', () => {
  const onRespondMock = vi.fn().mockResolvedValue(undefined);
  const onDismissMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when intervention is null (Explicit NO_OP Silence)', () => {
    const { container } = render(
      <InterventionCard
        intervention={null}
        onRespond={onRespondMock}
        onDismiss={onDismissMock}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when interventionType is NONE', () => {
    const noneIntervention: ProactiveIntervention = {
      interventionType: 'NONE',
      reason: 'No active decisions to intervene on',
    };

    const { container } = render(
      <InterventionCard
        intervention={noneIntervention}
        onRespond={onRespondMock}
        onDismiss={onDismissMock}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders CONTEXT_CHECK intervention with prompt and actions', async () => {
    const contextCheck: ProactiveIntervention = {
      id: 'int-check-1',
      interventionType: 'CONTEXT_CHECK',
      reason: 'Event "Team Roadmap Alignment" ended over 1 hour ago without completion confirmation.',
      prompt: 'Are you still working on "Team Roadmap Alignment"? Did you complete it?',
      suggestedActions: ['Yes, completed', 'No, still working', 'Dismiss'],
      severity: 'medium',
    };

    render(
      <InterventionCard
        intervention={contextCheck}
        onRespond={onRespondMock}
        onDismiss={onDismissMock}
      />
    );

    // Verify badge and prompt
    expect(screen.getByText('Context Check')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you still working on "Team Roadmap Alignment"? Did you complete it?'
      )
    ).toBeInTheDocument();

    // Verify action buttons
    const completedBtn = screen.getByRole('button', { name: 'Yes, completed' });
    const stillWorkingBtn = screen.getByRole('button', { name: 'No, still working' });
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss' });

    expect(completedBtn).toBeInTheDocument();
    expect(stillWorkingBtn).toBeInTheDocument();
    expect(dismissBtn).toBeInTheDocument();

    // Click affirmative
    fireEvent.click(completedBtn);
    await waitFor(() => {
      expect(onRespondMock).toHaveBeenCalledWith('Yes, completed');
    });
  });

  it('renders CONSEQUENTIAL_DISRUPTION with high severity and handles response', async () => {
    const disruption: ProactiveIntervention = {
      id: 'int-disrupt-1',
      interventionType: 'CONSEQUENTIAL_DISRUPTION',
      reason: 'A calendar conflict or workload surge leaves negative remaining capacity.',
      prompt: 'Your time is now constrained for "Board Presentation Deck". Would you like to review or adjust this decision?',
      suggestedActions: ['Review Decision', 'Adjust Schedule', 'Dismiss'],
      severity: 'high',
    };

    render(
      <InterventionCard
        intervention={disruption}
        onRespond={onRespondMock}
        onDismiss={onDismissMock}
      />
    );

    expect(screen.getByText('Disruption Alert')).toBeInTheDocument();
    expect(screen.getByText(/Severity: high/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your time is now constrained for "Board Presentation Deck". Would you like to review or adjust this decision?'
      )
    ).toBeInTheDocument();

    const reviewBtn = screen.getByRole('button', { name: 'Review Decision' });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(onRespondMock).toHaveBeenCalledWith('Review Decision');
    });
  });

  it('handles dismiss via the Dismiss button', async () => {
    const disruption: ProactiveIntervention = {
      id: 'int-disrupt-2',
      interventionType: 'CONSEQUENTIAL_DISRUPTION',
      reason: 'Capacity changed by 3.0 hours',
      prompt: 'Available capacity has shifted. Review?',
      suggestedActions: ['Review Decision', 'Dismiss'],
      severity: 'medium',
    };

    render(
      <InterventionCard
        intervention={disruption}
        onRespond={onRespondMock}
        onDismiss={onDismissMock}
      />
    );

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(onDismissMock).toHaveBeenCalledTimes(1);
    });
  });

  it('handles dismiss via top-right close icon', async () => {
    const contextCheck: ProactiveIntervention = {
      id: 'int-check-2',
      interventionType: 'CONTEXT_CHECK',
      reason: 'Stale event',
      prompt: 'Did you finish?',
      suggestedActions: ['Yes', 'Dismiss'],
    };

    render(
      <InterventionCard
        intervention={contextCheck}
        onRespond={onRespondMock}
        onDismiss={onDismissMock}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Dismiss intervention' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(onDismissMock).toHaveBeenCalledTimes(1);
    });
  });
});
