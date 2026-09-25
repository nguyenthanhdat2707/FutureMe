export const DEMO_PERSONAS = [
  {
    slug: 'focused-builder',
    id: 'temporal-demo-v1:focused-builder',
    displayName: 'Product Engineer',
    scenario: 'Protects a scarce morning focus window before a Friday release.',
    expectedJourney: 'MOVE LOW-VALUE SYNC',
  },
  {
    slug: 'busy-balancer',
    id: 'temporal-demo-v1:busy-balancer',
    displayName: 'Pitch-Week Founder',
    scenario: 'A packed week still supports a valuable pitch after weaker commitments move.',
    expectedJourney: 'FULL CALENDAR → YES',
  },
  {
    slug: 'overloaded-lead',
    id: 'temporal-demo-v1:overloaded-lead',
    displayName: 'Deadline-Pressed Founder',
    scenario: 'An empty-looking afternoon is reserved by unscheduled investor and proposal work.',
    expectedJourney: 'EMPTY SLOT → NO',
  },
  {
    slug: 'needs-clarity',
    id: 'temporal-demo-v1:needs-clarity',
    displayName: 'Working Student',
    scenario: 'A visually free afternoon is already consumed by certification, assignment, and hackathon work.',
    expectedJourney: 'HIDDEN WORKLOAD → NO',
  },
  {
    slug: 'uncertain-skipper',
    id: 'temporal-demo-v1:uncertain-skipper',
    displayName: 'Lecturer — Committee Unclear',
    scenario: 'A tentative faculty review conflicts with a guest lecture and attendance is unknown.',
    expectedJourney: 'UNCERTAINTY → ASK',
  },
  {
    slug: 'conflict-check',
    id: 'temporal-demo-v1:conflict-check',
    displayName: 'Research Lecturer',
    scenario: 'Fixed teaching and a proposal deadline coexist with movable institutional work.',
    expectedJourney: 'FULL CALENDAR → YES',
  },
] as const;

export type DemoPersonaId = typeof DEMO_PERSONAS[number]['id'];

export const isDemoMode = import.meta.env.VITE_AUTH_MODE === 'demo';
export const DEMO_PERSONA_STORAGE_KEY = 'future-me-demo-persona';
export const DEMO_PERSONA_CHANGED_EVENT = 'future-me-demo-persona-changed';

export function isDemoPersonaId(value: string): value is DemoPersonaId {
  return DEMO_PERSONAS.some((persona) => persona.id === value);
}

export function getSelectedDemoPersonaId(): DemoPersonaId {
  try {
    const selected = localStorage.getItem(DEMO_PERSONA_STORAGE_KEY);
    if (selected && isDemoPersonaId(selected)) return selected;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return DEMO_PERSONAS[0].id;
}

export function setSelectedDemoPersonaId(personaId: string): DemoPersonaId {
  if (!isDemoPersonaId(personaId)) throw new Error('Unknown demo persona');
  try {
    localStorage.setItem(DEMO_PERSONA_STORAGE_KEY, personaId);
  } catch {
    // The in-memory event still lets the current page switch persona.
  }
  window.dispatchEvent(new CustomEvent(DEMO_PERSONA_CHANGED_EVENT, { detail: personaId }));
  return personaId;
}

export function clearPersonaSessionState(): void {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith('decisions_')) sessionStorage.removeItem(key);
    }
  } catch {
    // Session storage is optional; persona switching still works without it.
  }
}
