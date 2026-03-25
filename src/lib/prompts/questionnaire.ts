import { buildTasteAxesContext } from './shared-context';

export function buildSystemPrompt(): string {
  return `You are a taste calibration questionnaire engine. You generate visual preference questions that ANYONE can answer — even someone with zero design background.

${buildTasteAxesContext()}

## CRITICAL LANGUAGE RULES — READ CAREFULLY

1. **WRITE FOR A 16-YEAR-OLD.** No design jargon. No industry terms. No words like "hierarchy", "chromatic", "typographic restraint", "tonal expression", "composition", "negative space", "modular rhythm", or "scale progression."

2. **USE EVERYDAY COMPARISONS.** Instead of abstract design concepts, describe what things LOOK and FEEL like using comparisons to real things people know:
   - BAD: "Restrained typographic hierarchy with subtle scale progression"
   - GOOD: "Text that's all similar sizes — calm and even, like a book page"
   - BAD: "Rich neutral foundation with selective chromatic moments"
   - GOOD: "Mostly black, white, and gray — with just one pop of color for important stuff"
   - BAD: "Strong negative space with one dominant focal block"
   - GOOD: "Lots of empty space with one big thing grabbing your attention"

3. **EACH OPTION MUST PAINT A PICTURE.** The reader should be able to VISUALIZE what the screen looks like just from reading the option. Use phrases like "imagine a screen where..." or "think of an app that..."

4. **QUESTIONS SHOULD FEEL LIKE "WOULD YOU RATHER."** Simple, fun, clear binary/ternary choices between things people can picture.

5. **KEEP OPTIONS SHORT.** Max 15-20 words per option. If you need more, you're being too abstract.

6. **USE REAL-WORLD REFERENCES WHEN HELPFUL.** "Think Apple's website" or "Like a newspaper" or "Like Instagram's clean feed" — these anchor abstract concepts instantly.

7. **FOR ANTI-GOAL QUESTIONS**, describe the FEELING of the bad thing, not the technical fault:
   - BAD: "Over-styled dribbblified interface theatrics"
   - GOOD: "Designs that look cool on Pinterest but feel confusing to actually use"

## QUESTION FORMAT

Each question must have:
- A short, clear question (one sentence, plain English)
- 2-4 options that are easy to tell apart at a glance
- Each option should feel like a different VIBE, not a different spec

Respond with ONLY valid JSON.`;
}

export function buildUserPrompt(
  roundNumber: number,
  tasteMap: unknown,
  criticOutput: unknown,
  previousAnswers?: unknown,
  previousDeltas?: unknown,
  onboardingData?: unknown,
  clusters?: unknown
): string {
  const roundInstructions: Record<number, string> = {
    1: `ROUND 1 — Getting to know your taste (12-18 questions).
Prioritize the HIGH DIVERGENCE axes first.
Cover all 5 categories (structure, typography, surface, color, UI personality).
Include 2-3 "what do you HATE?" elimination questions.
All questions target CORE taste (shared across all surfaces).
Remember: write every option so a teenager could understand it.`,
    2: `ROUND 2 — Narrowing it down (8-12 questions).
Don't re-ask things already answered. Target the uncertain areas.
Questions should be more specific — "given that you like X, do you prefer Y or Z?"

## V2: SURFACE-SPECIFIC QUESTIONS
Include 2-4 questions that are surface-specific. Tag them with "surface": "web" or "surface": "app".
Examples:
- "For a landing page hero, would you want [dramatic big text] or [more balanced, information-rich]?" (surface: "web")
- "For a dashboard, would you want [lots of data visible at once] or [clean with one focus area]?" (surface: "app")

These help separate landing page taste from product UI taste. The remaining questions should target "surface": "core".
Keep the same plain, visual language.`,
    3: `ROUND 3 — Final confirmation (5-8 questions).
Just confirm the remaining uncertain choices.
These should feel like "just to double check — you prefer THIS over THAT, right?"
Include 1-2 surface-specific confirmations if web/app taste diverges.
Keep it light and fast.`,
  };

  let context = `${roundInstructions[roundNumber] || roundInstructions[1]}

## Current Taste Map (internal — DO NOT use this language in questions)
${JSON.stringify(tasteMap, null, 2)}

## Critic Output (internal — use this to decide WHAT to ask, not HOW to phrase it)
${JSON.stringify(criticOutput, null, 2)}`;

  if (previousAnswers) {
    context += `\n\n## Previous Answers\n${JSON.stringify(previousAnswers, null, 2)}`;
  }
  if (previousDeltas) {
    context += `\n\n## Previous Preference Deltas\n${JSON.stringify(previousDeltas, null, 2)}`;
  }

  if (onboardingData) {
    const ob = onboardingData as Record<string, string>;
    context += `\n\n## User Onboarding Context\n${JSON.stringify(onboardingData, null, 2)}`;

    // CRITICAL: Weight questions toward the user's stated use case
    if (ob.useCase) {
      const uc = ob.useCase.toLowerCase();
      if (uc.includes('mobile') || uc.includes('app')) {
        context += `\n\n## IMPORTANT: USE CASE WEIGHTING
The user specifically said they are designing for a MOBILE APP.
At least 40-50% of your questions MUST be about mobile app UI experiences — NOT websites.
Frame questions around mobile patterns: bottom nav vs tabs, card-based feeds vs lists, swipe gestures, thumb-zone layout, notification UI, settings screens, onboarding flows, mobile modals/sheets.
When describing options, say "imagine an app where..." not "imagine a website where..."
DO NOT default to website/landing page language. This user cares about APP UI.`;
      } else if (uc.includes('landing') || uc.includes('marketing') || uc.includes('website')) {
        context += `\n\n## IMPORTANT: USE CASE WEIGHTING
The user specifically said they are designing for LANDING PAGES / MARKETING WEBSITES.
Weight questions heavily toward landing page patterns: hero sections, CTAs, feature grids, testimonials, pricing sections, scroll-based storytelling.`;
      } else if (uc.includes('dashboard') || uc.includes('saas')) {
        context += `\n\n## IMPORTANT: USE CASE WEIGHTING
The user specifically said they are designing for a DASHBOARD / SAAS PRODUCT.
Weight questions toward data display, sidebar navigation, tables, charts, settings panels, dense information layouts.`;
      }
    }
  }

  if (clusters) {
    context += `\n\n## Reference Clusters\n${JSON.stringify(clusters, null, 2)}`;
  }

  return `${context}

Generate the questionnaire. Remember: PLAIN ENGLISH ONLY. No design jargon.

Respond with:
{
  "questions": [
    {
      "id": "q1",
      "text": "How packed should a screen feel?",
      "category": "structure",
      "axisTargets": ["structure_density"],
      "options": [
        {"id": "q1_a", "text": "Packed with info — I want to see everything at once, like a dashboard", "implies": ["prefers dense layouts"]},
        {"id": "q1_b", "text": "Lots of breathing room — clean and spacious, like Apple's website", "implies": ["prefers breathable layouts"]}
      ],
      "type": "tradeoff",
      "targeting": "high_divergence",
      "whyAsking": "Density is a high-divergence axis",
      "surface": "core"
    },
    {
      "id": "q2",
      "text": "What kind of vibe should the app NOT have?",
      "category": "ui_personality",
      "axisTargets": ["personality_tone", "personality_energy"],
      "options": [
        {"id": "q2_a", "text": "Boring corporate — like a government website from 2010", "implies": ["avoids lifeless minimalism"]},
        {"id": "q2_b", "text": "Try-hard trendy — looks cool on Dribbble but annoying to actually use", "implies": ["avoids ornamental design"]},
        {"id": "q2_c", "text": "Overly playful — too many colors, illustrations, and bouncy animations", "implies": ["avoids playful consumer aesthetic"]},
        {"id": "q2_d", "text": "Generic startup — could be any SaaS product, nothing distinctive", "implies": ["avoids generic SaaS"]}
      ],
      "type": "elimination",
      "targeting": "high_divergence",
      "whyAsking": "Anti-goal detection"
    }
  ]
}`;
}
