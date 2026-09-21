import { useState, useEffect, type FormEvent } from 'react';
import { decisionsApi, contextApi } from '../api/client';
import type { DecisionApiRequest, DecisionApiResponse, ContextUpdateObservation, ObservationSource } from '../types/domain';

interface DemoForm {
  userId: string;
  question: string;
  target: string;
  deadline: string;
  timeCostHours: string;
  availableHoursBeforeDeadline: string;
  workloadHoursBeforeDeadline: string;
  energyCost: string;
  availableEnergy: string;
  goalRelevance: 'low' | 'medium' | 'high';
  source: 'user-confirmed' | 'provided' | 'estimated';
}

interface ObservationForm {
  category: 'workload-increase' | 'energy-decrease' | 'deadline-change' | 'disruption';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

const INITIAL_FORM: DemoForm = {
  userId: 'demo-user',
  question: '',
  target: '',
  deadline: '',
  timeCostHours: '',
  availableHoursBeforeDeadline: '',
  workloadHoursBeforeDeadline: '',
  energyCost: '',
  availableEnergy: '',
  goalRelevance: 'medium',
  source: 'user-confirmed',
};

const INITIAL_OBSERVATION: ObservationForm = {
  category: 'workload-increase',
  description: '',
  severity: 'medium',
};

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-ai disabled:opacity-60';

function optionalNumber(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readSessionValue<T>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    sessionStorage.removeItem(key);
    return fallback;
  }
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function feasibilityClass(feasibility: string): string {
  switch (feasibility) {
    case 'feasible':
      return 'bg-green-100 text-green-800';
    case 'at-risk':
      return 'bg-amber-100 text-amber-800';
    case 'not-feasible':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}


function personalStateClass(state: string): { bg: string, text: string, border: string } {
  switch (state.toUpperCase()) {
    case 'FLOW': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    case 'UNCERTAIN': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    case 'DRIFTING': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
    case 'DISRUPTED': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
    case 'OVERLOADED': return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
  }
}

function formatHours(value: number | null): string {
  return value === null ? 'Not available' : value + ' hours';
}

function DecisionsPage() {
  const [form, setForm] = useState<DemoForm>(() => readSessionValue('decisions_form', INITIAL_FORM));
  const [observationForm, setObservationForm] = useState<ObservationForm>(() => readSessionValue('decisions_observationForm', INITIAL_OBSERVATION));
  const [result, setResult] = useState<DecisionApiResponse | null>(() => readSessionValue('decisions_result', null));
  const [beforeResult, setBeforeResult] = useState<DecisionApiResponse | null>(() => readSessionValue('decisions_beforeResult', null));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>(() => readSessionValue('decisions_clarificationAnswers', {}));
  const [showObservationForm, setShowObservationForm] = useState(false);

  useEffect(() => sessionStorage.setItem('decisions_form', JSON.stringify(form)), [form]);
  useEffect(() => sessionStorage.setItem('decisions_observationForm', JSON.stringify(observationForm)), [observationForm]);
  useEffect(() => sessionStorage.setItem('decisions_result', JSON.stringify(result)), [result]);
  useEffect(() => sessionStorage.setItem('decisions_beforeResult', JSON.stringify(beforeResult)), [beforeResult]);
  useEffect(() => sessionStorage.setItem('decisions_clarificationAnswers', JSON.stringify(clarificationAnswers)), [clarificationAnswers]);

  const handleReset = () => {
    sessionStorage.removeItem('decisions_form');
    sessionStorage.removeItem('decisions_observationForm');
    sessionStorage.removeItem('decisions_result');
    sessionStorage.removeItem('decisions_beforeResult');
    sessionStorage.removeItem('decisions_clarificationAnswers');
    setForm(INITIAL_FORM);
    setObservationForm(INITIAL_OBSERVATION);
    setResult(null);
    setBeforeResult(null);
    setClarificationAnswers({});
    setError(null);
  };

  const updateField = (field: keyof DemoForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateObservation = (field: keyof ObservationForm, value: string) => {
    setObservationForm((current) => ({ ...current, [field]: value }));
  };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = form.question.trim();
    if (!question) {
      setError('Enter a decision question before submitting.');
      return;
    }

    const timeCost = optionalNumber(form.timeCostHours);
    const availableHours = optionalNumber(form.availableHoursBeforeDeadline);
    const workloadHours = optionalNumber(form.workloadHoursBeforeDeadline);
    const energyCost = optionalNumber(form.energyCost);
    const availableEnergy = optionalNumber(form.availableEnergy);

    if ([timeCost, availableHours, workloadHours, energyCost, availableEnergy].some(v => v !== undefined && v < 0)) {
      setError('Numeric values cannot be negative.');
      return;
    }

    const request: DecisionApiRequest = {
      query: {
        question,
        impactProfile: {
          target: form.target.trim() || undefined,
          deadline: form.deadline || undefined,
          timeCostHours: timeCost,
          availableHoursBeforeDeadline: availableHours,
          workloadHoursBeforeDeadline: workloadHours,
          energyCost: energyCost,
          availableEnergy: availableEnergy,
          goalRelevance: form.goalRelevance,
          source: form.source,
        },
      },
    };

    if (form.userId.trim()) {
      request.userId = form.userId.trim();
    }

    if (result) {
      setBeforeResult(result);
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setClarificationAnswers({});

    try {
      const response = await decisionsApi.query(request);
      setResult(response);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to request decision support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleObservationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!observationForm.description.trim()) {
      setError('Enter an observation description.');
      return;
    }

    const observation: ContextUpdateObservation = {
      type: observationForm.category,
      data: {
        description: observationForm.description,
        severity: observationForm.severity,
      },
      source: 'USER_CONFIRMED' as ObservationSource,
      confidence: 1.0,
    };

    setIsLoading(true);
    setError(null);

    try {
      await contextApi.update(observation, form.userId);
      setShowObservationForm(false);
      setObservationForm(INITIAL_OBSERVATION);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to submit observation.');
    } finally {
      setIsLoading(false);
    }
  };

    const handleClarificationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!result) return;

    const hasNegative = Object.values(clarificationAnswers).some(answer => {
      const num = optionalNumber(answer);
      return num !== undefined && num < 0;
    });
    if (hasNegative) {
      setError('Numeric values cannot be negative.');
      return;
    }

    // Save the current result as "before"
    setBeforeResult(result);

    // Merge clarification answers into the impact profile
    const updatedProfile = { ...form };

    Object.entries(clarificationAnswers).forEach(([question, answer]) => {
      const normalizedQuestion = question.toLowerCase();
      const answerNum = optionalNumber(answer);

      if (answerNum !== undefined) {
        if (normalizedQuestion.includes('existing workload') || normalizedQuestion.includes('workload hours')) {
          updatedProfile.workloadHoursBeforeDeadline = answer;
        } else if (
          normalizedQuestion.includes('available before it') ||
          normalizedQuestion.includes('available time') ||
          normalizedQuestion.includes('hours are available') ||
          normalizedQuestion.includes('hours available')
        ) {
          updatedProfile.availableHoursBeforeDeadline = answer;
        } else if (
          normalizedQuestion.includes('time cost') ||
          normalizedQuestion.includes('how long') ||
          normalizedQuestion.includes('how many hours')
        ) {
          updatedProfile.timeCostHours = answer;
        } else if (
          normalizedQuestion.includes('available energy') ||
          normalizedQuestion.includes('energy is currently available') ||
          normalizedQuestion.includes('energy level')
        ) {
          updatedProfile.availableEnergy = answer;
        } else if (normalizedQuestion.includes('energy')) {
          updatedProfile.energyCost = answer;
        }
      } else if (normalizedQuestion.includes('deadline')) {
        const date = new Date(answer);
        if (!Number.isNaN(date.getTime())) updatedProfile.deadline = answer;
      } else if (normalizedQuestion.includes('target')) {
        updatedProfile.target = answer;
      }
    });

    setForm(updatedProfile);

    const request: DecisionApiRequest = {
      query: {
        question: form.question,
        impactProfile: {
          target: updatedProfile.target.trim() || undefined,
          deadline: updatedProfile.deadline || undefined,
          timeCostHours: optionalNumber(updatedProfile.timeCostHours),
          availableHoursBeforeDeadline: optionalNumber(updatedProfile.availableHoursBeforeDeadline),
          workloadHoursBeforeDeadline: optionalNumber(updatedProfile.workloadHoursBeforeDeadline),
          energyCost: optionalNumber(updatedProfile.energyCost),
          availableEnergy: optionalNumber(updatedProfile.availableEnergy),
          goalRelevance: updatedProfile.goalRelevance,
          source: updatedProfile.source,
        },
      },
    };

    if (form.userId.trim()) {
      request.userId = form.userId.trim();
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await decisionsApi.query(request);
      setResult(response);
      setClarificationAnswers({});
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to re-assess decision.');
    } finally {
      setIsLoading(false);
    }
  };

  const recommendation = result?.decision.recommendation;
  const assessment = result?.assessment;
  const confidencePercent = recommendation
    ? Math.round(Math.min(1, Math.max(0, recommendation.confidence)) * 100)
    : 0;

  const beforeRecommendation = beforeResult?.decision.recommendation;
  const beforeAssessment = beforeResult?.assessment;

  const hasChangedRecommendation = beforeRecommendation && recommendation &&
    beforeRecommendation.option !== recommendation.option;

  const changedEvidence = beforeAssessment && assessment
    ? assessment.evidence.filter(e => {
        const beforeEv = beforeAssessment.evidence.find(be => be.fact === e.fact);
        return !beforeEv || beforeEv.value !== e.value;
      })
    : [];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Ask Future Me</h1>
        <p className="text-text-secondary">
          Test a decision against your available time, workload, and energy.
        </p>
      </header>

      <form className="card p-6 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="decision-query" className="block text-sm font-medium text-text-secondary mb-2">
            What decision do you need help with?
          </label>
          <textarea
            id="decision-query"
            value={form.question}
            onChange={(event) => updateField('question', event.target.value)}
            className={inputClassName + ' resize-y'}
            rows={4}
            required
          />
        </div>

                <details className="mt-4">
          <summary className="text-sm font-medium text-accent-ai cursor-pointer select-none mb-4">
            Advanced Inputs
          </summary>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-text-secondary">
              User ID <span className="text-xs">(optional)</span>
              <input
                value={form.userId}
                onChange={(event) => updateField('userId', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Decision target
              <input
                value={form.target}
                onChange={(event) => updateField('target', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Deadline
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(event) => updateField('deadline', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Time cost (hours)
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.timeCostHours}
                onChange={(event) => updateField('timeCostHours', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Available time before deadline (hours)
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.availableHoursBeforeDeadline}
                onChange={(event) => updateField('availableHoursBeforeDeadline', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Existing workload before deadline (hours)
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.workloadHoursBeforeDeadline}
                onChange={(event) => updateField('workloadHoursBeforeDeadline', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Energy cost (0–10)
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={form.energyCost}
                onChange={(event) => updateField('energyCost', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Available energy (0–10)
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={form.availableEnergy}
                onChange={(event) => updateField('availableEnergy', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Goal relevance
              <select
                value={form.goalRelevance}
                onChange={(event) => updateField('goalRelevance', event.target.value)}
                className={inputClassName + ' mt-1'}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="text-sm text-text-secondary">
              Data source
              <select
                value={form.source}
                onChange={(event) => updateField('source', event.target.value)}
                className={inputClassName + ' mt-1'}
              >
                <option value="user-confirmed">User confirmed</option>
                <option value="provided">Provided</option>
                <option value="estimated">Estimated</option>
              </select>
            </label>
          </div>
        </details>

                <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-ai px-6 py-3 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            )}
            {isLoading ? 'Assessing decision…' : 'Ask Future Me'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-text-primary hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowObservationForm(!showObservationForm)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-text-primary hover:bg-slate-50"
          >
            {showObservationForm ? 'Hide' : 'Add'} Context Change
          </button>
          <span className="text-xs text-text-secondary">
            Sends a live request to the configured decisions API.
          </span>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Request failed</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
      </form>

      {showObservationForm && (
        <form className="card p-6 space-y-4 border-l-4 border-accent-ai" onSubmit={handleObservationSubmit}>
          <h2 className="text-xl font-medium text-text-primary">Report Context Change</h2>
          <p className="text-sm text-text-secondary">
            Report a change that affects your capacity or state (new task, energy shift, deadline moved, disruption).
          </p>

          <label className="text-sm text-text-secondary">
            Change category
            <select
              value={observationForm.category}
              onChange={(event) => updateObservation('category', event.target.value)}
              className={inputClassName + ' mt-1'}
            >
              <option value="workload-increase">Workload increase</option>
              <option value="energy-decrease">Energy decrease</option>
              <option value="deadline-change">Deadline change</option>
              <option value="disruption">Disruption</option>
            </select>
          </label>

          <label className="text-sm text-text-secondary">
            Description
            <textarea
              value={observationForm.description}
              onChange={(event) => updateObservation('description', event.target.value)}
              className={inputClassName + ' mt-1 resize-y'}
              rows={3}
              required
            />
          </label>

          <label className="text-sm text-text-secondary">
            Severity
            <select
              value={observationForm.severity}
              onChange={(event) => updateObservation('severity', event.target.value)}
              className={inputClassName + ' mt-1'}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-ai px-6 py-3 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit Observation
          </button>
        </form>
      )}

      {result && result.clarificationNeeded && result.clarificationNeeded.length > 0 && (
        <form className="card border-l-4 border-accent-warning p-6 space-y-4" onSubmit={handleClarificationSubmit}>
          <h2 className="text-xl font-medium text-text-primary">Clarification Needed</h2>
          <p className="text-sm text-text-secondary">
            The following information is needed to improve the assessment:
          </p>

          {result.clarificationNeeded.map((question) => {
            const isNumeric = !question.toLowerCase().includes('deadline');
            return (
            <label key={question} className="text-sm text-text-secondary">
              {question}
              <input
                type={isNumeric ? "number" : "text"}
                min={isNumeric ? "0" : undefined}
                step={isNumeric ? "0.5" : undefined}
                value={clarificationAnswers[question] || ''}
                onChange={(event) => setClarificationAnswers(prev => ({
                  ...prev,
                  [question]: event.target.value
                }))}
                className={inputClassName + ' mt-1'}
                required
              />
            </label>
            );
          })}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-warning px-6 py-3 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Re-assess with Clarifications
          </button>
        </form>
      )}

      {beforeResult && hasChangedRecommendation && (
        <article className="card border-l-4 border-green-500 p-6 space-y-4">
          <h2 className="text-xl font-medium text-text-primary">Assessment Updated</h2>
          <p className="text-sm text-text-secondary">
            The recommendation changed after clarification:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary mb-2">Before</p>
              <p className="text-lg font-medium text-text-primary">
                {titleCase(beforeRecommendation?.option || '')}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{beforeRecommendation?.reasoning}</p>
            </div>

            <div className="rounded-lg border border-green-500 p-4 bg-green-50">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700 mb-2">After</p>
              <p className="text-lg font-medium text-green-900">
                {titleCase(recommendation?.option || '')}
              </p>
              <p className="mt-2 text-sm text-green-800">{recommendation?.reasoning}</p>
            </div>
          </div>

          {changedEvidence.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Changed inputs:</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
                {changedEvidence.map((ev) => (
                  <li key={ev.fact}>
                    <span className="font-medium text-text-primary">{ev.fact}:</span> {String(ev.value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}

      {result && recommendation && assessment && (
        <section className="space-y-6" aria-live="polite">
          <article className="card p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
                <span className="text-sm font-bold text-accent-ai">AI</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-medium text-text-primary">Recommendation</h2>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-accent-ai">
                    {titleCase(recommendation.option)}
                  </span>
                </div>
                <p className="mt-3 text-text-primary">{recommendation.reasoning}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-text-secondary">Confidence</span>
                  <div className="h-2 max-w-xs flex-1 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-accent-ai"
                      style={{ width: confidencePercent + '%' }}
                    />
                  </div>
                  <span className="font-mono text-sm text-text-primary">{confidencePercent}%</span>
                </div>
              </div>
            </div>
          </article>

          <article className="card p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-medium text-text-primary">Feasibility assessment</h2>
              <div className="flex gap-2">
                {result.state && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium border cursor-help ${personalStateClass(result.state.state).bg} ${personalStateClass(result.state.state).text} ${personalStateClass(result.state.state).border}`}
                    title={result.state.evidence.join('; ')}
                  >
                    State: {titleCase(result.state.state)}
                  </span>
                )}
                <span
                  className={
                    'rounded-full px-3 py-1 text-sm font-medium ' +
                    feasibilityClass(assessment.feasibility)
                  }
                >
                  {titleCase(assessment.feasibility)}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Capacity</p>
                <p className="mt-2 font-mono text-lg text-text-primary">
                  {formatHours(assessment.projectedRemainingCapacityHours)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Remaining from {formatHours(assessment.availableTimeBeforeDeadlineHours)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Pressure</p>
                <p className="mt-2 text-lg font-medium text-text-primary">
                  {titleCase(assessment.deadlinePressure)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">Deadline pressure</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Energy</p>
                <p className="mt-2 text-lg font-medium text-text-primary">
                  {titleCase(assessment.energyFit)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">Energy fit</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Assessment</p>
                <p className="mt-2 text-lg font-medium text-text-primary">
                  {titleCase(assessment.feasibility)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">Overall feasibility</p>
              </div>
            </div>
          </article>

          <article className="card p-6 space-y-4">
            <h2 className="text-xl font-medium text-text-primary">Evidence</h2>
            {assessment.evidence.length > 0 ? (
              <div className="space-y-3">
                {assessment.evidence.map((item, index) => {
                  const isChanged = changedEvidence.some(ce => ce.fact === item.fact);
                  return (
                    <div 
                      key={item.fact + index} 
                      className={`rounded-lg border p-4 ${isChanged ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-medium text-text-primary">{item.fact}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-text-primary">{String(item.value)}</span>
                          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-text-secondary">
                            {titleCase(item.source)}
                          </span>
                          {isChanged && (
                            <span className="rounded bg-green-200 px-2 py-1 text-xs text-green-800 font-medium">
                              Updated
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">{item.explanation}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No evidence was returned.</p>
            )}
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="card p-6">
              <h2 className="text-xl font-medium text-text-primary">Assumptions</h2>
              {assessment.assumptions.length > 0 ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-primary">
                  {assessment.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-text-secondary">No assumptions were reported.</p>
              )}
            </article>

            <article className="card p-6">
              <h2 className="text-xl font-medium text-text-primary">Missing data</h2>
              {assessment.missingData.length > 0 ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-primary">
                  {assessment.missingData.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-text-secondary">No required data is missing.</p>
              )}
            </article>
          </div>
        </section>
      )}
    </div>
  );
}

export default DecisionsPage;
