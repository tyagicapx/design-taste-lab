'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type ExtractionMethod =
  | 'questionnaire'
  | 'whats_wrong'
  | 'drag_to_match'
  | 'steal_from_url'
  | 'probes'
  | 'compare';

interface RoundPlan {
  roundNumber: number;
  methods: ExtractionMethod[];
  reasoning: string;
  methodConfigs: Record<string, unknown>;
}

const METHOD_LABELS: Record<ExtractionMethod, { label: string; emoji: string; description: string }> = {
  whats_wrong: { label: "What's Wrong?", emoji: '🔍', description: 'Spot the deliberate flaw in each design' },
  drag_to_match: { label: 'Drag to Match', emoji: '🎚️', description: 'Slide between design extremes until it feels right' },
  steal_from_url: { label: 'Steal from a Site', emoji: '🏴‍☠️', description: 'Pick which design aspects to keep from a real site' },
  questionnaire: { label: 'Quick Questions', emoji: '💬', description: 'Answer a few visual preference questions' },
  probes: { label: 'Rate Designs', emoji: '🎨', description: 'Rate AI-generated design directions' },
  compare: { label: 'Side by Side', emoji: '⚖️', description: 'Choose between pairs of designs' },
};

const METHOD_ROUTES: Record<ExtractionMethod, string> = {
  whats_wrong: 'whats-wrong',
  drag_to_match: 'drag-to-match',
  steal_from_url: '', // special case — not under /round/
  questionnaire: 'questionnaire',
  probes: 'probes',
  compare: 'compare',
};

export default function RoundHubPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);

  const [plan, setPlan] = useState<RoundPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMethodIdx, setCurrentMethodIdx] = useState(0);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    fetch('/api/extraction/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, roundNumber }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.skip) {
          // Confidence is high enough — skip to compiling
          setSkipping(true);
          fetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'compiling' }),
          }).then(() => {
            router.push(`/session/${sessionId}/compiling`);
          });
          return;
        }
        setPlan(data.plan);
        setLoading(false);

        // Store the plan in sessionStorage so method pages can read it
        sessionStorage.setItem(`round_plan_${sessionId}_${roundNumber}`, JSON.stringify(data.plan));
      });
  }, [sessionId, roundNumber, router]);

  function startMethod(idx: number) {
    if (!plan) return;
    const method = plan.methods[idx];
    const route = METHOD_ROUTES[method];

    // Store which method index we're on
    sessionStorage.setItem(`round_method_idx_${sessionId}_${roundNumber}`, String(idx));

    if (method === 'steal_from_url') {
      router.push(`/session/${sessionId}/steal-from-url`);
    } else {
      router.push(`/session/${sessionId}/round/${roundNumber}/${route}`);
    }
  }

  if (loading || skipping) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
        <p className="mt-5 text-[var(--text-secondary)]">
          {skipping ? 'Confidence is high — skipping to compilation...' : 'Planning your round...'}
        </p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Round {roundNumber}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {plan.methods.length} steps
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          Round {roundNumber}
        </h1>
        <p className="mt-3 text-lg text-[var(--text-secondary)]">
          {roundNumber === 1
            ? "Let's discover your design taste through a few quick exercises."
            : "Let's fine-tune the details."}
        </p>

        {/* Why these methods */}
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {plan.reasoning}
        </p>

        {/* Method cards */}
        <div className="mt-10 space-y-4">
          {plan.methods.map((method, idx) => {
            const info = METHOD_LABELS[method];
            const isActive = idx === currentMethodIdx;
            const isComplete = idx < currentMethodIdx;

            return (
              <button
                key={method}
                onClick={() => { setCurrentMethodIdx(idx); startMethod(idx); }}
                disabled={idx > currentMethodIdx}
                className={`flex w-full items-center gap-5 rounded-2xl p-6 text-left transition-all duration-200 ${
                  isComplete
                    ? 'bg-emerald-500/10 shadow-[0_0_0_1px_rgba(74,222,128,0.2)]'
                    : isActive
                      ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent)]'
                      : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] opacity-50'
                }`}
              >
                {/* Step number / check */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${
                  isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive
                      ? 'bg-[var(--accent)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                }`}>
                  {isComplete ? '✓' : info.emoji}
                </div>

                <div>
                  <h3 className={`text-base font-semibold ${
                    isComplete ? 'text-emerald-400' : 'text-[var(--text-primary)]'
                  }`}>
                    {info.label}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{info.description}</p>
                </div>

                {isActive && (
                  <div className="ml-auto shrink-0">
                    <svg className="h-5 w-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Start button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => startMethod(currentMethodIdx)}
            className="group rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-[var(--bg)] shadow-[var(--shadow-md)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)]"
          >
            <span className="flex items-center gap-2">
              {currentMethodIdx === 0 ? "Let's go" : 'Continue'}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
