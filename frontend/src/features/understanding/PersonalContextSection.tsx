import { useState } from 'react';
import type {
  Goal,
  Commitment,
  Preference,
  DecisionQuery,
  ObservationSource,
} from '../../types/domain';
import { formatShortDate } from './understanding-utils';
import { AllContextEmptyState } from './AllContextEmptyState';

interface PersonalContextSectionProps {
  goals: Goal[];
  commitments: Commitment[];
  preferences: Preference[];
  recentDecisions: DecisionQuery[];
  onConfirm: (attributeId: string) => Promise<void>;
  onCorrect: (params: { attributeId: string; type: 'goal' | 'commitment' | 'preference'; rawValue: string }) => Promise<void>;
}

type AccordionGroupKey = 'goals' | 'commitments' | 'preferences' | 'decisions';

export function PersonalContextSection({
  goals,
  commitments,
  preferences,
  recentDecisions,
  onConfirm,
  onCorrect,
}: PersonalContextSectionProps) {
  // Mobile accordion: only one group open at a time
  const [openGroup, setOpenGroup] = useState<AccordionGroupKey | null>('goals');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  // Correction editor state
  const [editingItem, setEditingItem] = useState<{
    id: string;
    attributeId: string;
    type: 'goal' | 'commitment' | 'preference';
    currentValue: string;
    error: string | null;
  } | null>(null);
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleHide = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartEdit = (
    id: string,
    attributeId: string,
    type: 'goal' | 'commitment' | 'preference',
    currentValue: string
  ) => {
    setActionError(null);
    setEditingItem({
      id,
      attributeId,
      type,
      currentValue,
      error: null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const trimmed = editingItem.currentValue.trim();
    if (!trimmed) {
      setEditingItem((prev) => (prev ? { ...prev, error: 'Value cannot be empty' } : null));
      return;
    }

    try {
      setIsSavingCorrection(true);
      setEditingItem((prev) => (prev ? { ...prev, error: null } : null));
      await onCorrect({
        attributeId: editingItem.attributeId,
        type: editingItem.type,
        rawValue: trimmed,
      });
      setEditingItem(null);
    } catch (err) {
      setEditingItem((prev) =>
        prev ? { ...prev, error: err instanceof Error ? err.message : 'Failed to save correction' } : null
      );
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleConfirmItem = async (attributeId: string) => {
    if (!attributeId) return;
    try {
      setActionError(null);
      setActionInProgress(attributeId);
      await onConfirm(attributeId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to confirm item');
    } finally {
      setActionInProgress(null);
    }
  };

  const renderSourceBadge = (source?: ObservationSource, confidence?: number) => {
    if (!source) return null;

    const badges: Record<string, { label: string; cls: string }> = {
      USER_CONFIRMED: { label: 'User Confirmed', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      SYSTEM_INFERRED: { label: 'AI Inferred', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
      CALENDAR: { label: 'From Calendar', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
      SYSTEM_OBSERVED: { label: 'Observed', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
      HISTORICAL_PATTERN: { label: 'Historical Pattern', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
      EXTERNAL_SOURCE: { label: 'External Source', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
    };

    const badge = badges[source] ?? { label: source, cls: 'bg-stone-100 text-stone-600 border-stone-200' };
    const confidenceText = confidence !== undefined && confidence < 1 ? ` · ${Math.round(confidence * 100)}%` : '';

    return (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badge.cls}`}>
        {badge.label}{confidenceText}
      </span>
    );
  };

  const isAllEmpty =
    goals.length === 0 &&
    commitments.length === 0 &&
    preferences.length === 0 &&
    recentDecisions.length === 0;

  // Filter items for local non-destructive hide
  const visibleGoals = goals.filter((g) => showHidden || !hiddenIds.has(g.id || g.attributeId || ''));
  const visibleCommitments = commitments.filter((c) => showHidden || !hiddenIds.has(c.id || c.attributeId || ''));
  const visiblePreferences = preferences.filter((p) => showHidden || !hiddenIds.has(p.id || p.attributeId || ''));
  const totalHidden = hiddenIds.size;

  const toggleAccordion = (group: AccordionGroupKey) => {
    setOpenGroup((prev) => (prev === group ? null : group));
  };

  return (
    <section
      aria-labelledby="personal-context-title"
      className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur transition-all sm:p-6 lg:p-7 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="personal-context-title" className="font-serif text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            Your Personal Context
          </h2>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Active declarations and verified habits currently guiding your recommendations.
          </p>
        </div>

        {totalHidden > 0 && !isAllEmpty && (
          <button
            type="button"
            onClick={() => setShowHidden((prev) => !prev)}
            className="self-start sm:self-auto rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-100"
          >
            {showHidden ? 'Hide Hidden' : `Show Hidden (${totalHidden})`}
          </button>
        )}
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
          {actionError}
        </div>
      )}

      {/* Editor Modal / Inline Dialog */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="correction-dialog-title"
          className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-4 shadow-md sm:p-5"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 id="correction-dialog-title" className="text-sm font-bold text-stone-900 capitalize">
              Correct {editingItem.type}
            </h3>
            <button
              onClick={() => setEditingItem(null)}
              className="text-stone-400 hover:text-stone-600"
              aria-label="Cancel editing"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="correction-input" className="block text-xs font-medium text-stone-700">
                Corrected Value
              </label>
              <textarea
                id="correction-input"
                rows={2}
                value={editingItem.currentValue}
                onChange={(e) =>
                  setEditingItem((prev) => (prev ? { ...prev, currentValue: e.target.value, error: null } : null))
                }
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs text-stone-900 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                autoFocus
              />
              {editingItem.error && (
                <p className="mt-1 text-[11px] text-rose-600">{editingItem.error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                disabled={isSavingCorrection}
                className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingCorrection}
                className="rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-60"
              >
                {isSavingCorrection ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* When user has no context data at all, place onboarding guidance here while preserving the ordered section */}
      {isAllEmpty ? (
        <AllContextEmptyState />
      ) : (
        /* Groups Container: On desktop/tablet displayed as 2-column card grid; on mobile accessible accordion with one group open at a time */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Group 1: Active Goals */}
          <div className="rounded-2xl border border-stone-200/70 bg-stone-50/30 p-4">
            <button
              type="button"
              id="accordion-header-goals"
              aria-expanded={openGroup === 'goals'}
              aria-controls="accordion-panel-goals"
              onClick={() => toggleAccordion('goals')}
              className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                <h3 className="font-serif text-base font-bold text-stone-900">Active Goals</h3>
                <span className="text-xs text-stone-500">({visibleGoals.length})</span>
              </div>
              <span className="text-xs text-stone-400 md:hidden" aria-hidden="true">
                {openGroup === 'goals' ? '−' : '+'}
              </span>
            </button>

            <div
              id="accordion-panel-goals"
              role="region"
              aria-labelledby="accordion-header-goals"
              className={`mt-3 space-y-3 ${openGroup === 'goals' ? 'block' : 'hidden md:block'}`}
            >
              {visibleGoals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500 bg-white">
                  No active goals listed.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleGoals.map((goal) => {
                    const itemId = goal.id || goal.attributeId || 'goal';
                    const isHidden = hiddenIds.has(itemId);
                    const isConfirmed = goal.source === 'USER_CONFIRMED';
                    const isCalendar = goal.source === 'CALENDAR';
                    const isInferred = goal.source === 'SYSTEM_INFERRED' || goal.source === 'HISTORICAL_PATTERN';
                    const canConfirm = Boolean(goal.attributeId && isInferred && !isConfirmed && !isCalendar);
                    const canEdit = Boolean(goal.attributeId && !isConfirmed && !isCalendar);

                    return (
                      <article
                        key={itemId}
                        className={`group relative rounded-xl border p-3.5 transition-all ${
                          isHidden
                            ? 'border-stone-200/50 bg-stone-50/50 opacity-60'
                            : 'border-stone-200/80 bg-white shadow-2xs hover:border-amber-300/70 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isInferred && (
                                <span className="text-[11px] font-semibold text-purple-700">AI believes:</span>
                              )}
                              <h4 className="font-medium text-stone-900 truncate text-sm">{goal.description}</h4>
                            </div>

                            {goal.deadline && (
                              <p className="mt-1 text-[11px] text-stone-500">
                                Deadline: {formatShortDate(typeof goal.deadline === 'string' ? goal.deadline.slice(0, 10) : goal.deadline.toISOString().slice(0, 10))}
                              </p>
                            )}
                          </div>

                          {goal.priority && (
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                goal.priority === 'high'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {goal.priority}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {renderSourceBadge(goal.source, goal.confidence)}
                            {goal.observedAt && (
                              <span className="text-stone-400">Observed: {formatShortDate(goal.observedAt.slice(0, 10))}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            {canConfirm && (
                              <button
                                type="button"
                                onClick={() => handleConfirmItem(goal.attributeId!)}
                                disabled={actionInProgress === goal.attributeId}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {actionInProgress === goal.attributeId ? '...' : '✓ Confirm'}
                              </button>
                            )}

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(itemId, goal.attributeId!, 'goal', goal.description)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleHide(itemId)}
                              className="rounded-lg px-2 py-1 text-[11px] font-medium text-stone-400 hover:text-stone-700"
                              title={isHidden ? 'Unhide item' : 'Hide from view locally'}
                            >
                              {isHidden ? 'Unhide' : 'Hide'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Group 2: Active Commitments */}
          <div className="rounded-2xl border border-stone-200/70 bg-stone-50/30 p-4">
            <button
              type="button"
              id="accordion-header-commitments"
              aria-expanded={openGroup === 'commitments'}
              aria-controls="accordion-panel-commitments"
              onClick={() => toggleAccordion('commitments')}
              className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-500" aria-hidden="true" />
                <h3 className="font-serif text-base font-bold text-stone-900">Active Commitments</h3>
                <span className="text-xs text-stone-500">({visibleCommitments.length})</span>
              </div>
              <span className="text-xs text-stone-400 md:hidden" aria-hidden="true">
                {openGroup === 'commitments' ? '−' : '+'}
              </span>
            </button>

            <div
              id="accordion-panel-commitments"
              role="region"
              aria-labelledby="accordion-header-commitments"
              className={`mt-3 space-y-3 ${openGroup === 'commitments' ? 'block' : 'hidden md:block'}`}
            >
              {visibleCommitments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500 bg-white">
                  No commitments scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleCommitments.map((comm) => {
                    const itemId = comm.id || comm.attributeId || 'commitment';
                    const isHidden = hiddenIds.has(itemId);
                    const isConfirmed = comm.source === 'USER_CONFIRMED';
                    const isCalendar = comm.source === 'CALENDAR';
                    const isInferred = comm.source === 'SYSTEM_INFERRED' || comm.source === 'HISTORICAL_PATTERN';
                    const canConfirm = Boolean(comm.attributeId && isInferred && !isConfirmed && !isCalendar);
                    const canEdit = Boolean(comm.attributeId && !isConfirmed && !isCalendar);

                    return (
                      <article
                        key={itemId}
                        className={`group relative rounded-xl border p-3.5 transition-all ${
                          isHidden
                            ? 'border-stone-200/50 bg-stone-50/50 opacity-60'
                            : 'border-stone-200/80 bg-white shadow-2xs hover:border-rose-300/70 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isInferred && (
                                <span className="text-[11px] font-semibold text-purple-700">AI believes:</span>
                              )}
                              <h4 className="font-medium text-stone-900 truncate text-sm">{comm.description}</h4>
                            </div>

                            {comm.startTime && (
                              <p className="mt-1 text-[11px] text-stone-500 font-mono">
                                {comm.startTime.slice(0, 10)} {comm.startTime.slice(11, 16)} - {comm.endTime?.slice(11, 16)}
                              </p>
                            )}
                          </div>

                          {comm.recurring && (
                            <span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              RECURRING
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {renderSourceBadge(comm.source, comm.confidence)}
                            {comm.observedAt && (
                              <span className="text-stone-400">Observed: {formatShortDate(comm.observedAt.slice(0, 10))}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            {canConfirm && (
                              <button
                                type="button"
                                onClick={() => handleConfirmItem(comm.attributeId!)}
                                disabled={actionInProgress === comm.attributeId}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {actionInProgress === comm.attributeId ? '...' : '✓ Confirm'}
                              </button>
                            )}

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(itemId, comm.attributeId!, 'commitment', comm.description)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleHide(itemId)}
                              className="rounded-lg px-2 py-1 text-[11px] font-medium text-stone-400 hover:text-stone-700"
                              title={isHidden ? 'Unhide item' : 'Hide from view locally'}
                            >
                              {isHidden ? 'Unhide' : 'Hide'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Group 3: Preferences */}
          <div className="rounded-2xl border border-stone-200/70 bg-stone-50/30 p-4">
            <button
              type="button"
              id="accordion-header-preferences"
              aria-expanded={openGroup === 'preferences'}
              aria-controls="accordion-panel-preferences"
              onClick={() => toggleAccordion('preferences')}
              className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-teal-500" aria-hidden="true" />
                <h3 className="font-serif text-base font-bold text-stone-900">Preferences</h3>
                <span className="text-xs text-stone-500">({visiblePreferences.length})</span>
              </div>
              <span className="text-xs text-stone-400 md:hidden" aria-hidden="true">
                {openGroup === 'preferences' ? '−' : '+'}
              </span>
            </button>

            <div
              id="accordion-panel-preferences"
              role="region"
              aria-labelledby="accordion-header-preferences"
              className={`mt-3 space-y-3 ${openGroup === 'preferences' ? 'block' : 'hidden md:block'}`}
            >
              {visiblePreferences.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500 bg-white">
                  No preferences defined yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {visiblePreferences.map((pref) => {
                    const itemId = pref.id || pref.attributeId || 'pref';
                    const isHidden = hiddenIds.has(itemId);
                    const isConfirmed = pref.source === 'USER_CONFIRMED';
                    const isCalendar = pref.source === 'CALENDAR';
                    const isInferred = pref.source === 'SYSTEM_INFERRED' || pref.source === 'HISTORICAL_PATTERN';
                    const canConfirm = Boolean(pref.attributeId && isInferred && !isConfirmed && !isCalendar);
                    const canEdit = Boolean(pref.attributeId && !isConfirmed && !isCalendar);

                    return (
                      <article
                        key={itemId}
                        className={`group relative rounded-xl border p-3.5 transition-all ${
                          isHidden
                            ? 'border-stone-200/50 bg-stone-50/50 opacity-60'
                            : 'border-stone-200/80 bg-white shadow-2xs hover:border-teal-300/70 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-teal-900 bg-teal-50 px-2 py-0.5 rounded">
                                {pref.category}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-stone-600">
                              {isInferred && <span className="font-semibold text-purple-700 mr-1">AI believes:</span>}
                              {pref.description}
                            </p>

                            <div className="mt-2 rounded-lg bg-stone-50 p-2 font-mono text-xs text-stone-800 border border-stone-100">
                              {pref.value}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {renderSourceBadge(pref.source, pref.confidence)}
                            {pref.observedAt && (
                              <span className="text-stone-400">Observed: {formatShortDate(pref.observedAt.slice(0, 10))}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            {canConfirm && (
                              <button
                                type="button"
                                onClick={() => handleConfirmItem(pref.attributeId!)}
                                disabled={actionInProgress === pref.attributeId}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {actionInProgress === pref.attributeId ? '...' : '✓ Confirm'}
                              </button>
                            )}

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(itemId, pref.attributeId!, 'preference', pref.value)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleHide(itemId)}
                              className="rounded-lg px-2 py-1 text-[11px] font-medium text-stone-400 hover:text-stone-700"
                              title={isHidden ? 'Unhide item' : 'Hide from view locally'}
                            >
                              {isHidden ? 'Unhide' : 'Hide'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Group 4: Recent Decisions */}
          <div className="rounded-2xl border border-stone-200/70 bg-stone-50/30 p-4">
            <button
              type="button"
              id="accordion-header-decisions"
              aria-expanded={openGroup === 'decisions'}
              aria-controls="accordion-panel-decisions"
              onClick={() => toggleAccordion('decisions')}
              className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-purple-500" aria-hidden="true" />
                <h3 className="font-serif text-base font-bold text-stone-900">Recent Decisions</h3>
                <span className="text-xs text-stone-500">({recentDecisions.length})</span>
              </div>
              <span className="text-xs text-stone-400 md:hidden" aria-hidden="true">
                {openGroup === 'decisions' ? '−' : '+'}
              </span>
            </button>

            <div
              id="accordion-panel-decisions"
              role="region"
              aria-labelledby="accordion-header-decisions"
              className={`mt-3 space-y-3 ${openGroup === 'decisions' ? 'block' : 'hidden md:block'}`}
            >
              {recentDecisions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500 bg-white">
                  No decisions logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDecisions.map((dec, i) => (
                    <div
                      key={`decision-${dec.id || i}`}
                      className="rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-2xs"
                    >
                      <p className="font-medium text-stone-900 text-xs sm:text-sm">{dec.question}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-100 pt-2">
                        <span>{dec.timestamp ? formatShortDate(dec.timestamp.slice(0, 10)) : 'Recent'}</span>
                        <span className="rounded bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Evaluated</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
