import { NextRequest, NextResponse } from 'next/server';
import { createComparisonResponse, getRound } from '@/lib/db/queries';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  const { roundNumber: roundStr } = await params;
  const roundNumber = parseInt(roundStr, 10);
  const { sessionId, probeIdLeft, probeIdRight, choice, reason } = await req.json();

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
