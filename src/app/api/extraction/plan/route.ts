import { NextRequest, NextResponse } from 'next/server';
import { validateSessionId } from '@/lib/security';
import { planRound1, planRound2, shouldSkipRound2 } from '@/lib/modules/round-orchestrator';
import { getSession } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { sessionId, roundNumber } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Check if we should skip this round
  if (roundNumber === 2) {
    const skipCheck = shouldSkipRound2(sessionId);
    if (skipCheck.skip) {
      return NextResponse.json({
        skip: true,
        confidence: skipCheck.confidence,
        reason: skipCheck.reason,
      });
    }
  }

  // Generate the round plan
  const plan = roundNumber === 1 ? planRound1(sessionId) : planRound2(sessionId);

  return NextResponse.json({
    skip: false,
    plan,
  });
}
