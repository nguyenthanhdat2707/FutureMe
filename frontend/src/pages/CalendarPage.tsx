import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { CalendarStatusResponse, CalendarEvent } from '../types/domain';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from '../components/InterventionCard';

function CalendarPage() {
  const [status, setStatus] = useState<CalendarStatusResponse | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { intervention, refresh: refreshInterventions, respond, dismiss } = useInterventions();

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [statusData, eventsData] = await Promise.all([
        api.calendar.getStatus(),
        api.calendar.getEvents()
      ]);
      if (signal?.aborted) return;
      setStatus(statusData);
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      await loadData(controller.signal);
    };
    void init();
    return () => controller.abort();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await api.calendar.sync();
      await loadData();
      await refreshInterventions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="p-8"><p className="text-text-secondary">Loading calendar data...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Calendar Integration</h1>
          <p className="text-text-secondary mt-1">Connect your calendar to enable smart scheduling</p>
        </div>
        <button
          onClick={() => void handleSync()}
          disabled={syncing || loading}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {intervention && (
        <InterventionCard
          intervention={intervention}
          onRespond={respond}
          onDismiss={dismiss}
        />
      )}

      {error && (
        <div className="p-4 bg-error/10 text-error rounded border border-error/20">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-medium text-text-primary mb-4">Connection Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-surface-border">
              <span className="text-text-secondary">Status</span>
              <span className="font-medium text-text-primary capitalize">
                {status?.status === 'synced' ? 'Synced' : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-surface-border">
              <span className="text-text-secondary">Last Sync</span>
              <span className="font-medium text-text-primary">
                {status?.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-surface-border">
              <span className="text-text-secondary">Events Indexed</span>
              <span className="font-medium text-text-primary">
                {events.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Calendar Plans</h2>

        {status?.status === 'never' ? (
          <div className="card p-8 text-center space-y-4">
            <p className="text-text-secondary">No calendar connected yet. Click Sync to fetch your seeded plans.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="card p-6">
                <p className="text-text-secondary">No plans found in calendar.</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="card p-6">
                  <h3 className="font-medium text-text-primary mb-1">{event.title}</h3>
                  <p className="text-sm text-text-secondary mb-2">
                    {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                  </p>
                  <div className="inline-block px-2 py-1 bg-surface-hover text-text-secondary text-xs font-medium rounded uppercase">
                    Plan Evidence
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default CalendarPage;
