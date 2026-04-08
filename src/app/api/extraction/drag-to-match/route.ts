import { NextRequest, NextResponse } from 'next/server';
import { validateSessionId } from '@/lib/security';
import { generateDragSliders, processDragResponses, type DragSlider, type DragResponse } from '@/lib/modules/drag-to-match';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { sessionId, action, targetAxes, sliders, responses } = body;

  if (!sessionId || !validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  if (action === 'generate') {
    const axes = targetAxes || [];
    const count = body.count || 3;
    const generatedSliders = await generateDragSliders(sessionId, axes, count);
    return NextResponse.json({ sliders: generatedSliders });
  }

  if (action === 'respond') {
    if (!sliders || !responses) {
      return NextResponse.json({ error: 'sliders and responses required' }, { status: 400 });
    }
    const updates = processDragResponses(
      sliders as DragSlider[],
      responses as DragResponse[]
    );
    return NextResponse.json({ updates });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
