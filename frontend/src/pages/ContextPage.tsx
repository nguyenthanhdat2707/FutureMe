/**
 * ContextPage - What Future Me Understands
 * Display all context AI has about the user
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { PersonalContext, Goal, Commitment, Preference, ObservationSource } from '../types/domain';

function ContextPage() {
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: string; id: string; value: string } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadContext = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await api.context.getCurrent();
      setContext(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContext(false);
  }, [loadContext]);

  const handleConfirm = async (attributeId: string) => {
    if (!attributeId) return;
    
    try {
      setActionInProgress(attributeId);
      await api.context.confirm(attributeId);
      await loadContext(); // Reload to show updated source
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm attribute');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStartEdit = (type: string, id: string, currentValue: string) => {
    setEditingItem({ type, id, value: currentValue });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editingItem.id) return;

    try {
      setActionInProgress(editingItem.id);
      const correctedValue = editingItem.type === 'preference'
        ? JSON.stringify({ value: editingItem.value })
        : editingItem.value;

      await api.context.correct({
        attributeId: editingItem.id,
        correctedValue,
        reason: 'User correction'
      });
      await loadContext();
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save correction');
    } finally {
      setActionInProgress(null);
    }
  };

  const getSourceBadge = (source?: ObservationSource, confidence?: number) => {
    if (!source) return null;

    const badges: Record<string, { label: string; color: string; bgColor: string }> = {
      USER_CONFIRMED: { label: 'Confirmed', color: 'text-green-600', bgColor: 'bg-green-50' },
      SYSTEM_INFERRED: { label: 'AI Inferred', color: 'text-accent-ai', bgColor: 'bg-accent-ai bg-opacity-10' },
      SYSTEM_OBSERVED: { label: 'Observed', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      CALENDAR: { label: 'From Calendar', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      HISTORICAL_PATTERN: { label: 'From Pattern', color: 'text-amber-600', bgColor: 'bg-amber-50' },
      EXTERNAL_SOURCE: { label: 'External', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    };

    const badge = badges[source] || { label: source, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    const confidenceText = confidence !== undefined && confidence < 1 ? ` (${Math.round(confidence * 100)}%)` : '';

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${badge.color} ${badge.bgColor}`}>
        {badge.label}{confidenceText}
      </span>
    );
  };

  const isInferred = (source?: ObservationSource) => {
    return source === 'SYSTEM_INFERRED' || source === 'HISTORICAL_PATTERN';
  };

  const isUserConfirmed = (source?: ObservationSource) => {
    return source === 'USER_CONFIRMED';
  };

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
          onClick={() => loadContext()}
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
                    {editingItem?.type === 'goal' && editingItem.id === goal.attributeId ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingItem.value}
                          onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                          className="w-full px-3 py-2 border border-surface-border rounded bg-surface-card text-text-primary"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={actionInProgress === goal.attributeId}
                            className="px-3 py-1 text-sm bg-accent-ai text-white rounded hover:opacity-90 disabled:opacity-50"
                          >
                            {actionInProgress === goal.attributeId ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm bg-surface-hover text-text-primary rounded hover:opacity-90"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2 mb-1">
                          <h3 className="font-medium text-text-primary flex-1">
                            {isInferred(goal.source) && (
                              <span className="text-text-secondary text-sm mr-2">AI believes:</span>
                            )}
                            {goal.description}
                          </h3>
                        </div>
                        {goal.deadline && (
                          <p className="text-xs text-text-secondary">
                            Deadline: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-1 bg-opacity-10 text-xs font-medium rounded ${
                      goal.priority === 'high' ? 'bg-accent-warning text-accent-warning' :
                      goal.priority === 'medium' ? 'bg-accent-intention text-accent-intention' :
                      'bg-slate-200 text-text-secondary'
                    }`}>
                      {goal.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    {getSourceBadge(goal.source, goal.confidence)}
                    {goal.observedAt && (
                      <span className="text-xs text-text-secondary ml-2">
                        Observed: {new Date(goal.observedAt).toLocaleDateString()}
                      </span>
                    )}
                    {goal.validUntil && (
                      <span className="text-xs text-text-secondary ml-2">
                        Valid until: {new Date(goal.validUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {goal.attributeId && !isUserConfirmed(goal.source) && goal.source !== 'CALENDAR' && editingItem?.id !== goal.attributeId && (
                    <div className="flex gap-2">
                      {isInferred(goal.source) && (
                        <button
                          onClick={() => handleConfirm(goal.attributeId!)}
                          disabled={actionInProgress === goal.attributeId}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                        >
                          {actionInProgress === goal.attributeId ? '...' : '✓ Confirm'}
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit('goal', goal.attributeId!, goal.description)}
                        className="px-3 py-1 text-xs bg-surface-hover text-text-primary rounded hover:opacity-90"
                      >
                        Edit
                      </button>
                    </div>
                  )}
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
                    {editingItem?.type === 'commitment' && editingItem.id === commitment.attributeId ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingItem.value}
                          onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                          className="w-full px-3 py-2 border border-surface-border rounded bg-surface-card text-text-primary"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={actionInProgress === commitment.attributeId}
                            className="px-3 py-1 text-sm bg-accent-ai text-white rounded hover:opacity-90 disabled:opacity-50"
                          >
                            {actionInProgress === commitment.attributeId ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm bg-surface-hover text-text-primary rounded hover:opacity-90"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium text-text-primary mb-1">
                          {isInferred(commitment.source) && (
                            <span className="text-text-secondary text-sm mr-2">AI believes:</span>
                          )}
                          {commitment.description}
                        </h3>
                        <p className="text-xs text-text-secondary">
                          {new Date(commitment.startTime).toLocaleString()} - {new Date(commitment.endTime).toLocaleString()}
                        </p>
                        {commitment.recurring && (
                          <span className="inline-block mt-2 px-2 py-1 bg-accent-intention bg-opacity-10 text-accent-intention text-xs font-medium rounded">
                            RECURRING
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    {getSourceBadge(commitment.source, commitment.confidence)}
                    {commitment.observedAt && (
                      <span className="text-xs text-text-secondary ml-2">
                        Observed: {new Date(commitment.observedAt).toLocaleDateString()}
                      </span>
                    )}
                    {commitment.validUntil && (
                      <span className="text-xs text-text-secondary ml-2">
                        Valid until: {new Date(commitment.validUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {commitment.attributeId && !isUserConfirmed(commitment.source) && commitment.source !== 'CALENDAR' && editingItem?.id !== commitment.attributeId && (
                    <div className="flex gap-2">
                      {isInferred(commitment.source) && (
                        <button
                          onClick={() => handleConfirm(commitment.attributeId!)}
                          disabled={actionInProgress === commitment.attributeId}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                        >
                          {actionInProgress === commitment.attributeId ? '...' : '✓ Confirm'}
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit('commitment', commitment.attributeId!, commitment.description)}
                        className="px-3 py-1 text-xs bg-surface-hover text-text-primary rounded hover:opacity-90"
                      >
                        Edit
                      </button>
                    </div>
                  )}
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
                    {editingItem?.type === 'preference' && editingItem.id === pref.attributeId ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingItem.value}
                          onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                          className="w-full px-3 py-2 border border-surface-border rounded bg-surface-card text-text-primary"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={actionInProgress === pref.attributeId}
                            className="px-3 py-1 text-sm bg-accent-ai text-white rounded hover:opacity-90 disabled:opacity-50"
                          >
                            {actionInProgress === pref.attributeId ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm bg-surface-hover text-text-primary rounded hover:opacity-90"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-text-primary">{pref.category}</h3>
                        </div>
                        <p className="text-sm text-text-secondary mb-1">
                          {isInferred(pref.source) && (
                            <span className="text-text-secondary text-xs mr-1">AI believes: </span>
                          )}
                          {pref.description}
                        </p>
                        <p className="font-mono text-sm text-text-primary">{pref.value}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    {getSourceBadge(pref.source, pref.confidence)}
                    {pref.observedAt && (
                      <span className="text-xs text-text-secondary ml-2">
                        Observed: {new Date(pref.observedAt).toLocaleDateString()}
                      </span>
                    )}
                    {pref.validUntil && (
                      <span className="text-xs text-text-secondary ml-2">
                        Valid until: {new Date(pref.validUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {pref.attributeId && !isUserConfirmed(pref.source) && pref.source !== 'CALENDAR' && editingItem?.id !== pref.attributeId && (
                    <div className="flex gap-2">
                      {isInferred(pref.source) && (
                        <button
                          onClick={() => handleConfirm(pref.attributeId!)}
                          disabled={actionInProgress === pref.attributeId}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                        >
                          {actionInProgress === pref.attributeId ? '...' : '✓ Confirm'}
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit('preference', pref.attributeId!, pref.value)}
                        className="px-3 py-1 text-xs bg-surface-hover text-text-primary rounded hover:opacity-90"
                      >
                        Edit
                      </button>
                    </div>
                  )}
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
                    <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Status</p>
              <p className="font-mono text-lg text-text-primary capitalize">{context.calendar.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Last Sync</p>
              <p className="font-mono text-lg text-text-primary">
                {context.calendar.lastSync ? new Date(context.calendar.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Upcoming Events</p>
              <p className="font-mono text-2xl text-text-primary">{context.calendar.upcomingEvents}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Busy Hours Today</p>
              <p className="font-mono text-2xl text-text-primary">{context.calendar.busyHoursToday === null ? 'Unknown' : `${context.calendar.busyHoursToday.toFixed(1)}h`}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Busy Hours This Week</p>
              <p className="font-mono text-2xl text-text-primary">{context.calendar.busyHoursThisWeek === null ? 'Unknown' : `${context.calendar.busyHoursThisWeek.toFixed(1)}h`}</p>
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
