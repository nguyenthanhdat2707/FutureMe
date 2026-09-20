/**
 * User Repository
 */

import { BaseRepository } from './base.repository';
import { User } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository extends BaseRepository {
  findById(id: string): User | null {
    const row = this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.mapToUser(row) : null;
  }

  findByEmail(email: string): User | null {
    const row = this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    return row ? this.mapToUser(row) : null;
  }

  findByGoogleId(googleId: string): User | null {
    const row = this.db.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return row ? this.mapToUser(row) : null;
  }

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      'INSERT INTO users (id, email, google_id, display_name, tokens, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, user.email, user.googleId || null, user.displayName || null, user.tokens || null, now, now]
    );

    return this.findById(id)!;
  }

  update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): User | null {
    const user = this.findById(id);
    if (!user) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.googleId !== undefined) {
      fields.push('google_id = ?');
      values.push(updates.googleId);
    }
    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.displayName);
    }
    if (updates.tokens !== undefined) {
      fields.push('tokens = ?');
      values.push(updates.tokens);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  private mapToUser(row: any): User {
    return {
      id: row.id as string,
      email: row.email as string,
      googleId: row.google_id ? (row.google_id as string) : undefined,
      displayName: row.display_name ? (row.display_name as string) : undefined,
      tokens: row.tokens ? (row.tokens as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }
}
