import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { ProactiveIntervention } from '../types/domain';

export function useInterventions() {
  const [intervention, setIntervention] = useState<ProactiveIntervention | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await api.interventions.check();
      if (signal?.aborted) return;
      if (response.hasInterventions && response.interventions.length > 0) {
        setIntervention(response.interventions[0]);
      } else {
        setIntervention(null);
      }
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to evaluate interventions');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const respond = useCallback(
    async (action: string) => {
      if (!intervention) return;
      const interventionId = intervention.interventionId || intervention.id;
      if (!interventionId) return;

      try {
        await api.interventions.respond(interventionId, action);
        setIntervention(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to respond to intervention');
        throw err;
      }
    },
    [intervention]
  );

  const dismiss = useCallback(async () => {
    return respond('dismiss');
  }, [respond]);

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      await check(controller.signal);
    };
    void init();
    return () => controller.abort();
  }, [check]);

  return {
    intervention,
    loading,
    error,
    check,
    refresh: check,
    respond,
    dismiss,
  };
}

export default useInterventions;
