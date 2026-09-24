export const DEMO_PERSONAS = [
  {
    slug: 'focused-builder',
    id: 'phase4-eval-v2:focused-builder',
    displayName: 'Focused Builder',
    scenario: 'Clear priorities with strong confirmed evidence.',
    expectedJourney: 'RECOMMEND · proceed',
  },
  {
    slug: 'busy-balancer',
    id: 'phase4-eval-v2:busy-balancer',
    displayName: 'Busy Balancer',
    scenario: 'Limited capacity and a recent workload increase.',
    expectedJourney: 'RECOMMEND · proceed with caution',
  },
  {
    slug: 'overloaded-lead',
    id: 'phase4-eval-v2:overloaded-lead',
    displayName: 'Overloaded Lead',
    scenario: 'An overloaded calendar with consequential disruption.',
    expectedJourney: 'RECOMMEND · do not proceed',
  },
  {
    slug: 'needs-clarity',
    id: 'phase4-eval-v2:needs-clarity',
    displayName: 'Needs Clarity',
    scenario: 'Availability is missing but can be clarified.',
    expectedJourney: 'ASK → RECOMMEND',
  },
  {
    slug: 'uncertain-skipper',
    id: 'phase4-eval-v2:uncertain-skipper',
    displayName: 'Uncertain Skipper',
    scenario: 'Critical availability remains unresolved.',
    expectedJourney: 'ASK → ABSTAIN',
  },
  {
    slug: 'conflict-check',
    id: 'phase4-eval-v2:conflict-check',
    displayName: 'Conflict Check',
    scenario: 'Equal-authority evidence contains a material conflict.',
    expectedJourney: 'ASK → ABSTAIN',
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
