import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { InterventionCard } from '../components/InterventionCard';
import {
  DashboardHeader,
  DashboardInsightGrid,
  DeadlinesCard,
  EventDetailDialog,
  GanttCalendar,
  TaskTypeBubbleCard,
  UpcomingAndSuggestionsCard,
  type AllocationRange,
} from '../components/dashboard/DashboardComponents';
import { useInterventions } from '../hooks/useInterventions';
import type { CalendarEvent, CalendarStatusResponse, PersonalContext } from '../types/domain';
import {
  addDays,
  buildDashboardRange,
  buildDeadlines,
  buildSuggestions,
  calculateWorkload,
  filterEventsToRange,
  parseEventMetadata,
  startOfDay,
  startOfWeek,
  type WorkloadCategory,
} from './dashboard-utils';

function isWithin(value: Date, start: Date, end: Date): boolean {
  return value.getTime() >= start.getTime() && value.getTime() < end.getTime();
}

export function DashboardPage() {
  const [now] = useState(() => new Date());
  const dashboardBounds = useMemo(() => buildDashboardRange(now), [now]);
  const currentWeekStart = useMemo(() => startOfWeek(now), [now]);
  const boundStart = useMemo(() => startOfWeek(dashboardBounds.min), [dashboardBounds.min]);
  const boundEnd = useMemo(() => addDays(startOfWeek(dashboardBounds.max), 7), [dashboardBounds.max]);
  const [rangeStart, setRangeStart] = useState(currentWeekStart);
  const [allocationRange, setAllocationRange] = useState<AllocationRange>('this-week');
  const [selectedCategory, setSelectedCategory] = useState<WorkloadCategory | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [status, setStatus] = useState<CalendarStatusResponse | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { intervention, error: interventionError, refresh: refreshInterventions, respond, dismiss } = useInterventions();

  const loadData = useCallback(async (weekStart: Date, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const weekEnd = addDays(weekStart, 7);
      const [statusData, eventsData, contextData] = await Promise.all([
        api.calendar.getStatus(),
        api.calendar.getEvents({
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
        }),
        api.context.getCurrent(),
      ]);
      if (signal?.aborted) return;
      setStatus(statusData);
      setEvents(eventsData);
      setContext(contextData);
      setError(null);
    } catch (caught) {
      if (signal?.aborted) return;
      setError(caught instanceof Error ? caught.message : 'Failed to load dashboard data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadData(rangeStart, controller.signal);
    return () => controller.abort();
  }, [loadData, rangeStart]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await api.calendar.sync();
      await loadData(rangeStart);
      await refreshInterventions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const visibleDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(rangeStart, index)), [rangeStart]);
  const rangeEnd = useMemo(() => addDays(rangeStart, 7), [rangeStart]);
  const visibleEvents = useMemo(() => filterEventsToRange(events, rangeStart, rangeEnd), [events, rangeEnd, rangeStart]);
  const deadlines = useMemo(() => buildDeadlines(context, rangeStart, now), [context, now, rangeStart]);
  const suggestionNow = isWithin(now, rangeStart, rangeEnd) ? now : rangeStart;
  const suggestions = useMemo(
    () => buildSuggestions(visibleEvents, context, suggestionNow),
    [context, suggestionNow, visibleEvents],
  );

  const allocationEvents = useMemo(() => {
    if (allocationRange === 'today') {
      const today = startOfDay(now);
      return filterEventsToRange(events, today, addDays(today, 1));
    }
    if (allocationRange === 'next-week') {
      return filterEventsToRange(events, rangeEnd, addDays(rangeEnd, 7));
    }
    return visibleEvents;
  }, [allocationRange, events, now, rangeEnd, visibleEvents]);
  const allocation = useMemo(() => calculateWorkload(allocationEvents), [allocationEvents]);

  const upcomingMeeting = useMemo(() => {
    const anchor = isWithin(now, rangeStart, rangeEnd) ? now : rangeStart;
    return visibleEvents
      .filter((event) => parseEventMetadata(event).category === 'meeting' && new Date(event.endTime) > anchor)
      .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())[0] ?? null;
  }, [now, rangeEnd, rangeStart, visibleEvents]);

  const changeWeek = (amount: number) => {
    setRangeStart((current) => addDays(current, amount * 7));
    setSelectedCategory(null);
  };

  const canGoPrevious = addDays(rangeStart, -7).getTime() >= boundStart.getTime();
  const canGoNext = addDays(rangeEnd, 7).getTime() <= boundEnd.getTime();

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <DashboardHeader
        rangeStart={rangeStart}
        rangeEnd={addDays(rangeEnd, -1)}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={() => canGoPrevious && changeWeek(-1)}
        onNext={() => canGoNext && changeWeek(1)}
        onCurrentWeek={() => {
          setRangeStart(currentWeekStart);
          setSelectedCategory(null);
        }}
      />

      {(intervention || interventionError) && (
        <div className="mt-7">
          {interventionError && !intervention ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">Intervention check is temporarily unavailable.</p>
          ) : (
            <InterventionCard intervention={intervention} onRespond={respond} onDismiss={dismiss} />
          )}
        </div>
      )}

      <div className="mt-8 min-w-0">
        <GanttCalendar
          key={rangeStart.toISOString()}
          visibleDays={visibleDays}
          events={visibleEvents}
          status={status}
          syncing={syncing}
          selectedCategory={selectedCategory}
          onCategoryClear={() => setSelectedCategory(null)}
          onSync={() => void handleSync()}
          onEventOpen={setSelectedEvent}
          loading={loading}
          error={Boolean(error)}
          onRetry={() => void loadData(rangeStart)}
        />
      </div>

      <div className="mt-5">
        <DashboardInsightGrid>
          <DeadlinesCard deadlines={deadlines} loading={loading} error={Boolean(error)} onRetry={() => void loadData(rangeStart)} />
          <TaskTypeBubbleCard
            allocation={allocation}
            range={allocationRange}
            selectedCategory={selectedCategory}
            onRangeChange={setAllocationRange}
            onCategoryOpen={(category) => setSelectedCategory((current) => current === category ? null : category)}
            loading={loading}
            error={Boolean(error)}
            onRetry={() => void loadData(rangeStart)}
          />
          <UpcomingAndSuggestionsCard
            upcomingMeeting={upcomingMeeting}
            suggestions={suggestions}
            now={suggestionNow}
            loading={loading}
            error={Boolean(error)}
            onRetry={() => void loadData(rangeStart)}
          />
        </DashboardInsightGrid>
      </div>

      <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default DashboardPage;
