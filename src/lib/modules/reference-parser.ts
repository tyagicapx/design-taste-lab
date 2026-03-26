import { visionProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import { imageToBase64 } from '../utils/image';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/reference-parser';
import {
  updateReferenceAnalysis,
  getSessionReferences,
} from '../db/queries';
import { ReferenceAnalysis } from '../types';
import path from 'path';

const CONCURRENCY = 3;

function parseJsonResponse(text: string): unknown {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[0]);
}

async function parseOneReference(
  sessionId: string,
  refId: string,
  imagePath: string,
  annotations: unknown
): Promise<ReferenceAnalysis> {
  const absolutePath = path.join(process.cwd(), 'public', imagePath);
  const { base64, mediaType } = imageToBase64(absolutePath);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    annotations as { tags: string[]; note: string } | null
  );

  const result = await trackApiCall(
    sessionId,
    'reference_parser',
    'claude',
    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    () =>
      visionProvider.analyzeImage({
        systemPrompt,
        userPrompt,
        images: [{ base64, mediaType }],
        maxTokens: 2048,
      })
  );

  const analysis = parseJsonResponse(result.text) as ReferenceAnalysis;
  updateReferenceAnalysis(refId, analysis, analysis.likelyOutlier);
  return analysis;
}

export async function parseAllReferences(
  sessionId: string
): Promise<ReferenceAnalysis[]> {
  const refs = getSessionReferences(sessionId);
  const results: ReferenceAnalysis[] = [];

  // Process in batches of CONCURRENCY
  for (let i = 0; i < refs.length; i += CONCURRENCY) {
    const batch = refs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((ref) =>
        parseOneReference(sessionId, ref.id, ref.path, ref.annotations)
      )
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Failed to parse reference:', result.reason);
      }
    }
  }

  return results;
}
