/**
 * "What's Wrong?" — Extraction Method #2
 *
 * Shows the user a design that's deliberately 80% right but with ONE thing off.
 * The user spots the flaw. Each "fix" they identify is a precise axis calibration.
 *
 * People are MUCH better at spotting what's OFF than describing what's right.
 * This gives us surgical precision on individual axes.
 */

import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import { getSession } from '../db/queries';
import { parseJsonResponse } from '../utils/json';
import { TasteMap } from '../types';
import { findContrastingScreenshots } from '../library/loader';
import { DEFAULT_CLAUDE_MODEL } from '../constants';
import { buildWhatsWrongSystemPrompt, buildLibraryWhatsWrongSystemPrompt } from '../prompts/whats-wrong';

export interface WhatsWrongChallenge {
  id: string;
  html: string;           // Full HTML/CSS of the "almost right" design (empty for library mode)
  deliberateFlaw: string;  // Internal: what we deliberately made wrong (hidden from user)
  flawAxis: string;        // Which axis this tests
  flawAxisLabel: string;
  correctDirection: string; // Internal: what the "right" version would look like
  /** When set, this challenge uses a real screenshot instead of AI HTML */
  libraryScreenshot?: {
    id: string;
    name: string;
    imagePath: string;
    url: string;
  };
  options: {
    id: string;
    label: string;          // "The text is too small" / "The colors are too warm" etc.
    isCorrectFlaw: boolean; // Does this match the deliberate flaw?
    axisImplication: {
      axisId: string;
      direction: 'increase' | 'decrease';
      magnitude: number;
    };
  }[];
}

export interface WhatsWrongResponse {
  challengeId: string;
  selectedOptionId: string;
  freeText?: string; // "Actually, the problem is..."
}

/**
 * Generate "What's Wrong?" challenges based on the current taste map.
 *
 * For each challenge:
 * 1. Generate an HTML design that matches the taste map on most axes
 * 2. Deliberately skew ONE axis (e.g., make typography too small, colors too warm)
 * 3. Present 3-4 options for what feels off — only one matches the deliberate flaw
 * 4. User's choice tells us EXACTLY where they sit on that axis
 */
export async function generateWhatsWrongChallenges(
  sessionId: string,
  targetAxes: string[], // Which axes to test (usually low-confidence ones)
  count = 4
): Promise<WhatsWrongChallenge[]> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const tasteMap = session.tasteMap as TasteMap | null;
  if (!tasteMap) throw new Error('No taste map available — run analysis first');

  const systemPrompt = buildWhatsWrongSystemPrompt();

  const axisContext = targetAxes.map((axisId) => {
    const axis = tasteMap[axisId];
    return axis
      ? `${axisId}: position=${axis.position}/100, confidence=${(axis.confidence * 100).toFixed(0)}%`
      : `${axisId}: no data`;
  });

  const userPrompt = `Generate ${count} "What's Wrong?" challenges.

Current taste map (follow these for the "correct" parts of each design):
${JSON.stringify(
    Object.entries(tasteMap)
      .map(([k, v]) => ({ axis: k, position: v.position, label: v.label }))
      .slice(0, 15), // Send top 15 axes for context
    null, 2
  )}

TARGET AXES TO TEST (make the flaw on ONE of these per challenge):
${axisContext.join('\n')}

For each challenge, generate:
{
  "challenges": [
    {
      "id": "ww_1",
      "html": "<!DOCTYPE html>...(complete HTML/CSS)...",
      "deliberateFlaw": "Typography is too small and light — should be bolder and larger",
      "flawAxis": "type_drama",
      "flawAxisLabel": "Typography Drama",
      "correctDirection": "Bigger, bolder headlines with more weight contrast",
      "options": [
        {"id": "opt_a", "label": "The text feels too small and thin", "isCorrectFlaw": true, "axisImplication": {"axisId": "type_drama", "direction": "increase", "magnitude": 0.2}},
        {"id": "opt_b", "label": "The colors feel too cold", "isCorrectFlaw": false, "axisImplication": {"axisId": "color_temperature", "direction": "increase", "magnitude": 0.15}},
        {"id": "opt_c", "label": "There's too much empty space", "isCorrectFlaw": false, "axisImplication": {"axisId": "structure_density", "direction": "increase", "magnitude": 0.15}},
        {"id": "opt_d", "label": "Something else (I'll describe it)", "isCorrectFlaw": false, "axisImplication": {"axisId": "", "direction": "increase", "magnitude": 0}}
      ]
    }
  ]
}

IMPORTANT: Each challenge's HTML must be a complete, valid, professional-looking document with inline CSS. Quality bar: Linear/Vercel level, just with one deliberate flaw.`;

  const result = await trackApiCall(
    sessionId,
    'whats_wrong_generator',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 16384,
      })
  );

  return parseJsonResponse<{ challenges: WhatsWrongChallenge[] }>(result.text).challenges;
}

/**
 * Generate library-based "What's Wrong?" challenges.
 *
 * Uses real screenshots from the library that are close-but-different on
 * specific axes. The user sees a real site and picks what they'd change.
 * More grounded than AI-generated HTML — users react to REAL designs.
 */
export async function generateLibraryChallenges(
  sessionId: string,
  targetAxes: string[],
  count = 2
): Promise<WhatsWrongChallenge[]> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const tasteMap = session.tasteMap as TasteMap | null;
  if (!tasteMap) throw new Error('No taste map available');

  // Find contrasting screenshots for each target axis
  const axesToUse = targetAxes.slice(0, count);
  const screenshotsByAxis: { axis: string; screenshots: ReturnType<typeof findContrastingScreenshots> }[] = [];

  for (const axis of axesToUse) {
    const screenshots = findContrastingScreenshots(tasteMap, axis, { limit: 3 });
    if (screenshots.length > 0) {
      screenshotsByAxis.push({ axis, screenshots });
    }
  }

  if (screenshotsByAxis.length === 0) return [];

  // Ask Claude to analyze each screenshot vs the taste map and generate options
  const systemPrompt = buildLibraryWhatsWrongSystemPrompt();

  const challengePromises = screenshotsByAxis.map(async ({ axis, screenshots }, idx) => {
    const screenshot = screenshots[0]; // Best contrasting match
    const tasteAxis = tasteMap[axis];
    const hintValue = screenshot.axes_hint[axis as keyof typeof screenshot.axes_hint];

    const userPrompt = `Analyze this real website for a "What would you change?" challenge.

Website: "${screenshot.name}" (${screenshot.url})
Category: ${screenshot.category}
Tags: ${JSON.stringify(screenshot.tags)}
Axes hint: ${JSON.stringify(screenshot.axes_hint)}

User's taste map (what they WANT):
${JSON.stringify(
  Object.entries(tasteMap)
    .map(([k, v]) => ({ axis: k, position: v.position, label: v.label }))
    .slice(0, 15),
  null, 2
)}

TARGET AXIS: ${axis} — user wants ${tasteAxis?.position ?? 50}/100, screenshot is at ~${hintValue ?? 'unknown'}/100
Axis label: ${tasteAxis?.label ?? axis}

Generate a challenge:
{
  "deliberateFlaw": "Description of how this site differs from the user's taste on the target axis",
  "flawAxis": "${axis}",
  "flawAxisLabel": "${tasteAxis?.label ?? axis}",
  "correctDirection": "What the user would prefer instead",
  "options": [
    {"id": "opt_a", "label": "I'd change X", "isCorrectFlaw": true/false, "axisImplication": {"axisId": "...", "direction": "increase"/"decrease", "magnitude": 0.1-0.3}},
    {"id": "opt_b", "label": "I'd change Y", "isCorrectFlaw": true/false, "axisImplication": {"axisId": "...", "direction": "increase"/"decrease", "magnitude": 0.1-0.3}},
    {"id": "opt_c", "label": "I'd change Z", "isCorrectFlaw": true/false, "axisImplication": {"axisId": "...", "direction": "increase"/"decrease", "magnitude": 0.1-0.3}},
    {"id": "opt_love", "label": "Nothing — I actually love this as-is", "isCorrectFlaw": false, "axisImplication": {"axisId": "${axis}", "direction": "increase", "magnitude": 0}},
    {"id": "opt_other", "label": "Something else (I'll describe it)", "isCorrectFlaw": false, "axisImplication": {"axisId": "", "direction": "increase", "magnitude": 0}}
  ]
}`;

    const result = await trackApiCall(
      sessionId,
      'whats_wrong_library',
      'claude',
      DEFAULT_CLAUDE_MODEL,
      () =>
        textProvider.generateText({
          systemPrompt,
          userPrompt,
          maxTokens: 1024,
        })
    );

    const parsed = parseJsonResponse<{
      deliberateFlaw: string;
      flawAxis: string;
      flawAxisLabel: string;
      correctDirection: string;
      options: WhatsWrongChallenge['options'];
    }>(result.text);

    return {
      id: `ww_lib_${idx + 1}`,
      html: '', // No HTML — using screenshot image
      deliberateFlaw: parsed.deliberateFlaw,
      flawAxis: parsed.flawAxis,
      flawAxisLabel: parsed.flawAxisLabel,
      correctDirection: parsed.correctDirection,
      libraryScreenshot: {
        id: screenshot.id,
        name: screenshot.name,
        imagePath: screenshot.image_path,
        url: screenshot.url,
      },
      options: parsed.options,
    } satisfies WhatsWrongChallenge;
  });

  return Promise.all(challengePromises);
}

/**
 * Process "What's Wrong?" responses and extract axis deltas.
 */
export function processWhatsWrongResponses(
  challenges: WhatsWrongChallenge[],
  responses: WhatsWrongResponse[]
): { axisId: string; direction: 'increase' | 'decrease'; magnitude: number }[] {
  const deltas: { axisId: string; direction: 'increase' | 'decrease'; magnitude: number }[] = [];

  for (const response of responses) {
    const challenge = challenges.find((c) => c.id === response.challengeId);
    if (!challenge) continue;

    const selectedOption = challenge.options.find((o) => o.id === response.selectedOptionId);
    if (!selectedOption) continue;

    if (selectedOption.axisImplication.axisId) {
      deltas.push({
        axisId: selectedOption.axisImplication.axisId,
        direction: selectedOption.axisImplication.direction,
        magnitude: selectedOption.axisImplication.magnitude,
      });
    }

    // If user spotted the correct flaw, that's a STRONG signal
    if (selectedOption.isCorrectFlaw) {
      // Boost the magnitude — they have precise taste on this axis
      const existing = deltas.find((d) => d.axisId === challenge.flawAxis);
      if (existing) {
        existing.magnitude = Math.min(existing.magnitude * 1.5, 0.4);
      }
    }
  }

  return deltas;
}
