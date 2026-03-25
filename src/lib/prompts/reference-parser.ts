export function buildSystemPrompt(): string {
  return `You are a UI design system forensics tool. Your job is to extract STRUCTURED observations from UI screenshots.

CRITICAL RULES:
- Do NOT describe the content or subject matter. Describe the DESIGN SYSTEM underneath.
- Do NOT use vague adjectives like "clean" or "modern." Be specific and dimensional.
- If something is not visible or determinable, say "not visible."
- Be forensic: measure, compare, characterize.

You must respond with ONLY valid JSON matching the schema below. No markdown, no commentary.`;
}

export function buildUserPrompt(annotations?: {
  tags: string[];
  note: string;
} | null): string {
  let context = '';
  if (annotations && (annotations.tags.length > 0 || annotations.note)) {
    context = `\nThe user noted they are drawn to this reference for: ${annotations.tags.join(', ')}${annotations.note ? `. Note: "${annotations.note}"` : ''}. Consider this when weighing observations.\n`;
  }

  return `Analyze this UI screenshot and extract structured observations.${context}

Respond with this exact JSON structure:
{
  "layoutStyle": "description of layout approach",
  "gridBehavior": "rigid/fluid/mixed and details",
  "spacingRhythm": "tight/moderate/generous + rhythm pattern",
  "breathingRoom": "low/moderate/high + characterization",
  "typeHierarchy": {
    "levels": number,
    "weightContrast": "low/moderate/high",
    "style": "description",
    "behavior": "how type acts as a system element"
  },
  "density": {
    "score": 1-10,
    "characterization": "description"
  },
  "colorSystem": {
    "paletteType": "monochrome/neutral-led/chromatic/etc",
    "dominantTemperature": "cold/neutral/warm",
    "contrastLevel": "low/moderate/high",
    "accentRole": "how accent color is used"
  },
  "surfaceTreatment": {
    "depth": "flat/subtle/visible/dramatic",
    "borders": "none/subtle/visible/heavy",
    "shadows": "none/subtle/moderate/dramatic",
    "radius": "none/small/moderate/large/mixed",
    "material": "digital-flat/paper/glass/matte/glossy"
  },
  "navBehavior": "description of navigation style",
  "cardBehavior": "how cards/containers work",
  "iconStyle": "description or 'not visible'",
  "imageryRole": "hero/supportive/decorative/absent",
  "motionCues": "any visible motion indicators or 'not visible'",
  "overallEnergy": "description of the UI's personality and energy",
  "designFamilyGuess": "which design family this belongs to",
  "repeatedMotifs": ["list", "of", "recurring", "patterns"],
  "conflictingSignals": ["any", "contradictory", "elements"],
  "likelyOutlier": false,
  "outlierReason": null
}`;
}
