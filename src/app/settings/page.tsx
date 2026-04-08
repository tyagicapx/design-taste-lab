'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeyInfo {
  id: string;
  envVar: string;
  label: string;
  required: boolean;
  description: string;
  isSet: boolean;
  masked: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { valid: boolean; error?: string }>>({});

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setKeys(data.keys || []);
        setLoading(false);
      });
  }, []);

  async function handleSave(envVar: string) {
    if (!editValue.trim()) return;
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envVar, value: editValue.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setKeys((prev) =>
        prev.map((k) =>
          k.envVar === envVar ? { ...k, isSet: true, masked: data.masked } : k
        )
      );
      setEditingKey(null);
      setEditValue('');
    }
    setSaving(false);
  }

  async function handleTest(id: string, envVar: string) {
    setTesting(id);
    const provider = id === 'openai_image' ? 'openai' : id.replace('_access', '').replace('_secret', '');
    const key = editingKey === envVar ? editValue : '';

    // If not currently editing, we can't test (we don't have the full key)
    if (!key) {
      setTestResult((prev) => ({
        ...prev,
        [id]: { valid: false, error: 'Enter the key first, then test' },
      }));
      setTesting(null);
      return;
    }

    const res = await fetch('/api/settings/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    });
    const data = await res.json();
    setTestResult((prev) => ({ ...prev, [id]: data }));
    setTesting(null);
  }

  const testableProviders = ['anthropic', 'openai', 'openai_image', 'unsplash_access'];

  return (
    <div className="min-h-screen">
      {/* Glass nav */}
      <div className="sticky top-0 z-10 glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">Settings</h1>
        <p className="mt-3 text-lg text-[var(--text-secondary)]">
          Manage your API keys. Keys are stored in <code className="rounded-lg bg-[var(--surface-2)] px-2 py-0.5 text-sm text-[var(--accent)]">.env.local</code> on your machine.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="rounded-2xl bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {/* Status indicator */}
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          key.isSet ? 'bg-emerald-400' : key.required ? 'bg-red-400' : 'bg-[var(--surface-3)]'
                        }`}
                      />
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {key.label}
                      </h3>
                      {key.required && (
                        <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="mt-1 ml-5.5 text-sm text-[var(--text-muted)]">{key.description}</p>

                    {/* Masked value */}
                    {key.isSet && editingKey !== key.envVar && (
                      <p className="mt-2 ml-5.5 font-mono text-sm text-[var(--text-secondary)]">
                        {key.masked}
                      </p>
                    )}

                    {/* Edit mode */}
                    {editingKey === key.envVar && (
                      <div className="mt-3 ml-5.5 flex gap-2">
                        <input
                          type="password"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(key.envVar); }}
                          placeholder={`Paste your ${key.label}...`}
                          className="flex-1 rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_0_2px_var(--accent)]/30 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(key.envVar)}
                          disabled={saving || !editValue.trim()}
                          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] transition-all hover:bg-[var(--accent-hover)] disabled:opacity-40"
                        >
                          {saving ? '...' : 'Save'}
                        </button>
                        {testableProviders.includes(key.id) && (
                          <button
                            onClick={() => handleTest(key.id, key.envVar)}
                            disabled={testing === key.id || !editValue.trim()}
                            className="rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-3)] disabled:opacity-40"
                          >
                            {testing === key.id ? '...' : 'Test'}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingKey(null); setEditValue(''); }}
                          className="rounded-xl px-3 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Test result */}
                    {testResult[key.id] && (
                      <p className={`mt-2 ml-5.5 text-sm ${testResult[key.id].valid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {testResult[key.id].valid ? '✓ Key is valid' : `✗ ${testResult[key.id].error}`}
                      </p>
                    )}
                  </div>

                  {/* Edit button */}
                  {editingKey !== key.envVar && (
                    <button
                      onClick={() => { setEditingKey(key.envVar); setEditValue(''); setTestResult((prev) => { const next = { ...prev }; delete next[key.id]; return next; }); }}
                      className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-3)]"
                    >
                      {key.isSet ? 'Update' : 'Add'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 rounded-2xl bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">Note:</strong> Keys are stored in your local{' '}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs text-[var(--accent)]">.env.local</code>{' '}
            file and never leave your machine. Changes require a server restart to take effect.
          </p>
        </div>
      </div>
    </div>
  );
}
