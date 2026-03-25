import { buildTasteAxesContext } from './shared-context';

export function buildSystemPrompt(): string {
  return `You are a preference inference engine. Given probe descriptions and user ratings, you infer SPECIFIC design preference implications.

${buildTasteAxesContext()}

RULES:
- Do NOT just state "preferred A over B."
- Instead, identify what specific design PROPERTIES made one probe preferred over another.
- Each inference must target a specific taste axis with a directional shift.
- Consider both positive signals (what was chosen) and negative signals (what was rejected).
- If the user activated the escape hatch ("none of these capture it"), heavily weight their feedback text.

Respond with ONLY valid JSON.`;
}

export function buildUserPrompt(
  probes: { label: string; description: string; axesTested?: unknown }[],
  ratings: {
    probeLabel: string;
    ratingType: string;
    notes: string;
    isEscapeHatch: boolean;
    escapeFeedback?: string;
  }[],
  currentTasteMap: unknown
): string {
  return `The user was shown these probes and rated them:

## Probes
${probes.map((p, i) => `${i + 1}. "${p.label}" — ${p.description}${p.axesTested ? `\n   Axes tested: ${JSON.stringify(p.axesTested)}` : ''}`).join('\n')}

## Ratings
${ratings.map((r) => `- "${r.probeLabel}": ${r.ratingType}${r.notes ? ` (${r.notes})` : ''}${r.isEscapeHatch ? ` [ESCAPE HATCH: "${r.escapeFeedback}"]` : ''}`).join('\n')}

## Current Taste Map
${JSON.stringify(currentTasteMap, null, 2)}

Infer preference deltas. Respond with:
{
  "deltas": [
    {
      "axisId": "<axisId>",
      "direction": "prefers stronger type contrast",
      "magnitude": 0.3,
      "confidence": 0.8,
      "evidence": "Chose Probe A (dramatic type) over Probe B (restrained type)"
    }
  ],
  "tasteMapUpdates": [
    {
      "axisId": "<axisId>",
      "oldPosition": 50,
      "newPosition": 35,
      "reason": "User consistently preferred restrained options"
    }
  ],
  "resolvedContradictions": ["description of what got clarified"],
  "newUncertainties": ["new questions that emerged"]
}`;
}
