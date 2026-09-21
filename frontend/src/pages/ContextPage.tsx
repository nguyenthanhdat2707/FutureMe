/**
 * ContextPage - What Future Me Understands
 * Display all context AI has about the user
 */
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { PersonalContext, Goal, Commitment, Preference } from '../types/domain';

function ContextPage() {
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.context.getCurrent();
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, []);

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-text-secondary">Loading context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-accent-warning">Error: {error}</p>
        <button
          onClick={loadContext}
          className="mt-4 px-4 py-2 bg-accent-ai text-white rounded hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="p-8">
        <p className="text-text-secondary">No context available</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">What Future Me Understands</h1>
        <p className="text-text-secondary">Your goals, commitments, and preferences</p>
        <p className="text-xs text-text-secondary mt-1">
          Last updated: {formatDateTime(context.lastUpdated)}
        </p>
      </header>

      {/* Goals */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Active Goals</h2>
        
        {context.goals.length === 0 ? (
          <div className="card p-6">
            <p className="text-text-secondary text-sm">No goals found. Add your first goal to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {context.goals.map((goal: Goal) => (
              <div key={goal.id} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-1">{goal.description}</h3>
                    {goal.deadline && (
                      <p className="text-xs text-text-secondary">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 bg-opacity-10 text-xs font-medium rounded ${
                    goal.priority === 'high' ? 'bg-accent-warning text-accent-warning' :
                    goal.priority === 'medium' ? 'bg-accent-intention text-accent-intention' :
                    'bg-slate-200 text-text-secondary'
                  }`}>
                    {goal.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Commitments */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Active Commitments</h2>
        
        {context.commitments.length === 0 ? (
          <div className="card p-6">
            <p className="text-text-secondary text-sm">No commitments tracked yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {context.commitments.map((commitment: Commitment) => (
              <div key={commitment.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-1">{commitment.description}</h3>
                    <p className="text-xs text-text-secondary">
                      {new Date(commitment.startTime).toLocaleString()} - {new Date(commitment.endTime).toLocaleString()}
                    </p>
                    {commitment.recurring && (
                      <span className="inline-block mt-2 px-2 py-1 bg-accent-intention bg-opacity-10 text-accent-intention text-xs font-medium rounded">
                        RECURRING
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preferences */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Your Preferences</h2>
        
        {context.preferences.length === 0 ? (
          <div className="card p-6">
            <p className="text-text-secondary text-sm">No preferences learned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {context.preferences.map((pref: Preference) => (
              <div key={pref.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-text-primary">{pref.category}</h3>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">{pref.description}</p>
                    <p className="font-mono text-sm text-text-primary">{pref.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calendar Summary */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Calendar Overview</h2>
        
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Upcoming Events</p>
              <p className="font-mono text-2xl text-text-primary">{context.calendar.upcomingEvents}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Busy Hours Today</p>
              <p className="font-mono text-2xl text-text-primary">{context.calendar.busyHoursToday.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Busy Hours This Week</p>
              <p className="font-mono text-2xl text-text-primary">{context.calendar.busyHoursThisWeek.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Decisions */}
      {context.recentDecisions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif text-text-primary">Recent Decisions</h2>
          
          <div className="card p-6">
            <p className="text-sm text-text-secondary">
              {context.recentDecisions.length} decision{context.recentDecisions.length !== 1 ? 's' : ''} in recent history
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default ContextPage;
