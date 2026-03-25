import { buildTasteAxesContext } from './shared-context';

export function buildSystemPrompt(): string {
  return `You are a design taste decomposition engine. Given structured analyses of multiple UI references (with their surface classifications), your job is to position the user's collective taste on a set of defined axes.

${buildTasteAxesContext()}

## V2: CROSS-SURFACE TASTE SEPARATION

References are classified by surface type (marketing_landing, product_web_app, mobile_app, editorial, visual_brand).

You must produce THREE taste maps:
1. **coreTasteMap** — The shared taste DNA across ALL surface types. This captures universal preferences.
2. **webTasteMap** — Overrides for landing pages / marketing sites. Only include axes that DIFFER from core. Most axes should NOT appear here.
3. **appTasteMap** — Overrides for product / dashboard / app UI. Only include axes that DIFFER from core. Most axes should NOT appear here.

For example, someone might have:
- Core: 70% breathable → applies everywhere
- Web override: 85% breathable → landing pages get even more space
- App override: 55% breathable → dashboards are a bit denser than core

Only include overrides where the surface type shows a CLEAR divergence from core (>15 point difference). If a surface has no clear divergence, omit it from the override map.

RULES:
- Position each axis as a number from 0 (left pole) to 100 (right pole).
- Provide a confidence score from 0 to 1 for each axis.
- List which reference IDs support each position as evidence.
- Flag axes where references strongly disagree (high divergence).
- Identify the top 5 axes with highest divergence across references.
- Be specific in your evidence — don't just say "references agree."

Respond with ONLY valid JSON.`;
}

export function buildUserPrompt(
  analyses: { index: number; id: string; analysis: unknown; annotations?: unknown; surfaceType?: string }[]
): string {
  const refsText = analyses
    .map(
      (a) =>
        `Reference #${a.index} [${a.id}] (Surface: ${a.surfaceType || 'unknown'}):\nAnalysis: ${JSON.stringify(a.analysis, null, 2)}${a.annotations ? `\nUser annotations: ${JSON.stringify(a.annotations)}` : ''}`
    )
    .join('\n\n---\n\n');

  return `Here are ${analyses.length} UI reference analyses with their surface classifications. Position the collective taste on each of the 25 axes, producing core + surface-specific override maps.

${refsText}

Respond with this JSON structure:
{
  "axes": {
    "<axisId>": {
      "axisId": "<axisId>",
      "category": "<category>",
      "label": "<human label>",
      "position": <0-100>,
      "confidence": <0-1>,
      "evidence": ["Ref X shows...", "Ref Y shows..."],
      "signalStrength": "strong" | "moderate" | "weak"
    }
  },
  "webOverrides": {
    "<axisId>": {
      "axisId": "<axisId>",
      "position": <0-100>,
      "confidence": <0-1>,
      "reason": "Landing pages show stronger preference for X"
    }
  },
  "appOverrides": {
    "<axisId>": {
      "axisId": "<axisId>",
      "position": <0-100>,
      "confidence": <0-1>,
      "reason": "Product UI references show tighter density needs"
    }
  },
  "highDivergenceAxes": ["<axisId1>", "<axisId2>", ...top 5],
  "surfaceDivergences": ["<description of how web taste differs from app taste>"]
}

IMPORTANT: webOverrides and appOverrides should ONLY include axes where the surface-specific taste clearly diverges from the core. Most axes should NOT have overrides.`;
}
