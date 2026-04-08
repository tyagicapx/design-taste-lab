import { NextRequest, NextResponse } from 'next/server';
import { validateSessionId } from '@/lib/security';
import { generateWhatsWrongChallenges, generateLibraryChallenges, processWhatsWrongResponses, type WhatsWrongChallenge, type WhatsWrongResponse } from '@/lib/modules/whats-wrong';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { sessionId, action, targetAxes, challenges, responses } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  if (action === 'generate') {
    const axes = targetAxes || [];
    const count = body.count || 4;

    // Mix: generate library-based challenges for ~half, AI HTML for the rest
    const libraryCount = Math.min(2, Math.floor(count / 2));
    const aiCount = count - libraryCount;

    // Run both in parallel — library challenges use first N axes, AI gets the rest
    const [libraryChallenges, aiChallenges] = await Promise.all([
      generateLibraryChallenges(sessionId, axes.slice(0, libraryCount), libraryCount).catch(() => []),
      generateWhatsWrongChallenges(sessionId, axes.slice(libraryCount), aiCount),
    ]);

    // Interleave: library first (real sites), then AI-generated
    const generatedChallenges = [...libraryChallenges, ...aiChallenges];
    return NextResponse.json({ challenges: generatedChallenges });
  }

  if (action === 'respond') {
    if (!challenges || !responses) {
      return NextResponse.json({ error: 'challenges and responses required' }, { status: 400 });
    }
    const deltas = processWhatsWrongResponses(
      challenges as WhatsWrongChallenge[],
      responses as WhatsWrongResponse[]
    );
    return NextResponse.json({ deltas });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
