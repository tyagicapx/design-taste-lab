'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  category: string;
  options: { id: string; text: string }[];
  type: string;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  structure: { label: 'Layout', emoji: '📐' },
  typography: { label: 'Text & Fonts', emoji: '🔤' },
  surface: { label: 'Look & Feel', emoji: '✨' },
  color: { label: 'Colors', emoji: '🎨' },
  ui_personality: { label: 'Personality', emoji: '💫' },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/rounds/${roundNumber}/questionnaire/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      });
  }, [sessionId, roundNumber]);

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [optionId],
    }));

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
      }
    }, 400);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const formattedAnswers = Object.entries(answers).map(
      ([questionId, selectedOptionIds]) => ({
        questionId,
        selectedOptionIds,
      })
    );

    await fetch(`/api/rounds/${roundNumber}/questionnaire/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answers: formattedAnswers }),
    });

    router.push(`/session/${sessionId}/round/${roundNumber}/probes`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
        <p className="mt-5 text-[var(--text-secondary)]">
          Preparing your questions...
        </p>
      </div>
    );
  }

  const current = questions[currentIdx];
  if (!current) return null;

  const isLast = currentIdx === questions.length - 1;
  const hasAnswer = answers[current.id]?.length > 0;
  const cat = CATEGORY_LABELS[current.category] || {
    label: current.category,
    emoji: '❓',
  };
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass top bar */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Round {roundNumber}
          </span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {currentIdx + 1} / {questions.length}
          </span>
          <span className="text-xs font-medium text-[var(--accent)]">
            {answeredCount} answered
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-[3px] bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
            style={{
              width: `${((currentIdx + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Category pill */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-xl bg-[var(--surface-1)] px-4 py-2">
          <span className="text-base">{cat.emoji}</span>
          <span className="text-sm font-medium text-[var(--text-secondary)]">{cat.label}</span>
        </div>

        {/* Question */}
        <h2 className="mb-12 text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-5xl">
          {current.text}
        </h2>

        {/* Option cards */}
        <div className={`grid gap-4 ${current.options.length > 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {current.options.map((option, idx) => {
            const isSelected = answers[current.id]?.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(current.id, option.id)}
                className={`group relative rounded-2xl p-6 text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent),var(--shadow-glow-accent)]'
                    : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-md)]'
                }`}
              >
                {/* Letter badge */}
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)] group-hover:bg-[var(--surface-3)]'
                  }`}
                >
                  {OPTION_LETTERS[idx]}
                </div>

                {/* Option text */}
                <p
                  className={`text-lg font-semibold leading-snug transition-colors ${
                    isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {option.text}
                </p>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute right-4 top-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]">
                      <svg className="h-3.5 w-3.5 text-[var(--bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-16 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)] disabled:opacity-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!hasAnswer || submitting}
              className="rounded-2xl bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-[var(--bg)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)] disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Done — Show me the designs →'}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={!hasAnswer}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)] disabled:opacity-0"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick nav dots */}
        <div className="mt-10 flex justify-center gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? 'w-8 bg-[var(--accent)]'
                  : answers[q.id]
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
