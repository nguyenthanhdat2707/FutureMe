/**
 * Calendar Event Repository
 */

import { ICalendarEventRepository, Awaitable } from './interfaces';
import { BaseRepository } from './base.repository';
import { CalendarEvent } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class SqliteCalendarEventRepository extends BaseRepository implements ICalendarEventRepository {
  findById(id: string): Awaitable<CalendarEvent | null> {
    const row = this.db.get('SELECT * FROM calendar_events WHERE id = ?', [id]);
    return row ? this.mapToCalendarEvent(row) : null;
  }

  findByUserId(userId: string, limit: number = 100): Awaitable<CalendarEvent[]> {
    const rows = this.db.all(`
      SELECT * FROM calendar_events
      WHERE user_id = ?
      ORDER BY start_time DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToCalendarEvent.bind(this));
  }

  findUpcoming(userId: string, fromDate?: Date): Awaitable<CalendarEvent[]> {
    const from = (fromDate || new Date()).toISOString();

    const rows = this.db.all(`
      SELECT * FROM calendar_events
      WHERE user_id = ? AND start_time >= ?
      ORDER BY start_time ASC
    `, [userId, from]);

    return rows.map(this.mapToCalendarEvent.bind(this));
  }

  findByRange(userId: string, from: Date, to: Date): Awaitable<CalendarEvent[]> {
    const rows = this.db.all(`
      SELECT * FROM calendar_events
      WHERE user_id = ? AND start_time >= ? AND start_time < ?
      ORDER BY start_time ASC
    `, [userId, from.toISOString(), to.toISOString()]);

    return rows.map(this.mapToCalendarEvent.bind(this));
  }

  findByExternalId(userId: string, externalId: string): Awaitable<CalendarEvent | null> {
    const row = this.db.get(`
      SELECT * FROM calendar_events
      WHERE user_id = ? AND external_id = ?
    `, [userId, externalId]);

    return row ? this.mapToCalendarEvent(row) : null;
  }

  create(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Awaitable<CalendarEvent> {
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

    return this.findById(id) as CalendarEvent;
  }

  upsert(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Awaitable<CalendarEvent> {
    const existing = this.findByExternalId(event.userId, event.externalId) as CalendarEvent | null;

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

      return this.findById(existing.id) as CalendarEvent;
    }

    return this.create(event);
  }

  private mapToCalendarEvent(row: unknown): CalendarEvent {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === 'string' ? r.id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      externalId: typeof r.external_id === 'string' ? r.external_id : '',
      title: typeof r.title === 'string' ? r.title : '',
      startTime: new Date(typeof r.start_time === 'string' ? r.start_time : 0),
      endTime: new Date(typeof r.end_time === 'string' ? r.end_time : 0),
      status: typeof r.status === 'string' ? r.status : undefined,
      rawData: typeof r.raw_data === 'string' ? r.raw_data : undefined,
      syncedAt: new Date(typeof r.synced_at === 'string' ? r.synced_at : 0),
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
