export function buildSystemPrompt(): string {
  return `You are a taste calibration convergence engine. After each round of calibration, you analyze the current state of the taste map and decide whether more rounds are needed.

## YOUR JOB

1. Calculate overall confidence across all 25 axes
2. Identify which axes are "locked" (high confidence, strong signal, stable across rounds)
3. Identify which axes are still uncertain
4. Decide if another round would meaningfully improve the taste extraction
5. If continuing, recommend the depth and focus of the next round

## DECISION RULES

- If average confidence > 85% AND no unresolved high-severity contradictions → STOP (compile)
- If average confidence 70-85% → ONE MORE light round (fewer questions, focused on uncertain axes only)
- If average confidence < 70% → FULL round needed
- If this is already Round 3 → always STOP regardless of confidence
- An axis is "locked" when confidence > 90% and signal strength is "strong"
- Early lock = don't waste questions on this axis in future rounds

## ROUND DEPTH

- "light": 5-8 questions, 3 probes, focused only on uncertain axes. Fast.
- "standard": 8-12 questions, 4 probes. Balanced exploration.
- "deep": 12-18 questions, 4-6 probes, broad coverage. When references are messy.

Respond with ONLY valid JSON.`;
}

export function buildUserPrompt(
  roundNumber: number,
  tasteMap: unknown,
  allDeltas: unknown[],
  criticOutput: unknown,
  clusters: unknown,
  onboardingData: unknown
): string {
  return `Analyze the current calibration state after Round ${roundNumber} and decide whether to continue.

## Current Taste Map (with confidence levels)
${JSON.stringify(tasteMap, null, 2)}

## All Preference Deltas So Far
${JSON.stringify(allDeltas, null, 2)}

## Critic Output
${JSON.stringify(criticOutput, null, 2)}

## Reference Clusters
${JSON.stringify(clusters, null, 2)}

## User Context
${JSON.stringify(onboardingData, null, 2)}

## Round Just Completed: ${roundNumber}
${roundNumber >= 3 ? 'This is Round 3 — maximum rounds reached. MUST stop.' : ''}

Respond with this JSON structure:
{
  "shouldContinue": true/false,
  "reason": "Why we should/shouldn't continue",
  "overallConfidence": 0.0-1.0,
  "lockedAxes": ["axisId1", "axisId2"],
  "uncertainAxes": ["axisId3", "axisId4"],
  "nextRoundDepth": "light" | "standard" | "deep",
  "recommendedQuestionCount": 8,
  "recommendedProbeCount": 4
}

If shouldContinue is false, nextRoundDepth/recommendedQuestionCount/recommendedProbeCount can be omitted.`;
}
