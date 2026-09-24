import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CalendarEvent, CalendarStatusResponse, PersonalContext } from '../types/domain';
import { InterventionCard } from '../components/InterventionCard';
import { useInterventions } from '../hooks/useInterventions';
import {
  addDays,
  buildDashboardRange,
  buildDeadlines,
  buildSuggestions,
  calculateWorkload,
  filterEventsToRange,
  parseEventMetadata,
  startOfDay,
  type WorkloadCategory,
} from './dashboard-utils';

const WORKDAY_START = 9;
const WORKDAY_END = 17;
const WORKDAY_HOURS = WORKDAY_END - WORKDAY_START;
const TIME_MARKERS = [9, 11, 14, 17];

const categoryLabels: Record<WorkloadCategory, string> = {
  deep_work: 'Deep work',
  meeting: 'Meetings',
  other: 'Recovery & other',
};

const categoryBadges = {
  deep_work: 'Focus',
  meeting: 'Join',
  deadline: 'Approved',
  recovery: 'Personal',
  other: 'Approved',
} as const;

const categoryStyles = {
  deep_work: 'border-violet-300 bg-violet-100 text-violet-950',
  meeting: 'border-cyan-300 bg-cyan-100 text-cyan-950',
  deadline: 'border-amber-300 bg-amber-100 text-amber-950',
  recovery: 'border-purple-200 bg-purple-50 text-purple-950',
  other: 'border-surface-border bg-surface-hover text-text-primary',
} as const;

function dateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

interface PositionedEvent {
  event: CalendarEvent;
  column: number;
  columnCount: number;
}

function layoutDayEvents(events: CalendarEvent[], day: Date): PositionedEvent[] {
  const laneEnds: number[] = [];
  const placements = events
    .filter((event) => eventPosition(event, day, 0, 1) !== null)
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
    .map((event) => {
      const start = new Date(event.startTime).getTime();
      const lane = laneEnds.findIndex((end) => end <= start);
      const column = lane === -1 ? laneEnds.length : lane;
      laneEnds[column] = new Date(event.endTime).getTime();
      return { event, column };
    });
  const columnCount = Math.max(1, laneEnds.length);
  const positionedById = new Map(
    placements.map((placement) => [placement.event.id, { ...placement, columnCount }]),
  );
  return events.map((event) => positionedById.get(event.id) ?? { event, column: 0, columnCount: 1 });
}

function eventPosition(event: CalendarEvent, day: Date, column: number, columnCount: number): CSSProperties | null {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const workdayStart = new Date(day);
  workdayStart.setHours(WORKDAY_START, 0, 0, 0);
  const workdayEnd = new Date(day);
  workdayEnd.setHours(WORKDAY_END, 0, 0, 0);
  const visibleStart = Math.max(start.getTime(), workdayStart.getTime());
  const visibleEnd = Math.min(end.getTime(), workdayEnd.getTime());
  if (visibleEnd <= visibleStart) return null;

  const top = ((visibleStart - workdayStart.getTime()) / (WORKDAY_HOURS * 3_600_000)) * 100;
  const naturalHeight = ((visibleEnd - visibleStart) / (WORKDAY_HOURS * 3_600_000)) * 100;
  const width = 100 / columnCount;
  return {
    '--event-top': `${top}%`,
    '--event-height': `${Math.min(100 - top, Math.max(4, naturalHeight))}%`,
    '--event-left': `calc(${column * width}% + 0.25rem)`,
    '--event-width': `calc(${width}% - 0.5rem)`,
  } as CSSProperties;
}

function CalendarEventCard({ event, day, column, columnCount }: PositionedEvent & { day: Date }) {
  const metadata = parseEventMetadata(event);
  const badge = categoryBadges[metadata.category];
  const position = eventPosition(event, day, column, columnCount);

  return (
    <article
      className={`mb-2 rounded-xl border p-3 shadow-sm ${position ? 'md:absolute md:mb-0 md:overflow-hidden md:[height:var(--event-height)] md:[left:var(--event-left)] md:[top:var(--event-top)] md:[width:var(--event-width)]' : 'md:hidden'} ${categoryStyles[metadata.category]}`}
      style={position ?? undefined}
      aria-label={`${event.title}, ${formatTime(event.startTime)} to ${formatTime(event.endTime)}, ${badge}`}
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{event.title}</h3>
          <p className="mt-0.5 text-xs opacity-75">
            {formatTime(event.startTime)}–{formatTime(event.endTime)}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {badge}
          </span>
        </div>
      </div>
    </article>
  );
}

function CalendarPage() {
  const [now] = useState(() => new Date());
  const dashboardBounds = useMemo(() => buildDashboardRange(now), [now]);
  const [rangeStart, setRangeStart] = useState(() => startOfDay(now));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [status, setStatus] = useState<CalendarStatusResponse | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { intervention, refresh: refreshInterventions, respond, dismiss } = useInterventions();

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [statusData, eventsData, contextData] = await Promise.all([
        api.calendar.getStatus(),
        api.calendar.getEvents(),
        api.context.getCurrent(),
      ]);
      if (signal?.aborted) return;
      setStatus(statusData);
      setEvents(eventsData);
      setContext(contextData);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initializeDashboard = async () => {
      await loadData(controller.signal);
    };
    void initializeDashboard();
    return () => controller.abort();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await api.calendar.sync();
      await loadData();
      await refreshInterventions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const visibleRange = useMemo(() => buildDashboardRange(rangeStart), [rangeStart]);
  const visibleDays = visibleRange.visibleDays;
  const rangeEnd = addDays(visibleDays[visibleDays.length - 1], 1);
  const visibleEvents = useMemo(
    () => filterEventsToRange(events, rangeStart, rangeEnd),
    [events, rangeEnd, rangeStart],
  );
  const workload = useMemo(() => calculateWorkload(visibleEvents), [visibleEvents]);
  const outOfHoursEvents = useMemo(
    () => visibleEvents.filter((event) => !visibleDays.some((day) => eventPosition(event, day, 0, 1))),
    [visibleDays, visibleEvents],
  );
  const sortedWorkload = useMemo(
    () => [...workload].sort((left, right) => right.hours - left.hours),
    [workload],
  );
  const deadlines = useMemo(() => buildDeadlines(context, rangeStart), [context, rangeStart]);
  const suggestions = useMemo(
    () => buildSuggestions(
      visibleEvents,
      context,
      now >= rangeStart && now < rangeEnd ? now : rangeStart,
    ),
    [context, now, rangeEnd, rangeStart, visibleEvents],
  );
  const upcomingMeetings = useMemo(
    () => visibleEvents.filter((event) => parseEventMetadata(event).category === 'meeting').slice(0, 2),
    [visibleEvents],
  );

  const rangeLabel = `${rangeStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${visibleDays[6].toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-8" aria-live="polite">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-hover" />
        <div className="mt-8 h-96 animate-pulse rounded-3xl bg-surface-hover" />
        <p className="sr-only">Loading calendar data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your week at a glance</p>
          <h1 className="mt-2 text-4xl font-serif text-text-primary">Your Week</h1>
          <p className="mt-2 max-w-2xl text-text-secondary">
            Your schedule, urgent work and the context Future Me has learned.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-text-secondary">
            Week starts
            <input
              type="date"
              value={dateInputValue(rangeStart)}
              min={dateInputValue(dashboardBounds.min)}
              max={dateInputValue(addDays(dashboardBounds.max, -7))}
              onChange={(event) => {
                const next = dateFromInput(event.target.value);
                if (next) {
                  setRangeStart(next);
                  setSelectedDayIndex(0);
                }
              }}
              className="mt-1 block rounded-xl border border-surface-border bg-surface px-3 py-2 text-text-primary"
            />
          </label>
          <div className="rounded-xl border border-surface-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary">
            {rangeLabel}
          </div>
          <button
            type="button"
            aria-label="Sync calendar"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync calendar'}
          </button>
        </div>
      </header>

      {intervention && (
        <InterventionCard intervention={intervention} onRespond={respond} onDismiss={dismiss} />
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-error/20 bg-error/10 p-4 text-error">
          Calendar could not sync: {error}
        </div>
      )}

      <section className="card overflow-hidden" aria-labelledby="calendar-title">
        <div className="flex flex-col gap-3 border-b border-surface-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="calendar-title" className="text-xl font-serif text-text-primary">Your week at a glance</h2>
            <p className="mt-1 text-sm text-text-secondary">Calendar events and protected focus time.</p>
          </div>
          <span className="text-sm font-medium text-text-secondary">
            {status?.status === 'synced' ? 'Synced with Calendar' : 'Calendar not yet synced'}
          </span>
        </div>

        <div role="region" aria-label="Weekly Gantt calendar" className="p-4 sm:p-5">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden" aria-label="Choose agenda day">
            {visibleDays.map((day, index) => (
              <button
                key={day.toISOString()}
                type="button"
                aria-pressed={selectedDayIndex === index}
                onClick={() => setSelectedDayIndex(index)}
                className={`min-w-14 rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                  selectedDayIndex === index ? 'bg-primary text-white' : 'bg-surface-hover text-text-secondary'
                }`}
              >
                <span className="block uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className="mt-1 block text-base">{day.getDate()}</span>
              </button>
            ))}
          </div>

          <div className="md:grid md:grid-cols-[4rem_minmax(0,1fr)]">
            <div className="relative hidden pt-14 text-xs text-text-secondary md:block">
              <div className="relative h-[32rem]">
                {TIME_MARKERS.map((hour) => (
                  <span
                    key={hour}
                    className="absolute right-3 -translate-y-1/2"
                    style={{ top: `${((hour - WORKDAY_START) / WORKDAY_HOURS) * 100}%` }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </span>
                ))}
              </div>
            </div>
            <div className="md:grid md:grid-cols-7 md:divide-x md:divide-surface-border">
              {visibleDays.map((day, dayIndex) => {
                const dayEnd = addDays(day, 1);
                const dayEvents = visibleEvents.filter((event) => (
                  new Date(event.endTime) > day && new Date(event.startTime) < dayEnd
                ));
                const positionedEvents = layoutDayEvents(dayEvents, day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`${selectedDayIndex === dayIndex ? 'block' : 'hidden'} min-w-0 md:block`}
                  >
                    <div className="mb-3 hidden h-11 text-center md:block">
                      <span className="block text-xs font-semibold uppercase text-text-secondary">
                        {day.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-text-primary">{day.getDate()}</span>
                    </div>
                    <div className="relative space-y-2 md:h-[32rem] md:space-y-0 md:overflow-hidden md:bg-[linear-gradient(to_bottom,transparent_24.8%,var(--color-surface-border)_25%,transparent_25.2%,transparent_62.3%,var(--color-surface-border)_62.5%,transparent_62.7%)]">
                      {dayEvents.length === 0 ? (
                        <p className="py-8 text-center text-sm text-text-secondary md:px-2">No events in this range</p>
                      ) : (
                        positionedEvents.map((positioned) => (
                          <CalendarEventCard key={positioned.event.id} {...positioned} day={day} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {outOfHoursEvents.length > 0 && (
            <div className="mt-4 hidden border-t border-surface-border pt-4 md:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Outside displayed hours</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {outOfHoursEvents.map((event) => (
                  <span key={event.id} className="rounded-full bg-surface-hover px-3 py-1.5 text-xs text-text-primary">
                    {event.title} · {new Date(event.startTime).toLocaleDateString(undefined, { weekday: 'short' })} {formatTime(event.startTime)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Weekly insights">
        <article className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-serif text-text-primary">Upcoming Deadlines</h2>
              <p className="mt-1 text-sm text-text-secondary">What needs attention first.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Next 7 days</span>
          </div>
          <div className="mt-5 divide-y divide-surface-border">
            {deadlines.length === 0 ? (
              <p className="py-8 text-sm text-text-secondary">No urgent deadlines this week.</p>
            ) : (
              deadlines.map((deadline) => (
                <div key={deadline.id} className="flex gap-3 py-4 first:pt-0">
                  <div className="w-12 shrink-0 rounded-xl bg-surface-hover p-2 text-center">
                    <span className="block text-[10px] font-semibold uppercase text-text-secondary">
                      {deadline.deadline.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="block text-lg font-bold text-text-primary">{deadline.deadline.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-primary">{deadline.title}</h3>
                    <p className="mt-1 text-xs capitalize text-text-secondary">Due {deadline.urgency}</p>
                  </div>
                  <span className={`self-start rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                    deadline.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link to="/context" className="mt-4 inline-block text-sm font-semibold text-primary">View all tasks →</Link>
        </article>

        <article className="card p-5">
          <div>
            <h2 className="text-xl font-serif text-text-primary">Workload Distribution</h2>
            <p className="mt-1 text-sm text-text-secondary">How your planned week is distributed by task type.</p>
          </div>
          {workload.some((slice) => slice.hours > 0) ? (
            <>
              <div className="relative mt-6 min-h-44" aria-label="Task Type planned-time allocation">
                {sortedWorkload.map((slice, index) => {
                  const positions = [
                    'left-1/2 top-0 h-32 w-32 -translate-x-1/2',
                    'right-2 top-4 h-20 w-20',
                    'bottom-2 left-4 h-14 w-14',
                  ];
                  const colors = ['bg-violet-950 text-white', 'bg-violet-300 text-violet-950', 'bg-violet-100 text-violet-950'];
                  const label = `${categoryLabels[slice.category]}: ${slice.percentage}%, ${slice.hours} hours`;
                  return (
                    <div
                      key={slice.category}
                      data-testid="workload-bubble"
                      title={label}
                      aria-label={label}
                      role="img"
                      tabIndex={0}
                      className={`absolute flex flex-col items-center justify-center rounded-full text-center ${positions[index]} ${colors[index]}`}
                    >
                      <strong className={index === 0 ? 'text-2xl' : 'text-sm'}>{slice.percentage}%</strong>
                      <span className={`${index === 2 ? 'text-[9px]' : 'text-xs'} font-medium`}>{categoryLabels[slice.category]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 grid grid-cols-1 divide-y divide-surface-border border-t border-surface-border pt-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {workload.map((slice) => (
                  <div key={slice.category} className="px-2 py-2 text-center text-xs text-text-secondary">
                    <strong className="block text-sm text-text-primary">{slice.hours}h</strong>
                    {categoryLabels[slice.category]}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-12 text-sm text-text-secondary">
              Add scheduled focus blocks or connect your calendar to see your time distribution.
            </p>
          )}
        </article>

        <article className="card p-5 md:col-span-2 lg:col-span-1">
          <h2 className="text-xl font-serif text-text-primary">Smart Suggestions</h2>
          <p className="mt-1 text-sm text-text-secondary">Deterministic guidance from your plans and confirmed context.</p>

          {upcomingMeetings.length > 0 && (
            <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Upcoming meeting</p>
              {upcomingMeetings.map((meeting) => {
                const meetingLink = parseEventMetadata(meeting).meetingLink;
                return (
                  <div key={meeting.id} className="mt-3 border-t border-cyan-100 pt-3 first:border-0 first:pt-0">
                    <h3 className="font-semibold text-text-primary">{meeting.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      {new Date(meeting.startTime).toLocaleDateString(undefined, { weekday: 'short' })}, {formatTime(meeting.startTime)}
                    </p>
                    {meetingLink && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Join ${meeting.title}`}
                        className="mt-3 inline-flex w-full justify-center rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Join now
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {suggestions.length === 0 ? (
              <p className="py-6 text-sm text-text-secondary">No new suggestions.</p>
            ) : (
              suggestions.map((suggestion) => (
                <div key={suggestion.id} data-testid="smart-suggestion" className="rounded-2xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary">{suggestion.title}</h3>
                  {suggestion.proposedTime && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      {suggestion.proposedTime.toLocaleDateString(undefined, { weekday: 'long' })} at {suggestion.proposedTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-text-secondary">{suggestion.explanation}</p>
                  <p className="mt-3 text-xs text-text-secondary">
                    Suggested next step: <strong className="font-semibold text-text-primary">{suggestion.actionLabel}</strong>
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default CalendarPage;
