/**
 * Curated Website Library
 *
 * A hand-tagged collection of real websites organized by design taste axes.
 * Used to select relevant real-site probes during calibration rounds.
 *
 * Each site is tagged with taste axis positions so we can match them
 * against the user's evolving taste map.
 *
 * EASY TO EDIT: Just add/remove entries from the SITES array.
 */

export interface CuratedSite {
  url: string;
  name: string;
  description: string;
  /** Taste axis tags — keys are axis IDs, values are approximate positions (0-100) */
  axes: Record<string, number>;
  /** Which surface context this site best represents */
  surface: 'web' | 'app' | 'both';
  /** Primary design family */
  family: string;
}

export const CURATED_SITES: CuratedSite[] = [
  // ─── Minimal / Editorial / Premium ───
  {
    url: 'https://linear.app',
    name: 'Linear',
    description: 'Clean product UI with invisible system chrome, dark theme, tight density',
    axes: {
      structure_density: 35,      // breathable-leaning
      surface_containment: 15,    // borderless
      surface_depth: 40,          // quiet depth
      personality_energy: 30,     // calm
      personality_visibility: 25, // invisible system
      color_chromaticity: 25,     // neutral-led
      type_drama: 30,             // restrained
      surface_finish: 20,         // matte
    },
    surface: 'app',
    family: 'minimal-dark-product',
  },
  {
    url: 'https://vercel.com',
    name: 'Vercel',
    description: 'Sharp dark theme, dramatic typography, clean grid, developer-focused',
    axes: {
      structure_density: 40,
      surface_containment: 20,
      type_drama: 65,
      personality_energy: 60,
      color_chromaticity: 20,
      surface_finish: 25,
      surface_depth: 45,
      personality_era: 75, // trend-aware
    },
    surface: 'web',
    family: 'sharp-dark-tech',
  },
  {
    url: 'https://stripe.com',
    name: 'Stripe',
    description: 'Premium light theme, editorial typography, rich gradients, breathable',
    axes: {
      structure_density: 70,      // very breathable
      type_drama: 55,
      color_chromaticity: 55,     // chromatic moments
      surface_warmth: 45,
      personality_energy: 50,
      surface_depth: 60,          // visible depth (gradients)
      personality_tone: 35,       // professional
      type_function: 50,          // balanced editorial/product
    },
    surface: 'web',
    family: 'premium-editorial-light',
  },
  {
    url: 'https://notion.so',
    name: 'Notion',
    description: 'Warm minimal, generous whitespace, friendly typography, light clean',
    axes: {
      structure_density: 65,
      surface_containment: 30,
      surface_warmth: 65,
      personality_tone: 55,       // slightly playful
      type_expression: 40,
      color_chromaticity: 20,
      personality_visibility: 30,
      surface_finish: 20,
    },
    surface: 'app',
    family: 'warm-minimal-product',
  },
  {
    url: 'https://arc.net',
    name: 'Arc Browser',
    description: 'Colorful, playful, modern UI with personality, bold shapes',
    axes: {
      color_chromaticity: 75,
      personality_tone: 70,       // playful
      personality_energy: 70,
      surface_warmth: 60,
      type_expression: 65,
      surface_depth: 55,
      personality_era: 80,        // very trend-aware
      structure_symmetry: 55,     // slightly asymmetric
    },
    surface: 'both',
    family: 'colorful-playful-modern',
  },
  {
    url: 'https://raycast.com',
    name: 'Raycast',
    description: 'Dark utility-first, sharp gradients, developer tool aesthetic, dense info',
    axes: {
      structure_density: 30,      // dense
      surface_containment: 35,
      personality_energy: 65,
      color_chromaticity: 45,
      type_drama: 50,
      surface_finish: 30,
      personality_priority: 30,   // utility-first
      surface_depth: 55,
    },
    surface: 'web',
    family: 'dark-utility-developer',
  },
  {
    url: 'https://tailwindcss.com',
    name: 'Tailwind CSS',
    description: 'Technical but beautiful, code-centric, clear hierarchy, dark base',
    axes: {
      type_function: 75,          // very product-functional
      structure_density: 45,
      personality_priority: 25,   // utility-first
      color_chromaticity: 40,
      type_drama: 45,
      surface_containment: 40,
      personality_era: 65,
      surface_finish: 25,
    },
    surface: 'web',
    family: 'technical-documentation',
  },
  {
    url: 'https://resend.com',
    name: 'Resend',
    description: 'Ultra-clean dark product page, minimal chrome, developer API focus',
    axes: {
      structure_density: 60,
      surface_containment: 15,
      type_drama: 55,
      personality_energy: 45,
      color_chromaticity: 15,
      surface_finish: 20,
      surface_depth: 35,
      personality_visibility: 20,
    },
    surface: 'web',
    family: 'minimal-dark-product',
  },
  {
    url: 'https://supabase.com',
    name: 'Supabase',
    description: 'Dark emerald-accented, developer-friendly, technical but approachable',
    axes: {
      color_chromaticity: 50,
      color_accent: 60,
      personality_energy: 55,
      surface_containment: 35,
      type_drama: 50,
      surface_finish: 30,
      personality_priority: 40,
      surface_depth: 50,
    },
    surface: 'web',
    family: 'dark-accent-developer',
  },
  {
    url: 'https://liveblocks.io',
    name: 'Liveblocks',
    description: 'Light clean, soft shadows, rounded components, friendly developer tool',
    axes: {
      surface_warmth: 50,
      surface_containment: 45,
      surface_depth: 55,
      color_chromaticity: 35,
      personality_tone: 50,
      type_drama: 40,
      structure_density: 55,
      personality_energy: 45,
    },
    surface: 'web',
    family: 'light-soft-product',
  },
  {
    url: 'https://cal.com',
    name: 'Cal.com',
    description: 'Clean utility product, minimal dark option, functional grid, clear actions',
    axes: {
      personality_priority: 30,
      structure_density: 40,
      surface_containment: 40,
      type_function: 70,
      color_chromaticity: 20,
      personality_visibility: 50,
      personality_action: 65,
      surface_finish: 20,
    },
    surface: 'app',
    family: 'utility-product-clean',
  },
  {
    url: 'https://read.cv',
    name: 'Read.cv',
    description: 'Ultra-minimal editorial, generous whitespace, serif touches, warm light',
    axes: {
      structure_density: 80,      // very breathable
      type_function: 30,          // editorial
      type_expression: 55,
      surface_containment: 10,    // almost no borders
      surface_warmth: 65,
      color_chromaticity: 10,     // very neutral
      personality_energy: 20,     // very calm
      type_drama: 45,
    },
    surface: 'web',
    family: 'ultra-minimal-editorial',
  },
  {
    url: 'https://pitch.com',
    name: 'Pitch',
    description: 'Colorful modern SaaS, bold CTAs, energetic gradients, friendly',
    axes: {
      color_chromaticity: 70,
      personality_energy: 70,
      personality_tone: 60,
      type_drama: 55,
      surface_depth: 60,
      surface_warmth: 55,
      personality_era: 75,
      personality_action: 70,
    },
    surface: 'web',
    family: 'colorful-modern-saas',
  },
  {
    url: 'https://craft.do',
    name: 'Craft',
    description: 'Apple-inspired, clean light, subtle depth, premium feel, restrained color',
    axes: {
      surface_warmth: 50,
      surface_depth: 50,
      personality_energy: 35,
      color_chromaticity: 20,
      type_expression: 35,
      structure_density: 65,
      surface_finish: 30,
      personality_visibility: 30,
    },
    surface: 'both',
    family: 'apple-inspired-premium',
  },
  {
    url: 'https://dub.co',
    name: 'Dub',
    description: 'Modern dark SaaS, clean product page, sharp typography, lime accents',
    axes: {
      surface_containment: 20,
      color_accent: 55,
      type_drama: 50,
      personality_energy: 55,
      structure_density: 55,
      surface_finish: 25,
      personality_era: 70,
      color_chromaticity: 35,
    },
    surface: 'web',
    family: 'modern-dark-saas',
  },
  {
    url: 'https://framer.com',
    name: 'Framer',
    description: 'Bold, creative, dramatic type, dark theme with colorful moments',
    axes: {
      type_drama: 80,
      personality_energy: 75,
      color_chromaticity: 55,
      surface_depth: 55,
      structure_rhythm: 70,       // cinematic
      personality_era: 80,
      type_expression: 75,
      personality_action: 65,
    },
    surface: 'web',
    family: 'bold-creative-dark',
  },
  {
    url: 'https://midday.ai',
    name: 'Midday',
    description: 'Clean dark fintech, minimal UI, serious utility, monospace touches',
    axes: {
      personality_priority: 25,
      structure_density: 40,
      surface_containment: 25,
      color_chromaticity: 15,
      type_function: 75,
      personality_energy: 35,
      surface_finish: 20,
      personality_tone: 25,       // very professional
    },
    surface: 'app',
    family: 'dark-fintech-utility',
  },
  {
    url: 'https://www.apple.com',
    name: 'Apple',
    description: 'Cinematic, large type, breathable, product-hero photography, premium',
    axes: {
      type_drama: 75,
      structure_density: 80,
      structure_rhythm: 80,       // very cinematic
      surface_warmth: 45,
      personality_energy: 45,
      color_chromaticity: 25,
      surface_depth: 50,
      personality_visibility: 20,
    },
    surface: 'web',
    family: 'cinematic-premium-brand',
  },
];

/**
 * Select sites from the library that are most relevant to a user's taste map.
 *
 * Uses cosine-similarity-style matching across shared axes.
 *
 * @param tasteMap - The user's current taste positions
 * @param count - Number of sites to return
 * @param surface - Filter by surface type
 * @param diversify - If true, pick from different families to maximize contrast
 */
export function selectRelevantSites(
  tasteMap: Record<string, { axisId: string; position: number; confidence: number }>,
  count: number,
  surface?: 'web' | 'app',
  diversify = true
): CuratedSite[] {
  // Filter by surface if specified
  let pool = surface
    ? CURATED_SITES.filter((s) => s.surface === surface || s.surface === 'both')
    : [...CURATED_SITES];

  // Score each site by how close it is to the user's taste
  const scored = pool.map((site) => {
    let totalDistance = 0;
    let matchedAxes = 0;

    for (const axis of Object.values(tasteMap)) {
      const sitePosition = site.axes[axis.axisId];
      if (sitePosition !== undefined) {
        const distance = Math.abs(axis.position - sitePosition);
        // Weight by confidence — high-confidence axes matter more
        totalDistance += distance * axis.confidence;
        matchedAxes++;
      }
    }

    const avgDistance = matchedAxes > 0 ? totalDistance / matchedAxes : 100;
    // Lower distance = better match (closer to taste)
    const score = 100 - avgDistance;

    return { site, score, family: site.family };
  });

  // Sort by score (best matches first)
  scored.sort((a, b) => b.score - a.score);

  if (!diversify) {
    return scored.slice(0, count).map((s) => s.site);
  }

  // Diversify: pick top match, then skip sites from the same family
  const selected: CuratedSite[] = [];
  const usedFamilies = new Set<string>();

  for (const { site, family } of scored) {
    if (selected.length >= count) break;

    if (!usedFamilies.has(family)) {
      selected.push(site);
      usedFamilies.add(family);
    }
  }

  // If we couldn't fill with unique families, add best remaining
  if (selected.length < count) {
    for (const { site } of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(site)) {
        selected.push(site);
      }
    }
  }

  return selected;
}

/**
 * Select CONTRASTING sites — picks sites that diverge from the user's taste.
 * Useful for Round 1 where we want maximum spread for calibration.
 */
export function selectContrastingSites(
  tasteMap: Record<string, { axisId: string; position: number; confidence: number }>,
  count: number
): CuratedSite[] {
  const scored = CURATED_SITES.map((site) => {
    let totalDistance = 0;
    let matchedAxes = 0;

    for (const axis of Object.values(tasteMap)) {
      const sitePosition = site.axes[axis.axisId];
      if (sitePosition !== undefined) {
        totalDistance += Math.abs(axis.position - sitePosition);
        matchedAxes++;
      }
    }

    const avgDistance = matchedAxes > 0 ? totalDistance / matchedAxes : 0;
    return { site, distance: avgDistance };
  });

  // Sort by distance (most different first)
  scored.sort((a, b) => b.distance - a.distance);

  // Pick from different families for max contrast
  const selected: CuratedSite[] = [];
  const usedFamilies = new Set<string>();

  for (const { site } of scored) {
    if (selected.length >= count) break;
    if (!usedFamilies.has(site.family)) {
      selected.push(site);
      usedFamilies.add(site.family);
    }
  }

  return selected;
}
