import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isCognitoMode } from '../../auth/cognito';
import {
  clearPersonaSessionState,
  DEMO_PERSONAS,
  DEMO_PERSONA_CHANGED_EVENT,
  getSelectedDemoPersonaId,
  isDemoMode,
  setSelectedDemoPersonaId,
} from '../../config/demo-personas';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Ask Future Me', to: '/ask-future-me' },
  { label: 'Decisions', to: '/decisions' },
  { label: 'Understanding', to: '/understanding' },
] as const;

function initials(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FM';
}

export function TopBar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [selectedPersonaId, setSelectedPersonaId] = useState(() => isDemoMode ? getSelectedDemoPersonaId() : '');

  useEffect(() => {
    if (!isDemoMode) return;
    const syncPersona = () => setSelectedPersonaId(getSelectedDemoPersonaId());
    window.addEventListener(DEMO_PERSONA_CHANGED_EVENT, syncPersona);
    window.addEventListener('storage', syncPersona);
    return () => {
      window.removeEventListener(DEMO_PERSONA_CHANGED_EVENT, syncPersona);
      window.removeEventListener('storage', syncPersona);
    };
  }, []);

  const profileName = useMemo(() => {
    if (isDemoMode) {
      return DEMO_PERSONAS.find((persona) => persona.id === selectedPersonaId)?.displayName ?? 'Demo profile';
    }
    return user?.getUsername() ?? 'Profile';
  }, [selectedPersonaId, user]);

  const changePersona = (personaId: string) => {
    clearPersonaSessionState();
    setSelectedDemoPersonaId(personaId);
    setSelectedPersonaId(personaId);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-x-5 px-4 py-3 sm:px-6 lg:px-10">
        <NavLink to="/dashboard" className="flex shrink-0 items-center gap-2.5 text-text-primary" aria-label="Future Me dashboard">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm">F</span>
          <span className="font-serif text-lg font-semibold tracking-tight">Future Me</span>
        </NavLink>

        <nav className="order-3 mt-3 grid w-full grid-cols-4 gap-1 sm:order-2 sm:mt-0 sm:flex sm:w-auto sm:flex-1 sm:justify-center" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-colors sm:px-3 sm:text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <details className="group relative ml-auto shrink-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-surface-border bg-surface py-1.5 pl-1.5 pr-2.5 shadow-sm transition hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            <span className="grid size-8 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-900" aria-hidden="true">
              {initials(profileName)}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-semibold text-text-primary md:block">{profileName}</span>
            <span className="text-xs text-text-secondary transition group-open:rotate-180" aria-hidden="true">⌄</span>
          </summary>

          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-surface-border bg-surface p-2 shadow-xl">
            <div className="border-b border-surface-border px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">Profile</p>
              <p className="mt-1 truncate text-sm font-semibold text-text-primary">{profileName}</p>
            </div>

            {isDemoMode && (
              <div className="py-2" aria-label="Switch demo persona">
                <p className="px-3 pb-1 text-xs text-text-secondary">Demo persona</p>
                {DEMO_PERSONAS.map((persona) => {
                  const selected = persona.id === selectedPersonaId;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => changePersona(persona.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left transition ${
                        selected ? 'bg-primary/10 text-primary' : 'text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{persona.displayName}</span>
                      <span className="mt-0.5 block text-xs text-text-secondary">{persona.scenario}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {isCognitoMode && (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Sign out
              </button>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}

export default TopBar;
