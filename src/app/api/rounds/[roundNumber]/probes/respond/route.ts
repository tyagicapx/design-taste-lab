import { NextRequest, NextResponse } from 'next/server';
import { createProbeResponse, updateSessionStatus } from '@/lib/db/queries';
import { computePreferenceDeltas } from '@/lib/modules/preference-delta';
import { evaluateConvergence } from '@/lib/modules/convergence-engine';
import { generateQuestionnaire } from '@/lib/modules/questionnaire-engine';
import { SessionStatus } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  const { roundNumber: roundStr } = await params;
  const roundNumber = parseInt(roundStr, 10);
  const { sessionId, responses } = await req.json();

  // Save all probe responses
  for (const resp of responses) {
    createProbeResponse({
      probeId: resp.probeId,
      sessionId,
      ratingType: resp.ratingType,
      notes: resp.notes,
      isEscapeHatch: resp.isEscapeHatch,
      escapeFeedback: resp.escapeFeedback,
    });
  }

  // Compute preference deltas (updates taste map)
  await computePreferenceDeltas(sessionId, roundNumber);

  // V2: Evaluate convergence — should we continue or compile?
  const convergence = await evaluateConvergence(sessionId, roundNumber);

  // Transition to compare state (compare page will read convergence decision)
  const compareStatus = `round_${roundNumber}_compare` as SessionStatus;
  updateSessionStatus(sessionId, compareStatus);

  // If convergence says continue, pre-generate next round's questionnaire in background
  if (convergence.shouldContinue && roundNumber < 3) {
    const nextRound = roundNumber + 1;
    generateQuestionnaire(sessionId, nextRound).catch((err) => {
      console.error(`Failed to pre-generate round ${nextRound} questionnaire:`, err);
    });
  }

  return NextResponse.json({
    success: true,
    convergence: {
      shouldContinue: convergence.shouldContinue,
      overallConfidence: convergence.overallConfidence,
      nextRoundDepth: convergence.nextRoundDepth,
    },
  });
}
