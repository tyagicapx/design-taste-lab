import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  name: text('name'),
  status: text('status').notNull().default('uploading'),

  // V2: Onboarding
  onboardingData: text('onboarding_data', { mode: 'json' }),

  // Taste maps — V2: split into core + surface overrides
  tasteMap: text('taste_map', { mode: 'json' }), // V1 compat: still used as coreTasteMap
  webTasteMap: text('web_taste_map', { mode: 'json' }), // V2: landing/marketing overrides
  appTasteMap: text('app_taste_map', { mode: 'json' }), // V2: product/dashboard overrides

  // Analysis outputs
  contradictions: text('contradictions', { mode: 'json' }),
  confidenceScores: text('confidence_scores', { mode: 'json' }),
  criticOutput: text('critic_output', { mode: 'json' }),

  // V2: Clustering
  clusters: text('clusters', { mode: 'json' }),

  // V2: Convergence
  convergenceDecision: text('convergence_decision', { mode: 'json' }),

  // Output
  finalMarkdown: text('final_markdown'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const references = sqliteTable('references', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  analysis: text('analysis', { mode: 'json' }),
  annotations: text('annotations', { mode: 'json' }),
  isOutlier: integer('is_outlier', { mode: 'boolean' }).default(false),

  // V2: Source tracking
  source: text('source').default('screenshot'), // 'screenshot' | 'url' | 'pinterest'
  sourceUrl: text('source_url'), // original URL for url/pinterest sources

  // V2: Classification & weighting
  surfaceType: text('surface_type').default('unknown'), // 'marketing_landing' | 'product_web_app' | etc.
  weight: real('weight').default(1.0), // 0-1 importance weight
  role: text('role').default('unclassified'), // 'anchor' | 'peripheral' | 'outlier' | 'unclassified'
  clusterId: text('cluster_id'), // which cluster this belongs to

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const rounds = sqliteTable('rounds', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  roundNumber: integer('round_number').notNull(),
  questionnaire: text('questionnaire', { mode: 'json' }),
  answers: text('answers', { mode: 'json' }),
  preferenceDeltas: text('preference_deltas', { mode: 'json' }),
  refinementNotes: text('refinement_notes', { mode: 'json' }),

  // V2: Round metadata
  depth: text('depth').default('standard'), // 'light' | 'standard' | 'deep'
  questionCount: integer('question_count'),
  probeCount: integer('probe_count'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const probes = sqliteTable('probes', {
  id: text('id').primaryKey(),
  roundId: text('round_id')
    .notNull()
    .references(() => rounds.id, { onDelete: 'cascade' }),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // 'ai_image' | 'html_css' | 'screenshot'
  content: text('content').notNull(),
  probeType: text('probe_type').notNull(), // 'landing_hero' | 'dashboard' | etc.
  generationPrompt: text('generation_prompt'),
  designTokens: text('design_tokens', { mode: 'json' }),

  // V2: Surface context
  surfaceContext: text('surface_context').default('core'), // 'core' | 'web' | 'app'
  sourceUrl: text('source_url'), // for screenshot-type probes from real sites

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const probeResponses = sqliteTable('probe_responses', {
  id: text('id').primaryKey(),
  probeId: text('probe_id')
    .notNull()
    .references(() => probes.id, { onDelete: 'cascade' }),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  ratingType: text('rating_type').notNull(),
  notes: text('notes'),
  isEscapeHatch: integer('is_escape_hatch', { mode: 'boolean' }).default(false),
  escapeFeedback: text('escape_feedback'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// V2: Side-by-side comparison responses
export const comparisonResponses = sqliteTable('comparison_responses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  roundId: text('round_id')
    .notNull()
    .references(() => rounds.id, { onDelete: 'cascade' }),
  probeIdLeft: text('probe_id_left').notNull(),
  probeIdRight: text('probe_id_right').notNull(),
  choice: text('choice').notNull(), // 'left' | 'right' | 'cant_choose'
  reason: text('reason'), // optional reason for can't choose
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const apiCalls = sqliteTable('api_calls', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  module: text('module').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costEstimate: real('cost_estimate'),
  durationMs: integer('duration_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
