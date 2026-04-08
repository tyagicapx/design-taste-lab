# Chrome Capture — Babysitting Script for Claude in Chrome

Use this prompt with Claude Code when you need to capture high-quality screenshots of specific websites using Claude in Chrome. This is the 20% fallback for sites not available in gallery scrapers.

## How to use

1. Open Chrome with the Claude in Chrome extension
2. Paste this prompt into Claude Code along with your list of URLs
3. Claude will navigate to each URL, wait for full load, and capture screenshots

## The Prompt

```
I need you to capture high-quality screenshots of the following websites using Claude in Chrome. For EACH URL:

1. Create a new tab in the MCP tab group
2. Navigate to the URL
3. WAIT — this is critical. Follow this exact sequence:
   a. Wait 5 seconds after navigation completes
   b. Check if there's a cookie banner — if yes, dismiss it (click Accept/OK/Close)
   c. Wait 3 more seconds after cookie dismissal
   d. Scroll down slowly (2 viewport heights) to trigger lazy loading
   e. Scroll back to the very top
   f. Wait 5 more seconds for hero animations, fonts, and images to fully settle
   g. NOW take the screenshot — it should show the hero/above-the-fold perfectly loaded

4. Save the screenshot to: public/library/{CATEGORY}/{SLUG}.png
   - SLUG = lowercase site name with hyphens (e.g., "linear" or "arc-browser")
   - CATEGORY = the category I specify below

5. After each capture, tell me: "✓ {name} — captured" or "✗ {name} — failed: {reason}"

6. If a site has a popup, modal, or interstitial — close it before capturing

7. If a site requires login — skip it and tell me

## URLS TO CAPTURE:

[paste your URL list here in this format]

Category: landing_saas
- https://linear.app (Linear)
- https://vercel.com (Vercel)

Category: dashboard_analytics
- https://app.posthog.com (PostHog Dashboard) — may need login, skip if so

Category: portfolio
- https://brittanychiang.com (Brittany Chiang)

## QUALITY RULES:
- Viewport: 1440x900 — desktop only
- Wait for ALL of these before capturing:
  - Web fonts loaded (text shouldn't be in fallback fonts)
  - Hero images/videos loaded (no placeholder gray boxes)
  - Animations completed their initial state (no mid-transition captures)
  - Lazy-loaded above-fold content rendered
- Do NOT capture while a loading spinner or skeleton is visible
- If the page looks broken or half-loaded, wait 10 more seconds and try again
```

## Tips

- Do 10-20 URLs per session (Chrome gets heavy with many tabs)
- Close tabs after capturing to free memory
- For sites with dark/light mode toggle, capture in the DEFAULT state
- For sites with multiple hero states (carousel), capture the FIRST state

## After capturing

Run this to update the manifest with the new screenshots:

```bash
npx tsx scripts/update-manifest.ts
```

This scans `public/library/` for new images and adds them to `manifest.json`.
