/**
 * Outcome Repository
 */

import { BaseRepository } from './base.repository';
import { Outcome } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class OutcomeRepository extends BaseRepository {
  findById(id: string): Outcome | null {
    const row = this.db.get('SELECT * FROM outcomes WHERE id = ?', [id]);
    return row ? this.mapToOutcome(row) : null;
  }

  findByDecisionId(decisionId: string): Outcome[] {
    const rows = this.db.all(`
      SELECT * FROM outcomes
      WHERE decision_id = ?
      ORDER BY observed_at DESC
    `, [decisionId]);

    return rows.map(this.mapToOutcome.bind(this));
  }

  findByUserId(userId: string, limit: number = 50): Outcome[] {
    const rows = this.db.all(`
      SELECT * FROM outcomes
      WHERE user_id = ?
      ORDER BY observed_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToOutcome.bind(this));
  }

  create(outcome: Omit<Outcome, 'id' | 'createdAt'>): Outcome {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO outcomes (id, decision_id, user_id, description, observed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      outcome.decisionId,
      outcome.userId,
      outcome.description,
      outcome.observedAt.toISOString(),
      now
    ]);

    return this.findById(id)!;
  }

  private mapToOutcome(row: unknown): Outcome {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === 'string' ? r.id : '',
      decisionId: typeof r.decision_id === 'string' ? r.decision_id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      description: typeof r.description === 'string' ? r.description : '',
      observedAt: new Date(typeof r.observed_at === 'string' ? r.observed_at : 0),
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
