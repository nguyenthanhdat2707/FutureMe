/**
 * Personal Context Repository
 */

import { BaseRepository } from './base.repository';
import { ContextAttribute, ObservationSource } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class PersonalContextRepository extends BaseRepository {
  findByUserId(userId: string, limit: number = 100): ContextAttribute[] {
    const rows = this.db.all(`
      SELECT * FROM personal_context
      WHERE user_id = ?
      ORDER BY observed_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToContextAttribute.bind(this));
  }

  findByUserIdAndAttribute(userId: string, attribute: string): ContextAttribute[] {
    const rows = this.db.all(`
      SELECT * FROM personal_context
      WHERE user_id = ? AND attribute = ?
      ORDER BY observed_at DESC
    `, [userId, attribute]);

    return rows.map(this.mapToContextAttribute.bind(this));
  }

  findById(id: string): ContextAttribute | null {
    const row = this.db.get('SELECT * FROM personal_context WHERE id = ?', [id]);
    return row ? this.mapToContextAttribute(row) : null;
  }

  create(attr: Omit<ContextAttribute, 'id' | 'createdAt'>): ContextAttribute {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO personal_context (id, user_id, attribute, value, source, confidence, observed_at, valid_until, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      attr.userId,
      attr.attribute,
      attr.value,
      attr.source,
      attr.confidence,
      attr.observedAt.toISOString(),
      attr.validUntil ? attr.validUntil.toISOString() : null,
      now
    ]);

    return this.findById(id)!;
  }

  update(id: string, updates: Partial<Omit<ContextAttribute, 'id' | 'userId' | 'createdAt'>>): ContextAttribute | null {
    const attr = this.findById(id);
    if (!attr) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.attribute !== undefined) {
      fields.push('attribute = ?');
      values.push(updates.attribute);
    }
    if (updates.value !== undefined) {
      fields.push('value = ?');
      values.push(updates.value);
    }
    if (updates.source !== undefined) {
      fields.push('source = ?');
      values.push(updates.source);
    }
    if (updates.confidence !== undefined) {
      fields.push('confidence = ?');
      values.push(updates.confidence);
    }
    if (updates.observedAt !== undefined) {
      fields.push('observed_at = ?');
      values.push(updates.observedAt.toISOString());
    }
    if (updates.validUntil !== undefined) {
      fields.push('valid_until = ?');
      values.push(updates.validUntil ? updates.validUntil.toISOString() : null);
    }

    values.push(id);

    if (fields.length > 0) {
      this.db.run(`UPDATE personal_context SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.findById(id);
  }

  private mapToContextAttribute(row: unknown): ContextAttribute {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === 'string' ? r.id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      attribute: typeof r.attribute === 'string' ? r.attribute : '',
      value: typeof r.value === 'string' ? r.value : '',
      source: (typeof r.source === 'string' ? r.source : 'USER_CONFIRMED') as ObservationSource,
      confidence: typeof r.confidence === 'number' ? r.confidence : 0,
      observedAt: new Date(typeof r.observed_at === 'string' ? r.observed_at : 0),
      validUntil: typeof r.valid_until === 'string' ? new Date(r.valid_until) : undefined,
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
