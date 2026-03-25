import { nanoid } from 'nanoid';
import { db } from '../db';
import { apiCalls } from '../db/schema';
import { TokenUsage, AIProviderType } from '../types';

export async function trackApiCall<T extends { usage?: TokenUsage; cost?: number }>(
  sessionId: string,
  module: string,
  provider: AIProviderType,
  model: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  const result = await fn();
  const durationMs = Date.now() - start;

  const usage = result.usage;
  const cost = result.cost ?? usage?.estimatedCost ?? 0;

  db.insert(apiCalls)
    .values({
      id: nanoid(),
      sessionId,
      module,
      provider,
      model,
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      costEstimate: cost,
      durationMs,
    })
    .run();

  return result;
}
