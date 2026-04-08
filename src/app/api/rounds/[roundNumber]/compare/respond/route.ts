import { NextRequest, NextResponse } from 'next/server';
import { createComparisonResponse, getRound } from '@/lib/db/queries';
import { validateSessionId } from '@/lib/security';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  const { roundNumber: roundStr } = await params;
  const roundNumber = parseInt(roundStr, 10);
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { sessionId, probeIdLeft, probeIdRight, choice, reason } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  const round = getRound(sessionId, roundNumber);
  if (!round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  createComparisonResponse({
    sessionId,
    roundId: round.id,
    probeIdLeft,
    probeIdRight,
    choice,
    reason,
  });

  return NextResponse.json({ status: 'ok' });
}
