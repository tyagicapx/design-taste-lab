'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const COMPILATION_STEPS = [
  'Synthesizing all calibration data',
  'Mapping taste axes to design tokens',
  'Resolving conflicting signals',
  'Writing implementation rules',
  'Generating prompt translation layer',
];

const MAX_POLL_ATTEMPTS = 90; // 3 minutes at 2s intervals

export default function CompilingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [step, setStep] = useState(0);
  const [pollError, setPollError] = useState(false);
  const attemptsRef = useRef(0);

  const startPolling = useCallback(() => {
    attemptsRef.current = 0;
    setPollError(false);
    setStep(0);

    fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const interval = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        clearInterval(interval);
        clearInterval(stepInterval);
        setPollError(true);
        return;
      }

      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        const data = await res.json();
        if (data.status === 'complete') {
          clearInterval(interval);
          clearInterval(stepInterval);
          router.push(`/session/${sessionId}/result`);
        }
      } catch {
        // Network error — let it retry on next interval
      }
    }, 2000);

    const stepInterval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, COMPILATION_STEPS.length - 1));
    }, 6000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [sessionId, router]);

  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Animated glow */}
      <div className="pointer-events-none absolute">
        <div className="h-[300px] w-[300px] animate-pulse rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />
      </div>

      <div className="relative max-w-md text-center">
        {/* Spinner */}
        <div className="mx-auto mb-8 h-12 w-12">
          <svg className="animate-spin" viewBox="0 0 50 50">
            <circle
              cx="25" cy="25" r="20"
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="3"
            />
            <circle
              cx="25" cy="25" r="20"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeDasharray="31.4 94.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Compiling Your Taste Spec
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Building your 11-section design language document...
        </p>

        {/* Steps */}
        <div className="mt-10 text-left">
          {COMPILATION_STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-3 py-2 text-sm transition-all duration-300 ${
                i <= step ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {i < step ? (
                <span className="text-[var(--accent)]">✓</span>
              ) : i === step ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--surface-3)]" />
              )}
              {s}
            </div>
          ))}
        </div>

        {pollError && (
          <div className="mt-8 rounded-2xl bg-[var(--surface-1)] p-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Compilation is taking longer than expected.
            </p>
            <button
              onClick={() => startPolling()}
              className="mt-4 rounded-2xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
