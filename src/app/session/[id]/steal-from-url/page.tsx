'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface SiteComponent {
  id: string;
  aspect: string;
  aspectLabel: string;
  description: string;
  extractedValues: string;
  axisTargets: string[];
}

interface SiteResult {
  url: string;
  siteName: string;
  overallVibe: string;
  components: SiteComponent[];
  screenshotPath: string;
}

export default function StealFromUrlPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [urlInput, setUrlInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [siteResult, setSiteResult] = useState<SiteResult | null>(null);
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!urlInput.trim()) return;
    setAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/extraction/steal-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'dissect', url: urlInput.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to analyze URL');
        setAnalyzing(false);
        return;
      }

      const data = await res.json();
      setSiteResult(data);
    } catch {
      setError('Network error. Please try again.');
    }
    setAnalyzing(false);
  }

  function toggleKeep(componentId: string) {
    setDecisions((prev) => ({
      ...prev,
      [componentId]: !prev[componentId],
    }));
  }

  async function handleSubmit() {
    if (!siteResult) return;
    setSubmitting(true);

    const responses = siteResult.components.map((c) => ({
      componentId: c.id,
      keep: decisions[c.id] ?? false,
      note: notes[c.id],
    }));

    await fetch('/api/extraction/steal-from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'respond', siteResult, responses }),
    });

    router.push(`/session/${sessionId}`);
  }

  const keptCount = Object.values(decisions).filter(Boolean).length;

  // Aspect colors
  const ASPECT_COLORS: Record<string, string> = {
    typography: 'bg-purple-500/15 text-purple-400',
    color: 'bg-amber-500/15 text-amber-400',
    spacing: 'bg-blue-500/15 text-blue-400',
    surface: 'bg-emerald-500/15 text-emerald-400',
    layout: 'bg-cyan-500/15 text-cyan-400',
    nav: 'bg-rose-500/15 text-rose-400',
    personality: 'bg-pink-500/15 text-pink-400',
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {siteResult && (
            <button
              onClick={handleSubmit}
              disabled={submitting || keptCount === 0}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              {submitting ? 'Saving...' : `Keep ${keptCount} component${keptCount !== 1 ? 's' : ''} →`}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {!siteResult ? (
          // URL input phase
          <>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Steal from a website
            </h1>
            <p className="mt-3 text-lg text-[var(--text-secondary)]">
              Paste a URL you love. I&apos;ll break it apart and you pick which design aspects to keep.
            </p>

            <div className="mt-10 flex gap-3">
              <input
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                placeholder="https://linear.app"
                className="flex-1 rounded-xl bg-[var(--surface-1)] px-5 py-4 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-[var(--shadow-sm)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
                disabled={analyzing}
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !urlInput.trim()}
                className="rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-semibold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                {analyzing ? 'Analyzing...' : 'Dissect'}
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            {analyzing && (
              <div className="mt-10 flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
                <p className="text-[var(--text-muted)]">Taking screenshot and analyzing design DNA... (15-20 seconds)</p>
              </div>
            )}
          </>
        ) : (
          // Results phase — show dissected components
          <>
            <div className="mb-10 flex items-start gap-6">
              {/* Screenshot thumbnail */}
              <div className="hidden shrink-0 overflow-hidden rounded-2xl shadow-[var(--shadow-md)] md:block" style={{ width: 280, height: 180 }}>
                <Image
                  src={siteResult.screenshotPath}
                  alt={siteResult.siteName}
                  width={280}
                  height={180}
                  className="h-full w-full object-cover object-top"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {siteResult.siteName}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{siteResult.url}</p>
                <p className="mt-3 text-[var(--text-secondary)]">{siteResult.overallVibe}</p>
              </div>
            </div>

            <p className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
              Which design aspects do you want to steal?
            </p>

            <div className="space-y-4">
              {siteResult.components.map((comp) => {
                const isKept = decisions[comp.id] ?? false;
                const colorClass = ASPECT_COLORS[comp.aspect] || 'bg-[var(--surface-2)] text-[var(--text-muted)]';

                return (
                  <div
                    key={comp.id}
                    className={`rounded-2xl p-6 transition-all duration-200 ${
                      isKept
                        ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent)]'
                        : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`rounded-lg px-3 py-1 text-xs font-medium ${colorClass}`}>
                            {comp.aspectLabel}
                          </span>
                        </div>
                        <p className="text-base font-medium text-[var(--text-primary)]">{comp.description}</p>
                        <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">{comp.extractedValues}</p>

                        {/* Optional note */}
                        {isKept && (
                          <input
                            value={notes[comp.id] || ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [comp.id]: e.target.value }))}
                            placeholder="Any adjustments? e.g., 'same but warmer'"
                            className="mt-3 w-full rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                          />
                        )}
                      </div>

                      <button
                        onClick={() => toggleKeep(comp.id)}
                        className={`ml-4 shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                          isKept
                            ? 'bg-[var(--accent)] text-[var(--bg)]'
                            : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
                        }`}
                      >
                        {isKept ? '✓ Keeping' : 'Steal this'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
