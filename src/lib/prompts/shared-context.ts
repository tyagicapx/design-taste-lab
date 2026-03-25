import { TASTE_AXES, TASTE_CATEGORIES } from '../taste-axes';

export function buildTasteAxesContext(): string {
  const sections: string[] = [];

  for (const [catId, catLabel] of Object.entries(TASTE_CATEGORIES)) {
    const axes = TASTE_AXES.filter((a) => a.category === catId);
    const lines = axes.map(
      (a) =>
        `  - ${a.id}: "${a.leftPole}" ↔ "${a.rightPole}" (${a.label})${a.highDivergence ? ' [HIGH DIVERGENCE]' : ''}`
    );
    sections.push(`### ${catLabel}\n${lines.join('\n')}`);
  }

  return `## Taste Axes (25 dimensions across 5 categories)

Each axis is a spectrum from 0 (left pole) to 100 (right pole).
Axes marked [HIGH DIVERGENCE] are where designers diverge most — prioritize these in early rounds.

${sections.join('\n\n')}`;
}

export function buildTasteMapContext(tasteMap: Record<string, unknown>): string {
  if (!tasteMap || Object.keys(tasteMap).length === 0) {
    return 'No taste map available yet.';
  }

  const entries = Object.entries(tasteMap).map(([, v]) => {
    const axis = v as {
      axisId: string;
      label: string;
      position: number;
      confidence: number;
      signalStrength: string;
    };
    return `- ${axis.label}: position=${axis.position}/100, confidence=${(axis.confidence * 100).toFixed(0)}%, signal=${axis.signalStrength}`;
  });

  return `## Current Taste Map\n${entries.join('\n')}`;
}
