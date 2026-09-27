import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  MENTORING_PROMPT,
  selectMentoringAlternatives,
  useDemoWorld,
  type Clarification,
  type Fit,
  type PlanProposal,
} from '../demo-world';

const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const optionClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400';

const fitLabels: Record<Fit, string> = {
  'very-strong': 'Very Strong Fit',
  strong: 'Strong Fit',
  moderate: 'Moderate Fit',
  conditional: 'Conditional Fit',
  weak: 'Weak Fit',
  poor: 'Poor Fit',
};

const teamAvailability: Array<{ value: PlanProposal['availability']; label: string }> = [
  { value: 'thursday-afternoon', label: 'Thursday afternoon' },
  { value: 'friday-afternoon', label: 'Friday afternoon' },
  { value: 'flexible-best-fit', label: 'They are flexible — choose the best fit' },
  { value: 'another-time', label: 'Another time...' },
];

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">{children}</p>;
}

function ClarificationCard({
  clarification,
  onAnswer,
}: {
  clarification: Clarification;
  onAnswer: (answer: string) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customAnswer, setCustomAnswer] = useState('');

  return (
    <section className={cardClass + ' max-w-3xl p-6'}>
      <SectionLabel>One thing I need to understand</SectionLabel>
      <h2 className="text-xl font-semibold text-slate-950">{clarification.label}</h2>
      <p className="mt-2 text-base text-slate-600">{clarification.question}</p>
      <div className="mt-5 grid gap-2">
        {clarification.options.map((option) => (
          <button
            className={optionClass}
            key={option.id}
            type="button"
            onClick={() => {
              if (option.id === 'something-else') setCustomOpen(true);
              else onAnswer(option.label);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {customOpen && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <label className="text-sm font-semibold text-slate-800">
            Your {clarification.label.toLowerCase()}
            <input
              autoFocus
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={customAnswer}
              onChange={(event) => setCustomAnswer(event.target.value)}
            />
          </label>
          <button
            className="mt-3 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!customAnswer.trim()}
            type="button"
            onClick={() => onAnswer(customAnswer.trim())}
          >
            Continue
          </button>
        </div>
      )}
    </section>
  );
}

function RelevantContext() {
  const { world } = useDemoWorld();
  const restructured = world.capacityProfile.projection === 'limited-restructured';
  const signals = [
    ['Workload', 'High across the next two weeks'],
    ['Capacity', restructured ? 'Restructured around fixed anchors, with recovery protected' : 'Limited, with recovery time protected'],
    ['Commitments', 'Teaching and hard deadlines are fixed'],
    ['Goal alignment', 'Mentoring supports long-term advisory direction'],
    ['History', 'Bounded advisory work fits better than open-ended commitments'],
    ['Priority', 'High'],
  ];

  return (
    <section className={cardClass + ' p-6'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Relevant context</SectionLabel>
          <h2 className="text-lg font-semibold text-slate-950">What I already know</h2>
        </div>
        <Link className="text-sm font-semibold text-violet-700 hover:text-violet-900" to="/understanding">
          View Full Context
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {signals.map(([label, value]) => (
          <div className="rounded-xl bg-slate-50 p-3" key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Recommendation() {
  const { world, dispatch } = useDemoWorld();
  const alternatives = selectMentoringAlternatives(world);
  const clarifications = world.activeDecision?.clarifications ?? [];
  const focusedRecommended = alternatives.find((item) => item.id === 'focused-session')?.recommended === true;

  return (
    <section>
      <div className="mb-5 max-w-3xl">
        <SectionLabel>Recommendation</SectionLabel>
        <h2 className="text-2xl font-semibold text-slate-950">{focusedRecommended ? 'Contribute meaningfully without taking on sustained load.' : 'Do not take the full commitment now.'}</h2>
        <p className="mt-2 text-slate-600">
          {focusedRecommended ? 'Your workload is high and capacity is limited, while mentoring strongly supports your goals. Your answers show that meaningful contribution matters and the scope can be adjusted.' : 'The required level of involvement cannot be reduced enough to fit the current workload, deadlines, and protected recovery time.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {clarifications.filter((item) => item.answer).map((item) => (
            <span className="rounded-full bg-slate-100 px-3 py-1" key={item.id}>
              {item.label}: {item.answer}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3" data-testid="decision-alternatives">
        {alternatives.map((alternative) => (
          <article
            className={
              cardClass +
              ' relative flex min-h-64 flex-col p-5 ' +
              (alternative.recommended ? 'border-violet-400 ring-2 ring-violet-100' : '')
            }
            key={alternative.id}
          >
            {alternative.recommended && (
              <span className="absolute right-4 top-4 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">
                Recommended
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{fitLabels[alternative.fit]}</p>
            <h3 className="mt-2 pr-24 text-lg font-semibold text-slate-950">{alternative.title}</h3>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">Benefits</p>
            <ul className="mt-1 space-y-1 text-sm text-slate-600">
              {alternative.benefits.map((benefit) => <li key={benefit}>• {benefit}</li>)}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-700">Trade-offs</p>
            <ul className="mt-1 space-y-1 text-sm text-slate-600">
              {alternative.tradeoffs.map((tradeoff) => <li key={tradeoff}>• {tradeoff}</li>)}
            </ul>
            {alternative.id === 'focused-session' && alternative.recommended && world.activeDecision?.stage === 'recommendation' && (
              <button
                className="mt-auto rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800"
                type="button"
                onClick={() => dispatch({ type: 'use-mentoring-plan' })}
              >
                Use this plan
              </button>
            )}
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Evidence: current workload, two-week capacity, protected commitments, long-term goals, prior preferences, and
        your two clarifications.
      </p>
    </section>
  );
}

function TeamAvailability() {
  const { dispatch } = useDemoWorld();
  const [customOpen, setCustomOpen] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');

  return (
    <section className={cardClass + ' max-w-3xl p-6'}>
      <SectionLabel>Execution detail</SectionLabel>
      <h2 className="text-xl font-semibold text-slate-950">When could the student team attend the focused session?</h2>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {teamAvailability.map((option) => (
          <button
            className={optionClass}
            key={option.value}
            type="button"
            onClick={() => {
              setAvailabilityNote('');
              if (option.value === 'another-time') setCustomOpen(true);
              else if (option.value === 'flexible-best-fit' || option.value === 'friday-afternoon') dispatch({ type: 'set-team-availability', availability: option.value });
              else {
                setCustomOpen(false);
                setAvailabilityNote(`${option.label} is not compatible with the approved consolidation and relocation. Choose “They are flexible — choose the best fit” to build the approved plan.`);
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {customOpen && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <label className="text-sm font-semibold text-slate-800">
            Another time
            <input
              autoFocus
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Enter the team's availability"
              value={customTime}
              onChange={(event) => setCustomTime(event.target.value)}
            />
          </label>
          <button
            className="mt-3 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            disabled={!customTime.trim()}
            type="button"
            onClick={() => setAvailabilityNote(`Availability noted: ${customTime.trim()}. Choose “They are flexible — choose the best fit” to build the approved plan.`)}
          >
            Record availability
          </button>
        </div>
      )}
      {availabilityNote && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-900">{availabilityNote}</p>}
    </section>
  );
}

function PlanPreview() {
  const { world, dispatch } = useDemoWorld();
  const plan = world.activePlan;
  if (!plan) return null;

  const scheduleRow = (time: string, title: string, label?: 'Fixed' | 'Flexible' | 'Consolidated' | 'Relocated' | 'Inserted') => (
    <li className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3" key={`${time}-${title}`}>
      <span>
        <span className="font-semibold text-slate-900">{time}</span>
        {' · '}{title}
      </span>
      {label && (
        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold uppercase text-violet-700">
          {label}
        </span>
      )}
    </li>
  );

  const daySchedule = (day: string, rows: ReturnType<typeof scheduleRow>[]) => (
    <section>
      <h4 className="mb-2 text-sm font-bold text-slate-950">{day}</h4>
      <ul className="space-y-2 text-sm text-slate-700">{rows}</ul>
    </section>
  );

  return (
    <section className="space-y-5">
      <div>
        <SectionLabel>Schedule proposal</SectionLabel>
        <h2 className="text-2xl font-semibold text-slate-950">A bounded session can fit without sacrificing recovery.</h2>
        <p className="mt-2 text-slate-600">Review the proposed changes. Nothing is applied until you confirm.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={cardClass + ' p-5'}>
          <h3 className="text-lg font-semibold text-slate-950">Before</h3>
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
            Teaching remains fixed and protected.
          </p>
          <div className="mt-4 space-y-5">
            {daySchedule('Tuesday, October 13', [
              scheduleRow('14:00–15:00', 'Teaching Preparation'),
              scheduleRow('15:00–16:00', 'Low-focus spare capacity'),
            ])}
            {daySchedule('Friday, October 16', [
              scheduleRow('08:00–11:00', 'Teaching', 'Fixed'),
              scheduleRow('11:00–13:00', 'Lunch / Recovery'),
              scheduleRow('13:00–14:00', 'Monthly Report'),
              scheduleRow('14:00–15:00', 'Flexible Work'),
              scheduleRow('15:00–16:00', 'Weekly Planning'),
              scheduleRow('16:00–17:00', 'Buffer / Flexible Capacity'),
            ])}
          </div>
        </section>
        <section className={cardClass + ' p-5'}>
          <h3 className="text-lg font-semibold text-slate-950">After</h3>
          <div className="mt-4 space-y-5">
            {daySchedule('Tuesday, October 13', [
              scheduleRow('14:00–15:00', 'Teaching Preparation', 'Flexible'),
              scheduleRow('15:00–16:00', 'Weekly Planning — moved from Friday', 'Relocated'),
            ])}
            {daySchedule('Friday, October 16', [
              scheduleRow('08:00–11:00', 'Teaching + Monthly Report — Consolidated Morning Block', 'Consolidated'),
              scheduleRow('11:00–13:00', 'Lunch / Recovery'),
              scheduleRow('13:00–13:30', 'Mentoring Preparation', 'Inserted'),
              scheduleRow('13:30–15:00', 'Focused Mentoring Session', 'Inserted'),
              scheduleRow('15:00–16:00', 'Buffer / Recovery'),
              scheduleRow('16:00–17:00', 'Flexible Work'),
            ])}
          </div>
        </section>
      </div>
      <section className={cardClass + ' p-5'}>
        <h3 className="text-lg font-semibold text-slate-950">Why this plan works</h3>
        <ul className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          {plan.operations.map((operation) => <li key={operation.title}>• {operation.reason}</li>)}
        </ul>
      </section>
      <div className="flex justify-end">
        <button
          className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-800"
          type="button"
          onClick={() => dispatch({ type: 'apply-active-plan' })}
        >
          Confirm & Apply Plan
        </button>
      </div>
    </section>
  );
}

function AppliedState() {
  const { dispatch } = useDemoWorld();
  return (
    <section className={cardClass + ' border-emerald-200 p-7'}>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
        Plan applied
      </span>
      <h2 className="mt-4 text-2xl font-semibold text-slate-950">Focused mentoring is now planned.</h2>
      <p className="mt-2 text-slate-600">
        Your calendar, tasks, capacity, decision history, and understanding now share the updated plan.
      </p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-violet-700">
        <Link to="/calendar">View Calendar</Link>
        <Link to="/tasks">View Tasks</Link>
        <Link to="/history">View History</Link>
        <Link to="/understanding">View Understanding</Link>
      </div>
      <button
        className="mt-7 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
        type="button"
        onClick={() => dispatch({ type: 'complete-mentoring-with-reflection', actualPreparationMinutes: 75 })}
      >
        Mark mentoring complete
      </button>
    </section>
  );
}

function CompletedState() {
  const { world } = useDemoWorld();
  const outcome = world.outcomes.find((item) => item.id === 'outcome.mentoring.2026-10-16');
  const decision = world.decisions.find((item) => item.id === 'decision.mentoring');

  return (
    <section className={cardClass + ' border-emerald-200 p-7'}>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
        Mentoring completed
      </span>
      <h2 className="mt-4 text-2xl font-semibold text-slate-950">Reflection captured for future decisions.</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          Estimated preparation: {outcome?.estimatedPreparationMinutes.min}–{outcome?.estimatedPreparationMinutes.max} minutes
        </p>
        <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Actual preparation: {outcome?.actualPreparationMinutes} minutes
        </p>
      </div>
      <p className="mt-5 text-slate-700">
        {decision?.learned}
      </p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-violet-700">
        <Link to="/history">View History</Link>
        <Link to="/understanding">View Understanding</Link>
      </div>
    </section>
  );
}

function DecisionsPageContent() {
  const { world, dispatch } = useDemoWorld();
  const decision = world.activeDecision;
  const [question, setQuestion] = useState(decision?.prompt ?? '');
  const [priority, setPriority] = useState<'high' | null>(decision ? 'high' : null);
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (question.trim() !== MENTORING_PROMPT || priority !== 'high') {
      setError('Use the Scenario A mentoring question and set Priority to High.');
      return;
    }
    setError('');
    dispatch({ type: 'start-mentoring-decision' });
  };

  const currentClarification =
    decision?.stage === 'expected-outcome'
      ? decision.clarifications.find((item) => item.id === 'expected-outcome')
      : decision?.stage === 'commitment-flexibility'
        ? decision.clarifications.find((item) => item.id === 'commitment-flexibility')
        : undefined;

  const answerClarification = (answer: string) => {
    if (decision?.stage === 'expected-outcome') dispatch({ type: 'answer-expected-outcome', answer });
    if (decision?.stage === 'commitment-flexibility') dispatch({ type: 'answer-commitment-flexibility', answer });
  };

  const showRecommendation =
    decision && ['recommendation', 'team-availability', 'plan-preview'].includes(decision.stage);

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-5 py-8 lg:px-8">
      <header className="max-w-3xl">
        <SectionLabel>Ask Future Me</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Make the next decision with your whole context.</h1>
        <p className="mt-2 text-slate-600">One question, the context that matters, and a plan you remain in control of.</p>
      </header>

      {!decision && (
        <form className={cardClass + ' max-w-3xl p-5'} onSubmit={submit}>
          <label className="text-sm font-semibold text-slate-800" htmlFor="decision-question">
            What decision do you need help with?
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
            id="decision-question"
            placeholder={MENTORING_PROMPT}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Priority</span>
              <button
                aria-pressed={priority === 'high'}
                className={
                  'rounded-full border px-4 py-2 text-sm font-bold ' +
                  (priority === 'high'
                    ? 'border-violet-700 bg-violet-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400')
                }
                type="button"
                onClick={() => setPriority('high')}
              >
                High
              </button>
            </div>
            <button
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              type="submit"
            >
              Ask Future Me
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
        </form>
      )}

      {decision && (
        <>
          <section className="ml-auto max-w-3xl rounded-2xl rounded-br-md bg-slate-900 px-5 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Your decision · High priority</p>
            <p className="mt-1 text-base">{decision.prompt}</p>
          </section>
          <RelevantContext />
          {currentClarification && (
            <ClarificationCard
              key={currentClarification.id}
              clarification={currentClarification}
              onAnswer={answerClarification}
            />
          )}
          {showRecommendation && <Recommendation />}
          {decision.stage === 'team-availability' && <TeamAvailability />}
          {decision.stage === 'plan-preview' && <PlanPreview />}
          {decision.stage === 'applied' && <AppliedState />}
          {decision.stage === 'completed' && <CompletedState />}
        </>
      )}
    </main>
  );
}

function DecisionsPage() {
  const { resetVersion } = useDemoWorld();
  return <DecisionsPageContent key={resetVersion} />;
}

export default DecisionsPage;
