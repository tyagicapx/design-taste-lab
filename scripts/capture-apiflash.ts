/**
 * APIFlash Screenshot Capture Script
 *
 * Captures all 700 seed URLs via APIFlash API.
 * Simple HTTP GET per screenshot — no browser needed.
 *
 * Usage:
 *   npx tsx scripts/capture-apiflash.ts [--limit 10] [--category landing_saas] [--resume]
 *
 * Options:
 *   --limit      Max screenshots to capture (for testing)
 *   --category   Only capture a specific category
 *   --resume     Skip URLs that already have screenshots
 *   --delay      Delay between requests in ms (default: 1500)
 */

import fs from 'fs';
import path from 'path';

const LIBRARY_DIR = path.join(process.cwd(), 'public', 'library');
const MANIFEST_PATH = path.join(LIBRARY_DIR, 'manifest.json');
const SEED_PATH = path.join(process.cwd(), 'src', 'lib', 'library', 'seed-urls.json');

const API_KEY = process.env.APIFLASH_ACCESS_KEY ?? '';
if (!API_KEY) {
  console.error('ERROR: APIFLASH_ACCESS_KEY environment variable is required.\nGet one at: https://apiflash.com/');
  process.exit(1);
}
const API_BASE = 'https://api.apiflash.com/v1/urltoimage';

// High quality settings
const SCREENSHOT_CONFIG = {
  width: 1440,
  height: 900,
  format: 'png',
  quality: 100,
  full_page: false,        // Viewport only — above the fold
  scroll_page: true,       // Scroll first to trigger lazy loading
  delay: 8,                // Wait 8 seconds for page to fully load
  fresh: true,             // Don't use cached screenshots
  response_type: 'image',
};

interface SeedEntry {
  url: string;
  name: string;
  theme: string;
  density: string;
  typography: string;
  color_temp: string;
  surface_style: string;
}

interface SeedData {
  categories: Record<string, { target: number; entries: SeedEntry[] }>;
}

interface ManifestEntry {
  id: string;
  url: string;
  name: string;
  category: string;
  surface: string;
  tags: Record<string, string>;
  axes_hint: Record<string, number>;
  image_path: string;
  source: string;
  captured_at: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

function loadManifest(): ManifestEntry[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest: ManifestEntry[]): void {
  if (!fs.existsSync(LIBRARY_DIR)) fs.mkdirSync(LIBRARY_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

async function captureScreenshot(url: string, outputPath: string): Promise<boolean> {
  const params = new URLSearchParams({
    access_key: API_KEY,
    url: url,
    width: String(SCREENSHOT_CONFIG.width),
    height: String(SCREENSHOT_CONFIG.height),
    format: SCREENSHOT_CONFIG.format,
    quality: String(SCREENSHOT_CONFIG.quality),
    full_page: String(SCREENSHOT_CONFIG.full_page),
    scroll_page: String(SCREENSHOT_CONFIG.scroll_page),
    delay: String(SCREENSHOT_CONFIG.delay),
    fresh: String(SCREENSHOT_CONFIG.fresh),
    response_type: SCREENSHOT_CONFIG.response_type,
  });

  const apiUrl = `${API_BASE}?${params.toString()}`;

  try {
    const res = await fetch(apiUrl);

    if (!res.ok) {
      const text = await res.text();
      console.error(`    API error (${res.status}): ${text.slice(0, 100)}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Sanity check — real screenshots should be at least 50KB
    if (buffer.length < 50000) {
      console.error(`    Suspiciously small (${(buffer.length / 1024).toFixed(0)}KB) — might be an error page`);
      return false;
    }

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (err) {
    console.error(`    Network error: ${err instanceof Error ? err.message : 'unknown'}`);
    return false;
  }
}

function getSurfaceForCategory(category: string): string {
  const map: Record<string, string> = {
    landing_saas: 'marketing_landing',
    landing_creative: 'marketing_landing',
    landing_ecommerce: 'marketing_landing',
    dashboard_analytics: 'product_web_app',
    dashboard_admin: 'product_web_app',
    mobile_ios: 'mobile_app',
    mobile_android: 'mobile_app',
    product_onboarding: 'product_web_app',
    product_pricing: 'marketing_landing',
    portfolio: 'editorial',
    dark_mode: 'marketing_landing',
    trending_2026: 'marketing_landing',
    legacy_brand: 'marketing_landing',
  };
  return map[category] || 'marketing_landing';
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
  const categoryFilter = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
  const resume = args.includes('--resume');
  const delayMs = args.includes('--delay') ? parseInt(args[args.indexOf('--delay') + 1], 10) : 1500;

  // Load seed URLs
  const seedData: SeedData = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  const manifest = loadManifest();
  const existingUrls = new Set(manifest.map((m) => m.url));

  // Build flat list of all entries
  const allEntries: { category: string; entry: SeedEntry }[] = [];
  for (const [category, data] of Object.entries(seedData.categories)) {
    if (categoryFilter && category !== categoryFilter) continue;
    for (const entry of data.entries) {
      allEntries.push({ category, entry });
    }
  }

  console.log(`\n📸 APIFlash Screenshot Capture`);
  console.log(`   Total URLs: ${allEntries.length}`);
  console.log(`   Already captured: ${existingUrls.size}`);
  console.log(`   Limit: ${limitArg === Infinity ? 'none' : limitArg}`);
  console.log(`   Delay: ${delayMs}ms between requests`);
  console.log(`   Quality: ${SCREENSHOT_CONFIG.width}x${SCREENSHOT_CONFIG.height} PNG, ${SCREENSHOT_CONFIG.delay}s page load wait`);
  console.log(`\n`);

  let captured = 0;
  let skipped = 0;
  let failed = 0;
  let total = 0;

  for (const { category, entry } of allEntries) {
    if (total >= limitArg) break;

    // Skip if already captured and resuming
    if (resume && existingUrls.has(entry.url)) {
      skipped++;
      total++;
      continue;
    }

    const slug = slugify(entry.name);
    const imagePath = `/library/${category}/${slug}.png`;
    const absolutePath = path.join(process.cwd(), 'public', imagePath);

    // Skip if file already exists on disk
    if (resume && fs.existsSync(absolutePath)) {
      skipped++;
      total++;
      continue;
    }

    total++;
    process.stdout.write(`  [${total}/${Math.min(allEntries.length, limitArg)}] ${entry.name} (${category})... `);

    const success = await captureScreenshot(entry.url, absolutePath);

    if (success) {
      captured++;
      const fileSize = (fs.statSync(absolutePath).size / 1024).toFixed(0);
      console.log(`✓ (${fileSize}KB)`);

      // Add to manifest
      const manifestEntry: ManifestEntry = {
        id: `ss_${slug}`,
        url: entry.url,
        name: entry.name,
        category,
        surface: getSurfaceForCategory(category),
        tags: {
          theme: entry.theme,
          density: entry.density,
          typography: entry.typography,
          color_temp: entry.color_temp,
          surface_style: entry.surface_style,
          nav_style: 'minimal_topbar',
          era: '2025_trend',
          brand_tier: 'premium_startup',
        },
        axes_hint: {},
        image_path: imagePath,
        source: 'apiflash',
        captured_at: new Date().toISOString().split('T')[0],
      };

      // Replace if exists, otherwise add
      const existingIdx = manifest.findIndex((m) => m.url === entry.url);
      if (existingIdx >= 0) {
        manifest[existingIdx] = manifestEntry;
      } else {
        manifest.push(manifestEntry);
      }

      // Save manifest after every capture (crash-safe)
      saveManifest(manifest);
    } else {
      failed++;
      console.log(`✗`);
    }

    // Rate limiting delay
    if (total < Math.min(allEntries.length, limitArg)) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Captured: ${captured}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total in manifest: ${manifest.length}`);
  console.log(`   API calls used: ${captured} of 1,000 monthly quota`);
  console.log(`\n`);
}

main().catch(console.error);
