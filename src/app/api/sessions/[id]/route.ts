import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionStatus, updateSessionName } from '@/lib/db/queries';
import { SessionStatus } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Handle name update
  if (body.name !== undefined) {
    updateSessionName(id, body.name);
    return NextResponse.json({ success: true });
  }

  // Handle status update
  const { status } = body as { status: SessionStatus };
  try {
    updateSessionStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
