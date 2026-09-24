import type { CalendarSummary } from '../../types/domain';
import { formatRelativeDate } from './understanding-utils';

interface UnderstandingHeaderProps {
  calendar?: CalendarSummary;
  lastUpdated?: string;
  isSyncing?: boolean;
}

export function UnderstandingHeader({
  calendar,
  lastUpdated,
  isSyncing = false,
}: UnderstandingHeaderProps) {
  const calendarStatusText = calendar?.status === 'synced'
    ? 'Calendar Synced'
    : 'Calendar Status Unknown';
  const calendarStatusColor = calendar?.status === 'synced'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
    : 'bg-stone-100 text-stone-600 border-stone-200';

  return (
    <header className="space-y-3 pb-2 pt-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            What Future Me Understands
          </h1>
          <p className="mt-1 text-sm text-stone-600 sm:text-base">
            How your personal AI model continuously interprets your goals, commitments, and habits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${calendarStatusColor}`}
          >
            <span
              className={`size-1.5 rounded-full ${calendar?.status === 'synced' ? 'bg-emerald-500' : 'bg-stone-400'}`}
              aria-hidden="true"
            />
            <span>{isSyncing ? 'Syncing...' : calendarStatusText}</span>
          </span>

          {lastUpdated && (
            <span className="rounded-full border border-stone-200/80 bg-white/70 px-3 py-1 text-xs text-stone-500">
              Updated {formatRelativeDate(lastUpdated)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
