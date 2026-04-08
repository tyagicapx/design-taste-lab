import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionnaire } from '@/lib/modules/questionnaire-engine';
import { getRound } from '@/lib/db/queries';
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

  // Check if questionnaire already exists
  const existingRound = getRound(sessionId, roundNumber);
  if (existingRound?.questionnaire) {
    return NextResponse.json({
      questions: existingRound.questionnaire,
    });
  }

  const questions = await generateQuestionnaire(sessionId, roundNumber);
  return NextResponse.json({ questions });
}
