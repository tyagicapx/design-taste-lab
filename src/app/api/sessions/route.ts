import { NextResponse } from 'next/server';
import { createSession, listSessions } from '@/lib/db/queries';

export async function POST() {
  const { id, name } = createSession();
  return NextResponse.json({ id, name });
}

export async function GET() {
  const sessions = listSessions();
  return NextResponse.json(sessions);
}
