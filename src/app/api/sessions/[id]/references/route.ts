import { NextRequest, NextResponse } from 'next/server';
import { getSessionReferences } from '@/lib/db/queries';
import { validateSessionId } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  const references = getSessionReferences(sessionId);
  return NextResponse.json({ references });
}
