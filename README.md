<div align="center">

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ██████╗ ████████╗██╗                                 ║
║     ██╔══██╗╚══██╔══╝██║                                 ║
║     ██║  ██║   ██║   ██║                                 ║
║     ██║  ██║   ██║   ██║                                 ║
║     ██████╔╝   ██║   ███████╗                            ║
║     ╚═════╝    ╚═╝   ╚══════╝                            ║
║                                                          ║
║           D E S I G N   T A S T E   L A B                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Extract, test, and codify your design taste into a reusable AI-ready spec.

Upload designs you love → run through 6 extraction methods (visual probes, "what's wrong?" challenges, drag-to-match spectrums, steal-from-URL decomposition, and more) → get a **complete design language document** with hex codes, font names, spacing values, and copy-pasteable prompts.

<br />

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/vb-tyagi/design-taste-lab?style=social)](https://github.com/vb-tyagi/design-taste-lab/stargazers)
[![Forks](https://img.shields.io/github/forks/vb-tyagi/design-taste-lab?style=social)](https://github.com/vb-tyagi/design-taste-lab/network/members)
[![Issues](https://img.shields.io/github/issues/vb-tyagi/design-taste-lab)](https://github.com/vb-tyagi/design-taste-lab/issues)
[![Last Commit](https://img.shields.io/github/last-commit/vb-tyagi/design-taste-lab)](https://github.com/vb-tyagi/design-taste-lab/commits/main)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#requirements)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](#tech-stack)
[![AI](https://img.shields.io/badge/AI-Claude%20%2B%20OpenAI-purple)](#tech-stack)

<br />

### 🔗 [**Live Demo →**](https://design-taste-demo.up.railway.app)

[**Quickstart**](#-quickstart) · [**Features**](#-features) · [**How It Works**](#-how-it-works) · [**Sample Output**](#-sample-output) · [**Contributing**](#-contributing) · [**Roadmap**](#-roadmap)

</div>

<br />

<p align="center">
  <img src="docs/assets/hero.gif" alt="Design Taste Lab Demo" width="100%" />
</p>

---

## 📖 Table of Contents

- [Why This Exists](#-why-this-exists)
- [Quickstart](#-quickstart)
- [How It Works](#-how-it-works)
- [Sample Output](#-sample-output)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 💡 Why This Exists

Every designer and developer has **taste** — a set of visual preferences that guide their work. But taste is trapped in your head. You can't share it, version it, or feed it to an AI tool.

**Design Taste Lab** solves this by running you through a multi-method calibration process — questionnaires, spot-the-flaw challenges, spectrum sliders, URL decomposition, and side-by-side comparisons — that extracts your aesthetic preferences and compiles them into a structured, implementation-ready specification.

The output is a **12-section markdown document** with:
- Exact hex codes, not "dark theme"
- Named fonts with alternatives, not "expressive sans-serif"
- Pixel values for spacing, not "generous breathing room"
- Copy-pasteable system prompts that make Claude/GPT generate UIs matching your taste

> **Think of it as a personality test for your design eye** — but instead of "INTJ", you get a complete design system spec.

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 🚀 Quickstart

### Prerequisites

- **Node.js 20+** and npm
- **Anthropic API key** ([get one here](https://console.anthropic.com/settings/keys))

### 1. Clone & install

```bash
git clone https://github.com/vb-tyagi/design-taste-lab.git
cd design-taste-lab
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Run

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and start your first calibration session.

<br />

> [!TIP]
> **No API keys?** Set `DEMO_MODE=true` in `.env.local` to explore with sample data — no costs incurred.

> [!NOTE]
> **Optional keys** unlock extra features: `OPENAI_API_KEY` for probe image generation, `APIFY_API_TOKEN` for Pinterest ingestion, `UNSPLASH_ACCESS_KEY` for editorial image search. See [Configuration](#-configuration) for details.

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## ⚙️ How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│                 │     │                  │     │                   │     │                  │
│   📸 Upload     │────▶│   🔬 Analyze     │────▶│   🎯 Calibrate    │────▶│   📄 Compile     │
│                 │     │                  │     │                   │     │                  │
│  Screenshots    │     │  Parse images    │     │  6 extraction     │     │  12-section      │
│  Website URLs   │     │  Classify type   │     │  methods, mixed   │     │  markdown spec   │
│  Pinterest      │     │  Cluster taste   │     │  with 394-image   │     │  with hex, px,   │
│                 │     │  Decompose axes  │     │  screenshot lib   │     │  fonts, prompts  │
│                 │     │                  │     │  1-3 adaptive rds  │     │                  │
└─────────────────┘     └──────────────────┘     └───────────────────┘     └──────────────────┘
```

### The calibration loop

1. **Onboard** — Tell us what you're building (mobile app, landing page, SaaS dashboard) and your experience level
2. **Upload references** — Screenshots, website URLs (auto-captured via Puppeteer), or Pinterest boards
3. **Analyze** — Claude Vision parses each reference, classifies surface types, clusters by aesthetic family, positions your taste on 25 axes
4. **Review clusters** — See how your references group, flag outliers, adjust classifications
5. **Calibrate** — The round orchestrator selects from **6 extraction methods** based on your reference quality and confidence gaps:

| Method | What It Does |
|--------|-------------|
| **Questionnaire** | Plain-language "would you rather" questions written for non-designers |
| **Visual Probes** | AI-generated HTML/CSS designs you rate on a 5-point scale |
| **What's Wrong?** | Spot deliberate design flaws — reveals your anti-goals and dealbreakers |
| **Drag to Match** | Position sliders on a spectrum between two design extremes |
| **Steal from URL** | Decompose a real website into keepable/rejectable components |
| **Side-by-Side Compare** | A/B pair choices mixing AI probes with real screenshots from the library |

6. **Adaptive rounds** — 1-3 rounds, selected by the orchestrator based on per-axis confidence. Stops when average confidence hits 85%+
7. **Compile** — Everything synthesized into your 12-section taste spec

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 📋 Sample Output

The final taste spec is a **12-section markdown document**. Here's what each section delivers:

| # | Section | What You Get |
|---|---------|-------------|
| 1 | **Taste Summary** | 3-4 sentence articulation of your design language |
| 2 | **Core DNA** | Invariant principles with concrete values (fonts, colors, spacing) |
| 3 | **Design Axes** | Position on 25 dimensions with confidence percentages |
| 4 | **Anti-goals** | "Never do this" rules — the strongest guardrail |
| 5 | **Landing Page Rules** | Context-specific guidance for marketing sites |
| 6 | **App UI Rules** | Separate rules for dashboards and product interfaces |
| 7 | **Typography System** | Named fonts, two type scales (landing + app), exact px |
| 8 | **Color + Surface** | Complete hex palette, surface layer system, placement logic |
| 9 | **Component Behavior** | Spacing, radius, shadows, interactive states |
| 10 | **Motion Tone** | Timing values, easing curves, what animates vs what doesn't |
| 11 | **Prompt Translation Layer** | 2 copy-pasteable prompts: one for landing pages, one for app UI |
| 12 | **Confidence Report** | What's locked, what's uncertain, default behaviors for ambiguity |

> 📁 See real taste specs in the [`examples/`](examples/) directory

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## ✨ Features

### Input Intelligence
- **Multi-source ingestion** — Upload screenshots, capture URLs via Puppeteer, import Pinterest boards via Apify
- **Smart onboarding** — Use case, experience level, taste anchors (Apple, Linear, Notion...), free-text vision prompt
- **Surface classification** — Automatically classifies references as landing pages, dashboards, mobile apps, etc.
- **Reference clustering** — Groups references by aesthetic family, detects outliers and conflicts

### Calibration Engine
- **6 extraction methods** — Questionnaire, visual probes, what's wrong, drag to match, steal from URL, and side-by-side compare
- **Round orchestrator** — Dynamically selects methods per round based on reference quality, axis confidence gaps, and prior method usage
- **Screenshot library** — 394 curated screenshots across 13 categories (SaaS, creative, e-commerce, dashboards, mobile, dark mode, trending 2026...) with pre-scored taste axes, used in What's Wrong challenges and Compare pairs
- **Surface-aware analysis** — Separate taste profiles for landing pages vs product UIs
- **Adaptive rounds** — 1-3 rounds that stop automatically when average confidence hits 85%
- **Plain-language questions** — Written for a 16-year-old, not a design director
- **Real + AI comparisons** — AI-generated HTML/CSS designs mixed with real website screenshots from the library
- **Visual asset pipeline** — Unsplash + GPT Image for imagery-driven probes (opt-in, never forced)

### Output Quality
- **12-section compiler** — Hex values, font names, px values — not vague adjectives
- **Dual prompt blocks** — Separate system prompts for landing pages and app UIs
- **Conflict resolution** — When two principles clash, the spec says which wins
- **Default behaviors** — Every uncertain area gets a concrete fallback
- **Confidence tracking** — Per-axis confidence scores with open questions for uncertain areas
- **Re-compile** — Regenerate your spec anytime with one click
- **Section copy** — Copy individual sections from the result page

### Self-Hosted & Secure
- **BYOK model** — Bring your own API keys; nothing leaves your machine
- **Settings page** — Manage API keys with masked display and live validation
- **Security hardened** — SSRF protection, path traversal guards, EXIF stripping, iframe sandboxing, env var injection prevention
- **Zero external dependencies at runtime** — SQLite database, local file storage, no cloud services required

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) + TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) |
| **Database** | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) + [Drizzle ORM](https://orm.drizzle.team/) |
| **AI — Text** | [Claude](https://www.anthropic.com/) (Anthropic SDK) |
| **AI — Vision** | Claude Vision (swappable to Gemini) |
| **AI — Images** | [OpenAI GPT Image](https://platform.openai.com/) |
| **Screenshots** | [Puppeteer](https://pptr.dev/) |
| **Pinterest** | [Apify](https://apify.com/) |
| **Image Search** | [Unsplash API](https://unsplash.com/developers) |

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## ⚙️ Configuration

| Variable | Required | Description |
|----------|:--------:|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Powers all AI analysis, extraction methods, and compilation |
| `DEMO_MODE` | ➖ | Set `true` to explore with sample data, no API keys needed |
| `OPENAI_API_KEY` | ➖ | Probe image generation (imagery-driven designs only) |
| `OPENAI_IMAGE_API_KEY` | ➖ | Separate key for image generation if different from text key |
| `APIFY_API_TOKEN` | ➖ | Pinterest board ingestion |
| `UNSPLASH_ACCESS_KEY` | ➖ | Editorial image search for probe visuals |
| `UNSPLASH_SECRET_KEY` | ➖ | Required alongside access key |
| `AI_VISION_PROVIDER` | ➖ | Set `gemini` to use Google's vision model |
| `GOOGLE_API_KEY` | ➖ | Required when using Gemini vision |
| `CLAUDE_MODEL` | ➖ | Override default model (e.g., `claude-sonnet-4-20250514`) |

> See [`.env.example`](.env.example) for the full list with signup links for each service.

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 🏗 Architecture

The system is built around **13 core modules** that form a calibration pipeline:

```
src/lib/
├── modules/                  ← Pipeline + extraction methods
│   ├── reference-parser       → Claude Vision analyzes each screenshot
│   ├── surface-classifier     → Landing page vs dashboard vs mobile
│   ├── reference-clusterer    → Groups references by aesthetic family
│   ├── taste-decomposition    → Positions taste on 25 axes (5 categories)
│   ├── internal-critic        → Adversarial self-attack on hypotheses
│   ├── round-orchestrator     → Selects methods per round based on confidence
│   ├── questionnaire-engine   → Plain-language preference questions
│   ├── probe-generator        → AI-generated HTML/CSS designs for rating
│   ├── whats-wrong            → Spot-the-flaw challenges (AI + library)
│   ├── drag-to-match          → Spectrum slider matching
│   ├── steal-from-url         → Decompose real websites into parts
│   ├── preference-delta       → Infers axis shifts from all responses
│   ├── convergence-engine     → Cross-method signal fusion
│   └── taste-compiler         → Synthesizes 12-section markdown spec
│
├── library/               ← 394 curated screenshots with taste axis scores
├── prompts/               ← 14 AI prompt templates (one per module)
├── services/              ← External integrations (Unsplash, Puppeteer, Apify)
├── ai/                    ← Provider abstraction (Claude, OpenAI, Gemini)
├── db/                    ← Schema, queries, migrations (Drizzle + SQLite)
└── taste-axes.ts          ← The 25 taste dimensions
```

### The 25 Taste Axes

Taste is measured across **5 categories, 25 dimensions**:

| Category | Axes |
|----------|------|
| **Structure** | Grid behavior, density, hierarchy, symmetry, rhythm |
| **Typography** | Drama, function, expression, scale, behavior |
| **Surface** | Tactility, finish, containment, depth, warmth |
| **Color** | Chromaticity, accent strategy, temperature, contrast |
| **Personality** | Energy, visibility, priority, tone, era, action |

Each axis is a spectrum from 0 to 100 with confidence scores and evidence tracking.

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 🤝 Contributing

We welcome contributions! See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide.

### Quick contribution paths

| Path | Good for |
|------|----------|
| 🐛 **Bug reports** | Found something broken? [Open an issue](https://github.com/vb-tyagi/design-taste-lab/issues/new) |
| 💡 **Feature ideas** | Have an idea? [Start a discussion](https://github.com/vb-tyagi/design-taste-lab/discussions) |
| 🔌 **New AI provider** | Add Gemini, Llama, Mistral — see `src/lib/ai/` |
| 🎨 **New probe types** | Mobile screens, dashboards, email templates — see `src/lib/prompts/probe-generation.ts` |
| 📐 **New taste axes** | Add more dimensions — see `src/lib/taste-axes.ts` |
| 🌍 **i18n** | Translate questionnaire language |
| 📖 **Docs** | Improve README, add tutorials, write guides |

### Development setup

```bash
git clone https://github.com/vb-tyagi/design-taste-lab.git
cd design-taste-lab
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Look for issues labeled [`good first issue`](https://github.com/vb-tyagi/design-taste-lab/labels/good%20first%20issue) to get started.

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 🗺 Roadmap

- [ ] Docker support (one-command deploy)
- [ ] Export to Tailwind config
- [ ] Export to Figma tokens
- [ ] CLI mode (headless calibration)
- [ ] Session import/export (share taste specs)
- [ ] i18n for questionnaire
- [ ] Plugin system for custom modules
- [ ] Hosted demo with sample sessions
- [ ] Additional AI providers (Gemini text, Llama, Mistral)
- [ ] Docs site with tutorials

> Have an idea? [Open a discussion](https://github.com/vb-tyagi/design-taste-lab/discussions) or [submit a PR](https://github.com/vb-tyagi/design-taste-lab/pulls).

<p align="right"><a href="#-table-of-contents">↑ back to top</a></p>

---

## 📜 License

[MIT](LICENSE) — do whatever you want with it.

---

<div align="center">

**If this tool helped you, consider giving it a ⭐**

Built with [Claude](https://claude.ai) · Shipped with taste

<br />

<a href="#top">↑ Back to top</a>

</div>
