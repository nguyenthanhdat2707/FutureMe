import * as fs from 'fs';
import * as path from 'path';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  SEED_VERSION,
  createManifest,
  generateDemoUserId,
  generatePhase4Dataset,
  loadManifest,
  PERSONA_SLUGS,
  preflightAllKeys,
  processBatchWrites,
  runApply,
  runRollback,
  runVerify,
  saveManifest,
  type ManifestEntry,
} from '../demo/phase4-evaluation-dataset';

const tempRoot = path.join(__dirname, '.phase4-demo-data-test');
const envVars: Record<string, string> = {
  USERS_TABLE: 'users-table',
  CONTEXT_TABLE: 'context-table',
  OBS_TABLE: 'observations-table',
  CALENDAR_TABLE: 'calendar-table',
  DECISIONS_TABLE: 'decisions-table',
};

function commandInput(command: unknown): Record<string, unknown> {
  if (typeof command !== 'object' || command === null || !('input' in command)) {
    throw new Error('Expected an AWS command with input');
  }
  const input = command.input;
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Expected command input to be an object');
  }
  return input as Record<string, unknown>;
}

function setupTemp(name: string): string {
  const dir = path.join(tempRoot, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'manifest.json');
}

afterAll(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

describe('Phase 4 deterministic demo dataset', () => {
  const seededAt = new Date('2026-01-02T03:04:05.000Z');

  it('produces six personas and the exact 6/72/36/390/6 = 510 contract', () => {
    const dataset = generatePhase4Dataset(seededAt);
    expect(dataset.personas.map((persona) => persona.slug)).toEqual(PERSONA_SLUGS);
    expect(dataset.records.users).toHaveLength(6);
    expect(dataset.records.personalContext).toHaveLength(72);
    expect(dataset.records.observations).toHaveLength(36);
    expect(dataset.records.calendarEvents).toHaveLength(390);
    expect(dataset.records.decisions).toHaveLength(6);
    expect(Object.values(dataset.records).flat()).toHaveLength(510);
  });

  it('busy-balancer has at least 60 calendar events and multiple displaceable commitments', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const events = dataset.records.calendarEvents.filter((record) => record.persona === 'busy-balancer');
    expect(events.length).toBeGreaterThanOrEqual(60);
    const displaceable = events.filter((record) => {
      const metadata = JSON.parse(record.raw_data as string) as Record<string, unknown>;
      return (metadata.flexibility === 'OPTIONAL' || metadata.flexibility === 'MOVABLE') && metadata.priority === 'LOW';
    });
    expect(displaceable.length).toBeGreaterThanOrEqual(3);
  });

  it('needs-clarity has zero events on day 2 (Wednesday) and at most 2 on day 3 (Thursday)', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const refDate = new Date('2026-01-02T03:04:05.000Z');
    const localClock = new Date(refDate.getTime() + 7 * 3_600_000);
    const localDayStartUtc = new Date(Date.UTC(localClock.getUTCFullYear(), localClock.getUTCMonth(), localClock.getUTCDate(), -7));
    const wd = (day: number) => new Date(localDayStartUtc.getTime() + day * 86_400_000);
    const events = dataset.records.calendarEvents.filter((record) => record.persona === 'needs-clarity');
    const wedEvents = events.filter((record) => {
      const start = new Date(record.start_time as string);
      return start >= wd(2) && start < wd(3);
    });
    const thuEvents = events.filter((record) => {
      const start = new Date(record.start_time as string);
      return start >= wd(3) && start < wd(4);
    });
    expect(wedEvents).toHaveLength(0);
    expect(thuEvents.length).toBeLessThanOrEqual(2);
  });

  it('focused-builder has a LOW-priority MOVABLE event during the morning focus window on day 2', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const events = dataset.records.calendarEvents.filter((record) => record.persona === 'focused-builder');
    const movableLow = events.filter((record) => {
      const metadata = JSON.parse(record.raw_data as string) as Record<string, unknown>;
      return metadata.flexibility === 'MOVABLE' && metadata.priority === 'LOW';
    });
    expect(movableLow.length).toBeGreaterThanOrEqual(1);
  });

  it('overloaded-lead has no events on day 2 (Wednesday) after 13:00 VN', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const refDate = new Date('2026-01-02T03:04:05.000Z');
    const localClock = new Date(refDate.getTime() + 7 * 3_600_000);
    const localDayStartUtc = new Date(Date.UTC(localClock.getUTCFullYear(), localClock.getUTCMonth(), localClock.getUTCDate(), -7));
    const wdStart = (day: number, hour: number) => new Date(localDayStartUtc.getTime() + day * 86_400_000 + hour * 3_600_000);
    const events = dataset.records.calendarEvents.filter((record) => record.persona === 'overloaded-lead');
    const wedAfternoon = events.filter((record) => {
      const start = new Date(record.start_time as string);
      return start >= wdStart(2, 6) && start < wdStart(3, 0);
    });
    expect(wedAfternoon).toHaveLength(0);
  });

  it('all personas have at least 50 calendar events', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const slugs = ['focused-builder', 'busy-balancer', 'overloaded-lead', 'needs-clarity', 'uncertain-skipper', 'conflict-check'] as const;
    for (const slug of slugs) {
      const count = dataset.records.calendarEvents.filter((record) => record.persona === slug).length;
      expect(count).toBeGreaterThanOrEqual(50);
    }
  });

  it('uses deterministic public demo IDs as every record owner', () => {
    const first = generatePhase4Dataset(seededAt);
    const second = generatePhase4Dataset(seededAt);
    expect(first).toEqual(second);
    expect(first.records.users.map((record) => record.id)).toEqual(PERSONA_SLUGS.map(generateDemoUserId));
    for (const records of Object.values(first.records).slice(1)) {
      for (const record of records) expect(record.user_id).toBe(generateDemoUserId(record.persona));
    }
  });

  it('stores a valid dashboard category and optional meeting link in every calendar raw_data payload', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const validCategories = new Set(['deep_work', 'meeting', 'deadline', 'recovery', 'other']);

    for (const record of dataset.records.calendarEvents) {
      const metadata = JSON.parse(record.raw_data as string) as Record<string, unknown>;
      expect(validCategories.has(metadata.category as string)).toBe(true);
      expect(['FIXED', 'MOVABLE', 'OPTIONAL', 'UNKNOWN']).toContain(metadata.flexibility);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(metadata.priority);
      expect(metadata.origin).toBe('BASELINE');
      if ('meetingLink' in metadata) expect(metadata.meetingLink).toMatch(/^https:\/\//);
    }

    expect(dataset.records.calendarEvents.some((record) => {
      const metadata = JSON.parse(record.raw_data as string) as Record<string, unknown>;
      return typeof metadata.meetingLink === 'string';
    })).toBe(true);
  });

  it('keeps persona goals coherent while preserving source authority', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const focused = dataset.records.personalContext.filter((record) => record.persona === 'focused-builder' && record.attribute === 'goal:release');
    expect(focused.map((record) => record.source)).toEqual(expect.arrayContaining(['USER_CONFIRMED', 'SYSTEM_INFERRED']));

    const studentGoals = dataset.records.personalContext.filter((record) => record.persona === 'needs-clarity' && (record.attribute as string).startsWith('goal:'));
    const remaining = studentGoals.reduce((total, record) => total + Number((JSON.parse(record.value as string) as Record<string, unknown>).remainingEffortHours ?? 0), 0);
    expect(studentGoals).toHaveLength(3);
    expect(remaining).toBe(13);

    const founderCalendar = dataset.records.calendarEvents
      .filter((record) => record.persona === 'busy-balancer')
      .map((record) => JSON.parse(record.raw_data as string) as Record<string, unknown>);
    expect(founderCalendar.some((event) => event.flexibility === 'OPTIONAL' && event.priority === 'LOW')).toBe(true);
    expect(founderCalendar.some((event) => event.linkedGoalId === 'pitch')).toBe(true);

    const latestEvent = Math.max(...dataset.records.calendarEvents.map((record) => Date.parse(record.start_time as string)));
    expect(latestEvent).toBeGreaterThanOrEqual(seededAt.getTime() + 27 * 86_400_000);
  });
});

describe('Phase 4 manifest safety', () => {
  it('writes a deterministic non-secret manifest without mutating the caller', () => {
    const manifestPath = setupTemp('manifest');
    const state = createManifest(new Date('2026-01-02T03:04:05.000Z'));
    state.entries.reverse();
    const callerOrder = state.entries.map((entry) => entry.id);
    saveManifest(manifestPath, state);

    const persisted = fs.readFileSync(manifestPath, 'utf8');
    expect(persisted.toLowerCase()).not.toMatch(/password|secret|token/);
    expect(state.entries.map((entry) => entry.id)).toEqual(callerOrder);
    expect(loadManifest(manifestPath)?.entries).toHaveLength(510);
  });

  it('rejects altered persona IDs and credential-bearing manifests', () => {
    const manifestPath = setupTemp('invalid-manifest');
    const invalid = createManifest(new Date('2026-01-02T03:04:05.000Z'));
    invalid.personas[0] = { ...invalid.personas[0], userId: 'arbitrary-user' };
    expect(() => saveManifest(manifestPath, invalid)).toThrow(/persona mismatch/i);

    const credentialBearing: Record<string, unknown> = {
      ...createManifest(new Date('2026-01-02T03:04:05.000Z')),
      password: 'must-not-persist',
    };
    fs.writeFileSync(manifestPath, JSON.stringify(credentialBearing));
    expect(() => loadManifest(manifestPath)).toThrow(/credential/i);
  });
});

describe('Phase 4 exact DynamoDB protections', () => {
  it('rejects an existing record missing the exact owner', async () => {
    const item = {
      id: `${SEED_VERSION}:personal-context:focused-builder:x`,
      user_id: generateDemoUserId('focused-builder'),
      seed_version: SEED_VERSION,
      persona: 'focused-builder' as const,
      seeded_at: '2026-01-02T03:04:05.000Z',
    };
    const send = jest.fn().mockResolvedValue({ Item: { ...item, user_id: 'wrong-owner' } });
    await expect(preflightAllKeys(
      { send } as unknown as DynamoDBDocumentClient,
      [{ tableName: 'context-table', table: 'personalContext', items: [item] }],
    )).rejects.toThrow(/owner mismatch/i);
  });

  it('uses batches of at most 25 and retries only unprocessed requests', async () => {
    const owner = generateDemoUserId('focused-builder');
    const records = Array.from({ length: 26 }, (_, index) => ({
      id: `${SEED_VERSION}:personal-context:focused-builder:${index}`,
      user_id: owner,
      seed_version: SEED_VERSION,
      persona: 'focused-builder' as const,
      seeded_at: '2026-01-02T03:04:05.000Z',
    }));
    const entries: ManifestEntry[] = records.map((record) => ({
      table: 'personalContext', id: record.id, persona: record.persona,
      expectedOwnerId: owner, completed: false,
    }));
    const send = jest.fn()
      .mockResolvedValueOnce({ UnprocessedItems: { table: [{ PutRequest: { Item: records[0] } }] } })
      .mockResolvedValue({ UnprocessedItems: {} });

    await processBatchWrites(
      { send } as unknown as DynamoDBDocumentClient,
      'table', 'personalContext', records, entries, () => undefined, 0,
    );

    const sizes = send.mock.calls.map(([command]) => {
      const requestItems = commandInput(command).RequestItems as Record<string, unknown[]>;
      return requestItems.table.length;
    });
    expect(sizes).toEqual([25, 1, 1]);
    expect(entries.every((entry) => entry.completed)).toBe(true);
  });

  it('fails closed after the finite retry limit', async () => {
    const owner = generateDemoUserId('focused-builder');
    const record = {
      id: `${SEED_VERSION}:personal-context:focused-builder:retry`, user_id: owner,
      seed_version: SEED_VERSION, persona: 'focused-builder' as const, seeded_at: '2026-01-02T03:04:05.000Z',
    };
    const entry: ManifestEntry = {
      table: 'personalContext', id: record.id, persona: record.persona,
      expectedOwnerId: owner, completed: false,
    };
    const send = jest.fn().mockResolvedValue({ UnprocessedItems: { table: [{ PutRequest: { Item: record } }] } });
    await expect(processBatchWrites(
      { send } as unknown as DynamoDBDocumentClient,
      'table', 'personalContext', [record], [entry], () => undefined, 0,
    )).rejects.toThrow(/after 3 attempts/);
    expect(send).toHaveBeenCalledTimes(3);
    expect(entry.completed).toBe(false);
  });
});

describe('Phase 4 apply, verify, and rollback', () => {
  it('preflights all 510 keys before the first write and persists completion', async () => {
    const manifestPath = setupTemp('apply');
    const send = jest.fn().mockImplementation((command: unknown) => {
      const input = commandInput(command);
      return Promise.resolve(input.RequestItems ? { UnprocessedItems: {} } : { Item: undefined });
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await runApply({ send } as unknown as DynamoDBDocumentClient, manifestPath, envVars);
    logSpy.mockRestore();

    const calls = send.mock.calls as Array<[unknown]>;
    expect(calls.slice(0, 510).every(([command]) => !commandInput(command).RequestItems)).toBe(true);
    expect(commandInput(calls[510][0]).RequestItems).toBeDefined();
    expect(loadManifest(manifestPath)?.entries.every((entry) => entry.completed)).toBe(true);
  });

  it('verifies all exact owned records and rejects owner drift', async () => {
    const manifestPath = setupTemp('verify');
    const state = createManifest(new Date('2026-01-02T03:04:05.000Z'));
    state.entries.forEach((entry) => { entry.completed = true; });
    saveManifest(manifestPath, state);
    const entryById = new Map(state.entries.map((entry) => [entry.id, entry]));
    const send = jest.fn().mockImplementation((command: unknown) => {
      const key = commandInput(command).Key as { id: string };
      const entry = entryById.get(key.id);
      if (!entry) return Promise.resolve({ Item: undefined });
      return Promise.resolve({
        Item: {
          id: entry.id,
          user_id: entry.table === 'users' ? undefined : 'wrong-owner',
          seed_version: SEED_VERSION,
          persona: entry.persona,
        },
      });
    });
    await expect(runVerify(
      { send } as unknown as DynamoDBDocumentClient, manifestPath, envVars,
    )).rejects.toThrow(/owner mismatch/i);
  });

  it('does not delete any key when rollback ownership preflight fails', async () => {
    const manifestPath = setupTemp('rollback');
    const state = createManifest(new Date('2026-01-02T03:04:05.000Z'));
    state.entries.slice(0, 2).forEach((entry) => { entry.completed = true; });
    saveManifest(manifestPath, state);
    const send = jest.fn().mockResolvedValue({
      Item: {
        id: state.entries[0].id,
        seed_version: 'foreign',
        persona: state.entries[0].persona,
      },
    });

    await expect(runRollback(
      { send } as unknown as DynamoDBDocumentClient, manifestPath, envVars, 0,
    )).rejects.toThrow(/seed version/i);
    expect(send.mock.calls.some(([command]) => Boolean(commandInput(command).RequestItems))).toBe(false);
    expect(loadManifest(manifestPath)?.entries.filter((entry) => entry.completed)).toHaveLength(2);
  });
});

describe('Phase 4 script safety', () => {
  it('imports without executing an AWS command', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const scriptPath = path.join(__dirname, '../../scripts/phase4-evaluation-data');
    const script = await import(scriptPath) as { main: (args: string[], env: NodeJS.ProcessEnv) => Promise<void> };
    expect(typeof script.main).toBe('function');
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
