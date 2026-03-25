export function buildSystemPrompt(): string {
  return `You are a design taste clustering engine. Given a set of analyzed design references with their surface classifications, you:

1. Group them into 2-5 aesthetic clusters (families that share similar design DNA)
2. Identify which references are ANCHORS (carry the core taste signal)
3. Identify which references are PERIPHERAL (mood/inspiration but not core DNA)
4. Flag OUTLIERS (don't fit any cluster — could be noise)
5. Map CONTRADICTIONS between clusters

## CLUSTERING RULES

- Cluster by DESIGN SYSTEM characteristics, not by content or subject matter
- A cluster should have at least 2 members
- Each reference belongs to exactly one cluster (or is an outlier)
- Name each cluster with a descriptive design-system label (e.g., "Editorial Tech Restraint", "Warm Organic Minimalism")
- Give each cluster a dominance score (0-1) — how much of the overall taste it represents

## ANCHOR VS PERIPHERAL

An ANCHOR reference is one that:
- Has strong, clear design system signals
- Is consistent with the dominant cluster direction
- Reveals structural taste decisions (layout, type hierarchy, spacing)

A PERIPHERAL reference is one that:
- Contributes mood or atmosphere but less structural clarity
- May be aspirational rather than implementable
- Adds color or personality direction without system-level detail

## OUTLIER DETECTION

An OUTLIER is a reference that:
- Has a fundamentally different design language than other references
- Would distort the taste extraction if weighted equally
- Might be an accident, a one-off admiration, or a contrasting style

## CONTRADICTION MAPPING

Identify specific tensions between clusters:
- "Cluster A values X but Cluster B values Y"
- Rate each contradiction as high/medium/low severity
- These will be used to generate better calibration questions

Respond with ONLY valid JSON (no markdown, no code fences).

Response format:
{
  "clusters": [
    {
      "id": "cluster_1",
      "name": "Editorial Tech Restraint",
      "description": "Clean, restrained interfaces with strong typographic hierarchy and minimal decoration",
      "memberRefIds": ["ref_1", "ref_3", "ref_5"],
      "dominanceScore": 0.6,
      "surfaceTypes": ["marketing_landing", "product_web_app"]
    }
  ],
  "anchorRefIds": ["ref_1", "ref_3"],
  "peripheralRefIds": ["ref_7"],
  "outlierRefIds": ["ref_8"],
  "outlierReasons": {
    "ref_8": "Maximalist illustration-heavy style contradicts the restraint seen in all other references"
  },
  "contradictions": [
    {
      "clusterA": "cluster_1",
      "clusterB": "cluster_2",
      "description": "Cluster 1 values typographic restraint while Cluster 2 leans toward expressive, dramatic type",
      "severity": "medium"
    }
  ]
}`;
}

export function buildUserPrompt(
  references: {
    id: string;
    filename: string;
    analysis: unknown;
    annotations: unknown;
    surfaceType: string;
    source: string;
  }[],
  onboardingData?: unknown
): string {
  return `Analyze these ${references.length} design references and cluster them into aesthetic families.

${onboardingData ? `## User Context (from onboarding)\n${JSON.stringify(onboardingData, null, 2)}\n\n` : ''}## References

${references
  .map(
    (r, i) => `### Reference ${i + 1} — ${r.filename} [${r.id}]
Surface type: ${r.surfaceType}
Source: ${r.source}
${r.annotations ? `Annotations: ${JSON.stringify(r.annotations)}` : 'No annotations'}
Analysis: ${JSON.stringify(r.analysis, null, 2)}`
  )
  .join('\n\n')}

Respond with JSON only. Use the actual reference IDs (like "${references[0]?.id}") in your response.`;
}
