'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [status, setStatus] = useState('Starting analysis...');
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();

      // V2: goes to reviewing state first (cluster review)
      if (data.status === 'reviewing') {
        clearInterval(interval);
        router.push(`/session/${sessionId}/review`);
      }
      // V1 compat: if somehow goes to round_1_questionnaire directly
      if (data.status === 'round_1_questionnaire') {
        clearInterval(interval);
        router.push(`/session/${sessionId}/round/1/questionnaire`);
      }
    }, 2000);

    const steps = [
      'Parsing references...',
      'Classifying surface types...',
      'Clustering aesthetic families...',
      'Decomposing taste signals...',
      'Running self-critique...',
      'Generating questionnaire...',
    ];
    let i = 0;
    const stepInterval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setStep(i);
      setStatus(steps[i]);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [sessionId, router]);

  const steps = [
    'Parse references',
    'Classify surfaces',
    'Cluster families',
    'Decompose taste',
    'Self-critique',
    'Generate questionnaire',
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Analyzing Your References
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          This takes 1-3 minutes depending on how many references you added.
        </p>

        <div className="mt-12 space-y-5">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-4">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 ${
                  i < step
                    ? 'bg-[var(--accent)] text-[var(--bg)]'
                    : i === step
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                }`}
              >
                {i < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <p
                className={`text-sm font-medium transition-colors ${
                  i <= step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {s}
              </p>
              {i === step && (
                <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{status}</p>
      </div>
    </div>
  );
}
