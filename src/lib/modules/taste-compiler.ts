import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/taste-compiler';
import { MAX_ROUNDS, DEFAULT_CLAUDE_MODEL } from '../constants';
import {
  getSession,
  getSessionReferences,
  getRound,
  getProbeResponses,
  getComparisonResponses,
  updateSessionMarkdown,
  updateSessionStatus,
} from '../db/queries';

export async function compileTasteSpec(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const refs = getSessionReferences(sessionId);

  // Gather all round data
  const allAnswers: unknown[] = [];
  const allDeltas: unknown[] = [];
  const allProbeFeedback: unknown[] = [];
  const allComparisonResults: unknown[] = [];

  for (let r = 1; r <= MAX_ROUNDS; r++) {
    const round = getRound(sessionId, r);
    if (round) {
      if (round.answers) allAnswers.push(round.answers);
      if (round.preferenceDeltas) allDeltas.push(round.preferenceDeltas);

      const responses = getProbeResponses(sessionId, round.id);
      allProbeFeedback.push({
        round: r,
        responses: responses.map((resp) => ({
          ratingType: resp.ratingType,
          notes: resp.notes,
          isEscapeHatch: resp.isEscapeHatch,
          escapeFeedback: resp.escapeFeedback,
        })),
      });

      // V2: Comparison responses
      const comparisons = getComparisonResponses(sessionId, round.id);
      if (comparisons.length > 0) {
        allComparisonResults.push({
          round: r,
          comparisons: comparisons.map((c) => ({
            choice: c.choice,
            reason: c.reason,
          })),
        });
      }
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    tasteMap: session.tasteMap,
    webTasteMap: session.webTasteMap,
    appTasteMap: session.appTasteMap,
    allAnswers,
    allDeltas,
    criticOutput: session.criticOutput,
    probeFeedback: allProbeFeedback,
    comparisonResults: allComparisonResults,
    referenceAnnotations: refs
      .map((r) => r.annotations)
      .filter(Boolean),
    onboardingData: session.onboardingData,
    clusters: session.clusters,
    convergenceDecision: session.convergenceDecision,
  });

  const result = await trackApiCall(
    sessionId,
    'taste_compiler',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 16384,
      })
  );

  const markdown = result.text;
  updateSessionMarkdown(sessionId, markdown);

  // Only transition status if not already complete (re-compile case)
  if (session.status !== 'complete') {
    updateSessionStatus(sessionId, 'complete');
  }

  return markdown;
}
