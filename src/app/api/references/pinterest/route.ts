import { NextRequest, NextResponse } from 'next/server';
import { createReference } from '@/lib/db/queries';
import { extractPinterestBoard } from '@/lib/services/pinterest';
import { validateSessionId } from '@/lib/security';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { sessionId, boardUrl } = body;

  if (!sessionId || !boardUrl) {
    return NextResponse.json(
      { error: 'sessionId and boardUrl are required' },
      { status: 400 }
    );
  }

  if (!validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  // Validate it looks like a Pinterest URL
  if (!boardUrl.includes('pinterest.com') && !boardUrl.includes('pin.it')) {
    return NextResponse.json(
      { error: 'Please provide a valid Pinterest board URL' },
      { status: 400 }
    );
  }

  try {
    const pins = await extractPinterestBoard(boardUrl, sessionId);

    if (pins.length === 0) {
      return NextResponse.json(
        { error: 'No images found on this board. It may be private or empty.' },
        { status: 404 }
      );
    }

    // Create reference records for each pin
    const references = pins.map((pin) => {
      const id = createReference(
        sessionId,
        pin.filename,
        pin.filePath,
        'pinterest',
        pin.pin.pinUrl || boardUrl
      );
      return {
        id,
        filename: pin.filename,
        path: pin.filePath,
        source: 'pinterest',
        sourceUrl: pin.pin.pinUrl || boardUrl,
      };
    });

    return NextResponse.json({
      references,
      pinsFound: pins.length,
    });
  } catch (err) {
    console.error('Pinterest extraction failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to extract Pinterest board';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
