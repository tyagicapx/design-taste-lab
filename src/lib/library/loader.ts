/**
 * Screenshot Library — Loader & Query Engine
 *
 * Loads the library manifest and provides filtering/matching functions
 * used by extraction methods to find relevant screenshots.
 */

import fs from 'fs';
import path from 'path';
import type { LibraryScreenshot, LibraryCategory } from './types';
import type { TasteMap } from '../types';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'library', 'manifest.json');

let _cache: LibraryScreenshot[] | null = null;

/**
 * Pre-computed axis index: buckets screenshots into ranges of 10 per axis.
 * Buckets: 0-9, 10-19, ..., 90-100. Each bucket holds screenshot indices.
 * This turns matchToTasteMap from O(N×A) to O(candidates×A) where candidates << N.
 */
type AxisIndex = Map<string, Map<number, number[]>>; // axis -> bucket -> [manifest indices]
let _axisIndex: AxisIndex | null = null;
const BUCKET_SIZE = 10;

function buildAxisIndex(library: LibraryScreenshot[]): AxisIndex {
  const index: AxisIndex = new Map();
  for (let i = 0; i < library.length; i++) {
    for (const [axis, value] of Object.entries(library[i].axes_hint)) {
      if (value === undefined) continue;
      if (!index.has(axis)) index.set(axis, new Map());
      const bucket = Math.min(Math.floor(value / BUCKET_SIZE), 9);
      const axisMap = index.get(axis)!;
      if (!axisMap.has(bucket)) axisMap.set(bucket, []);
      axisMap.get(bucket)!.push(i);
    }
  }
  return index;
}

/**
 * Get candidate screenshot indices that are within ±range of a target value on an axis.
 * Returns indices into the manifest array.
 */
function getCandidateIndices(axis: string, target: number, range: number): Set<number> {
  if (!_axisIndex) return new Set();
  const axisMap = _axisIndex.get(axis);
  if (!axisMap) return new Set();

  const minBucket = Math.max(0, Math.floor((target - range) / BUCKET_SIZE));
  const maxBucket = Math.min(9, Math.floor((target + range) / BUCKET_SIZE));
  const indices = new Set<number>();
  for (let b = minBucket; b <= maxBucket; b++) {
    const bucket = axisMap.get(b);
    if (bucket) for (const idx of bucket) indices.add(idx);
  }
  return indices;
}

/**
 * Load the full library manifest. Cached after first load.
 * Also builds the axis index for fast matching.
 */
export function loadLibrary(): LibraryScreenshot[] {
  if (_cache) return _cache;

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn('Library manifest not found at', MANIFEST_PATH);
    return [];
  }

  const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  _cache = JSON.parse(raw) as LibraryScreenshot[];
  _axisIndex = buildAxisIndex(_cache);
  return _cache;
}

/**
 * Invalidate cache (after new screenshots are added).
 */
export function invalidateLibraryCache(): void {
  _cache = null;
  _axisIndex = null;
}

/**
 * Filter library by category.
 */
export function filterByCategory(category: LibraryCategory): LibraryScreenshot[] {
  return loadLibrary().filter((s) => s.category === category);
}

/**
 * Filter by multiple categories.
 */
export function filterByCategories(categories: LibraryCategory[]): LibraryScreenshot[] {
  const set = new Set(categories);
  return loadLibrary().filter((s) => set.has(s.category));
}

/**
 * Filter by style tags.
 */
export function filterByTags(
  filters: Partial<LibraryScreenshot['tags']>
): LibraryScreenshot[] {
  const library = loadLibrary();
  return library.filter((s) => {
    for (const [key, value] of Object.entries(filters)) {
      if (s.tags[key as keyof LibraryScreenshot['tags']] !== value) return false;
    }
    return true;
  });
}

/**
 * Find screenshots that best match a taste map.
 *
 * Scores each screenshot by how close its axes_hint values are to the
 * taste map positions. Returns sorted by relevance (best match first).
 */
export function matchToTasteMap(
  tasteMap: TasteMap,
  options?: {
    categories?: LibraryCategory[];
    limit?: number;
    theme?: 'dark' | 'light';
  }
): LibraryScreenshot[] {
  const library = loadLibrary();
  if (library.length === 0) return [];

  // Use the axis index to narrow candidates: gather indices near the taste map values
  // Use a generous ±30 range to not miss good matches, then score precisely
  const tasteEntries = Object.entries(tasteMap);
  let candidateIndices: Set<number> | null = null;

  if (_axisIndex && tasteEntries.length > 0) {
    // Union candidates from the top 3 highest-confidence axes
    const topAxes = tasteEntries
      .sort((a, b) => b[1].confidence - a[1].confidence)
      .slice(0, 3);

    for (const [axisId, axis] of topAxes) {
      const axCandidates = getCandidateIndices(axisId, axis.position, 30);
      if (candidateIndices === null) {
        candidateIndices = axCandidates;
      } else {
        // Union — we want any screenshot that's close on at least one top axis
        for (const idx of axCandidates) candidateIndices.add(idx);
      }
    }
  }

  // Build candidate list from indices (or fallback to full library)
  let candidates: LibraryScreenshot[];
  if (candidateIndices && candidateIndices.size > 0) {
    candidates = [...candidateIndices].map((i) => library[i]);
  } else {
    candidates = library;
  }

  // Apply category/theme filters
  if (options?.categories?.length) {
    const set = new Set(options.categories);
    candidates = candidates.filter((s) => set.has(s.category));
  }
  if (options?.theme) {
    candidates = candidates.filter((s) => s.tags.theme === options.theme || s.tags.theme === 'mixed');
  }

  // Score each candidate by axis distance
  const scored = candidates.map((screenshot) => {
    let totalDistance = 0;
    let axesMatched = 0;

    for (const [axisId, hintValue] of Object.entries(screenshot.axes_hint)) {
      if (hintValue === undefined) continue;
      const tasteAxis = tasteMap[axisId];
      if (!tasteAxis) continue;

      const distance = Math.abs(tasteAxis.position - hintValue) / 100;
      const weight = tasteAxis.confidence;
      totalDistance += distance * weight;
      axesMatched++;
    }

    const avgDistance = axesMatched > 0 ? totalDistance / axesMatched : 1;
    return { screenshot, score: 1 - avgDistance, axesMatched };
  });

  scored.sort((a, b) => b.score - a.score);

  const limit = options?.limit || 20;
  return scored.slice(0, limit).map((s) => s.screenshot);
}

/**
 * Find screenshots that CONTRAST with a taste map.
 *
 * Used for "What's Wrong?" to find designs that are close but deliberately
 * different on specific axes.
 */
export function findContrastingScreenshots(
  tasteMap: TasteMap,
  targetAxis: string,
  options?: {
    categories?: LibraryCategory[];
    limit?: number;
  }
): LibraryScreenshot[] {
  const library = loadLibrary();
  if (library.length === 0) return [];

  const tasteAxis = tasteMap[targetAxis];
  if (!tasteAxis) return library.slice(0, options?.limit || 5);

  // Use index to find screenshots FAR from the target axis value
  // If user is at 20, look for screenshots in the 50-100 range (and vice versa)
  let candidates: LibraryScreenshot[];
  if (_axisIndex) {
    const farIndices = new Set<number>();
    const target = tasteAxis.position;
    // Get buckets on the opposite side of the spectrum
    const axisMap = _axisIndex.get(targetAxis);
    if (axisMap) {
      for (const [bucket, indices] of axisMap) {
        const bucketCenter = bucket * BUCKET_SIZE + BUCKET_SIZE / 2;
        if (Math.abs(bucketCenter - target) >= 25) { // At least 25 points away
          for (const idx of indices) farIndices.add(idx);
        }
      }
    }
    candidates = farIndices.size > 0
      ? [...farIndices].map((i) => library[i])
      : library; // Fallback to full scan
  } else {
    candidates = library;
  }

  if (options?.categories?.length) {
    const set = new Set(options.categories);
    candidates = candidates.filter((s) => set.has(s.category));
  }

  // Score: high on all OTHER axes (close match) but far on the TARGET axis
  const scored = candidates.map((screenshot) => {
    const hintValue = screenshot.axes_hint[targetAxis as keyof LibraryScreenshot['axes_hint']];
    if (hintValue === undefined) return { screenshot, score: -1 };

    const targetDistance = Math.abs(tasteAxis.position - hintValue) / 100;

    let otherCloseness = 0;
    let otherCount = 0;
    for (const [axisId, hint] of Object.entries(screenshot.axes_hint)) {
      if (axisId === targetAxis || hint === undefined) continue;
      const taste = tasteMap[axisId];
      if (!taste) continue;
      otherCloseness += 1 - Math.abs(taste.position - hint) / 100;
      otherCount++;
    }
    const avgCloseness = otherCount > 0 ? otherCloseness / otherCount : 0.5;

    const score = targetDistance * 0.6 + avgCloseness * 0.4;
    return { screenshot, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, options?.limit || 5)
    .map((s) => s.screenshot);
}

/**
 * Get random screenshots for onboarding "pick what you like" grid.
 * Ensures diversity across categories and styles.
 */
export function getOnboardingGrid(count = 16): LibraryScreenshot[] {
  const library = loadLibrary();
  if (library.length === 0) return [];

  // Group by category
  const byCategory = new Map<string, LibraryScreenshot[]>();
  for (const s of library) {
    const list = byCategory.get(s.category) || [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  // Pick evenly from each category
  const result: LibraryScreenshot[] = [];
  const categories = [...byCategory.keys()];
  let catIdx = 0;

  while (result.length < count && categories.length > 0) {
    const cat = categories[catIdx % categories.length];
    const list = byCategory.get(cat)!;
    if (list.length === 0) {
      categories.splice(catIdx % categories.length, 1);
      continue;
    }
    const randomIdx = Math.floor(Math.random() * list.length);
    result.push(list.splice(randomIdx, 1)[0]);
    catIdx++;
  }

  return result;
}
