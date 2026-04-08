'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface WhatsWrongChallenge {
  id: string;
  html: string;
  flawAxisLabel: string;
  libraryScreenshot?: {
    id: string;
    name: string;
    imagePath: string;
    url: string;
  };
  options: {
    id: string;
    label: string;
    isCorrectFlaw: boolean;
    axisImplication: { axisId: string; direction: string; magnitude: number };
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
      title="Design challenge"
      className="h-full w-full"
      style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
    />
  );
}

export default function WhatsWrongPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const roundNumber = params.roundNumber as string;

  const [challenges, setChallenges] = useState<WhatsWrongChallenge[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/extraction/whats-wrong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'generate', targetAxes: [], count: 4 }),
    })
      .then((r) => r.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setLoading(false);
      });
  }, [sessionId]);

  function handleSelect(challengeId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [challengeId]: optionId }));
    setRevealed((prev) => ({ ...prev, [challengeId]: true }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    const responses = challenges.map((c) => ({
      challengeId: c.id,
      selectedOptionId: answers[c.id] || c.options[c.options.length - 1].id,
      freeText: freeText[c.id],
    }));

    await fetch('/api/extraction/whats-wrong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'respond', challenges, responses }),
    });

    router.push(`/session/${sessionId}/round/${roundNumber}/questionnaire`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
        <p className="mt-5 text-[var(--text-secondary)]">Creating design challenges...</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">This takes 1-2 minutes</p>
      </div>
    );
  }

  useEffect(() => {
    if (!loading && challenges.length === 0) {
      router.push(`/session/${sessionId}/round/${roundNumber}/questionnaire`);
    }
  }, [loading, challenges.length, router, sessionId, roundNumber]);

  if (challenges.length === 0 && !loading) {
    return null;
  }

  const current = challenges[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIdx === challenges.length - 1;
  const currentAnswer = answers[current.id];
  const isRevealed = revealed[current.id];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Round {roundNumber} · What&apos;s Wrong?
          </span>
          <span className="text-xs font-medium text-[var(--accent)]">
            {currentIdx + 1} / {challenges.length}
          </span>
        </div>
        <div className="h-[3px] bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / challenges.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {current.libraryScreenshot
            ? 'What would you change about this design?'
            : 'Something feels off about this design.'}
        </h2>
        <p className="mb-8 text-lg text-[var(--text-secondary)]">
          {current.libraryScreenshot
            ? "This is a real site. What doesn\u2019t match your taste?"
            : "Can you spot what\u2019s wrong?"}
        </p>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Design preview — real screenshot or AI-generated HTML */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-md)]" style={{ height: '500px' }}>
            {current.libraryScreenshot ? (
              <div className="relative h-full w-full">
                <img
                  src={current.libraryScreenshot.imagePath}
                  alt={current.libraryScreenshot.name}
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-xs font-medium text-white/80">{current.libraryScreenshot.name}</p>
                </div>
              </div>
            ) : (
              <ProbeIframe html={current.html} />
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              What feels off?
            </p>

            {current.options.map((opt) => {
              const isSelected = currentAnswer === opt.id;
              const showCorrect = isRevealed && opt.isCorrectFlaw;
              const showWrong = isRevealed && isSelected && !opt.isCorrectFlaw;

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(current.id, opt.id)}
                  disabled={isRevealed}
                  className={`w-full rounded-2xl p-5 text-left transition-all duration-200 ${
                    showCorrect
                      ? 'bg-emerald-500/15 shadow-[0_0_0_2px_#4ade80]'
                      : showWrong
                        ? 'bg-red-500/15 shadow-[0_0_0_2px_#f87171]'
                        : isSelected
                          ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent)]'
                          : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-md)]'
                  } disabled:cursor-default`}
                >
                  <p className={`text-sm font-medium ${
                    showCorrect ? 'text-emerald-400'
                      : showWrong ? 'text-red-400'
                        : isSelected ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)]'
                  }`}>
                    {opt.label}
                  </p>
                  {showCorrect && (
                    <p className="mt-1 text-xs text-emerald-400/70">✓ Correct — nice eye!</p>
                  )}
                </button>
              );
            })}

            {/* Free text for "something else" */}
            {currentAnswer === current.options[current.options.length - 1]?.id && (
              <textarea
                value={freeText[current.id] || ''}
                onChange={(e) => setFreeText((prev) => ({ ...prev, [current.id]: e.target.value }))}
                placeholder="What do you think is off?"
                className="mt-2 w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
                rows={2}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); }}
            disabled={currentIdx === 0}
            className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-1)] disabled:opacity-0"
          >
            ← Previous
          </button>

          {isLast && answeredCount >= challenges.length ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              {submitting ? 'Processing...' : 'Continue →'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((i) => Math.min(challenges.length - 1, i + 1))}
              disabled={!currentAnswer}
              className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] disabled:opacity-0"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
