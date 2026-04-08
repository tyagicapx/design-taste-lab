'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SessionData {
  finalMarkdown: string | null;
  convergenceDecision: {
    overallConfidence: number;
    lockedAxes: string[];
    uncertainAxes: string[];
  } | null;
  onboardingData: {
    useCase: string;
    experienceLevel: string;
  } | null;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null); // tracks which section was copied
  const [recompiling, setRecompiling] = useState(false);
  const [recompileError, setRecompileError] = useState(false);
  const recompileIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recompileAttemptsRef = useRef(0);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        if (data.finalMarkdown) {
          setMarkdown(data.finalMarkdown);
        }
      });
  }, [sessionId]);

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taste-spec-${sessionId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyAll() {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied('all');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleCopySection(sectionTitle: string) {
    if (!markdown) return;
    // Extract the section content between this heading and the next Section heading
    const regex = new RegExp(
      `(# ${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?)(?=\\n# Section|$)`,
      'i'
    );
    const match = markdown.match(regex);
    if (match) {
      navigator.clipboard.writeText(match[1].trim());
      setCopied(sectionTitle);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const MAX_POLL_ATTEMPTS = 90; // 3 minutes at 2s intervals

  async function handleRecompile() {
    setRecompiling(true);
    setRecompileError(false);
    setMarkdown(null);
    recompileAttemptsRef.current = 0;

    // Clear any existing poll interval
    if (recompileIntervalRef.current) {
      clearInterval(recompileIntervalRef.current);
    }

    await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, recompile: true }),
    });

    // Poll for completion
    recompileIntervalRef.current = setInterval(async () => {
      recompileAttemptsRef.current += 1;
      if (recompileAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        if (recompileIntervalRef.current) clearInterval(recompileIntervalRef.current);
        recompileIntervalRef.current = null;
        setRecompiling(false);
        setRecompileError(true);
        return;
      }

      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        const data = await res.json();
        if (data.finalMarkdown && data.finalMarkdown !== markdown) {
          setMarkdown(data.finalMarkdown);
          setSession(data);
          setRecompiling(false);
          setRecompileError(false);
          if (recompileIntervalRef.current) clearInterval(recompileIntervalRef.current);
          recompileIntervalRef.current = null;
        }
      } catch {
        // Network error — let it retry on next interval
      }
    }, 2000);
  }

  // Cleanup recompile interval on unmount
  useEffect(() => {
    return () => {
      if (recompileIntervalRef.current) {
        clearInterval(recompileIntervalRef.current);
      }
    };
  }, []);

  const confidence = session?.convergenceDecision?.overallConfidence;
  const lockedCount = session?.convergenceDecision?.lockedAxes?.length || 0;
  const uncertainCount = session?.convergenceDecision?.uncertainAxes?.length || 0;

  // Extract section titles for quick-copy buttons
  const sectionTitles = markdown
    ? [...markdown.matchAll(/^# (Section \d+ — .+)$/gm)].map((m) => m[1])
    : [];

  return (
    <div className="min-h-screen">
      {/* Glass header */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Sessions
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleRecompile}
              disabled={recompiling}
              className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-3)] disabled:opacity-50"
            >
              {recompiling ? '⟳ Recompiling...' : '⟳ Re-compile'}
            </button>
            <button
              onClick={handleCopyAll}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                copied === 'all'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'
              }`}
            >
              {copied === 'all' ? '✓ Copied' : 'Copy All'}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--bg)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)]"
            >
              Download .md
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header + confidence summary */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Your Taste Spec
            </h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Your personalized 12-section design language document is ready.
            </p>
          </div>

          {confidence != null && (
            <div className="shrink-0 rounded-2xl bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-2 text-center text-3xl font-bold text-[var(--accent)]">
                {Math.round(confidence * 100)}%
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Overall Confidence</p>
              <div className="mt-3 flex gap-4 text-xs">
                <div>
                  <span className="font-bold text-emerald-400">{lockedCount}</span>
                  <span className="ml-1 text-[var(--text-muted)]">locked</span>
                </div>
                <div>
                  <span className="font-bold text-amber-400">{uncertainCount}</span>
                  <span className="ml-1 text-[var(--text-muted)]">uncertain</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section quick-copy bar */}
        {sectionTitles.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {sectionTitles.map((title) => {
              const shortTitle = title.replace(/Section \d+ — /, '');
              const isCopied = copied === title;
              return (
                <button
                  key={title}
                  onClick={() => handleCopySection(title)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    isCopied
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-[var(--surface-1)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {isCopied ? `✓ ${shortTitle}` : shortTitle}
                </button>
              );
            })}
          </div>
        )}

        {/* Markdown content */}
        {markdown ? (
          <div className="rounded-2xl bg-[var(--surface-1)] p-8 shadow-[var(--shadow-md)]">
            <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--text-primary)] prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-10 first:prose-h1:mt-0 prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h3:text-xl prose-h3:mt-6 prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed prose-strong:text-[var(--text-primary)] prose-li:text-[var(--text-secondary)] prose-code:rounded-lg prose-code:bg-[var(--surface-2)] prose-code:px-2 prose-code:py-1 prose-code:text-[var(--accent)] prose-code:text-sm prose-pre:rounded-xl prose-pre:bg-[var(--surface-2)] prose-pre:shadow-[var(--shadow-sm)] prose-hr:border-[var(--surface-3)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </div>
        ) : recompileError ? (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-[var(--text-secondary)]">
              Re-compilation is taking longer than expected.
            </p>
            <button
              onClick={handleRecompile}
              className="mt-4 rounded-2xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)]"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
            <p className="ml-3 mt-4 text-[var(--text-muted)]">
              {recompiling ? 'Re-compiling taste spec...' : 'Loading taste spec...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
