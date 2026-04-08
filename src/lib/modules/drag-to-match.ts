/**
 * "Drag to Match" — Extraction Method #3
 *
 * Instead of "pick A or B", show a slider that morphs between two design
 * directions. The user drags until it "feels right".
 *
 * This gives us a CONTINUOUS value (not binary) for each axis.
 * Way more precise than multiple choice.
 *
 * Implementation: Generate two HTML endpoint designs (0% and 100% on an axis),
 * plus 3-4 intermediate steps. The UI shows a slider that swaps between them.
 * The user's final position maps directly to the axis value.
 */

import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import { getSession } from '../db/queries';
import { parseJsonResponse } from '../utils/json';
import { TasteMap } from '../types';
import { DEFAULT_CLAUDE_MODEL } from '../constants';
import { buildDragToMatchSystemPrompt } from '../prompts/drag-to-match';

export interface DragSlider {
  id: string;
  axis: string;           // Which taste axis
  axisLabel: string;      // Human-readable name
  question: string;       // "How dense should things feel?"
  leftLabel: string;      // "Spacious & breathable"
  rightLabel: string;     // "Dense & information-rich"
  steps: {
    position: number;     // 0, 25, 50, 75, 100
    html: string;         // Complete HTML/CSS for this position
    description: string;  // Brief label for this step
  }[];
}

export interface DragResponse {
  sliderId: string;
  selectedPosition: number; // 0-100 — the value the user dragged to
}

/**
 * Generate drag-to-match sliders for uncertain axes.
 *
 * Each slider has 5 stops (0, 25, 50, 75, 100) showing progressive
 * change along one axis while keeping everything else constant.
 */
export async function generateDragSliders(
  sessionId: string,
  targetAxes: string[],
  count = 3
): Promise<DragSlider[]> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const tasteMap = session.tasteMap as TasteMap | null;
  if (!tasteMap) throw new Error('No taste map yet');

  // Pick the most uncertain axes
  const axes = targetAxes
    .map((id) => ({ id, ...(tasteMap[id] || { confidence: 0, position: 50, label: id }) }))
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, count);

  const systemPrompt = buildDragToMatchSystemPrompt();

  const userPrompt = `Generate ${axes.length} drag-to-match sliders.

Current taste map context (keep non-target axes at these positions):
${JSON.stringify(
    Object.entries(tasteMap)
      .map(([k, v]) => ({ axis: k, position: v.position, label: v.label }))
      .slice(0, 10),
    null, 2
  )}

Axes to create sliders for:
${axes.map((a) => `- ${a.id} (${a.label}): current position ${a.position}, confidence ${(a.confidence * 100).toFixed(0)}%`).join('\n')}

For each slider:
{
  "sliders": [
    {
      "id": "drag_1",
      "axis": "structure_density",
      "axisLabel": "Layout Density",
      "question": "How packed should things feel?",
      "leftLabel": "Spacious & breathable",
      "rightLabel": "Dense & information-rich",
      "steps": [
        {"position": 0, "html": "<!DOCTYPE html>...", "description": "Very spacious"},
        {"position": 25, "html": "<!DOCTYPE html>...", "description": "Spacious"},
        {"position": 50, "html": "<!DOCTYPE html>...", "description": "Balanced"},
        {"position": 75, "html": "<!DOCTYPE html>...", "description": "Compact"},
        {"position": 100, "html": "<!DOCTYPE html>...", "description": "Very dense"}
      ]
    }
  ]
}`;

  const result = await trackApiCall(
    sessionId,
    'drag_to_match',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 16384, // 5 HTML docs per slider × 3 sliders = lots of tokens
      })
  );

  return parseJsonResponse<{ sliders: DragSlider[] }>(result.text).sliders;
}

/**
 * Process drag slider responses into direct axis position updates.
 *
 * This is the most precise extraction method — the user's drag position
 * maps DIRECTLY to the axis value. No inference needed.
 */
export function processDragResponses(
  sliders: DragSlider[],
  responses: DragResponse[]
): { axisId: string; newPosition: number; confidence: number }[] {
  return responses.map((r) => {
    const slider = sliders.find((s) => s.id === r.sliderId);
    return {
      axisId: slider?.axis || '',
      newPosition: r.selectedPosition,
      confidence: 0.85, // Drag-to-match is high confidence — direct user input
    };
  }).filter((u) => u.axisId);
}
