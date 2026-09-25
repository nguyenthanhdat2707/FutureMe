import { DB } from '../database/db-helper';
import { generatePhase4Dataset, SEED_VERSION, type DynamoRecord } from '../demo/phase4-evaluation-dataset';
import { getDemoPersonaById, type DemoPersonaId } from '../demo/personas';

export interface DemoResetCounts {
  users: number;
  personalContext: number;
  observations: number;
  calendarEvents: number;
  decisions: number;
}

export interface DemoResetResult {
  success: true;
  userId: DemoPersonaId;
  seedVersion: string;
  seededAt: string;
  restored: DemoResetCounts;
}

export interface IDemoResetRepository {
  resetPersona(userId: DemoPersonaId): Promise<DemoResetResult>;
}

type Statement = { sql: string; params?: unknown[] };

function recordValue(record: DynamoRecord, key: string): unknown {
  return record[key] ?? null;
}

export class SqliteDemoResetRepository implements IDemoResetRepository {
  private readonly db = new DB();

  resetPersona(userId: DemoPersonaId): Promise<DemoResetResult> {
    const persona = getDemoPersonaById(userId);
    const existing = this.db.get('SELECT created_at FROM users WHERE id = ?', [userId]) as Record<string, unknown> | null;
    const existingCreatedAt = typeof existing?.created_at === 'string' ? new Date(existing.created_at) : null;
    const seededAt = existingCreatedAt && !Number.isNaN(existingCreatedAt.getTime()) ? existingCreatedAt : new Date();
    const dataset = generatePhase4Dataset(seededAt);
    const records = {
      users: dataset.records.users.filter((record) => record.persona === persona.slug),
      personalContext: dataset.records.personalContext.filter((record) => record.persona === persona.slug),
      observations: dataset.records.observations.filter((record) => record.persona === persona.slug),
      calendarEvents: dataset.records.calendarEvents.filter((record) => record.persona === persona.slug),
      decisions: dataset.records.decisions.filter((record) => record.persona === persona.slug),
    };

    const statements: Statement[] = [
      { sql: 'DELETE FROM feedback WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM interventions WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM check_in_schedule WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM decision_choices WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM outcomes WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM calendar_events WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM observations WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM personal_context WHERE user_id = ?', params: [userId] },
      { sql: 'DELETE FROM decisions WHERE user_id = ?', params: [userId] },
    ];

    for (const record of records.users) {
      statements.push({
        sql: `INSERT INTO users (id, email, google_id, display_name, tokens, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            google_id = excluded.google_id,
            display_name = excluded.display_name,
            tokens = excluded.tokens,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at`,
        params: [
          record.id,
          recordValue(record, 'email'),
          recordValue(record, 'google_id'),
          recordValue(record, 'display_name'),
          recordValue(record, 'tokens'),
          recordValue(record, 'created_at'),
          recordValue(record, 'updated_at'),
        ],
      });
    }

    for (const record of records.personalContext) {
      statements.push({
        sql: `INSERT INTO personal_context
          (id, user_id, attribute, value, source, confidence, observed_at, valid_until, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          record.id,
          record.user_id,
          recordValue(record, 'attribute'),
          recordValue(record, 'value'),
          recordValue(record, 'source'),
          recordValue(record, 'confidence'),
          recordValue(record, 'observed_at'),
          recordValue(record, 'valid_until'),
          recordValue(record, 'created_at'),
        ],
      });
    }

    for (const record of records.observations) {
      statements.push({
        sql: `INSERT INTO observations
          (id, user_id, type, data, source, confidence, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          record.id,
          record.user_id,
          recordValue(record, 'type'),
          recordValue(record, 'data'),
          recordValue(record, 'source'),
          recordValue(record, 'confidence'),
          recordValue(record, 'timestamp'),
          recordValue(record, 'created_at'),
        ],
      });
    }

    for (const record of records.calendarEvents) {
      statements.push({
        sql: `INSERT INTO calendar_events
          (id, user_id, external_id, title, start_time, end_time, status, raw_data, synced_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          record.id,
          record.user_id,
          recordValue(record, 'external_id'),
          recordValue(record, 'title'),
          recordValue(record, 'start_time'),
          recordValue(record, 'end_time'),
          recordValue(record, 'status'),
          recordValue(record, 'raw_data'),
          recordValue(record, 'synced_at'),
          recordValue(record, 'created_at'),
        ],
      });
    }

    for (const record of records.decisions) {
      statements.push({
        sql: `INSERT INTO decisions
          (id, user_id, question, category, context_snapshot, recommendation, user_choice, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          record.id,
          record.user_id,
          recordValue(record, 'question'),
          recordValue(record, 'category'),
          recordValue(record, 'context_snapshot'),
          recordValue(record, 'recommendation'),
          recordValue(record, 'user_choice'),
          recordValue(record, 'status'),
          recordValue(record, 'created_at'),
        ],
      });
    }

    this.db.runTransaction(statements);

    return Promise.resolve({
      success: true,
      userId,
      seedVersion: SEED_VERSION,
      seededAt: seededAt.toISOString(),
      restored: {
        users: records.users.length,
        personalContext: records.personalContext.length,
        observations: records.observations.length,
        calendarEvents: records.calendarEvents.length,
        decisions: records.decisions.length,
      },
    });
  }
}
