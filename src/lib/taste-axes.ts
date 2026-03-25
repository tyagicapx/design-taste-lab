import { TasteAxisDefinition } from './types';

export const TASTE_AXES: TasteAxisDefinition[] = [
  // ============================================================
  // STRUCTURE
  // ============================================================
  {
    id: 'structure_grid',
    category: 'structure',
    label: 'Grid behavior',
    leftPole: 'Rigid grid',
    rightPole: 'Fluid composition',
    highDivergence: false,
  },
  {
    id: 'structure_density',
    category: 'structure',
    label: 'Information density',
    leftPole: 'Dense',
    rightPole: 'Breathable',
    highDivergence: true, // DesignPref: top divergence axis
  },
  {
    id: 'structure_hierarchy',
    category: 'structure',
    label: 'Hierarchy distribution',
    leftPole: 'Centralized',
    rightPole: 'Distributed',
    highDivergence: false,
  },
  {
    id: 'structure_symmetry',
    category: 'structure',
    label: 'Symmetry',
    leftPole: 'Symmetrical',
    rightPole: 'Asymmetrical',
    highDivergence: false,
  },
  {
    id: 'structure_rhythm',
    category: 'structure',
    label: 'Layout rhythm',
    leftPole: 'Modular',
    rightPole: 'Cinematic',
    highDivergence: false,
  },

  // ============================================================
  // TYPOGRAPHY
  // ============================================================
  {
    id: 'type_drama',
    category: 'typography',
    label: 'Type drama',
    leftPole: 'Restrained',
    rightPole: 'Dramatic',
    highDivergence: false,
  },
  {
    id: 'type_function',
    category: 'typography',
    label: 'Type role',
    leftPole: 'Editorial',
    rightPole: 'Product-functional',
    highDivergence: false,
  },
  {
    id: 'type_expression',
    category: 'typography',
    label: 'Type expression',
    leftPole: 'Neutral',
    rightPole: 'Expressive',
    highDivergence: false,
  },
  {
    id: 'type_scale',
    category: 'typography',
    label: 'Type scale',
    leftPole: 'Fine-grained',
    rightPole: 'Oversized hierarchy',
    highDivergence: false,
  },
  {
    id: 'type_behavior',
    category: 'typography',
    label: 'Type behavior',
    leftPole: 'Precise',
    rightPole: 'Emotive',
    highDivergence: false,
  },

  // ============================================================
  // SURFACE / STYLING
  // ============================================================
  {
    id: 'surface_tactility',
    category: 'surface',
    label: 'Tactility',
    leftPole: 'Flat',
    rightPole: 'Tactile',
    highDivergence: false,
  },
  {
    id: 'surface_finish',
    category: 'surface',
    label: 'Surface finish',
    leftPole: 'Matte',
    rightPole: 'Glossy',
    highDivergence: false,
  },
  {
    id: 'surface_containment',
    category: 'surface',
    label: 'Containment',
    leftPole: 'Minimal borders',
    rightPole: 'Explicit containers',
    highDivergence: false,
  },
  {
    id: 'surface_depth',
    category: 'surface',
    label: 'Depth treatment',
    leftPole: 'Quiet depth',
    rightPole: 'Visible depth',
    highDivergence: false,
  },
  {
    id: 'surface_warmth',
    category: 'surface',
    label: 'Material warmth',
    leftPole: 'Sterile',
    rightPole: 'Warm materiality',
    highDivergence: false,
  },

  // ============================================================
  // COLOR
  // ============================================================
  {
    id: 'color_chromaticity',
    category: 'color',
    label: 'Chromaticity',
    leftPole: 'Neutral-led',
    rightPole: 'Chromatic-led',
    highDivergence: false,
  },
  {
    id: 'color_accent',
    category: 'color',
    label: 'Accent behavior',
    leftPole: 'Restrained accent',
    rightPole: 'Broad tonal play',
    highDivergence: false,
  },
  {
    id: 'color_temperature',
    category: 'color',
    label: 'Color temperature',
    leftPole: 'Cold',
    rightPole: 'Warm',
    highDivergence: false,
  },
  {
    id: 'color_contrast',
    category: 'color',
    label: 'Contrast level',
    leftPole: 'High contrast',
    rightPole: 'Low-contrast atmosphere',
    highDivergence: false,
  },

  // ============================================================
  // UI PERSONALITY
  // ============================================================
  {
    id: 'personality_energy',
    category: 'ui_personality',
    label: 'Brand energy',
    leftPole: 'Premium calm',
    rightPole: 'Sharper internet-native energy',
    highDivergence: true, // DesignPref: visual style divergence
  },
  {
    id: 'personality_visibility',
    category: 'ui_personality',
    label: 'System visibility',
    leftPole: 'Invisible system',
    rightPole: 'Visible system',
    highDivergence: false,
  },
  {
    id: 'personality_priority',
    category: 'ui_personality',
    label: 'Design priority',
    leftPole: 'Utility-first',
    rightPole: 'Identity-first',
    highDivergence: true, // DesignPref: decorative vs functional
  },
  {
    id: 'personality_tone',
    category: 'ui_personality',
    label: 'UI tone',
    leftPole: 'Professional',
    rightPole: 'Playful',
    highDivergence: false,
  },
  {
    id: 'personality_era',
    category: 'ui_personality',
    label: 'Design era',
    leftPole: 'Timeless',
    rightPole: 'Trend-aware',
    highDivergence: false,
  },
  {
    id: 'personality_action',
    category: 'ui_personality',
    label: 'Action prominence',
    leftPole: 'Subtle actions',
    rightPole: 'Prominent actions',
    highDivergence: true, // DesignPref: action prominence divergence
  },
];

export const TASTE_CATEGORIES: Record<string, string> = {
  structure: 'Structure',
  typography: 'Typography',
  surface: 'Surface / Styling',
  color: 'Color',
  ui_personality: 'UI Personality',
};

export const HIGH_DIVERGENCE_AXES = TASTE_AXES.filter((a) => a.highDivergence);

export function getAxisById(id: string): TasteAxisDefinition | undefined {
  return TASTE_AXES.find((a) => a.id === id);
}

export function getAxesByCategory(category: string): TasteAxisDefinition[] {
  return TASTE_AXES.filter((a) => a.category === category);
}
