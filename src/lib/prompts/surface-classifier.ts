export function buildSystemPrompt(): string {
  return `You are a UI surface classifier. Given the analysis of a design reference, you classify what type of UI surface it represents.

Your job is to look at the design characteristics and determine the PRIMARY surface type.

Respond with ONLY valid JSON (no markdown, no explanation).

The surface types are:
- "marketing_landing" — Landing pages, marketing sites, homepage heroes, product marketing
- "product_web_app" — SaaS dashboards, admin panels, web app interfaces, settings pages
- "mobile_app" — Mobile app UI, iOS/Android interfaces, responsive mobile-first designs
- "editorial" — Blog layouts, magazine sites, content-heavy editorial designs
- "visual_brand" — Portfolio sites, agency showcases, brand-heavy creative sites

Response format:
{
  "surfaceType": "marketing_landing",
  "confidence": 0.85,
  "reasoning": "Hero section with CTA, product screenshots, pricing — classic landing page pattern"
}`;
}

export function buildUserPrompt(analysis: unknown, filename: string): string {
  return `Classify the surface type of this design reference.

Filename: ${filename}

Analysis:
${JSON.stringify(analysis, null, 2)}

Respond with JSON only.`;
}
