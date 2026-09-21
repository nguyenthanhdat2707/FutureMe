/**
 * Database Helper Utilities
 * Wrapper around sql.js for easier querying
 */

import { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import { getDatabase, saveDatabaseToDisk } from './connection';

export class DB {
  private db: SqlJsDatabase;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Execute a query that returns a single row
   */
  get(sql: string, params: unknown[] = []): unknown {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as SqlValue[]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    
    stmt.free();
    return null;
  }

  /**
   * Execute a query that returns multiple rows
   */
  all(sql: string, params: unknown[] = []): unknown[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as SqlValue[]);
    
    const results: unknown[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    return results;
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params: unknown[] = []): void {
    this.db.run(sql, params as SqlValue[]);
    saveDatabaseToDisk();
  }

  /**
   * Execute raw SQL (for table creation, etc.)
   */
  exec(sql: string): void {
    this.db.exec(sql);
    saveDatabaseToDisk();
  }
}
