import { NextRequest, NextResponse } from 'next/server';
import { getSessionReferences } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const references = getSessionReferences(sessionId);
  return NextResponse.json({ references });
}
