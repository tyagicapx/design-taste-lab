import { NextRequest, NextResponse } from 'next/server';
import { generateProbes } from '@/lib/modules/probe-generator';
import { getRound, getRoundProbes } from '@/lib/db/queries';
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
  const { sessionId } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  // Check if probes already exist
  const round = getRound(sessionId, roundNumber);
  if (round) {
    const existingProbes = getRoundProbes(round.id);
    if (existingProbes.length > 0) {
      return NextResponse.json({ probes: existingProbes });
    }
  }

  await generateProbes(sessionId, roundNumber);

  // Fetch generated probes
  const updatedRound = getRound(sessionId, roundNumber);
  const probes = updatedRound ? getRoundProbes(updatedRound.id) : [];

  return NextResponse.json({ probes });
}
