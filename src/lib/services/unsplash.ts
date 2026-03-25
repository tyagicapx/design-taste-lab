/**
 * Unsplash Image Search Service
 *
 * Searches Unsplash for high-quality editorial images matching a theme/mood.
 * Returns download-ready URLs and photographer attribution.
 */

const UNSPLASH_BASE = 'https://api.unsplash.com';

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string; // 1080px wide
    small: string;   // 400px wide
    thumb: string;   // 200px wide
  };
  color: string | null; // dominant color hex
  blur_hash: string | null;
  user: {
    name: string;
    username: string;
    links: { html: string };
  };
  links: {
    download_location: string; // must trigger to comply with API guidelines
  };
}

interface UnsplashSearchResult {
  total: number;
  results: UnsplashPhoto[];
}

export interface ProbeImage {
  id: string;
  url: string;          // regular-sized URL for embedding
  fullUrl: string;      // full-res for editing
  dominantColor: string | null;
  alt: string;
  credit: string;       // "Photo by X on Unsplash"
  creditUrl: string;
  downloadTriggerUrl: string;
}

function getAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set');
  return key;
}

async function unsplashFetch(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`${UNSPLASH_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${getAccessKey()}`,
      'Accept-Version': 'v1',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Unsplash API error (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Search Unsplash for images matching a query.
 *
 * @param query - Search terms (e.g. "dark moody workspace technology")
 * @param count - Number of images to return (max 30)
 * @param orientation - "landscape" | "portrait" | "squarish"
 * @param color - Filter by color tone (optional)
 */
export async function searchImages(
  query: string,
  count = 6,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape',
  color?: string
): Promise<ProbeImage[]> {
  const params: Record<string, string> = {
    query,
    per_page: String(Math.min(count, 30)),
    orientation,
    order_by: 'relevant',
    content_filter: 'high', // high quality only
  };
  if (color) params.color = color;

  const data = (await unsplashFetch('/search/photos', params)) as UnsplashSearchResult;

  return data.results.map((photo) => ({
    id: photo.id,
    url: photo.urls.regular,
    fullUrl: photo.urls.full,
    dominantColor: photo.color,
    alt: photo.alt_description || photo.description || query,
    credit: `Photo by ${photo.user.name} on Unsplash`,
    creditUrl: `${photo.user.links.html}?utm_source=design_taste_lab&utm_medium=referral`,
    downloadTriggerUrl: photo.links.download_location,
  }));
}

/**
 * Trigger a download event for Unsplash API compliance.
 * Must be called when an image is actually used/displayed.
 */
export async function triggerDownload(downloadUrl: string): Promise<void> {
  try {
    await unsplashFetch(
      downloadUrl.replace(UNSPLASH_BASE, ''),
    );
  } catch {
    // Non-critical — log but don't fail
    console.warn('Failed to trigger Unsplash download event');
  }
}

/**
 * Build search queries from taste map data for probe image sourcing.
 *
 * Takes the probe's design direction and generates relevant Unsplash search terms.
 */
export function buildImageQueries(probeStyle: {
  mood: string;
  colorDirection: string;
  context: string; // "landing_hero" | "dashboard" | "saas" etc.
}): string[] {
  const queries: string[] = [];

  // Hero/background image
  const moodTerms: Record<string, string[]> = {
    dark: ['dark moody', 'noir atmosphere', 'dark editorial'],
    warm: ['warm golden light', 'sunset warmth', 'amber tone'],
    cold: ['cool blue', 'icy minimal', 'steel blue tone'],
    nature: ['lush nature', 'botanical', 'organic landscape'],
    tech: ['futuristic technology', 'digital abstract', 'tech workspace'],
    editorial: ['editorial photography', 'magazine aesthetic', 'fashion editorial'],
    minimal: ['minimal architecture', 'clean space', 'geometric minimal'],
    cosmic: ['cosmic space', 'nebula stars', 'celestial dark'],
    urban: ['urban architecture', 'city night', 'metropolitan'],
  };

  // Pick relevant mood queries
  const mood = probeStyle.mood.toLowerCase();
  for (const [key, terms] of Object.entries(moodTerms)) {
    if (mood.includes(key)) {
      queries.push(terms[Math.floor(Math.random() * terms.length)]);
    }
  }

  // Context-specific queries
  if (probeStyle.context.includes('hero') || probeStyle.context.includes('landing')) {
    queries.push('dramatic background landscape');
  }

  // Fallback
  if (queries.length === 0) {
    queries.push('abstract texture background');
    queries.push('modern architecture minimal');
  }

  return queries.slice(0, 3); // Max 3 queries
}
