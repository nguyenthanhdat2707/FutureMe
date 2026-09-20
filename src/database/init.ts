/**
 * Database Initialization Script
 */

import { initDatabase } from './connection';

console.log('[Database Init] Starting database initialization...');

async function init() {
  try {
    const db = await initDatabase();
    console.log('[Database Init] Database initialized successfully');
    
    // Test query
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    
    console.log(`[Database Init] Current user count: ${result.count}`);
    
    db.close();
    console.log('[Database Init] Complete');
  } catch (error) {
    console.error('[Database Init] Failed:', error);
    process.exit(1);
  }
}

init();
