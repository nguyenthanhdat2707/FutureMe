import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEMO_PERSONAS,
  DEMO_PERSONA_CHANGED_EVENT,
  clearPersonaSessionState,
  getSelectedDemoPersonaId,
  setSelectedDemoPersonaId,
  type DemoPersonaId,
} from '../../config/demo-personas';

function DemoPersonaSelector() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<DemoPersonaId>(getSelectedDemoPersonaId);
  const selected = DEMO_PERSONAS.find((persona) => persona.id === selectedId) ?? DEMO_PERSONAS[0];

  useEffect(() => {
    const syncSelection = () => setSelectedId(getSelectedDemoPersonaId());
    window.addEventListener(DEMO_PERSONA_CHANGED_EVENT, syncSelection);
    window.addEventListener('storage', syncSelection);

    return () => {
      window.removeEventListener(DEMO_PERSONA_CHANGED_EVENT, syncSelection);
      window.removeEventListener('storage', syncSelection);
    };
  }, []);

  const handleChange = (personaId: string) => {
    clearPersonaSessionState();
    const next = setSelectedDemoPersonaId(personaId);
    setSelectedId(next);
    navigate('/');
  };

  return (
    <section className="card p-4 space-y-3" aria-labelledby="demo-persona-label">
      <div>
        <h3 id="demo-persona-label" className="text-sm font-semibold text-text-secondary">Demo persona</h3>
        <p className="text-xs text-text-secondary mt-1">Synthetic shared data · no sign-in</p>
      </div>
      <select
        aria-label="Demo persona"
        value={selectedId}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-text-primary"
      >
        {DEMO_PERSONAS.map((persona) => (
          <option key={persona.id} value={persona.id}>{persona.displayName}</option>
        ))}
      </select>
      <div className="space-y-1">
        <p className="text-xs text-text-secondary">{selected.scenario}</p>
        <p className="text-xs font-medium text-accent-ai">{selected.expectedJourney}</p>
      </div>
    </section>
  );
}

export default DemoPersonaSelector;
