import * as fs from 'fs';
import * as path from 'path';
import {
  BatchWriteCommand,
  type BatchWriteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { ObservationSource } from '../domain/types';
import {
  DEMO_PERSONAS,
  DEMO_SEED_VERSION,
  PERSONA_SLUGS,
  getDemoPersonaBySlug,
  type PersonaSlug,
} from './personas';

export const SEED_VERSION = DEMO_SEED_VERSION;
export { PERSONA_SLUGS, type PersonaSlug } from './personas';

export const TABLE_KEYS = ['users', 'personalContext', 'observations', 'calendarEvents', 'decisions'] as const;
export type TableKey = typeof TABLE_KEYS[number];

export interface SeedMetadata {
  seed_version: string;
  persona: PersonaSlug;
  seeded_at: string;
}

export type DynamoRecord = SeedMetadata & { id: string; user_id?: string } & Record<string, unknown>;

export interface ManifestEntry {
  table: TableKey;
  id: string;
  persona: PersonaSlug;
  expectedOwnerId: string;
  completed: boolean;
}

export interface ManifestPersona {
  slug: PersonaSlug;
  userId: string;
  email: string;
  displayName: string;
}

export interface ExpectedCounts {
  users: number;
  personalContext: number;
  observations: number;
  calendarEvents: number;
  decisions: number;
  total: number;
}

export interface ManifestState {
  seedVersion: string;
  seededAt: string;
  expectedCounts: ExpectedCounts;
  personas: ManifestPersona[];
  entries: ManifestEntry[];
}

export interface GeneratedDataset {
  personas: ManifestPersona[];
  records: Record<TableKey, DynamoRecord[]>;
}

export interface DynamoTableItems {
  tableName: string;
  table: TableKey;
  items: DynamoRecord[];
}

export const EXPECTED_COUNTS: ExpectedCounts = {
  users: 6,
  personalContext: 48,
  observations: 8,
  calendarEvents: 94,
  decisions: 19,
  total: 175,
};

const MAX_BATCH_SIZE = 25;
const MAX_BATCH_ATTEMPTS = 3;
const CREDENTIAL_PATTERN = /password|secret|token|access.?key|private.?key/i;

export function generatePhase4Id(table: string, slug: PersonaSlug, purpose: string): string {
  return `${SEED_VERSION}:${table}:${slug}:${purpose}`;
}

export function generateDemoUserId(slug: PersonaSlug): string {
  return getDemoPersonaBySlug(slug).id;
}

export function generateDeterministicUsername(slug: PersonaSlug): string {
  return getDemoPersonaBySlug(slug).email;
}

function metadata(persona: PersonaSlug, seededAt: Date): SeedMetadata {
  return { seed_version: SEED_VERSION, persona, seeded_at: seededAt.toISOString() };
}

export function generatePhase4Dataset(seededAt: Date): GeneratedDataset {
  if (Number.isNaN(seededAt.getTime())) throw new Error('Dataset validation failed: seededAt must be valid');

  const personas: ManifestPersona[] = DEMO_PERSONAS.map((persona) => ({
    slug: persona.slug,
    userId: persona.id,
    email: persona.email,
    displayName: persona.displayName,
  }));
  const records: GeneratedDataset['records'] = {
    users: [], personalContext: [], observations: [], calendarEvents: [], decisions: [],
  };
  const timestamp = seededAt.toISOString();

  for (const persona of personas) {
    const owner = persona.userId;
    const base = metadata(persona.slug, seededAt);
    records.users.push({
      ...base, id: owner, email: persona.email, display_name: persona.displayName,
      created_at: timestamp, updated_at: timestamp,
    });
    const addDecision = (
      purpose: string,
      question: string,
      status: 'PENDING' | 'CHOSEN',
      createdAt: Date,
      userChoice: string | null = null,
      recommendationText = 'Synthetic evaluation fixture: recommended option based on simulated workload.'
    ) => records.decisions.push({
      ...base,
      id: generatePhase4Id('decisions', persona.slug, purpose),
      user_id: owner,
      question,
      context_snapshot: JSON.stringify({ capturedAt: createdAt.toISOString(), goals: [], commitments: [], constraints: [], relevantHistory: [] }),
      recommendation: JSON.stringify({ option: userChoice || 'proceed', confidence: 0.8, reasoning: recommendationText }),
      user_choice: userChoice,
      status,
      created_at: createdAt.toISOString(),
    });

    const addContext = (
      purpose: string, attribute: string, value: unknown, source: ObservationSource,
      confidence: number, observedAt: Date, validUntil?: Date,
    ) => records.personalContext.push({
      ...base, id: generatePhase4Id('personal-context', persona.slug, purpose), user_id: owner,
      attribute, value: typeof value === 'string' ? value : JSON.stringify(value), source, confidence,
      observed_at: observedAt.toISOString(), created_at: timestamp,
      ...(validUntil ? { valid_until: validUntil.toISOString() } : {}),
    });
    const addObservation = (purpose: string, detail: string, observedAt: Date) => records.observations.push({
      ...base, id: generatePhase4Id('observations', persona.slug, purpose), user_id: owner,
      type: 'CONTEXT_CHANGE', data: JSON.stringify({ detail }), source: ObservationSource.SYSTEM_OBSERVED,
      timestamp: observedAt.toISOString(), confidence: 1, created_at: timestamp,
    });
    const addCalendar = (
      purpose: string,
      title: string,
      absoluteStart: Date,
      absoluteEnd: Date,
      category: 'deep_work' | 'meeting' | 'deadline' | 'recovery' | 'other',
      meetingLink?: string,
      status = 'CONFIRMED',
    ) => records.calendarEvents.push({
      ...base, id: generatePhase4Id('calendar-events', persona.slug, purpose), user_id: owner,
      external_id: `phase4-${persona.slug}-${purpose}`, title,
      start_time: absoluteStart.toISOString(),
      end_time: absoluteEnd.toISOString(), status,
      raw_data: JSON.stringify({ summary: title, category, ...(meetingLink ? { meetingLink } : {}) }),
      synced_at: timestamp, created_at: timestamp,
    });

    // Week anchor: Monday 00:00 UTC of the seeded week
    const weekStart = ((): Date => {
      const d = new Date(seededAt);
      const dow = (d.getUTCDay() + 6) % 7; // 0=Mon
      d.setUTCDate(d.getUTCDate() - dow);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    })();
    // Helper: day D at UTC hour H minute M
    // Vietnam UTC+7: store UTC hour = local_hour - 7
    // e.g. 09:00 VN = 02:00 UTC, 14:00 VN = 07:00 UTC
    const wd = (day: number, utcH: number, utcM = 0): Date =>
      new Date(weekStart.getTime() + day * 86_400_000 + utcH * 3_600_000 + utcM * 60_000);

    const daysAgo = (d: number, hour = 10): Date =>
      new Date(seededAt.getTime() - d * 86_400_000 + (hour - 10) * 3_600_000);

    const recent = new Date(seededAt.getTime() - 3_600_000);
    addContext('setup', 'setup_completed', 'true', ObservationSource.USER_CONFIRMED, 1, seededAt);
    addContext('calendar-sync', 'calendar_last_sync', timestamp, ObservationSource.SYSTEM_OBSERVED, 1, seededAt);

    if (persona.slug === 'focused-builder') {
      addDecision('cut-scope', 'Should we cut non-critical features for v1?', 'CHOSEN', daysAgo(22), 'cut-features');
      addDecision('auth-provider', 'Should we migrate the auth provider before launch?', 'CHOSEN', daysAgo(8), 'defer-migration');
      addDecision('default', 'Should I take on this new project?', 'PENDING', seededAt, null);

      addContext('goal-ship-user', 'goal', { id: 'ship', priority: 'high', description: 'Ship v1 MVP release to production' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(25));
      addContext('goal-ship-inferred', 'goal', { id: 'ship', priority: 'low', description: 'Defer v1 MVP release' }, ObservationSource.SYSTEM_INFERRED, 0.5, daysAgo(2));
      addContext('goal-focus', 'goal', { id: 'deep-focus', priority: 'medium', description: 'Maintain 4 hours of daily deep work' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(16));
      addContext('commitment-freeze', 'commitment', { id: 'code-freeze', description: 'Code freeze for v1 core release', startTime: wd(2, 7).toISOString(), endTime: wd(2, 9).toISOString(), status: 'CONFIRMED' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(18));
      addContext('commitment-retro', 'commitment', { id: 'sprint-1-retro', description: 'Sprint 1 team retrospective', startTime: wd(0, 2).toISOString(), endTime: wd(0, 3).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(28), daysAgo(12));
      addContext('pref-work', 'preference', { id: 'morning-focus', category: 'focus', description: 'Morning deep work block (09:00 - 12:00)', value: 'morning' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(25));
      addContext('pref-dnd', 'preference', { id: 'dnd-focus', category: 'communication', description: 'Do Not Disturb active during focus blocks', value: 'dnd-enabled' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(10));
      addObservation('focus', 'Started deep work focus.', recent);
      // Mon – 12 events
      addCalendar('mon-dw1', 'Deep Work', wd(0,2), wd(0,4), 'deep_work');                          // 09-11 VN
      addCalendar('mon-sync', 'Team Sync', wd(0,4), wd(0,4,30), 'meeting', 'https://meet.example.com/phase4-focused-builder-sync'); // 11-11:30 VN
      addCalendar('mon-cr', 'Code Review', wd(0,7), wd(0,8), 'meeting');                           // 14-15 VN
      // Tue
      addCalendar('tue-dw', 'Deep Work', wd(1,2), wd(1,5), 'deep_work');                          // 09-12 VN
      addCalendar('tue-1on1', '1:1 with Manager', wd(1,7), wd(1,8), 'meeting', 'https://meet.example.com/phase4-focused-builder-1on1');
      // Wed
      addCalendar('wed-arch', 'Focus: Architecture Planning', wd(2,2), wd(2,4), 'deep_work');     // 09-11 VN
      addCalendar('wed-sprint', 'Sprint Planning', wd(2,7), wd(2,9), 'meeting', 'https://meet.example.com/phase4-focused-builder-sprint');
      // Thu
      addCalendar('thu-dw', 'Deep Work', wd(3,2), wd(3,4), 'deep_work');                         // 09-11 VN
      addCalendar('thu-demo', 'Feature Demo', wd(3,8), wd(3,9), 'meeting', 'https://meet.example.com/phase4-focused-builder-demo');
      addCalendar('thu-run', 'Evening Run', wd(3,11), wd(3,12), 'recovery');                      // 18-19 VN
      // Fri
      addCalendar('fri-review', 'Weekly Review', wd(4,2), wd(4,3), 'meeting');                   // 09-10 VN
      addCalendar('fri-dw', 'Deep Work', wd(4,3), wd(4,5), 'deep_work');                         // 10-12 VN
    } else if (persona.slug === 'busy-balancer') {
      addDecision('committee-meeting', 'Should I accept the recurring Tuesday committee meeting?', 'CHOSEN', daysAgo(18), 'decline');
      addDecision('reschedule-client', 'Should I reschedule the client sync to protect gym time?', 'CHOSEN', daysAgo(5), 'reschedule');
      addDecision('default', 'Should I take on this new project?', 'PENDING', seededAt, null);

      addContext('goal-health', 'goal', { id: 'health', priority: 'high', description: 'Maintain daily 45-minute physical exercise and recovery' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(20));
      addContext('goal-balance', 'goal', { id: 'balance', priority: 'medium', description: 'Cap daily meetings at maximum 4 hours' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(14));
      addContext('commitment-review', 'commitment', { id: 'client-review', description: 'Quarterly client strategic milestone review', startTime: wd(1, 3).toISOString(), endTime: wd(1, 5).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(16));
      addContext('commitment-gym', 'commitment', { id: 'gym-routine', description: 'Evening fitness and wellness session', startTime: wd(0, 11).toISOString(), endTime: wd(0, 12).toISOString(), recurring: true }, ObservationSource.USER_CONFIRMED, 1, daysAgo(12));
      addContext('commitment-checkin', 'commitment', { id: 'biweekly-checkin', description: 'Bi-weekly cross-functional check-in', startTime: wd(2, 2).toISOString(), endTime: wd(2, 3).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(26), daysAgo(10));
      addContext('pref-pace', 'preference', { id: 'pace', category: 'work-style', description: 'Steady pacing with 15-minute buffer between meetings', value: 'steady' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(22));
      addContext('pref-quiet', 'preference', { id: 'evening-quiet', category: 'boundary', description: 'No meetings after 18:00 for recovery', value: 'evening-quiet' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(15));
      addContext('pref-lunch', 'preference', { id: 'protected-lunch', category: 'wellbeing', description: 'Protect 12:00-13:00 for lunch and mental reset', value: 'protected-lunch' }, ObservationSource.SYSTEM_INFERRED, 0.75, daysAgo(5));
      addObservation('meetings', 'Meeting volume increased.', daysAgo(20));
      addObservation('capacity', 'Capacity constrained.', recent);
      // Mon – 18 events total
      addCalendar('mon-standup', 'Daily Standup', wd(0,2), wd(0,2,30), 'meeting', 'https://meet.example.com/phase4-busy-standup');
      addCalendar('mon-dw', 'Deep Work', wd(0,3), wd(0,5), 'deep_work');
      addCalendar('mon-1on1', '1:1 with Lead', wd(0,4), wd(0,4,30), 'meeting');                  // overlaps DW intentionally
      addCalendar('mon-client', 'Client Call', wd(0,7), wd(0,8), 'meeting', 'https://meet.example.com/phase4-busy-client');
      addCalendar('mon-gym', 'Gym', wd(0,11), wd(0,12), 'recovery');                             // 18-19 VN
      // Tue
      addCalendar('tue-standup', 'Daily Standup', wd(1,2), wd(1,2,30), 'meeting', 'https://meet.example.com/phase4-busy-standup');
      addCalendar('tue-planning', 'Planning Session', wd(1,3), wd(1,5), 'meeting');
      addCalendar('tue-lunchl', 'Lunch & Learn', wd(1,5,30), wd(1,6,30), 'meeting');
      addCalendar('tue-cr', 'Code Review', wd(1,7), wd(1,8,30), 'meeting');
      addCalendar('tue-reading', 'Reading Time', wd(1,14), wd(1,15), 'recovery');                // 21-22 VN
      // Wed
      addCalendar('wed-standup', 'Daily Standup', wd(2,2), wd(2,2,30), 'meeting', 'https://meet.example.com/phase4-busy-standup');
      addCalendar('wed-dw', 'Deep Work', wd(2,3), wd(2,5), 'deep_work');
      addCalendar('wed-allhands', 'All-hands', wd(2,6), wd(2,7), 'meeting', 'https://meet.example.com/phase4-busy-allhands');
      addCalendar('wed-budget', 'Budget Review', wd(2,8), wd(2,9), 'meeting');
      // Thu
      addCalendar('thu-standup', 'Daily Standup', wd(3,2), wd(3,2,30), 'meeting', 'https://meet.example.com/phase4-busy-standup');
      addCalendar('thu-interview', 'Customer Interview', wd(3,3), wd(3,4), 'meeting');
      addCalendar('thu-dw', 'Deep Work', wd(3,6), wd(3,8), 'deep_work');
      addCalendar('thu-doctor', 'Doctor Appointment', wd(3,10), wd(3,11), 'other');              // 17-18 VN
    } else if (persona.slug === 'overloaded-lead') {
      addDecision('incident-cache', 'Should we declare an incident on the cache latency increase?', 'CHOSEN', daysAgo(25), 'declare-p2');
      addDecision('delegate-onboarding', 'Should we delegate junior engineer onboarding to a senior peer?', 'CHOSEN', daysAgo(17), 'delegate');
      addDecision('freeze-features', 'Should we freeze non-essential feature development for stability?', 'CHOSEN', daysAgo(9), 'freeze');
      addDecision('decline-sync', 'Should we decline the cross-team sync request?', 'CHOSEN', daysAgo(3), 'decline');
      addDecision('default', 'Should I take on this new project?', 'PENDING', seededAt, null);

      addContext('goal-delivery', 'goal', { id: 'delivery', priority: 'high', description: 'Deliver core platform reliability improvements' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(28));
      addContext('goal-brownbag', 'goal', { id: 'arch-brownbag', priority: 'low', description: 'Lead bi-weekly architecture brown-bag sessions' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(29), daysAgo(15));
      addContext('commitment-incident', 'commitment', { id: 'incident-triage', description: 'Lead weekly engineering incident reviews', startTime: wd(0, 2, 30).toISOString(), endTime: wd(0, 4).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(20));
      addContext('commitment-board', 'commitment', { id: 'board-reporting', description: 'Prepare monthly executive engineering roadmap report', startTime: wd(2, 6).toISOString(), endTime: wd(2, 8).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(12));
      addContext('commitment-oncall', 'commitment', { id: 'sprint3-oncall', description: 'Sprint 3 emergency primary on-call rotation', startTime: wd(1, 6).toISOString(), endTime: wd(1, 7, 30).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(24), daysAgo(8));
      addContext('pref-pace', 'preference', { id: 'lead-pace', category: 'communication', description: 'Fast execution with asynchronous updates', value: 'async-first' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(27));
      addContext('pref-alert', 'preference', { id: 'alert-threshold', category: 'alerting', description: 'Immediate escalation only for P0 system outages', value: 'p0-only' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(16));
      addObservation('interruptions', 'Heavy interruptions.', daysAgo(28));
      addObservation('burnout', 'Burnout risk detected.', recent);
      // Mon – 30 events total
      addCalendar('mon-standup', 'Daily Standup', wd(0,2), wd(0,2,30), 'meeting');
      addCalendar('mon-incident', 'Incident Review', wd(0,2,30), wd(0,4), 'meeting', 'https://meet.example.com/phase4-lead-incident');
      addCalendar('mon-1on1a', '1:1 Alpha', wd(0,4), wd(0,5), 'meeting');
      addCalendar('mon-lunch', 'Lunch Briefing', wd(0,5), wd(0,6), 'other');
      addCalendar('mon-product', 'Product Sync', wd(0,6), wd(0,7), 'meeting');
      addCalendar('mon-arch', 'Architecture Review', wd(0,7), wd(0,9), 'meeting');
      addCalendar('mon-sprintdemo', 'Sprint Demo', wd(0,9), wd(0,10), 'meeting', 'https://meet.example.com/phase4-lead-sprintdemo');
      addCalendar('mon-slack', 'Slack Catchup', wd(0,10), wd(0,11), 'other');
      // Tue
      addCalendar('tue-standup', 'Daily Standup', wd(1,2), wd(1,2,30), 'meeting');
      addCalendar('tue-hiring', 'Hiring Interview', wd(1,2,30), wd(1,3,30), 'meeting');
      addCalendar('tue-1on1b', '1:1 Beta', wd(1,3,30), wd(1,4,30), 'meeting');
      addCalendar('tue-plan', 'Sprint Planning', wd(1,4,30), wd(1,6), 'meeting');
      addCalendar('tue-escalation', 'Client Escalation', wd(1,6), wd(1,7,30), 'meeting', 'https://meet.example.com/phase4-lead-escalation');
      addCalendar('tue-cr', 'Code Review', wd(1,7,30), wd(1,8,30), 'meeting');
      addCalendar('tue-security', 'Security Sync', wd(1,8,30), wd(1,9,30), 'meeting');
      addCalendar('tue-metrics', 'Metrics Review', wd(1,9,30), wd(1,10,30), 'meeting');
      // Wed
      addCalendar('wed-standup', 'Daily Standup', wd(2,2), wd(2,2,30), 'meeting');
      addCalendar('wed-allhands', 'All-hands Meeting', wd(2,2,30), wd(2,4), 'meeting', 'https://meet.example.com/phase4-lead-allhands');
      addCalendar('wed-leads', 'Engineering Leads', wd(2,4), wd(2,5), 'meeting');
      addCalendar('wed-budget', 'Budget Sync', wd(2,5), wd(2,6), 'meeting');
      addCalendar('wed-roadmap', 'Product Roadmap', wd(2,6), wd(2,8), 'meeting');
      addCalendar('wed-1on1c', '1:1 Gamma', wd(2,8), wd(2,9), 'meeting');
      addCalendar('wed-perf', 'Perf Review Prep', wd(2,9), wd(2,10), 'other');
      addCalendar('wed-oncall', 'On-call Check', wd(2,10), wd(2,11), 'other');
      // Thu
      addCalendar('thu-standup', 'Daily Standup', wd(3,2), wd(3,2,30), 'meeting');
      addCalendar('thu-vendor', 'Vendor Call', wd(3,2,30), wd(3,3,30), 'meeting');
      addCalendar('thu-design', 'Design Review', wd(3,3,30), wd(3,5), 'meeting');
      addCalendar('thu-dw', 'Deep Work (Rare)', wd(3,6), wd(3,7), 'deep_work');
      addCalendar('thu-crossteam', 'Cross-team Sync', wd(3,7), wd(3,8,30), 'meeting');
      addCalendar('thu-emergency', 'Emergency Deploy', wd(3,10), wd(3,11,30), 'meeting', 'https://meet.example.com/phase4-lead-deploy');
    } else if (persona.slug === 'needs-clarity') {
      addDecision('early-signoff', 'Should we seek early stakeholder sign-off on requirements?', 'CHOSEN', daysAgo(11), 'seek-signoff');
      addDecision('default', 'Should I take on this new project?', 'PENDING', seededAt, null);

      addContext('goal-q3', 'goal', { id: 'q3-report', priority: 'medium', deadline: wd(4,10).toISOString(), description: 'Finalize and submit Q3 strategic roadmap analysis' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(15));
      addContext('commitment-briefing', 'commitment', { id: 'stakeholder-briefing', description: 'Stakeholder roadmap review presentation', startTime: wd(3,7).toISOString(), endTime: wd(3,9).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(10));
      addContext('pref-feedback', 'preference', { id: 'feedback-format', category: 'collaboration', description: 'Structured written feedback 24 hours prior to decision review', value: 'written-first' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(12));
      addObservation('uncertainty', 'Availability is unresolved.', daysAgo(15));
      // 9 events
      addCalendar('mon-focus', 'Focus Block', wd(0,3), wd(0,5), 'deep_work');                   // 10-12 VN
      addCalendar('tue-sync', 'Team Sync', wd(1,3), wd(1,3,30), 'meeting', 'https://meet.example.com/phase4-clarity-sync');
      addCalendar('tue-research', 'Research Block', wd(1,6), wd(1,8), 'deep_work');
      // Wed free – no events
      addCalendar('thu-review', 'Stakeholder Review', wd(3,7), wd(3,9), 'meeting', 'https://meet.example.com/phase4-clarity-review');
      addCalendar('fri-dw', 'Deep Work', wd(4,2), wd(4,4), 'deep_work');
      addCalendar('fri-deadline', 'Deadline: Submit Q3 Report', wd(4,10), wd(4,10,30), 'deadline');
      addCalendar('sat-rest', 'Recovery / Rest', wd(5,3), wd(5,5), 'recovery');
      addCalendar('fri-prep', 'Report Prep', wd(4,5), wd(4,7), 'deep_work');
      addCalendar('tue-plan', 'Planning Notes', wd(1,9), wd(1,9,30), 'other');
    } else if (persona.slug === 'uncertain-skipper') {
      addDecision('conference-talk', 'Should I submit the proposal to Conference A or B?', 'CHOSEN', daysAgo(14), 'conference-a');
      addDecision('default', 'Should I take on this new project?', 'PENDING', seededAt, null);

      addContext('goal-conf', 'goal', { id: 'conference-talk', priority: 'medium', description: 'Prepare tech conference speaker submission' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(22));
      addContext('goal-side', 'goal', { id: 'side-project', priority: 'low', description: 'Prototype experimental vector search plugin' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(18));
      addContext('commitment-retro', 'commitment', { id: 'weekly-retro', description: 'Attend Friday engineering team retrospective', startTime: wd(4,3).toISOString(), endTime: wd(4,4).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(21));
      addContext('pref-flex', 'preference', { id: 'flex-hours', category: 'schedule', description: 'Flexible schedule start between 09:00 and 10:00', value: 'flexible' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(25));
      addObservation('uncertainty', 'Availability is unresolved.', daysAgo(22));
      // 11 events
      addCalendar('mon-standup', 'Team Standup', wd(0,2), wd(0,2,30), 'meeting', 'https://meet.example.com/phase4-skip-standup');
      addCalendar('mon-confprep', 'Conference Talk Prep (Tentative)', wd(0,3), wd(0,5), 'other', undefined, 'TENTATIVE');
      addCalendar('mon-lunch', 'Lunch with Client (Optional)', wd(0,5), wd(0,6), 'other', undefined, 'TENTATIVE');
      addCalendar('tue-standup', 'Team Standup', wd(1,2), wd(1,2,30), 'meeting', 'https://meet.example.com/phase4-skip-standup');
      addCalendar('tue-demo', 'Product Demo (Tentative)', wd(1,7), wd(1,8), 'meeting', 'https://meet.example.com/phase4-skip-demo', 'TENTATIVE');
      addCalendar('tue-side', 'Side Project', wd(1,12), wd(1,14), 'deep_work');                 // 19-21 VN
      addCalendar('wed-workshop', 'Workshop Attendance (Tentative)', wd(2,2), wd(2,5), 'other', undefined, 'TENTATIVE');
      addCalendar('thu-standup', 'Team Standup', wd(3,2), wd(3,2,30), 'meeting', 'https://meet.example.com/phase4-skip-standup');
      addCalendar('thu-poker', 'Team Poker (Optional)', wd(3,11), wd(3,13), 'recovery', undefined, 'TENTATIVE'); // 18-20 VN
      addCalendar('fri-retro', 'Weekly Retro', wd(4,3), wd(4,4), 'meeting', 'https://meet.example.com/phase4-skip-retro');
      addCalendar('fri-dw', 'Deep Work', wd(4,6), wd(4,8), 'deep_work');
    } else {
      // conflict-check – 14 events with deliberate overlaps
      addDecision('delay-candidate', 'Should we delay the release candidate by 3 days?', 'CHOSEN', daysAgo(20), 'delay');
      addDecision('override-design', 'Should we override the conflicting design direction?', 'CHOSEN', daysAgo(13), 'override');
      addDecision('emergency-overtime', 'Should we approve emergency overtime for deployment?', 'CHOSEN', daysAgo(6), 'approve');
      addDecision('default', 'Should I take on this new project?', 'PENDING', seededAt, null);

      addContext('conflict-a', 'goal', { id: 'compete', priority: 'high', description: 'Compete for product leadership (Option A)', value: 'win' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(25));
      addContext('conflict-b', 'goal', { id: 'compete', priority: 'low', description: 'Compete for product leadership (Option B)', value: 'lose' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(25));
      addContext('goal-morale', 'goal', { id: 'team-morale', priority: 'medium', description: 'Maintain team morale and prevent burnout amidst release crunch' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(20));
      addContext('commitment-crunch', 'commitment', { id: 'crunch-review', description: 'Pre-deadline release crunch review', startTime: wd(3,2).toISOString(), endTime: wd(3,10).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(18));
      addContext('commitment-client', 'commitment', { id: 'client-sync', description: 'Direct client feedback and escalation call', startTime: wd(2,2).toISOString(), endTime: wd(2,3,30).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(12));
      addContext('commitment-sprint', 'commitment', { id: 'design-sprint', description: 'Cross-functional product design sprint workshop', startTime: wd(1,4).toISOString(), endTime: wd(1,6).toISOString() }, ObservationSource.USER_CONFIRMED, 1, daysAgo(27), daysAgo(14));
      addContext('pref-resolve', 'preference', { id: 'conflict-res', category: 'prioritization', description: 'Prioritize customer-facing blockers over internal refactors', value: 'customer-first' }, ObservationSource.USER_CONFIRMED, 1, daysAgo(23));
      addObservation('conflict', 'Competing priorities detected.', daysAgo(25));
      // Mon
      addCalendar('mon-dw', 'Important Deep Work', wd(0,2), wd(0,5), 'deep_work');              // 09-12 VN
      addCalendar('mon-allhands', 'All-hands (Overlap)', wd(0,4), wd(0,5,30), 'meeting', 'https://meet.example.com/phase4-conflict-allhands'); // 11-12:30 VN overlaps DW
      addCalendar('mon-lunch', 'Lunch', wd(0,5,30), wd(0,6,30), 'other');
      // Tue – back-to-back, no gap
      addCalendar('tue-sprint', 'Sprint Planning', wd(1,2), wd(1,4), 'meeting', 'https://meet.example.com/phase4-conflict-sprint');
      addCalendar('tue-design', 'Design Review', wd(1,4), wd(1,6), 'meeting');
      addCalendar('tue-impl', 'Implementation Work', wd(1,6), wd(1,10), 'deep_work');           // 13-17 VN
      // Wed
      addCalendar('wed-client', 'Client Call', wd(2,2), wd(2,3,30), 'meeting', 'https://meet.example.com/phase4-conflict-client');
      addCalendar('wed-internal', 'Internal Sync (Overlap)', wd(2,3), wd(2,4), 'meeting');     // overlaps client call end
      addCalendar('wed-focus', 'Deep Focus', wd(2,6), wd(2,9), 'deep_work');
      addCalendar('wed-late', 'Late Meeting', wd(2,10), wd(2,12), 'meeting', 'https://meet.example.com/phase4-conflict-late'); // 17-19 VN
      // Thu – deadline pressure
      addCalendar('thu-crunch', 'Pre-deadline Crunch', wd(3,2), wd(3,10), 'deep_work');        // 09-17 VN full day
      addCalendar('thu-emergency', 'Emergency Meeting (During Crunch)', wd(3,8), wd(3,9), 'meeting', 'https://meet.example.com/phase4-conflict-emergency');
      // Fri
      addCalendar('fri-retro', 'Retrospective', wd(4,2), wd(4,3), 'meeting');
      addCalendar('fri-deploy', 'Release Deployment', wd(4,3), wd(4,6), 'meeting', 'https://meet.example.com/phase4-conflict-deploy');
    }
  }

  assertDatasetCounts({ personas, records });
  return { personas, records };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Manifest validation failed: ${label} must be a non-empty string`);
  return value;
}

function assertBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`Manifest validation failed: ${label} must be a boolean`);
  return value;
}

function assertCount(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) throw new Error(`Manifest validation failed: ${label} must be a non-negative integer`);
  return value;
}

function hasCredential(value: unknown, depth = 0): boolean {
  if (depth > 12) return true;
  if (typeof value === 'string') return false;
  if (Array.isArray(value)) return value.some((item) => hasCredential(item, depth + 1));
  if (isRecord(value)) return Object.entries(value).some(([key, nested]) => CREDENTIAL_PATTERN.test(key) || hasCredential(nested, depth + 1));
  return false;
}

function compareEntries(left: ManifestEntry, right: ManifestEntry): number {
  const tableDifference = TABLE_KEYS.indexOf(left.table) - TABLE_KEYS.indexOf(right.table);
  if (tableDifference !== 0) return tableDifference;
  const personaDifference = PERSONA_SLUGS.indexOf(left.persona) - PERSONA_SLUGS.indexOf(right.persona);
  if (personaDifference !== 0) return personaDifference;
  return left.id.localeCompare(right.id);
}

function descriptor(table: TableKey, persona: PersonaSlug, id: string): string {
  return `${table}\u0000${persona}\u0000${id}`;
}

function canonicalManifest(manifest: ManifestState): ManifestState {
  return {
    seedVersion: manifest.seedVersion,
    seededAt: manifest.seededAt,
    expectedCounts: { ...manifest.expectedCounts },
    personas: [...manifest.personas].sort((left, right) => PERSONA_SLUGS.indexOf(left.slug) - PERSONA_SLUGS.indexOf(right.slug)).map((persona) => ({ ...persona })),
    entries: [...manifest.entries].map((entry) => ({ ...entry })).sort(compareEntries),
  };
}

function parseManifest(raw: unknown): ManifestState {
  if (!isRecord(raw) || hasCredential(raw)) throw new Error('Manifest validation failed: credential-bearing or malformed manifest');
  const topKeys = new Set(['seedVersion', 'seededAt', 'expectedCounts', 'personas', 'entries']);
  if (Object.keys(raw).some((key) => !topKeys.has(key))) throw new Error('Manifest validation failed: unexpected top-level key');
  const seedVersion = assertString(raw.seedVersion, 'seedVersion');
  if (seedVersion !== SEED_VERSION) throw new Error('Manifest validation failed: seed version mismatch');
  const seededAt = assertString(raw.seededAt, 'seededAt');
  if (Number.isNaN(Date.parse(seededAt)) || new Date(seededAt).toISOString() !== seededAt) throw new Error('Manifest validation failed: seededAt must be ISO-8601');

  if (!isRecord(raw.expectedCounts)) throw new Error('Manifest validation failed: expectedCounts must be an object');
  const expectedCounts: ExpectedCounts = {
    users: assertCount(raw.expectedCounts.users, 'expectedCounts.users'),
    personalContext: assertCount(raw.expectedCounts.personalContext, 'expectedCounts.personalContext'),
    observations: assertCount(raw.expectedCounts.observations, 'expectedCounts.observations'),
    calendarEvents: assertCount(raw.expectedCounts.calendarEvents, 'expectedCounts.calendarEvents'),
    decisions: assertCount(raw.expectedCounts.decisions, 'expectedCounts.decisions'),
    total: assertCount(raw.expectedCounts.total, 'expectedCounts.total'),
  };
  if (Object.keys(raw.expectedCounts).length !== 6 || Object.entries(EXPECTED_COUNTS).some(([key, count]) => expectedCounts[key as keyof ExpectedCounts] !== count)) {
    throw new Error('Manifest validation failed: exact expected counts are required');
  }

  if (!Array.isArray(raw.personas) || raw.personas.length !== PERSONA_SLUGS.length) throw new Error('Manifest validation failed: exactly six personas are required');
  const personas: ManifestPersona[] = raw.personas.map((value) => {
    if (!isRecord(value)) throw new Error('Manifest validation failed: persona must be an object');
    const allowed = new Set(['slug', 'userId', 'email', 'displayName']);
    if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error('Manifest validation failed: unexpected persona key');
    const slug = assertString(value.slug, 'persona.slug');
    if (!(PERSONA_SLUGS as readonly string[]).includes(slug)) throw new Error('Manifest validation failed: invalid persona slug');
    const typedSlug = slug as PersonaSlug;
    const expected = getDemoPersonaBySlug(typedSlug);
    const userId = assertString(value.userId, 'persona.userId');
    const email = assertString(value.email, 'persona.email');
    const displayName = assertString(value.displayName, 'persona.displayName');
    if (userId !== expected.id || email !== expected.email || displayName !== expected.displayName) throw new Error('Manifest validation failed: deterministic persona mismatch');
    return { slug: typedSlug, userId, email, displayName };
  });
  if (new Set(personas.map((persona) => persona.slug)).size !== PERSONA_SLUGS.length) throw new Error('Manifest validation failed: duplicate persona');

  if (!Array.isArray(raw.entries) || raw.entries.length !== EXPECTED_COUNTS.total) throw new Error(`Manifest validation failed: exactly ${EXPECTED_COUNTS.total} entries are required`);
  const personaBySlug = new Map(personas.map((persona) => [persona.slug, persona]));
  const entries: ManifestEntry[] = raw.entries.map((value) => {
    if (!isRecord(value)) throw new Error('Manifest validation failed: entry must be an object');
    const allowed = new Set(['table', 'id', 'persona', 'expectedOwnerId', 'completed']);
    if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error('Manifest validation failed: unexpected entry key');
    const table = assertString(value.table, 'entry.table');
    if (!(TABLE_KEYS as readonly string[]).includes(table)) throw new Error('Manifest validation failed: invalid entry table');
    const slug = assertString(value.persona, 'entry.persona');
    if (!(PERSONA_SLUGS as readonly string[]).includes(slug)) throw new Error('Manifest validation failed: invalid entry persona');
    const typedSlug = slug as PersonaSlug;
    const persona = personaBySlug.get(typedSlug);
    if (!persona) throw new Error('Manifest validation failed: entry persona missing');
    const id = assertString(value.id, 'entry.id');
    const expectedOwnerId = assertString(value.expectedOwnerId, 'entry.expectedOwnerId');
    const completed = assertBoolean(value.completed, 'entry.completed');
    if ((table === 'users' && id !== persona.userId) || (table !== 'users' && !id.startsWith(`${SEED_VERSION}:`))) throw new Error('Manifest validation failed: entry key mismatch');
    if (expectedOwnerId !== persona.userId) throw new Error('Manifest validation failed: entry owner mismatch');
    return { table: table as TableKey, id, persona: typedSlug, expectedOwnerId, completed };
  });

  const expectedDataset = generatePhase4Dataset(new Date(seededAt));
  const expectedDescriptors = new Set<string>();
  for (const table of TABLE_KEYS) {
    for (const item of expectedDataset.records[table]) expectedDescriptors.add(descriptor(table, item.persona, item.id));
  }
  const actualDescriptors = entries.map((entry) => descriptor(entry.table, entry.persona, entry.id));
  if (new Set(actualDescriptors).size !== entries.length || actualDescriptors.some((entry) => !expectedDescriptors.has(entry)) || expectedDescriptors.size !== entries.length) {
    throw new Error('Manifest validation failed: entries do not exactly map to the dataset');
  }
  for (let index = 1; index < entries.length; index += 1) {
    if (compareEntries(entries[index - 1], entries[index]) > 0) throw new Error('Manifest validation failed: entries are not deterministically sorted');
  }
  return { seedVersion, seededAt, expectedCounts, personas, entries };
}

export function createManifest(seededAt: Date): ManifestState {
  const dataset = generatePhase4Dataset(seededAt);
  const entries: ManifestEntry[] = [];
  for (const table of TABLE_KEYS) {
    for (const item of dataset.records[table]) {
      entries.push({ table, id: item.id, persona: item.persona, expectedOwnerId: table === 'users' ? item.id : item.user_id as string, completed: false });
    }
  }
  return canonicalManifest({
    seedVersion: SEED_VERSION,
    seededAt: seededAt.toISOString(),
    expectedCounts: { ...EXPECTED_COUNTS },
    personas: dataset.personas,
    entries,
  });
}

export function saveManifest(manifestPath: string, manifest: ManifestState): void {
  const canonical = canonicalManifest(manifest);
  parseManifest(canonical);
  const directory = path.dirname(manifestPath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(canonical, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporaryPath, manifestPath);
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    throw error;
  }
}

export function loadManifest(manifestPath: string): ManifestState | null {
  if (!fs.existsSync(manifestPath)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as unknown;
  } catch {
    throw new Error('Manifest validation failed: invalid JSON');
  }
  return parseManifest(parsed);
}

function assertDatasetCounts(dataset: GeneratedDataset): void {
  const counts: ExpectedCounts = {
    users: dataset.records.users.length,
    personalContext: dataset.records.personalContext.length,
    observations: dataset.records.observations.length,
    calendarEvents: dataset.records.calendarEvents.length,
    decisions: dataset.records.decisions.length,
    total: Object.values(dataset.records).reduce((total, records) => total + records.length, 0),
  };
  if (Object.entries(EXPECTED_COUNTS).some(([key, count]) => counts[key as keyof ExpectedCounts] !== count) || dataset.personas.length !== PERSONA_SLUGS.length) {
    throw new Error(`Dataset validation failed: expected ${EXPECTED_COUNTS.users} / ${EXPECTED_COUNTS.personalContext} / ${EXPECTED_COUNTS.observations} / ${EXPECTED_COUNTS.calendarEvents} / ${EXPECTED_COUNTS.decisions} = ${EXPECTED_COUNTS.total}`);
  }
}

export function runPlan(dataset: GeneratedDataset): void {
  assertDatasetCounts(dataset);
  console.log(`Plan for ${SEED_VERSION}`);
  console.log(`Personas: ${dataset.personas.length}`);
  for (const persona of dataset.personas) console.log(` - ${persona.slug} (${persona.userId})`);
  console.log('Table counts:');
  console.log(` - users: ${EXPECTED_COUNTS.users}`);
  console.log(` - personalContext: ${EXPECTED_COUNTS.personalContext}`);
  console.log(` - observations: ${EXPECTED_COUNTS.observations}`);
  console.log(` - calendarEvents: ${EXPECTED_COUNTS.calendarEvents}`);
  console.log(` - decisions: ${EXPECTED_COUNTS.decisions}`);
  console.log(`Total records: ${EXPECTED_COUNTS.total}`);
}

function exactOwner(item: Record<string, unknown>, table: TableKey): string | undefined {
  return table === 'users' ? item.id as string | undefined : item.user_id as string | undefined;
}

function assertExistingRecord(item: Record<string, unknown>, expected: DynamoRecord, table: TableKey): void {
  if (item.seed_version !== SEED_VERSION) throw new Error(`Collision at ${expected.id}: seed version mismatch`);
  if (item.persona !== expected.persona) throw new Error(`Collision at ${expected.id}: persona mismatch`);
  const owner = exactOwner(item, table);
  const expectedOwner = table === 'users' ? expected.id : expected.user_id;
  if (owner !== expectedOwner) throw new Error(`Collision at ${expected.id}: owner mismatch`);
}

export async function preflightAllKeys(docClient: DynamoDBDocumentClient, tableItems: DynamoTableItems[]): Promise<void> {
  for (const { tableName, table, items } of tableItems) {
    for (const item of items) {
      const response = await docClient.send(new GetCommand({ TableName: tableName, Key: { id: item.id } }));
      if (response.Item) assertExistingRecord(response.Item, item, table);
    }
  }
}

type BatchRequest = NonNullable<NonNullable<BatchWriteCommandInput['RequestItems']>[string]>[number];

async function batchWriteWithRetry(docClient: DynamoDBDocumentClient, tableName: string, requests: BatchRequest[], retryDelayMs: number): Promise<void> {
  let remaining = requests;
  for (let attempt = 1; remaining.length > 0 && attempt <= MAX_BATCH_ATTEMPTS; attempt += 1) {
    const response = await docClient.send(new BatchWriteCommand({ RequestItems: { [tableName]: remaining } }));
    remaining = response.UnprocessedItems?.[tableName] ?? [];
    if (remaining.length > 0 && attempt < MAX_BATCH_ATTEMPTS && retryDelayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs * 2 ** (attempt - 1)));
    }
  }
  if (remaining.length > 0) throw new Error(`Batch write failed after ${MAX_BATCH_ATTEMPTS} attempts`);
}

export async function processBatchWrites(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  table: TableKey,
  items: DynamoRecord[],
  entries: ManifestEntry[],
  persist: () => void,
  retryDelayMs = 100,
): Promise<void> {
  const expectedEntries = new Map(entries.filter((entry) => entry.table === table).map((entry) => [entry.id, entry]));
  if (expectedEntries.size !== items.length) throw new Error(`Manifest mapping mismatch for ${table}`);
  for (const item of items) {
    const entry = expectedEntries.get(item.id);
    if (!entry || entry.persona !== item.persona || entry.expectedOwnerId !== (table === 'users' ? item.id : item.user_id)) throw new Error(`Manifest mapping mismatch for ${item.id}`);
  }
  for (let offset = 0; offset < items.length; offset += MAX_BATCH_SIZE) {
    const batch = items.slice(offset, offset + MAX_BATCH_SIZE);
    await batchWriteWithRetry(docClient, tableName, batch.map((item) => ({ PutRequest: { Item: item } })), retryDelayMs);
    for (const item of batch) {
      const entry = expectedEntries.get(item.id);
      if (!entry) throw new Error(`Manifest mapping missing after write for ${item.id}`);
      entry.completed = true;
    }
    persist();
  }
}

function requiredTables(envVars: Record<string, string | undefined>): Array<{ env: string; table: TableKey }> {
  const configurations: Array<{ env: string; table: TableKey }> = [
    { env: 'USERS_TABLE', table: 'users' },
    { env: 'CONTEXT_TABLE', table: 'personalContext' },
    { env: 'OBS_TABLE', table: 'observations' },
    { env: 'CALENDAR_TABLE', table: 'calendarEvents' },
    { env: 'DECISIONS_TABLE', table: 'decisions' },
  ];
  for (const configuration of configurations) {
    if (!envVars[configuration.env]) throw new Error(`Missing ${configuration.env}`);
  }
  return configurations;
}

export async function runApply(docClient: DynamoDBDocumentClient, manifestPath: string, envVars: Record<string, string | undefined> = process.env): Promise<void> {
  const tables = requiredTables(envVars);
  let manifest = loadManifest(manifestPath);
  if (!manifest) {
    manifest = createManifest(new Date());
    saveManifest(manifestPath, manifest);
  }
  const dataset = generatePhase4Dataset(new Date(manifest.seededAt));
  const tableItems = tables.map(({ env, table }) => ({ tableName: envVars[env] as string, table, items: dataset.records[table] }));
  await preflightAllKeys(docClient, tableItems);
  for (const { env, table } of tables) {
    await processBatchWrites(docClient, envVars[env] as string, table, dataset.records[table], manifest.entries, () => saveManifest(manifestPath, manifest));
  }
  console.log('Apply complete.');
}

export async function runVerify(docClient: DynamoDBDocumentClient, manifestPath: string, envVars: Record<string, string | undefined> = process.env): Promise<void> {
  const tables = requiredTables(envVars);
  const manifest = loadManifest(manifestPath);
  if (!manifest) throw new Error('Manifest not found');
  if (manifest.entries.some((entry) => !entry.completed)) throw new Error('Verification failed: manifest has incomplete entries');
  for (const { env, table } of tables) {
    for (const entry of manifest.entries.filter((candidate) => candidate.table === table)) {
      const response = await docClient.send(new GetCommand({ TableName: envVars[env] as string, Key: { id: entry.id } }));
      if (!response.Item) throw new Error(`Verification failed: missing ${entry.id}`);
      assertExistingRecord(response.Item, {
        id: entry.id, user_id: table === 'users' ? undefined : entry.expectedOwnerId,
        seed_version: SEED_VERSION, persona: entry.persona, seeded_at: manifest.seededAt,
      }, table);
    }
  }
  console.log('Verification passed.');
}

async function verifyRollbackBatch(docClient: DynamoDBDocumentClient, tableName: string, table: TableKey, batch: ManifestEntry[]): Promise<void> {
  for (const entry of batch) {
    const response = await docClient.send(new GetCommand({ TableName: tableName, Key: { id: entry.id } }));
    if (!response.Item) continue;
    assertExistingRecord(response.Item, {
      id: entry.id, user_id: table === 'users' ? undefined : entry.expectedOwnerId,
      seed_version: SEED_VERSION, persona: entry.persona, seeded_at: '',
    }, table);
  }
}

export async function runRollback(
  docClient: DynamoDBDocumentClient,
  manifestPath: string,
  envVars: Record<string, string | undefined> = process.env,
  retryDelayMs = 100,
): Promise<void> {
  const tables = requiredTables(envVars).reverse();
  const manifest = loadManifest(manifestPath);
  if (!manifest) throw new Error('Manifest not found');
  for (const { env, table } of tables) {
    const completed = manifest.entries.filter((entry) => entry.table === table && entry.completed);
    for (let offset = 0; offset < completed.length; offset += MAX_BATCH_SIZE) {
      const batch = completed.slice(offset, offset + MAX_BATCH_SIZE);
      await verifyRollbackBatch(docClient, envVars[env] as string, table, batch);
      await batchWriteWithRetry(docClient, envVars[env] as string, batch.map((entry) => ({ DeleteRequest: { Key: { id: entry.id } } })), retryDelayMs);
      for (const entry of batch) entry.completed = false;
      saveManifest(manifestPath, manifest);
    }
  }
  if (manifest.entries.some((entry) => entry.completed)) {
    console.log('Rollback partial. Manifest preserved.');
    return;
  }
  fs.rmSync(manifestPath, { force: true });
  console.log('Rollback complete. Manifest removed.');
}
