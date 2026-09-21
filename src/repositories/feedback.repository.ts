/**
 * Feedback Repository
 */

import { BaseRepository } from './base.repository';
import { Feedback, FeedbackTargetType } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class FeedbackRepository extends BaseRepository {
  findById(id: string): Feedback | null {
    const row = this.db.get('SELECT * FROM feedback WHERE id = ?', [id]);
    return row ? this.mapToFeedback(row) : null;
  }

  findByTargetId(targetId: string): Feedback[] {
    const rows = this.db.all(`
      SELECT * FROM feedback
      WHERE target_id = ?
      ORDER BY created_at DESC
    `, [targetId]);

    return rows.map(this.mapToFeedback.bind(this));
  }

  findByUserId(userId: string, limit: number = 50): Feedback[] {
    const rows = this.db.all(`
      SELECT * FROM feedback
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToFeedback.bind(this));
  }

  create(feedback: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO feedback (id, user_id, target_type, target_id, feedback_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      feedback.userId,
      feedback.targetType,
      feedback.targetId,
      feedback.feedbackText,
      now
    ]);

    return this.findById(id)!;
  }

  private mapToFeedback(row: unknown): Feedback {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === 'string' ? r.id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      targetType: (typeof r.target_type === 'string' ? r.target_type : 'decision') as FeedbackTargetType,
      targetId: typeof r.target_id === 'string' ? r.target_id : '',
      feedbackText: typeof r.feedback_text === 'string' ? r.feedback_text : '',
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
