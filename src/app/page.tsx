'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/* ─── Hero image grid data ─── */
const HERO_IMAGES = [
  { src: '/hero/1.jpg', alt: 'Artwork 1', span: 'normal' as const },
  { src: '/hero/2.jpg', alt: 'Artwork 2', span: 'normal' as const },
  { src: '/hero/3.jpg', alt: 'Artwork 3', span: 'tall' as const },
  { src: '/hero/4.jpg', alt: 'Artwork 4', span: 'normal' as const },
  { src: '/hero/5.jpg', alt: 'Artwork 5', span: 'normal' as const },
  { src: '/hero/6.jpg', alt: 'Artwork 6', span: 'normal' as const },
  { src: '/hero/7.jpg', alt: 'Artwork 7', span: 'tall' as const },
  { src: '/hero/8.jpg', alt: 'Artwork 8', span: 'normal' as const },
  { src: '/hero/9.jpg', alt: 'Artwork 9', span: 'normal' as const },
];

/* ─── Hero Image Collage ─── */
function HeroImageGrid() {
  return (
    <div className="columns-3 gap-3 [column-fill:balance]">
      {HERO_IMAGES.map((img, i) => (
        <div
          key={img.src}
          className="mb-3 overflow-hidden rounded-2xl shadow-[var(--shadow-sm)]"
        >
          <Image
            src={img.src}
            alt={img.alt}
            width={400}
            height={img.span === 'tall' ? 720 : 520}
            className="block w-full object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 768px) 33vw, 220px"
            priority={i < 4}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Session types & helpers ─── */
interface Session {
  id: string;
  name: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  uploading: 'Uploading',
  onboarding: 'Onboarding',
  annotating: 'Annotating',
  analyzing: 'Analyzing',
  reviewing: 'Reviewing Clusters',
  round_1_questionnaire: 'Round 1 — Q',
  round_1_probes: 'Round 1 — Probes',
  round_1_compare: 'Round 1 — Compare',
  round_2_questionnaire: 'Round 2 — Q',
  round_2_probes: 'Round 2 — Probes',
  round_2_compare: 'Round 2 — Compare',
  round_3_questionnaire: 'Round 3 — Q',
  round_3_probes: 'Round 3 — Probes',
  round_3_compare: 'Round 3 — Compare',
  compiling: 'Compiling',
  complete: 'Complete',
};

const STATUS_COLORS: Record<string, string> = {
  complete: 'text-[var(--accent)]',
  compiling: 'text-amber-400',
  analyzing: 'text-blue-400',
  reviewing: 'text-purple-400',
  onboarding: 'text-cyan-400',
};

/* ─── Editable session name ─── */
function EditableSessionName({
  session,
  onRename,
}: {
  session: Session;
  onRename: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.name || session.id.slice(0, 8));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleSave() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(session.id, trimmed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-full rounded-lg bg-[var(--surface-2)] px-3 py-1 text-base font-medium text-[var(--text-primary)] outline-none ring-2 ring-[var(--accent)]/30 focus:ring-[var(--accent)]/50"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div className="group flex items-center gap-2.5">
      <span className="text-base font-semibold text-[var(--text-primary)]">
        {session.name || `Session ${session.id.slice(0, 8)}`}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="text-[var(--text-muted)] opacity-0 transition-all duration-200 hover:text-[var(--text-secondary)] group-hover:opacity-100"
        title="Rename"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Main page ─── */
export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      });
  }, []);

  async function handleNewSession() {
    const res = await fetch('/api/sessions', { method: 'POST' });
    const { id } = await res.json();
    // V2: go to onboarding first, then references
    router.push(`/session/${id}/onboard`);
  }

  async function handleRename(sessionId: string, newName: string) {
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, name: newName } : s))
    );
  }

  return (
    <div className="min-h-screen">
      {/* ─── Hero: two-column layout ─── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-0 top-1/3 -translate-x-1/2">
          <div className="h-[500px] w-[500px] rounded-full bg-[var(--accent)]/[0.04] blur-[150px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:gap-16 md:py-28 lg:grid-cols-2 lg:gap-20 lg:py-32">
          {/* Left: text content */}
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl xl:text-8xl">
              Design<br />
              <span className="text-[var(--accent)]">Taste</span> Lab
            </h1>

            <p className="mt-6 max-w-sm text-lg text-[var(--text-secondary)] lg:text-xl">
              Extract, test, and codify your design taste into a reusable spec.
            </p>

            <div className="mt-10">
              <button
                onClick={handleNewSession}
                className="group rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-[var(--bg)] shadow-[var(--shadow-md)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)]"
              >
                <span className="flex items-center gap-2">
                  New Calibration Session
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Right: image collage */}
          <div className="relative">
            {/* Fade edges for editorial feel */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[var(--bg)] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[var(--bg)] to-transparent" />

            <div className="max-h-[680px] overflow-hidden">
              <HeroImageGrid />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sessions list ─── */}
      <div className="mx-auto max-w-3xl px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-[var(--text-muted)]">
              No sessions yet. Start your first calibration.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Sessions
            </p>
            {sessions.map((session) => {
              const statusColor = STATUS_COLORS[session.status] || 'text-[var(--text-muted)]';
              return (
                <div
                  key={session.id}
                  onClick={() => router.push(`/session/${session.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/session/${session.id}`); }}
                  className="group flex w-full cursor-pointer items-center justify-between rounded-2xl bg-[var(--surface-1)] px-6 py-5 text-left shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-md)]"
                >
                  <div>
                    <EditableSessionName
                      session={session}
                      onRename={handleRename}
                    />
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {new Date(session.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${statusColor}`}>
                      {STATUS_LABELS[session.status] || session.status}
                    </span>
                    <svg className="h-4 w-4 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
