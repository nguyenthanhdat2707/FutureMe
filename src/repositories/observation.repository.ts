/**
 * Observation Repository
 */

import { BaseRepository } from './base.repository';
import { Observation, ObservationType, ObservationSource } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';
import { safeJsonParse } from '../utils/json';

export class ObservationRepository extends BaseRepository {
  findById(id: string): Observation | null {
    const row = this.db.get('SELECT * FROM observations WHERE id = ?', [id]);
    return row ? this.mapToObservation(row) : null;
  }

  findByUserId(userId: string, limit: number = 100): Observation[] {
    const rows = this.db.all(`
      SELECT * FROM observations
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToObservation.bind(this));
  }

  findRecent(userId: string, hoursBack: number = 24): Observation[] {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const rows = this.db.all(`
      SELECT * FROM observations
      WHERE user_id = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `, [userId, cutoff]);

    return rows.map(this.mapToObservation.bind(this));
  }

  create(observation: Omit<Observation, 'id' | 'createdAt'>): Observation {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO observations (id, user_id, type, data, source, confidence, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      observation.userId,
      observation.type,
      JSON.stringify(observation.data),
      observation.source,
      observation.confidence,
      observation.timestamp.toISOString(),
      now
    ]);

    return this.findById(id)!;
  }

  private mapToObservation(row: unknown): Observation {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;

    const dataStr = typeof r.data === 'string' ? r.data : '{}';

    return {
      id: typeof r.id === 'string' ? r.id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      type: (typeof r.type === 'string' ? r.type : 'USER_REPORTED') as ObservationType,
      data: safeJsonParse(dataStr) as Record<string, unknown>,
      source: (typeof r.source === 'string' ? r.source : 'USER_CONFIRMED') as ObservationSource,
      confidence: typeof r.confidence === 'number' ? r.confidence : 0,
      timestamp: new Date(typeof r.timestamp === 'string' ? r.timestamp : 0),
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
