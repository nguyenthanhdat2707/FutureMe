export const DEMO_SEED_VERSION = 'temporal-demo-v1';

export const DEMO_PERSONAS = [
  {
    slug: 'focused-builder',
    id: `${DEMO_SEED_VERSION}:focused-builder`,
    email: `${DEMO_SEED_VERSION}-focused-builder@example.com`,
    displayName: 'Product Engineer',
    scenario: 'Protects a scarce morning focus window before a Friday release.',
    expectedJourney: 'MOVE LOW-VALUE SYNC',
  },
  {
    slug: 'busy-balancer',
    id: `${DEMO_SEED_VERSION}:busy-balancer`,
    email: `${DEMO_SEED_VERSION}-busy-balancer@example.com`,
    displayName: 'Pitch-Week Founder',
    scenario: 'A packed week still supports a valuable pitch after weaker commitments move.',
    expectedJourney: 'FULL CALENDAR → YES',
  },
  {
    slug: 'overloaded-lead',
    id: `${DEMO_SEED_VERSION}:overloaded-lead`,
    email: `${DEMO_SEED_VERSION}-overloaded-lead@example.com`,
    displayName: 'Deadline-Pressed Founder',
    scenario: 'An empty-looking afternoon is reserved by unscheduled investor and proposal work.',
    expectedJourney: 'EMPTY SLOT → NO',
  },
  {
    slug: 'needs-clarity',
    id: `${DEMO_SEED_VERSION}:needs-clarity`,
    email: `${DEMO_SEED_VERSION}-needs-clarity@example.com`,
    displayName: 'Working Student',
    scenario: 'A visually free afternoon is already consumed by certification, assignment, and hackathon work.',
    expectedJourney: 'HIDDEN WORKLOAD → NO',
  },
  {
    slug: 'uncertain-skipper',
    id: `${DEMO_SEED_VERSION}:uncertain-skipper`,
    email: `${DEMO_SEED_VERSION}-uncertain-skipper@example.com`,
    displayName: 'Lecturer — Committee Unclear',
    scenario: 'A tentative faculty review conflicts with a guest lecture and attendance is unknown.',
    expectedJourney: 'UNCERTAINTY → ASK',
  },
  {
    slug: 'conflict-check',
    id: `${DEMO_SEED_VERSION}:conflict-check`,
    email: `${DEMO_SEED_VERSION}-conflict-check@example.com`,
    displayName: 'Research Lecturer',
    scenario: 'Fixed teaching and a proposal deadline coexist with movable institutional work.',
    expectedJourney: 'FULL CALENDAR → YES',
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

export function getDemoPersonaById(id: DemoPersonaId): DemoPersona {
  const persona = DEMO_PERSONAS.find((candidate) => candidate.id === id);
  if (!persona) throw new Error(`Unknown demo persona: ${id}`);
  return persona;
}
