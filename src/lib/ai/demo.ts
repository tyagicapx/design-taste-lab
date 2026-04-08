/**
 * Demo Mode — Mock AI Provider
 *
 * Returns pre-written responses for each pipeline stage so users can
 * experience the full interactive flow without any API keys.
 *
 * Activated when DEMO_MODE=true in .env.local
 *
 * The mock detects which module is calling by pattern-matching on the
 * system/user prompt content, then returns the appropriate canned JSON.
 */

import type { TextProvider, VisionProvider } from './provider';
import type { TokenUsage } from '../types';

const MOCK_USAGE: TokenUsage = {
  inputTokens: 100,
  outputTokens: 200,
  estimatedCost: 0,
};

// Simulate realistic API latency
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function detectModule(systemPrompt: string, userPrompt: string): string {
  const combined = (systemPrompt + ' ' + userPrompt).toLowerCase();

  if (combined.includes('reference parser') || combined.includes('forensic')) return 'reference_parser';
  if (combined.includes('surface classifier') || combined.includes('classify the surface')) return 'surface_classifier';
  if (combined.includes('cluster') && combined.includes('aesthetic famil')) return 'reference_clusterer';
  if (combined.includes('taste decomposition') || combined.includes('position on all')) return 'taste_decomposition';
  if (combined.includes('internal critic') || combined.includes('adversarial')) return 'internal_critic';
  if (combined.includes('questionnaire') && combined.includes('calibration')) return 'questionnaire';
  if (combined.includes('html/css') || combined.includes('production-quality html')) return 'probe_generator';
  if (combined.includes('preference delta') || combined.includes('what probe choices imply')) return 'preference_delta';
  if (combined.includes('convergence') || combined.includes('should we continue')) return 'convergence';
  if (combined.includes('design system compiler') || combined.includes('taste compiler')) return 'taste_compiler';

  return 'unknown';
}

const MOCK_REFERENCE_ANALYSIS = JSON.stringify({
  layoutStyle: 'fluid-grid with asymmetric hero sections',
  gridBehavior: 'mixed — 12-column base with breakout elements',
  spacingRhythm: 'generous, cinematic vertical spacing (64-128px between sections)',
  breathingRoom: 'high — lots of negative space, content breathes',
  typeHierarchy: 'dramatic scale contrast, oversized headlines (72px+) with small body (16px)',
  density: 'low-medium — editorial feel, not packed',
  colorSystem: 'dark foundation (#0a0a0b), lime accent (#a3e635), high contrast white text',
  surfaceTreatment: 'matte digital, subtle shadows (2-8px blur), no explicit borders',
  navBehavior: 'minimal sticky top bar with glass effect',
  cardBehavior: 'borderless with subtle shadow depth, 16px radius',
  iconStyle: 'functional, thin stroke, monochrome',
  imageryRole: 'secondary — typography-led design, imagery as accent not hero',
  motionCues: 'subtle hover transitions, 200-300ms ease-out',
  overallEnergy: 'premium calm with confident tech personality',
  designFamilyGuess: 'Linear / Vercel / Raycast family',
  repeatedMotifs: ['oversized type', 'dark surfaces', 'lime accent', 'generous spacing'],
  conflictingSignals: [],
  likelyOutlier: false,
});

const MOCK_SURFACE_CLASSIFICATION = JSON.stringify({
  surfaceType: 'web_landing',
  confidence: 0.85,
  reasoning: 'Hero section with CTA, marketing copy, feature grid — classic landing page pattern.',
});

const MOCK_CLUSTERS = JSON.stringify({
  clusters: [
    {
      id: 'cluster-1',
      label: 'Dark Premium Tech',
      description: 'Dark backgrounds, lime/green accents, oversized typography, matte surfaces',
      referenceIds: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
      dominantTraits: ['dark-theme', 'oversized-type', 'tech-confident', 'minimal-borders'],
    },
    {
      id: 'cluster-2',
      label: 'Editorial Warmth',
      description: 'Warm neutral backgrounds, serif accents, editorial breathing room',
      referenceIds: ['ref-5', 'ref-6'],
      dominantTraits: ['warm-tones', 'editorial-spacing', 'refined-type'],
    },
  ],
  anchorRefIds: ['ref-1', 'ref-3'],
  outlierRefIds: [],
  conflicts: [],
});

function buildMockTasteMap() {
  return JSON.stringify({
    axes: {
      structure_grid: { axisId: 'structure_grid', label: 'Grid Behavior', position: 65, confidence: 0.8, evidence: ['fluid layouts in references'], signalStrength: 'strong' },
      structure_density: { axisId: 'structure_density', label: 'Information Density', position: 72, confidence: 0.85, evidence: ['generous spacing throughout'], signalStrength: 'strong' },
      structure_hierarchy: { axisId: 'structure_hierarchy', label: 'Hierarchy Style', position: 60, confidence: 0.7, evidence: ['distributed with focal points'], signalStrength: 'medium' },
      structure_symmetry: { axisId: 'structure_symmetry', label: 'Symmetry', position: 58, confidence: 0.65, evidence: ['slight asymmetric lean'], signalStrength: 'medium' },
      structure_rhythm: { axisId: 'structure_rhythm', label: 'Rhythm', position: 70, confidence: 0.8, evidence: ['cinematic sectional breaks'], signalStrength: 'strong' },
      type_drama: { axisId: 'type_drama', label: 'Type Drama', position: 75, confidence: 0.9, evidence: ['oversized headlines'], signalStrength: 'strong' },
      type_function: { axisId: 'type_function', label: 'Type Function', position: 70, confidence: 0.75, evidence: ['product-functional with expression'], signalStrength: 'strong' },
      type_expression: { axisId: 'type_expression', label: 'Type Expression', position: 72, confidence: 0.8, evidence: ['Space Grotesk-style character'], signalStrength: 'strong' },
      type_scale: { axisId: 'type_scale', label: 'Type Scale', position: 78, confidence: 0.85, evidence: ['dramatic size jumps'], signalStrength: 'strong' },
      type_behavior: { axisId: 'type_behavior', label: 'Type Behavior', position: 55, confidence: 0.6, evidence: ['balanced precise-emotive'], signalStrength: 'medium' },
      surface_tactility: { axisId: 'surface_tactility', label: 'Surface Tactility', position: 45, confidence: 0.7, evidence: ['matte digital base'], signalStrength: 'medium' },
      surface_finish: { axisId: 'surface_finish', label: 'Surface Finish', position: 25, confidence: 0.85, evidence: ['matte, not glossy'], signalStrength: 'strong' },
      surface_containment: { axisId: 'surface_containment', label: 'Containment', position: 15, confidence: 0.9, evidence: ['borderless components'], signalStrength: 'strong' },
      surface_depth: { axisId: 'surface_depth', label: 'Depth', position: 55, confidence: 0.7, evidence: ['subtle shadows for layering'], signalStrength: 'medium' },
      surface_warmth: { axisId: 'surface_warmth', label: 'Warmth', position: 40, confidence: 0.65, evidence: ['neutral base, selective warmth'], signalStrength: 'medium' },
      color_chromaticity: { axisId: 'color_chromaticity', label: 'Chromaticity', position: 35, confidence: 0.8, evidence: ['neutral-led with accent'], signalStrength: 'strong' },
      color_accent: { axisId: 'color_accent', label: 'Accent Strategy', position: 70, confidence: 0.85, evidence: ['single chromatic accent (lime)'], signalStrength: 'strong' },
      color_temperature: { axisId: 'color_temperature', label: 'Temperature', position: 55, confidence: 0.7, evidence: ['neutral-cool base'], signalStrength: 'medium' },
      color_contrast: { axisId: 'color_contrast', label: 'Contrast', position: 20, confidence: 0.9, evidence: ['high contrast dark/light'], signalStrength: 'strong' },
      personality_energy: { axisId: 'personality_energy', label: 'Energy', position: 65, confidence: 0.8, evidence: ['confident tech energy'], signalStrength: 'strong' },
      personality_visibility: { axisId: 'personality_visibility', label: 'System Visibility', position: 60, confidence: 0.7, evidence: ['purposeful UI chrome'], signalStrength: 'medium' },
      personality_priority: { axisId: 'personality_priority', label: 'Priority', position: 55, confidence: 0.65, evidence: ['utility with identity'], signalStrength: 'medium' },
      personality_tone: { axisId: 'personality_tone', label: 'Tone', position: 30, confidence: 0.8, evidence: ['professional, not playful'], signalStrength: 'strong' },
      personality_era: { axisId: 'personality_era', label: 'Era', position: 70, confidence: 0.75, evidence: ['trend-aware modern'], signalStrength: 'strong' },
      personality_action: { axisId: 'personality_action', label: 'Action Style', position: 65, confidence: 0.8, evidence: ['clear action hierarchy'], signalStrength: 'strong' },
    },
    webOverrides: {},
    appOverrides: {},
    highDivergenceAxes: ['structure_density', 'personality_energy', 'personality_priority', 'personality_action'],
    outlierRefIds: [],
  });
}

const MOCK_CRITIC = JSON.stringify({
  strongHypotheses: [
    'Strong preference for dark themes with high contrast',
    'Typography-led hierarchy with dramatic scale jumps',
    'Borderless, shadow-based containment strategy',
    'Single chromatic accent (lime/green family)',
  ],
  weakHypotheses: [
    'Asymmetry preference needs more evidence — could be context-dependent',
    'Surface warmth is ambiguous — neutral base could go warmer or cooler',
  ],
  contradictions: [
    'References show both dense dashboard patterns and spacious editorial layouts — density preference may be surface-dependent',
  ],
  uncertainties: [
    'Font family preference — expressive sans detected but specific family unclear',
    'Motion attitude — minimal evidence from static screenshots',
  ],
  clarificationNeeded: [
    'Does the user prefer breathable spacing universally or just for landing pages?',
    'Is the lime accent locked or would other modern hues work?',
  ],
});

function buildMockQuestions(roundNumber: number) {
  const round1 = {
    questions: [
      {
        id: 'q1', text: 'When you open an app or website, what grabs your attention first?', category: 'structure',
        axisTargets: ['structure_density'], type: 'preference',
        options: [
          { id: 'q1a', text: 'Clean and spacious — I love breathing room and one clear focus' },
          { id: 'q1b', text: 'Rich and detailed — I like seeing lots of info right away' },
          { id: 'q1c', text: 'Bold and dramatic — big text, strong visuals, instant impact' },
        ],
      },
      {
        id: 'q2', text: 'Which background vibe do you prefer?', category: 'color',
        axisTargets: ['color_contrast', 'color_temperature'], type: 'preference',
        options: [
          { id: 'q2a', text: 'Dark and moody — like a sleek app at night' },
          { id: 'q2b', text: 'Light and airy — bright whites and soft grays' },
          { id: 'q2c', text: 'Warm and cozy — cream, tan, or soft gold tones' },
        ],
      },
      {
        id: 'q3', text: 'How should buttons and important actions look?', category: 'ui_personality',
        axisTargets: ['personality_action', 'personality_energy'], type: 'preference',
        options: [
          { id: 'q3a', text: 'Bold and obvious — bright color, large, impossible to miss' },
          { id: 'q3b', text: 'Subtle and refined — blends in, appears when needed' },
          { id: 'q3c', text: 'Somewhere in between — clear but not shouty' },
        ],
      },
      {
        id: 'q4', text: 'Pick the text style that feels most "you":', category: 'typography',
        axisTargets: ['type_drama', 'type_expression'], type: 'preference',
        options: [
          { id: 'q4a', text: 'Big, bold headlines that dominate the screen' },
          { id: 'q4b', text: 'Small, precise text — everything calm and even, like a book' },
          { id: 'q4c', text: 'Mix of sizes — big titles with compact body text' },
        ],
      },
      {
        id: 'q5', text: 'How should cards and content boxes feel?', category: 'surface',
        axisTargets: ['surface_containment', 'surface_depth'], type: 'preference',
        options: [
          { id: 'q5a', text: 'No visible edges — content floats on the background with subtle shadows' },
          { id: 'q5b', text: 'Clear containers — thin borders or outlined boxes' },
          { id: 'q5c', text: 'Glass-like — frosted/blurred surfaces that feel layered' },
        ],
      },
      {
        id: 'q6', text: 'What do you hate most in a design?', category: 'ui_personality',
        axisTargets: ['personality_tone'], type: 'elimination',
        options: [
          { id: 'q6a', text: 'Designs that look cool but are confusing to actually use' },
          { id: 'q6b', text: 'Boring, generic designs with no personality' },
          { id: 'q6c', text: 'Cluttered layouts with too much competing for attention' },
          { id: 'q6d', text: 'Overly minimal — so empty it feels like nothing is there' },
        ],
      },
    ],
  };

  const round2 = {
    questions: [
      {
        id: 'q7', text: 'Given you like dark themes — how dark should it go?', category: 'color',
        axisTargets: ['color_contrast'], type: 'preference',
        options: [
          { id: 'q7a', text: 'True black (#000) with maximum contrast' },
          { id: 'q7b', text: 'Charcoal/off-black — dark but not pitch black' },
        ],
      },
      {
        id: 'q8', text: 'For your accent color — which direction?', category: 'color',
        axisTargets: ['color_accent'], type: 'preference',
        options: [
          { id: 'q8a', text: 'Lime green / electric green — techy and fresh' },
          { id: 'q8b', text: 'Electric blue — cool and professional' },
          { id: 'q8c', text: 'Warm orange — energetic and approachable' },
        ],
      },
      {
        id: 'q9', text: 'Should spacing feel different on a landing page vs inside an app?', category: 'structure',
        axisTargets: ['structure_density'], type: 'preference', surface: 'core',
        options: [
          { id: 'q9a', text: 'Yes — landing pages should be spacious, app screens can be tighter' },
          { id: 'q9b', text: 'No — keep the same generous spacing everywhere' },
        ],
      },
      {
        id: 'q10', text: 'When you see navigation, which feels right?', category: 'ui_personality',
        axisTargets: ['personality_visibility'], type: 'preference',
        options: [
          { id: 'q10a', text: 'Almost invisible — just text links, barely there' },
          { id: 'q10b', text: 'Present but minimal — small sticky bar with glass effect' },
          { id: 'q10c', text: 'Bold sidebar — always visible, clearly structured' },
        ],
      },
    ],
  };

  const round3 = {
    questions: [
      {
        id: 'q11', text: 'Just to confirm — you prefer Space Grotesk-style fonts over classic sans-serifs like Helvetica?', category: 'typography',
        axisTargets: ['type_expression'], type: 'confirmation',
        options: [
          { id: 'q11a', text: 'Yes — I like fonts with personality and character' },
          { id: 'q11b', text: 'Actually, I prefer something more neutral and classic' },
        ],
      },
      {
        id: 'q12', text: 'Final check: borderless cards with shadows, or would you like subtle borders sometimes?', category: 'surface',
        axisTargets: ['surface_containment'], type: 'confirmation',
        options: [
          { id: 'q12a', text: 'Borderless always — shadows and spacing are enough' },
          { id: 'q12b', text: 'A subtle border on some things would be nice' },
        ],
      },
    ],
  };

  return JSON.stringify(roundNumber === 1 ? round1 : roundNumber === 2 ? round2 : round3);
}

const MOCK_PROBES = JSON.stringify({
  probes: [
    {
      label: 'Obsidian Premium',
      description: 'Dark, spacious, lime accent — Linear/Vercel family',
      surfaceContext: 'web',
      colorPalette: 'dark charcoal with lime green accent',
      mood: 'premium, tech-confident, editorial',
      surfaceStyle: 'matte digital, subtle shadows',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0b;color:#f5f5f5;font-family:'Space Grotesk',sans-serif}nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;position:sticky;top:0;background:rgba(10,10,11,0.8);backdrop-filter:blur(20px);z-index:10}.logo{font-size:18px;font-weight:700}.nav-links{display:flex;gap:32px;font-size:14px;color:#a1a1aa}.nav-links a{color:inherit;text-decoration:none}.cta-btn{background:#a3e635;color:#0a0a0b;padding:10px 24px;border-radius:12px;font-weight:600;font-size:14px;border:none;cursor:pointer}.hero{padding:120px 48px 80px;max-width:800px}.hero h1{font-size:72px;font-weight:700;line-height:1.05;letter-spacing:-3px}.hero h1 span{color:#a3e635}.hero p{margin-top:24px;font-size:20px;color:#a1a1aa;max-width:480px;line-height:1.5}.features{padding:80px 48px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1200px}.feature-card{background:#141416;padding:32px;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3)}.feature-card h3{font-size:18px;font-weight:600;margin-bottom:8px}.feature-card p{font-size:14px;color:#a1a1aa;line-height:1.5}footer{padding:48px;text-align:center;color:#63636e;font-size:13px}</style></head><body><nav><div class="logo">Nexus</div><div class="nav-links"><a>Features</a><a>Pricing</a><a>Docs</a></div><button class="cta-btn">Get Started</button></nav><section class="hero"><h1>Build faster.<br><span>Ship smarter.</span></h1><p>The all-in-one platform for modern development teams. From idea to production in minutes, not months.</p><button class="cta-btn" style="margin-top:40px;padding:14px 32px;font-size:16px;border-radius:16px">Start Building →</button></section><section class="features"><div class="feature-card"><h3>Lightning Deploy</h3><p>Push to production in under 30 seconds with zero-config deployments.</p></div><div class="feature-card"><h3>Edge Runtime</h3><p>Your code runs at the edge, closest to your users. Sub-50ms response times.</p></div><div class="feature-card"><h3>Team Workflows</h3><p>Built-in PR previews, branch deployments, and collaborative editing.</p></div></section><footer>Nexus Inc. — Demo Design Probe</footer></body></html>`,
    },
    {
      label: 'Warm Editorial',
      description: 'Light warm background, serif accents, editorial breathing',
      surfaceContext: 'web',
      colorPalette: 'cream and warm neutrals with deep brown accent',
      mood: 'warm, refined, editorial',
      surfaceStyle: 'paper-like texture, soft shadows',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:#faf8f5;color:#1a1a1a;font-family:'Inter',sans-serif}nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px}.logo{font-family:'DM Serif Display',serif;font-size:22px}.nav-links{display:flex;gap:32px;font-size:14px;color:#8a8578}.cta-btn{background:#2c2418;color:#faf8f5;padding:10px 24px;border-radius:100px;font-weight:500;font-size:14px;border:none;cursor:pointer}.hero{padding:100px 48px 80px;max-width:700px;margin:0 auto;text-align:center}.hero h1{font-family:'DM Serif Display',serif;font-size:64px;line-height:1.1;letter-spacing:-1px;color:#2c2418}.hero p{margin-top:20px;font-size:18px;color:#8a8578;line-height:1.6}.features{padding:60px 48px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:1000px;margin:0 auto}.feature-card{background:#f2efe9;padding:32px;border-radius:16px}.feature-card h3{font-family:'DM Serif Display',serif;font-size:20px;margin-bottom:8px;color:#2c2418}.feature-card p{font-size:14px;color:#8a8578;line-height:1.5}footer{padding:48px;text-align:center;color:#c4bfb5;font-size:13px}</style></head><body><nav><div class="logo">Atelier</div><div class="nav-links"><a>About</a><a>Work</a><a>Journal</a></div><button class="cta-btn">Contact</button></nav><section class="hero"><h1>Crafting digital experiences with soul</h1><p>We design products that feel human. Thoughtful interfaces that respect your time and attention.</p><button class="cta-btn" style="margin-top:32px;padding:14px 28px;font-size:15px">Explore Our Work →</button></section><section class="features"><div class="feature-card"><h3>Strategy</h3><p>Deep research into your users, market, and product goals before pixels.</p></div><div class="feature-card"><h3>Design</h3><p>Interfaces that balance beauty with function. Every detail intentional.</p></div><div class="feature-card"><h3>Development</h3><p>Clean code that performs. Built to scale with your growing business.</p></div></section><footer>Atelier Studio — Demo Design Probe</footer></body></html>`,
    },
    {
      label: 'Dense Power Tool',
      description: 'Information-rich, compact, data-forward utility design',
      surfaceContext: 'web',
      colorPalette: 'slate gray with blue accent',
      mood: 'functional, dense, power-user',
      surfaceStyle: 'flat with thin borders, compact spacing',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:#0f1117;color:#e4e4e7;font-family:'Inter',sans-serif}nav{display:flex;align-items:center;justify-content:space-between;padding:12px 32px;border-bottom:1px solid #1e1e2e}.logo{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:#60a5fa}.nav-links{display:flex;gap:24px;font-size:13px;color:#71717a}.cta-btn{background:#60a5fa;color:#0f1117;padding:6px 16px;border-radius:6px;font-weight:600;font-size:12px;border:none;cursor:pointer}.hero{padding:48px 32px 32px;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;max-width:1100px}.hero h1{font-size:36px;font-weight:700;line-height:1.2;letter-spacing:-0.5px}.hero p{margin-top:12px;font-size:14px;color:#71717a;line-height:1.5}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px}.stat{background:#1a1a2e;padding:16px;border-radius:8px;border:1px solid #2a2a3e}.stat .value{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#60a5fa}.stat .label{font-size:11px;color:#71717a;margin-top:4px;text-transform:uppercase;letter-spacing:1px}.features{padding:32px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:1100px}.feature-card{background:#1a1a2e;padding:20px;border-radius:8px;border:1px solid #2a2a3e}.feature-card h3{font-size:13px;font-weight:600;margin-bottom:6px}.feature-card p{font-size:12px;color:#71717a;line-height:1.4}footer{padding:24px 32px;text-align:center;color:#3f3f46;font-size:11px;border-top:1px solid #1e1e2e}</style></head><body><nav><div class="logo">dataforge_</div><div class="nav-links"><a>Dashboard</a><a>Pipelines</a><a>Models</a><a>Docs</a></div><button class="cta-btn">Sign Up Free</button></nav><section class="hero"><div><h1>Real-time analytics at enterprise scale</h1><p>Process billions of events, detect patterns instantly, and deploy ML models in production.</p><button class="cta-btn" style="margin-top:20px;padding:10px 20px;font-size:13px;border-radius:8px">Start Free Trial →</button></div><div class="stats"><div class="stat"><div class="value">99.9%</div><div class="label">Uptime</div></div><div class="stat"><div class="value">2.1B</div><div class="label">Events/day</div></div><div class="stat"><div class="value">847ms</div><div class="label">P95 Latency</div></div><div class="stat"><div class="value">12</div><div class="label">Active clusters</div></div></div></section><section class="features"><div class="feature-card"><h3>Stream Processing</h3><p>Real-time event processing with sub-second latency.</p></div><div class="feature-card"><h3>ML Pipeline</h3><p>Auto-scaling machine learning model deployment.</p></div><div class="feature-card"><h3>SQL Analytics</h3><p>Query petabytes with familiar SQL syntax.</p></div><div class="feature-card"><h3>Alerting</h3><p>Smart anomaly detection with zero false positives.</p></div></section><footer>DataForge Inc. — Demo Design Probe</footer></body></html>`,
    },
    {
      label: 'Vibrant Startup Energy',
      description: 'Colorful gradients, playful personality, energetic startup vibes',
      surfaceContext: 'web',
      colorPalette: 'purple to pink gradient with white',
      mood: 'energetic, playful, confident',
      surfaceStyle: 'glass cards, gradient backgrounds',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:linear-gradient(135deg,#1a0533 0%,#0f0a1a 50%,#0a0a1a 100%);color:#f5f5f5;font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh}nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px}.logo{font-size:20px;font-weight:800;background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nav-links{display:flex;gap:28px;font-size:14px;color:#a78bfa}.cta-btn{background:linear-gradient(135deg,#c084fc,#f472b6);color:white;padding:10px 24px;border-radius:100px;font-weight:600;font-size:14px;border:none;cursor:pointer}.hero{padding:100px 48px 60px;text-align:center}.hero h1{font-size:64px;font-weight:800;line-height:1.1;letter-spacing:-2px}.hero h1 span{background:linear-gradient(135deg,#c084fc,#f472b6,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{margin-top:20px;font-size:18px;color:#a78bfa;max-width:500px;margin-left:auto;margin-right:auto;line-height:1.5}.features{padding:60px 48px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1000px;margin:0 auto}.feature-card{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);padding:28px;border-radius:20px;border:1px solid rgba(255,255,255,0.08)}.feature-card h3{font-size:16px;font-weight:700;margin-bottom:8px;background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.feature-card p{font-size:14px;color:#a78bfa;line-height:1.5}footer{padding:48px;text-align:center;color:#4c1d95;font-size:13px}</style></head><body><nav><div class="logo">Velocity</div><div class="nav-links"><a>Product</a><a>Solutions</a><a>Pricing</a></div><button class="cta-btn">Get Started Free</button></nav><section class="hero"><h1>Work at the speed<br>of <span>thought</span></h1><p>The all-in-one workspace that brings your team together. Chat, plan, build, and ship — all in one beautiful platform.</p><button class="cta-btn" style="margin-top:32px;padding:14px 32px;font-size:16px">Start Free Today →</button></section><section class="features"><div class="feature-card"><h3>Real-time Collab</h3><p>Work together in real-time. See cursors, changes, and comments instantly.</p></div><div class="feature-card"><h3>AI Assistant</h3><p>Built-in AI that understands your workflow and anticipates your needs.</p></div><div class="feature-card"><h3>Integrations</h3><p>Connect 200+ tools you already use. Sync happens automatically.</p></div></section><footer>Velocity Inc. — Demo Design Probe</footer></body></html>`,
    },
  ],
});

const MOCK_PREFERENCE_DELTA = JSON.stringify({
  deltas: [
    { axisId: 'color_contrast', oldPosition: 20, newPosition: 15, reason: 'User rated dark probe highest' },
    { axisId: 'surface_containment', oldPosition: 15, newPosition: 10, reason: 'User preferred borderless design' },
    { axisId: 'type_drama', oldPosition: 75, newPosition: 80, reason: 'Bold typography probe rated closest' },
  ],
  tasteMapUpdates: [
    { axisId: 'color_contrast', oldPosition: 20, newPosition: 15, reason: 'Confirmed high-contrast dark preference' },
  ],
  resolvedContradictions: ['Density preference confirmed as context-dependent: spacious for landing, tighter for app'],
  newUncertainties: [],
});

const MOCK_CONVERGENCE = JSON.stringify({
  shouldContinue: false,
  reason: 'Strong convergence achieved — demo mode completes after one round.',
  overallConfidence: 0.78,
  lockedAxes: [
    'color_contrast', 'surface_containment', 'type_drama', 'type_scale',
    'surface_finish', 'color_accent',
  ],
  uncertainAxes: [
    'surface_warmth', 'type_behavior', 'structure_symmetry',
    'personality_priority', 'personality_visibility',
  ],
  suggestedFocus: ['surface_warmth', 'type_behavior', 'structure_symmetry'],
  estimatedRoundsRemaining: 1,
});

const MOCK_TASTE_SPEC = `# Refined Modern Utility — UI Design Taste Specification

## Section 1 — Taste Summary

This design language prioritizes dark, premium utility with confident tech personality. It combines high-contrast dark themes (#0a0a0b background) with a single lime green accent (#a3e635), dramatic typography using Space Grotesk, and borderless components with subtle shadow depth. The aesthetic balances editorial breathing room with purposeful information density, creating interfaces that feel both premium and functionally sharp.

## Section 2 — Core Taste DNA

**Composition**: Fluid layouts with generous breathing room (75% breathable), cinematic vertical rhythm between sections
**Hierarchy**: Typography-led with dramatic scale jumps — type does the heavy lifting, not color or decoration
**Type**: Space Grotesk (or Plus Jakarta Sans, Outfit as alternatives) — expressive with geometric character
**Color**: Dark neutral base (#0a0a0b → #141416 → #1e1e21 → #28282c) with single lime accent (#a3e635)
**Surface**: Matte digital, borderless, subtle shadows (2-8px blur), glassmorphism on nav only
**Interaction Tone**: Professional with human touches — confident, not cold
**Information Rhythm**: Cinematic spacing (64-128px between sections), clear sectional breaks

## Section 3 — Design Axes

> These axes describe the overall aesthetic character and are meant for calibrating taste direction, not as direct implementation rules.

**Structure**: 65% fluid, 72% breathable, 60% distributed hierarchy, 58% asymmetric, 70% cinematic rhythm
**Typography**: 80% dramatic, 70% product-functional, 72% expressive, 78% oversized, 55% balanced
**Surface**: 45% tactile, 25% matte, 15% borderless, 55% visible depth, 40% neutral warmth
**Color**: 35% chromatic, 70% selective accent, 55% neutral-cool, 20% high contrast
**Personality**: 65% confident energy, 60% purposeful visibility, 55% utility+identity, 30% professional, 70% trend-aware

## Section 4 — Anti-goals

**Never**: Use explicit borders or heavy container treatments — separation through shadows and spacing only
**Never**: Use generic sans-serif without character (Helvetica, Arial, system-ui alone)
**Never**: Light themes or low-contrast approaches — this is a dark-first design language
**Never**: Ornamental gradients or decorative depth effects — matte and purposeful only
**Never**: Cramped layouts without breathing room — whitespace is a feature
**Never**: Glossy or reflective surface treatments
**Never**: Bounce or elastic motion that undermines professional tone

## Section 5 — Landing Page Expression Rules

**Hero**: Full-width, left-aligned heading at 72-96px bold, max-width 800px. Subtitle at 20px in muted color. CTA button in lime accent, 16px rounded-2xl.
**Spacing**: 120px hero padding-top, 80px between sections, 48px internal card padding
**Typography**: H1 72-96px bold, H2 36-48px semibold, body 18-20px regular, 1.5 line-height
**Color**: #0a0a0b background, #f5f5f5 text, #a1a1aa secondary text, #a3e635 accent
**Cards**: Borderless with bg #141416, 16px radius, shadow 0 2px 8px rgba(0,0,0,0.3), 32px padding
**Nav**: Sticky, glass effect (backdrop-blur: 20px), bg rgba(10,10,11,0.8)

## Section 6 — Product / App UI Expression Rules

**Layout**: Tighter spacing — 16px card gap, 24px section gap, 20px internal padding
**Typography**: Page title 28-32px bold, section head 18-22px semibold, body 14-16px regular
**Sidebar**: 240px wide, bg #141416, text-based navigation, no icons unless functional
**Tables**: No borders between rows — use alternating bg (#141416 / #0a0a0b) and hover state
**Forms**: Borderless inputs with bg #1e1e21, 12px radius, focus ring using accent color
**Data**: Monospace (Geist Mono) for numbers/codes, lime accent for positive metrics

## Section 7 — Shared Typography System

**Primary font**: Space Grotesk (alternatives: Plus Jakarta Sans, Outfit)
**Mono font**: Geist Mono (alternative: JetBrains Mono)

| Level | Landing | App UI |
|-------|---------|--------|
| Hero/H1 | 72-96px / 700 | — |
| Page title | — | 28-32px / 700 |
| H2 | 36-48px / 600 | 18-22px / 600 |
| H3 | 24-28px / 600 | 16-18px / 600 |
| Body | 18-20px / 400 | 14-16px / 400 |
| Small | 14px / 400 | 12-13px / 400 |
| Mono | 14px / 500 | 13px / 400 |

**Line heights**: 1.05 for heroes, 1.3 for headings, 1.5-1.6 for body
**Letter spacing**: -3px for hero, -1px for H2, 0 for body, 0.5px for uppercase labels

## Section 8 — Shared Color + Surface System

| Token | Hex |
|-------|-----|
| --bg | #0a0a0b |
| --surface-1 | #141416 |
| --surface-2 | #1e1e21 |
| --surface-3 | #28282c |
| --surface-4 | #333338 |
| --text-primary | #f5f5f5 |
| --text-secondary | #a1a1aa |
| --text-muted | #63636e |
| --accent | #a3e635 |
| --accent-hover | #bef264 |
| --accent-soft | rgba(163,230,53,0.15) |
| --success | #4ade80 |
| --warning | #fbbf24 |
| --error | #f87171 |

**Shadows**: sm: 0 2px 8px rgba(0,0,0,0.3), md: 0 4px 16px rgba(0,0,0,0.4), lg: 0 8px 32px rgba(0,0,0,0.5)
**Glassmorphism**: Nav and modal overlays ONLY. bg rgba(20,20,22,0.7), backdrop-filter blur(20px), border 1px solid rgba(255,255,255,0.06)
**Border radius**: 16px cards, 12px buttons/inputs, 8px badges/pills

## Section 9 — Component Behavior

**Spacing system**: 8px base unit. 4/8/12/16/20/24/32/48/64/96/128px scale.
**Cards**: bg surface-1, 16px radius, shadow-sm, 24-32px padding, no borders
**Buttons**: Primary: bg accent, text bg, 12px radius, 14px font-weight-600, px-6 py-3. Secondary: bg surface-2, text secondary, same radius.
**Inputs**: bg surface-2, 12px radius, no border, focus: ring-2 accent/30
**Interactive states**: hover bg shifts one surface tier up, 200ms ease-out transition

## Section 10 — Interaction / Motion Tone

**Hover**: 200ms ease-out, background color shift
**Page transitions**: 300ms ease-in-out
**Loading**: Accent-colored spinner, 12px thin ring
**Scroll**: No parallax, no scroll-triggered animations — content loads instantly
**Motion rule**: If it doesn't serve a functional purpose, don't animate it

## Section 11 — Prompt Translation Layer

### Block A: Landing Page Prompt

\`\`\`
You are designing a landing page using Refined Modern Utility principles.
VISUAL DNA: Dark premium tech with generous spacing, lime accent, dramatic type hierarchy.
TYPOGRAPHY: Use Space Grotesk. Hero headlines 72-96px bold, section heads 36-48px semibold, body 18px regular 1.5 line-height.
COLORS: #0a0a0b background, #f5f5f5 text, #a1a1aa muted, #a3e635 accent. Surface layers: #141416, #1e1e21, #28282c.
LAYOUT: Generous 120px+ section spacing. Cards with bg #141416, 16px radius, subtle shadows. Max-width 1200px content.
SURFACES: Matte digital. Borderless cards with shadows. Glass nav only. No explicit borders anywhere.
NEVER: Light themes, explicit borders, generic fonts, ornamental gradients, cramped layouts, glossy effects.
ALWAYS: Dark base, lime accent, oversized type, generous spacing, borderless cards, Space Grotesk.
\`\`\`

### Block B: Product UI Prompt

\`\`\`
You are designing product UI using Refined Modern Utility principles adapted for dense functionality.
VISUAL DNA: Same dark premium base but tighter spacing. Functional typography. Utility-first with taste.
TYPOGRAPHY: Space Grotesk. Page titles 28-32px bold, section heads 18-22px semibold, body 14-16px regular. Geist Mono for data.
COLORS: Same palette. #0a0a0b background, #141416 sidebar/cards, #a3e635 accent for CTAs and success states.
LAYOUT: 16px card gaps, 24px section gaps, 20px internal padding. Sidebar nav 240px wide.
SURFACES: Same borderless approach but tighter. Forms use bg #1e1e21, 12px radius, no borders.
NEVER: Light themes, explicit borders, decorative elements, playful animations, rounded-full buttons.
ALWAYS: Dark base, functional density, clear hierarchy, monospace for data, accent for actions.
\`\`\`

## Section 12 — Confidence + Open Questions

**High Confidence (90%+): LOCKED**
- Dark theme with high contrast (#0a0a0b base) — overwhelmingly consistent signal
- Borderless, shadow-based containment — every reference confirms this
- Lime/green accent family — strong preference across all rounds
- Typography-led hierarchy with dramatic scale — core to the aesthetic

**Medium Confidence (70-85%): LIKELY DIRECTION**
- Space Grotesk as primary font — strong signal but alternatives could work. **Default**: Space Grotesk.
- Glassmorphism on nav only — confirmed but could extend to modals. **Default**: Nav + modals only.
- Asymmetric layouts — slight lean but context-dependent. **Default**: Asymmetric for landing, centered for app.

**Low Confidence (60-70%): UNCERTAINTY + DEFAULTS**
- Surface warmth: Neutral base is clear but degree of warmth in accents varies. **Default**: Cool foundation, warm accent limited to lime.
- Motion attitude: Minimal evidence from static references. **Default**: Restrained, functional only (200ms ease-out).
- Type expression level: Clear it should have character, but how much? **Default**: Space Grotesk at standard weight range.

**Resolved Contradictions**
- Density: Landing pages are spacious, product UIs are tighter — both confirmed as intentional, context-dependent.
- Energy vs. calm: Resolved as "confident energy" — not calm but not loud. Tech-assured personality.`;

// ──────────────────────────────────────────────────────────
// Mock Provider Implementation
// ──────────────────────────────────────────────────────────

export const demoText: TextProvider = {
  async generateText(params) {
    const detectedModule = detectModule(params.systemPrompt, params.userPrompt);

    // Simulate realistic latency per module
    const delays: Record<string, number> = {
      reference_parser: 800,
      surface_classifier: 500,
      reference_clusterer: 1200,
      taste_decomposition: 1500,
      internal_critic: 1000,
      questionnaire: 1200,
      probe_generator: 3000,
      preference_delta: 1000,
      convergence: 800,
      taste_compiler: 2000,
      unknown: 500,
    };
    await delay(delays[detectedModule] || 500);

    let text: string;
    switch (detectedModule) {
      case 'reference_parser':
        text = MOCK_REFERENCE_ANALYSIS;
        break;
      case 'surface_classifier':
        text = MOCK_SURFACE_CLASSIFICATION;
        break;
      case 'reference_clusterer':
        text = MOCK_CLUSTERS;
        break;
      case 'taste_decomposition':
        text = buildMockTasteMap();
        break;
      case 'internal_critic':
        text = MOCK_CRITIC;
        break;
      case 'questionnaire': {
        const roundMatch = params.userPrompt.match(/ROUND (\d)/i);
        const round = roundMatch ? parseInt(roundMatch[1]) : 1;
        text = buildMockQuestions(round);
        break;
      }
      case 'probe_generator':
        text = MOCK_PROBES;
        break;
      case 'preference_delta':
        text = MOCK_PREFERENCE_DELTA;
        break;
      case 'convergence':
        text = MOCK_CONVERGENCE;
        break;
      case 'taste_compiler':
        text = MOCK_TASTE_SPEC;
        break;
      default:
        text = JSON.stringify({ error: 'Unknown module in demo mode' });
    }

    return { text, usage: MOCK_USAGE };
  },
};

export const demoVision: VisionProvider = {
  async analyzeImage() {
    await delay(800);
    return {
      text: MOCK_REFERENCE_ANALYSIS,
      usage: MOCK_USAGE,
    };
  },
};
