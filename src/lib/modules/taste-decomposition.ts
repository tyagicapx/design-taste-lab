import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/taste-decomposition';
import {
  updateSessionTasteMap,
  updateSessionWebTasteMap,
  updateSessionAppTasteMap,
  getSessionReferences,
} from '../db/queries';
import { TasteMap } from '../types';
import { parseJsonResponse } from '../utils/json';
import { DEFAULT_CLAUDE_MODEL } from '../constants';


export async function decomposeTaste(sessionId: string): Promise<TasteMap> {
  const refs = getSessionReferences(sessionId);

  const analyses = refs
    .filter((r) => r.analysis)
    .map((r, i) => ({
      index: i + 1,
      id: r.id,
      analysis: r.analysis,
      annotations: r.annotations,
      surfaceType: (r.surfaceType as string) || 'unknown',
    }));

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(analyses);

  const result = await trackApiCall(
    sessionId,
    'taste_decomposition',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 4096,
      })
  );

  const parsed = parseJsonResponse(result.text) as {
    axes: TasteMap;
    webOverrides?: Record<string, { axisId: string; position: number; confidence: number; reason: string }>;
    appOverrides?: Record<string, { axisId: string; position: number; confidence: number; reason: string }>;
    highDivergenceAxes: string[];
    surfaceDivergences?: string[];
  };

  // Store core taste map (same as V1 — backward compatible)
  const coreTasteMap = parsed.axes;
  updateSessionTasteMap(sessionId, coreTasteMap);

  // V2: Store surface-specific override maps
  if (parsed.webOverrides && Object.keys(parsed.webOverrides).length > 0) {
    // Build a partial TasteMap from overrides — merge with core positions
    const webMap: TasteMap = {};
    for (const [axisId, override] of Object.entries(parsed.webOverrides)) {
      const coreAxis = coreTasteMap[axisId];
      if (coreAxis) {
        webMap[axisId] = {
          ...coreAxis,
          position: override.position,
          confidence: override.confidence,
          evidence: [`Web override: ${override.reason}`],
        };
      }
    }
    updateSessionWebTasteMap(sessionId, webMap);
  }

  if (parsed.appOverrides && Object.keys(parsed.appOverrides).length > 0) {
    const appMap: TasteMap = {};
    for (const [axisId, override] of Object.entries(parsed.appOverrides)) {
      const coreAxis = coreTasteMap[axisId];
      if (coreAxis) {
        appMap[axisId] = {
          ...coreAxis,
          position: override.position,
          confidence: override.confidence,
          evidence: [`App override: ${override.reason}`],
        };
      }
    }
    updateSessionAppTasteMap(sessionId, appMap);
  }

  return coreTasteMap;
}
