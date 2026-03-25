/**
 * V2 Migration Script
 * Adds new columns for onboarding, clustering, surface separation, convergence, and comparisons.
 * Safe to run multiple times — uses IF NOT EXISTS / catches already-exists errors.
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'taste-calibration.db');
const sqlite = new Database(DB_PATH);

function addColumn(table: string, column: string, type: string, defaultVal?: string) {
  const def = defaultVal !== undefined ? ` DEFAULT ${defaultVal}` : '';
  try {
    sqlite.exec(`ALTER TABLE "${table}" ADD COLUMN ${column} ${type}${def}`);
    console.log(`  ✓ Added ${table}.${column}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('duplicate column')) {
      console.log(`  · ${table}.${column} already exists`);
    } else {
      throw e;
    }
  }
}

console.log('🔧 Running V2 migration...\n');

// Sessions table
console.log('Sessions:');
addColumn('sessions', 'onboarding_data', 'TEXT');
addColumn('sessions', 'web_taste_map', 'TEXT');
addColumn('sessions', 'app_taste_map', 'TEXT');
addColumn('sessions', 'clusters', 'TEXT');
addColumn('sessions', 'convergence_decision', 'TEXT');

// References table
console.log('\nReferences:');
addColumn('references', 'source', 'TEXT', "'screenshot'");
addColumn('references', 'source_url', 'TEXT');
addColumn('references', 'surface_type', 'TEXT', "'unknown'");
addColumn('references', 'weight', 'REAL', '1.0');
addColumn('references', 'role', 'TEXT', "'unclassified'");
addColumn('references', 'cluster_id', 'TEXT');

// Rounds table
console.log('\nRounds:');
addColumn('rounds', 'depth', 'TEXT', "'standard'");
addColumn('rounds', 'question_count', 'INTEGER');
addColumn('rounds', 'probe_count', 'INTEGER');

// Probes table
console.log('\nProbes:');
addColumn('probes', 'surface_context', 'TEXT', "'core'");
addColumn('probes', 'source_url', 'TEXT');

// New table: comparison_responses
console.log('\nComparison Responses:');
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS comparison_responses (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
      probe_id_left TEXT NOT NULL,
      probe_id_right TEXT NOT NULL,
      choice TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log('  ✓ Created comparison_responses table');
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : '';
  if (msg.includes('already exists')) {
    console.log('  · comparison_responses table already exists');
  } else {
    throw e;
  }
}

console.log('\n✅ V2 migration complete!');
sqlite.close();
