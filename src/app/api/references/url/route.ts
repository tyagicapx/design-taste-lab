import { NextRequest, NextResponse } from 'next/server';
import { createReference } from '@/lib/db/queries';
import { captureScreenshot } from '@/lib/services/screenshot';
import { validateSessionId } from '@/lib/security';
import dns from 'dns/promises';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { sessionId, url } = body;

  if (!sessionId || !url) {
    return NextResponse.json(
      { error: 'sessionId and url are required' },
      { status: 400 }
    );
  }

  if (!validateSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // P1-1: Only allow HTTPS
  if (parsedUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 });
  }

  // P1-1: SSRF protection — reject private/internal IPs
  const hostname = parsedUrl.hostname;
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)) {
    return NextResponse.json({ error: 'Internal URLs are not allowed' }, { status: 400 });
  }
  try {
    const { address } = await dns.lookup(hostname);
    const parts = address.split('.').map(Number);
    const isPrivate = (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254)
    );
    if (isPrivate) {
      return NextResponse.json({ error: 'Internal URLs are not allowed' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Could not resolve hostname' }, { status: 400 });
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
