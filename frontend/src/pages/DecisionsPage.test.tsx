import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  createDemoWorldBaseline,
  demoWorldReducer,
  DEMO_WORLD_STORAGE_KEY,
  DemoWorldProvider,
  MENTORING_PROMPT,
  useDemoWorld,
  type DemoWorldAction,
} from '../demo-world';
import DecisionsPage from './DecisionsPage';

const EXPECTED_OUTCOME = 'I want to contribute meaningfully, even if my involvement is limited.';
const FLEXIBILITY = 'The scope and schedule can be adjusted.';
const FLEXIBLE_TEAM = 'They are flexible — choose the best fit';

function ResetControl() {
  const { resetDemo } = useDemoWorld();
  return <button onClick={resetDemo}>Reset fixture</button>;
}

function renderPage(withReset = false) {
  return render(
    <MemoryRouter>
      <DemoWorldProvider>
        {withReset && <ResetControl />}
        <DecisionsPage />
      </DemoWorldProvider>
    </MemoryRouter>,
  );
}

function startDecision() {
  fireEvent.change(screen.getByLabelText('What decision do you need help with?'), {
    target: { value: MENTORING_PROMPT },
  });
  fireEvent.click(screen.getByRole('button', { name: 'High' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ask Future Me' }));
}

function answerCanonicalClarifications() {
  fireEvent.click(screen.getByRole('button', { name: EXPECTED_OUTCOME }));
  fireEvent.click(screen.getByRole('button', { name: FLEXIBILITY }));
}

function reachPlanPreview() {
  startDecision();
  answerCanonicalClarifications();
  fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
  fireEvent.click(screen.getByRole('button', { name: FLEXIBLE_TEAM }));
}

describe('DecisionsPage Scenario A', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('asks exactly two material clarifications sequentially and supports Something else', () => {
    renderPage();
    startDecision();

    expect(screen.getByRole('heading', { name: 'Expected Outcome' })).toBeInTheDocument();
    expect(screen.getByText('What matters most to you about this opportunity?')).toBeInTheDocument();
    expect(screen.queryByText('How flexible is the mentoring commitment?')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Something else...' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Something else...' }));
    fireEvent.change(screen.getByLabelText('Your expected outcome'), {
      target: { value: 'I can contribute through one high-impact session.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: 'Commitment Flexibility' })).toBeInTheDocument();
    expect(screen.getByText('How flexible is the mentoring commitment?')).toBeInTheDocument();
    expect(screen.queryByText('What matters most to you about this opportunity?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: FLEXIBILITY }));
    expect(screen.queryByRole('heading', { name: 'Expected Outcome' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Commitment Flexibility' })).not.toBeInTheDocument();
  });

  it('shows exactly three alternatives, recommends Strong Fit, and hides scheduling until Use this plan', () => {
    renderPage();
    startDecision();
    answerCanonicalClarifications();

    const alternatives = screen.getByTestId('decision-alternatives');
    expect(within(alternatives).getAllByRole('article')).toHaveLength(3);
    expect(within(alternatives).getByRole('heading', { name: 'Reject' })).toBeInTheDocument();
    expect(within(alternatives).getByRole('heading', { name: 'Full two-week mentoring' })).toBeInTheDocument();
    expect(within(alternatives).getByRole('heading', { name: 'Focused Mentoring Session' })).toBeInTheDocument();
    expect(within(alternatives).getByText('Strong Fit')).toBeInTheDocument();
    expect(within(alternatives).getByText('Recommended')).toBeInTheDocument();
    expect(screen.queryByText('When could the student team attend the focused session?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
    expect(screen.getByText('When could the student team attend the focused session?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thursday afternoon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Friday afternoon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: FLEXIBLE_TEAM })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Another time...' })).toBeInTheDocument();
  });

  it('shows a reversible Before / After preview and applies only after explicit confirmation', () => {
    renderPage();
    reachPlanPreview();

    const before = screen.getByRole('heading', { name: 'Before' }).closest('section')!;
    const after = screen.getByRole('heading', { name: 'After' }).closest('section')!;
    const scheduleRows = (section: HTMLElement) =>
      within(section)
        .getAllByRole('listitem')
        .map((row) => row.textContent?.replace(/(Fixed|Flexible|Consolidated|Relocated|Inserted)$/, ''));

    expect(within(before).getByText('Teaching remains fixed and protected.')).toBeInTheDocument();
    expect(within(before).getAllByRole('heading', { name: 'Tuesday, October 13' })).toHaveLength(1);
    expect(within(before).getAllByRole('heading', { name: 'Friday, October 16' })).toHaveLength(1);
    expect(scheduleRows(before)).toEqual([
      '14:00–15:00 · Teaching Preparation',
      '15:00–16:00 · Low-focus spare capacity',
      '08:00–11:00 · Teaching',
      '11:00–13:00 · Lunch / Recovery',
      '13:00–14:00 · Monthly Report',
      '14:00–15:00 · Flexible Work',
      '15:00–16:00 · Weekly Planning',
      '16:00–17:00 · Buffer / Flexible Capacity',
    ]);
    expect(within(before).getByText('Fixed')).toBeInTheDocument();

    expect(scheduleRows(after)).toEqual([
      '14:00–15:00 · Teaching Preparation',
      '15:00–16:00 · Weekly Planning — moved from Friday',
      '08:00–11:00 · Teaching + Monthly Report — Consolidated Morning Block',
      '11:00–13:00 · Lunch / Recovery',
      '13:00–13:30 · Mentoring Preparation',
      '13:30–15:00 · Focused Mentoring Session',
      '15:00–16:00 · Buffer / Recovery',
      '16:00–17:00 · Flexible Work',
    ]);
    ['Flexible', 'Consolidated', 'Relocated'].forEach((label) =>
      expect(within(after).getByText(label)).toBeInTheDocument(),
    );
    expect(within(after).getAllByText('Inserted')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Why this plan works' })).toBeInTheDocument();
    expect(screen.getByText('Review the proposed changes. Nothing is applied until you confirm.')).toBeInTheDocument();
    expect(screen.queryByText('Plan applied')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply Plan' }));
    expect(screen.getByText('Plan applied')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Calendar' })).toHaveAttribute('href', '/calendar');
    expect(screen.getByRole('link', { name: 'View Tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'View History' })).toHaveAttribute('href', '/history');
  });

  it('builds the canonical plan for Friday afternoon and records the selected availability', () => {
    renderPage();
    startDecision();
    answerCanonicalClarifications();
    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Friday afternoon' }));

    expect(screen.getByRole('heading', { name: 'Before' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm & Apply Plan' })).toBeInTheDocument();
    expect(localStorage.getItem(DEMO_WORLD_STORAGE_KEY)).toContain('"availability":"friday-afternoon"');
  });

  it('keeps Thursday and another-time honest and non-mutating', () => {
    renderPage();
    startDecision();
    answerCanonicalClarifications();
    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));

    fireEvent.click(screen.getByRole('button', { name: 'Thursday afternoon' }));
    expect(screen.getByText(/Thursday afternoon is not compatible.*Choose “They are flexible/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Another time...' }));
    expect(screen.queryByRole('button', { name: 'Build plan' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Another time'), { target: { value: 'Wednesday at 10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record availability' }));
    expect(screen.getByText(/Availability noted: Wednesday at 10:00.*Choose “They are flexible/i)).toBeInTheDocument();
    expect(screen.getByText('When could the student team attend the focused session?')).toBeInTheDocument();
    expect(localStorage.getItem(DEMO_WORLD_STORAGE_KEY)).not.toContain('"activePlan"');
  });

  it('builds the approved preview when the team is flexible', () => {
    renderPage();
    startDecision();
    answerCanonicalClarifications();
    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
    fireEvent.click(screen.getByRole('button', { name: FLEXIBLE_TEAM }));
    expect(screen.getByRole('heading', { name: 'Before' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm & Apply Plan' })).toBeInTheDocument();
  });

  it('clears mounted local question, priority, and error when the shared world resets', () => {
    renderPage(true);
    const question = screen.getByLabelText('What decision do you need help with?');
    fireEvent.change(question, { target: { value: 'A local draft question' } });
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask Future Me' }));
    expect(screen.getByText(/Use the Scenario A mentoring question/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset fixture' }));
    expect(screen.getByLabelText('What decision do you need help with?')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'High' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/Use the Scenario A mentoring question/i)).not.toBeInTheDocument();
  });

  it('records the exact completion reflection and restores completed state from persistence', () => {
    const first = renderPage();
    reachPlanPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply Plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark mentoring complete' }));

    expect(screen.getByText('Mentoring completed')).toBeInTheDocument();
    expect(screen.getByText(/Estimated preparation: 30–45 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/Actual preparation: 75 minutes/)).toBeInTheDocument();
    expect(screen.getByText('Similar mentoring commitments have required more preparation than previously expected.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Understanding' })).toHaveAttribute('href', '/understanding');

    expect(localStorage.getItem(DEMO_WORLD_STORAGE_KEY)).toContain('"stage":"completed"');
    first.unmount();
    renderPage();
    expect(screen.getByText('Mentoring completed')).toBeInTheDocument();
    expect(screen.getByText(/Actual preparation: 75 minutes/)).toBeInTheDocument();
  });

  it('renders a corrected completed outcome and learned signal from shared state', () => {
    let world = createDemoWorldBaseline();
    const actions: DemoWorldAction[] = [
      { type:'start-mentoring-decision' },
      { type:'answer-expected-outcome', answer:EXPECTED_OUTCOME },
      { type:'answer-commitment-flexibility', answer:FLEXIBILITY },
      { type:'use-mentoring-plan' },
      { type:'set-team-availability', availability:'flexible-best-fit' },
      { type:'apply-active-plan' },
      { type:'complete-mentoring-with-reflection', actualPreparationMinutes:75 },
      { type:'correct-mentoring-preparation', actualPreparationMinutes:40 },
    ];
    world = actions.reduce(demoWorldReducer, world);
    localStorage.setItem(DEMO_WORLD_STORAGE_KEY, JSON.stringify(world));

    renderPage();
    expect(screen.getByText(/Actual preparation: 40 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/stayed within the estimated 30–45 minute preparation range/i)).toBeInTheDocument();
    expect(screen.queryByText(/more preparation than previously expected/i)).not.toBeInTheDocument();
  });

  it.each([
    [['start-mentoring-decision'], 'Expected Outcome'],
    [['start-mentoring-decision', 'answer-expected-outcome'], 'Commitment Flexibility'],
    [['start-mentoring-decision', 'answer-expected-outcome', 'answer-commitment-flexibility'], 'Use this plan'],
    [['start-mentoring-decision', 'answer-expected-outcome', 'answer-commitment-flexibility', 'use-mentoring-plan'], 'When could the student team attend the focused session?'],
    [['start-mentoring-decision', 'answer-expected-outcome', 'answer-commitment-flexibility', 'use-mentoring-plan', 'set-team-availability'], 'Confirm & Apply Plan'],
    [['start-mentoring-decision', 'answer-expected-outcome', 'answer-commitment-flexibility', 'use-mentoring-plan', 'set-team-availability', 'apply-active-plan'], 'Plan applied'],
    [['start-mentoring-decision', 'answer-expected-outcome', 'answer-commitment-flexibility', 'use-mentoring-plan', 'set-team-availability', 'apply-active-plan', 'complete-mentoring-with-reflection'], 'Mentoring completed'],
  ] as const)('recovers the persisted %s stage', (actionTypes, visibleCopy) => {
    const actions: Record<string, DemoWorldAction> = {
      'start-mentoring-decision': { type: 'start-mentoring-decision' },
      'answer-expected-outcome': { type: 'answer-expected-outcome', answer: EXPECTED_OUTCOME },
      'answer-commitment-flexibility': { type: 'answer-commitment-flexibility', answer: FLEXIBILITY },
      'use-mentoring-plan': { type: 'use-mentoring-plan' },
      'set-team-availability': { type: 'set-team-availability', availability: 'flexible-best-fit' },
      'apply-active-plan': { type: 'apply-active-plan' },
      'complete-mentoring-with-reflection': { type: 'complete-mentoring-with-reflection', actualPreparationMinutes: 75 },
    };
    const world = actionTypes.reduce(
      (current, actionType) => demoWorldReducer(current, actions[actionType]),
      createDemoWorldBaseline(),
    );
    localStorage.setItem(DEMO_WORLD_STORAGE_KEY, JSON.stringify(world));

    renderPage();
    expect(screen.getByText(visibleCopy, { exact: false })).toBeInTheDocument();
  });
});
