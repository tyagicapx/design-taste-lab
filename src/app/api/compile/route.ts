import { NextRequest, NextResponse } from 'next/server';
import { compileTasteSpec } from '@/lib/modules/taste-compiler';
import {
  acquireProcessingLock,
  releaseProcessingLock,
  updateSessionStatus,
} from '@/lib/db/queries';
import { validateSessionId } from '@/lib/security';

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { sessionId } = body;

  // CRIT-3: Validate sessionId
  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  // CRIT-4: Acquire processing lock
  if (!acquireProcessingLock(sessionId)) {
    return NextResponse.json(
      { error: 'Compilation already in progress' },
      { status: 409 }
    );
  }

  // Run async
  (async () => {
    try {
      await compileTasteSpec(sessionId);
    } catch (error) {
      console.error('Compilation failed:', error);
      updateSessionStatus(sessionId, 'error');
    } finally {
      releaseProcessingLock(sessionId);
    }
  })();

  return NextResponse.json({ status: 'compiling' });
}
