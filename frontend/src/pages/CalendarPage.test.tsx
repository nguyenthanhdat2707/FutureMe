import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CalendarPage from './CalendarPage';
import { api } from '../api/client';
import { ObservationSource, type CalendarEvent, type PersonalContext } from '../types/domain';

vi.mock('../api/client', () => ({
  api: {
    calendar: {
      getStatus: vi.fn(),
      getEvents: vi.fn(),
      sync: vi.fn(),
    },
    context: {
      getCurrent: vi.fn(),
    },
  },
}));

vi.mock('../hooks/useInterventions', () => ({
  useInterventions: () => ({ intervention: null, refresh: vi.fn(), respond: vi.fn(), dismiss: vi.fn() }),
}));

const localIso = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
};

const calendarEvent = (
  id: string,
  title: string,
  dayOffset: number,
  startHour: number,
  endHour: number,
  category: string,
  meetingLink?: string,
): CalendarEvent => ({
  id,
  title,
  startTime: localIso(dayOffset, startHour),
  endTime: localIso(dayOffset, endHour),
  source: ObservationSource.CALENDAR,
  status: 'CONFIRMED',
  rawData: JSON.stringify({ category, meetingLink }),
});

const context: PersonalContext = {
  userId: 'demo',
  setupCompleted: true,
  goals: [{ id: 'g1', description: 'Ship dashboard', deadline: localIso(2, 17), priority: 'high' }],
  commitments: [{ id: 'c1', description: 'Review demo', startTime: localIso(1, 14), endTime: localIso(1, 15) }],
  preferences: [{ id: 'p1', category: 'focus', description: 'Focus preference', value: 'morning' }],
  calendar: { status: 'synced', lastSync: null, upcomingEvents: 3, busyHoursToday: null, busyHoursThisWeek: null },
  recentDecisions: [],
  lastUpdated: new Date().toISOString(),
};

const events = [
  calendarEvent('focus', 'Future Me MVP', 0, 9, 12, 'deep_work'),
  calendarEvent('meet', 'Team sync', 1, 13, 14, 'meeting', 'https://meet.example.test/team'),
  calendarEvent('rest', 'Run and reflect', 2, 16, 17, 'recovery'),
];

describe('CalendarPage dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.calendar.getStatus).mockResolvedValue({ status: 'synced', lastSync: new Date().toISOString() });
    vi.mocked(api.calendar.getEvents).mockResolvedValue(events);
    vi.mocked(api.context.getCurrent).mockResolvedValue(context);
  });

  it('renders the vertical dashboard, bounded Gantt, and three insight cards', async () => {
    render(<CalendarPage />);

    expect(await screen.findByRole('heading', { name: 'Your Week' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Weekly Gantt calendar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Smart Suggestions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming Deadlines' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Workload Distribution' })).toBeInTheDocument();
    expect(screen.getByText('Future Me MVP')).toBeInTheDocument();
  });

  it('shows at least two explained deterministic suggestions', async () => {
    render(<CalendarPage />);
    const suggestions = await screen.findAllByTestId('smart-suggestion');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Schedule deep work')).toBeInTheDocument();
    expect(screen.getByText('Review commitments')).toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });

  it('shows a meeting link only when rawData includes one', async () => {
    render(<CalendarPage />);
    const join = await screen.findByRole('link', { name: /join team sync/i });
    expect(join).toHaveAttribute('href', 'https://meet.example.test/team');
    expect(screen.queryByRole('link', { name: /join future me mvp/i })).not.toBeInTheDocument();
  });

  it('syncs and reloads all dashboard data', async () => {
    vi.mocked(api.calendar.sync).mockResolvedValue({ success: true, synced: 3, timestamp: new Date().toISOString() });
    render(<CalendarPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sync calendar' }));
    await waitFor(() => expect(api.calendar.sync).toHaveBeenCalledTimes(1));
    expect(api.calendar.getEvents).toHaveBeenCalledTimes(2);
    expect(api.context.getCurrent).toHaveBeenCalledTimes(2);
  });
});
