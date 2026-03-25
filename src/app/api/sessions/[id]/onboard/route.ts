import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionOnboarding, updateSessionStatus } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();

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
