import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEMO_PERSONAS,
  clearPersonaSessionState,
  getSelectedDemoPersonaId,
  setSelectedDemoPersonaId,
  type DemoPersonaId,
} from '../config/demo-personas';

function DemoPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<DemoPersonaId>(getSelectedDemoPersonaId);

  const choosePersona = (personaId: string) => {
    clearPersonaSessionState();
    const next = setSelectedDemoPersonaId(personaId);
    setSelectedId(next);
    navigate('/');
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Public Demo Personas</h1>
        <p className="text-text-secondary">
          Choose a synthetic scenario and explore Future Me immediately. No account or real personal data is used.
        </p>
      </header>

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

      <aside className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-900">
        These personas are shared, mutable demo data. They are not authenticated accounts and must never contain private information.
      </aside>
    </div>
  );
}

export default DemoPage;
