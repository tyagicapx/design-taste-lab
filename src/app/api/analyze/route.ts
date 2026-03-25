import { NextRequest, NextResponse } from 'next/server';
import { parseAllReferences } from '@/lib/modules/reference-parser';
import { classifyAllSurfaces } from '@/lib/modules/surface-classifier';
import { clusterReferences } from '@/lib/modules/reference-clusterer';
import { decomposeTaste } from '@/lib/modules/taste-decomposition';
import { runCritic } from '@/lib/modules/internal-critic';
import { generateQuestionnaire } from '@/lib/modules/questionnaire-engine';
import { updateSessionStatus } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  // Run async — don't block the response
  (async () => {
    try {
      // Step 1: Parse all references (Claude Vision)
      await parseAllReferences(sessionId);

      // Step 2 (V2): Classify surface types (landing page, web app, mobile, etc.)
      await classifyAllSurfaces(sessionId);

      // Step 3 (V2): Cluster references into aesthetic families
      await clusterReferences(sessionId);

      // Step 4: Decompose taste signals into 25 axes
      await decomposeTaste(sessionId);

      // Step 5: Run internal critic (adversarial analysis)
      await runCritic(sessionId);

      // Step 6: Generate Round 1 questionnaire
      await generateQuestionnaire(sessionId, 1);

      // V2: Transition to reviewing state (show clusters before questionnaire)
      updateSessionStatus(sessionId, 'reviewing');
    } catch (error) {
      console.error('Analysis pipeline failed:', error);
      // Session stays in 'analyzing' state — user can retry
    }
  })();

  return NextResponse.json({ status: 'processing' });
}
