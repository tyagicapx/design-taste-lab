import { NextRequest, NextResponse } from 'next/server';
import { createReference } from '@/lib/db/queries';
import { captureScreenshot } from '@/lib/services/screenshot';

export async function POST(request: NextRequest) {
  const { sessionId, url } = await request.json();

  if (!sessionId || !url) {
    return NextResponse.json(
      { error: 'sessionId and url are required' },
      { status: 400 }
    );
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    // Capture screenshot
    const result = await captureScreenshot(parsedUrl.toString(), sessionId);

    // Create reference record
    const hostname = parsedUrl.hostname.replace('www.', '');
    const filename = `${hostname}.png`;
    const id = createReference(
      sessionId,
      filename,
      result.filePath,
      'url',
      parsedUrl.toString()
    );

    return NextResponse.json({
      reference: {
        id,
        filename,
        path: result.filePath,
        source: 'url',
        sourceUrl: parsedUrl.toString(),
      },
    });
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    return NextResponse.json(
      { error: 'Failed to capture screenshot. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}
