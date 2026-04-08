/**
 * Reference Pairing — Extraction Method #6
 *
 * Takes the user's own uploaded references and pairs them against each other
 * on specific taste axes. "Between YOUR ref #3 and #7, which nav style do you prefer?"
 *
 * This is more meaningful than comparing AI-generated probes because
 * the user already loves both — they're choosing between things they picked.
 */

import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import { getSessionReferences, getSession } from '../db/queries';
import { parseJsonResponse } from '../utils/json';
import { TasteMap } from '../types';
import { DEFAULT_CLAUDE_MODEL } from '../constants';
import { buildRefPairingSystemPrompt, buildRefPairingDeltaSystemPrompt } from '../prompts/ref-pairing';

export interface RefPair {
  id: string;
  refA: { id: string; filename: string; path: string };
  refB: { id: string; filename: string; path: string };
  axis: string;         // which taste axis this pair tests
  axisLabel: string;    // human-readable axis name
  question: string;     // "Which navigation style do you prefer?"
  aspectLabel: string;  // "Navigation" or "Typography" or "Spacing"
}

export interface RefPairResponse {
  pairId: string;
  choice: 'a' | 'b' | 'both' | 'neither';
  reason?: string;
}

/**
 * Generate meaningful pairs from the user's references.
 *
 * Claude analyzes all refs and identifies WHERE they disagree on specific axes,
 * then creates comparison pairs that resolve those disagreements.
 */
export async function generateRefPairs(
  sessionId: string,
  maxPairs = 6
): Promise<RefPair[]> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const refs = getSessionReferences(sessionId);
  if (refs.length < 3) {
    return []; // Need at least 3 refs to make meaningful pairs
  }

  const tasteMap = session.tasteMap as TasteMap | null;

  // Build ref summaries for Claude
  const refSummaries = refs.map((r, i) => ({
    index: i,
    id: r.id,
    filename: r.filename,
    path: r.path,
    analysis: r.analysis ? JSON.stringify(r.analysis).slice(0, 500) : 'Not analyzed',
    annotations: r.annotations,
  }));

  const systemPrompt = buildRefPairingSystemPrompt();

  const userPrompt = `Here are ${refs.length} references the user uploaded:

${JSON.stringify(refSummaries, null, 2)}

${tasteMap ? `Current taste map (axes with LOW confidence need resolution):\n${JSON.stringify(
    Object.entries(tasteMap)
      .filter(([, v]) => v.confidence < 0.7)
      .map(([k, v]) => ({ axis: k, confidence: v.confidence, position: v.position })),
    null, 2
  )}` : 'No taste map yet.'}

Generate ${maxPairs} comparison pairs. Focus on LOW CONFIDENCE axes first.

{
  "pairs": [
    {
      "id": "pair_1",
      "refAIndex": 0,
      "refBIndex": 3,
      "axis": "structure_density",
      "axisLabel": "Layout Density",
      "question": "Which layout feels more comfortable to you?",
      "aspectLabel": "Layout"
    }
  ]
}`;

  const result = await trackApiCall(
    sessionId,
    'ref_pairing',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 2048,
      })
  );

  const parsed = parseJsonResponse<{
    pairs: {
      id: string;
      refAIndex: number;
      refBIndex: number;
      axis: string;
      axisLabel: string;
      question: string;
      aspectLabel: string;
    }[];
  }>(result.text);

  // Map indices to actual reference data
  return parsed.pairs
    .filter((p) => refs[p.refAIndex] && refs[p.refBIndex])
    .slice(0, maxPairs)
    .map((p) => ({
      id: p.id,
      refA: {
        id: refs[p.refAIndex].id,
        filename: refs[p.refAIndex].filename,
        path: refs[p.refAIndex].path,
      },
      refB: {
        id: refs[p.refBIndex].id,
        filename: refs[p.refBIndex].filename,
        path: refs[p.refBIndex].path,
      },
      axis: p.axis,
      axisLabel: p.axisLabel,
      question: p.question,
      aspectLabel: p.aspectLabel,
    }));
}

/**
 * Process ref pairing responses and extract taste deltas.
 */
export async function processRefPairResponses(
  sessionId: string,
  pairs: RefPair[],
  responses: RefPairResponse[]
): Promise<{
  axisUpdates: { axisId: string; direction: string; magnitude: number }[];
}> {
  const systemPrompt = buildRefPairingDeltaSystemPrompt();

  const pairData = responses.map((r) => {
    const pair = pairs.find((p) => p.id === r.pairId);
    return {
      axis: pair?.axis,
      axisLabel: pair?.axisLabel,
      question: pair?.question,
      choice: r.choice,
      reason: r.reason,
    };
  });

  const result = await trackApiCall(
    sessionId,
    'ref_pairing_delta',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt: `Comparison results:\n${JSON.stringify(pairData, null, 2)}\n\nRespond with:\n{"axisUpdates": [{"axisId": "...", "direction": "shift toward X", "magnitude": 0.1-0.4}]}`,
        maxTokens: 1024,
      })
  );

  return parseJsonResponse<{
    axisUpdates: { axisId: string; direction: string; magnitude: number }[];
  }>(result.text);
}
