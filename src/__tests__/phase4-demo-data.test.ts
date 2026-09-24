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

  it('produces six personas and the exact 6/48/8/94/19 = 175 contract', () => {
    const dataset = generatePhase4Dataset(seededAt);
    expect(dataset.personas.map((persona) => persona.slug)).toEqual(PERSONA_SLUGS);
    expect(dataset.records.users).toHaveLength(6);
    expect(dataset.records.personalContext).toHaveLength(48);
    expect(dataset.records.observations).toHaveLength(8);
    expect(dataset.records.calendarEvents).toHaveLength(94);
    expect(dataset.records.decisions).toHaveLength(19);
    expect(Object.values(dataset.records).flat()).toHaveLength(175);
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
      if ('meetingLink' in metadata) expect(metadata.meetingLink).toMatch(/^https:\/\//);
    }

    expect(dataset.records.calendarEvents.some((record) => {
      const metadata = JSON.parse(record.raw_data as string) as Record<string, unknown>;
      return typeof metadata.meetingLink === 'string';
    })).toBe(true);
  });

  it('preserves authority, expiry, and stable-entity conflict fixtures', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const focused = dataset.records.personalContext.filter((record) => {
      if (record.persona !== 'focused-builder' || record.attribute !== 'goal') return false;
      const parsed = (typeof record.value === 'string' ? JSON.parse(record.value) : record.value) as { id?: string } | null;
      return parsed?.id === 'ship';
    });
    expect(focused.map((record) => record.source)).toEqual(expect.arrayContaining(['USER_CONFIRMED', 'SYSTEM_INFERRED']));

    const expired = dataset.records.personalContext.find((record) => {
      if (record.persona !== 'overloaded-lead' || record.attribute !== 'goal') return false;
      const parsed = (typeof record.value === 'string' ? JSON.parse(record.value) : record.value) as { id?: string } | null;
      return parsed?.id === 'arch-brownbag';
    });
    expect(new Date(expired?.valid_until as string).getTime()).toBeLessThan(seededAt.getTime());

    const conflicts = dataset.records.personalContext.filter((record) => {
      if (record.persona !== 'conflict-check' || record.attribute !== 'goal') return false;
      const parsed = (typeof record.value === 'string' ? JSON.parse(record.value) : record.value) as { id?: string } | null;
      return parsed?.id === 'compete';
    });
    expect(conflicts).toHaveLength(2);
    expect(new Set(conflicts.map((record) => record.observed_at)).size).toBe(1);
    expect(new Set(conflicts.map((record) => record.value)).size).toBe(2);
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
    expect(loadManifest(manifestPath)?.entries).toHaveLength(175);
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
  it('preflights all 175 keys before the first write and persists completion', async () => {
    const manifestPath = setupTemp('apply');
    const send = jest.fn().mockImplementation((command: unknown) => {
      const input = commandInput(command);
      return Promise.resolve(input.RequestItems ? { UnprocessedItems: {} } : { Item: undefined });
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await runApply({ send } as unknown as DynamoDBDocumentClient, manifestPath, envVars);
    logSpy.mockRestore();

    const calls = send.mock.calls as Array<[unknown]>;
    expect(calls.slice(0, 175).every(([command]) => !commandInput(command).RequestItems)).toBe(true);
    expect(commandInput(calls[175][0]).RequestItems).toBeDefined();
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
