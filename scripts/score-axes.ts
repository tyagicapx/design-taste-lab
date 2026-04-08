/**
 * Axes Scorer — Batch Claude Vision Analysis
 *
 * Sends each library screenshot to Claude Opus 4.6 Vision to score 11 design axes (0-100).
 * Populates the `axes_hint` field in manifest.json.
 *
 * Usage:
 *   npx tsx scripts/score-axes.ts [--limit 10] [--category landing_saas] [--resume] [--concurrency 3]
 *
 * Options:
 *   --limit        Max screenshots to process (for testing)
 *   --category     Only process a specific category
 *   --resume       Skip entries that already have non-empty axes_hint
 *   --concurrency  Parallel API calls (default: 3)
 *   --model        Override scoring model (default: claude-sonnet-4-6-20260414)
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const LIBRARY_DIR = path.join(process.cwd(), 'public', 'library');
const MANIFEST_PATH = path.join(LIBRARY_DIR, 'manifest.json');

const DEFAULT_MODEL = 'claude-opus-4-6';

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

type AxesHint = {
  structure_density: number;
  structure_symmetry: number;
  type_drama: number;
  type_expression: number;
  surface_depth: number;
  surface_warmth: number;
  color_chromaticity: number;
  color_temperature: number;
  color_contrast: number;
  personality_energy: number;
  personality_era: number;
};

const AXES_PROMPT = `Score this website screenshot on 11 visual design axes. Each axis is a scale from 0 to 100.

AXES:
1. structure_density: 0 = Dense (packed, lots of content) → 100 = Breathable (spacious, generous whitespace)
2. structure_symmetry: 0 = Symmetrical (centered, mirrored layout) → 100 = Asymmetrical (off-center, dynamic)
3. type_drama: 0 = Restrained (small, uniform, quiet type) → 100 = Dramatic (large headlines, bold contrasts)
4. type_expression: 0 = Neutral (standard system/sans fonts) → 100 = Expressive (distinctive, characterful fonts)
5. surface_depth: 0 = Quiet depth (flat or very subtle shadows) → 100 = Visible depth (clear shadows, layers, elevation)
6. surface_warmth: 0 = Sterile (clinical, cold surfaces) → 100 = Warm materiality (textured, organic, friendly)
7. color_chromaticity: 0 = Neutral-led (grays, blacks, whites dominate) → 100 = Chromatic-led (vivid colors dominate)
8. color_temperature: 0 = Cold (blue tones, cool grays) → 100 = Warm (orange, amber, warm grays)
9. color_contrast: 0 = High contrast (stark black/white, sharp edges) → 100 = Low-contrast atmosphere (soft, muted, blended)
10. personality_energy: 0 = Premium calm (serene, luxury, unhurried) → 100 = Internet-native energy (sharp, dynamic, fast)
11. personality_era: 0 = Timeless (classic, could be from any decade) → 100 = Trend-aware (clearly 2024-2026 design trends)

RULES:
- Look at the ACTUAL visual design, not the content/text
- Be precise — don't default to 50 for everything. Use the full range.
- Consider: spacing, font choices, color palette, shadows, layout structure, visual rhythm
- A dark theme doesn't automatically mean "cold" — dark sites can feel warm

Respond with ONLY a JSON object, no markdown, no explanation:
{"structure_density": N, "structure_symmetry": N, "type_drama": N, "type_expression": N, "surface_depth": N, "surface_warmth": N, "color_chromaticity": N, "color_temperature": N, "color_contrast": N, "personality_energy": N, "personality_era": N}`;

function loadManifest(): ManifestEntry[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest: ManifestEntry[]): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function hasAxesHint(entry: ManifestEntry): boolean {
  return Object.keys(entry.axes_hint).length > 0;
}

function imageToBase64(filePath: string): { base64: string; mediaType: string } {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mediaTypeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  return { base64, mediaType: mediaTypeMap[ext] || 'image/png' };
}

async function scoreScreenshot(
  client: Anthropic,
  imagePath: string,
  model: string
): Promise<AxesHint | null> {
  const absolutePath = path.join(process.cwd(), 'public', imagePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`    File not found: ${absolutePath}`);
    return null;
  }

  const { base64, mediaType } = imageToBase64(absolutePath);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
                data: base64,
              },
            },
            { type: 'text', text: AXES_PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`    No JSON found in response`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as AxesHint;

    // Validate all 11 axes are present and in range
    const axisKeys: (keyof AxesHint)[] = [
      'structure_density', 'structure_symmetry', 'type_drama', 'type_expression',
      'surface_depth', 'surface_warmth', 'color_chromaticity', 'color_temperature',
      'color_contrast', 'personality_energy', 'personality_era',
    ];

    for (const key of axisKeys) {
      if (typeof parsed[key] !== 'number' || parsed[key] < 0 || parsed[key] > 100) {
        console.error(`    Invalid value for ${key}: ${parsed[key]}`);
        return null;
      }
    }

    return parsed;
  } catch (err) {
    console.error(`    API error: ${err instanceof Error ? err.message : 'unknown'}`);
    return null;
  }
}


async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
  const categoryFilter = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
  const resume = args.includes('--resume');
  const concurrency = args.includes('--concurrency') ? parseInt(args[args.indexOf('--concurrency') + 1], 10) : 3;
  const modelOverride = args.includes('--model') ? args[args.indexOf('--model') + 1] : null;
  const scoringModel = modelOverride || DEFAULT_MODEL;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const manifest = loadManifest();

  // Filter entries to process
  let entries = manifest.map((entry, idx) => ({ entry, idx }));

  if (categoryFilter) {
    entries = entries.filter(({ entry }) => entry.category === categoryFilter);
  }
  if (resume) {
    entries = entries.filter(({ entry }) => !hasAxesHint(entry));
  }
  if (limitArg !== Infinity) {
    entries = entries.slice(0, limitArg);
  }

  const totalInManifest = manifest.length;
  const alreadyScored = manifest.filter(hasAxesHint).length;

  console.log(`\n🎯 Axes Scorer — Claude Vision Batch`);
  console.log(`   Total in manifest: ${totalInManifest}`);
  console.log(`   Already scored: ${alreadyScored}`);
  console.log(`   To process: ${entries.length}`);
  console.log(`   Model: ${scoringModel}`);
  console.log(`   Concurrency: ${concurrency}`);
  console.log(`\n`);

  let scored = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    const { entry, idx } = entries[i];
    const processedCount = i + 1;

    process.stdout.write(
      `  [${processedCount}/${entries.length}] ${entry.name} (${entry.category})... `
    );

    const scores = await scoreScreenshot(client, entry.image_path, scoringModel);

    if (!scores) {
      failed++;
      console.log(`✗`);
      continue;
    }

    manifest[idx].axes_hint = scores;
    scored++;

    const preview = `d:${scores.structure_density} t:${scores.type_drama} c:${scores.color_chromaticity} e:${scores.personality_energy}`;
    console.log(`✓ (${preview})`);

    // Crash-safe: save after every entry
    saveManifest(manifest);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Scored: ${scored}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total scored in manifest: ${manifest.filter(hasAxesHint).length} / ${totalInManifest}`);
  console.log(`\n`);
}

main().catch(console.error);
