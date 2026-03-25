import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'taste-calibration.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ─── Auto-create tables if they don't exist (handles fresh deploys) ───
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'uploading',
    onboarding_data TEXT,
    taste_map TEXT,
    web_taste_map TEXT,
    app_taste_map TEXT,
    contradictions TEXT,
    confidence_scores TEXT,
    critic_output TEXT,
    clusters TEXT,
    convergence_decision TEXT,
    final_markdown TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS "references" (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    analysis TEXT,
    annotations TEXT,
    is_outlier INTEGER DEFAULT 0,
    source TEXT DEFAULT 'screenshot',
    source_url TEXT,
    surface_type TEXT DEFAULT 'unknown',
    weight REAL DEFAULT 1.0,
    role TEXT DEFAULT 'unclassified',
    cluster_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    questionnaire TEXT,
    answers TEXT,
    preference_deltas TEXT,
    refinement_notes TEXT,
    depth TEXT DEFAULT 'standard',
    question_count INTEGER,
    probe_count INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS probes (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    probe_type TEXT NOT NULL,
    generation_prompt TEXT,
    design_tokens TEXT,
    surface_context TEXT DEFAULT 'core',
    source_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS probe_responses (
    id TEXT PRIMARY KEY,
    probe_id TEXT NOT NULL REFERENCES probes(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    rating_type TEXT NOT NULL,
    notes TEXT,
    is_escape_hatch INTEGER DEFAULT 0,
    escape_feedback TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS comparison_responses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    probe_id_left TEXT NOT NULL,
    probe_id_right TEXT NOT NULL,
    choice TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS api_calls (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_estimate REAL,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

export const db = drizzle(sqlite, { schema });
export { schema };
