/**
 * Calendar Event Repository
 */

import { BaseRepository } from './base.repository';
import { CalendarEvent } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class CalendarEventRepository extends BaseRepository {
  findById(id: string): CalendarEvent | null {
    const row = this.db.get('SELECT * FROM calendar_events WHERE id = ?', [id]);
    return row ? this.mapToCalendarEvent(row) : null;
  }

  findByUserId(userId: string, limit: number = 100): CalendarEvent[] {
    const rows = this.db.all(`
      SELECT * FROM calendar_events
      WHERE user_id = ?
      ORDER BY start_time DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToCalendarEvent.bind(this));
  }

  findUpcoming(userId: string, fromDate?: Date): CalendarEvent[] {
    const from = (fromDate || new Date()).toISOString();

    const rows = this.db.all(`
      SELECT * FROM calendar_events
      WHERE user_id = ? AND start_time >= ?
      ORDER BY start_time ASC
    `, [userId, from]);

    return rows.map(this.mapToCalendarEvent.bind(this));
  }

  findByExternalId(userId: string, externalId: string): CalendarEvent | null {
    const row = this.db.get(`
      SELECT * FROM calendar_events
      WHERE user_id = ? AND external_id = ?
    `, [userId, externalId]);

    return row ? this.mapToCalendarEvent(row) : null;
  }

  create(event: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO calendar_events (id, user_id, external_id, title, start_time, end_time, status, raw_data, synced_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      event.userId,
      event.externalId,
      event.title,
      event.startTime.toISOString(),
      event.endTime.toISOString(),
      event.status || null,
      event.rawData || null,
      event.syncedAt.toISOString(),
      now
    ]);

    return this.findById(id)!;
  }

  upsert(event: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent {
    const existing = this.findByExternalId(event.userId, event.externalId);

    if (existing) {
      this.db.run(`
        UPDATE calendar_events
        SET title = ?, start_time = ?, end_time = ?, status = ?, raw_data = ?, synced_at = ?
        WHERE id = ?
      `, [
        event.title,
        event.startTime.toISOString(),
        event.endTime.toISOString(),
        event.status || null,
        event.rawData || null,
        event.syncedAt.toISOString(),
        existing.id
      ]);

      return this.findById(existing.id)!;
    }

    return this.create(event);
  }

  private mapToCalendarEvent(row: any): CalendarEvent {
    return {
      id: row.id,
      userId: row.user_id,
      externalId: row.external_id,
      title: row.title,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      status: row.status || undefined,
      rawData: row.raw_data || undefined,
      syncedAt: new Date(row.synced_at),
      createdAt: new Date(row.created_at)
    };
  }
}
