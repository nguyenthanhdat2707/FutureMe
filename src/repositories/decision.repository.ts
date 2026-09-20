/**
 * Decision Repository
 */

import { BaseRepository } from './base.repository';
import { Decision, DecisionStatus } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class DecisionRepository extends BaseRepository {
  findById(id: string): Decision | null {
    const row = this.db.get('SELECT * FROM decisions WHERE id = ?', [id]);
    return row ? this.mapToDecision(row) : null;
  }

  findByUserId(userId: string, limit: number = 50): Decision[] {
    const rows = this.db.all(`
      SELECT * FROM decisions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToDecision.bind(this));
  }

  create(decision: Omit<Decision, 'createdAt'>): Decision {
    const id = decision.id || uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO decisions (id, user_id, question, context_snapshot, recommendation, user_choice, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      decision.userId,
      decision.question,
      JSON.stringify(decision.relevantContext),
      JSON.stringify(decision.recommendation),
      decision.userChoice ? JSON.stringify(decision.userChoice) : null,
      decision.status,
      now
    ]);

    return this.findById(id)!;
  }

  updateChoice(id: string, userChoice: string): Decision | null {
    const decision = this.findById(id);
    if (!decision) return null;

    this.db.run(`
      UPDATE decisions
      SET user_choice = ?, status = ?
      WHERE id = ?
    `, [JSON.stringify(userChoice), DecisionStatus.CHOSEN, id]);

    return this.findById(id);
  }

  updateStatus(id: string, status: DecisionStatus): Decision | null {
    const decision = this.findById(id);
    if (!decision) return null;

    this.db.run('UPDATE decisions SET status = ? WHERE id = ?', [status, id]);

    return this.findById(id);
  }

  private mapToDecision(row: any): Decision {
    return {
      id: row.id,
      userId: row.user_id,
      question: row.question,
      options: [], // Stored in context_snapshot
      relevantContext: JSON.parse(row.context_snapshot),
      tradeoffs: [], // Stored in context_snapshot
      recommendation: JSON.parse(row.recommendation),
      reasoning: JSON.parse(row.recommendation).reasoning || '',
      confidence: JSON.parse(row.recommendation).confidence || 0,
      userChoice: row.user_choice ? JSON.parse(row.user_choice) : undefined,
      status: row.status as DecisionStatus,
      createdAt: new Date(row.created_at)
    };
  }
}
