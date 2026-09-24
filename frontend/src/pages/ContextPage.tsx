import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import type { PersonalContext, UnderstandingHistoryResponse } from '../types/domain';
import { UnderstandingHeader } from '../features/understanding/UnderstandingHeader';
import { UnderstandingKpiCards } from '../features/understanding/UnderstandingKpiCards';
import { UnderstandingEvolutionChart } from '../features/understanding/UnderstandingEvolutionChart';
import { ContextByCategory } from '../features/understanding/ContextByCategory';
import { WhatFutureMeLearned } from '../features/understanding/WhatFutureMeLearned';
import { FocusPatternsCard } from '../features/understanding/FocusPatternsCard';
import { PersonalContextSection } from '../features/understanding/PersonalContextSection';
import { CalendarDataSourcesCard } from '../features/understanding/CalendarDataSourcesCard';
import { UnderstandingFooter } from '../features/understanding/UnderstandingFooter';
import { UnderstandingSkeleton } from '../features/understanding/UnderstandingSkeleton';
import { UnderstandingErrorState } from '../features/understanding/UnderstandingErrorState';

export function ContextPage() {
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [history, setHistory] = useState<UnderstandingHistoryResponse | null>(null);
  const [selectedDays, setSelectedDays] = useState<7 | 30 | 90>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 480) {
      return 7;
    }
    return 30;
  });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);
  const lastRequestedDaysRef = useRef<7 | 30 | 90>(30);

  // Main data loader for retry
  const reloadData = useCallback(async (days: 7 | 30 | 90) => {
    try {
      const [contextData, historyData] = await Promise.all([
        api.context.getCurrent(),
        api.context.getHistory(days),
      ]);
      setContext(contextData);
      setHistory(historyData);
      setSelectedDays(historyData.days);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load understanding data');
    } finally {
      setLoading(false);
    }
  }, []);

  // History range switch loader with request sequence to prevent stale/out-of-order responses
  const handleRangeChange = async (days: 7 | 30 | 90) => {
    lastRequestedDaysRef.current = days;
    const currentSeq = ++requestSeqRef.current;
    setHistoryLoading(true);
    setHistoryError(null);

    // Never relabel old data as the new range ahead of time!
    try {
      const updatedHistory = await api.context.getHistory(days);
      if (currentSeq !== requestSeqRef.current) return;
      setHistory(updatedHistory);
      setSelectedDays(updatedHistory.days);
    } catch (err) {
      if (currentSeq !== requestSeqRef.current) return;
      setHistoryError(err instanceof Error ? err.message : `Failed to load ${days}d history`);
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setHistoryLoading(false);
      }
    }
  };

  const handleRetryRange = () => {
    void handleRangeChange(lastRequestedDaysRef.current);
  };

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const daysToLoad = typeof window !== 'undefined' && window.innerWidth < 480 ? 7 : 30;
    lastRequestedDaysRef.current = daysToLoad;

    async function init() {
      try {
        const [contextData, historyData] = await Promise.all([
          api.context.getCurrent(),
          api.context.getHistory(daysToLoad),
        ]);
        if (ignore || controller.signal.aborted) return;
        setContext(contextData);
        setHistory(historyData);
        setSelectedDays(historyData.days);
        setError(null);
      } catch (err) {
        if (ignore || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load understanding data');
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  // Actions
  const handleConfirm = async (attributeId: string) => {
    if (!attributeId) return;
    await api.context.confirm(attributeId);
    // Reload active context to reflect updated source
    const updated = await api.context.getCurrent();
    setContext(updated);
  };

  const handleCorrect = async ({
    attributeId,
    type,
    rawValue,
  }: {
    attributeId: string;
    type: 'goal' | 'commitment' | 'preference';
    rawValue: string;
  }) => {
    if (!attributeId) return;

    const correctedValue =
      type === 'preference'
        ? JSON.stringify({ value: rawValue })
        : rawValue;

    await api.context.correct({
      attributeId,
      correctedValue,
      reason: 'User correction',
    });

    // Reload active context to reflect corrected value
    const updated = await api.context.getCurrent();
    setContext(updated);
  };

  if (loading) {
    return <UnderstandingSkeleton />;
  }

  if (error) {
    return (
      <UnderstandingErrorState
        error={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          void reloadData(lastRequestedDaysRef.current);
        }}
      />
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 space-y-7 text-stone-900">
      {/* 1. Header first: title, one-line description, sync status, last updated */}
      <UnderstandingHeader
        calendar={context?.calendar}
        lastUpdated={context?.lastUpdated}
      />

      {/* 2. Exactly THREE KPI cards: Active Goals, Commitments, Preferences. No Decisions KPI. */}
      <UnderstandingKpiCards context={context} />

      {/* 3. Understanding Evolution full width */}
      <UnderstandingEvolutionChart
        history={history}
        selectedDays={selectedDays}
        onRangeChange={handleRangeChange}
        isLoading={historyLoading}
        rangeError={historyError}
        onRetryRange={handleRetryRange}
      />

      {/* 4. A two-card row: LEFT Context by Category, RIGHT What Future Me Learned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">
        <ContextByCategory context={context} history={history} />
        <WhatFutureMeLearned context={context} history={history} />
      </div>

      {/* 5. Your Focus Patterns full width after that row */}
      <FocusPatternsCard />

      {/* 6. Your Personal Context after Focus (onboarding guidance inside if all context empty) */}
      <PersonalContextSection
        goals={context?.goals ?? []}
        commitments={context?.commitments ?? []}
        preferences={context?.preferences ?? []}
        recentDecisions={context?.recentDecisions ?? []}
        onConfirm={handleConfirm}
        onCorrect={handleCorrect}
      />

      {/* 7. Calendar Overview / Data Sources last before footer */}
      <CalendarDataSourcesCard calendar={context?.calendar} />

      {/* 8. Restrained warm footer */}
      <UnderstandingFooter />
    </div>
  );
}

export default ContextPage;
