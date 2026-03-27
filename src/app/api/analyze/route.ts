import { NextRequest, NextResponse } from 'next/server';
import { parseAllReferences } from '@/lib/modules/reference-parser';
import { classifyAllSurfaces } from '@/lib/modules/surface-classifier';
import { clusterReferences } from '@/lib/modules/reference-clusterer';
import { decomposeTaste } from '@/lib/modules/taste-decomposition';
import { runCritic } from '@/lib/modules/internal-critic';
import { generateQuestionnaire } from '@/lib/modules/questionnaire-engine';
import {
  updateSessionStatus,
  acquireProcessingLock,
  releaseProcessingLock,
} from '@/lib/db/queries';
import { validateSessionId } from '@/lib/security';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  // CRIT-3: Validate sessionId
  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  // CRIT-4: Acquire processing lock — prevents duplicate pipeline runs
  if (!acquireProcessingLock(sessionId)) {
    return NextResponse.json(
      { error: 'Analysis already in progress' },
      { status: 409 }
    );
  }

  // Run async — don't block the response
  (async () => {
    try {
      await parseAllReferences(sessionId);
      await classifyAllSurfaces(sessionId);
      await clusterReferences(sessionId);
      await decomposeTaste(sessionId);
      await runCritic(sessionId);
      await generateQuestionnaire(sessionId, 1);
      updateSessionStatus(sessionId, 'reviewing');
    } catch (error) {
      console.error('Analysis pipeline failed:', error);
    } finally {
      // CRIT-4: Always release lock, even on error
      releaseProcessingLock(sessionId);
    }
  })();

  return NextResponse.json({ status: 'processing' });
}
