/**
 * Check-in Schedule Repository (Phase 6)
 */

import { ICheckInScheduleRepository, Awaitable } from './interfaces';
import { BaseRepository } from './base.repository';
import { CheckInSchedule, CheckInStatus } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class SqliteCheckInScheduleRepository extends BaseRepository implements ICheckInScheduleRepository {
  findById(id: string): Awaitable<CheckInSchedule | null> {
    const row = this.db.get('SELECT * FROM check_in_schedule WHERE id = ?', [id]);
    return row ? this.mapToCheckInSchedule(row) : null;
  }

  findByDecisionId(decisionId: string): Awaitable<CheckInSchedule | null> {
    const row = this.db.get(`
      SELECT * FROM check_in_schedule
      WHERE decision_id = ?
      ORDER BY scheduled_at DESC
      LIMIT 1
    `, [decisionId]);

    return row ? this.mapToCheckInSchedule(row) : null;
  }

  findPendingByUserId(userId: string): Awaitable<CheckInSchedule[]> {
    const rows = this.db.all(`
      SELECT * FROM check_in_schedule
      WHERE user_id = ? AND status = 'pending'
      ORDER BY scheduled_at ASC
    `, [userId]);

    return rows.map(this.mapToCheckInSchedule.bind(this));
  }

  findDueCheckIns(userId: string, currentTime: Date): Awaitable<CheckInSchedule[]> {
    const rows = this.db.all(`
      SELECT * FROM check_in_schedule
      WHERE user_id = ? 
        AND status = 'pending'
        AND scheduled_at <= ?
      ORDER BY scheduled_at ASC
    `, [userId, currentTime.toISOString()]);

    return rows.map(this.mapToCheckInSchedule.bind(this));
  }

  create(schedule: Omit<CheckInSchedule, 'id' | 'createdAt'>): Awaitable<CheckInSchedule> {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO check_in_schedule (
        id, decision_id, user_id, scheduled_at,
        triggered_at, dismissed_at, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      schedule.decisionId,
      schedule.userId,
      schedule.scheduledAt.toISOString(),
      schedule.triggeredAt ? schedule.triggeredAt.toISOString() : null,
      schedule.dismissedAt ? schedule.dismissedAt.toISOString() : null,
      schedule.status,
      now
    ]);

    return this.findById(id) as CheckInSchedule;
  }

  updateStatus(id: string, status: CheckInStatus, triggeredAt?: Date): Awaitable<CheckInSchedule | null> {
    const schedule = this.findById(id);
    if (!schedule) return null;

    const updates: string[] = ['status = ?'];
    const values: unknown[] = [status];

    if (triggeredAt) {
      updates.push('triggered_at = ?');
      values.push(triggeredAt.toISOString());
    }

    values.push(id);

    this.db.run(
      `UPDATE check_in_schedule SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  dismiss(id: string, dismissedAt?: Date): Awaitable<CheckInSchedule | null> {
    const schedule = this.findById(id);
    if (!schedule) return null;

    const now = dismissedAt || new Date();
    this.db.run(
      'UPDATE check_in_schedule SET status = ?, dismissed_at = ? WHERE id = ?',
      ['dismissed', now.toISOString(), id]
    );

    return this.findById(id);
  }

  private mapToCheckInSchedule(row: unknown): CheckInSchedule {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;

    return {
      id: typeof r.id === 'string' ? r.id : '',
      decisionId: typeof r.decision_id === 'string' ? r.decision_id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      scheduledAt: new Date(typeof r.scheduled_at === 'string' ? r.scheduled_at : 0),
      triggeredAt: typeof r.triggered_at === 'string' ? new Date(r.triggered_at) : undefined,
      dismissedAt: typeof r.dismissed_at === 'string' ? new Date(r.dismissed_at) : undefined,
      status: (typeof r.status === 'string' ? r.status : 'pending') as CheckInStatus,
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
