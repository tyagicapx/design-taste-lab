'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const USE_CASES = [
  { id: 'saas_dashboard', label: 'SaaS Dashboard', emoji: '📊' },
  { id: 'landing_page', label: 'Landing Page', emoji: '🚀' },
  { id: 'mobile_app', label: 'Mobile App', emoji: '📱' },
  { id: 'portfolio', label: 'Portfolio / Personal', emoji: '🎨' },
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

const EXPERIENCE_LEVELS = [
  { id: 'none', label: 'No design experience', desc: "I know what I like but can't explain why" },
  { id: 'some', label: 'Some experience', desc: 'I can spot good design and describe basics' },
  { id: 'professional', label: 'Professional designer', desc: 'I design interfaces for a living' },
  { id: 'design_lead', label: 'Design lead', desc: 'I lead design teams and set direction' },
];

const TASTE_ANCHORS = [
  { id: 'apple', label: 'Apple', color: 'bg-neutral-800' },
  { id: 'linear', label: 'Linear', color: 'bg-purple-900/30' },
  { id: 'notion', label: 'Notion', color: 'bg-neutral-800' },
  { id: 'stripe', label: 'Stripe', color: 'bg-indigo-900/30' },
  { id: 'vercel', label: 'Vercel', color: 'bg-neutral-800' },
  { id: 'figma', label: 'Figma', color: 'bg-orange-900/20' },
  { id: 'arc', label: 'Arc Browser', color: 'bg-blue-900/30' },
  { id: 'spotify', label: 'Spotify', color: 'bg-green-900/30' },
  { id: 'airbnb', label: 'Airbnb', color: 'bg-rose-900/20' },
  { id: 'nike', label: 'Nike', color: 'bg-neutral-800' },
  { id: 'mercury', label: 'Mercury', color: 'bg-cyan-900/20' },
  { id: 'raycast', label: 'Raycast', color: 'bg-amber-900/20' },
  { id: 'framer', label: 'Framer', color: 'bg-purple-900/20' },
  { id: 'supabase', label: 'Supabase', color: 'bg-emerald-900/20' },
  { id: 'github', label: 'GitHub', color: 'bg-neutral-800' },
  { id: 'superhuman', label: 'Superhuman', color: 'bg-blue-900/20' },
];

type Step = 'use_case' | 'experience' | 'anchors' | 'vision';

export default function OnboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [step, setStep] = useState<Step>('use_case');
  const [useCase, setUseCase] = useState('');
  const [useCaseOther, setUseCaseOther] = useState('');
  const [experience, setExperience] = useState('');
  const [anchors, setAnchors] = useState<string[]>([]);
  const [vision, setVision] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleAnchor(id: string) {
    setAnchors((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    await fetch(`/api/sessions/${sessionId}/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useCase,
        useCaseOther: useCase === 'other' ? useCaseOther : undefined,
        experienceLevel: experience,
        tasteAnchors: anchors,
        visionPrompt: vision || undefined,
      }),
    });
    router.push(`/session/new?id=${sessionId}`);
  }

  const steps: Step[] = ['use_case', 'experience', 'anchors', 'vision'];
  const stepIdx = steps.indexOf(step);
  const canNext =
    (step === 'use_case' && useCase) ||
    (step === 'experience' && experience) ||
    step === 'anchors' ||
    step === 'vision';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Glass top bar */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-muted)]">Getting Started</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {stepIdx + 1} / {steps.length}
          </span>
        </div>
        <div className="h-[3px] bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Step 1: Use case */}
        {step === 'use_case' && (
          <div>
            <h2 className="mb-3 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              What are you building?
            </h2>
            <p className="mb-10 text-lg text-[var(--text-secondary)]">
              This helps us tailor the calibration to your context.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {USE_CASES.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => setUseCase(uc.id)}
                  className={`flex items-center gap-4 rounded-2xl p-5 text-left transition-all duration-200 ${
                    useCase === uc.id
                      ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent)]'
                      : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span className="text-2xl">{uc.emoji}</span>
                  <span className={`text-base font-semibold ${
                    useCase === uc.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    {uc.label}
                  </span>
                </button>
              ))}
            </div>

            {useCase === 'other' && (
              <input
                value={useCaseOther}
                onChange={(e) => setUseCaseOther(e.target.value)}
                placeholder="What are you building?"
                className="mt-4 w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
              />
            )}
          </div>
        )}

        {/* Step 2: Experience */}
        {step === 'experience' && (
          <div>
            <h2 className="mb-3 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Your design background
            </h2>
            <p className="mb-10 text-lg text-[var(--text-secondary)]">
              We&apos;ll adjust the language and depth based on this.
            </p>

            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setExperience(lvl.id)}
                  className={`w-full rounded-2xl p-5 text-left transition-all duration-200 ${
                    experience === lvl.id
                      ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent)]'
                      : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <p className={`text-base font-semibold ${
                    experience === lvl.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    {lvl.label}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Taste anchors */}
        {step === 'anchors' && (
          <div>
            <h2 className="mb-3 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Which brands feel closest?
            </h2>
            <p className="mb-10 text-lg text-[var(--text-secondary)]">
              Pick any that resonate with your taste. This is optional — skip if nothing fits.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TASTE_ANCHORS.map((brand) => {
                const selected = anchors.includes(brand.id);
                return (
                  <button
                    key={brand.id}
                    onClick={() => toggleAnchor(brand.id)}
                    className={`rounded-2xl px-4 py-4 text-center transition-all duration-200 ${
                      selected
                        ? 'bg-[var(--accent-soft)] shadow-[0_0_0_2px_var(--accent)]'
                        : `${brand.color} shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]`
                    }`}
                  >
                    <span className={`text-sm font-semibold ${
                      selected ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                    }`}>
                      {brand.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {anchors.length > 0 && (
              <p className="mt-4 text-sm text-[var(--accent)]">
                {anchors.length} selected
              </p>
            )}
          </div>
        )}

        {/* Step 4: Vision prompt */}
        {step === 'vision' && (
          <div>
            <h2 className="mb-3 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Describe your vision
            </h2>
            <p className="mb-10 text-lg text-[var(--text-secondary)]">
              Optional — tell us in your own words what you&apos;re going for. This helps us understand nuances that references alone might miss.
            </p>

            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="e.g., I want something that feels like Linear meets a luxury fashion brand — technically sharp but with a warm, editorial touch. Dark theme, expressive typography, lots of breathing room..."
              className="w-full rounded-2xl bg-[var(--surface-1)] px-5 py-4 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-[var(--shadow-sm)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
              rows={6}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-16 flex items-center justify-between">
          <button
            onClick={() => setStep(steps[stepIdx - 1])}
            disabled={stepIdx === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)] disabled:opacity-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {step === 'vision' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-2xl bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-[var(--bg)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Continue to References →'}
            </button>
          ) : (
            <button
              onClick={() => setStep(steps[stepIdx + 1])}
              disabled={!canNext}
              className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition-all duration-200 hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
