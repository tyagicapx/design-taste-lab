import { NextRequest, NextResponse } from 'next/server';
import { generateProbes } from '@/lib/modules/probe-generator';
import { getRound, getRoundProbes } from '@/lib/db/queries';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  const { roundNumber: roundStr } = await params;
  const roundNumber = parseInt(roundStr, 10);
  const { sessionId } = await req.json();

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
