import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    context: {
      getCurrent: vi.fn(),
      setup: vi.fn(),
    },
    calendar: {
      getStatus: vi.fn(),
    }
  }
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it('renders setup flow when setup is incomplete', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      userId: 'test',
      setupCompleted: false,
      goals: [],
      commitments: [],
      preferences: [],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: new Date().toISOString()
    });

    renderWithRouter(<HomePage />);

    expect(await screen.findByText("Let's set up your context so I can help you better.")).toBeInTheDocument();

    // Check 3 questions
    expect(screen.getByText(/What are your main priorities right now\?/)).toBeInTheDocument();
    expect(screen.getByText(/Any hard deadlines or non-negotiable commitments\?/)).toBeInTheDocument();
    expect(screen.getByText(/How do you track your plans\?/)).toBeInTheDocument();
  });

  it('submits only answered fields and reloads', async () => {
    vi.mocked(api.context.getCurrent)
      .mockResolvedValueOnce({
        userId: 'test',
        setupCompleted: false,
        goals: [], commitments: [], preferences: [],
        calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: ''
      })
      .mockResolvedValueOnce({
        userId: 'test',
        setupCompleted: true, // after reload
        goals: [], commitments: [], preferences: [],
        calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: ''
      });

    renderWithRouter(<HomePage />);
    await screen.findByText(/What are your main priorities right now\?/);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Sleep' } });

    const submitBtn = screen.getByText('Complete Setup');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.context.setup).toHaveBeenCalledWith({ priorities: 'Sleep' });
      expect(api.context.getCurrent).toHaveBeenCalledTimes(2);
    });

    // Should now show dashboard
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('dashboard renders correctly and never says free for null capacity', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      userId: 'test',
      setupCompleted: true,
      goals: [], commitments: [], preferences: [],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: ''
    });

    renderWithRouter(<HomePage />);
    await screen.findByText('Dashboard');

    expect(screen.getByText(/Your calendar is not synced/)).toBeInTheDocument();
    expect(screen.queryByText(/available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free/i)).not.toBeInTheDocument();
  });

  it('can skip all setup questions and sends empty answers', async () => {
    vi.mocked(api.context.getCurrent)
      .mockResolvedValueOnce({
        userId: 'test',
        setupCompleted: false,
        goals: [], commitments: [], preferences: [],
        calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: ''
      })
      .mockResolvedValueOnce({
        userId: 'test',
        setupCompleted: true,
        goals: [], commitments: [], preferences: [],
        calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
        recentDecisions: [],
        lastUpdated: ''
      });

    renderWithRouter(<HomePage />);
    await screen.findByText(/What are your main priorities right now\?/);

    const skipAllBtn = screen.getByText('Skip for now');
    fireEvent.click(skipAllBtn);

    await waitFor(() => {
      expect(api.context.setup).toHaveBeenCalledWith({});
      expect(api.context.getCurrent).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});
