export function UnderstandingFooter() {
  return (
    <footer
      aria-label="Privacy and model agency"
      className="mt-8 rounded-3xl border border-amber-200/50 bg-gradient-to-r from-amber-50/50 via-stone-50/50 to-orange-50/40 p-6 text-center text-xs text-stone-600 shadow-xs sm:p-8"
    >
      <div className="mx-auto max-w-2xl space-y-2">
        <p className="font-serif text-base font-semibold text-stone-900">
          Your Privacy & Personal Agency
        </p>
        <p className="leading-relaxed text-stone-500">
          Future Me is built on the principle that you own your personal model. Context shown above is scoped to your private account or selected demo persona. You can inspect, confirm, or correct supported observations at any time.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-stone-400">
          <span>Zero dark patterns</span>
          <span>·</span>
          <span>Explicit user confirmation</span>
          <span>·</span>
          <span>Honest confidence levels</span>
        </div>
      </div>
    </footer>
  );
}
