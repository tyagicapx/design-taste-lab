'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dropzone } from '@/components/upload/dropzone';
import {
  ReferenceGrid,
  ReferenceItem,
} from '@/components/upload/reference-grid';
import { AnnotationPanel } from '@/components/upload/annotation-panel';

type InputTab = 'screenshots' | 'url' | 'pinterest';

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 py-12"><p className="text-[var(--text-muted)]">Loading...</p></div>}>
      <NewSessionContent />
    </Suspense>
  );
}

function NewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<InputTab>('screenshots');

  // URL input state
  const [urlInput, setUrlInput] = useState('');
  const [capturingUrl, setCapturingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Pinterest input state
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [importingPinterest, setImportingPinterest] = useState(false);
  const [pinterestError, setPinterestError] = useState('');
  const [pinterestStatus, setPinterestStatus] = useState('');

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!sessionId) return;
      setUploading(true);

      const formData = new FormData();
      formData.set('sessionId', sessionId);
      files.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/references/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      setReferences((prev) => [...prev, ...data.references]);
      setUploading(false);
    },
    [sessionId]
  );

  const handleUrlCapture = useCallback(async () => {
    if (!sessionId || !urlInput.trim()) return;
    setCapturingUrl(true);
    setUrlError('');

    try {
      const res = await fetch('/api/references/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, url: urlInput.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setUrlError(err.error || 'Failed to capture screenshot');
        setCapturingUrl(false);
        return;
      }

      const data = await res.json();
      setReferences((prev) => [...prev, data.reference]);
      setUrlInput('');
    } catch {
      setUrlError('Network error. Please try again.');
    }
    setCapturingUrl(false);
  }, [sessionId, urlInput]);

  const handlePinterestImport = useCallback(async () => {
    if (!sessionId || !pinterestUrl.trim()) return;
    setImportingPinterest(true);
    setPinterestError('');
    setPinterestStatus('Connecting to Pinterest...');

    try {
      const res = await fetch('/api/references/pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, boardUrl: pinterestUrl.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPinterestError(err.error || 'Failed to import Pinterest board');
        setImportingPinterest(false);
        setPinterestStatus('');
        return;
      }

      const data = await res.json();
      setReferences((prev) => [...prev, ...(data.references || [])]);
      setPinterestUrl('');
      setPinterestStatus(`Imported ${data.pinsFound} pins!`);
      setTimeout(() => setPinterestStatus(''), 3000);
    } catch {
      setPinterestError('Network error. Please try again.');
    }
    setImportingPinterest(false);
  }, [sessionId, pinterestUrl]);

  const handleRemove = useCallback((id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleAnnotationSave = useCallback(
    async (
      refId: string,
      annotations: { tags: string[]; note: string }
    ) => {
      await fetch(`/api/references/${refId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations }),
      });

      setReferences((prev) =>
        prev.map((r) => (r.id === refId ? { ...r, annotations } : r))
      );
    },
    []
  );

  async function handleStartAnalysis() {
    if (!sessionId || references.length < 3) return;
    setStarting(true);

    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'analyzing' }),
    });

    router.push(`/session/${sessionId}`);
  }

  const selectedRef = references.find((r) => r.id === selectedId);

  return (
    <div className="min-h-screen">
      {/* Glass nav */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {references.length >= 3 && (
            <button
              onClick={handleStartAnalysis}
              disabled={starting}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-accent)] disabled:opacity-50"
            >
              {starting ? 'Starting...' : 'Start Calibration →'}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Add Design References
          </h1>
          <p className="mt-3 text-lg text-[var(--text-secondary)]">
            Upload screenshots or paste website URLs.
            <span className="text-[var(--text-muted)]"> Then optionally annotate what draws you to each one.</span>
          </p>
        </div>

        {/* Input tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-[var(--surface-1)] p-1.5">
          {([
            { id: 'screenshots' as const, label: 'Screenshots', icon: '📷' },
            { id: 'url' as const, label: 'Website URL', icon: '🔗' },
            { id: 'pinterest' as const, label: 'Pinterest', icon: '📌' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[var(--surface-2)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Screenshot upload */}
        {activeTab === 'screenshots' && (
          <>
            <Dropzone onFilesSelected={handleFilesSelected} disabled={uploading} />
            {uploading && (
              <div className="mt-4 flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border border-[var(--text-muted)] border-t-[var(--accent)]" />
                <p className="text-sm text-[var(--text-muted)]">Uploading...</p>
              </div>
            )}
          </>
        )}

        {/* URL capture */}
        {activeTab === 'url' && (
          <div className="rounded-2xl bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Paste a website URL and we&apos;ll capture a screenshot to use as a reference.
            </p>
            <div className="flex gap-3">
              <input
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) handleUrlCapture(); }}
                placeholder="https://linear.app"
                className="flex-1 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
                disabled={capturingUrl}
              />
              <button
                onClick={handleUrlCapture}
                disabled={capturingUrl || !urlInput.trim()}
                className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition-all duration-200 hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                {capturingUrl ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--bg)]/30 border-t-[var(--bg)]" />
                    Capturing...
                  </span>
                ) : (
                  'Capture'
                )}
              </button>
            </div>
            {urlError && (
              <p className="mt-3 text-sm text-red-400">{urlError}</p>
            )}
            {capturingUrl && (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Taking a screenshot of the website... this takes 5-15 seconds.
              </p>
            )}
          </div>
        )}

        {/* Pinterest import */}
        {activeTab === 'pinterest' && (
          <div className="rounded-2xl bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Paste a Pinterest board URL and we&apos;ll import up to 30 pin images as references.
            </p>
            <div className="flex gap-3">
              <input
                value={pinterestUrl}
                onChange={(e) => { setPinterestUrl(e.target.value); setPinterestError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && pinterestUrl.trim()) handlePinterestImport(); }}
                placeholder="https://pinterest.com/username/board-name"
                className="flex-1 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
                disabled={importingPinterest}
              />
              <button
                onClick={handlePinterestImport}
                disabled={importingPinterest || !pinterestUrl.trim()}
                className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition-all duration-200 hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                {importingPinterest ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--bg)]/30 border-t-[var(--bg)]" />
                    Importing...
                  </span>
                ) : (
                  'Import Board'
                )}
              </button>
            </div>
            {pinterestError && (
              <p className="mt-3 text-sm text-red-400">{pinterestError}</p>
            )}
            {importingPinterest && (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                {pinterestStatus || 'Extracting pins from board... this can take 30-60 seconds.'}
              </p>
            )}
            {!importingPinterest && pinterestStatus && (
              <p className="mt-3 text-sm text-[var(--accent)]">{pinterestStatus}</p>
            )}
          </div>
        )}

        {/* Reference grid */}
        {references.length > 0 && (
          <div className="mt-12">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {references.length} reference{references.length !== 1 && 's'}{' '}
                added
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Click a reference to annotate it (optional)
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <ReferenceGrid
                references={references}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onRemove={handleRemove}
              />

              {selectedRef && (
                <AnnotationPanel
                  reference={selectedRef}
                  onSave={handleAnnotationSave}
                  onClose={() => setSelectedId(null)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
