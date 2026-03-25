# Contributing to Design Taste Lab

Thanks for your interest in contributing! This guide will get you up and running.

## Prerequisites

- **Node.js 20+** — [download](https://nodejs.org/)
- **An Anthropic API key** — [get one](https://console.anthropic.com/settings/keys) (for AI features)
- Or set `DEMO_MODE=true` to develop without API keys

## Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/design-taste-lab.git
cd design-taste-lab

# 2. Install dependencies
npm install

# 3. Run setup (creates .env.local, data directory, database)
npm run setup

# 4. Add your API key to .env.local
#    Or set DEMO_MODE=true to use sample data

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components (upload, probes, etc.)
└── lib/
    ├── ai/           # AI provider abstraction layer
    │   ├── provider.ts    # TextProvider, VisionProvider interfaces
    │   ├── claude.ts      # Anthropic Claude implementation
    │   └── registry.ts    # Provider factory (swap providers via env vars)
    ├── modules/      # The 7 core pipeline modules
    │   ├── reference-parser.ts
    │   ├── taste-decomposition.ts
    │   ├── internal-critic.ts
    │   ├── questionnaire-engine.ts
    │   ├── probe-generator.ts
    │   ├── preference-delta.ts
    │   └── taste-compiler.ts
    ├── prompts/      # Prompt templates (separated from logic)
    ├── services/     # External integrations (Pinterest, Unsplash, screenshots)
    ├── db/           # SQLite schema and queries (Drizzle ORM)
    ├── state-machine.ts   # Session status transitions
    └── taste-axes.ts      # 25 taste dimensions definition
```

## Key Concepts

- **State Machine** — Every session follows a status progression. The state machine in `state-machine.ts` validates transitions and drives UI routing.
- **Prompts are Data** — Prompt templates in `prompts/` are separate from module logic in `modules/`. This makes it easy to improve prompts without touching orchestration code.
- **Taste Map** — The central data structure. A map of 25 axes, each with a position (0-100), confidence, and evidence. Only the Preference Delta module mutates it.
- **Provider Abstraction** — All AI calls go through `TextProvider` / `VisionProvider` interfaces. Swap Claude for another model by implementing the interface.

## How to Contribute

### Adding a New AI Provider

1. Create `src/lib/ai/your-provider.ts`
2. Implement `TextProvider` and/or `VisionProvider` from `src/lib/ai/provider.ts`
3. Register it in `src/lib/ai/registry.ts` behind an env var flag
4. Update `.env.example` with the new config option
5. Test with: upload references → full analysis → questionnaire → probes

### Adding a New Probe Type

1. Study the existing probe prompt in `src/lib/prompts/probe-generation.ts`
2. Add your probe type to the round instructions (e.g., "email template", "mobile onboarding")
3. Update the `probeType` enum in `src/lib/db/schema.ts` if needed
4. Test by running a full calibration session and checking the generated probes

### Improving Questionnaire Quality

The questionnaire prompt is in `src/lib/prompts/questionnaire.ts`. The key rule: **write for a 16-year-old**. No design jargon. Every option should paint a visual picture.

### Improving the Compiler Output

The taste spec compiler prompt is in `src/lib/prompts/taste-compiler.ts`. Key requirements:
- Every color must have a hex code
- Every font must be named (not just described)
- Typography needs two registers (landing page + app UI)
- Low-confidence areas need default fallbacks

## PR Guidelines

1. **One feature per PR** — keep it focused
2. **Include screenshots** for any UI changes
3. **Run before submitting:**
   ```bash
   npm run lint
   npm run build
   ```
4. **Test with demo mode** — ensure `DEMO_MODE=true` still works
5. **Update docs** if you change configuration or architecture

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling (design system uses CSS variables — see `globals.css`)
- Functional components with hooks
- No default exports for library code (only pages)

## Questions?

Open a [Discussion](https://github.com/design-taste-lab/design-taste-lab/discussions) — we're happy to help!
