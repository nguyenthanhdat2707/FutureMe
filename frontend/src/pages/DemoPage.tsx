import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEMO_PERSONAS,
  clearPersonaSessionState,
  getSelectedDemoPersonaId,
  setSelectedDemoPersonaId,
  type DemoPersonaId,
} from '../config/demo-personas';
import { api } from '../api/client';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from '../components/InterventionCard';

const PHASE5_SCENARIOS = [
  {
    id: 'stale-context',
    title: 'Scenario 1: Stale Context Check',
    description: 'Calendar event ended 2h ago with no confirmation. Active pending decision exists. Triggers CONTEXT_CHECK.',
    badge: 'Context Check',
  },
  {
    id: 'calendar-conflict',
    title: 'Scenario 2: Calendar Conflict Disruption',
    description: 'A 4-hour meeting conflicts with an active decision deadline. Feasibility becomes not-feasible. Triggers CONSEQUENTIAL_DISRUPTION.',
    badge: 'Disruption',
  },
  {
    id: 'workload-disruption',
    title: 'Scenario 3: Workload Surge Disruption',
    description: 'A sudden +4h workload surge observation leaves zero margin for an active decision. Triggers CONSEQUENTIAL_DISRUPTION.',
    badge: 'Disruption',
  },
  {
    id: 'dismiss-cooldown',
    title: 'Scenario 4: 4-Hour Dismiss Cooldown',
    description: 'A stale calendar intervention was dismissed 20 minutes ago. 4-hour cooldown suppresses repeat. Expects NO_OP silence.',
    badge: 'Cooldown',
  },
  {
    id: 'noop-silence',
    title: 'Scenario 5: Explicit NO_OP Silence Proof',
    description: 'Calendar events exist but no active pending decisions exist. Invariant holds: zero false positives. Expects NO_OP silence.',
    badge: 'Silence Proof',
  },
];

function DemoPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<DemoPersonaId>(getSelectedDemoPersonaId);
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null);
  const { intervention, refresh: refreshInterventions, respond, dismiss } = useInterventions();

  const choosePersona = (personaId: string) => {
    clearPersonaSessionState();
    const next = setSelectedDemoPersonaId(personaId);
    setSelectedId(next);
    navigate('/');
  };

  const handleRunScenario = async (scenarioId: string) => {
    setScenarioLoading(scenarioId);
    setScenarioMessage(null);
    try {
      await api.demo.loadScenario(scenarioId);
      await refreshInterventions();
      setScenarioMessage(`Scenario "${scenarioId}" loaded and evaluated.`);
    } catch (err) {
      setScenarioMessage(err instanceof Error ? err.message : 'Failed to load scenario');
    } finally {
      setScenarioLoading(null);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Public Demo & Verification</h1>
        <p className="text-text-secondary">
          Choose a synthetic persona or test the Phase 5 proactive intervention scenarios live.
        </p>
      </header>

      {/* Phase 5 Proactive Intervention Scenarios */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-serif text-text-primary mb-1">
            Phase 5: Proactive Interventions & Disruption Scenarios
          </h2>
          <p className="text-sm text-text-secondary">
            Deterministic, bounded proactive interventions triggered only when active pending decisions are materially affected.
          </p>
        </div>

        {scenarioMessage && (
          <div className="p-3 bg-accent-ai/10 border border-accent-ai/20 text-accent-ai rounded-lg text-sm">
            {scenarioMessage}
          </div>
        )}

        {intervention && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Triggered Intervention Result:
            </p>
            <InterventionCard
              intervention={intervention}
              onRespond={respond}
              onDismiss={dismiss}
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PHASE5_SCENARIOS.map((sc) => (
            <article key={sc.id} className="card p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-serif font-medium text-text-primary text-base">{sc.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-hover font-mono text-text-secondary">
                    {sc.badge}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{sc.description}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleRunScenario(sc.id)}
                disabled={scenarioLoading !== null}
                className="w-full py-2 px-3 bg-surface-card border border-surface-border text-text-primary hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {scenarioLoading === sc.id ? 'Seeding & Evaluating...' : 'Run Scenario'}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Personas */}
      <section className="space-y-4 pt-6 border-t border-surface-border">
        <h2 className="text-2xl font-serif text-text-primary">Demo Personas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_PERSONAS.map((persona) => {
            const active = persona.id === selectedId;
            return (
              <article key={persona.id} className={`card p-6 space-y-4 ${active ? 'ring-2 ring-accent-ai' : ''}`}>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-serif text-text-primary">{persona.displayName}</h2>
                    {active && <span className="text-xs font-medium text-accent-ai">Active</span>}
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{persona.scenario}</p>
                </div>
                <p className="text-sm font-medium text-accent-ai">Expected journey: {persona.expectedJourney}</p>
                <button
                  type="button"
                  onClick={() => choosePersona(persona.id)}
                  className="px-4 py-2 bg-accent-ai text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
                >
                  {active ? 'Open this persona' : 'Use this persona'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-900">
        These personas and scenarios use synthetic demo data. They are not authenticated accounts and must never contain private information.
      </aside>
    </div>
  );
}

export default DemoPage;
