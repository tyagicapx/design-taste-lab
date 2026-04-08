import { NextRequest, NextResponse } from 'next/server';
import { validateSessionId } from '@/lib/security';
import { generateRefPairs, processRefPairResponses, type RefPair, type RefPairResponse } from '@/lib/modules/ref-pairing';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { sessionId, action, pairs, responses } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  if (action === 'generate') {
    const maxPairs = body.maxPairs || 6;
    const generatedPairs = await generateRefPairs(sessionId, maxPairs);
    return NextResponse.json({ pairs: generatedPairs });
  }

  if (action === 'respond') {
    if (!pairs || !responses) {
      return NextResponse.json({ error: 'pairs and responses required' }, { status: 400 });
    }
    const result = await processRefPairResponses(
      sessionId,
      pairs as RefPair[],
      responses as RefPairResponse[]
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
