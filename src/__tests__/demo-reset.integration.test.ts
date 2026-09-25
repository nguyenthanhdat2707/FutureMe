/* Supertest response bodies are validated through runtime assertions. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import { createApp } from '../app';
import { closeDatabase, initDatabase } from '../database/connection';
import { DB } from '../database/db-helper';
import { generatePhase4Dataset, generatePhase4Id } from '../demo/phase4-evaluation-dataset';
import { DEMO_PERSONAS } from '../demo/personas';

const PERSONA_A = DEMO_PERSONAS[0];
const PERSONA_B = DEMO_PERSONAS[1];
const OWNED_TABLES = [
  'personal_context',
  'observations',
  'calendar_events',
  'decisions',
  'decision_choices',
  'outcomes',
  'feedback',
  'interventions',
  'check_in_schedule',
] as const;

function insertRuntimeState(db: DB, userId: string, suffix: string): void {
  const now = new Date('2026-09-25T02:00:00.000Z').toISOString();
  const decisionId = `runtime-decision-${suffix}`;

  db.run(
    'INSERT INTO calendar_events (id, user_id, external_id, title, start_time, end_time, status, raw_data, synced_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`runtime-calendar-${suffix}`, userId, `runtime-external-${suffix}`, 'Runtime event', now, now, 'CONFIRMED', JSON.stringify({ origin: 'RUNTIME' }), now, now],
  );
  db.run(
    'INSERT INTO personal_context (id, user_id, attribute, value, source, confidence, observed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [`runtime-context-${suffix}`, userId, 'preference:runtime', 'runtime', 'USER_CONFIRMED', 1, now, now],
  );
  db.run(
    'INSERT INTO observations (id, user_id, type, data, source, confidence, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [`runtime-observation-${suffix}`, userId, 'USER_REPORTED', '{}', 'USER_CONFIRMED', 1, now, now],
  );
  db.run(
    'INSERT INTO decisions (id, user_id, question, context_snapshot, recommendation, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [decisionId, userId, 'Runtime decision', '{}', '{}', 'PENDING', now],
  );
  db.run(
    'INSERT INTO decision_choices (id, decision_id, user_id, chosen_action, chosen_action_display, ai_recommendation, chosen_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`runtime-choice-${suffix}`, decisionId, userId, 'accept', 'Accept', 'Accept', now, 'final', now],
  );
  db.run(
    'INSERT INTO outcomes (id, decision_id, user_id, outcome_status, recorded_at, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`runtime-outcome-${suffix}`, decisionId, userId, 'positive', now, now, now],
  );
  db.run(
    'INSERT INTO feedback (id, user_id, target_type, target_id, feedback_text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [`runtime-feedback-${suffix}`, userId, 'decision', decisionId, 'Runtime feedback', now],
  );
  db.run(
    'INSERT INTO interventions (id, user_id, decision_id, issue_key, type, level, status, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`runtime-intervention-${suffix}`, userId, decisionId, `runtime:${suffix}`, 'CONTEXT_CHECK', 'PROACTIVE', 'ACTIVE', 'Runtime intervention', now],
  );
  db.run(
    'INSERT INTO check_in_schedule (id, decision_id, user_id, scheduled_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [`runtime-check-in-${suffix}`, decisionId, userId, now, 'pending', now],
  );
}

function snapshotPersona(db: DB, userId: string): Record<string, unknown[]> {
  return Object.fromEntries(OWNED_TABLES.map((table) => [
    table,
    db.all(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY id`, [userId]),
  ]));
}

describe('selected demo persona reset', () => {
  const databasePath = path.join(tmpdir(), `future-me-demo-reset-${process.pid}-${Date.now()}.db`);
  const app = createApp();
  let originalAuthMode: string | undefined;

  beforeAll(async () => {
    originalAuthMode = process.env.AUTH_MODE;
    process.env.AUTH_MODE = 'demo';
    await initDatabase(databasePath);
  });

  afterAll(() => {
    closeDatabase();
    if (originalAuthMode === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = originalAuthMode;
    if (existsSync(databasePath)) rmSync(databasePath);
  });

  it('removes runtime state and restores edited baseline records exactly', async () => {
    const firstReset = await request(app)
      .post('/api/demo/reset')
      .set('X-Demo-User', PERSONA_A.id)
      .expect(200);

    expect(firstReset.body).toMatchObject({
      success: true,
      userId: PERSONA_A.id,
      seedVersion: 'temporal-demo-v1',
      seededAt: expect.any(String),
    });

    const seededAt = new Date(firstReset.body.seededAt as string);
    const expected = generatePhase4Dataset(seededAt);
    const expectedContext = expected.records.personalContext.find((record) =>
      record.id === generatePhase4Id('personal-context', PERSONA_A.slug, 'goal-user'));
    const expectedEvent = expected.records.calendarEvents.find((record) => record.persona === PERSONA_A.slug);
    expect(expectedContext).toBeDefined();
    expect(expectedEvent).toBeDefined();

    const db = new DB();
    db.run('UPDATE users SET email = ?, display_name = ? WHERE id = ?', ['mutated@example.com', 'Mutated persona', PERSONA_A.id]);
    db.run('UPDATE personal_context SET value = ? WHERE id = ?', ['mutated context', expectedContext!.id]);
    db.run('UPDATE calendar_events SET title = ? WHERE id = ?', ['Mutated baseline event', expectedEvent!.id]);
    insertRuntimeState(db, PERSONA_A.id, 'a');

    await request(app)
      .post('/api/demo/reset')
      .set('X-Demo-User', PERSONA_A.id)
      .expect(200);

    expect(db.get('SELECT email, display_name FROM users WHERE id = ?', [PERSONA_A.id])).toEqual({
      email: PERSONA_A.email,
      display_name: PERSONA_A.displayName,
    });
    expect(db.get('SELECT value FROM personal_context WHERE id = ?', [expectedContext!.id])).toEqual({ value: expectedContext!.value });
    expect(db.get('SELECT title FROM calendar_events WHERE id = ?', [expectedEvent!.id])).toEqual({ title: expectedEvent!.title });

    for (const table of OWNED_TABLES) {
      expect(db.get(`SELECT id FROM ${table} WHERE id LIKE ?`, ['runtime-%'])).toBeNull();
    }

    const personaRecords = (records: Array<{ persona: string }>) => records.filter((record) => record.persona === PERSONA_A.slug).length;
    expect((snapshotPersona(db, PERSONA_A.id).personal_context)).toHaveLength(personaRecords(expected.records.personalContext));
    expect((snapshotPersona(db, PERSONA_A.id).observations)).toHaveLength(personaRecords(expected.records.observations));
    expect((snapshotPersona(db, PERSONA_A.id).calendar_events)).toHaveLength(personaRecords(expected.records.calendarEvents));
    expect((snapshotPersona(db, PERSONA_A.id).decisions)).toHaveLength(personaRecords(expected.records.decisions));
  });

  it('resets only the selected persona', async () => {
    await request(app).post('/api/demo/reset').set('X-Demo-User', PERSONA_A.id).expect(200);
    await request(app).post('/api/demo/reset').set('X-Demo-User', PERSONA_B.id).expect(200);

    const db = new DB();
    insertRuntimeState(db, PERSONA_A.id, 'isolation-a');
    insertRuntimeState(db, PERSONA_B.id, 'isolation-b');

    await request(app).post('/api/demo/reset').set('X-Demo-User', PERSONA_A.id).expect(200);

    expect(db.get('SELECT id FROM calendar_events WHERE id = ?', ['runtime-calendar-isolation-a'])).toBeNull();
    expect(db.get('SELECT id FROM decisions WHERE id = ?', ['runtime-decision-isolation-a'])).toBeNull();
    expect(db.get('SELECT id FROM calendar_events WHERE id = ?', ['runtime-calendar-isolation-b'])).toEqual({ id: 'runtime-calendar-isolation-b' });
    expect(db.get('SELECT id FROM decisions WHERE id = ?', ['runtime-decision-isolation-b'])).toEqual({ id: 'runtime-decision-isolation-b' });
  });

  it('is idempotent', async () => {
    await request(app).post('/api/demo/reset').set('X-Demo-User', PERSONA_A.id).expect(200);
    const db = new DB();
    const afterFirstReset = snapshotPersona(db, PERSONA_A.id);
    const userAfterFirstReset = db.get('SELECT * FROM users WHERE id = ?', [PERSONA_A.id]);

    await request(app).post('/api/demo/reset').set('X-Demo-User', PERSONA_A.id).expect(200);

    expect(snapshotPersona(db, PERSONA_A.id)).toEqual(afterFirstReset);
    expect(db.get('SELECT * FROM users WHERE id = ?', [PERSONA_A.id])).toEqual(userAfterFirstReset);
  });
});
