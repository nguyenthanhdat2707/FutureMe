import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CalendarEvent, CalendarStatusResponse } from '../../types/domain';
import {
  computeEventLanes,
  parseEventMetadata,
  startOfDay,
  WORKDAY_END,
  WORKDAY_START,
  type DashboardDeadline,
  type EventLaneInfo,
  type SmartSuggestion,
  type WorkloadCategory,
  type WorkloadSlice,
} from '../../pages/dashboard-utils';

const TIME_MARKERS = [9, 11, 14, 17];

const categoryLabels: Record<WorkloadCategory, string> = {
  deep_work: 'Deep work',
  meeting: 'Meetings',
  recovery: 'Recovery',
};

const categoryStyles = {
  deep_work: 'bg-violet-600 text-white shadow-violet-200',
  meeting: 'bg-cyan-500 text-white shadow-cyan-200',
  deadline: 'bg-amber-500 text-white shadow-amber-200',
  recovery: 'bg-emerald-500 text-white shadow-emerald-200',
  other: 'bg-slate-500 text-white shadow-slate-200',
} as const;

const calendarPastelStyles: Record<string, { bg: string; border: string; text: string }> = {
  deep_work: { bg: '#EDE9FE', border: '#C4B5FD', text: '#6D28D9' },
  meeting:   { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8' },
  deadline:  { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C' },
  recovery:  { bg: '#D1FAE5', border: '#6EE7B7', text: '#047857' },
  other:     { bg: '#F3F4F6', border: '#D1D5DB', text: '#4B5563' },
};

function getPastelStyle(category: string) {
  return calendarPastelStyles[category] ?? calendarPastelStyles.other;
}

const categoryBadges = {
  deep_work: 'Focus',
  meeting: 'Join',
  deadline: 'Approved',
  recovery: 'Personal',
  other: 'Approved',
} as const;

export type AllocationRange = 'today' | 'this-week' | 'next-week';

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}–${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function eventStyle(laneInfo: EventLaneInfo, day: Date): CSSProperties {
  const dayStart = new Date(day);
  dayStart.setHours(WORKDAY_START, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(WORKDAY_END, 0, 0, 0);
  const total = dayEnd.getTime() - dayStart.getTime();
  const topPercent = ((laneInfo.visibleStart - dayStart.getTime()) / total) * 100;
  const heightPercent = ((laneInfo.visibleEnd - laneInfo.visibleStart) / total) * 100;

  if (laneInfo.totalLanes <= 1) {
    return {
      top: `${topPercent}%`,
      height: `max(2.7rem, ${heightPercent}%)`,
      left: '0.25rem',
      width: 'calc(100% - 0.5rem)',
    };
  }

  const leftPercent = (laneInfo.lane / laneInfo.totalLanes) * 100;
  const widthPercent = 100 / laneInfo.totalLanes;
  return {
    top: `${topPercent}%`,
    height: `max(2.7rem, ${heightPercent}%)`,
    left: `calc(${leftPercent}% + 2px)`,
    width: `calc(${widthPercent}% - 4px)`,
  };
}

function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const key = startOfDay(day).getTime();
  return events.filter((event) => startOfDay(new Date(event.startTime)).getTime() === key);
}

interface AsyncStateProps {
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export interface DashboardHeaderProps {
  rangeStart: Date;
  rangeEnd: Date;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrentWeek: () => void;
}

export function DashboardHeader({
  rangeStart,
  rangeEnd,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onCurrentWeek,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">YOUR WEEK AT A GLANCE</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Plan your week with more clarity.</h1>
        <p className="mt-3 text-base leading-7 text-text-secondary">Your schedule, urgent work and the context Future Me has learned.</p>
      </div>

      <div className="flex max-w-full items-center gap-2 self-start rounded-2xl border border-surface-border bg-surface p-1.5 shadow-sm lg:self-auto" aria-label="Dashboard date range">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous week"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-lg text-text-secondary transition hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onCurrentWeek}
          className="min-w-0 rounded-xl px-2 py-1 text-center transition hover:bg-surface-hover sm:px-4"
          aria-label={`Show current week. Selected range ${formatRange(rangeStart, rangeEnd)}`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">Selected week</span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-text-primary sm:text-sm">{formatRange(rangeStart, rangeEnd)}</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next week"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-lg text-text-secondary transition hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          ›
        </button>
      </div>
    </header>
  );
}

function CalendarSkeleton() {
  return (
    <section className="card overflow-hidden" aria-label="Loading calendar" aria-live="polite">
      <div className="border-b border-surface-border p-5">
        <div className="h-6 w-52 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid h-[clamp(26rem,56vh,38rem)] grid-cols-7 gap-px bg-surface-border p-px">
        {Array.from({ length: 7 }, (_, index) => <div key={index} className="animate-pulse bg-slate-50" />)}
      </div>
      <span className="sr-only">Loading calendar data...</span>
    </section>
  );
}

interface EventButtonProps {
  event: CalendarEvent;
  selectedCategory: WorkloadCategory | null;
  onOpen: (event: CalendarEvent) => void;
  style?: CSSProperties;
  mobile?: boolean;
}

function EventButton({ event, selectedCategory, onOpen, style, mobile = false }: EventButtonProps) {
  const metadata = parseEventMetadata(event);
  const highlighted = selectedCategory === null || selectedCategory === metadata.category;
  const pastel = getPastelStyle(metadata.category);

  // Duration-based adaptive rendering
  const durationMs = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
  const durationMin = durationMs / 60_000;
  const isCompact = durationMin < 45;
  const isExtended = durationMin > 90;

  // Flexibility from rawData
  let flexibility = '';
  try {
    const raw = JSON.parse(event.rawData ?? '{}') as Record<string, unknown>;
    if (typeof raw.flexibility === 'string') flexibility = (raw.flexibility as string).toUpperCase();
  } catch { /* ignore */ }

  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      style={{
        ...(style ?? {}),
        background: pastel.bg,
        borderColor: pastel.border,
        color: pastel.text,
      }}
      data-category={metadata.category}
      className={`${mobile ? 'relative w-full' : 'absolute'} min-w-0 overflow-hidden rounded-[14px] border px-2.5 py-2 text-left transition focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        highlighted ? 'opacity-100' : 'opacity-40'
      }`}
      aria-label={`${event.title}, ${formatTime(event.startTime)} to ${formatTime(event.endTime)}`}
    >
      {/* Subtle decorative circle — only on non-compact */}
      {!isCompact && (
        <span
          className="pointer-events-none absolute right-1 top-1 size-8 rounded-full opacity-20"
          style={{ background: pastel.border }}
          aria-hidden="true"
        />
      )}
      <span className="relative flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: pastel.text }}>{event.title}</span>
        {!isCompact && flexibility && (
          <span
            className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ background: pastel.border + '55', color: pastel.text }}
          >
            {flexibility}
          </span>
        )}
      </span>
      {!isCompact && (
        <time className="mt-0.5 block text-[11px] opacity-80">{formatTime(event.startTime)}–{formatTime(event.endTime)}</time>
      )}
      {isCompact && (
        <time className="block text-[10px] opacity-70">{formatTime(event.startTime)}</time>
      )}
      {isExtended && (
        <span className="mt-1 block text-[10px] leading-4 opacity-70" style={{ color: pastel.text }}>
          {metadata.category.replace('_', ' ').toUpperCase()}
        </span>
      )}
    </button>
  );
}

export interface GanttCalendarProps extends AsyncStateProps {
  visibleDays: Date[];
  events: CalendarEvent[];
  status: CalendarStatusResponse | null;
  syncing: boolean;
  selectedCategory: WorkloadCategory | null;
  onCategoryClear: () => void;
  onSync: () => void;
  onEventOpen: (event: CalendarEvent) => void;
}

export function GanttCalendar({
  visibleDays,
  events,
  status,
  syncing,
  selectedCategory,
  onCategoryClear,
  onSync,
  onEventOpen,
  loading,
  error,
  onRetry,
}: GanttCalendarProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (loading) return <CalendarSkeleton />;

  const selectedDay = visibleDays[selectedDayIndex] ?? visibleDays[0];
  const selectedDayEvents = selectedDay ? eventsForDay(events, selectedDay) : [];

  return (
    <section className="card min-w-0 overflow-hidden" aria-labelledby="gantt-title">
      <div className="flex flex-col gap-4 border-b border-surface-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 id="gantt-title" className="text-xl font-semibold text-text-primary">Your week at a glance.</h2>
          <p className="mt-1 text-sm text-text-secondary">Calendar events and protected focus time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            error ? 'bg-red-50 text-red-700' : status?.status === 'synced' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
          }`}>
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            {error ? 'Calendar could not sync' : status?.status === 'synced' ? 'Synced with Calendar' : 'Calendar not yet synced'}
          </span>
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="rounded-xl border border-surface-border bg-surface px-3 py-1.5 text-xs font-bold text-text-primary transition hover:border-primary/30 hover:bg-surface-hover disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800" role="alert">
          <span>Calendar could not sync. Your dashboard data may be unavailable.</span>
          <button type="button" onClick={onRetry} className="font-bold underline underline-offset-4">Retry</button>
        </div>
      )}

      {selectedCategory && (
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-violet-50 px-5 py-2.5 text-xs text-violet-900">
          <span>Highlighting {categoryLabels[selectedCategory]} events</span>
          <button type="button" onClick={onCategoryClear} className="font-bold underline underline-offset-4">Show all</button>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="md:hidden">
          <div className="grid grid-cols-7 gap-1" aria-label="Choose agenda day">
            {visibleDays.map((day, index) => (
              <button
                key={day.toISOString()}
                type="button"
                aria-pressed={selectedDayIndex === index}
                onClick={() => setSelectedDayIndex(index)}
                className={`min-w-0 rounded-xl px-0.5 py-2 text-center transition ${
                  selectedDayIndex === index ? 'bg-primary text-white shadow-sm' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="block truncate text-[10px] font-bold uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className="mt-0.5 block text-sm font-bold">{day.getDate()}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2" role="region" aria-label="Daily agenda">
            {selectedDayEvents.length > 0 ? selectedDayEvents.map((event) => (
              <EventButton key={event.id} event={event} selectedCategory={selectedCategory} onOpen={onEventOpen} mobile />
            )) : (
              <p className="rounded-2xl border border-dashed border-surface-border px-4 py-10 text-center text-sm text-text-secondary">No events in this range</p>
            )}
          </div>
        </div>

        <div className="hidden min-w-0 md:block" role="region" aria-label="Weekly Gantt calendar">
          <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
            <div />
            {visibleDays.map((day) => {
              const isToday = startOfDay(day).getTime() === startOfDay(new Date()).getTime();
              return (
              <div key={day.toISOString()} className="min-w-0 border-l border-surface-border px-1 pb-3 text-center">
                <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-text-secondary">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className={isToday ? 'mx-auto mt-1 flex size-7 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white' : 'mt-1 block text-sm font-bold text-text-primary'}>{day.getDate()}</span>
              </div>
            )})}

            <div className="relative h-[clamp(26rem,56vh,38rem)] border-t border-surface-border">
              {TIME_MARKERS.map((hour) => (
                <time
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[10px] text-text-secondary"
                  style={{ top: `${((hour - WORKDAY_START) / (WORKDAY_END - WORKDAY_START)) * 100}%` }}
                >
                  {String(hour).padStart(2, '0')}:00
                </time>
              ))}
            </div>
            {visibleDays.map((day) => {
              const dayEvents = eventsForDay(events, day);
              const laneMap = computeEventLanes(dayEvents, day);
              const isToday = startOfDay(day).getTime() === startOfDay(new Date()).getTime();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={day.toISOString()}
                  className={`relative h-[clamp(26rem,56vh,38rem)] min-w-0 border-l border-t border-surface-border bg-[linear-gradient(to_bottom,transparent_24.8%,var(--color-surface-border)_25%,transparent_25.2%,transparent_62.3%,var(--color-surface-border)_62.5%,transparent_62.7%)] ${
                    isWeekend ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)]' : ''
                  }`}
                >
                  {isToday && (
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 border-l-2 border-dashed border-blue-400/60" />
                  )}
                  {dayEvents.map((event) => {
                    const laneInfo = laneMap.get(event.id);
                    if (!laneInfo) return null;
                    const style = eventStyle(laneInfo, day);
                    return <EventButton key={event.id} event={event} selectedCategory={selectedCategory} onOpen={onEventOpen} style={style} />;
                  })}
                </div>
              );
            })}
          </div>
          {events.length === 0 && <p className="py-6 text-center text-sm text-text-secondary">No events in this range</p>}
        </div>
      </div>
    </section>
  );
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <section className="card min-h-80 p-6" aria-label={`Loading ${label}`} aria-live="polite">
      <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-50" />)}
      </div>
      <span className="sr-only">Loading {label}...</span>
    </section>
  );
}

function ErrorState({ copy, onRetry }: { copy: string; onRetry?: () => void }) {
  return (
    <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <p>{copy}</p>
      <button type="button" onClick={onRetry} className="mt-3 font-bold underline underline-offset-4">Retry</button>
    </div>
  );
}

export interface DeadlinesCardProps extends AsyncStateProps {
  deadlines: DashboardDeadline[];
}

export function DeadlinesCard({ deadlines, loading, error, onRetry }: DeadlinesCardProps) {
  if (loading) return <CardSkeleton label="deadlines" />;
  return (
    <section className="card flex min-h-[22rem] flex-col p-5 sm:p-6" aria-labelledby="deadlines-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">Priority queue</p>
        <h2 id="deadlines-title" className="mt-2 text-xl font-semibold text-text-primary">Deadlines</h2>
      </div>
      {error ? <ErrorState copy="Tasks could not load" onRetry={onRetry} /> : deadlines.length === 0 ? (
        <p className="my-auto py-12 text-center text-sm text-text-secondary">No urgent deadlines this week</p>
      ) : (
        <ol className="mt-5 divide-y divide-surface-border">
          {deadlines.slice(0, 5).map((deadline, index) => (
            <li key={deadline.id} className={`items-center gap-3 py-3 ${index >= 3 ? 'hidden sm:flex' : 'flex'}`}>
              <time
                className={`grid size-12 shrink-0 place-items-center rounded-xl text-center ${
                  deadline.urgency === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-900'
                }`}
                dateTime={deadline.deadline.toISOString()}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider">{deadline.deadline.toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="-mt-2 text-lg font-bold">{deadline.deadline.getDate()}</span>
              </time>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{deadline.title}</p>
                <p className={`mt-1 text-xs ${deadline.urgency === 'overdue' ? 'font-semibold text-red-600' : 'text-text-secondary'}`}>
                  {deadline.urgency === 'overdue' ? 'Overdue' : `Due ${deadline.urgency}`}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${deadline.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                {deadline.priority}
              </span>
            </li>
          ))}
        </ol>
      )}
      <Link to="/understanding" className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-primary hover:underline">
        View all tasks <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

export interface TaskTypeBubbleCardProps extends AsyncStateProps {
  allocation: WorkloadSlice[];
  range: AllocationRange;
  selectedCategory: WorkloadCategory | null;
  onRangeChange: (range: AllocationRange) => void;
  onCategoryOpen: (category: WorkloadCategory) => void;
}

export function TaskTypeBubbleCard({
  allocation,
  range,
  selectedCategory,
  onRangeChange,
  onCategoryOpen,
  loading,
  error,
  onRetry,
}: TaskTypeBubbleCardProps) {
  if (loading) return <CardSkeleton label="task allocation" />;
  const sorted = [...allocation].sort((left, right) => right.hours - left.hours);
  const hasData = allocation.some((slice) => slice.hours > 0);
  const bubbleClasses = [
    'left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 bg-violet-950 text-white z-10',
    'right-[calc(50%-4.5rem-1.5rem)] top-[calc(50%-4.5rem-2rem)] size-20 bg-violet-200 text-violet-950 z-20',
    'left-[calc(50%-4.5rem-1.5rem)] bottom-[calc(50%-4.5rem-2rem)] size-14 bg-violet-100 text-violet-950 z-20',
  ];

  return (
    <section className="card flex min-h-[22rem] flex-col p-5 sm:p-6" aria-labelledby="task-type-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="task-type-title" className="text-xl font-semibold text-text-primary">Task type</h2>
          <p className="mt-1 text-sm text-text-secondary">How your planned week is distributed.</p>
        </div>
        <label className="sr-only" htmlFor="allocation-range">Allocation range</label>
        <select
          id="allocation-range"
          value={range}
          onChange={(event) => onRangeChange(event.target.value as AllocationRange)}
          className="max-w-28 rounded-xl border border-surface-border bg-surface px-2 py-2 text-xs font-semibold text-text-primary focus:outline-2 focus:outline-primary"
        >
          <option value="today">Today</option>
          <option value="this-week">This week</option>
          <option value="next-week">Next week</option>
        </select>
      </div>

      {error ? <ErrorState copy="Allocation could not load" onRetry={onRetry} /> : (
        <>
          <div className="relative mx-auto mt-5 h-60 w-full max-w-72" aria-label="Planned time allocation">
            {sorted.map((slice, index) => (
              <button
                key={slice.category}
                type="button"
                aria-pressed={selectedCategory === slice.category}
                aria-label={`${categoryLabels[slice.category]}, ${slice.percentage} percent, ${slice.hours} hours`}
                title={`${categoryLabels[slice.category]} · ${slice.percentage}% · ${slice.hours}h`}
                onClick={() => onCategoryOpen(slice.category)}
                className={`absolute grid place-items-center rounded-full p-2 text-center shadow-sm transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${bubbleClasses[index]} ${
                  selectedCategory === slice.category ? 'ring-4 ring-primary/30' : ''
                }`}
              >
                <span>
                  <strong className="block text-xl leading-none">{slice.percentage}%</strong>
                  <span className="mt-1 block text-[10px] font-bold leading-tight">{categoryLabels[slice.category]}</span>
                </span>
              </button>
            ))}
          </div>
          {!hasData && <p className="-mt-1 text-center text-xs leading-5 text-text-secondary">Add scheduled focus blocks or connect your calendar to see your time distribution.</p>}
          <div className="mt-auto grid grid-cols-1 divide-y divide-surface-border border-t border-surface-border pt-3 min-[480px]:grid-cols-3 min-[480px]:divide-x min-[480px]:divide-y-0">
            {allocation.map((slice) => (
              <div key={slice.category} className="px-2 py-2 text-center">
                <strong className="block text-sm text-text-primary">{slice.hours}h</strong>
                <span className="text-[10px] font-semibold text-text-secondary">{categoryLabels[slice.category]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function relativeStart(event: CalendarEvent, now: Date): string {
  const minutes = Math.round((new Date(event.startTime).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return 'In progress or starting now';
  if (minutes < 60) return `Starts in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Starts in ${hours} hr${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `Starts in ${days} day${days === 1 ? '' : 's'}`;
}

function meetingPlatform(event: CalendarEvent): string {
  const link = parseEventMetadata(event).meetingLink ?? '';
  if (/zoom/i.test(link)) return 'Zoom';
  if (/teams|microsoft/i.test(link)) return 'Teams';
  if (/meet\.google/i.test(link)) return 'Google Meet';
  return 'Calendar';
}

export interface UpcomingAndSuggestionsCardProps extends AsyncStateProps {
  upcomingMeeting: CalendarEvent | null;
  suggestions: SmartSuggestion[];
  now: Date;
}

export function UpcomingAndSuggestionsCard({ upcomingMeeting, suggestions, now, loading, error, onRetry }: UpcomingAndSuggestionsCardProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  if (loading) return <CardSkeleton label="suggestions" />;
  const visibleSuggestions = suggestions.filter((suggestion) => !dismissed.includes(suggestion.id));

  return (
    <section className="card flex min-h-[22rem] flex-col p-5 sm:p-6" aria-labelledby="upcoming-title">
      <h2 id="upcoming-title" className="text-xl font-semibold text-text-primary">Upcoming &amp; Suggestions</h2>
      {error ? <ErrorState copy="Suggestions could not load" onRetry={onRetry} /> : (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">Upcoming meeting</p>
            {upcomingMeeting ? (
              <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xs font-bold text-cyan-800 shadow-sm" aria-hidden="true">↗</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-cyan-800">{meetingPlatform(upcomingMeeting)}</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-text-primary">{upcomingMeeting.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{relativeStart(upcomingMeeting, now)}</p>
                  </div>
                </div>
                {parseEventMetadata(upcomingMeeting).meetingLink && (
                  <a
                    href={parseEventMetadata(upcomingMeeting).meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block w-full rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-primary-dark"
                  >
                    Join now
                  </a>
                )}
              </div>
            ) : <p className="mt-3 text-sm text-text-secondary">No upcoming meeting in this range</p>}
          </div>

          <div className="border-t border-surface-border pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">Smart suggestions</p>
            {visibleSuggestions.length === 0 ? <p className="mt-3 text-sm text-text-secondary">No new suggestions</p> : (
              <div className="mt-3 space-y-3">
                {visibleSuggestions.map((suggestion) => (
                  <article key={suggestion.id} className="rounded-2xl bg-violet-50/70 p-4">
                    <p className="text-sm font-bold text-text-primary">{suggestion.title}</p>
                    {suggestion.proposedTime && <time className="mt-1 block text-xs text-violet-800">{suggestion.proposedTime.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</time>}
                    <p className="mt-2 text-xs leading-5 text-text-secondary">{suggestion.explanation}</p>
                    {accepted.includes(suggestion.id) ? (
                      <p className="mt-3 text-xs font-bold text-emerald-700" role="status">Acknowledged for this view</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setAccepted((current) => [...current, suggestion.id])} className="rounded-xl bg-violet-950 px-3 py-2 text-xs font-bold text-white">Accept</button>
                        <button type="button" onClick={() => setDismissed((current) => [...current, suggestion.id])} className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-950">Deny</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            <p className="mt-3 text-[10px] leading-4 text-text-secondary">Demo acknowledgement only. These actions do not change your calendar or persist.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export interface DashboardInsightGridProps {
  children: ReactNode;
}

export function DashboardInsightGrid({ children }: DashboardInsightGridProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[31fr_32fr_37fr] [&>*:last-child]:md:col-span-2 [&>*:last-child]:lg:col-span-1">
      {children}
    </div>
  );
}

export interface EventDetailDialogProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export function EventDetailDialog({ event, onClose }: EventDetailDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!event) return;
    closeRef.current?.focus();
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;
  const metadata = parseEventMetadata(event);
  const badge = categoryBadges[metadata.category];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] md:items-center md:p-6" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="event-detail-title" className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl md:max-w-lg md:rounded-3xl">
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200 md:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${categoryStyles[metadata.category]}`}>{badge}</span>
            <h2 id="event-detail-title" className="mt-3 text-2xl font-semibold text-text-primary">{event.title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close event details" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-hover text-lg text-text-secondary hover:text-text-primary">×</button>
        </div>

        <dl className="mt-6 divide-y divide-surface-border rounded-2xl border border-surface-border px-4">
          <div className="grid grid-cols-[5rem_1fr] gap-3 py-3 text-sm"><dt className="text-text-secondary">Time</dt><dd className="font-semibold text-text-primary">{new Date(event.startTime).toLocaleString()}–{formatTime(event.endTime)}</dd></div>
          <div className="grid grid-cols-[5rem_1fr] gap-3 py-3 text-sm"><dt className="text-text-secondary">Source</dt><dd className="font-semibold text-text-primary">{String(event.source).replace(/_/g, ' ')}</dd></div>
          <div className="grid grid-cols-[5rem_1fr] gap-3 py-3 text-sm"><dt className="text-text-secondary">Status</dt><dd className="font-semibold text-text-primary">{event.status ? event.status.replace(/_/g, ' ') : badge}</dd></div>
        </dl>

        {metadata.meetingLink && (
          <a href={metadata.meetingLink} target="_blank" rel="noreferrer" className="mt-5 block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white hover:bg-primary-dark">
            Join meeting
          </a>
        )}
      </section>
    </div>
  );
}
