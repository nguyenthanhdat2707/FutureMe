import { useState, useMemo } from 'react';
import type { PersonalContext, UnderstandingHistoryResponse } from '../../types/domain';
import { deriveLearnedInsights } from './understanding-utils';

interface WhatFutureMeLearnedProps {
  context: PersonalContext | null;
  history: UnderstandingHistoryResponse | null;
}

export function WhatFutureMeLearned({ context, history }: WhatFutureMeLearnedProps) {
  const [expandedMobile, setExpandedMobile] = useState(false);
  const insights = useMemo(() => deriveLearnedInsights(context, history), [context, history]);

  const renderSourceBadge = (sourceLabel: string) => {
    const isConfirmed = sourceLabel.toLowerCase().includes('confirmed');
    const isCalendar = sourceLabel.toLowerCase().includes('calendar');
    const isHistory = sourceLabel.toLowerCase().includes('history');

    const badgeCls = isConfirmed
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : isCalendar
        ? 'bg-sky-50 text-sky-800 border-sky-200'
        : isHistory
          ? 'bg-stone-100 text-stone-700 border-stone-200'
          : 'bg-purple-50 text-purple-800 border-purple-200';

    return (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeCls}`}>
        {sourceLabel}
      </span>
    );
  };

  return (
    <section
      aria-labelledby="what-future-me-learned-title"
      className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur transition-all sm:p-6 lg:p-7 flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 id="what-future-me-learned-title" className="font-serif text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              What Future Me Learned
            </h2>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              Deterministic patterns and lifecycle observations extracted from your data.
            </p>
          </div>

          <span className="self-start rounded-full border border-amber-300/60 bg-amber-100/50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-950 sm:self-auto">
            Verified signals
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 p-8 text-center bg-stone-50/40">
            <p className="text-sm font-medium text-stone-700">No learned context yet</p>
            <p className="mt-1 text-xs text-stone-400">
              As you record goals, commitments, or sync your calendar, verified observations will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={insight.id}
                className={`flex-col justify-between rounded-2xl border border-stone-200/70 bg-white p-3.5 shadow-2xs transition hover:border-amber-300/70 ${
                  idx >= 2 && !expandedMobile ? 'hidden sm:flex' : 'flex'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                      {insight.category}
                    </span>
                    {renderSourceBadge(insight.sourceLabel)}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-stone-900">{insight.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{insight.detail}</p>
                </div>

                {insight.sourceNote && (
                  <div className="mt-2.5 border-t border-stone-100 pt-2 text-[10px] text-stone-400">
                    <span>{insight.sourceNote}</span>
                  </div>
                )}
              </div>
            ))}

            {insights.length > 2 && (
              <div className="pt-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => setExpandedMobile((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 underline focus-visible:outline-none"
                >
                  {expandedMobile ? 'View less' : `View more (${insights.length - 2} more)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-stone-100 pt-3">
        <p className="text-[11px] text-stone-400">
          Strictly grounded in verified context records and schedule lifecycle changes.
        </p>
      </div>
    </section>
  );
}
