/**
 * Outcome Repository (Phase 6)
 */

import { IOutcomeRepository, Awaitable } from './interfaces';
import { BaseRepository } from './base.repository';
import { Outcome, OutcomeStatus } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class SqliteOutcomeRepository extends BaseRepository implements IOutcomeRepository {
  findById(id: string): Awaitable<Outcome | null> {
    const row = this.db.get('SELECT * FROM outcomes WHERE id = ?', [id]);
    return row ? this.mapToOutcome(row) : null;
  }

  findByDecisionId(decisionId: string): Awaitable<Outcome | null> {
    const row = this.db.get(`
      SELECT * FROM outcomes
      WHERE decision_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `, [decisionId]);

    return row ? this.mapToOutcome(row) : null;
  }

  findByUserId(userId: string, limit: number = 50): Awaitable<Outcome[]> {
    const rows = this.db.all(`
      SELECT * FROM outcomes
      WHERE user_id = ?
      ORDER BY recorded_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToOutcome.bind(this));
  }

  create(outcome: Omit<Outcome, 'id' | 'createdAt' | 'updatedAt'>): Awaitable<Outcome> {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO outcomes (
        id, decision_id, user_id, outcome_status, 
        would_repeat, outcome_notes, recorded_at, updated_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      outcome.decisionId,
      outcome.userId,
      outcome.outcomeStatus,
      outcome.wouldRepeat === null ? null : (outcome.wouldRepeat ? 1 : 0),
      outcome.outcomeNotes,
      outcome.recordedAt.toISOString(),
      now,
      now
    ]);

    return this.findById(id) as Outcome;
  }

  update(id: string, updates: Partial<Pick<Outcome, 'outcomeStatus' | 'wouldRepeat' | 'outcomeNotes'>>): Awaitable<Outcome | null> {
    const outcome = this.findById(id);
    if (!outcome) return null;

    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.outcomeStatus !== undefined) {
      setClauses.push('outcome_status = ?');
      values.push(updates.outcomeStatus);
    }
    if (updates.wouldRepeat !== undefined) {
      setClauses.push('would_repeat = ?');
      values.push(updates.wouldRepeat === null ? null : (updates.wouldRepeat ? 1 : 0));
    }
    if (updates.outcomeNotes !== undefined) {
      setClauses.push('outcome_notes = ?');
      values.push(updates.outcomeNotes);
    }

    if (setClauses.length === 0) return outcome;

    setClauses.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.run(
      `UPDATE outcomes SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private mapToOutcome(row: unknown): Outcome {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;
    
    let wouldRepeat: boolean | null = null;
    if (r.would_repeat === 1) wouldRepeat = true;
    else if (r.would_repeat === 0) wouldRepeat = false;

    return {
      id: typeof r.id === 'string' ? r.id : '',
      decisionId: typeof r.decision_id === 'string' ? r.decision_id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      outcomeStatus: (typeof r.outcome_status === 'string' ? r.outcome_status : 'pending') as OutcomeStatus,
      wouldRepeat,
      outcomeNotes: typeof r.outcome_notes === 'string' ? r.outcome_notes : null,
      recordedAt: new Date(typeof r.recorded_at === 'string' ? r.recorded_at : 0),
      updatedAt: new Date(typeof r.updated_at === 'string' ? r.updated_at : 0),
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
