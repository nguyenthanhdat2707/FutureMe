/**
 * Database Schema Definitions
 * Based on docs/ARCHITECTURE.md Section 7
 */

export const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  display_name TEXT,
  tokens TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal context table
CREATE TABLE IF NOT EXISTS personal_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  attribute TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  observed_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_personal_context_user ON personal_context(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_context_source ON personal_context(source);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  category TEXT,
  context_snapshot TEXT NOT NULL,
  recommendation TEXT,
  user_choice TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_decisions_user ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_category_date ON decisions(category, created_at DESC);

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_observations_user_time ON observations(user_id, timestamp DESC);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT,
  raw_data TEXT,
  synced_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_external ON calendar_events(user_id, external_id);

-- Outcomes table
CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  outcome_status TEXT NOT NULL DEFAULT 'pending',
  would_repeat INTEGER,
  outcome_notes TEXT,
  recorded_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON outcomes(decision_id);

-- Decision Choices table (Phase 6)
CREATE TABLE IF NOT EXISTS decision_choices (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  chosen_action TEXT NOT NULL,
  chosen_action_display TEXT NOT NULL,
  custom_notes TEXT,
  ai_recommendation TEXT,
  chosen_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'final',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_decision_choices_decision ON decision_choices(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_choices_user ON decision_choices(user_id);

-- Check-in Schedule table (Phase 6)
CREATE TABLE IF NOT EXISTS check_in_schedule (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  scheduled_at TIMESTAMP NOT NULL,
  triggered_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_check_in_schedule_user_scheduled ON check_in_schedule(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_check_in_schedule_decision ON check_in_schedule(decision_id);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  decision_id TEXT REFERENCES decisions(id),
  issue_key TEXT NOT NULL,
  type TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  reason TEXT NOT NULL,
  prompt TEXT,
  suggested_actions TEXT,
  severity TEXT,
  dismissed_at TIMESTAMP,
  last_material_change_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_interventions_user_issue ON interventions(user_id, issue_key);
CREATE INDEX IF NOT EXISTS idx_interventions_user_status ON interventions(user_id, status);
`;

