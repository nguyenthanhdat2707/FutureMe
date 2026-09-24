import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  DEMO_PERSONA_CHANGED_EVENT,
  getSelectedDemoPersonaId,
  isDemoMode,
} from '../../config/demo-personas';
import { TopBar } from './TopBar';

export function AuthenticatedLayout() {
  const [contentKey, setContentKey] = useState(() => isDemoMode ? getSelectedDemoPersonaId() : 'authenticated');

  useEffect(() => {
    if (!isDemoMode) return;
    const refreshForPersona = () => setContentKey(getSelectedDemoPersonaId());
    window.addEventListener(DEMO_PERSONA_CHANGED_EVENT, refreshForPersona);
    return () => window.removeEventListener(DEMO_PERSONA_CHANGED_EVENT, refreshForPersona);
  }, []);

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <TopBar />
      <main key={contentKey} className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthenticatedLayout;
