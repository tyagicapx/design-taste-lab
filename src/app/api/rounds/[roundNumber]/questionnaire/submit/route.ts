import { NextRequest, NextResponse } from 'next/server';
import { getRound, updateRoundAnswers, updateSessionStatus } from '@/lib/db/queries';
import { SessionStatus } from '@/lib/types';
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
  const { sessionId, answers } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  const round = getRound(sessionId, roundNumber);
  if (!round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  updateRoundAnswers(round.id, answers);

  // Transition to probes state
  const probeStatus = `round_${roundNumber}_probes` as SessionStatus;
  updateSessionStatus(sessionId, probeStatus);

  return NextResponse.json({ success: true });
}
