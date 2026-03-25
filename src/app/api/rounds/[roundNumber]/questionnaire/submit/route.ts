import { NextRequest, NextResponse } from 'next/server';
import { getRound, updateRoundAnswers, updateSessionStatus } from '@/lib/db/queries';
import { SessionStatus } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  const { roundNumber: roundStr } = await params;
  const roundNumber = parseInt(roundStr, 10);
  const { sessionId, answers } = await req.json();

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
