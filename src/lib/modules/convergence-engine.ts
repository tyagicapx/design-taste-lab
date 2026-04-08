import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/convergence';
import {
  getSession,
  getRound,
  updateSessionConvergence,
} from '../db/queries';
import type { ConvergenceDecision } from '../types';
import { parseJsonResponse } from '../utils/json';
import { MAX_ROUNDS, DEFAULT_CLAUDE_MODEL } from '../constants';


/**
 * Evaluates whether calibration should continue after a round.
 * Returns a ConvergenceDecision that drives adaptive behavior.
 *
 * Called after preference deltas are computed for a round.
 */
export async function evaluateConvergence(
  sessionId: string,
  roundNumber: number
): Promise<ConvergenceDecision> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Max rounds reached — force stop
  if (roundNumber >= MAX_ROUNDS) {
    const decision: ConvergenceDecision = {
      shouldContinue: false,
      reason: 'Maximum rounds (3) reached.',
      overallConfidence: 0.8,
      lockedAxes: [],
      uncertainAxes: [],
      nextRoundDepth: 'light',
      recommendedQuestionCount: 0,
      recommendedProbeCount: 0,
    };
    updateSessionConvergence(sessionId, decision);
    return decision;
  }

  // Gather all deltas from completed rounds
  const allDeltas: unknown[] = [];
  for (let r = 1; r <= roundNumber; r++) {
    const round = getRound(sessionId, r);
    if (round?.preferenceDeltas) {
      allDeltas.push(round.preferenceDeltas);
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    roundNumber,
    session.tasteMap,
    allDeltas,
    session.criticOutput,
    session.clusters,
    session.onboardingData
  );

  const result = await trackApiCall(
    sessionId,
    'convergence_engine',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 1024,
      })
  );

  const parsed = parseJsonResponse(result.text) as ConvergenceDecision;

  updateSessionConvergence(sessionId, parsed);
  return parsed;
}
