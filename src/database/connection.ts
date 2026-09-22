/**
 * Database Connection Management
 * Uses sql.js (pure JavaScript SQLite)
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { createTablesSQL } from './schema';
import path from 'path';
import fs from 'fs';

let db: SqlJsDatabase | null = null;
let dbPath: string | null = null;

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(filePath?: string): Promise<SqlJsDatabase> {
  const databasePath = filePath || process.env.DATABASE_PATH || './data/future-me.db';
  dbPath = databasePath;
  
  // Ensure directory exists
  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Initialize sql.js
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(databasePath)) {
    const buffer = fs.readFileSync(databasePath);
    db = new SQL.Database(buffer);
    console.log(`[Database] Loaded existing database from ${databasePath}`);
  } else {
    db = new SQL.Database();
    console.log(`[Database] Created new database at ${databasePath}`);
  }
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');
  
  // Create tables
  db.exec(createTablesSQL);
  
  // Save to disk
  saveDatabaseToDisk();
  
  console.log(`[Database] Initialized at ${databasePath}`);
  
  return db;
}

export function saveDatabaseToDisk(): void {
  if (!db || !dbPath || dbPath === ':memory:') return;
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function closeDatabase(): void {
  if (db) {
    saveDatabaseToDisk();
    db.close();
    db = null;
    console.log('[Database] Connection closed');
  }
}
