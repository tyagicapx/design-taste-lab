/**
 * Manifest Updater
 *
 * Scans public/library/ for new screenshot images that aren't in the manifest
 * and adds placeholder entries. Tags should be updated manually or via the
 * library submission form.
 *
 * Usage:
 *   npx tsx scripts/update-manifest.ts
 */

import fs from 'fs';
import path from 'path';
import type { LibraryScreenshot, LibraryCategory } from '../src/lib/library/types';

const LIBRARY_DIR = path.join(process.cwd(), 'public', 'library');
const MANIFEST_PATH = path.join(LIBRARY_DIR, 'manifest.json');

const VALID_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

function loadManifest(): LibraryScreenshot[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function scanLibraryDir(): { category: string; filename: string; imagePath: string }[] {
  const results: { category: string; filename: string; imagePath: string }[] = [];

  if (!fs.existsSync(LIBRARY_DIR)) return results;

  const categories = fs.readdirSync(LIBRARY_DIR).filter((f) => {
    const fullPath = path.join(LIBRARY_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const cat of categories) {
    const catDir = path.join(LIBRARY_DIR, cat);
    const files = fs.readdirSync(catDir).filter((f) =>
      VALID_EXTENSIONS.has(path.extname(f).toLowerCase())
    );

    for (const file of files) {
      results.push({
        category: cat,
        filename: file,
        imagePath: `/library/${cat}/${file}`,
      });
    }
  }

  return results;
}

function main() {
  const manifest = loadManifest();
  const existingPaths = new Set(manifest.map((m) => m.image_path));

  const allImages = scanLibraryDir();
  const newImages = allImages.filter((img) => !existingPaths.has(img.imagePath));

  if (newImages.length === 0) {
    console.log('✅ Manifest is up to date. No new images found.');
    return;
  }

  console.log(`\n📝 Found ${newImages.length} new images not in manifest:\n`);

  for (const img of newImages) {
    const slug = path.basename(img.filename, path.extname(img.filename));
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const entry: LibraryScreenshot = {
      id: `ss_${slug}`,
      url: '', // Needs to be filled in manually
      name,
      category: img.category as LibraryCategory,
      surface: 'marketing_landing',
      tags: {
        theme: 'light',
        density: 'balanced',
        typography: 'balanced',
        color_temp: 'neutral',
        surface_style: 'flat_modern',
        nav_style: 'minimal_topbar',
        era: '2025_trend',
        brand_tier: 'indie',
      },
      axes_hint: {},
      image_path: img.imagePath,
      source: 'chrome-capture',
      captured_at: new Date().toISOString().split('T')[0],
    };

    manifest.push(entry);
    console.log(`  + ${img.imagePath} → "${name}" (${img.category})`);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifest updated. Total entries: ${manifest.length}`);
  console.log(`⚠️  New entries have placeholder tags — update them in manifest.json`);
}

main();
