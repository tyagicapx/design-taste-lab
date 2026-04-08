'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface DragSlider {
  id: string;
  axis: string;
  axisLabel: string;
  question: string;
  leftLabel: string;
  rightLabel: string;
  steps: {
    position: number;
    html: string;
    description: string;
  }[];
}

function ProbeIframe({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [html]);
  return (
    <iframe
      ref={ref}
      sandbox=""
      title="Design preview"
      className="h-full w-full"
      style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
    />
  );
}

export default function DragToMatchPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const roundNumber = params.roundNumber as string;

  const [sliders, setSliders] = useState<DragSlider[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/extraction/drag-to-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'generate', targetAxes: [], count: 3 }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSliders(data.sliders || []);
        // Initialize all sliders to 50 (middle)
        const initial: Record<string, number> = {};
        (data.sliders || []).forEach((s: DragSlider) => { initial[s.id] = 50; });
        setValues(initial);
        setLoading(false);
      });
  }, [sessionId]);

  function handleSliderChange(sliderId: string, value: number) {
    setValues((prev) => ({ ...prev, [sliderId]: value }));
  }

  function getActiveStep(slider: DragSlider): number {
    const val = values[slider.id] ?? 50;
    // Find the closest step
    let closest = 0;
    let minDist = Infinity;
    slider.steps.forEach((step, i) => {
      const dist = Math.abs(step.position - val);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  async function handleSubmit() {
    setSubmitting(true);
    const responses = sliders.map((s) => ({
      sliderId: s.id,
      selectedPosition: values[s.id] ?? 50,
    }));

    await fetch('/api/extraction/drag-to-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'respond', sliders, responses }),
    });

    router.push(`/session/${sessionId}/round/${roundNumber}/questionnaire`);
  }

  // Must be before any early returns per rules-of-hooks
  useEffect(() => {
    if (!loading && sliders.length === 0) {
      router.push(`/session/${sessionId}/round/${roundNumber}/questionnaire`);
    }
  }, [loading, sliders.length, router, sessionId, roundNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
        <p className="mt-5 text-[var(--text-secondary)]">Building design sliders...</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">This takes 2-3 minutes</p>
      </div>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  const current = sliders[currentIdx];
  const activeStep = getActiveStep(current);
  const isLast = currentIdx === sliders.length - 1;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Round {roundNumber} · Drag to Match
          </span>
          <span className="text-xs font-medium text-[var(--accent)]">
            {currentIdx + 1} / {sliders.length}
          </span>
        </div>
        <div className="h-[3px] bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / sliders.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Axis label */}
        <div className="mb-4 inline-flex items-center rounded-xl bg-[var(--surface-1)] px-4 py-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{current.axisLabel}</span>
        </div>

        {/* Question */}
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
          {current.question}
        </h2>

        {/* Design preview */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-md)]" style={{ height: '450px' }}>
          {current.steps[activeStep] && (
            <ProbeIframe html={current.steps[activeStep].html} />
          )}
        </div>

        {/* Step description */}
        <p className="mt-4 text-center text-sm font-medium text-[var(--text-secondary)]">
          {current.steps[activeStep]?.description}
        </p>

        {/* Slider */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--text-muted)]">{current.leftLabel}</span>
            <span className="text-sm font-medium text-[var(--text-muted)]">{current.rightLabel}</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={values[current.id] ?? 50}
            onChange={(e) => handleSliderChange(current.id, parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--surface-2)] accent-[var(--accent)]"
            style={{
              background: `linear-gradient(to right, var(--accent) ${values[current.id] ?? 50}%, var(--surface-2) ${values[current.id] ?? 50}%)`,
            }}
          />

          {/* Step markers */}
          <div className="mt-2 flex justify-between px-1">
            {current.steps.map((step) => (
              <button
                key={step.position}
                onClick={() => handleSliderChange(current.id, step.position)}
                className={`h-2 w-2 rounded-full transition-all ${
                  Math.abs((values[current.id] ?? 50) - step.position) < 13
                    ? 'bg-[var(--accent)] scale-150'
                    : 'bg-[var(--surface-3)]'
                }`}
              />
            ))}
          </div>
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

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              {submitting ? 'Processing...' : 'Continue →'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((i) => i + 1)}
              className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
