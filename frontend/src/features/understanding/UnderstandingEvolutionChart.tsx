import { useState, useMemo, useId } from 'react';
import type { UnderstandingHistoryResponse, UnderstandingHistoryPoint } from '../../types/domain';
import { computeLineChartLayout, formatShortDate } from './understanding-utils';

interface UnderstandingEvolutionChartProps {
  history: UnderstandingHistoryResponse | null;
  selectedDays: 7 | 30 | 90;
  onRangeChange: (days: 7 | 30 | 90) => void;
  isLoading?: boolean;
  rangeError?: string | null;
  onRetryRange?: () => void;
}

export function UnderstandingEvolutionChart({
  history,
  selectedDays,
  onRangeChange,
  isLoading = false,
  rangeError = null,
  onRetryRange,
}: UnderstandingEvolutionChartProps) {
  const chartId = useId();
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const points = useMemo(() => history?.points ?? [], [history]);
  const hasHistory = Boolean(history?.hasHistory && points.length > 0);

  // Layout calculations
  const layout = useMemo(() => {
    return computeLineChartLayout(points, 640, 240);
  }, [points]);

  const activePoint: UnderstandingHistoryPoint | null = useMemo(() => {
    if (activePointIndex === null || activePointIndex < 0 || activePointIndex >= points.length) {
      return null;
    }
    return points[activePointIndex] ?? null;
  }, [activePointIndex, points]);

  const prevPoint: UnderstandingHistoryPoint | null = useMemo(() => {
    if (activePointIndex === null || activePointIndex <= 0 || activePointIndex >= points.length) {
      return null;
    }
    return points[activePointIndex - 1] ?? null;
  }, [activePointIndex, points]);

  const toggleSeries = (seriesName: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesName)) {
        next.delete(seriesName);
      } else {
        // Do not allow all hidden (require at least one series visible)
        if (next.size < layout.series.length - 1) {
          next.add(seriesName);
        }
      }
      return next;
    });
  };

  const getSeriesKey = (name: string): 'goals' | 'commitments' | 'preferences' | 'decisions' => {
    const lower = name.toLowerCase();
    if (lower.startsWith('goal')) return 'goals';
    if (lower.startsWith('commit')) return 'commitments';
    if (lower.startsWith('pref')) return 'preferences';
    return 'decisions';
  };

  const visibleSeries = layout.series.filter((s) => !hiddenSeries.has(s.name));

  const formatChangeText = (current: number, prev: number | null): string => {
    if (prev === null) return 'no change';
    const diff = current - prev;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return 'no change';
  };

  // Keep displayed days aligned to the returned history.days; never relabel old data as the new range
  const displayDays = history?.days ?? selectedDays;

  return (
    <section
      aria-labelledby="evolution-chart-title"
      className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur transition-all sm:p-6 lg:p-7"
    >
      {/* Chart Card Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="evolution-chart-title" className="font-serif text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              Understanding Evolution
            </h2>
            <span className="rounded-full bg-amber-100/60 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
              {displayDays} Days
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Active valid context records over time across key life areas.
          </p>
        </div>

        {/* Range Selector Tabs */}
        <div
          role="tablist"
          aria-label="Time range"
          className="inline-flex items-center rounded-xl border border-stone-200/80 bg-stone-50/80 p-1 self-start sm:self-auto"
        >
          {([7, 30, 90] as const).map((days) => {
            const isSelected = selectedDays === days;
            return (
              <button
                key={days}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onRangeChange(days)}
                disabled={isLoading}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isSelected
                    ? 'border border-amber-300/60 bg-white text-amber-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                {days}d
              </button>
            );
          })}
        </div>
      </div>

      {/* Visible Range-load Error with Retry */}
      {rangeError && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">Unable to load range:</span>
            <span>{rangeError}</span>
          </div>
          {onRetryRange && (
            <button
              type="button"
              onClick={onRetryRange}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Main Chart Body */}
      <div className="mt-5">
        {!hasHistory ? (
          /* Empty / Insufficient history state */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-transparent py-14 px-6 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-100/80 text-amber-800 shadow-xs">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="mt-3.5 text-base font-semibold text-stone-900">
              Not enough history yet to show evolution
            </h3>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
              History begins accumulating as you record goals, commitments, and decisions. Future Me tracks the exact validity timeline of your knowledge base.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Interactive Legend with toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs" role="group" aria-label="Chart series legend">
                {layout.series.map((s) => {
                  const isHidden = hiddenSeries.has(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      aria-pressed={!isHidden}
                      onClick={() => toggleSeries(s.name)}
                      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isHidden
                          ? 'opacity-40 line-through text-stone-400 bg-stone-100'
                          : 'text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200/60'
                      }`}
                    >
                      <span
                        className="inline-block size-2.5 rounded-full shadow-xs"
                        style={{ backgroundColor: s.color }}
                        aria-hidden="true"
                      />
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] text-stone-400 italic hidden sm:inline">
                Tap or hover on points to inspect changes
              </span>
            </div>

            {/* SVG Chart Container */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-gradient-to-b from-stone-50/50 via-white to-white p-2 sm:p-4">
              {/* Inline Loading State Indicator */}
              {isLoading && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs"
                  role="status"
                  aria-label="Loading range data"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm">
                    <span className="size-2 animate-ping rounded-full bg-amber-500" />
                    <span>Updating range...</span>
                  </div>
                </div>
              )}

              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                className="w-full h-auto max-h-[280px] overflow-visible select-none"
                role="img"
                aria-label={`Understanding evolution line chart across ${displayDays} days`}
              >
                <defs>
                  {/* Subtle vertical indicator gradient */}
                  <linearGradient id={`${chartId}-cursor-grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y Ticks */}
                {layout.yTicks.map((tick, i) => (
                  <g key={`y-tick-${i}`}>
                    <line
                      x1={layout.padding.left}
                      y1={tick.y}
                      x2={layout.width - layout.padding.right}
                      y2={tick.y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeOpacity="0.75"
                    />
                    <text
                      x={layout.padding.left - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="fill-stone-400 text-[10px] font-mono"
                    >
                      {tick.value}
                    </text>
                  </g>
                ))}

                {/* X Axis Base Line */}
                <line
                  x1={layout.padding.left}
                  y1={layout.height - layout.padding.bottom}
                  x2={layout.width - layout.padding.right}
                  y2={layout.height - layout.padding.bottom}
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />

                {/* X Axis Ticks (max 4 universally) */}
                {layout.xTicks.map((tick, i) => (
                  <g key={`x-tick-${i}`}>
                    <line
                      x1={tick.x}
                      y1={layout.height - layout.padding.bottom}
                      x2={tick.x}
                      y2={layout.height - layout.padding.bottom + 4}
                      stroke="#94A3B8"
                    />
                    <text
                      x={tick.x}
                      y={layout.height - layout.padding.bottom + 16}
                      textAnchor="middle"
                      className="fill-stone-500 text-[10px] font-medium"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {/* Active Cursor Guide Line */}
                {activePointIndex !== null && (
                  <g>
                    {(() => {
                      const xPos =
                        layout.padding.left +
                        (activePointIndex / Math.max(1, points.length - 1)) * layout.plotWidth;
                      return (
                        <line
                          x1={xPos}
                          y1={layout.padding.top}
                          x2={xPos}
                          y2={layout.height - layout.padding.bottom}
                          stroke="#F59E0B"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      );
                    })()}
                  </g>
                )}

                {/* Multi-series Polylines */}
                {layout.series.map((s) => {
                  if (hiddenSeries.has(s.name)) return null;

                  return (
                    <g key={s.name}>
                      <path
                        d={s.pathD}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />

                      {/* Series Points */}
                      {s.points.map((pt, i) => {
                        const isPointActive = activePointIndex === i;
                        const isKeyPoint =
                          isPointActive ||
                          i === 0 ||
                          i === s.points.length - 1 ||
                          (points[i]?.changes && points[i]!.changes.length > 0);

                        if (!isKeyPoint && points.length > 14) return null;

                        return (
                          <circle
                            key={`${s.name}-pt-${i}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={isPointActive ? 5 : 3.5}
                            fill="#FFFFFF"
                            stroke={s.color}
                            strokeWidth={isPointActive ? 3 : 2}
                            className="cursor-pointer transition-transform"
                            onMouseEnter={() => setActivePointIndex(i)}
                            onTouchStart={() => setActivePointIndex(i)}
                            onClick={() => setActivePointIndex(i)}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Transparent Interactive Hover/Touch Slices */}
                {points.map((pt, i) => {
                  const sliceWidth = layout.plotWidth / Math.max(1, points.length);
                  const xCenter =
                    layout.padding.left +
                    (i / Math.max(1, points.length - 1)) * layout.plotWidth;
                  const xLeft = xCenter - sliceWidth / 2;

                  return (
                    <rect
                      key={`slice-${pt.date}-${i}`}
                      x={Math.max(0, xLeft)}
                      y={layout.padding.top}
                      width={sliceWidth}
                      height={layout.plotHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActivePointIndex(i)}
                      onTouchStart={() => setActivePointIndex(i)}
                      onClick={() => setActivePointIndex(i)}
                      tabIndex={0}
                      aria-label={`View data for ${formatShortDate(pt.date)}`}
                      onFocus={() => setActivePointIndex(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setActivePointIndex(i);
                        }
                      }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Selected Point Details / Tooltip callout */}
            {activePoint && (
              <div
                role="region"
                aria-live="polite"
                aria-label="Selected date details"
                className="mt-3 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/40 via-white to-orange-50/20 p-4 text-xs shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{formatShortDate(activePoint.date)}</span>
                    <span className="text-[11px] text-stone-400">({activePoint.date})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePointIndex(null)}
                    className="text-stone-400 hover:text-stone-600 focus-visible:outline-none"
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                </div>

                {/* Render ALL and ONLY visible series rows with change vs previous point */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {visibleSeries.map((s) => {
                    const key = getSeriesKey(s.name);
                    const currentVal = activePoint[key];
                    const prevVal = prevPoint ? prevPoint[key] : null;
                    const changeText = formatChangeText(currentVal, prevVal);

                    return (
                      <div
                        key={`tooltip-series-${s.name}`}
                        className="rounded-xl border border-stone-200/60 bg-white/90 p-2.5 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                            aria-hidden="true"
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-700">
                            {s.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-1">
                          <span className="font-mono text-base font-bold text-stone-900">{currentVal}</span>
                          <span
                            className={`font-mono text-[10px] font-semibold ${
                              changeText.startsWith('+')
                                ? 'text-emerald-700'
                                : changeText.startsWith('-')
                                  ? 'text-rose-700'
                                  : 'text-stone-400'
                            }`}
                          >
                            {changeText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day's changes (added/expired records) */}
                {activePoint.changes && activePoint.changes.length > 0 && (
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-stone-100">
                    <span className="text-[11px] font-semibold text-stone-700">Events on this day:</span>
                    <div className="space-y-1">
                      {activePoint.changes.map((ch, idx) => (
                        <div
                          key={`ch-${idx}`}
                          className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1 border border-stone-200/50"
                        >
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              ch.direction === 'added' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ch.direction}
                          </span>
                          <span className="truncate font-medium text-stone-800">{ch.label}</span>
                          <span className="ml-auto text-[10px] text-stone-400 capitalize">{ch.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
