import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/taste-compiler';
import {
  getSession,
  getSessionReferences,
  getRound,
  getProbeResponses,
  getComparisonResponses,
  updateSessionMarkdown,
  updateSessionStatus,
} from '../db/queries';

export async function compileTasteSpec(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Demo mode: skip all data gathering and return mock spec directly
  if (process.env.DEMO_MODE === 'true') {
    const mockSpec = DEMO_TASTE_SPEC;
    updateSessionMarkdown(sessionId, mockSpec);
    if (session.status !== 'complete') {
      updateSessionStatus(sessionId, 'complete');
    }
    return mockSpec;
  }

  const refs = getSessionReferences(sessionId);

  // Gather all round data
  const allAnswers: unknown[] = [];
  const allDeltas: unknown[] = [];
  const allProbeFeedback: unknown[] = [];
  const allComparisonResults: unknown[] = [];

  for (let r = 1; r <= 3; r++) {
    const round = getRound(sessionId, r);
    if (round) {
      if (round.answers) allAnswers.push(round.answers);
      if (round.preferenceDeltas) allDeltas.push(round.preferenceDeltas);

      const responses = getProbeResponses(sessionId, round.id);
      allProbeFeedback.push({
        round: r,
        responses: responses.map((resp) => ({
          ratingType: resp.ratingType,
          notes: resp.notes,
          isEscapeHatch: resp.isEscapeHatch,
          escapeFeedback: resp.escapeFeedback,
        })),
      });

      // V2: Comparison responses
      const comparisons = getComparisonResponses(sessionId, round.id);
      if (comparisons.length > 0) {
        allComparisonResults.push({
          round: r,
          comparisons: comparisons.map((c) => ({
            choice: c.choice,
            reason: c.reason,
          })),
        });
      }
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    tasteMap: session.tasteMap,
    webTasteMap: session.webTasteMap,
    appTasteMap: session.appTasteMap,
    allAnswers,
    allDeltas,
    criticOutput: session.criticOutput,
    probeFeedback: allProbeFeedback,
    comparisonResults: allComparisonResults,
    referenceAnnotations: refs
      .map((r) => r.annotations)
      .filter(Boolean),
    onboardingData: session.onboardingData,
    clusters: session.clusters,
    convergenceDecision: session.convergenceDecision,
  });

  const result = await trackApiCall(
    sessionId,
    'taste_compiler',
    'claude',
    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 16384,
      })
  );

  const markdown = result.text;
  updateSessionMarkdown(sessionId, markdown);

  // Only transition status if not already complete (re-compile case)
  if (session.status !== 'complete') {
    updateSessionStatus(sessionId, 'complete');
  }

  return markdown;
}

const DEMO_TASTE_SPEC = `# Refined Modern Utility — Design Taste Specification

## Section 1 — Taste Summary

This design language prioritizes utility-first interfaces with sophisticated modern execution. It combines high-contrast dark themes with selective lime-green accents, expressive typography using Space Grotesk, and contemporary surface treatments including subtle shadows and matte finishes. The aesthetic balances premium refinement with technological confidence.

## Section 2 — Core Taste DNA

**Composition**: Fluid grid with generous breathing room (75% breathable), asymmetric hero sections, cinematic vertical spacing
**Hierarchy**: Typography-driven wayfinding, distributed prominence through scale contrast
**Type**: Space Grotesk (or Plus Jakarta Sans, Outfit) — expressive but functional, dramatic scale jumps
**Color**: Dark-dominant neutral base (#0a0a0b) with selective lime accent (#a3e635)
**Surface**: Matte digital, borderless containers, subtle drop shadows (2-8px blur), no explicit borders
**Interaction Tone**: Professional with human touches, purposeful visibility, 200ms ease-out transitions
**Information Rhythm**: Cinematic spacing (48-96px between sections), generous vertical breathing

## Section 3 — Design Axes

> These axes describe aesthetic character and are meant for calibrating taste direction, not as direct implementation rules.

**Structure**: 65% fluid / 75% breathable / 60% asymmetric / 70% cinematic rhythm
**Typography**: 70% dramatic / 80% product-functional / 75% expressive / 75% oversized hierarchy
**Surface**: 85% borderless / 55% visible depth / 80% digital-contemporary / 20% matte
**Color**: 60% neutral-led / 80% selective accent / 10% high contrast on dark
**Personality**: 75% refined energy / 70% trend-aware / 75% professionally human

## Section 4 — Anti-goals

**Never**: Explicit borders or heavy container outlines — use shadows and spacing instead
**Never**: Generic sans-serif without character (Helvetica, Arial, system-ui alone)
**Never**: Light themes or low-contrast approaches
**Never**: Ornamental gradients or decorative depth effects
**Never**: Dense, cramped layouts without breathing room
**Never**: Glossy or reflective surface treatments
**Never**: Vibrant rainbow color schemes — one accent color only

## Section 5 — Landing Page Expression Rules

- **Hero**: Full-width, dramatic type scale (56-72px heading), generous padding (120px+ vertical)
- **Sections**: 96px spacing between major sections, 48px between related groups
- **CTAs**: Lime accent (#a3e635) on dark, 16px border-radius, bold weight, generous padding (16px 32px)
- **Cards**: Borderless, bg #141416, shadow 0 4px 16px rgba(0,0,0,0.4), 16px radius, 24px internal padding
- **Nav**: Glassmorphism sticky bar, backdrop-blur 20px, rgba(20,20,22,0.7) background

## Section 6 — Product / App UI Expression Rules

- **Page titles**: 24-32px bold, tight tracking
- **Body**: 14-16px regular, 1.5 line-height
- **Spacing**: 16px base unit, 24px card padding, 32px section gaps
- **Tables/Lists**: Borderless rows, alternating bg (#141416 / #1e1e21), 12px cell padding
- **Modals**: 16px radius, shadow 0 8px 32px rgba(0,0,0,0.5), max-width 560px

## Section 7 — Shared Typography System

**Primary Font**: Space Grotesk (alternatives: Plus Jakarta Sans, Outfit)
**Mono Font**: Geist Mono (alternative: JetBrains Mono)

### Landing Page Scale
| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| Hero H1 | 56-72px | 700 | 1.05 |
| Section H2 | 36-48px | 700 | 1.1 |
| Subheading | 24-28px | 600 | 1.2 |
| Body | 18-20px | 400 | 1.6 |
| Caption | 14px | 500 | 1.4 |

### App UI Scale
| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| Page Title | 24-32px | 700 | 1.15 |
| Section Head | 18-22px | 600 | 1.2 |
| Body | 14-16px | 400 | 1.5 |
| Label | 12-13px | 500 | 1.4 |
| Metadata | 11-12px | 400 | 1.3 |

## Section 8 — Shared Color + Surface System

### Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Background | #0a0a0b | Page background |
| Surface 1 | #141416 | Cards, containers |
| Surface 2 | #1e1e21 | Inputs, elevated elements |
| Surface 3 | #28282c | Hover states, tertiary |
| Surface 4 | #333338 | Active states |
| Text Primary | #f5f5f5 | Headings, primary content |
| Text Secondary | #a1a1aa | Body text, descriptions |
| Text Muted | #63636e | Labels, placeholders |
| Accent | #a3e635 | CTAs, active states, highlights |
| Accent Hover | #bef264 | Hover on accent elements |
| Success | #4ade80 | Positive states |
| Error | #f87171 | Error states |
| Warning | #fbbf24 | Warning states |

### Surface Rules
- **No explicit borders** — separation through shadows, spacing, and surface color tiers
- **Shadows**: sm (0 2px 8px), md (0 4px 16px), lg (0 8px 32px) — all rgba(0,0,0,0.3-0.5)
- **Glassmorphism**: Nav bar and modal overlays ONLY — rgba(20,20,22,0.7) + blur(20px)
- **Border radius**: 16px cards, 12px buttons/inputs, 8px badges/tags

## Section 9 — Component Behavior

- **Spacing base unit**: 8px
- **Card padding**: 24px (landing), 16-20px (app)
- **Section gaps**: 96px (landing), 32-48px (app)
- **Border radius**: 16px (cards), 12px (buttons), 8px (tags)
- **Shadows**: Use shadow tiers, never hard borders
- **Icons**: Functional over decorative, 20px default, stroke width 1.5-2
- **Interactive states**: Hover = surface tier +1, active = accent glow

## Section 10 — Interaction / Motion Tone

- **Hover transitions**: 200ms ease-out
- **Page transitions**: 300ms ease-in-out
- **Micro-interactions**: 150ms ease-out (button press, toggle)
- **Loading spinners**: Accent color (#a3e635), 2px border
- **No bounce or elastic effects** — motion is precise, not playful
- **Scroll behavior**: Smooth scrolling enabled globally

## Section 11 — Prompt Translation Layer

### Block A: Landing Page Prompt
\`\`\`
You are designing a landing page using Refined Modern Utility principles.

TYPOGRAPHY: Space Grotesk. Hero 56-72px bold, sections 36-48px bold, body 18px regular 1.6 line-height.
COLORS: #0a0a0b background, #141416 surface, #f5f5f5 text, #a3e635 accent. One accent color only.
LAYOUT: Generous 96px section spacing, asymmetric heroes, fluid grid with breathing room.
SURFACES: Borderless cards (#141416), shadow 0 4px 16px rgba(0,0,0,0.4), 16px radius. Glass nav with blur.
NEVER: Light themes, explicit borders, generic fonts, ornamental gradients, cramped layouts.
ALWAYS: Dark foundation, dramatic type scale, lime accent for CTAs, matte digital surfaces.
\`\`\`

### Block B: Product UI Prompt
\`\`\`
You are designing a product UI using Refined Modern Utility principles adapted for dense functionality.

TYPOGRAPHY: Space Grotesk. Page titles 24-32px bold, body 14-16px regular, labels 12px medium.
COLORS: #0a0a0b bg, #141416/#1e1e21/#28282c surface tiers, #f5f5f5 text, #a3e635 accent.
LAYOUT: 16px base spacing, 24px card padding, 32px section gaps. Functional density with breathing room.
SURFACES: Borderless cards, subtle shadows, 16px radius. No glassmorphism on cards.
NEVER: Explicit borders, light backgrounds, ornamental effects, cramped without purpose.
ALWAYS: Dark surfaces, clear hierarchy through size/weight, accent for primary actions only.
\`\`\`

## Section 12 — Confidence + Open Questions

**High Confidence (90%+): LOCKED**
- Dark theme preference with high contrast ✓
- Borderless, shadow-based surface treatment ✓
- Space Grotesk as primary typeface ✓
- Lime green (#a3e635) as sole accent ✓
- Generous spacing and cinematic rhythm ✓

**Medium Confidence (70-85%): LIKELY DIRECTION**
- Glassmorphism extent — **Default**: nav bar and modals only
- Typography drama level on app UI — **Default**: moderate, not as dramatic as landing
- Asymmetric vs centered composition — **Default**: asymmetric for heroes, centered for content sections

**Low Confidence (<70%): UNCERTAINTY + DEFAULTS**
- Surface warmth level — **Default**: cool/neutral, no warm tones
- Motion complexity — **Default**: minimal, functional transitions only
- Icon style preference — **Default**: outline icons, 1.5px stroke, 20px default size
`;
