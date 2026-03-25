import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildHtmlProbeSystemPrompt,
  buildHtmlProbeUserPrompt,
} from '../prompts/probe-generation';
import {
  getSession,
  getRound,
  createProbe,
  getProbeResponses,
  getRoundProbes,
  updateProbeContent,
} from '../db/queries';
import { generateProbeVisuals, type ProbeVisual } from '../services/probe-visuals';
import { selectRelevantSites, selectContrastingSites } from '../services/website-library';
import { captureViewportScreenshot } from '../services/screenshot';

function parseJsonResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Inject generated visuals into probe HTML.
 *
 * Replaces placeholder CSS gradient backgrounds with real images.
 * Looks for the hero section and replaces its background.
 */
function injectVisualsIntoHtml(html: string, visuals: ProbeVisual[]): string {
  if (visuals.length === 0) return html;

  let modified = html;

  // Find hero visual
  const heroVisual = visuals.find((v) => v.role === 'hero');
  if (heroVisual) {
    // Strategy 1: Replace the first large background-image or gradient in the hero
    // Look for the hero/header section's gradient background and replace with image
    modified = modified.replace(
      /(class="[^"]*hero[^"]*"[^>]*style="[^"]*)(background:\s*linear-gradient\([^)]+\))/i,
      `$1background: url('${heroVisual.publicPath}') center/cover no-repeat`
    );

    // Strategy 2: If no hero class match, look for the first large section with gradient
    if (modified === html) {
      modified = modified.replace(
        /(min-height:\s*(?:100vh|80vh|90vh)[^"]*)(background:\s*(?:linear-gradient|radial-gradient)\([^)]+\))/i,
        `$1background: url('${heroVisual.publicPath}') center/cover no-repeat`
      );
    }

    // Strategy 3: Inject as a full-bleed background image in the first section
    if (modified === html) {
      // Add a background image layer to the body or first major section
      modified = modified.replace(
        /<body([^>]*)>/i,
        `<body$1><div style="position:fixed;inset:0;z-index:0;opacity:0.3;background:url('${heroVisual.publicPath}') center/cover no-repeat;pointer-events:none;"></div>`
      );
    }

    // Add credit comment
    modified = modified.replace(
      '</body>',
      `<!-- ${heroVisual.credit} - ${heroVisual.creditUrl} -->\n</body>`
    );
  }

  return modified;
}

export async function generateProbes(
  sessionId: string,
  roundNumber: number
): Promise<void> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const round = getRound(sessionId, roundNumber);
  if (!round) throw new Error('Round not found');

  // Check if probes already exist for this round
  const existing = getRoundProbes(round.id);
  if (existing.length > 0) return;

  // Get previous feedback for rounds 2-3
  let previousFeedback: unknown = undefined;
  if (roundNumber > 1) {
    const prevRound = getRound(sessionId, roundNumber - 1);
    if (prevRound) {
      const prevProbes = getRoundProbes(prevRound.id);
      const responses = getProbeResponses(sessionId, prevRound.id);
      previousFeedback = {
        deltas: prevRound.preferenceDeltas,
        probes: prevProbes.map((p) => ({
          label: p.label,
          description: p.description,
        })),
        ratings: responses.map((r) => {
          const probe = prevProbes.find((p) => p.id === r.probeId);
          return {
            probeLabel: probe?.label || 'Unknown',
            ratingType: r.ratingType,
            notes: r.notes,
            isEscapeHatch: r.isEscapeHatch,
            escapeFeedback: r.escapeFeedback,
          };
        }),
      };
    }
  }

  // Generate probe HTML/CSS via Claude
  const result = await trackApiCall(
    sessionId,
    'probe_generator',
    'claude',
    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    () =>
      textProvider.generateText({
        systemPrompt: buildHtmlProbeSystemPrompt(),
        userPrompt: buildHtmlProbeUserPrompt(
          roundNumber,
          session.tasteMap,
          previousFeedback,
          session.webTasteMap,
          session.appTasteMap,
          session.onboardingData
        ),
        maxTokens: 16384,
      })
  );

  const parsed = parseJsonResponse(result.text) as {
    probes: {
      label: string;
      description: string;
      html: string;
      surfaceContext?: string;
      colorPalette?: string;
      mood?: string;
      surfaceStyle?: string;
    }[];
  };

  // Create probe records first (so user sees structure immediately)
  const probeIds: string[] = [];
  for (const probe of parsed.probes) {
    const id = createProbe({
      roundId: round.id,
      sessionId,
      label: probe.label,
      description: probe.description,
      type: 'html_css',
      content: probe.html,
      probeType: probe.surfaceContext === 'app' ? 'dashboard' : 'landing_hero',
      surfaceContext: probe.surfaceContext || 'core',
    });
    probeIds.push(id);
  }

  // ────────────────────────────────────────────────────────────────────
  // VISUAL ASSET GENERATION — OPT-IN ONLY
  //
  // HARD RULE: Real-image visuals are ONLY generated when the user's
  // taste signals explicitly call for photography/imagery-driven design.
  //
  // Many design tastes (minimal, typographic, geometric, utility-first)
  // never use hero photography. Forcing images onto those probes would
  // misrepresent the taste and produce misleading probes.
  //
  // Signals that ENABLE visuals:
  //   - User references contain hero/background photography
  //   - Onboarding data mentions imagery, photography, editorial visuals
  //   - Taste axes: high surface_tactility, high surface_warmth, or
  //     high personality_energy with editorial/cinematic references
  //   - Reference analyses mention "imageryRole" as primary/prominent
  //   - User explicitly requests image-driven design in their vision prompt
  //
  // Signals that DISABLE visuals (default):
  //   - Minimal, typographic, or geometric design language
  //   - Utility-first or product-functional references
  //   - No photography in references
  //   - Abstract or illustration-based aesthetic
  // ────────────────────────────────────────────────────────────────────

  const hasImageKeys = !!(process.env.UNSPLASH_ACCESS_KEY && (process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY));
  const shouldUseVisuals = hasImageKeys && detectImageryTasteSignal(session);

  if (shouldUseVisuals) {
    (async () => {
      try {
        for (let i = 0; i < parsed.probes.length; i++) {
          const probe = parsed.probes[i];
          const probeId = probeIds[i];

          const visuals = await generateProbeVisuals({
            sessionId,
            probeIndex: i,
            probeName: probe.label,
            probeDescription: probe.description,
            colorPalette: probe.colorPalette || 'dark neutral with accent',
            mood: probe.mood || 'premium modern',
            surfaceStyle: probe.surfaceStyle || 'matte digital',
            imageCount: 1,
          });

          if (visuals.length > 0) {
            const enhancedHtml = injectVisualsIntoHtml(probe.html, visuals);
            updateProbeContent(probeId, enhancedHtml);
          }
        }
      } catch (err) {
        console.error('Visual generation failed (non-critical):', err);
      }
    })();
  }

  // ────────────────────────────────────────────────────────────────────
  // REAL WEBSITE PROBES — Screenshot-based reference probes
  //
  // Adds 2-4 real website screenshots as additional probes alongside
  // the AI-generated ones. These give users concrete, familiar
  // reference points to react to.
  //
  // Round 1: Mix of matching + contrasting sites (max spread)
  // Round 2-3: Only sites matching the emerging taste direction
  //
  // DISABLED in demo mode (no Puppeteer available on demo deploy)
  // ────────────────────────────────────────────────────────────────────

  if (process.env.DEMO_MODE === 'true') return; // Skip real-site probes in demo

  (async () => {
    try {
      const tasteMap = session.tasteMap as Record<
        string,
        { axisId: string; position: number; confidence: number }
      > | null;

      if (!tasteMap || Object.keys(tasteMap).length === 0) return;

      let selectedSites;
      if (roundNumber === 1) {
        // Round 1: 2 matching + 2 contrasting for max calibration signal
        const matching = selectRelevantSites(tasteMap, 2, undefined, true);
        const contrasting = selectContrastingSites(tasteMap, 2);
        // Deduplicate
        const matchingUrls = new Set(matching.map((s) => s.url));
        const uniqueContrasting = contrasting.filter((s) => !matchingUrls.has(s.url));
        selectedSites = [...matching, ...uniqueContrasting.slice(0, 2)];
      } else {
        // Round 2-3: Only matching sites (narrowing down)
        selectedSites = selectRelevantSites(tasteMap, 2, undefined, true);
      }

      // Capture screenshots (sequentially to avoid overloading Puppeteer)
      for (const site of selectedSites) {
        try {
          const screenshot = await captureViewportScreenshot(
            site.url,
            sessionId,
            { width: 1440, height: 900 }
          );

          createProbe({
            roundId: round.id,
            sessionId,
            label: site.name,
            description: site.description,
            type: 'screenshot' as 'html_css', // stored as screenshot but type column is string
            content: screenshot.filePath,      // path to screenshot image
            probeType: site.surface === 'app' ? 'dashboard' : 'landing_hero',
            surfaceContext: site.surface === 'app' ? 'app' : 'web',
            sourceUrl: site.url,
          });
        } catch (err) {
          console.error(`Failed to screenshot ${site.name} (${site.url}):`, err);
          // Continue with other sites — don't block on one failure
        }
      }
    } catch (err) {
      console.error('Real-site probe generation failed (non-critical):', err);
    }
  })();
}

/**
 * Detect whether the user's taste signals warrant real-image visuals in probes.
 *
 * Returns true ONLY when there are strong signals that the user's design taste
 * involves photography, editorial imagery, or image-driven layouts.
 *
 * Returns false (default) for minimal, typographic, geometric, utility-first,
 * or abstract design tastes — which is the majority of cases.
 */
function detectImageryTasteSignal(session: {
  tasteMap: unknown;
  onboardingData: unknown;
  clusters: unknown;
}): boolean {
  let imageryScore = 0;

  // 1. Check taste axes for imagery-leaning positions
  if (session.tasteMap) {
    const axes = session.tasteMap as Record<
      string,
      { axisId: string; position: number; confidence: number }
    >;

    for (const axis of Object.values(axes)) {
      // High tactility (>70) suggests rich visual surfaces
      if (axis.axisId === 'surface_tactility' && axis.position > 70) {
        imageryScore += 1;
      }
      // High warmth (>70) suggests organic/photographic materials
      if (axis.axisId === 'surface_warmth' && axis.position > 70) {
        imageryScore += 1;
      }
      // High drama (>80) suggests cinematic/editorial visual language
      if (axis.axisId === 'type_drama' && axis.position > 80) {
        imageryScore += 0.5;
      }
      // Cinematic rhythm (>70) suggests immersive visual sections
      if (axis.axisId === 'structure_rhythm' && axis.position > 70) {
        imageryScore += 0.5;
      }
      // Identity-first (>75) suggests branded visual identity with imagery
      if (axis.axisId === 'personality_priority' && axis.position > 75) {
        imageryScore += 0.5;
      }
    }
  }

  // 2. Check onboarding data for explicit imagery mentions
  if (session.onboardingData) {
    const onboarding = session.onboardingData as Record<string, string>;
    const visionText = (onboarding.visionPrompt || '').toLowerCase();
    const useCase = (onboarding.useCase || '').toLowerCase();

    const imageryKeywords = [
      'photo', 'photography', 'image', 'imagery', 'visual', 'hero image',
      'editorial', 'cinematic', 'immersive', 'full-bleed', 'background image',
      'magazine', 'portfolio', 'gallery', 'showcase',
    ];

    for (const keyword of imageryKeywords) {
      if (visionText.includes(keyword) || useCase.includes(keyword)) {
        imageryScore += 2; // Explicit mention is a strong signal
        break;
      }
    }
  }

  // 3. Check cluster data for photography-heavy references
  if (session.clusters) {
    const clusterStr = JSON.stringify(session.clusters).toLowerCase();
    if (
      clusterStr.includes('photography') ||
      clusterStr.includes('hero image') ||
      clusterStr.includes('full-bleed') ||
      clusterStr.includes('editorial imagery')
    ) {
      imageryScore += 1.5;
    }
  }

  // Threshold: need score >= 2 to activate visuals
  // This means at least one strong signal (explicit mention) or
  // multiple moderate signals (high tactility + high warmth + cinematic rhythm)
  return imageryScore >= 2;
}
