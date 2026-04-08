/**
 * Probe Visuals Pipeline — Orchestrator
 *
 * Coordinates the full pipeline:
 * 1. Analyze probe design direction → determine what images are needed
 * 2. Search Unsplash for matching raw photos
 * 3. Apply personality edits via GPT Image 1.5
 * 4. Return image URLs ready to embed in probe HTML
 *
 * Each probe gets 1-3 images depending on its layout needs:
 * - Hero background: 1 large landscape image (always)
 * - Feature/accent images: 0-2 smaller images (optional)
 */

import { searchImages, triggerDownload, type ProbeImage } from './unsplash';
import { processProbeImage, buildImageEditPrompt } from './image-personality';

export interface ProbeVisualRequest {
  sessionId: string;
  probeIndex: number;
  probeName: string;
  probeDescription: string;
  colorPalette: string;
  mood: string;
  surfaceStyle: string;
  imageCount?: number; // 1-3, default 1
}

export interface ProbeVisual {
  publicPath: string;
  alt: string;
  credit: string;
  creditUrl: string;
  role: 'hero' | 'accent' | 'feature';
}

/**
 * Determine Unsplash search queries from probe design direction.
 */
function deriveSearchQueries(request: ProbeVisualRequest): string[] {
  const queries: string[] = [];
  const mood = request.mood.toLowerCase();
  const palette = request.colorPalette.toLowerCase();

  // Mood-based primary query
  if (mood.includes('dark') || mood.includes('moody')) {
    queries.push('dark moody dramatic landscape');
  } else if (mood.includes('warm') || mood.includes('organic')) {
    queries.push('warm golden light nature');
  } else if (mood.includes('cold') || mood.includes('minimal')) {
    queries.push('minimal architecture cold tone');
  } else if (mood.includes('cosmic') || mood.includes('space')) {
    queries.push('cosmic nebula dark space');
  } else if (mood.includes('nature') || mood.includes('botanical')) {
    queries.push('lush botanical garden editorial');
  } else if (mood.includes('tech') || mood.includes('futuristic')) {
    queries.push('futuristic technology abstract');
  } else if (mood.includes('urban') || mood.includes('city')) {
    queries.push('urban city night architecture');
  } else {
    queries.push('abstract texture premium background');
  }

  // Color-based secondary query
  if (palette.includes('green') || palette.includes('lime')) {
    queries.push('nature green lush tropical');
  } else if (palette.includes('blue') || palette.includes('cyan')) {
    queries.push('ocean blue serene water');
  } else if (palette.includes('orange') || palette.includes('warm')) {
    queries.push('sunset amber warm desert');
  } else if (palette.includes('purple') || palette.includes('violet')) {
    queries.push('purple twilight dusk atmospheric');
  } else {
    queries.push('monochrome dramatic editorial');
  }

  // Context-based tertiary query
  queries.push('abstract geometric modern art');

  return queries;
}

/**
 * Determine the Unsplash color filter from the probe's palette direction.
 */
function deriveColorFilter(colorPalette: string): string | undefined {
  const p = colorPalette.toLowerCase();
  if (p.includes('green') || p.includes('lime')) return 'green';
  if (p.includes('blue') || p.includes('cyan')) return 'blue';
  if (p.includes('orange') || p.includes('amber')) return 'orange';
  if (p.includes('red') || p.includes('coral')) return 'red';
  if (p.includes('purple') || p.includes('violet')) return 'purple';
  if (p.includes('yellow') || p.includes('gold')) return 'yellow';
  if (p.includes('dark') || p.includes('charcoal') || p.includes('black')) return 'black';
  if (p.includes('white') || p.includes('light')) return 'white';
  return undefined;
}

/**
 * Generate visuals for a single probe.
 *
 * Pipeline: Unsplash search → pick best → GPT Image personality edit → save
 */
export async function generateProbeVisuals(
  request: ProbeVisualRequest
): Promise<ProbeVisual[]> {
  const imageCount = request.imageCount || 1;
  const queries = deriveSearchQueries(request);
  const colorFilter = deriveColorFilter(request.colorPalette);

  const visuals: ProbeVisual[] = [];
  const roles: ('hero' | 'accent' | 'feature')[] = ['hero', 'feature', 'accent'];

  for (let i = 0; i < Math.min(imageCount, 3); i++) {
    const query = queries[i % queries.length];

    try {
      // 1. Search Unsplash
      const photos = await searchImages(
        query,
        5,
        i === 0 ? 'landscape' : 'squarish',
        colorFilter
      );

      if (photos.length === 0) {
        console.warn(`No Unsplash results for query: "${query}"`);
        continue;
      }

      // Pick a random one from top 5 for variety
      const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];

      // 2. Trigger Unsplash download (API compliance)
      triggerDownload(photo.downloadTriggerUrl).catch(() => {});

      // 3. Build the personality edit prompt
      const editPrompt = buildImageEditPrompt(
        `Based on this scene: ${photo.alt}. High quality ${query} photography.`,
        {
          name: request.probeName,
          colorPalette: request.colorPalette,
          mood: request.mood,
          surfaceStyle: request.surfaceStyle,
        }
      );

      // 4. Apply personality edit via GPT Image 1.5
      const edited = await processProbeImage(
        editPrompt,
        request.sessionId,
        request.probeIndex,
        i
      );

      visuals.push({
        publicPath: edited.publicPath,
        alt: photo.alt,
        credit: photo.credit,
        creditUrl: photo.creditUrl,
        role: roles[i],
      });
    } catch (err) {
      console.error(`Failed to generate visual ${i} for probe ${request.probeIndex}:`, err);
      // Continue with other images — don't fail the whole probe
    }
  }

  return visuals;
}

/**
 * Generate visuals for ALL probes in a round.
 *
 * Runs probes sequentially (to avoid rate limits) but images within a probe
 * are generated concurrently.
 */
export async function generateAllProbeVisuals(
  probes: {
    index: number;
    name: string;
    description: string;
    colorPalette: string;
    mood: string;
    surfaceStyle: string;
  }[],
  sessionId: string
): Promise<Map<number, ProbeVisual[]>> {
  const results = new Map<number, ProbeVisual[]>();

  for (const probe of probes) {
    try {
      const visuals = await generateProbeVisuals({
        sessionId,
        probeIndex: probe.index,
        probeName: probe.name,
        probeDescription: probe.description,
        colorPalette: probe.colorPalette,
        mood: probe.mood,
        surfaceStyle: probe.surfaceStyle,
        imageCount: 1, // 1 hero image per probe by default
      });
      results.set(probe.index, visuals);
    } catch (err) {
      console.error(`Failed to generate visuals for probe ${probe.index}:`, err);
      results.set(probe.index, []);
    }
  }

  return results;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generate an HTML image tag with proper styling for embedding in probe HTML.
 *
 * Returns a CSS background-image style string or an img tag depending on role.
 */
export function visualToHtml(visual: ProbeVisual, role: 'hero-bg' | 'inline'): string {
  if (role === 'hero-bg') {
    return `background-image: url('${visual.publicPath}'); background-size: cover; background-position: center;`;
  }

  const safeAlt = escapeHtml(visual.alt);
  const safeCredit = escapeHtml(visual.credit);

  return `<img src="${visual.publicPath}" alt="${safeAlt}" style="width: 100%; height: auto; object-fit: cover; border-radius: 16px;" />
<!-- ${safeCredit} -->`;
}
