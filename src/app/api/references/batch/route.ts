import { NextRequest, NextResponse } from 'next/server';
import { validateSessionId } from '@/lib/security';
import { updateReferenceClassification } from '@/lib/db/queries';

/**
 * Batch update reference classifications.
 * Used by the review page to apply all outlier decisions in a single request
 * instead of N sequential PATCH calls.
 */
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sessionId, updates } = body as {
    sessionId: string;
    updates: { refId: string; weight: number; role: string }[];
  };

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array required' }, { status: 400 });
  }

  // Cap at 100 to prevent abuse
  if (updates.length > 100) {
    return NextResponse.json({ error: 'Max 100 updates per batch' }, { status: 400 });
  }

  let applied = 0;
  for (const update of updates) {
    if (!update.refId || typeof update.weight !== 'number' || !update.role) continue;
    updateReferenceClassification(update.refId, {
      weight: update.weight,
      role: update.role,
    });
    applied++;
  }

  return NextResponse.json({ success: true, applied });
}
