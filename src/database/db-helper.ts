/**
 * Database Helper Utilities
 * Wrapper around sql.js for easier querying
 */

import { Database as SqlJsDatabase } from 'sql.js';
import { getDatabase, saveDatabaseToDisk } from './connection';

export class DB {
  private db: SqlJsDatabase;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Execute a query that returns a single row
   */
  get(sql: string, params: any[] = []): any | null {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    
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
  all(sql: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    return results;
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params: any[] = []): void {
    this.db.run(sql, params);
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
