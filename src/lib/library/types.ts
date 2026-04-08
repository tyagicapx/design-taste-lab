/**
 * Screenshot Library — Type Definitions
 *
 * Each screenshot in the library is tagged with category, surface type,
 * style axes, and brand metadata. This enables precise filtering for
 * extraction methods (What's Wrong, Drag to Match, Compare, etc.)
 */

export type LibraryCategory =
  | 'landing_saas'
  | 'landing_creative'
  | 'landing_ecommerce'
  | 'dashboard_analytics'
  | 'dashboard_admin'
  | 'mobile_ios'
  | 'mobile_android'
  | 'product_onboarding'
  | 'product_pricing'
  | 'portfolio'
  | 'dark_mode'
  | 'trending_2026'
  | 'legacy_brand';

export type StyleTheme = 'dark' | 'light' | 'mixed';
export type StyleDensity = 'breathable' | 'balanced' | 'dense';
export type StyleTypography = 'dramatic' | 'balanced' | 'restrained';
export type StyleColorTemp = 'cool' | 'neutral' | 'warm';
export type StyleSurface = 'flat_modern' | 'subtle_depth' | 'glassmorphism' | 'tactile' | 'brutalist';
export type StyleNav = 'minimal_topbar' | 'full_topbar' | 'sidebar' | 'bottom_tab' | 'hidden';
export type StyleEra = 'timeless' | '2024_trend' | '2025_trend' | '2026_trend';
export type BrandTier = 'legacy_giant' | 'premium_startup' | 'indie' | 'agency' | 'enterprise';

export interface LibraryScreenshot {
  id: string;
  url: string;
  name: string;
  category: LibraryCategory;
  surface: 'marketing_landing' | 'product_web_app' | 'mobile_app' | 'editorial' | 'visual_brand';

  tags: {
    theme: StyleTheme;
    density: StyleDensity;
    typography: StyleTypography;
    color_temp: StyleColorTemp;
    surface_style: StyleSurface;
    nav_style: StyleNav;
    era: StyleEra;
    brand_tier: BrandTier;
  };

  /** Approximate axis positions (0-100) for quick matching against taste map */
  axes_hint: {
    structure_density?: number;
    structure_symmetry?: number;
    type_drama?: number;
    type_expression?: number;
    surface_depth?: number;
    surface_warmth?: number;
    color_chromaticity?: number;
    color_temperature?: number;
    color_contrast?: number;
    personality_energy?: number;
    personality_era?: number;
  };

  /** Where the screenshot image file lives */
  image_path: string; // e.g. "/library/landing_saas/linear.png"

  /** Metadata */
  source: string;       // "land-book" | "minimal-gallery" | "puppeteer" | "contribution"
  contributor?: string; // GitHub username if contributed
  captured_at: string;  // ISO date
}
