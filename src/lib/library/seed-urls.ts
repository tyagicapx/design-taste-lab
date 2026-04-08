/**
 * Seed URL List — ~53 curated websites for the screenshot library.
 *
 * Organized by category. Each entry has:
 * - url: the website URL
 * - name: brand/product name
 * - tags: pre-assigned style tags (refined after screenshot capture)
 *
 * To add more: submit a PR with the URL, name, category, and tags.
 * CI will auto-capture the screenshot via Puppeteer.
 */

import type { LibraryScreenshot } from './types';

type SeedEntry = Pick<LibraryScreenshot, 'url' | 'name' | 'category' | 'tags' | 'surface'> & {
  axes_hint?: Partial<LibraryScreenshot['axes_hint']>;
};

// ═══════════════════════════════════════════════════════════
// LANDING PAGES — SaaS (120)
// ═══════════════════════════════════════════════════════════

export const LANDING_SAAS: SeedEntry[] = [
  // Premium dark
  { url: 'https://linear.app', name: 'Linear', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' }, axes_hint: { structure_density: 25, type_drama: 85, color_temperature: 30, personality_energy: 70 } },
  { url: 'https://vercel.com', name: 'Vercel', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' }, axes_hint: { structure_density: 20, type_drama: 90, color_temperature: 25, personality_energy: 65 } },
  { url: 'https://stripe.com', name: 'Stripe', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'subtle_depth', nav_style: 'full_topbar', era: 'timeless', brand_tier: 'premium_startup' }, axes_hint: { structure_density: 30, type_drama: 75, color_temperature: 40, personality_energy: 60 } },
  { url: 'https://notion.so', name: 'Notion', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'premium_startup' }, axes_hint: { structure_density: 35, type_drama: 50, color_temperature: 65, personality_energy: 55 } },
  { url: 'https://raycast.com', name: 'Raycast', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'glassmorphism', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' }, axes_hint: { structure_density: 25, type_drama: 80, surface_depth: 60, personality_energy: 70 } },
  { url: 'https://arc.net', name: 'Arc Browser', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' }, axes_hint: { type_drama: 85, color_chromaticity: 70, personality_energy: 80 } },
  { url: 'https://figma.com', name: 'Figma', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'balanced', typography: 'dramatic', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' }, axes_hint: { type_drama: 80, color_chromaticity: 65, personality_energy: 75 } },
  { url: 'https://supabase.com', name: 'Supabase', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'balanced', typography: 'dramatic', color_temp: 'cool', surface_style: 'subtle_depth', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' }, axes_hint: { structure_density: 35, type_drama: 75, color_temperature: 35 } },
  { url: 'https://planetscale.com', name: 'PlanetScale', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://resend.com', name: 'Resend', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://dub.co', name: 'Dub', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'neutral', surface_style: 'subtle_depth', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://cal.com', name: 'Cal.com', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'balanced', typography: 'balanced', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'premium_startup' } },
  { url: 'https://clerk.com', name: 'Clerk', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'glassmorphism', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://railway.app', name: 'Railway', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://neon.tech', name: 'Neon', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'glassmorphism', nav_style: 'full_topbar', era: '2026_trend', brand_tier: 'premium_startup' } },
  { url: 'https://turso.tech', name: 'Turso', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://upstash.com', name: 'Upstash', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'balanced', typography: 'balanced', color_temp: 'cool', surface_style: 'subtle_depth', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://convex.dev', name: 'Convex', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://fly.io', name: 'Fly.io', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2024_trend', brand_tier: 'premium_startup' } },
  { url: 'https://tailwindcss.com', name: 'Tailwind CSS', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://framer.com', name: 'Framer', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2026_trend', brand_tier: 'premium_startup' } },
  { url: 'https://pitch.com', name: 'Pitch', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'premium_startup' } },
  { url: 'https://liveblocks.io', name: 'Liveblocks', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'cool', surface_style: 'subtle_depth', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://mintlify.com', name: 'Mintlify', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://loops.so', name: 'Loops', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'indie' } },
  { url: 'https://posthog.com', name: 'PostHog', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'balanced', typography: 'balanced', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'premium_startup' } },
  { url: 'https://hashnode.com', name: 'Hashnode', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'premium_startup' } },
  { url: 'https://planetfall.io', name: 'Planetfall', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'glassmorphism', nav_style: 'minimal_topbar', era: '2026_trend', brand_tier: 'indie' } },
  { url: 'https://cursor.sh', name: 'Cursor', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2026_trend', brand_tier: 'premium_startup' } },
  { url: 'https://v0.dev', name: 'v0', category: 'landing_saas', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2026_trend', brand_tier: 'premium_startup' } },
];

// ═══════════════════════════════════════════════════════════
// LANDING PAGES — Creative / Agency (60)
// ═══════════════════════════════════════════════════════════

export const LANDING_CREATIVE: SeedEntry[] = [
  { url: 'https://www.pentagram.com', name: 'Pentagram', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: 'timeless', brand_tier: 'legacy_giant' } },
  { url: 'https://www.sagmeisterwalsh.com', name: 'Sagmeister & Walsh', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'hidden', era: 'timeless', brand_tier: 'legacy_giant' } },
  { url: 'https://www.basicagency.com', name: 'Basic Agency', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2024_trend', brand_tier: 'agency' } },
  { url: 'https://makereign.com', name: 'Make Reign', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'hidden', era: '2025_trend', brand_tier: 'agency' } },
  { url: 'https://www.locomotive.ca', name: 'Locomotive', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'agency' } },
  { url: 'https://www.area17.com', name: 'Area 17', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'restrained', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: 'timeless', brand_tier: 'agency' } },
  { url: 'https://www.metalab.com', name: 'MetaLab', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2024_trend', brand_tier: 'agency' } },
  { url: 'https://www.instrument.com', name: 'Instrument', category: 'landing_creative', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'agency' } },
];

// ═══════════════════════════════════════════════════════════
// LEGACY BRANDS (40)
// ═══════════════════════════════════════════════════════════

export const LEGACY_BRANDS: SeedEntry[] = [
  { url: 'https://www.apple.com', name: 'Apple', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'full_topbar', era: 'timeless', brand_tier: 'legacy_giant' }, axes_hint: { structure_density: 15, type_drama: 90, surface_depth: 20, personality_energy: 50 } },
  { url: 'https://www.nike.com', name: 'Nike', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'light', density: 'balanced', typography: 'dramatic', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'full_topbar', era: 'timeless', brand_tier: 'legacy_giant' } },
  { url: 'https://www.airbnb.com', name: 'Airbnb', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'light', density: 'balanced', typography: 'balanced', color_temp: 'warm', surface_style: 'subtle_depth', nav_style: 'full_topbar', era: 'timeless', brand_tier: 'legacy_giant' } },
  { url: 'https://www.spotify.com', name: 'Spotify', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'dark', density: 'balanced', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'legacy_giant' } },
  { url: 'https://www.google.com/chrome', name: 'Google Chrome', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'neutral', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: 'timeless', brand_tier: 'legacy_giant' } },
  { url: 'https://www.tesla.com', name: 'Tesla', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: 'timeless', brand_tier: 'legacy_giant' } },
  { url: 'https://www.microsoft.com/en-us/microsoft-365', name: 'Microsoft 365', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'light', density: 'balanced', typography: 'balanced', color_temp: 'cool', surface_style: 'subtle_depth', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'legacy_giant' } },
  { url: 'https://www.dropbox.com', name: 'Dropbox', category: 'legacy_brand', surface: 'marketing_landing', tags: { theme: 'light', density: 'breathable', typography: 'balanced', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'legacy_giant' } },
];

// ═══════════════════════════════════════════════════════════
// DARK MODE SHOWCASE (60)
// ═══════════════════════════════════════════════════════════

export const DARK_MODE: SeedEntry[] = [
  { url: 'https://github.com', name: 'GitHub', category: 'dark_mode', surface: 'product_web_app', tags: { theme: 'dark', density: 'balanced', typography: 'restrained', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'legacy_giant' } },
  { url: 'https://warp.dev', name: 'Warp', category: 'dark_mode', surface: 'marketing_landing', tags: { theme: 'dark', density: 'breathable', typography: 'dramatic', color_temp: 'cool', surface_style: 'glassmorphism', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'premium_startup' } },
  { url: 'https://www.twitch.tv', name: 'Twitch', category: 'dark_mode', surface: 'product_web_app', tags: { theme: 'dark', density: 'dense', typography: 'restrained', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'legacy_giant' } },
  { url: 'https://discord.com', name: 'Discord', category: 'dark_mode', surface: 'marketing_landing', tags: { theme: 'dark', density: 'balanced', typography: 'balanced', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'full_topbar', era: '2024_trend', brand_tier: 'legacy_giant' } },
];

// ═══════════════════════════════════════════════════════════
// PORTFOLIOS (40)
// ═══════════════════════════════════════════════════════════

export const PORTFOLIOS: SeedEntry[] = [
  { url: 'https://www.seanhalpin.xyz', name: 'Sean Halpin', category: 'portfolio', surface: 'editorial', tags: { theme: 'light', density: 'breathable', typography: 'dramatic', color_temp: 'warm', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'indie' } },
  { url: 'https://brittanychiang.com', name: 'Brittany Chiang', category: 'portfolio', surface: 'editorial', tags: { theme: 'dark', density: 'breathable', typography: 'balanced', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2024_trend', brand_tier: 'indie' } },
  { url: 'https://leerob.io', name: 'Lee Robinson', category: 'portfolio', surface: 'editorial', tags: { theme: 'dark', density: 'breathable', typography: 'restrained', color_temp: 'cool', surface_style: 'flat_modern', nav_style: 'minimal_topbar', era: '2025_trend', brand_tier: 'indie' } },
];

// ═══════════════════════════════════════════════════════════
// ALL SEEDS — Combined
// ═══════════════════════════════════════════════════════════

export const ALL_SEED_URLS: SeedEntry[] = [
  ...LANDING_SAAS,
  ...LANDING_CREATIVE,
  ...LEGACY_BRANDS,
  ...DARK_MODE,
  ...PORTFOLIOS,
];
