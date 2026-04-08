/**
 * Pinterest Board Ingestion via Apify
 *
 * Uses the `fatihtahta~pinterest-scraper-search` Apify actor to extract
 * pin images from a Pinterest board URL.
 *
 * Requires APIFY_API_TOKEN in .env.local
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { validateSessionId } from '@/lib/security';

const APIFY_BASE = 'https://api.apify.com/v2';
const PINTEREST_ACTOR = 'fatihtahta~pinterest-scraper-search';

export interface PinterestPin {
  imageUrl: string;
  title: string;
  description: string;
  pinUrl: string;
}

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN not set in environment');
  return token;
}

async function apifyFetch(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<unknown> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${APIFY_BASE}${endpoint}${separator}token=${getToken()}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify API error (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Start a Pinterest scraper run with correct input format.
 */
async function startRun(boardUrl: string, maxPins: number) {
  const data = (await apifyFetch(
    'POST',
    `/acts/${PINTEREST_ACTOR}/runs`,
    {
      startUrls: [boardUrl],
      type: 'all-pins',
      limit: maxPins,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
      },
    }
  )) as { data: { id: string; defaultDatasetId: string } };
  return { runId: data.data.id, datasetId: data.data.defaultDatasetId };
}

/**
 * Poll until the run succeeds or fails.
 */
async function waitForRun(runId: string, maxWaitMs = 180000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const data = (await apifyFetch('GET', `/actor-runs/${runId}`)) as {
      data: { status: string };
    };
    const status = data.data.status;
    if (status === 'SUCCEEDED') return;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${status}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Apify run timed out');
}

/**
 * Fetch dataset items.
 */
async function getDatasetItems(datasetId: string): Promise<unknown[]> {
  return (await apifyFetch(
    'GET',
    `/datasets/${datasetId}/items?format=json&clean=true`
  )) as unknown[];
}

/**
 * Extract the best image URL from an Apify Pinterest pin item.
 *
 * The actor returns images nested under `media.images` with keys:
 * thumb (236px), small (236px), medium (474px), large (736px), original
 */
function extractImageUrl(item: Record<string, unknown>): string | null {
  const media = item.media as Record<string, unknown> | undefined;
  if (media?.images) {
    const imgs = media.images as Record<string, { url?: string; width?: number }>;
    // Prefer large > original > medium > small
    return imgs.large?.url || imgs.originals?.url || imgs.original?.url || imgs.medium?.url || imgs.small?.url || null;
  }
  // Fallback: check for story pin images
  const pin = item.pin as Record<string, unknown> | undefined;
  if (pin?.story) {
    const story = pin.story as Record<string, unknown>;
    const pages = story.pages_preview as Array<{ blocks: Array<{ image?: { images?: Record<string, { url?: string }> } }> }>;
    if (pages?.[0]?.blocks?.[0]?.image?.images) {
      const storyImgs = pages[0].blocks[0].image.images;
      return storyImgs['1200x']?.url || storyImgs.originals?.url || null;
    }
  }
  return null;
}

/**
 * Extract pin metadata.
 */
function extractPinData(item: Record<string, unknown>): PinterestPin | null {
  const imageUrl = extractImageUrl(item);
  if (!imageUrl) return null;

  const pin = (item.pin as Record<string, unknown>) || {};
  return {
    imageUrl,
    title: (item.title as string) || (pin.title as string) || '',
    description: (pin.description as string) || '',
    pinUrl: (item.url as string) || '',
  };
}

/**
 * Download an image URL to a local file.
 */
function downloadImage(imageUrl: string, destPath: string, maxRedirects = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol
      .get(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const loc = response.headers.location;
          if (loc) {
            response.destroy();
            file.close();
            try { fs.unlinkSync(destPath); } catch {}
            if (maxRedirects <= 0) {
              reject(new Error('Too many redirects'));
              return;
            }
            return downloadImage(loc, destPath, maxRedirects - 1).then(resolve).catch(reject);
          }
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      })
      .on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

/**
 * Main entry point: Extract pins from a Pinterest board URL.
 */
export async function extractPinterestBoard(
  boardUrl: string,
  sessionId: string,
  maxPins = 30
): Promise<{ filename: string; filePath: string; pin: PinterestPin }[]> {
  if (!validateSessionId(sessionId)) throw new Error('Invalid session ID');

  const { runId, datasetId } = await startRun(boardUrl, maxPins);
  await waitForRun(runId);
  const items = await getDatasetItems(datasetId);

  // Filter to actual pins with images (skip story/recommendation items)
  const pins: PinterestPin[] = [];
  for (const item of items) {
    const rec = item as Record<string, unknown>;
    // Skip non-pin entities and story bubbles
    if (rec.entity_type !== 'pin') continue;
    const extra = rec.extra as Record<string, unknown> | undefined;
    if (extra?.type === 'story') continue;

    const pin = extractPinData(rec);
    if (pin) pins.push(pin);
    if (pins.length >= maxPins) break;
  }

  if (pins.length === 0) {
    throw new Error('No pin images found. The board may be private or empty.');
  }

  // Download images
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const results: { filename: string; filePath: string; pin: PinterestPin }[] = [];
  const batchSize = 5;

  for (let i = 0; i < pins.length; i += batchSize) {
    const batch = pins.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (pin, bi) => {
        const idx = i + bi;
        const ext = pin.imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
        const filename = `pinterest-${idx + 1}.${ext}`;
        const absPath = path.join(uploadDir, filename);
        const relPath = `/uploads/${sessionId}/${filename}`;
        try {
          await downloadImage(pin.imageUrl, absPath);
          results.push({ filename, filePath: relPath, pin });
        } catch (err) {
          console.error(`Failed to download pin ${idx + 1}:`, err);
        }
      })
    );
  }

  return results;
}
