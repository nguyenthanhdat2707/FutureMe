import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { generatePhase4Dataset, type DynamoRecord } from '../demo/phase4-evaluation-dataset';
import { DEMO_PERSONAS } from '../demo/personas';
import { DynamoDemoResetRepository } from '../repositories/dynamo/demo-reset.repository';

const TABLES = {
  users: 'test-users',
  personalContext: 'test-context',
  observations: 'test-observations',
  calendarEvents: 'test-calendar',
  decisions: 'test-decisions',
  outcomes: 'test-outcomes',
  feedback: 'test-feedback',
} as const;

class FakeDynamoClient {
  readonly tables = new Map<string, Map<string, Record<string, unknown>>>();

  put(tableName: string, item: Record<string, unknown>): void {
    let table = this.tables.get(tableName);
    if (!table) {
      table = new Map();
      this.tables.set(tableName, table);
    }
    table.set(item.id as string, { ...item });
  }

  forUser(tableName: string, userId: string): Record<string, unknown>[] {
    return [...(this.tables.get(tableName)?.values() ?? [])]
      .filter((item) => item.user_id === userId)
      .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  }

  snapshot(): Record<string, Record<string, unknown>[]> {
    return Object.fromEntries([...this.tables.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([name, items]) => [
      name,
      [...items.values()].map((item) => ({ ...item })).sort((left, right) => String(left.id).localeCompare(String(right.id))),
    ]));
  }

  send(command: unknown): Promise<Record<string, unknown>> {
    if (command instanceof GetCommand) {
      const id = command.input.Key?.id as string;
      return Promise.resolve({ Item: this.tables.get(command.input.TableName as string)?.get(id) });
    }
    if (command instanceof QueryCommand) {
      const userId = command.input.ExpressionAttributeValues?.[':userId'] as string;
      return Promise.resolve({ Items: this.forUser(command.input.TableName as string, userId) });
    }
    if (command instanceof DeleteCommand) {
      const id = command.input.Key?.id as string;
      this.tables.get(command.input.TableName as string)?.delete(id);
      return Promise.resolve({});
    }
    if (command instanceof PutCommand) {
      this.put(command.input.TableName as string, command.input.Item as Record<string, unknown>);
      return Promise.resolve({});
    }
    throw new Error(`Unsupported command: ${String(command)}`);
  }
}

function seedFakeDynamo(client: FakeDynamoClient, records: ReturnType<typeof generatePhase4Dataset>['records']): void {
  const mapping = {
    users: TABLES.users,
    personalContext: TABLES.personalContext,
    observations: TABLES.observations,
    calendarEvents: TABLES.calendarEvents,
    decisions: TABLES.decisions,
  } as const;
  for (const [key, tableName] of Object.entries(mapping) as Array<[keyof typeof mapping, string]>) {
    for (const record of records[key]) client.put(tableName, record);
  }
}

describe('DynamoDemoResetRepository', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      USERS_TABLE: TABLES.users,
      CONTEXT_TABLE: TABLES.personalContext,
      OBS_TABLE: TABLES.observations,
      CALENDAR_TABLE: TABLES.calendarEvents,
      DECISIONS_TABLE: TABLES.decisions,
      OUTCOMES_TABLE: TABLES.outcomes,
      FEEDBACK_TABLE: TABLES.feedback,
    };
    delete process.env.INTERVENTIONS_TABLE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('restores the selected persona across configured production tables without touching another persona', async () => {
    const seededAt = new Date('2026-09-25T01:23:45.000Z');
    const dataset = generatePhase4Dataset(seededAt);
    const selected = DEMO_PERSONAS[0];
    const other = DEMO_PERSONAS[1];
    const client = new FakeDynamoClient();
    seedFakeDynamo(client, dataset.records);

    const selectedUser = client.tables.get(TABLES.users)?.get(selected.id);
    if (!selectedUser) throw new Error('Missing selected test user');
    selectedUser.display_name = 'Mutated name';
    const selectedContext = client.forUser(TABLES.personalContext, selected.id)[0];
    selectedContext.value = 'mutated context';
    client.put(TABLES.personalContext, selectedContext);
    client.put(TABLES.calendarEvents, { id: 'runtime-calendar-a', user_id: selected.id, start_time: seededAt.toISOString() });
    client.put(TABLES.decisions, { id: 'runtime-decision-a', user_id: selected.id, created_at: seededAt.toISOString() });
    client.put(TABLES.outcomes, { id: 'runtime-outcome-a', user_id: selected.id, recorded_at: seededAt.toISOString() });
    client.put(TABLES.feedback, { id: 'runtime-feedback-a', user_id: selected.id, created_at: seededAt.toISOString() });
    client.put(TABLES.calendarEvents, { id: 'runtime-calendar-b', user_id: other.id, start_time: seededAt.toISOString() });

    const repository = new DynamoDemoResetRepository(
      client as unknown as DynamoDBDocumentClient,
      () => Promise.resolve(),
    );
    const result = await repository.resetPersona(selected.id);

    expect(result).toMatchObject({
      success: true,
      userId: selected.id,
      seedVersion: 'temporal-demo-v1',
      seededAt: seededAt.toISOString(),
    });
    const expectedFor = (records: DynamoRecord[]) => records
      .filter((record) => record.persona === selected.slug)
      .sort((left, right) => left.id.localeCompare(right.id));
    expect(client.tables.get(TABLES.users)?.get(selected.id)).toEqual(expectedFor(dataset.records.users)[0]);
    expect(client.forUser(TABLES.personalContext, selected.id)).toEqual(expectedFor(dataset.records.personalContext));
    expect(client.forUser(TABLES.observations, selected.id)).toEqual(expectedFor(dataset.records.observations));
    expect(client.forUser(TABLES.calendarEvents, selected.id)).toEqual(expectedFor(dataset.records.calendarEvents));
    expect(client.forUser(TABLES.decisions, selected.id)).toEqual(expectedFor(dataset.records.decisions));
    expect(client.forUser(TABLES.outcomes, selected.id)).toEqual([]);
    expect(client.forUser(TABLES.feedback, selected.id)).toEqual([]);
    expect(client.tables.get(TABLES.calendarEvents)?.get('runtime-calendar-b')).toEqual(expect.objectContaining({ user_id: other.id }));

    const afterFirstReset = client.snapshot();
    await repository.resetPersona(selected.id);
    expect(client.snapshot()).toEqual(afterFirstReset);
  });
});
