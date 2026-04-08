'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStatusLabel, getProgress, getCurrentRound } from '@/lib/state-machine';
import type { SessionStatus } from '@/lib/types';

interface SessionData {
  id: string;
  status: SessionStatus;
  createdAt: string;
  finalMarkdown: string | null;
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  async function fetchSession() {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) {
      router.push('/');
      return;
    }
    const data = await res.json();
    setSession(data);
    setLoading(false);

    routeByStatus(data.status);
  }

  function routeByStatus(status: SessionStatus) {
    const round = getCurrentRound(status);

    switch (status) {
      case 'uploading':
      case 'annotating':
        router.push(`/session/new?id=${sessionId}`);
        break;
      case 'onboarding':
        router.push(`/session/${sessionId}/onboard`);
        break;
      case 'analyzing':
        router.push(`/session/${sessionId}/analyze`);
        break;
      case 'reviewing':
        router.push(`/session/${sessionId}/review`);
        break;
      case 'round_1_questionnaire':
      case 'round_2_questionnaire':
      case 'round_3_questionnaire':
        // V2: Route to the round hub which orchestrates the dynamic method sequence
        router.push(`/session/${sessionId}/round/${round}/hub`);
        break;
      case 'round_1_probes':
      case 'round_2_probes':
      case 'round_3_probes':
        router.push(`/session/${sessionId}/round/${round}/probes`);
        break;
      case 'round_1_compare':
      case 'round_2_compare':
      case 'round_3_compare':
        router.push(`/session/${sessionId}/round/${round}/compare`);
        break;
      case 'compiling':
        router.push(`/session/${sessionId}/compiling`);
        break;
      case 'complete':
        router.push(`/session/${sessionId}/result`);
        break;
    }
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent)]" />
      </div>
    );
  }

  const progress = getProgress(session.status);
  const label = getStatusLabel(session.status);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Session {sessionId.slice(0, 8)}
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">{label}</p>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{progress}% complete</p>
      </div>
    </div>
  );
}
