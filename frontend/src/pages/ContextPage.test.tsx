import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContextPage from './ContextPage';
import { api } from '../api/client';
import type { ObservationSource } from '../types/domain';

vi.mock('../api/client', () => ({
  api: {
    context: {
      getCurrent: vi.fn(),
      confirm: vi.fn(),
      correct: vi.fn(),
    }
  }
}));

describe('ContextPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null busy hours as Unknown and shows calendar status', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      userId: 'test',
      setupCompleted: true,
      goals: [], commitments: [], preferences: [],
      calendar: { status: 'synced', lastSync: '2023-01-01T00:00:00Z', upcomingEvents: 5, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: ''
    });

    render(<ContextPage />);

    // Calendar overview
    expect(await screen.findByText('Calendar Overview')).toBeInTheDocument();

    // Status
    expect(screen.getByText(/synced/i)).toBeInTheDocument();

    // Null busy hours should be 'Unknown'
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBe(2);

    // Should not say free or available
    expect(screen.queryByText(/free/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/available/i)).not.toBeInTheDocument();
  });

  it('shows freshness and does not show edit for CALENDAR commitments', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      userId: 'test',
      setupCompleted: true,
      goals: [],
      commitments: [{
        id: 'c1',
        description: 'Meeting',
        startTime: '2023-01-01',
        endTime: '2023-01-01',
        source: 'CALENDAR' as ObservationSource,
        attributeId: 'attr1',
        observedAt: '2023-01-01T00:00:00Z',
      }],
      preferences: [],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: ''
    });

    render(<ContextPage />);

    expect(await screen.findByText('Meeting')).toBeInTheDocument();
    expect(screen.getByText(/Observed:/)).toBeInTheDocument();

    // Ensure no Edit/Confirm buttons for this CALENDAR commitment
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('✓ Confirm')).not.toBeInTheDocument();
  });

  it('allows edit/confirm for inferred context', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValue({
      userId: 'test',
      setupCompleted: true,
      goals: [{
        id: 'g1',
        description: 'Learn',
        priority: 'high',
        source: 'SYSTEM_INFERRED' as ObservationSource,
        attributeId: 'attr2'
      }],
      commitments: [],
      preferences: [],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: ''
    });

    render(<ContextPage />);

    const editBtn = await screen.findByText('Edit');
    const confirmBtn = await screen.findByText('✓ Confirm');

    expect(editBtn).toBeInTheDocument();
    expect(confirmBtn).toBeInTheDocument();

    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(api.context.confirm).toHaveBeenCalledWith('attr2');
      expect(api.context.getCurrent).toHaveBeenCalledTimes(2);
    });
  });

  it('allows correcting inferred context', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValue({
      userId: 'test',
      setupCompleted: true,
      goals: [{
        id: 'g2',
        description: 'Read a book',
        priority: 'high',
        source: 'SYSTEM_INFERRED' as ObservationSource,
        attributeId: 'attr3'
      }],
      commitments: [],
      preferences: [],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: ''
    });

    render(<ContextPage />);

    const editBtn = await screen.findByText('Edit');
    fireEvent.click(editBtn);

    const input = await screen.findByDisplayValue('Read a book');
    fireEvent.change(input, { target: { value: 'Write a book' } });

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.context.correct).toHaveBeenCalledWith(expect.objectContaining({
        attributeId: 'attr3',
        correctedValue: 'Write a book'
      }));
      expect(api.context.getCurrent).toHaveBeenCalledTimes(2); // Initial + reload
    });
  });

  it('sends JSON value patch when correcting a preference and reloads', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValue({
      userId: 'test',
      setupCompleted: true,
      goals: [],
      commitments: [],
      preferences: [{
        id: 'p1',
        category: 'work_hours',
        description: 'Focus hours',
        value: 'morning',
        source: 'SYSTEM_INFERRED' as ObservationSource,
        attributeId: 'pref-attr-1'
      }],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: ''
    });

    render(<ContextPage />);

    const editBtn = await screen.findByText('Edit');
    fireEvent.click(editBtn);

    const input = await screen.findByDisplayValue('morning');
    fireEvent.change(input, { target: { value: 'afternoon' } });

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.context.correct).toHaveBeenCalledWith({
        attributeId: 'pref-attr-1',
        correctedValue: JSON.stringify({ value: 'afternoon' }),
        reason: 'User correction'
      });
      expect(api.context.getCurrent).toHaveBeenCalledTimes(2);
    });
  });
});
