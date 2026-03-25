import OpenAI from 'openai';
import { ImageGenerationProvider } from './provider';

const MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

function estimateCost(
  quality: string,
  size: string
): number {
  // DALL-E 3 pricing (approximate)
  if (quality === 'hd') {
    return size === '1024x1024' ? 0.08 : 0.12;
  }
  return size === '1024x1024' ? 0.04 : 0.08;
}

export const openaiImages: ImageGenerationProvider = {
  async generateImage({
    prompt,
    size = '1792x1024',
    quality = 'standard',
  }) {
    const client = getClient();

    const response = await client.images.generate({
      model: MODEL,
      prompt,
      n: 1,
      size,
      quality,
      response_format: 'b64_json',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data returned from OpenAI');
    const imageData = Buffer.from(b64, 'base64');
    const cost = estimateCost(quality, size);

    return { imageData, cost };
  },
};
