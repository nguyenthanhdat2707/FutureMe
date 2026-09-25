import { useState, useEffect, type FormEvent } from 'react';
import { decisionsApi, contextApi, api } from '../api/client';
import type { DecisionApiRequest, DecisionApiResponse, ContextUpdateObservation, ObservationSource } from '../types/domain';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from '../components/InterventionCard';

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

const CLARIFICATION_ALLOWLIST = [
  'target',
  'deadline',
  'timeCostHours',
  'availableHoursBeforeDeadline',
  'workloadHoursBeforeDeadline',
  'energyCost',
  'availableEnergy',
] as const;

type ClarificationField = typeof CLARIFICATION_ALLOWLIST[number];

function isClarificationField(field: string): field is ClarificationField {
  return (CLARIFICATION_ALLOWLIST as readonly string[]).includes(field);
}

const FIELD_DEFINITIONS: Record<string, { label: string, type: string, min?: number, max?: number, step?: number }> = {
  timeCostHours: { label: 'Time cost (hours)', type: 'number', min: 0, step: 0.5 },
  availableHoursBeforeDeadline: { label: 'Available time before deadline (hours)', type: 'number', min: 0, step: 0.5 },
  workloadHoursBeforeDeadline: { label: 'Existing workload before deadline (hours)', type: 'number', min: 0, step: 0.5 },
  deadline: { label: 'Deadline', type: 'datetime-local' },
  energyCost: { label: 'Energy cost (0–10)', type: 'number', min: 0, max: 10, step: 1 },
  availableEnergy: { label: 'Available energy (0–10)', type: 'number', min: 0, max: 10, step: 1 },
  target: { label: 'Decision target', type: 'text' },
};

function DecisionsPage() {
  const [form, setForm] = useState<DemoForm>(() => readSessionValue('decisions_form', INITIAL_FORM));
  const [observationForm, setObservationForm] = useState<ObservationForm>(() => readSessionValue('decisions_observationForm', INITIAL_OBSERVATION));
  const [result, setResult] = useState<DecisionApiResponse | null>(() => readSessionValue('decisions_result', null));
  const [beforeResult, setBeforeResult] = useState<DecisionApiResponse | null>(() => readSessionValue('decisions_beforeResult', null));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>(() => readSessionValue('decisions_clarificationAnswers', {}));
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [hasStaleContext, setHasStaleContext] = useState(() => readSessionValue('decisions_hasStaleContext', false));
  const [choiceState, setChoiceState] = useState<'none' | 'accepted' | 'rejected' | 'pending'>('none');
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const { intervention, refresh: refreshInterventions, respond, dismiss } = useInterventions();

  useEffect(() => sessionStorage.setItem('decisions_form', JSON.stringify(form)), [form]);
  useEffect(() => sessionStorage.setItem('decisions_observationForm', JSON.stringify(observationForm)), [observationForm]);
  useEffect(() => sessionStorage.setItem('decisions_result', JSON.stringify(result)), [result]);
  useEffect(() => sessionStorage.setItem('decisions_beforeResult', JSON.stringify(beforeResult)), [beforeResult]);
  useEffect(() => sessionStorage.setItem('decisions_clarificationAnswers', JSON.stringify(clarificationAnswers)), [clarificationAnswers]);
  useEffect(() => sessionStorage.setItem('decisions_hasStaleContext', JSON.stringify(hasStaleContext)), [hasStaleContext]);

  const handleReset = () => {
    sessionStorage.removeItem('decisions_form');
    sessionStorage.removeItem('decisions_observationForm');
    sessionStorage.removeItem('decisions_result');
    sessionStorage.removeItem('decisions_beforeResult');
    sessionStorage.removeItem('decisions_clarificationAnswers');
    sessionStorage.removeItem('decisions_hasStaleContext');
    setForm(INITIAL_FORM);
    setObservationForm(INITIAL_OBSERVATION);
    setResult(null);
    setBeforeResult(null);
    setClarificationAnswers({});
    setHasStaleContext(false);
    setError(null);
    setChoiceState('none');
    setChoiceError(null);
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



    const prevResult = result;
    setIsLoading(true);
    setError(null);

    try {
      const response = await decisionsApi.query(request);
      setBeforeResult(prevResult);
      setResult(response);
      setHasStaleContext(false);
      setClarificationAnswers({});
      setChoiceState('none');
      setChoiceError(null);
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
      await contextApi.update(observation);
      setShowObservationForm(false);
      setObservationForm(INITIAL_OBSERVATION);
      if (result) {
        setHasStaleContext(true);
      }
      await refreshInterventions();
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to submit observation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReassessSameDecision = async () => {
    if (!result) return;

    const request: DecisionApiRequest = {
      
      query: {
        question: form.question.trim(),
        impactProfile: {
          target: form.target.trim() || undefined,
          deadline: form.deadline || undefined,
          timeCostHours: optionalNumber(form.timeCostHours),
          availableHoursBeforeDeadline: optionalNumber(form.availableHoursBeforeDeadline),
          workloadHoursBeforeDeadline: optionalNumber(form.workloadHoursBeforeDeadline),
          energyCost: optionalNumber(form.energyCost),
          availableEnergy: optionalNumber(form.availableEnergy),
          goalRelevance: form.goalRelevance,
          source: form.source,
        }
      }
    };

    const prevResult = result;
    setIsLoading(true);
    setError(null);

    try {
      const response = await decisionsApi.query(request);
      setBeforeResult(prevResult);
      setResult(response);
      setHasStaleContext(false);
      setClarificationAnswers({});
      setChoiceState('none');
      setChoiceError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to reassess decision.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Accept / Reject write-back ────────────────────────────────────────────
  const handleAccept = async () => {
    if (!result) return;
    const decisionId = result.decision?.id;
    const option = result.decision?.recommendation?.option ?? 'proceed';
    const question = form.question.trim();
    setChoiceState('pending');
    setChoiceError(null);
    try {
      if (decisionId) {
        await decisionsApi.recordChoice(decisionId, option, `Accepted: ${option}`);
      }
      // Scheduling intent heuristic
      const isSchedulingIntent = /reserve|schedule|block|add.*session|focus.*time|time.*for|set aside/i.test(question);
      if (isSchedulingIntent) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(11, 0, 0, 0);
        await api.calendar.createEvent({
          title: `Focus: ${question.slice(0, 60)}`,
          startTime: tomorrow.toISOString(),
          endTime: tomorrowEnd.toISOString(),
          category: 'deep_work',
          note: `AI-recommended. Decision: ${option}`,
        });
        window.dispatchEvent(new CustomEvent('future-me-calendar-updated'));
      }
      setChoiceState('accepted');
    } catch (err) {
      setChoiceError(err instanceof Error ? err.message : 'Failed to record acceptance');
      setChoiceState('none');
    }
  };

  const handleReject = async () => {
    if (!result) return;
    const decisionId = result.decision?.id;
    const option = result.decision?.recommendation?.option ?? 'proceed';
    setChoiceState('pending');
    setChoiceError(null);
    try {
      if (decisionId) {
        await decisionsApi.recordChoice(decisionId, 'rejected', `Rejected: ${option}`);
      }
      setChoiceState('rejected');
    } catch (err) {
      setChoiceError(err instanceof Error ? err.message : 'Failed to record rejection');
      setChoiceState('none');
    }
  };

    const submitWithClarification = async (skip: boolean) => {
    if (!result) return;
    const prevResult = result;

    const updatedProfile = { ...form };
    const unresolvedFields: string[] = [];

    const unresolvedMaterialFields = result.policy.unresolvedMaterialFields || [];
    unresolvedMaterialFields.forEach(field => {
      if (clarificationAnswers[field] && clarificationAnswers[field].trim() !== '') {
        if (isClarificationField(field)) {
          updatedProfile[field] = clarificationAnswers[field];
        } else {
          unresolvedFields.push(field);
        }
      } else {
        unresolvedFields.push(field);
      }
    });

    if (!skip) {
      const hasNegative = Object.values(clarificationAnswers).some(answer => {
        const num = optionalNumber(answer);
        return num !== undefined && num < 0;
      });
      if (hasNegative) {
        setError('Numeric values cannot be negative.');
        return;
      }
    }

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
        clarification: {
          attempted: true,
          unresolvedFields: skip ? unresolvedMaterialFields : unresolvedFields,
          unresolvedConflicts: result.policy.unresolvedMaterialConflicts,
        }
      },
    };


    setIsLoading(true);
    setError(null);

    try {
      const response = await decisionsApi.query(request);
      setBeforeResult(prevResult);
      setResult(response);
      setClarificationAnswers({});
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to request decision support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarificationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitWithClarification(false);
  };

  const recommendation = result?.decision?.recommendation;
  const assessment = result?.assessment;
  const confidencePercent = recommendation
    ? Math.round(Math.min(1, Math.max(0, recommendation.confidence)) * 100)
    : 0;

  const beforeRecommendation = beforeResult?.decision?.recommendation;
  const beforeAssessment = beforeResult?.assessment;

  const hasChangedRecommendation = beforeResult?.policy.outcome !== result?.policy.outcome || beforeRecommendation?.option !== recommendation?.option;

  const changedEvidence = beforeAssessment && assessment
    ? assessment.evidence.filter(e => {
        const beforeEv = beforeAssessment.evidence.find(be => be.fact === e.fact);
        return !beforeEv || beforeEv.value !== e.value || beforeEv.source !== e.source || beforeEv.explanation !== e.explanation;
      })
    : [];

  const removedEvidence = beforeAssessment && assessment
    ? beforeAssessment.evidence.filter(be => {
        return !assessment.evidence.some(e => e.fact === be.fact);
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

      {intervention && (
        <InterventionCard
          intervention={intervention}
          onRespond={respond}
          onDismiss={dismiss}
        />
      )}

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
            className="inline-flex items-center gap-2 rounded-lg bg-accent-ai px-6 py-3 font-medium text-white hover:bg-accent-ai/90 disabled:cursor-not-allowed disabled:opacity-60"
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

      {hasStaleContext && (
        <div role="status" className="card p-6 border-l-4 border-yellow-400 bg-yellow-50 space-y-4">
          <h2 className="text-xl font-medium text-text-primary">Context changed. Your current result is stale.</h2>
          <button
            type="button"
            onClick={handleReassessSameDecision}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-ai px-6 py-3 font-medium text-white hover:bg-accent-ai/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Re-assess same decision
          </button>
        </div>
      )}


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
            className="inline-flex items-center gap-2 rounded-lg bg-accent-ai px-6 py-3 font-medium text-white hover:bg-accent-ai/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit Observation
          </button>
        </form>
      )}

      {result?.policy?.outcome === 'ASK' && (
        <form className="card border-l-4 border-accent-warning p-6 space-y-4" onSubmit={handleClarificationSubmit}>
          <h2 className="text-xl font-medium text-text-primary">Needs your input</h2>
          <p className="text-sm text-text-secondary">
            {result.policy?.reason || 'The following information is needed to improve the assessment:'}
          </p>

          {result.policy.unresolvedMaterialFields && result.policy.unresolvedMaterialFields.length > 0 && (
            <div className="space-y-4 mt-4">
              {result.policy.unresolvedMaterialFields.map((field) => {
                const def = FIELD_DEFINITIONS[field] || { label: field, type: 'text' };
                return (
                  <label key={field} className="block text-sm text-text-secondary">
                    {def.label}
                    <input
                      type={def.type}
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      aria-label={field}
                      value={clarificationAnswers[field] || ''}
                      onChange={(event) => setClarificationAnswers(prev => ({
                        ...prev,
                        [field]: event.target.value
                      }))}
                      className={inputClassName + ' mt-1 w-full max-w-md block'}
                    />
                  </label>
                );
              })}
            </div>
          )}

          {result.policy.unresolvedMaterialConflicts && result.policy.unresolvedMaterialConflicts.length > 0 && (
            <div className="space-y-2 mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-medium text-amber-800 text-sm">Please resolve the following conflicts:</p>
              <ul className="list-disc pl-5 text-sm text-amber-900">
                {result.policy.unresolvedMaterialConflicts.map((conflict, idx) => (
                  <li key={idx}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-warning px-6 py-3 font-medium text-white hover:bg-accent-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Re-assess with Clarifications
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => submitWithClarification(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-text-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              I'm not sure / continue without resolving
            </button>
          </div>
        </form>
      )}

      {result?.policy?.outcome === 'ABSTAIN' && (
        <article className="card border-l-4 border-slate-400 p-6 space-y-4 bg-slate-50">
          <h2 className="text-xl font-medium text-text-primary">Cannot recommend yet</h2>
          <p className="text-sm text-text-secondary">
            {result.policy?.reason}
          </p>
        </article>
      )}

      {beforeResult && result && (
        <article className={`card border-l-4 p-6 space-y-4 ${hasChangedRecommendation ? 'border-green-500' : 'border-blue-500'}`}>
          <h2 className="text-xl font-medium text-text-primary">Assessment Updated</h2>
          <p className="text-sm font-medium text-text-primary">
            {hasChangedRecommendation ? 'Recommendation changed' : 'Recommendation unchanged'}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary mb-2">Before</p>
              <p className="text-lg font-medium text-text-primary">
                {titleCase(beforeResult.policy.outcome)} - {titleCase(beforeRecommendation?.option || 'No recommendation')}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{beforeRecommendation?.reasoning || beforeResult.policy.reason}</p>
              <div className="mt-2 text-xs text-text-secondary flex gap-2">
                <span>Feasibility: {titleCase(beforeAssessment?.feasibility || '')}</span>
                <span>Input completeness confidence: {beforeRecommendation?.confidence !== undefined ? `${Math.round(beforeRecommendation.confidence * 100)}%` : 'N/A'}</span>
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${hasChangedRecommendation ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${hasChangedRecommendation ? 'text-green-700' : 'text-blue-700'}`}>After</p>
              <p className={`text-lg font-medium ${hasChangedRecommendation ? 'text-green-900' : 'text-blue-900'}`}>
                {titleCase(result.policy?.outcome)} - {titleCase(recommendation?.option || 'No recommendation')}
              </p>
              <p className={`mt-2 text-sm ${hasChangedRecommendation ? 'text-green-800' : 'text-blue-800'}`}>
                {recommendation?.reasoning || result.policy?.reason}
              </p>
              <div className={`mt-2 text-xs flex gap-2 ${hasChangedRecommendation ? 'text-green-800' : 'text-blue-800'}`}>
                <span>Feasibility: {titleCase(assessment?.feasibility || '')}</span>
                <span>Input completeness confidence: {recommendation?.confidence !== undefined ? `${Math.round(recommendation.confidence * 100)}%` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {(changedEvidence.length > 0 || removedEvidence.length > 0) ? (
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Evidence delta:</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
                {changedEvidence.map((ev) => {
                  const beforeEv = beforeAssessment?.evidence.find(be => be.fact === ev.fact);
                  return (
                    <li key={`evidence-current-${ev.fact}`}>
                      <span className="font-medium text-text-primary">{ev.fact}:</span>{' '}
                      {beforeEv
                        ? `Changed from ${String(beforeEv.value)} (${beforeEv.source}) -> ${String(ev.value)} (${ev.source})`
                        : `Added: ${String(ev.value)} (${ev.source})`}
                    </li>
                  );
                })}
                {removedEvidence.map((ev) => (
                  <li key={`evidence-removed-${ev.fact}`} className="line-through text-slate-400">
                    <span className="font-medium">{ev.fact}:</span> Removed {String(ev.value)} ({ev.source})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No material evidence change was returned; compare the reasoning above.</p>
          )}
        </article>
      )}

      {result?.policy?.outcome === 'RECOMMEND' && recommendation && assessment && (
        <section className="space-y-6" aria-live="polite">
          {choiceState === 'none' || choiceState === 'pending' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-medium text-emerald-800 text-sm mb-3">What will you do?</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void handleAccept()}
                  disabled={choiceState === 'pending'}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {choiceState === 'pending' ? 'Saving...' : 'Accept & Add to Schedule'}
                </button>
                <button
                  onClick={() => void handleReject()}
                  disabled={choiceState === 'pending'}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Not now
                </button>
              </div>
              {choiceError && <p className="mt-2 text-xs text-red-600">{choiceError}</p>}
            </div>
          ) : choiceState === 'accepted' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              ✓ Choice recorded. If this was a scheduling request, the event was added to your calendar.
              <button onClick={() => setChoiceState('none')} className="ml-4 underline text-xs">Change</button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Noted — no calendar change was made.
              <button onClick={() => setChoiceState('none')} className="ml-4 underline text-xs">Change mind</button>
            </div>
          )}

          <article className="card p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
                <span className="text-sm font-bold text-accent-ai">FM</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-medium text-text-primary">
                    Recommendation
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 uppercase tracking-wide">
                      {result.policy?.outcome}
                    </span>
                  </h2>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-accent-ai">
                    {titleCase(recommendation.option)}
                  </span>
                </div>
                <p className="mt-3 text-text-primary">{recommendation.reasoning}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-text-secondary">Confidence (Input Completeness & Trustworthiness - not chance of success)</span>
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

          {result?.decision?.tradeoffs && result.decision.tradeoffs.length > 0 && (
            <article className="card p-6 space-y-4">
              <h2 className="text-xl font-medium text-text-primary">Trade-offs</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.decision.tradeoffs.map((t, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4">
                    <h3 className="font-medium text-text-primary">{titleCase(t.option)}</h3>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-green-700">Gains</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-text-secondary">
                          {t.gains.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-red-700">Costs</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-text-secondary">
                          {t.costs.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

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
            <h2 className="text-xl font-medium text-text-primary">Explanation</h2>

            <h3 className="text-lg font-medium text-text-primary mt-4">Confirmed facts</h3>
            {assessment.evidence.filter(e => e.source === 'user-confirmed' || e.source === 'provided').length > 0 ? (
              <div className="space-y-3">
                {assessment.evidence.filter(e => e.source === 'user-confirmed' || e.source === 'provided').map((item, index) => {
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
              <p className="text-sm text-text-secondary">No confirmed facts.</p>
            )}

            <h3 className="text-lg font-medium text-text-primary mt-4">Derived context</h3>
            {assessment.evidence.filter(e => e.source === 'calculated' || e.source === 'estimated' || e.source === 'context').length > 0 ? (
              <div className="space-y-3">
                {assessment.evidence.filter(e => e.source === 'calculated' || e.source === 'estimated' || e.source === 'context').map((item, index) => {
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
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">{item.explanation}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No derived context.</p>
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
              <h2 className="text-xl font-medium text-text-primary">Uncertainty</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-text-primary">Missing Data</h3>
                  {assessment.missingData.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                      {assessment.missingData.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-text-secondary">No missing data.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-text-primary">Invalid Inputs</h3>
                  {assessment.invalidInputs.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                      {assessment.invalidInputs.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-text-secondary">No invalid inputs.</p>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>
      )}
</div>
  );
}

export default DecisionsPage;
