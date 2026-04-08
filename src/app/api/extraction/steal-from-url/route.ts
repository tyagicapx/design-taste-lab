import { NextRequest, NextResponse } from 'next/server';
import { validateSessionId } from '@/lib/security';
import { dissectUrl, processStealResponses, type StealFromUrlResult, type StealResponse } from '@/lib/modules/steal-from-url';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { sessionId, action, url, siteResult, responses } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  if (action === 'dissect') {
    if (!url) {
      return NextResponse.json({ error: 'url required' }, { status: 400 });
    }
    const result = await dissectUrl(url, sessionId);
    return NextResponse.json(result);
  }

  if (action === 'respond') {
    if (!siteResult || !responses) {
      return NextResponse.json({ error: 'siteResult and responses required' }, { status: 400 });
    }
    const result = await processStealResponses(
      sessionId,
      siteResult as StealFromUrlResult,
      responses as StealResponse[]
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
