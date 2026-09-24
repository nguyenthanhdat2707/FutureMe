import type { CalendarSummary } from '../../types/domain';
import { formatRelativeDate } from './understanding-utils';

interface CalendarDataSourcesCardProps {
  calendar?: CalendarSummary;
}

export function CalendarDataSourcesCard({ calendar }: CalendarDataSourcesCardProps) {
  const isSynced = calendar?.status === 'synced';
  const statusLabel = isSynced ? 'Calendar Synced' : 'Calendar Status Unknown';
  const statusColor = isSynced
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
    : 'bg-stone-100 text-stone-600 border-stone-200';

  const lastSyncText = calendar?.lastSync ? formatRelativeDate(calendar.lastSync) : 'Never';
  const upcomingCount = calendar?.upcomingEvents ?? 0;

  // Null busy hours must be shown as Unknown if included; never label unavailable as zero
  const busyTodayText =
    calendar?.busyHoursToday !== null && calendar?.busyHoursToday !== undefined
      ? `${calendar.busyHoursToday}h`
      : 'Unknown';

  const busyWeekText =
    calendar?.busyHoursThisWeek !== null && calendar?.busyHoursThisWeek !== undefined
      ? `${calendar.busyHoursThisWeek}h`
      : 'Unknown';

  return (
    <section
      aria-labelledby="calendar-overview-sources-title"
      className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur transition-all sm:p-6 lg:p-7 space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div>
          <h2
            id="calendar-overview-sources-title"
            className="font-serif text-xl font-bold tracking-tight text-stone-900 sm:text-2xl"
          >
            Calendar Overview / Data Sources
          </h2>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Connected calendar integration, schedule synchronization, and context provenance.
          </p>
        </div>

        <span className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}>
          <span
            className={`size-1.5 rounded-full ${isSynced ? 'bg-emerald-500' : 'bg-stone-400'}`}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Calendar Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5">
          <span className="text-[11px] font-medium text-stone-500">Status</span>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-stone-900 capitalize">
            {isSynced ? 'Synced' : 'Unknown'}
          </p>
          <span className="text-[10px] text-stone-400">External provider</span>
        </div>

        <div className="rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5">
          <span className="text-[11px] font-medium text-stone-500">Last Sync</span>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-stone-900">
            {lastSyncText}
          </p>
          <span className="text-[10px] text-stone-400">Automated cadence</span>
        </div>

        <div className="rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5">
          <span className="text-[11px] font-medium text-stone-500">Upcoming Events</span>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-stone-900">
            {upcomingCount}
          </p>
          <span className="text-[10px] text-stone-400">Upcoming schedule</span>
        </div>

        <div className="rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5">
          <span className="text-[11px] font-medium text-stone-500">Busy Hours</span>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-stone-900">
            {busyTodayText} <span className="text-xs font-normal text-stone-400">/ {busyWeekText} wk</span>
          </p>
          <span className="text-[10px] text-stone-400">Today / week scheduled</span>
        </div>
      </div>

      {/* Truthful Data Source / Provenance Footnote */}
      <div className="rounded-2xl border border-stone-200/60 bg-stone-50/30 p-4 text-xs text-stone-600">
        <p className="font-semibold text-stone-800">Truthful Data Provenance</p>
        <p className="mt-1 leading-relaxed text-stone-500">
          Calendar commitments and event intervals reflect the calendar data available to this session.
          Active goals, habits, and preferences are scoped to your private account or demo persona.
          Provenance badges distinguish user-confirmed, calendar-derived, observed, and inferred context.
        </p>
      </div>
    </section>
  );
}
