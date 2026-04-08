'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface RefPair {
  id: string;
  refA: { id: string; filename: string; path: string };
  refB: { id: string; filename: string; path: string };
  axis: string;
  axisLabel: string;
  question: string;
  aspectLabel: string;
}

type Choice = 'a' | 'b' | 'both' | 'neither';

export default function RefPairingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const roundNumber = params.roundNumber as string;

  const [pairs, setPairs] = useState<RefPair[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [choices, setChoices] = useState<Record<string, { choice: Choice; reason?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/extraction/ref-pairing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'generate', maxPairs: 6 }),
    })
      .then((r) => r.json())
      .then((data) => {
        setPairs(data.pairs || []);
        setLoading(false);
      });
  }, [sessionId]);

  function handleChoice(pairId: string, choice: Choice) {
    setChoices((prev) => ({ ...prev, [pairId]: { choice } }));
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentIdx < pairs.length - 1) {
        setCurrentIdx((i) => i + 1);
      }
    }, 500);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const responses = pairs.map((p) => ({
      pairId: p.id,
      choice: choices[p.id]?.choice || 'both',
      reason: choices[p.id]?.reason,
    }));

    await fetch('/api/extraction/ref-pairing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'respond', pairs, responses }),
    });

    // Navigate to next extraction method (orchestrator decides)
    router.push(`/session/${sessionId}/round/${roundNumber}/questionnaire`);
  }

  useEffect(() => {
    if (!loading && pairs.length === 0) {
      router.push(`/session/${sessionId}/round/${roundNumber}/questionnaire`);
    }
  }, [loading, pairs.length, router, sessionId, roundNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
        <p className="mt-5 text-[var(--text-secondary)]">Pairing your references...</p>
      </div>
    );
  }

  if (pairs.length === 0) {
    return null;
  }

  const current = pairs[currentIdx];
  const answeredCount = Object.keys(choices).length;
  const isLast = currentIdx === pairs.length - 1;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Round {roundNumber} · Your References
          </span>
          <span className="text-xs font-medium text-[var(--accent)]">
            {answeredCount} / {pairs.length}
          </span>
        </div>
        <div className="h-[3px] bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / pairs.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Aspect badge */}
        <div className="mb-4 inline-flex items-center rounded-xl bg-[var(--surface-1)] px-4 py-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{current.aspectLabel}</span>
        </div>

        {/* Question */}
        <h2 className="mb-10 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
          {current.question}
        </h2>

        {/* Side by side refs */}
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { ref: current.refA, key: 'a' as Choice, label: 'A' },
            { ref: current.refB, key: 'b' as Choice, label: 'B' },
          ].map(({ ref, key, label }) => {
            const isSelected = choices[current.id]?.choice === key;
            return (
              <button
                key={ref.id}
                onClick={() => handleChoice(current.id, key)}
                className={`group overflow-hidden rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'shadow-[0_0_0_2px_var(--accent),var(--shadow-glow-accent)]'
                    : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]'
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
                  <Image
                    src={ref.path}
                    alt={ref.filename}
                    width={600}
                    height={450}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[var(--bg)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                    }`}>
                      {label}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">{ref.filename}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Secondary options */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => handleChoice(current.id, 'both')}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
              choices[current.id]?.choice === 'both'
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'bg-[var(--surface-1)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Both work for me
          </button>
          <button
            onClick={() => handleChoice(current.id, 'neither')}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
              choices[current.id]?.choice === 'neither'
                ? 'bg-red-500/15 text-red-400'
                : 'bg-[var(--surface-1)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Neither feels right
          </button>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-1)] disabled:opacity-0"
          >
            ← Previous
          </button>

          {isLast && answeredCount >= pairs.length ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-[var(--bg)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)] disabled:opacity-40"
            >
              {submitting ? 'Processing...' : 'Continue →'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((i) => Math.min(pairs.length - 1, i + 1))}
              disabled={!choices[current.id]}
              className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] disabled:opacity-0"
            >
              Next →
            </button>
          )}
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-1.5">
          {pairs.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrentIdx(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? 'w-8 bg-[var(--accent)]'
                  : choices[p.id]
                    ? 'w-2 bg-[var(--accent)]/40'
                    : 'w-2 bg-[var(--surface-3)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
