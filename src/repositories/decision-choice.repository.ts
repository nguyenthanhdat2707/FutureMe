/**
 * Decision Choice Repository (Phase 6)
 */

import { IDecisionChoiceRepository, Awaitable } from './interfaces';
import { BaseRepository } from './base.repository';
import { DecisionChoice, ChosenAction, ChoiceStatus } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class SqliteDecisionChoiceRepository extends BaseRepository implements IDecisionChoiceRepository {
  findById(id: string): Awaitable<DecisionChoice | null> {
    const row = this.db.get('SELECT * FROM decision_choices WHERE id = ?', [id]);
    return row ? this.mapToDecisionChoice(row) : null;
  }

  findByDecisionId(decisionId: string): Awaitable<DecisionChoice | null> {
    const row = this.db.get(`
      SELECT * FROM decision_choices
      WHERE decision_id = ?
      ORDER BY chosen_at DESC
      LIMIT 1
    `, [decisionId]);

    return row ? this.mapToDecisionChoice(row) : null;
  }

  findByUserId(userId: string, limit: number = 50): Awaitable<DecisionChoice[]> {
    const rows = this.db.all(`
      SELECT * FROM decision_choices
      WHERE user_id = ?
      ORDER BY chosen_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToDecisionChoice.bind(this));
  }

  create(choice: Omit<DecisionChoice, 'id' | 'createdAt'>): Awaitable<DecisionChoice> {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO decision_choices (
        id, decision_id, user_id, chosen_action, 
        chosen_action_display, custom_notes, ai_recommendation,
        chosen_at, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      choice.decisionId,
      choice.userId,
      choice.chosenAction,
      choice.chosenActionDisplay,
      choice.customNotes || null,
      choice.aiRecommendation,
      choice.chosenAt.toISOString(),
      choice.status,
      now
    ]);

    return this.findById(id) as DecisionChoice;
  }

  private mapToDecisionChoice(row: unknown): DecisionChoice {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;

    return {
      id: typeof r.id === 'string' ? r.id : '',
      decisionId: typeof r.decision_id === 'string' ? r.decision_id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      chosenAction: (typeof r.chosen_action === 'string' ? r.chosen_action : 'defer') as ChosenAction,
      chosenActionDisplay: typeof r.chosen_action_display === 'string' ? r.chosen_action_display : '',
      customNotes: typeof r.custom_notes === 'string' ? r.custom_notes : undefined,
      aiRecommendation: typeof r.ai_recommendation === 'string' ? r.ai_recommendation : '',
      chosenAt: new Date(typeof r.chosen_at === 'string' ? r.chosen_at : 0),
      status: (typeof r.status === 'string' ? r.status : 'final') as ChoiceStatus,
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
