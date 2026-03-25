import Anthropic from '@anthropic-ai/sdk';
import { TextProvider, VisionProvider } from './provider';
import { TokenUsage } from '../types';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY.\n\n' +
      'This is required for AI-powered taste analysis.\n' +
      'Get your API key at: https://console.anthropic.com/settings/keys\n' +
      'Then add it to your .env.local file:\n\n' +
      '  ANTHROPIC_API_KEY=sk-ant-...\n\n' +
      'Or set DEMO_MODE=true to try the app with sample data.'
    );
  }
  return new Anthropic({ apiKey });
}

function estimateCost(input: number, output: number): number {
  // Sonnet pricing: $3/M input, $15/M output
  return (input / 1_000_000) * 3 + (output / 1_000_000) * 15;
}

export const claudeText: TextProvider = {
  async generateText({ systemPrompt, userPrompt, maxTokens = 4096 }) {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimatedCost: estimateCost(
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
    };

    return { text, usage };
  },
};

export const claudeVision: VisionProvider = {
  async analyzeImage({ systemPrompt, userPrompt, images, maxTokens = 4096 }) {
    const client = getClient();

    const imageBlocks: Anthropic.ImageBlockParam[] = images.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp',
        data: img.base64,
      },
    }));

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text' as const, text: userPrompt },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimatedCost: estimateCost(
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
    };

    return { text, usage };
  },
};
