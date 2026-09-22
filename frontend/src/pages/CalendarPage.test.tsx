import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarPage from './CalendarPage';
import { api } from '../api/client';
import type { ObservationSource } from '../types/domain';

vi.mock('../api/client', () => ({
  api: {
    calendar: {
      getStatus: vi.fn(),
      getEvents: vi.fn(),
      sync: vi.fn(),
    }
  }
}));

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('never-synced state is truthful', async () => {
    vi.mocked(api.calendar.getStatus).mockResolvedValueOnce({
      status: 'never',
      lastSync: null
    });
    vi.mocked(api.calendar.getEvents).mockResolvedValueOnce([]);

    render(<CalendarPage />);

    expect(await screen.findByText(/Connect your calendar to enable smart scheduling/)).toBeInTheDocument();
    expect(screen.getByText('No calendar connected yet. Click Sync to fetch your seeded plans.')).toBeInTheDocument();
  });

  it('seeded sync calls API then shows returned plan events', async () => {
    vi.mocked(api.calendar.getStatus)
      .mockResolvedValueOnce({
        status: 'never',
        lastSync: null
      })
      .mockResolvedValueOnce({
        status: 'synced',
        lastSync: '2023-01-01T00:00:00Z'
      });

    vi.mocked(api.calendar.getEvents)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        id: 'e1',
        title: 'Seeded Meeting',
        startTime: '2023-01-01T10:00:00Z',
        endTime: '2023-01-01T11:00:00Z',
        source: 'CALENDAR' as ObservationSource
      }]);

    render(<CalendarPage />);

    const syncBtn = await screen.findByText('Sync Now');
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(api.calendar.sync).toHaveBeenCalled();
    });

    expect(await screen.findByText('Seeded Meeting')).toBeInTheDocument();
    expect(screen.getByText(/Plan Evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Synced/i)).toBeInTheDocument();
  });

  it('handles sync error appropriately', async () => {
    vi.mocked(api.calendar.getStatus).mockResolvedValueOnce({
      status: 'never',
      lastSync: null
    });
    vi.mocked(api.calendar.getEvents).mockResolvedValueOnce([]);
    vi.mocked(api.calendar.sync).mockRejectedValueOnce(new Error('Network error'));

    render(<CalendarPage />);

    const syncBtn = await screen.findByText('Sync Now');
    fireEvent.click(syncBtn);

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('handles synced-empty state correctly', async () => {
    vi.mocked(api.calendar.getStatus).mockResolvedValueOnce({
      status: 'synced',
      lastSync: '2023-01-01T00:00:00Z'
    });
    vi.mocked(api.calendar.getEvents).mockResolvedValueOnce([]);

    render(<CalendarPage />);

    expect(await screen.findByText('No plans found in calendar.')).toBeInTheDocument();
  });
});
