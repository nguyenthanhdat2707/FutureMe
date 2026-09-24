export function UnderstandingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading understanding dashboard"
      className="mx-auto min-w-0 max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12 space-y-7 animate-pulse"
    >
      {/* 1. Header skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-72 rounded-xl bg-stone-200/90" />
        <div className="h-4 w-96 rounded-lg bg-stone-200/60" />
      </div>

      {/* 2. 3 KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={`sk-kpi-${i}`} className="h-28 rounded-2xl border border-stone-200/60 bg-stone-100/70 p-4" />
        ))}
      </div>

      {/* 3. Evolution chart skeleton */}
      <div className="h-80 rounded-3xl border border-stone-200/60 bg-stone-100/60 p-6" />

      {/* 4. 2-card row: Category + What Future Me Learned */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 rounded-3xl border border-stone-200/60 bg-stone-100/60" />
        <div className="h-64 rounded-3xl border border-stone-200/60 bg-stone-100/60" />
      </div>

      {/* 5. Focus patterns skeleton */}
      <div className="h-56 rounded-3xl border border-stone-200/60 bg-stone-100/60" />

      {/* 6. Personal context skeleton */}
      <div className="h-72 rounded-3xl border border-stone-200/60 bg-stone-100/60" />

      {/* 7. Calendar Overview / Data Sources skeleton */}
      <div className="h-48 rounded-3xl border border-stone-200/60 bg-stone-100/60" />

      <span className="sr-only">Loading understanding dashboard...</span>
    </div>
  );
}
