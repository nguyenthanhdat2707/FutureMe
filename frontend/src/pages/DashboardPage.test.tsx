import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../api/client';
import { ObservationSource, type CalendarEvent, type PersonalContext } from '../types/domain';
import DashboardPage from './DashboardPage';

vi.mock('../api/client', () => ({
  api: {
    calendar: { getStatus: vi.fn(), getEvents: vi.fn(), sync: vi.fn() },
    context: { getCurrent: vi.fn() },
  },
}));

vi.mock('../hooks/useInterventions', () => ({
  useInterventions: () => ({
    intervention: null,
    error: null,
    refresh: vi.fn(),
    respond: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const event = (
  id: string,
  title: string,
  day: number,
  startHour: number,
  endHour: number,
  category: string,
  meetingLink?: string,
): CalendarEvent => ({
  id,
  title,
  startTime: new Date(2026, 8, day, startHour).toISOString(),
  endTime: new Date(2026, 8, day, endHour).toISOString(),
  source: ObservationSource.CALENDAR,
  status: 'CONFIRMED',
  rawData: JSON.stringify({ category, meetingLink }),
});

const events = [
  event('focus', 'Deep Work — Future Me MVP', 24, 9, 12, 'deep_work'),
  event('meeting', 'CloudThinker sync', 25, 14, 15, 'meeting', 'https://meet.google.com/future-me'),
  event('personal', 'Run & reflect', 26, 16, 17, 'recovery'),
];

const context: PersonalContext = {
  userId: 'demo-user',
  setupCompleted: true,
  goals: [{ id: 'goal-1', description: 'Ship dashboard', deadline: new Date(2026, 8, 26, 17).toISOString(), priority: 'high' }],
  commitments: [],
  preferences: [{ id: 'preference-1', category: 'focus', description: 'Deep work', value: 'morning' }],
  calendar: { status: 'synced', lastSync: null, upcomingEvents: 3, busyHoursToday: null, busyHoursThisWeek: null },
  recentDecisions: [],
  lastUpdated: new Date(2026, 8, 24).toISOString(),
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 24, 10));
    vi.clearAllMocks();
    vi.mocked(api.calendar.getStatus).mockResolvedValue({ status: 'synced', lastSync: null });
    vi.mocked(api.calendar.getEvents).mockResolvedValue(events);
    vi.mocked(api.calendar.sync).mockResolvedValue({ success: true, synced: 3, timestamp: new Date().toISOString() });
    vi.mocked(api.context.getCurrent).mockResolvedValue(context);
  });

  afterEach(() => vi.useRealTimers());

  const renderPage = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>);

  it('renders the approved hierarchy and exactly three duration bubbles', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Plan your week with more clarity.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your week at a glance.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deadlines' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Task type' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming & Suggestions' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /percent, .* hours/i })).toHaveLength(3);
  });

  it('opens event details, exposes a valid meeting link, and highlights a selected category', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Plan your week with more clarity.' });

    fireEvent.click(screen.getAllByRole('button', { name: /CloudThinker sync/i })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join meeting' })).toHaveAttribute('href', 'https://meet.google.com/future-me');
    fireEvent.click(screen.getByRole('button', { name: 'Close event details' }));

    const meetingBubble = screen.getByRole('button', { name: /Meetings, .* percent/i });
    fireEvent.click(meetingBubble);
    expect(meetingBubble).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Highlighting Meetings events')).toBeInTheDocument();
  });

  it('syncs and reloads dashboard data', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Plan your week with more clarity.' });
    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }));

    await waitFor(() => expect(api.calendar.sync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(api.calendar.getEvents).toHaveBeenCalledTimes(2));
  });
});
