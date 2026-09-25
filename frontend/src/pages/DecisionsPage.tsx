import { useState, useEffect, type FormEvent } from 'react';
import { decisionsApi, contextApi, api } from '../api/client';
import type { DecisionApiRequest, DecisionApiResponse, ContextUpdateObservation, ObservationSource } from '../types/domain';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from '../components/InterventionCard';
import { demoLocalDateTimeToIso, nextDemoDayAt } from '../utils/demo-time';

interface DemoForm {
  userId: string;
  question: string;
  target: string;
  deadline: string;
  proposedStart: string;
  proposedEnd: string;
  timeCostHours: string;
  availableHoursBeforeDeadline: string;
  workloadHoursBeforeDeadline: string;
  energyCost: string;
  availableEnergy: string;
  goalRelevance: 'low' | 'medium' | 'high';
  priority: '' | 'low' | 'medium' | 'high';
  flexibility: '' | 'fixed' | 'movable' | 'optional';
  focusRequirement: '' | 'high' | 'medium' | 'low';
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
  proposedStart: '',
  proposedEnd: '',
  timeCostHours: '',
  availableHoursBeforeDeadline: '',
  workloadHoursBeforeDeadline: '',
  energyCost: '',
  availableEnergy: '',
  goalRelevance: 'medium',
  priority: '',
  flexibility: '',
  focusRequirement: '',
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

    let proposedStart: string | undefined;
    let proposedEnd: string | undefined;
    try {
      proposedStart = form.proposedStart ? demoLocalDateTimeToIso(form.proposedStart) : undefined;
      proposedEnd = form.proposedEnd ? demoLocalDateTimeToIso(form.proposedEnd) : undefined;
    } catch {
      setError('Enter valid proposed dates and times.');
      return;
    }

    const request: DecisionApiRequest = {
      query: {
        question,
        impactProfile: {
          target: form.target.trim() || undefined,
          deadline: form.deadline || undefined,
          proposedStart,
          proposedEnd,
          timeCostHours: timeCost,
          availableHoursBeforeDeadline: availableHours,
          workloadHoursBeforeDeadline: workloadHours,
          energyCost: energyCost,
          availableEnergy: availableEnergy,
          goalRelevance: form.goalRelevance,
          priority: form.priority || undefined,
          flexibility: form.flexibility || undefined,
          focusRequirement: form.focusRequirement || undefined,
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
        await decisionsApi.recordChoice(decisionId, 'accept', `Accepted recommendation: ${option}`);
      }
      // Scheduling intent heuristic
      const isSchedulingIntent = /reserve|schedule|block|add.*session|focus.*time|time.*for|set aside/i.test(question);
      if (isSchedulingIntent && option !== 'do-not-proceed') {
        const tomorrow = nextDemoDayAt(9);
        const tomorrowEnd = nextDemoDayAt(11);
        await api.calendar.createEvent({
          title: `Focus: ${question.slice(0, 60)}`,
          startTime: tomorrow.toISOString(),
          endTime: tomorrowEnd.toISOString(),
          category: 'deep_work',
          note: `AI-recommended. Decision: ${option}`,
          decisionId,
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
        await decisionsApi.recordChoice(decisionId, 'decline', `Rejected recommendation: ${option}`);
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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-surface-border bg-white/80 backdrop-blur-sm px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-violet-600">
            <span className="text-xs font-bold text-white">FM</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Future Me</p>
            <p className="text-[11px] text-text-secondary">Capacity advisor · always thinking ahead</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasStaleContext && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Context updated</span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-surface-border bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-hover"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowObservationForm(!showObservationForm)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${showObservationForm ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-surface-border bg-white text-text-secondary hover:bg-surface-hover'}`}
          >
            {showObservationForm ? '✕ Close' : '＋ Add Context Change'}
          </button>
        </div>
      </div>

      {/* ── Intervention banner ───────────────────────────────── */}
      {intervention && (
        <div className="shrink-0 px-6 pt-3">
          <InterventionCard intervention={intervention} onRespond={respond} onDismiss={dismiss} />
        </div>
      )}

      {/* ── Messages area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* Welcome message when no result yet */}
        {!result && !isLoading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 mt-0.5">
              <span className="text-xs font-bold text-violet-700">FM</span>
            </div>
            <div className="rounded-2xl rounded-tl-none bg-white border border-surface-border px-4 py-3 shadow-sm max-w-xl">
              <p className="text-sm font-semibold text-text-primary mb-1">Hey, I'm Future Me.</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Tell me what you're thinking of doing — I'll check it against your calendar, workload, and energy to help you decide whether to say yes.
              </p>
            </div>
          </div>
        )}

        {/* User question bubble */}
        {form.question && result && (
          <div className="flex justify-end gap-3">
            <div className="rounded-2xl rounded-tr-none bg-violet-600 px-4 py-3 text-sm text-white max-w-xl shadow-sm">
              <p>{form.question}</p>
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-200 mt-0.5">
              <span className="text-xs font-bold text-violet-800">You</span>
            </div>
          </div>
        )}

        {/* Loading bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 mt-0.5">
              <span className="text-xs font-bold text-violet-700">FM</span>
            </div>
            <div className="rounded-2xl rounded-tl-none bg-white border border-surface-border px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 mt-0.5">
              <span className="text-xs font-bold text-red-600">!</span>
            </div>
            <div className="rounded-2xl rounded-tl-none bg-red-50 border border-red-100 px-4 py-3 shadow-sm max-w-xl">
              <p className="text-sm font-medium text-red-800">Request failed</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stale context + reassess */}
        {hasStaleContext && result && (
          <div role="status" className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 mt-0.5">
              <span className="text-xs font-bold text-amber-700">!</span>
            </div>
            <div className="rounded-2xl rounded-tl-none bg-amber-50 border border-amber-200 px-4 py-3 shadow-sm max-w-xl space-y-3">
              <p className="text-sm font-medium text-amber-900">Context changed. Your current result is stale.</p>
              <button
                type="button"
                onClick={handleReassessSameDecision}
                disabled={isLoading}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Re-assess same decision
              </button>
            </div>
          </div>
        )}

        {/* ASK – clarification needed */}
        {result?.policy?.outcome === 'ASK' && (
          <div className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 mt-0.5">
              <span className="text-xs font-bold text-violet-700">FM</span>
            </div>
            <form className="rounded-2xl rounded-tl-none bg-white border border-violet-200 px-4 py-4 shadow-sm max-w-xl space-y-4" onSubmit={handleClarificationSubmit}>
              <p className="text-sm font-semibold text-text-primary">Needs your input</p>
              <p className="text-sm text-text-secondary">{result.policy?.reason || 'A few details would help me give a better answer.'}</p>

              {result.policy.unresolvedMaterialFields && result.policy.unresolvedMaterialFields.length > 0 && (
                <div className="space-y-3">
                  {result.policy.unresolvedMaterialFields.map((field) => {
                    const def = FIELD_DEFINITIONS[field] || { label: field, type: 'text' };
                    return (
                      <label key={field} className="block text-xs text-text-secondary">
                        {def.label}
                        <input
                          type={def.type}
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          aria-label={field}
                          value={clarificationAnswers[field] || ''}
                          onChange={(event) => setClarificationAnswers(prev => ({ ...prev, [field]: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-400"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {result.policy.unresolvedMaterialConflicts && result.policy.unresolvedMaterialConflicts.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-800">Please resolve:</p>
                  <ul className="list-disc pl-4 text-xs text-amber-900 space-y-0.5">
                    {result.policy.unresolvedMaterialConflicts.map((conflict, idx) => (
                      <li key={idx}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
                  Re-assess with Clarifications
                </button>
                <button type="button" disabled={isLoading} onClick={() => submitWithClarification(true)} className="rounded-xl border border-surface-border bg-white px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-50">
                  I'm not sure / continue without resolving
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ABSTAIN */}
        {result?.policy?.outcome === 'ABSTAIN' && (
          <div className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 mt-0.5">
              <span className="text-xs font-bold text-slate-500">FM</span>
            </div>
            <div className="rounded-2xl rounded-tl-none bg-white border border-surface-border px-4 py-3 shadow-sm max-w-xl">
              <p className="text-sm font-semibold text-text-primary mb-1">Cannot recommend yet</p>
              <p className="text-sm text-text-secondary">{result.policy?.reason}</p>
            </div>
          </div>
        )}

        {/* Before/After comparison */}
        {beforeResult && result && (
          <div className="flex gap-3 max-w-3xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
              <span className="text-xs font-bold text-blue-600">Δ</span>
            </div>
            <article className={`rounded-2xl rounded-tl-none border px-4 py-4 shadow-sm w-full ${hasChangedRecommendation ? 'border-green-200 bg-green-50' : 'border-blue-100 bg-blue-50'}`}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3 ${hasChangedRecommendation ? 'text-green-700' : 'text-blue-700'}">
                Assessment Updated — {hasChangedRecommendation ? 'Recommendation changed' : 'Recommendation unchanged'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/70 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Before</p>
                  <p className="text-sm font-semibold text-text-primary">{titleCase(beforeResult.policy.outcome)} — {titleCase(beforeRecommendation?.option || '')}</p>
                  <p className="mt-1 text-xs text-text-secondary">{beforeRecommendation?.reasoning || beforeResult.policy.reason}</p>
                </div>
                <div className={`rounded-xl p-3 border ${hasChangedRecommendation ? 'bg-green-100/60 border-green-300' : 'bg-blue-100/60 border-blue-300'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 ${hasChangedRecommendation ? 'text-green-700' : 'text-blue-700'}">After</p>
                  <p className="text-sm font-semibold">{titleCase(result.policy?.outcome)} — {titleCase(recommendation?.option || '')}</p>
                  <p className="mt-1 text-xs">{recommendation?.reasoning || result.policy?.reason}</p>
                </div>
              </div>
              {(changedEvidence.length > 0 || removedEvidence.length > 0) && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-text-secondary mb-1.5">Evidence delta:</p>
                  <ul className="space-y-1 text-xs text-text-secondary list-disc pl-4">
                    {changedEvidence.map((ev) => {
                      const beforeEv = beforeAssessment?.evidence.find(be => be.fact === ev.fact);
                      return (
                        <li key={`evidence-current-${ev.fact}`}>
                          <span className="font-medium text-text-primary">{ev.fact}:</span>{' '}
                          {beforeEv ? `Changed from ${String(beforeEv.value)} (${beforeEv.source}) -> ${String(ev.value)} (${ev.source})` : `Added: ${String(ev.value)} (${ev.source})`}
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
              )}
            </article>
          </div>
        )}

        {/* RECOMMEND – main AI response bubble */}
        {result?.policy?.outcome === 'RECOMMEND' && recommendation && assessment && (
          <div className="space-y-4" aria-live="polite">

            {/* Choice bar */}
            {choiceState === 'none' || choiceState === 'pending' ? (
              <div className="flex gap-3 max-w-2xl">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">FM</span>
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white border border-violet-200 px-4 py-4 shadow-sm max-w-xl w-full space-y-4">

                  {/* Outcome header */}
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                      recommendation.option === 'proceed' ? 'bg-emerald-100 text-emerald-800' :
                      recommendation.option === 'proceed-with-caution' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {titleCase(recommendation.option)}
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800 self-center">
                      {result.policy?.outcome}
                    </span>
                    {result.state && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border cursor-help self-center ${personalStateClass(result.state.state).bg} ${personalStateClass(result.state.state).text} ${personalStateClass(result.state.state).border}`}
                        title={result.state.evidence.join('; ')}
                      >
                        {titleCase(result.state.state)}
                      </span>
                    )}
                  </div>

                  {/* Reasoning */}
                  <p className="text-sm leading-relaxed text-text-primary">{recommendation.reasoning}</p>

                  {/* Confidence bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary">Input completeness & trustworthiness</span>
                      <span className="text-xs font-bold text-text-primary">{confidencePercent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: confidencePercent + '%' }} />
                    </div>
                    <p className="text-[10px] text-text-secondary">Input Completeness &amp; Trustworthiness - not chance of success</p>
                  </div>

                  {/* Feasibility grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Feasibility', value: titleCase(assessment.feasibility), cls: feasibilityClass(assessment.feasibility) },
                      { label: 'Pressure', value: titleCase(assessment.deadlinePressure), cls: '' },
                      { label: 'Energy', value: titleCase(assessment.energyFit), cls: '' },
                      { label: 'Capacity', value: formatHours(assessment.projectedRemainingCapacityHours), cls: '' },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl px-2 py-2 text-center ${item.cls || 'bg-slate-50'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{item.label}</p>
                        <p className="mt-1 text-xs font-semibold text-text-primary truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* What will you do */}
                  <div className="border-t border-surface-border pt-3">
                    <p className="text-xs font-semibold text-emerald-800 mb-2">What will you do?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleAccept()}
                        disabled={choiceState === 'pending'}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {choiceState === 'pending' ? 'Saving...' : 'Accept & Add to Schedule'}
                      </button>
                      <button
                        onClick={() => void handleReject()}
                        disabled={choiceState === 'pending'}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Not now
                      </button>
                    </div>
                    {choiceError && <p className="mt-2 text-xs text-red-600">{choiceError}</p>}
                  </div>
                </div>
              </div>
            ) : choiceState === 'accepted' ? (
              <div className="flex gap-3 max-w-2xl">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                  <span className="text-xs font-bold text-emerald-700">✓</span>
                </div>
                <div className="rounded-2xl rounded-tl-none bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                  Choice recorded. If this was a scheduling request, the event was added to your calendar.
                  <button onClick={() => setChoiceState('none')} className="ml-3 text-xs underline underline-offset-2">Change</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 max-w-2xl">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 mt-0.5">
                  <span className="text-xs font-bold text-slate-500">–</span>
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600 shadow-sm">
                  Noted — no calendar change was made.
                  <button onClick={() => setChoiceState('none')} className="ml-3 text-xs underline underline-offset-2">Change mind</button>
                </div>
              </div>
            )}

            {/* Trade-offs */}
            {result?.decision?.tradeoffs && result.decision.tradeoffs.length > 0 && (
              <div className="flex gap-3 max-w-3xl">
                <div className="w-8 shrink-0" />
                <article className="rounded-2xl bg-white border border-surface-border px-4 py-4 shadow-sm w-full space-y-3">
                  <h2 className="text-sm font-semibold text-text-primary">Trade-offs</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.decision.tradeoffs.map((t, idx) => (
                      <div key={idx} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <h3 className="text-xs font-bold text-text-primary mb-2">{titleCase(t.option)}</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Gains</p>
                            <ul className="mt-1 list-disc pl-4 text-xs text-text-secondary space-y-0.5">
                              {t.gains.map((g, i) => <li key={i}>{g}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Costs</p>
                            <ul className="mt-1 list-disc pl-4 text-xs text-text-secondary space-y-0.5">
                              {t.costs.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            )}

            {/* Explanation – collapsible */}
            <details className="flex gap-3 max-w-3xl" open={false}>
              <summary className="ml-11 cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-800 select-none list-none flex items-center gap-1">
                <span>▸</span> Show full explanation
              </summary>
              <div className="mt-3 flex gap-3 max-w-3xl">
                <div className="w-8 shrink-0" />
                <article className="rounded-2xl bg-white border border-surface-border px-4 py-4 shadow-sm w-full space-y-4">

                  <h3 className="font-semibold text-sm text-text-primary">Confirmed facts</h3>
                  {assessment.evidence.filter(e => e.source === 'user-confirmed' || e.source === 'provided').length > 0 ? (
                    <div className="space-y-2">
                      {assessment.evidence.filter(e => e.source === 'user-confirmed' || e.source === 'provided').map((item, index) => {
                        const isChanged = changedEvidence.some(ce => ce.fact === item.fact);
                        return (
                          <div key={item.fact + index} className={`rounded-xl border p-3 ${isChanged ? 'border-green-300 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-text-primary">{item.fact}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-text-primary">{String(item.value)}</span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-text-secondary">{titleCase(item.source)}</span>
                                {isChanged && <span className="rounded bg-green-200 px-1.5 py-0.5 text-[10px] text-green-800 font-semibold">Updated</span>}
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">{item.explanation}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-xs text-text-secondary">No confirmed facts.</p>}

                  <h3 className="font-semibold text-sm text-text-primary">Derived context</h3>
                  {assessment.evidence.filter(e => e.source === 'calculated' || e.source === 'estimated' || e.source === 'context').length > 0 ? (
                    <div className="space-y-2">
                      {assessment.evidence.filter(e => e.source === 'calculated' || e.source === 'estimated' || e.source === 'context').map((item, index) => {
                        const isChanged = changedEvidence.some(ce => ce.fact === item.fact);
                        return (
                          <div key={item.fact + index} className={`rounded-xl border p-3 ${isChanged ? 'border-green-300 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-text-primary">{item.fact}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-text-primary">{String(item.value)}</span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-text-secondary">{titleCase(item.source)}</span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">{item.explanation}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-xs text-text-secondary">No derived context.</p>}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-sm text-text-primary mb-2">Assumptions</h3>
                      {assessment.assumptions.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 text-xs text-text-primary">
                          {assessment.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
                        </ul>
                      ) : <p className="text-xs text-text-secondary">No assumptions were reported.</p>}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-text-primary mb-2">Uncertainty</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-text-secondary">Missing Data</p>
                          {assessment.missingData.length > 0 ? (
                            <ul className="mt-1 list-disc pl-4 text-xs text-text-secondary space-y-0.5">
                              {assessment.missingData.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          ) : <p className="text-xs text-text-secondary mt-1">No missing data.</p>}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-secondary">Invalid Inputs</p>
                          {assessment.invalidInputs.length > 0 ? (
                            <ul className="mt-1 list-disc pl-4 text-xs text-text-secondary space-y-0.5">
                              {assessment.invalidInputs.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          ) : <p className="text-xs text-text-secondary mt-1">No invalid inputs.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </details>

          </div>
        )}

        {/* Observation form as inline chat bubble */}
        {showObservationForm && (
          <div className="flex gap-3 max-w-2xl">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 mt-0.5">
              <span className="text-xs">📋</span>
            </div>
            <form className="rounded-2xl rounded-tl-none bg-white border border-orange-200 px-4 py-4 shadow-sm max-w-xl w-full space-y-3" onSubmit={handleObservationSubmit}>
              <p className="text-sm font-semibold text-text-primary">Report Context Change</p>
              <p className="text-xs text-text-secondary">Report a change that affects your capacity or state.</p>

              <label className="block text-xs text-text-secondary">
                Change category
                <select
                  aria-label="Change category"
                  value={observationForm.category}
                  onChange={(event) => updateObservation('category', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="workload-increase">Workload increase</option>
                  <option value="energy-decrease">Energy decrease</option>
                  <option value="deadline-change">Deadline change</option>
                  <option value="disruption">Disruption</option>
                </select>
              </label>

              <label className="block text-xs text-text-secondary">
                Description
                <textarea
                  aria-label="Description"
                  value={observationForm.description}
                  onChange={(event) => updateObservation('description', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                  rows={2}
                  required
                />
              </label>

              <label className="block text-xs text-text-secondary">
                Severity
                <select
                  aria-label="Severity"
                  value={observationForm.severity}
                  onChange={(event) => updateObservation('severity', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Submit Observation
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ── Sticky input bar ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-surface-border bg-white/90 backdrop-blur-sm px-6 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          {/* Advanced inputs */}
          <details className="group">
            <summary className="cursor-pointer select-none text-xs font-semibold text-violet-500 hover:text-violet-700 list-none flex items-center gap-1 mb-2">
              <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
              Advanced Inputs
            </summary>
            <div className="grid gap-4 md:grid-cols-2 mt-3">
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
              Proposed start<span aria-hidden="true"> (Asia/Ho_Chi_Minh)</span>
              <input
                type="datetime-local"
                value={form.proposedStart}
                onChange={(event) => updateField('proposedStart', event.target.value)}
                className={inputClassName + ' mt-1'}
              />
            </label>

            <label className="text-sm text-text-secondary">
              Proposed end<span aria-hidden="true"> (Asia/Ho_Chi_Minh)</span>
              <input
                type="datetime-local"
                value={form.proposedEnd}
                onChange={(event) => updateField('proposedEnd', event.target.value)}
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
              Candidate priority
              <select
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value)}
                className={inputClassName + ' mt-1'}
              >
                <option value="">Not specified</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="text-sm text-text-secondary">
              Candidate flexibility
              <select
                value={form.flexibility}
                onChange={(event) => updateField('flexibility', event.target.value)}
                className={inputClassName + ' mt-1'}
              >
                <option value="">Not specified</option>
                <option value="fixed">Fixed</option>
                <option value="movable">Movable</option>
                <option value="optional">Optional</option>
              </select>
            </label>

            <label className="text-sm text-text-secondary">
              Focus requirement
              <select
                value={form.focusRequirement}
                onChange={(event) => updateField('focusRequirement', event.target.value)}
                className={inputClassName + ' mt-1'}
              >
                <option value="">Not specified</option>
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
          {/* Main input row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="decision-query" className="block text-xs font-semibold text-text-secondary mb-1.5">
                What decision do you need help with?
              </label>
              <textarea
                id="decision-query"
                value={form.question}
                onChange={(event) => updateField('question', event.target.value)}
                placeholder="e.g. Should I take on the client call tomorrow at 2pm?"
                className="w-full resize-none rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60"
                rows={2}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (form.question.trim()) e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="shrink-0 flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
              ) : (
                <span>↑</span>
              )}
              {isLoading ? 'Thinking…' : 'Ask Future Me'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default DecisionsPage;
