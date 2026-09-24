import { Link } from 'react-router-dom';

export function AllContextEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-amber-300/80 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20 p-8 text-center sm:p-12">
      <div className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-900 shadow-xs">
        <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h3 className="mt-4 font-serif text-xl font-bold text-stone-900">
        No context recorded yet
      </h3>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-stone-600 sm:text-sm">
        Your personal AI model learns from your goals, work rhythms, and schedule. Complete onboarding setup or log your first decision to start building your understanding graph.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/onboarding"
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:text-sm"
        >
          Complete Setup
        </Link>
        <Link
          to="/dashboard"
          className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 focus-visible:outline-none sm:text-sm"
        >
          Explore Dashboard
        </Link>
      </div>
    </div>
  );
}
