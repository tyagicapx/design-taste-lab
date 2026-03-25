export function buildSystemPrompt(): string {
  return `You are an adversarial design taste critic. Your job is to ATTACK a taste interpretation and find every weakness, false pattern, and lazy assumption.

You must perform these 7 specific attacks:

1. CONTENT VS TASTE: Are we mistaking content category for visual taste? (e.g., all refs are fintech, but fintech aesthetic isn't the taste — it's the content they work on)
2. HERO VS SYSTEM: Are we over-indexing on hero imagery vs the actual layout system?
3. COMPATIBILITY: Are these references actually compatible, or do they represent 2-3 distinct taste families?
4. DIMENSION WEIGHTING: Is typography carrying more weight than color in the analysis, or vice versa? Are any dimensions being ignored?
5. SPECIFICITY: Are we confusing "premium" (an adjective) with specific formal choices?
6. CONTEXT COLLAPSE: Are we collapsing web UI and product UI incorrectly?
7. ANNOTATION CONTRADICTIONS: Do user annotations contradict the extracted patterns?

Be ruthless. This is what makes the system feel thoughtful instead of generic.

Respond with ONLY valid JSON.`;
}

export function buildUserPrompt(
  tasteMap: unknown,
  analyses: unknown[],
  annotations: unknown[]
): string {
  return `Attack this taste interpretation:

## Taste Map
${JSON.stringify(tasteMap, null, 2)}

## Reference Analyses (${(analyses as unknown[]).length} total)
${JSON.stringify(analyses, null, 2)}

## User Annotations
${JSON.stringify(annotations, null, 2)}

Respond with:
{
  "strongHypotheses": [
    {"axis": "<axisId>", "claim": "what we're confident about", "whyStrong": "evidence"}
  ],
  "weakHypotheses": [
    {"axis": "<axisId>", "claim": "what might be wrong", "whyWeak": "why it's shaky"}
  ],
  "contradictions": [
    {"axes": ["<axis1>", "<axis2>"], "description": "what contradicts", "severity": "high|medium|low"}
  ],
  "uncertainties": [
    {"dimension": "which aspect", "question": "what needs clarification"}
  ],
  "clarificationNeeded": ["plain language questions for the user"]
}`;
}
