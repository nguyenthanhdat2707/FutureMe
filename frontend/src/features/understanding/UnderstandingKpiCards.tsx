import type { PersonalContext } from '../../types/domain';

interface UnderstandingKpiCardsProps {
  context: PersonalContext | null;
}

export function UnderstandingKpiCards({ context }: UnderstandingKpiCardsProps) {
  const goalsCount = context?.goals?.length ?? 0;
  const commitmentsCount = context?.commitments?.length ?? 0;
  const preferencesCount = context?.preferences?.length ?? 0;

  return (
    <section aria-label="Key context overview" className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
      {/* 1. Active Goals */}
      <div className="group rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-4 shadow-[0_2px_10px_rgba(217,119,6,0.03)] transition-all hover:border-amber-300/70 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-900/70">Active Goals</span>
          <span className="rounded-lg bg-amber-100/70 px-2 py-0.5 text-[10px] font-bold text-amber-800">Target</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{goalsCount}</span>
          <span className="text-xs text-stone-500">defined</span>
        </div>
        <p className="mt-1 text-[11px] text-stone-500">Strategic intentions tracked</p>
      </div>

      {/* 2. Commitments */}
      <div className="group rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50/40 via-white to-amber-50/20 p-4 shadow-[0_2px_10px_rgba(225,29,72,0.03)] transition-all hover:border-rose-300/70 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-900/70">Commitments</span>
          <span className="rounded-lg bg-rose-100/70 px-2 py-0.5 text-[10px] font-bold text-rose-800">Active</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{commitmentsCount}</span>
          <span className="text-xs text-stone-500">scheduled</span>
        </div>
        <p className="mt-1 text-[11px] text-stone-500">Calendar & declarations</p>
      </div>

      {/* 3. Preferences */}
      <div className="group rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/20 p-4 shadow-[0_2px_10px_rgba(13,148,136,0.03)] transition-all hover:border-teal-300/70 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-teal-900/70">Preferences</span>
          <span className="rounded-lg bg-teal-100/70 px-2 py-0.5 text-[10px] font-bold text-teal-800">Habits</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{preferencesCount}</span>
          <span className="text-xs text-stone-500">learned</span>
        </div>
        <p className="mt-1 text-[11px] text-stone-500">Work & focus constraints</p>
      </div>
    </section>
  );
}
