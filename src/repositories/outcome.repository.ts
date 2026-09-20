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

  private mapToOutcome(row: any): Outcome {
    return {
      id: row.id,
      decisionId: row.decision_id,
      userId: row.user_id,
      description: row.description,
      observedAt: new Date(row.observed_at),
      createdAt: new Date(row.created_at)
    };
  }
}
