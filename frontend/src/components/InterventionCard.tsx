import { useState } from 'react';
import type { ProactiveIntervention } from '../types/domain';

export interface InterventionCardProps {
  intervention: ProactiveIntervention | null;
  onRespond: (action: string) => Promise<void>;
  onDismiss: () => Promise<void>;
  className?: string;
}

export function InterventionCard({
  intervention,
  onRespond,
  onDismiss,
  className = '',
}: InterventionCardProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!intervention) {
    return null;
  }

  const type = intervention.interventionType || intervention.type;
  if (!type || type === 'NONE') {
    return null;
  }

  const isDisruption = type === 'CONSEQUENTIAL_DISRUPTION';
  const severity = intervention.severity || 'medium';

  const handleAction = async (action: string) => {
    setSubmitting(true);
    try {
      if (action.toLowerCase() === 'dismiss') {
        await onDismiss();
      } else {
        await onRespond(action);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const actions = (intervention.suggestedActions || ['Acknowledge']).filter(
    (action) => action.toLowerCase() !== 'dismiss'
  );

  return (
    <aside
      role="alert"
      aria-live="polite"
      className={`card p-5 border transition-all ${
        isDisruption
          ? severity === 'high'
            ? 'bg-rose-50/80 border-rose-300 text-rose-950'
            : 'bg-amber-50/80 border-amber-300 text-amber-950'
          : 'bg-sky-50/80 border-sky-300 text-sky-950'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase ${
                isDisruption
                  ? severity === 'high'
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-amber-200 text-amber-800'
                  : 'bg-sky-200 text-sky-800'
              }`}
            >
              {isDisruption ? 'Disruption Alert' : 'Context Check'}
            </span>
            {isDisruption && (
              <span className="text-xs font-medium text-text-secondary capitalize">
                Severity: {severity}
              </span>
            )}
          </div>

          <h3 className="font-serif font-medium text-base text-text-primary">
            {intervention.prompt || intervention.reason}
          </h3>

          {intervention.reason && intervention.prompt && intervention.reason !== intervention.prompt && (
            <p className="text-xs text-text-secondary">
              {intervention.reason}
            </p>
          )}
        </div>

        <button
          type="button"
          aria-label="Dismiss intervention"
          onClick={() => void handleAction('dismiss')}
          disabled={submitting}
          className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-black/5 transition-colors disabled:opacity-40"
        >
          <span className="sr-only">Dismiss</span>
          ✕
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => void handleAction(action)}
            disabled={submitting}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isDisruption
                ? severity === 'high'
                  ? 'bg-rose-700 text-white hover:bg-rose-800'
                  : 'bg-amber-700 text-white hover:bg-amber-800'
                : 'bg-sky-700 text-white hover:bg-sky-800'
            }`}
          >
            {action}
          </button>
        ))}

        <button
          type="button"
          onClick={() => void handleAction('dismiss')}
          disabled={submitting}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary border border-surface-border bg-white/70 hover:bg-white transition-colors disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

export default InterventionCard;
