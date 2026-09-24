interface UnderstandingErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function UnderstandingErrorState({ error, onRetry }: UnderstandingErrorStateProps) {
  return (
    <div className="mx-auto min-w-0 max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-rose-200/80 bg-white/95 p-8 shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-100/70 text-rose-800">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h2 className="mt-4 font-serif text-xl font-bold text-stone-900">
          Failed to load understanding data
        </h2>
        <p className="mt-2 text-xs text-rose-800 leading-relaxed bg-rose-50 rounded-xl p-3 border border-rose-100">
          {error}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Retry Loading
          </button>
        </div>
      </div>
    </div>
  );
}
