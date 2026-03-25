import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionnaire } from '@/lib/modules/questionnaire-engine';
import { getRound } from '@/lib/db/queries';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  const { roundNumber: roundStr } = await params;
  const roundNumber = parseInt(roundStr, 10);
  const { sessionId } = await req.json();

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
