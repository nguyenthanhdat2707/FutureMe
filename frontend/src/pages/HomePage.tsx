import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { PersonalContext, SetupAnswers } from '../types/domain';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from '../components/InterventionCard';

function HomePage() {
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [setupAnswers, setSetupAnswers] = useState<SetupAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const { intervention, respond, dismiss } = useInterventions();

  const loadContext = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.context.getCurrent();
      if (signal?.aborted) return;
      setContext(data);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load context');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      await loadContext(controller.signal);
    };
    void init();
    return () => controller.abort();
  }, [loadContext]);

  const handleSetupSubmit = async (answersToSubmit: SetupAnswers = setupAnswers) => {
    setSubmitting(true);
    try {
      await api.context.setup(answersToSubmit);
      await loadContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setup');
    } finally {
      setSubmitting(false);
    }
  };

  const updateAnswer = (key: keyof SetupAnswers, value: string) => {
    if (value.trim() === '') {
      skipAnswer(key);
    } else {
      setSetupAnswers(prev => ({ ...prev, [key]: value }));
    }
  };

  const skipAnswer = (key: keyof SetupAnswers) => {
    setSetupAnswers(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (loading) {
    return <div className="p-8"><p className="text-text-secondary">Loading your context...</p></div>;
  }

  if (error) {
    return <div className="p-8"><p className="text-red-500">Error: {error}</p></div>;
  }

  if (!context) {
    return null;
  }

  // Setup Flow
  if (!context.setupCompleted) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-serif text-text-primary mb-2">Welcome</h1>
          <p className="text-text-secondary">Let's set up your context so I can help you better.</p>
        </header>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-text-primary">1. What are your main priorities right now?</h3>
            <textarea
              className="w-full p-3 border border-surface-border rounded bg-surface-card"
              placeholder="E.g., Finishing the hackathon, exercising daily..."
              value={setupAnswers.priorities || ''}
              onChange={(e) => updateAnswer('priorities', e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => skipAnswer('priorities')}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                Not sure / Skip
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-text-primary">2. Any hard deadlines or non-negotiable commitments?</h3>
            <textarea
              className="w-full p-3 border border-surface-border rounded bg-surface-card"
              placeholder="E.g., Demo on Sunday at 5PM, picking up kids at 3PM..."
              value={setupAnswers.deadlines || ''}
              onChange={(e) => updateAnswer('deadlines', e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => skipAnswer('deadlines')}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                Not sure / Skip
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-text-primary">3. How do you track your plans?</h3>
            <textarea
              className="w-full p-3 border border-surface-border rounded bg-surface-card"
              placeholder="E.g., Google Calendar, Notion, mostly in my head..."
              value={setupAnswers.tracking || ''}
              onChange={(e) => updateAnswer('tracking', e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => skipAnswer('tracking')}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                Not sure / Skip
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
          <button
            onClick={() => void handleSetupSubmit()}
            disabled={submitting}
            className="px-6 py-2 bg-accent-ai text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Complete Setup'}
          </button>
          <button
            onClick={() => {
              setSetupAnswers({});
              void handleSetupSubmit({});
            }}
            disabled={submitting}
            className="px-6 py-2 text-text-secondary border border-surface-border rounded-lg hover:bg-surface-hover disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Dashboard Flow
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-secondary">Here's your current context summary.</p>
      </header>

      {intervention && (
        <InterventionCard
          intervention={intervention}
          onRespond={respond}
          onDismiss={dismiss}
        />
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-1">Goals & Commitments</p>
          <p className="text-2xl font-mono text-text-primary">
            {context.goals.length + context.commitments.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-1">Calendar Status</p>
          <p className="text-lg font-mono text-text-primary capitalize">
            {context.calendar.status.replace('_', ' ')}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-1">Recent Decisions</p>
          <p className="text-2xl font-mono text-text-primary">{context.recentDecisions.length}</p>
        </div>
      </section>

      {/* Calendar State */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Calendar Plans</h2>
        <div className="card p-6">
          {context.calendar.status === 'unknown' ? (
            <p className="text-text-secondary">Your calendar is not synced. We have no evidence of your schedule.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-text-primary">
                Upcoming events: {context.calendar.upcomingEvents}
              </p>
              <p className="text-text-secondary text-sm">
                Last synced: {context.calendar.lastSync ? new Date(context.calendar.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
          )}
          <Link to="/calendar" className="inline-block mt-4 text-accent-ai hover:underline">
            Manage Calendar Sync
          </Link>
        </div>
      </section>

      {/* Links */}
      <section className="space-y-4 pt-4 border-t border-surface-border">
        <div className="flex gap-4">
          <Link to="/context" className="px-4 py-2 bg-surface-card border border-surface-border rounded-lg text-text-primary hover:bg-surface-hover">
            What Future Me Understands
          </Link>
          <Link to="/decisions" className="px-4 py-2 bg-surface-card border border-surface-border rounded-lg text-text-primary hover:bg-surface-hover">
            Ask Future Me
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
