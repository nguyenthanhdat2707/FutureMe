import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  DEMO_PERSONA_CHANGED_EVENT,
  getSelectedDemoPersonaId,
  isDemoMode,
} from '../../config/demo-personas';
import { TopBar } from './TopBar';

export function AuthenticatedLayout() {
  const [contentIdentity, setContentIdentity] = useState(() => ({
    personaId: isDemoMode ? getSelectedDemoPersonaId() : 'authenticated',
    revision: 0,
  }));

  useEffect(() => {
    if (!isDemoMode) return;
    const refreshForPersona = () => setContentIdentity((current) => ({
      personaId: getSelectedDemoPersonaId(),
      revision: current.revision + 1,
    }));
    window.addEventListener(DEMO_PERSONA_CHANGED_EVENT, refreshForPersona);
    return () => window.removeEventListener(DEMO_PERSONA_CHANGED_EVENT, refreshForPersona);
  }, []);

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <TopBar />
      <main key={`${contentIdentity.personaId}:${contentIdentity.revision}`} className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthenticatedLayout;
