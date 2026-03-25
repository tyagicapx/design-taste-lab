/**
 * Image Personality Editor — GPT Image 1.5 (gpt-image-1)
 *
 * Takes a raw Unsplash photo and applies design-driven edits to give it
 * "personality" that matches the probe's aesthetic direction.
 *
 * Think: color grading, overlay treatments, dramatic crops, editorial mood —
 * like the Farce, BridgeAI, and Astralynx references.
 *
 * Uses OpenAI's gpt-image-1 model for image editing.
 */

import fs from 'fs';
import path from 'path';

const OPENAI_BASE = 'https://api.openai.com/v1';

function getApiKey(): string {
  const key = process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_IMAGE_API_KEY or OPENAI_API_KEY not set');
  return key;
}

export interface ImageEditRequest {
  /** URL of the source image (from Unsplash) */
  sourceImageUrl: string;
  /** Design mood/direction for the edit */
  editPrompt: string;
  /** Output size */
  size?: '1024x1024' | '1536x1024' | '1024x1536';
}

export interface EditedImage {
  /** Base64 data of the edited image */
  base64: string;
  /** Local file path after saving */
  filePath: string;
  /** Public URL path */
  publicPath: string;
}

/**
 * Download an image URL to a buffer.
 */
async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a new image with personality using GPT Image 1.5.
 *
 * Uses the image generation endpoint with a detailed prompt that references
 * the source image's content and applies the desired aesthetic treatment.
 */
export async function editImageWithPersonality(
  request: ImageEditRequest
): Promise<{ base64: string }> {
  const apiKey = getApiKey();

  // Use image generation with a rich prompt that describes both
  // the source content and the desired personality/treatment
  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: request.editPrompt,
      n: 1,
      size: request.size || '1536x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GPT Image API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    data: { b64_json: string }[];
  };

  if (!data.data?.[0]?.b64_json) {
    throw new Error('No image data in GPT Image response');
  }

  return { base64: data.data[0].b64_json };
}

/**
 * Apply personality edit to an image and save to disk.
 *
 * @returns Local file path and public URL path for the edited image.
 */
export async function processProbeImage(
  sourceImageUrl: string,
  editPrompt: string,
  sessionId: string,
  probeIndex: number,
  imageIndex: number
): Promise<EditedImage> {
  // Generate the edited image
  const result = await editImageWithPersonality({
    sourceImageUrl,
    editPrompt,
    size: '1536x1024',
  });

  // Save to disk
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId, 'probe-images');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `probe-${probeIndex}-img-${imageIndex}.png`;
  const absolutePath = path.join(uploadDir, filename);
  const publicPath = `/uploads/${sessionId}/probe-images/${filename}`;

  // Write base64 to file
  const buffer = Buffer.from(result.base64, 'base64');
  fs.writeFileSync(absolutePath, buffer);

  return {
    base64: result.base64,
    filePath: absolutePath,
    publicPath,
  };
}

/**
 * Build an image edit prompt based on the probe's design direction.
 *
 * This is the key creative function — it translates design taste axes
 * into a specific GPT Image prompt that creates editorial-quality visuals.
 */
export function buildImageEditPrompt(
  originalImageDescription: string,
  probeDesign: {
    name: string;
    colorPalette: string;  // e.g. "dark charcoal with lime green accents"
    mood: string;          // e.g. "premium, moody, tech-confident"
    surfaceStyle: string;  // e.g. "matte digital, subtle depth"
    typography?: string;   // optional: if text overlay is needed
  }
): string {
  return `Create a high-quality editorial hero image for a premium website design.

VISUAL DIRECTION:
- This is for a design called "${probeDesign.name}"
- Color palette: ${probeDesign.colorPalette}
- Mood/atmosphere: ${probeDesign.mood}
- Surface quality: ${probeDesign.surfaceStyle}

SCENE/CONTENT:
${originalImageDescription}

STYLE REQUIREMENTS:
- Editorial photography quality — like Vogue, Kinfolk, or Monocle magazine
- Strong intentional color grading that matches the palette direction
- Cinematic composition with dramatic lighting
- Premium, high-end feel — NOT stock photo generic
- Can include subtle design elements: geometric overlays, grain texture, light flares
- The image should feel like it belongs on a $50M startup's landing page
- Landscape orientation (16:9 aspect ratio)
- NO text, logos, or UI elements in the image — pure visual

${probeDesign.typography ? `OPTIONAL OVERLAY: Could work with overlaid text "${probeDesign.typography}" in a premium typeface` : 'Do NOT include any text in the image.'}

Make it feel expensive, intentional, and editorial — not generic or AI-generated looking.`;
}
