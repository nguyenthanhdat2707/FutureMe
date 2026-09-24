export const DEMO_SEED_VERSION = 'phase4-eval-v2';

export const DEMO_PERSONAS = [
  {
    slug: 'focused-builder',
    id: `${DEMO_SEED_VERSION}:focused-builder`,
    email: `${DEMO_SEED_VERSION}-focused-builder@example.com`,
    displayName: 'Focused Builder',
    scenario: 'Clear priorities with strong confirmed evidence.',
    expectedJourney: 'RECOMMEND · proceed',
  },
  {
    slug: 'busy-balancer',
    id: `${DEMO_SEED_VERSION}:busy-balancer`,
    email: `${DEMO_SEED_VERSION}-busy-balancer@example.com`,
    displayName: 'Busy Balancer',
    scenario: 'Limited capacity and a recent workload increase.',
    expectedJourney: 'RECOMMEND · proceed with caution',
  },
  {
    slug: 'overloaded-lead',
    id: `${DEMO_SEED_VERSION}:overloaded-lead`,
    email: `${DEMO_SEED_VERSION}-overloaded-lead@example.com`,
    displayName: 'Overloaded Lead',
    scenario: 'An overloaded calendar with consequential disruption.',
    expectedJourney: 'RECOMMEND · do not proceed',
  },
  {
    slug: 'needs-clarity',
    id: `${DEMO_SEED_VERSION}:needs-clarity`,
    email: `${DEMO_SEED_VERSION}-needs-clarity@example.com`,
    displayName: 'Needs Clarity',
    scenario: 'Availability is missing but can be clarified.',
    expectedJourney: 'ASK → RECOMMEND',
  },
  {
    slug: 'uncertain-skipper',
    id: `${DEMO_SEED_VERSION}:uncertain-skipper`,
    email: `${DEMO_SEED_VERSION}-uncertain-skipper@example.com`,
    displayName: 'Uncertain Skipper',
    scenario: 'Critical availability remains unresolved.',
    expectedJourney: 'ASK → ABSTAIN',
  },
  {
    slug: 'conflict-check',
    id: `${DEMO_SEED_VERSION}:conflict-check`,
    email: `${DEMO_SEED_VERSION}-conflict-check@example.com`,
    displayName: 'Conflict Check',
    scenario: 'Equal-authority evidence contains a material conflict.',
    expectedJourney: 'ASK → ABSTAIN',
  },
] as const;

export type DemoPersona = typeof DEMO_PERSONAS[number];
export type PersonaSlug = DemoPersona['slug'];
export type DemoPersonaId = DemoPersona['id'];

export const DEMO_PERSONA_IDS = DEMO_PERSONAS.map((persona) => persona.id);
export const PERSONA_SLUGS = DEMO_PERSONAS.map((persona) => persona.slug);

export function isDemoPersonaId(value: string): value is DemoPersonaId {
  return DEMO_PERSONA_IDS.includes(value as DemoPersonaId);
}

export function getDemoPersonaBySlug(slug: PersonaSlug): DemoPersona {
  const persona = DEMO_PERSONAS.find((candidate) => candidate.slug === slug);
  if (!persona) throw new Error(`Unknown demo persona: ${slug}`);
  return persona;
}
