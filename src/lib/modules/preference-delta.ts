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
import { parseJsonResponse } from '../utils/json';
import { DEFAULT_CLAUDE_MODEL } from '../constants';


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
    DEFAULT_CLAUDE_MODEL,
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
  if (deltaResult.tasteMapUpdates) {
    const currentMap = (session.tasteMap as TasteMap) || {};
    const updatedMap = { ...currentMap };
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
