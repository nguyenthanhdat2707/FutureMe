export function FocusPatternsCard() {
  return (
    <section
      aria-labelledby="your-focus-patterns-title"
      className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur transition-all sm:p-6 lg:p-7"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div>
          <h2 id="your-focus-patterns-title" className="font-serif text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            Your Focus Patterns
          </h2>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Visualizes completed deep work and recovery sessions once real focus tracking is recorded.
          </p>
        </div>
        <span className="self-start rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 sm:self-auto">
          No Sessions Logged
        </span>
      </div>

      {/* Approved Spec Empty State */}
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200/90 bg-gradient-to-b from-stone-50/40 via-white to-amber-50/20 py-12 px-6 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-amber-100/70 text-amber-900 shadow-xs">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 className="mt-4 text-base font-semibold text-stone-900 sm:text-lg">
          Record a focus session to see your patterns
        </h3>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
          Future Me visualizes completed deep work, collaborative sprints, and intentional recovery periods as a fluid streamgraph once real sessions are tracked. Calendar events are intentions, not completed focus.
        </p>

      </div>
    </section>
  );
}
