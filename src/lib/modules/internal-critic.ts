import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/internal-critic';
import {
  getSession,
  getSessionReferences,
  updateSessionCritic,
} from '../db/queries';
import { CriticOutput } from '../types';

function parseJsonResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[0]);
}

export async function runCritic(sessionId: string): Promise<CriticOutput> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const refs = getSessionReferences(sessionId);
  const analyses = refs.map((r) => r.analysis).filter(Boolean);
  const annotations = refs.map((r) => r.annotations).filter(Boolean);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    session.tasteMap,
    analyses,
    annotations
  );

  const result = await trackApiCall(
    sessionId,
    'internal_critic',
    'claude',
    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 4096,
      })
  );

  const criticOutput = parseJsonResponse(result.text) as CriticOutput;
  updateSessionCritic(sessionId, criticOutput);
  return criticOutput;
}
