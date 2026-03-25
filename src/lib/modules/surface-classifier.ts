import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/surface-classifier';
import {
  getSessionReferences,
  updateReferenceClassification,
} from '../db/queries';
import type { SurfaceType } from '../types';

function parseJsonResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Classifies each reference's surface type (landing page, web app, mobile, etc.)
 * Runs after reference parsing, before clustering.
 */
export async function classifyAllSurfaces(sessionId: string): Promise<void> {
  const refs = getSessionReferences(sessionId);
  const refsWithAnalysis = refs.filter((r) => r.analysis);

  const systemPrompt = buildSystemPrompt();

  // Process in batches of 5 (parallel)
  const batchSize = 5;
  for (let i = 0; i < refsWithAnalysis.length; i += batchSize) {
    const batch = refsWithAnalysis.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (ref) => {
        try {
          const userPrompt = buildUserPrompt(ref.analysis, ref.filename);

          const result = await trackApiCall(
            sessionId,
            'surface_classifier',
            'claude',
            process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
            () =>
              textProvider.generateText({
                systemPrompt,
                userPrompt,
                maxTokens: 512,
              })
          );

          const parsed = parseJsonResponse(result.text) as {
            surfaceType: SurfaceType;
            confidence: number;
          };

          updateReferenceClassification(ref.id, {
            surfaceType: parsed.surfaceType,
          });
        } catch (err) {
          console.error(`Surface classification failed for ${ref.id}:`, err);
          // Leave as 'unknown' — non-fatal
        }
      })
    );
  }
}
