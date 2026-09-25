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
    <div className="min-h-screen min-w-0" style={{ background: 'radial-gradient(circle at 10% 10%, rgba(122, 92, 246, 0.08), transparent 34%), radial-gradient(circle at 88% 18%, rgba(255, 134, 55, 0.06), transparent 30%), linear-gradient(180deg, #fbfaf7 0%, #f7f5f2 100%)' }}>
      <TopBar />
      <main key={`${contentIdentity.personaId}:${contentIdentity.revision}`} className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthenticatedLayout;
