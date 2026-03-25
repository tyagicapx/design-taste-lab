import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/preference-delta';
import {
  getSession,
  getRound,
  getRoundProbes,
  getProbeResponses,
  updateRoundDeltas,
  updateSessionTasteMap,
} from '../db/queries';
import { PreferenceDeltaResult, TasteMap } from '../types';

function parseJsonResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[0]);
}

export async function computePreferenceDeltas(
  sessionId: string,
  roundNumber: number
): Promise<PreferenceDeltaResult> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const round = getRound(sessionId, roundNumber);
  if (!round) throw new Error('Round not found');

  const probes = getRoundProbes(round.id);
  const responses = getProbeResponses(sessionId, round.id);

  // Build probe info with labels
  const probeInfo = probes.map((p) => ({
    label: p.label,
    description: p.description,
    axesTested: p.designTokens,
  }));

  // Build rating info matching probes to responses
  const ratingInfo = responses.map((r) => {
    const probe = probes.find((p) => p.id === r.probeId);
    return {
      probeLabel: probe?.label || 'Unknown',
      ratingType: r.ratingType,
      notes: r.notes || '',
      isEscapeHatch: r.isEscapeHatch || false,
      escapeFeedback: r.escapeFeedback || undefined,
    };
  });

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(probeInfo, ratingInfo, session.tasteMap);

  const result = await trackApiCall(
    sessionId,
    'preference_delta',
    'claude',
    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 4096,
      })
  );

  const deltaResult = parseJsonResponse(result.text) as PreferenceDeltaResult;

  // Store deltas on the round
  updateRoundDeltas(round.id, deltaResult);

  // Apply taste map updates
  if (deltaResult.tasteMapUpdates && session.tasteMap) {
    const updatedMap = { ...(session.tasteMap as TasteMap) };
    for (const update of deltaResult.tasteMapUpdates) {
      if (updatedMap[update.axisId]) {
        updatedMap[update.axisId] = {
          ...updatedMap[update.axisId],
          position: update.newPosition,
        };
      }
    }
    updateSessionTasteMap(sessionId, updatedMap);
  }

  return deltaResult;
}
