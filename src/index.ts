/**
 * Main Entry Point
 * Initializes database and starts Express server
 */

import dotenv from 'dotenv';
import { createApp } from './app';
import { initDatabase, closeDatabase } from './database/connection';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Initialize database
    console.log('[Server] Initializing database...');
    await initDatabase();

    // Create Express app
    const app = createApp();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`[Server] Future Me Backend running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[Server] Shutting down gracefully...');
      closeDatabase();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n[Server] Shutting down gracefully...');
      closeDatabase();
      process.exit(0);
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

void start();
