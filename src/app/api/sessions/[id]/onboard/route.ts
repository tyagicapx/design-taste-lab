import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionOnboarding, updateSessionStatus } from '@/lib/db/queries';
import { validateSessionId } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  updateSessionOnboarding(sessionId, body);

  // Transition to uploading (next step: upload references)
  if (session.status === 'onboarding') {
    updateSessionStatus(sessionId, 'uploading');
  }

  return NextResponse.json({ status: 'ok' });
}
