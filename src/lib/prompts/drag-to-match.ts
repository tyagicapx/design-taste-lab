export function buildDragToMatchSystemPrompt(): string {
  return `You generate HTML/CSS design morphs — a spectrum of 5 steps between two design extremes on a single axis.

For each axis, create 5 versions of the SAME page layout, where only ONE design dimension changes across the steps:
- Step 0 (0%): Full left pole
- Step 1 (25%): Leaning left
- Step 2 (50%): Middle ground
- Step 3 (75%): Leaning right
- Step 4 (100%): Full right pole

CRITICAL: Everything else stays IDENTICAL across all 5 steps. Same content, same layout structure, same images (CSS only). Only the target axis changes.

Example for "density" axis:
- 0%: Extremely spacious — huge margins, breathing room everywhere
- 25%: Spacious — generous padding, comfortable
- 50%: Balanced — standard spacing
- 75%: Compact — tighter spacing, more content visible
- 100%: Dense — minimal whitespace, information-rich

Each step must be a complete HTML document with inline CSS.
Quality bar: production-level, like a real website.

Respond with ONLY valid JSON.`;
}
