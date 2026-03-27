import { eq, and, desc, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from './index';
import {
  sessions,
  references,
  rounds,
  probes,
  probeResponses,
  comparisonResponses,
} from './schema';
import {
  SessionStatus,
  TasteMap,
  CriticOutput,
  OnboardingData,
  ClusteringResult,
  ConvergenceDecision,
} from '../types';
import { canTransition } from '../state-machine';
import { generateFunName } from '../fun-names';

// ============================================================
// Sessions
// ============================================================

export function createSession(): { id: string; name: string } {
  const id = nanoid();
  const { name, emoji } = generateFunName();
  const fullName = `${emoji} ${name}`;
  db.insert(sessions).values({ id, name: fullName, status: 'onboarding' }).run();
  return { id, name: fullName };
}

export function updateSessionName(id: string, name: string) {
  db.update(sessions)
    .set({ name, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

export function getSession(id: string) {
  const rows = db.select().from(sessions).where(eq(sessions.id, id)).all();
  return rows[0] ?? null;
}

export function listSessions() {
  return db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.createdAt))
    .all();
}

/**
 * CRIT-4 FIX: Atomically acquire processing lock.
 * Returns true if lock acquired, false if already processing.
 */
export function acquireProcessingLock(id: string): boolean {
  const result = db.update(sessions)
    .set({ isProcessing: true, updatedAt: new Date() })
    .where(and(eq(sessions.id, id), eq(sessions.isProcessing, false)))
    .run();
  return result.changes > 0;
}

/**
 * CRIT-4 FIX: Release processing lock.
 */
export function releaseProcessingLock(id: string): void {
  db.update(sessions)
    .set({ isProcessing: false, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

export function updateSessionStatus(id: string, newStatus: SessionStatus) {
  const session = getSession(id);
  if (!session) throw new Error(`Session ${id} not found`);
  if (!canTransition(session.status as SessionStatus, newStatus)) {
    throw new Error(
      `Invalid transition: ${session.status} → ${newStatus}`
    );
  }
  db.update(sessions)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

export function updateSessionTasteMap(id: string, tasteMap: TasteMap) {
  db.update(sessions)
    .set({ tasteMap: tasteMap as unknown as null, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

export function updateSessionCritic(id: string, criticOutput: CriticOutput) {
  db.update(sessions)
    .set({
      criticOutput: criticOutput as unknown as null,
      contradictions: criticOutput.contradictions as unknown as null,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id))
    .run();
}

export function updateSessionMarkdown(id: string, markdown: string) {
  db.update(sessions)
    .set({ finalMarkdown: markdown, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

// V2: Onboarding
export function updateSessionOnboarding(id: string, data: OnboardingData) {
  db.update(sessions)
    .set({ onboardingData: data as unknown as null, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

// V2: Clustering
export function updateSessionClusters(id: string, clusters: ClusteringResult) {
  db.update(sessions)
    .set({ clusters: clusters as unknown as null, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

// V2: Surface taste maps
export function updateSessionWebTasteMap(id: string, webMap: TasteMap) {
  db.update(sessions)
    .set({ webTasteMap: webMap as unknown as null, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

export function updateSessionAppTasteMap(id: string, appMap: TasteMap) {
  db.update(sessions)
    .set({ appTasteMap: appMap as unknown as null, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

// V2: Convergence
export function updateSessionConvergence(id: string, decision: ConvergenceDecision) {
  db.update(sessions)
    .set({ convergenceDecision: decision as unknown as null, updatedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

// ============================================================
// References
// ============================================================

export function createReference(
  sessionId: string,
  filename: string,
  filePath: string,
  source: string = 'screenshot',
  sourceUrl?: string
): string {
  const id = nanoid();
  db.insert(references)
    .values({ id, sessionId, filename, path: filePath, source, sourceUrl })
    .run();
  return id;
}

export function getSessionReferences(sessionId: string) {
  return db
    .select()
    .from(references)
    .where(eq(references.sessionId, sessionId))
    .all();
}

export function updateReferenceAnnotations(
  id: string,
  annotations: { tags: string[]; note: string }
) {
  db.update(references)
    .set({ annotations: annotations as unknown as null })
    .where(eq(references.id, id))
    .run();
}

export function updateReferenceAnalysis(
  id: string,
  analysis: unknown,
  isOutlier: boolean
) {
  db.update(references)
    .set({ analysis: analysis as null, isOutlier })
    .where(eq(references.id, id))
    .run();
}

// V2: Update reference classification
export function updateReferenceClassification(
  id: string,
  data: {
    surfaceType?: string;
    weight?: number;
    role?: string;
    clusterId?: string;
  }
) {
  db.update(references)
    .set(data)
    .where(eq(references.id, id))
    .run();
}

// ============================================================
// Rounds
// ============================================================

export function createRound(
  sessionId: string,
  roundNumber: number,
  depth: string = 'standard'
): string {
  const id = nanoid();
  db.insert(rounds).values({ id, sessionId, roundNumber, depth }).run();
  return id;
}

export function getRound(sessionId: string, roundNumber: number) {
  const rows = db
    .select()
    .from(rounds)
    .where(and(eq(rounds.sessionId, sessionId), eq(rounds.roundNumber, roundNumber)))
    .all();
  return rows[0] ?? null;
}

export function updateRoundQuestionnaire(
  roundId: string,
  questionnaire: unknown
) {
  db.update(rounds)
    .set({ questionnaire: questionnaire as null })
    .where(eq(rounds.id, roundId))
    .run();
}

export function updateRoundAnswers(roundId: string, answers: unknown) {
  db.update(rounds)
    .set({ answers: answers as null })
    .where(eq(rounds.id, roundId))
    .run();
}

export function updateRoundDeltas(roundId: string, deltas: unknown) {
  db.update(rounds)
    .set({ preferenceDeltas: deltas as null })
    .where(eq(rounds.id, roundId))
    .run();
}

// ============================================================
// Probes
// ============================================================

export function createProbe(data: {
  roundId: string;
  sessionId: string;
  label: string;
  description: string;
  type: string;
  content: string;
  probeType: string;
  generationPrompt?: string;
  designTokens?: unknown;
  surfaceContext?: string;
  sourceUrl?: string;
}): string {
  const id = nanoid();
  db.insert(probes)
    .values({
      id,
      ...data,
      designTokens: data.designTokens as null,
    })
    .run();
  return id;
}

export function getRoundProbes(roundId: string) {
  return db.select().from(probes).where(eq(probes.roundId, roundId)).all();
}

export function updateProbeContent(probeId: string, content: string) {
  db.update(probes)
    .set({ content })
    .where(eq(probes.id, probeId))
    .run();
}

// ============================================================
// Probe Responses
// ============================================================

export function createProbeResponse(data: {
  probeId: string;
  sessionId: string;
  ratingType: string;
  notes?: string;
  isEscapeHatch?: boolean;
  escapeFeedback?: string;
}): string {
  const id = nanoid();
  db.insert(probeResponses).values({ id, ...data }).run();
  return id;
}

export function getProbeResponses(sessionId: string, roundId?: string) {
  if (roundId) {
    const roundProbeRows = getRoundProbes(roundId);
    const probeIds = roundProbeRows.map((p) => p.id);
    if (probeIds.length === 0) return [];
    return db
      .select()
      .from(probeResponses)
      .where(
        and(
          eq(probeResponses.sessionId, sessionId),
          inArray(probeResponses.probeId, probeIds)
        )
      )
      .all();
  }
  return db
    .select()
    .from(probeResponses)
    .where(eq(probeResponses.sessionId, sessionId))
    .all();
}

// ============================================================
// V2: Comparison Responses
// ============================================================

export function createComparisonResponse(data: {
  sessionId: string;
  roundId: string;
  probeIdLeft: string;
  probeIdRight: string;
  choice: string;
  reason?: string;
}): string {
  const id = nanoid();
  db.insert(comparisonResponses).values({ id, ...data }).run();
  return id;
}

export function getComparisonResponses(sessionId: string, roundId: string) {
  return db
    .select()
    .from(comparisonResponses)
    .where(
      and(
        eq(comparisonResponses.sessionId, sessionId),
        eq(comparisonResponses.roundId, roundId)
      )
    )
    .all();
}
