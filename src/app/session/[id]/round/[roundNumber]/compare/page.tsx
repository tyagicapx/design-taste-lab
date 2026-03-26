'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Probe {
  id: string;
  label: string;
  description: string;
  content: string;
  surfaceContext: string;
}

interface ComparisonPair {
  left: Probe;
  right: Probe;
  context: string; // "Landing page" or "Dashboard"
}

type Choice = 'left' | 'right' | 'cant_choose';

interface ComparisonResult {
  pairIdx: number;
  choice: Choice;
  reason?: string;
}

function ProbeIframe({ html, label }: { html: string; label: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (iframeRef.current) iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      className="h-full w-full"
      title={label}
      style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%', height: '250%' }}
    />
  );
}

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);

  const [pairs, setPairs] = useState<ComparisonPair[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [convergence, setConvergence] = useState<{
    shouldContinue: boolean;
    overallConfidence: number;
  } | null>(null);

  useEffect(() => {
    // Fetch convergence decision
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.convergenceDecision) {
          setConvergence(data.convergenceDecision);
        }
      });

    // Fetch probes for this round and create comparison pairs
    fetch(`/api/rounds/${roundNumber}/probes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        const probes: Probe[] = data.probes || [];
        // Create pairs: compare adjacent probes, and cross-surface pairs
        const generatedPairs: ComparisonPair[] = [];

        // Group by surface
        const webProbes = probes.filter((p) => p.surfaceContext !== 'app');
        const appProbes = probes.filter((p) => p.surfaceContext === 'app');

        // Within-surface comparisons
        for (let i = 0; i < webProbes.length - 1; i += 2) {
          generatedPairs.push({
            left: webProbes[i],
            right: webProbes[i + 1],
            context: 'Landing Page',
          });
        }
        for (let i = 0; i < appProbes.length - 1; i += 2) {
          generatedPairs.push({
            left: appProbes[i],
            right: appProbes[i + 1],
            context: 'Dashboard / App',
          });
        }

        // Cross-surface comparison (if both exist)
        if (webProbes.length > 0 && appProbes.length > 0) {
          generatedPairs.push({
            left: webProbes[0],
            right: appProbes[0],
            context: 'Cross-surface',
          });
        }

        setPairs(generatedPairs);
        setLoading(false);
      });
  }, [sessionId, roundNumber]);

  function handleChoice(choice: Choice) {
    if (choice === 'cant_choose') {
      setShowReason(true);
      return;
    }

    const result: ComparisonResult = {
      pairIdx: currentIdx,
      choice,
      reason: undefined,
    };

    setResults((prev) => [...prev, result]);

    if (currentIdx < pairs.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  }

  function handleCantChooseSubmit() {
    const result: ComparisonResult = {
      pairIdx: currentIdx,
      choice: 'cant_choose',
      reason: reason || undefined,
    };

    setResults((prev) => [...prev, result]);
    setShowReason(false);
    setReason('');

    if (currentIdx < pairs.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);

    // Submit all comparison results
    for (const result of results) {
      const pair = pairs[result.pairIdx];
      await fetch(`/api/rounds/${roundNumber}/compare/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          probeIdLeft: pair.left.id,
          probeIdRight: pair.right.id,
          choice: result.choice,
          reason: result.reason,
        }),
      });
    }

    // V2: Use convergence decision to determine next step
    // Demo mode: always stop after round 1
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const shouldContinue = isDemo ? false : (convergence?.shouldContinue ?? (roundNumber < 3));

    if (shouldContinue && roundNumber < 3) {
      router.push(`/session/${sessionId}/round/${roundNumber + 1}/questionnaire`);
    } else {
      // Skip remaining rounds — go straight to compiling
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'compiling' }),
      });
      router.push(`/session/${sessionId}/compiling`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
        <p className="mt-5 text-[var(--text-secondary)]">Preparing comparisons...</p>
      </div>
    );
  }

  if (pairs.length === 0) {
    // No pairs to compare — skip ahead
    handleSubmit();
    return null;
  }

  const currentPair = pairs[currentIdx];
  const allDone = results.length >= pairs.length;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-muted)]">Round {roundNumber}</span>
            <span className="text-[var(--surface-3)]">·</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Side-by-Side</span>
          </div>
          <span className="text-xs font-medium text-[var(--accent)]">
            {Math.min(results.length + 1, pairs.length)} / {pairs.length}
          </span>
        </div>
        <div className="h-[3px] bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${((results.length) / pairs.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {!allDone ? (
          <>
            <div className="mb-8 text-center">
              <span className="mb-3 inline-block rounded-xl bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
                {currentPair.context}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Which feels closer to what you want?
              </h1>
            </div>

            {/* Side-by-side probes */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left */}
              <button
                onClick={() => handleChoice('left')}
                className={`group overflow-hidden rounded-2xl bg-[var(--surface-1)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[0_0_0_2px_var(--accent),var(--shadow-glow-accent)] ${
                  results[currentIdx]?.choice === 'left' ? 'shadow-[0_0_0_2px_var(--accent)]' : ''
                }`}
              >
                <div className="pointer-events-none relative h-[400px] overflow-hidden bg-white">
                  <ProbeIframe html={currentPair.left.content} label={currentPair.left.label} />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--text-primary)]">{currentPair.left.label}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{currentPair.left.description}</p>
                </div>
              </button>

              {/* Right */}
              <button
                onClick={() => handleChoice('right')}
                className={`group overflow-hidden rounded-2xl bg-[var(--surface-1)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[0_0_0_2px_var(--accent),var(--shadow-glow-accent)] ${
                  results[currentIdx]?.choice === 'right' ? 'shadow-[0_0_0_2px_var(--accent)]' : ''
                }`}
              >
                <div className="pointer-events-none relative h-[400px] overflow-hidden bg-white">
                  <ProbeIframe html={currentPair.right.content} label={currentPair.right.label} />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--text-primary)]">{currentPair.right.label}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{currentPair.right.description}</p>
                </div>
              </button>
            </div>

            {/* Can't choose */}
            <div className="mt-8 text-center">
              {!showReason ? (
                <button
                  onClick={() => handleChoice('cant_choose')}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]"
                >
                  Can&apos;t choose between these →
                </button>
              ) : (
                <div className="mx-auto max-w-md">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why can't you decide? (optional — helps us understand your taste)"
                    className="mb-3 w-full rounded-xl bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
                    rows={2}
                  />
                  <button
                    onClick={handleCantChooseSubmit}
                    className="rounded-xl bg-[var(--surface-2)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-3)]"
                  >
                    Skip this comparison
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* All comparisons done */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
              <svg className="h-8 w-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Comparisons complete!
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              {results.length} comparisons recorded. Let&apos;s move forward.
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-8 rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-bold text-[var(--bg)] shadow-[var(--shadow-md)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)] disabled:opacity-50"
            >
              {submitting
                ? 'Processing...'
                : convergence && !convergence.shouldContinue
                  ? 'High confidence — Compile Taste Spec →'
                  : roundNumber < 3
                    ? `Continue to Round ${roundNumber + 1} →`
                    : 'Compile Taste Spec →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
