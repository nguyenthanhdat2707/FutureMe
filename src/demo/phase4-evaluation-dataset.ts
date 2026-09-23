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
  personalContext: 28,
  observations: 8,
  calendarEvents: 16,
  decisions: 6,
  total: 64,
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
    records.decisions.push({
      ...base, id: generatePhase4Id('decisions', persona.slug, 'default'), user_id: owner,
      question: 'Should I take on this new project?',
      context_snapshot: JSON.stringify({ capturedAt: timestamp, goals: [], commitments: [], constraints: [], relevantHistory: [] }),
      recommendation: JSON.stringify({ option: 'proceed', confidence: 0.8, reasoning: 'Synthetic evaluation fixture.' }),
      user_choice: null, status: 'PENDING', created_at: timestamp,
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
    const addCalendar = (purpose: string, title: string, startOffset: number, endOffset: number) => records.calendarEvents.push({
      ...base, id: generatePhase4Id('calendar-events', persona.slug, purpose), user_id: owner,
      external_id: `phase4-${persona.slug}-${purpose}`, title,
      start_time: new Date(seededAt.getTime() + startOffset).toISOString(),
      end_time: new Date(seededAt.getTime() + endOffset).toISOString(), status: 'CONFIRMED',
      raw_data: JSON.stringify({ summary: title }), synced_at: timestamp, created_at: timestamp,
    });

    const old = new Date(seededAt.getTime() - 86_400_000);
    const recent = new Date(seededAt.getTime() - 3_600_000);
    const expired = new Date(seededAt.getTime() - 10 * 86_400_000);
    addContext('setup', 'setup_completed', 'true', ObservationSource.USER_CONFIRMED, 1, seededAt);
    addContext('calendar-sync', 'calendar_last_sync', timestamp, ObservationSource.SYSTEM_OBSERVED, 1, seededAt);

    if (persona.slug === 'focused-builder') {
      addContext('goal-user', 'goal:ship', { id: 'ship', priority: 'high', value: 'ship-v1' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('goal-inferred', 'goal:ship', { id: 'ship', priority: 'low', value: 'defer-v1' }, ObservationSource.SYSTEM_INFERRED, 0.5, recent);
      addContext('preference', 'preference:work', { id: 'deep-work', value: 'morning' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('commitment', 'commitment:launch', { id: 'launch', value: 'v1' }, ObservationSource.USER_CONFIRMED, 1, old);
      addObservation('focus', 'Started deep work focus.', recent);
      addCalendar('deep-work', 'Deep Work', 3_600_000, 7_200_000);
      addCalendar('sync', 'Sync', 7_200_000, 10_800_000);
    } else if (persona.slug === 'busy-balancer') {
      addContext('goal-health', 'goal:health', { id: 'health', priority: 'high' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('goal-balance', 'goal:balance', { id: 'balance', priority: 'medium' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('preference', 'preference:work', { id: 'pace', value: 'steady' }, ObservationSource.USER_CONFIRMED, 1, old);
      addObservation('meetings', 'Meeting volume increased.', old);
      addObservation('capacity', 'Capacity constrained.', recent);
      for (let index = 0; index < 4; index += 1) addCalendar(`meeting-${index}`, `Meeting ${index + 1}`, (index * 3 + 1) * 3_600_000, (index * 3 + 2) * 3_600_000);
    } else if (persona.slug === 'overloaded-lead') {
      addContext('goal-delivery', 'goal:delivery', { id: 'delivery', priority: 'high' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('preference', 'preference:work', { id: 'pace', value: 'fast' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('expired', 'goal:expired', { id: 'expired', priority: 'low' }, ObservationSource.USER_CONFIRMED, 1, expired, old);
      addObservation('interruptions', 'Heavy interruptions.', old);
      addObservation('burnout', 'Burnout risk detected.', recent);
      for (let index = 0; index < 6; index += 1) addCalendar(`review-${index}`, `Review ${index + 1}`, (index + 1) * 3_600_000, (index + 2) * 3_600_000);
    } else if (persona.slug === 'needs-clarity' || persona.slug === 'uncertain-skipper') {
      addContext('goal', `goal:${persona.slug}`, { id: persona.slug, priority: 'medium' }, ObservationSource.USER_CONFIRMED, 1, old);
      addObservation('uncertainty', 'Availability is unresolved.', old);
      addCalendar('space', 'Free Time', 3_600_000, 7_200_000);
    } else {
      addContext('conflict-a', 'goal:compete', { id: 'compete', priority: 'high', value: 'win' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('conflict-b', 'goal:compete', { id: 'compete', priority: 'low', value: 'lose' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('other-goal', 'goal:other', { id: 'other', priority: 'medium' }, ObservationSource.USER_CONFIRMED, 1, old);
      addContext('preference', 'preference:color', { id: 'color', value: 'blue' }, ObservationSource.USER_CONFIRMED, 1, old);
      addObservation('conflict', 'Competing priorities detected.', old);
      addCalendar('event-a', 'Event A', 3_600_000, 7_200_000);
      addCalendar('event-b', 'Event B', 10_800_000, 14_400_000);
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

  if (!Array.isArray(raw.entries) || raw.entries.length !== EXPECTED_COUNTS.total) throw new Error('Manifest validation failed: exactly 64 entries are required');
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
    throw new Error('Dataset validation failed: expected 6 / 28 / 8 / 16 / 6 = 64');
  }
}

export function runPlan(dataset: GeneratedDataset): void {
  assertDatasetCounts(dataset);
  console.log(`Plan for ${SEED_VERSION}`);
  console.log(`Personas: ${dataset.personas.length}`);
  for (const persona of dataset.personas) console.log(` - ${persona.slug} (${persona.userId})`);
  console.log('Table counts:');
  console.log(' - users: 6');
  console.log(' - personalContext: 28');
  console.log(' - observations: 8');
  console.log(' - calendarEvents: 16');
  console.log(' - decisions: 6');
  console.log('Total records: 64');
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
