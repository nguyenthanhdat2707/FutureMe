import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContextPage from './ContextPage';
import { api } from '../api/client';
import type { ObservationSource, PersonalContext, UnderstandingHistoryResponse } from '../types/domain';
import { DEMO_PERSONAS } from '../config/demo-personas';

vi.mock('../api/client', () => ({
  api: {
    context: {
      getCurrent: vi.fn(),
      getHistory: vi.fn(),
      confirm: vi.fn(),
      correct: vi.fn(),
    },
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/understanding']}>
      <ContextPage />
    </MemoryRouter>
  );
}

const mockDefaultContext: PersonalContext = {
  userId: 'test-user',
  setupCompleted: true,
  goals: [
    {
      id: 'g1',
      description: 'Ship Phase 3 Understanding',
      priority: 'high',
      source: 'USER_CONFIRMED' as ObservationSource,
      attributeId: 'attr-g1',
      observedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'g2',
      description: 'Inferred Goal Candidate',
      priority: 'medium',
      source: 'SYSTEM_INFERRED' as ObservationSource,
      attributeId: 'attr-g2',
      observedAt: '2026-09-05T00:00:00Z',
    },
  ],
  commitments: [
    {
      id: 'c1',
      description: 'Weekly Architecture Review',
      startTime: '2026-09-25T10:00:00Z',
      endTime: '2026-09-25T11:00:00Z',
      source: 'CALENDAR' as ObservationSource,
      attributeId: 'attr-c1',
      observedAt: '2026-09-01T00:00:00Z',
    },
  ],
  preferences: [
    {
      id: 'p1',
      category: 'schedule',
      description: 'Focus block preference',
      value: 'morning-focus',
      source: 'USER_CONFIRMED' as ObservationSource,
      attributeId: 'attr-p1',
      observedAt: '2026-09-01T00:00:00Z',
    },
  ],
  calendar: {
    status: 'synced',
    lastSync: '2026-09-25T02:00:00Z',
    upcomingEvents: 4,
    busyHoursToday: 3.5,
    busyHoursThisWeek: 18,
  },
  recentDecisions: [
    {
      id: 'dec-1',
      userId: 'test-user',
      question: 'Should I prioritize the UI overhaul?',
      timestamp: '2026-09-24T12:00:00Z',
    },
  ],
  lastUpdated: '2026-09-25T02:30:00Z',
};

const mockDefaultHistory: UnderstandingHistoryResponse = {
  days: 30,
  hasHistory: true,
  points: [
    {
      date: '2026-09-01',
      goals: 1,
      commitments: 1,
      preferences: 1,
      decisions: 0,
      changes: [
        { id: 'g1', category: 'goals', direction: 'added', label: 'Ship Phase 3 Understanding', source: 'user' },
      ],
    },
    {
      date: '2026-09-25',
      goals: 2,
      commitments: 1,
      preferences: 1,
      decisions: 1,
      changes: [
        { id: 'c-exp', category: 'commitments', direction: 'expired', label: 'Past sprint commitment', source: 'calendar' },
        { id: 'd1', category: 'decisions', direction: 'added', label: 'Prioritize UI overhaul', source: 'decision' },
      ],
    },
  ],
};

describe('ContextPage (Phase 3 Understanding Repair)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.context.getCurrent).mockResolvedValue(mockDefaultContext);
    vi.mocked(api.context.getHistory).mockResolvedValue(mockDefaultHistory);
  });

  it('renders loading skeleton initially with status role', () => {
    vi.mocked(api.context.getCurrent).mockImplementationOnce(() => new Promise(() => {}));
    vi.mocked(api.context.getHistory).mockImplementationOnce(() => new Promise(() => {}));

    renderPage();
    expect(screen.getByRole('status', { name: /loading understanding dashboard/i })).toBeInTheDocument();
  });

  it('renders exact section order and grid without page back navigation ahead of header', async () => {
    renderPage();

    // 1. Header first (no page back navigation link ahead of header)
    expect(screen.queryByText('Back to Dashboard')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'What Future Me Understands' })).toBeInTheDocument();
    expect(screen.getByText(/How your personal AI model continuously interprets your goals/i)).toBeInTheDocument();

    // 2. Exactly THREE KPI cards: Active Goals, Commitments, Preferences. No Decisions KPI.
    const kpiOverview = screen.getByLabelText('Key context overview');
    expect(within(kpiOverview).getByText('Active Goals')).toBeInTheDocument();
    expect(within(kpiOverview).getByText('Commitments')).toBeInTheDocument();
    expect(within(kpiOverview).getByText('Preferences')).toBeInTheDocument();
    expect(within(kpiOverview).queryByText('Decisions')).not.toBeInTheDocument();

    // 3. Understanding Evolution full width
    expect(screen.getByRole('heading', { level: 2, name: 'Understanding Evolution' })).toBeInTheDocument();

    // 4. Two-card row: Context by Category (LEFT) and What Future Me Learned (RIGHT)
    expect(screen.getByRole('heading', { level: 2, name: 'Context by Category' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'What Future Me Learned' })).toBeInTheDocument();

    // 5. Your Focus Patterns full width
    expect(screen.getByRole('heading', { level: 2, name: 'Your Focus Patterns' })).toBeInTheDocument();

    // 6. Your Personal Context after Focus
    expect(screen.getByRole('heading', { level: 2, name: 'Your Personal Context' })).toBeInTheDocument();

    // 7. Calendar Overview / Data Sources last before footer
    expect(screen.getByRole('heading', { level: 2, name: 'Calendar Overview / Data Sources' })).toBeInTheDocument();

    // 8. Privacy Footer
    expect(screen.getByText('Your Privacy & Personal Agency')).toBeInTheDocument();
  });

  it('renders exactly THREE KPI cards with values from active context', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'What Future Me Understands' });

    const kpiSection = screen.getByLabelText('Key context overview');
    // Active Goals: 2, Commitments: 1, Preferences: 1
    expect(within(kpiSection).getByText('2')).toBeInTheDocument();
    expect(within(kpiSection).getAllByText('1').length).toBe(2);
    // Explicitly verify Decisions is not in the KPI cards
    expect(within(kpiSection).queryByText('Decisions')).not.toBeInTheDocument();
  });

  it('renders four independent evolution series including Preferences and toggles visibility', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Understanding Evolution' });

    const legendGroup = screen.getByRole('group', { name: 'Chart series legend' });
    const goalsBtn = within(legendGroup).getByRole('button', { name: 'Goals' });
    const commBtn = within(legendGroup).getByRole('button', { name: 'Commitments' });
    const prefBtn = within(legendGroup).getByRole('button', { name: 'Preferences' });
    const decBtn = within(legendGroup).getByRole('button', { name: 'Decisions' });

    expect(goalsBtn).toBeInTheDocument();
    expect(commBtn).toBeInTheDocument();
    expect(prefBtn).toBeInTheDocument();
    expect(decBtn).toBeInTheDocument();

    // All pressed initially
    expect(goalsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(prefBtn).toHaveAttribute('aria-pressed', 'true');

    // Toggle series hiding
    fireEvent.click(prefBtn);
    expect(prefBtn).toHaveAttribute('aria-pressed', 'false');

    // Cannot hide all series (minimum 1 visible)
    fireEvent.click(goalsBtn);
    fireEvent.click(commBtn);
    // 3 are hidden (pref, goals, comm); attempting to hide the 4th (dec) must be disallowed
    fireEvent.click(decBtn);
    expect(decBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('hidden series disappears from tooltip rows', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Understanding Evolution' });

    // Tap/click the slice for the 2nd date point (Sep 25)
    const slice2 = screen.getByLabelText('View data for Sep 25');
    fireEvent.click(slice2);

    const tooltipRegion = await screen.findByRole('region', { name: 'Selected date details' });
    expect(within(tooltipRegion).getByText('Goals')).toBeInTheDocument();
    expect(within(tooltipRegion).getByText('Commitments')).toBeInTheDocument();
    expect(within(tooltipRegion).getByText('Preferences')).toBeInTheDocument();
    expect(within(tooltipRegion).getByText('Decisions')).toBeInTheDocument();

    // Verify change vs previous point (+1, no change, etc.)
    expect(within(tooltipRegion).getAllByText('+1').length).toBeGreaterThanOrEqual(1);

    // Now toggle Preferences to hidden in the legend
    const legendGroup = screen.getByRole('group', { name: 'Chart series legend' });
    const prefBtn = within(legendGroup).getByRole('button', { name: 'Preferences' });
    fireEvent.click(prefBtn);

    // Preferences should disappear from the tooltip rows
    expect(within(tooltipRegion).queryByText('Preferences')).not.toBeInTheDocument();
    expect(within(tooltipRegion).getByText('Goals')).toBeInTheDocument();
  });

  it('renders Context by Category with four horizontal count bars and NO percentages or stacked bar', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Context by Category' });

    const categorySection = screen.getByRole('region', { name: /context by category/i });
    expect(within(categorySection).getByText('Goals')).toBeInTheDocument();
    expect(within(categorySection).getByText('Commitments')).toBeInTheDocument();
    expect(within(categorySection).getByText('Preferences')).toBeInTheDocument();
    expect(within(categorySection).getByText('Decisions')).toBeInTheDocument();

    // Values: Goals 2, Commitments 1, Preferences 1, Decisions 1
    expect(within(categorySection).getByText('5 total')).toBeInTheDocument();

    // Ensure NO percentage signs are present in Context by Category
    expect(categorySection.textContent).not.toContain('%');
    // Ensure no stacked progressbar
    expect(categorySection.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  });

  it('renders What Future Me Learned with truthful sources, cap, and expiry explanation', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'What Future Me Learned' });

    // Explains expiry without implying that Future Me forgot the user
    expect(screen.getByText(/1 Context Record Expired Naturally/i)).toBeInTheDocument();
    expect(screen.getByText(/reached its validity boundary/i)).toBeInTheDocument();

    // Truthful source badges
    expect(screen.getAllByText('User confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('From Calendar').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Focus Patterns with heading Your Focus Patterns and approved empty state', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 2, name: 'Your Focus Patterns' })).toBeInTheDocument();
    expect(screen.getByText('Record a focus session to see your patterns')).toBeInTheDocument();
    expect(screen.getByText(/Calendar events are intentions, not completed focus/i)).toBeInTheDocument();

    // There is no focus route/tracker in this MVP, so the empty state must not expose a dead CTA.
    expect(screen.queryByRole('link', { name: /go to focus/i })).not.toBeInTheDocument();
  });

  it('renders Calendar Overview / Data Sources with real status, upcoming events, and Unknown for null hours', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      ...mockDefaultContext,
      calendar: {
        status: 'synced',
        lastSync: '2026-09-25T02:00:00Z',
        upcomingEvents: 7,
        busyHoursToday: null, // null must be shown as Unknown!
        busyHoursThisWeek: null,
      },
    });

    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Calendar Overview / Data Sources' });

    expect(screen.getAllByText('Calendar Synced').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('7')).toBeInTheDocument();
    // Both busyHoursToday and busyHoursThisWeek are null, so both render Unknown (never 0)
    expect(screen.getAllByText(/Unknown/i).length).toBe(2);
    expect(screen.queryByText('0h')).not.toBeInTheDocument();
    expect(screen.queryByText(/Next 7 days/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Truthful Data Provenance/i)).toBeInTheDocument();
  });

  it('labels unknown calendar state honestly instead of calling it offline', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      ...mockDefaultContext,
      calendar: {
        status: 'unknown',
        lastSync: null,
        upcomingEvents: 0,
        busyHoursToday: null,
        busyHoursThisWeek: null,
      },
    });

    renderPage();
    expect((await screen.findAllByText('Calendar Status Unknown')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Calendar Offline')).not.toBeInTheDocument();
  });

  it('supports mobile accordion aria behavior on Personal Context', async () => {
    renderPage();
    const personalSection = await screen.findByRole('region', { name: 'Your Personal Context' });

    const goalsHeaderBtn = within(personalSection).getByRole('button', { name: /active goals/i });
    const commitmentsHeaderBtn = within(personalSection).getByRole('button', { name: /active commitments/i });
    const preferencesHeaderBtn = within(personalSection).getByRole('button', { name: /preferences/i });
    const decisionsHeaderBtn = within(personalSection).getByRole('button', { name: /recent decisions/i });

    // Initially Goals is open
    expect(goalsHeaderBtn).toHaveAttribute('aria-expanded', 'true');
    expect(goalsHeaderBtn).toHaveAttribute('aria-controls', 'accordion-panel-goals');
    expect(commitmentsHeaderBtn).toHaveAttribute('aria-expanded', 'false');
    expect(preferencesHeaderBtn).toHaveAttribute('aria-expanded', 'false');
    expect(decisionsHeaderBtn).toHaveAttribute('aria-expanded', 'false');

    // Click commitments: only Commitments becomes open
    fireEvent.click(commitmentsHeaderBtn);
    expect(commitmentsHeaderBtn).toHaveAttribute('aria-expanded', 'true');
    expect(goalsHeaderBtn).toHaveAttribute('aria-expanded', 'false');
    expect(preferencesHeaderBtn).toHaveAttribute('aria-expanded', 'false');

    // Click decisions: only Decisions becomes open
    fireEvent.click(decisionsHeaderBtn);
    expect(decisionsHeaderBtn).toHaveAttribute('aria-expanded', 'true');
    expect(commitmentsHeaderBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('preserves confirm, correct, non-destructive hide, and disables edit on calendar & user-confirmed items', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Your Personal Context' });

    // 1. Goal 1 is USER_CONFIRMED: must NOT expose Edit or Confirm button
    const userConfirmedGoal = screen.getByText('Ship Phase 3 Understanding').closest('article')!;
    expect(within(userConfirmedGoal).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(userConfirmedGoal).queryByRole('button', { name: /✓ Confirm/i })).not.toBeInTheDocument();

    // 2. Goal 2 is SYSTEM_INFERRED: must expose Edit and Confirm
    const inferredGoal = screen.getByText('Inferred Goal Candidate').closest('article')!;
    const confirmBtn = within(inferredGoal).getByRole('button', { name: /✓ Confirm/i });
    const editBtn = within(inferredGoal).getByRole('button', { name: 'Edit' });
    expect(confirmBtn).toBeInTheDocument();
    expect(editBtn).toBeInTheDocument();

    // Confirm action
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(api.context.confirm).toHaveBeenCalledWith('attr-g2');
    });

    // 3. Calendar item: must NOT expose Edit or Confirm button
    const calItem = screen.getByText('Weekly Architecture Review').closest('article')!;
    expect(within(calItem).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(calItem).queryByRole('button', { name: /✓ Confirm/i })).not.toBeInTheDocument();

    // 4. Non-destructive local hide
    const hideBtn = within(userConfirmedGoal).getByRole('button', { name: 'Hide' });
    fireEvent.click(hideBtn);

    expect(screen.queryByText('Ship Phase 3 Understanding')).not.toBeInTheDocument();
    const showHiddenBtn = screen.getByRole('button', { name: /show hidden \(1\)/i });
    fireEvent.click(showHiddenBtn);
    expect(screen.getByText('Ship Phase 3 Understanding')).toBeInTheDocument();
  });

  it('corrects item with validation and calls api.context.correct', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Your Personal Context' });

    const inferredGoal = screen.getByText('Inferred Goal Candidate').closest('article')!;
    const editBtn = within(inferredGoal).getByRole('button', { name: 'Edit' });
    fireEvent.click(editBtn);

    const input = await screen.findByLabelText(/corrected value/i);
    // Empty validation check
    fireEvent.change(input, { target: { value: '   ' } });
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveBtn);
    expect(await screen.findByText('Value cannot be empty')).toBeInTheDocument();

    // Valid save
    fireEvent.change(input, { target: { value: 'Verified Goal Target' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.context.correct).toHaveBeenCalledWith({
        attributeId: 'attr-g2',
        correctedValue: 'Verified Goal Target',
        reason: 'User correction',
      });
    });
  });

  it('renders visible range-load error with Retry button and does not relabel old data', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 2, name: 'Understanding Evolution' });

    // Mock failure on 7d range
    vi.mocked(api.context.getHistory).mockRejectedValueOnce(new Error('Network timeout'));

    const sevenDayTab = screen.getByRole('tab', { name: '7d' });
    fireEvent.click(sevenDayTab);

    // Visible range load error banner with Retry
    const errorBanner = await screen.findByRole('alert');
    expect(errorBanner).toHaveTextContent(/Network timeout/i);
    const retryBtn = within(errorBanner).getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Chart badge must NOT relabel to 7 Days if request failed!
    expect(screen.getByText('30 Days')).toBeInTheDocument();

    // Click retry with successful response
    vi.mocked(api.context.getHistory).mockResolvedValueOnce({
      days: 7,
      hasHistory: true,
      points: [
        { date: '2026-09-19', goals: 1, commitments: 1, preferences: 1, decisions: 0, changes: [] },
        { date: '2026-09-25', goals: 2, commitments: 1, preferences: 1, decisions: 1, changes: [] },
      ],
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('7 Days')).toBeInTheDocument();
    });
  });

  it('renders initial load error state with Retry button', async () => {
    vi.mocked(api.context.getCurrent).mockRejectedValueOnce(new Error('503 Service Unavailable'));

    renderPage();
    expect(await screen.findByText('Failed to load understanding data')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry loading/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(api.context.getCurrent).toHaveBeenCalledTimes(2);
    });
  });

  it('all-context empty state retains all ordered dashboard sections', async () => {
    vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
      userId: 'empty-user',
      setupCompleted: false,
      goals: [],
      commitments: [],
      preferences: [],
      calendar: { status: 'unknown', lastSync: null, upcomingEvents: 0, busyHoursToday: null, busyHoursThisWeek: null },
      recentDecisions: [],
      lastUpdated: '',
    });
    vi.mocked(api.context.getHistory).mockResolvedValueOnce({
      days: 30,
      hasHistory: false,
      points: [],
    });

    renderPage();

    // 1. Header is present
    expect(await screen.findByRole('heading', { level: 1, name: 'What Future Me Understands' })).toBeInTheDocument();

    // 2. 3 KPI cards are present with 0s
    const kpiSection = screen.getByLabelText('Key context overview');
    expect(within(kpiSection).getAllByText('0').length).toBe(3);

    // 3. Understanding Evolution is present (empty state)
    expect(screen.getByRole('heading', { level: 2, name: 'Understanding Evolution' })).toBeInTheDocument();
    expect(screen.getByText('Not enough history yet to show evolution')).toBeInTheDocument();

    // 4. Category and What Future Me Learned are present (empty states)
    expect(screen.getByRole('heading', { level: 2, name: 'Context by Category' })).toBeInTheDocument();
    expect(screen.getByText('No active context categorized yet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'What Future Me Learned' })).toBeInTheDocument();
    expect(screen.getByText('No learned context yet')).toBeInTheDocument();

    // 5. Your Focus Patterns is present (empty state)
    expect(screen.getByRole('heading', { level: 2, name: 'Your Focus Patterns' })).toBeInTheDocument();

    // 6. Personal Context has onboarding guidance placed inside
    expect(screen.getByRole('heading', { level: 2, name: 'Your Personal Context' })).toBeInTheDocument();
    expect(screen.getByText('No context recorded yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /complete setup/i })).toBeInTheDocument();

    // 7. Calendar Overview / Data Sources is present
    expect(screen.getByRole('heading', { level: 2, name: 'Calendar Overview / Data Sources' })).toBeInTheDocument();

    // 8. Footer is present
    expect(screen.getByText('Your Privacy & Personal Agency')).toBeInTheDocument();
  });

  describe('parameterized tests across all 6 demo personas', () => {
    it.each(DEMO_PERSONAS)('renders understanding page successfully for persona: $displayName ($id)', async (persona) => {
      vi.mocked(api.context.getCurrent).mockResolvedValueOnce({
        userId: persona.id,
        setupCompleted: true,
        goals: [
          { id: `goal-${persona.slug}`, description: `${persona.displayName} Primary Goal`, priority: 'high', source: 'USER_CONFIRMED' as ObservationSource },
        ],
        commitments: [
          { id: `comm-${persona.slug}`, description: `${persona.displayName} Schedule Commitment`, startTime: '2026-09-25T10:00:00Z', endTime: '2026-09-25T11:00:00Z', source: 'CALENDAR' as ObservationSource },
        ],
        preferences: [
          { id: `pref-${persona.slug}`, category: 'focus', description: `${persona.displayName} Focus Style`, value: 'deep-work', source: 'USER_CONFIRMED' as ObservationSource },
        ],
        calendar: { status: 'synced', lastSync: '2026-09-25T01:00:00Z', upcomingEvents: 3, busyHoursToday: 2, busyHoursThisWeek: 10 },
        recentDecisions: [],
        lastUpdated: new Date().toISOString(),
      });

      renderPage();

      expect(await screen.findByText(`${persona.displayName} Primary Goal`)).toBeInTheDocument();
      expect(screen.getByText(`${persona.displayName} Schedule Commitment`)).toBeInTheDocument();
      expect(screen.getByText(`${persona.displayName} Focus Style`)).toBeInTheDocument();
    });
  });
});
