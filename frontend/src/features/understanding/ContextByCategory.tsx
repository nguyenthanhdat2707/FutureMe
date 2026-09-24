import { useMemo } from 'react';
import type { PersonalContext, UnderstandingHistoryResponse } from '../../types/domain';
import { calculateCategoryBreakdown } from './understanding-utils';

interface ContextByCategoryProps {
  context: PersonalContext | null;
  history?: UnderstandingHistoryResponse | null;
}

export function ContextByCategory({ context, history }: ContextByCategoryProps) {
  const breakdown = useMemo(() => calculateCategoryBreakdown(context, history), [context, history]);

  // Compute maximum count to scale horizontal bars proportionally without percentages
  const maxCount = useMemo(() => {
    return Math.max(1, ...breakdown.items.map((i) => i.count));
  }, [breakdown]);

  return (
    <section
      aria-labelledby="category-breakdown-title"
      className="rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur transition-all sm:p-6 lg:p-7 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 id="category-breakdown-title" className="font-serif text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              Context by Category
            </h2>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              Live record counts of active knowledge in your model.
            </p>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-mono text-xs font-semibold text-stone-700">
            {breakdown.total} total
          </span>
        </div>

        {breakdown.isEmpty ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 p-8 text-center bg-stone-50/40">
            <p className="text-sm font-medium text-stone-700">No active context categorized yet</p>
            <p className="mt-1 text-xs text-stone-400">
              Goals, commitments, preferences, and decisions will appear here as they are established.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Four short horizontal count bars (no percentages, no stacked composition bar) */}
            <div className="space-y-3.5 pt-1">
              {breakdown.items.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-stone-700">
                      <span
                        className="inline-block size-2 rounded-full shadow-2xs"
                        style={{ backgroundColor: item.barColor }}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">{item.count}</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.count > 0 ? Math.max(6, (item.count / maxCount) * 100) : 0}%`,
                        backgroundColor: item.barColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-stone-100 pt-3">
        <p className="text-[11px] text-stone-400">
          Four distinct categories matching the evolution timeline. Reflects currently valid context and logged decisions.
        </p>
      </div>
    </section>
  );
}
