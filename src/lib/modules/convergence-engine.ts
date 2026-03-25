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

function parseJsonResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[0]);
}

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

  // Round 3 is always the last — force stop
  if (roundNumber >= 3) {
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
    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 1024,
      })
  );

  const parsed = parseJsonResponse(result.text) as ConvergenceDecision;

  // Ensure min 1 round always happens (never skip Round 1)
  if (roundNumber < 1) {
    parsed.shouldContinue = true;
  }

  updateSessionConvergence(sessionId, parsed);
  return parsed;
}
