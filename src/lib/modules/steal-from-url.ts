/**
 * "Steal from URL" — Extraction Method #4
 *
 * User pastes a URL they love. Instead of just analyzing it holistically,
 * we break it apart into components: typography, color, spacing, surface, layout.
 * Then ask: "Which of these do you actually want to KEEP?"
 *
 * They might love a site's colors but hate its typography.
 * This dissection reveals which aspects they're drawn to.
 */

import path from 'path';
import { textProvider, visionProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import { getSession } from '../db/queries';
import { parseJsonResponse } from '../utils/json';
import { imageToBase64 } from '../utils/image';
import { captureViewportScreenshot } from '../services/screenshot';
import { safePath } from '@/lib/security';
import { DEFAULT_CLAUDE_MODEL } from '../constants';
import { buildStealFromUrlSystemPrompt, buildStealDeltaSystemPrompt } from '../prompts/steal-from-url';

export interface SiteComponent {
  id: string;
  aspect: string;          // "typography" | "color" | "spacing" | "surface" | "layout" | "nav" | "personality"
  aspectLabel: string;     // "Typography" | "Color System" etc.
  description: string;     // "Large serif headlines, tight letter spacing, dramatic size contrast"
  extractedValues: string; // "Font: Playfair Display, H1: 64px, Body: 16px, Weight contrast: 900 vs 400"
  axisTargets: string[];   // Which taste axes this informs
  screenshotRegion?: string; // "hero" | "nav" | "features" | "full" — for visual context
}

export interface StealFromUrlResult {
  url: string;
  siteName: string;
  overallVibe: string;     // "Minimal editorial with premium restraint"
  components: SiteComponent[];
  screenshotPath: string;  // Path to the captured screenshot
}

export interface StealResponse {
  componentId: string;
  keep: boolean;           // true = "steal this", false = "don't want this"
  note?: string;           // Optional: "I like this but make it warmer"
}

/**
 * Analyze a URL and break it into stealable design components.
 */
export async function dissectUrl(
  url: string,
  sessionId: string
): Promise<StealFromUrlResult> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Capture a screenshot of the site
  const screenshot = await captureViewportScreenshot(url, sessionId);

  // Analyze the screenshot with Claude Vision
  const screenshotAbsPath = safePath(
    path.join(process.cwd(), 'public'),
    screenshot.filePath.replace(/^\//, '')
  );
  const { base64, mediaType } = imageToBase64(screenshotAbsPath);

  const systemPrompt = buildStealFromUrlSystemPrompt();

  const userPrompt = `Dissect this website into 5-7 stealable design components.

URL: ${url}

For each component, I need:
{
  "siteName": "The website name",
  "overallVibe": "One sentence describing the overall aesthetic",
  "components": [
    {
      "id": "comp_1",
      "aspect": "typography",
      "aspectLabel": "Typography",
      "description": "Large, bold headlines with dramatic size contrast — hero text dominates the page",
      "extractedValues": "Font: Inter, H1: 56px/700, Body: 16px/400, Line-height: 1.4, Letter-spacing: -0.02em",
      "axisTargets": ["type_drama", "type_scale", "type_expression"],
      "screenshotRegion": "hero"
    },
    {
      "id": "comp_2",
      "aspect": "color",
      "aspectLabel": "Color System",
      "description": "Dark background with a single lime green accent for CTAs and highlights",
      "extractedValues": "Background: #0a0a0b, Surface: #141416, Text: #f5f5f5, Accent: #a3e635",
      "axisTargets": ["color_chromaticity", "color_temperature", "color_contrast"],
      "screenshotRegion": "full"
    }
  ]
}`;

  const result = await trackApiCall(
    sessionId,
    'steal_from_url',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      visionProvider.analyzeImage({
        systemPrompt,
        userPrompt,
        images: [{ base64, mediaType }],
        maxTokens: 4096,
      })
  );

  const parsed = parseJsonResponse<{
    siteName: string;
    overallVibe: string;
    components: SiteComponent[];
  }>(result.text);

  return {
    url,
    siteName: parsed.siteName,
    overallVibe: parsed.overallVibe,
    components: parsed.components,
    screenshotPath: screenshot.filePath,
  };
}

/**
 * Process "Steal from URL" responses into taste axis deltas.
 *
 * Components the user wants to KEEP → those axes get high confidence at the extracted position.
 * Components they DON'T want → those axes get inverse signal.
 */
export async function processStealResponses(
  sessionId: string,
  siteResult: StealFromUrlResult,
  responses: StealResponse[]
): Promise<{
  axisUpdates: { axisId: string; direction: string; confidence: number }[];
}> {
  const kept = responses.filter((r) => r.keep);
  const rejected = responses.filter((r) => !r.keep);

  const systemPrompt = buildStealDeltaSystemPrompt();

  const result = await trackApiCall(
    sessionId,
    'steal_delta',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt: `Site: ${siteResult.siteName} (${siteResult.url})
Vibe: ${siteResult.overallVibe}

KEPT components:
${JSON.stringify(kept.map((r) => {
  const comp = siteResult.components.find((c) => c.id === r.componentId);
  return { aspect: comp?.aspect, values: comp?.extractedValues, axes: comp?.axisTargets, note: r.note };
}), null, 2)}

REJECTED components:
${JSON.stringify(rejected.map((r) => {
  const comp = siteResult.components.find((c) => c.id === r.componentId);
  return { aspect: comp?.aspect, values: comp?.extractedValues, axes: comp?.axisTargets, note: r.note };
}), null, 2)}

Respond with: {"axisUpdates": [{"axisId": "...", "direction": "shift toward/away from X", "confidence": 0.5-0.9}]}`,
        maxTokens: 2048,
      })
  );

  return parseJsonResponse<{
    axisUpdates: { axisId: string; direction: string; confidence: number }[];
  }>(result.text);
}
