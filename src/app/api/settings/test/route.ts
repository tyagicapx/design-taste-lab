import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { provider, key } = body as { provider: string; key: string };
  if (!provider || !key) {
    return NextResponse.json({ error: 'provider and key required' }, { status: 400 });
  }

  try {
    switch (provider) {
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
        if (res.ok) return NextResponse.json({ valid: true });
        const err = await res.json();
        return NextResponse.json({ valid: false, error: err.error?.message || 'Invalid key' });
      }
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) return NextResponse.json({ valid: true });
        return NextResponse.json({ valid: false, error: 'Invalid key' });
      }
      case 'unsplash': {
        const res = await fetch('https://api.unsplash.com/photos?per_page=1', {
          headers: { Authorization: `Client-ID ${key}` },
        });
        if (res.ok) return NextResponse.json({ valid: true });
        return NextResponse.json({ valid: false, error: 'Invalid key' });
      }
      default:
        return NextResponse.json({ valid: false, error: `Unknown provider: ${provider}` });
    }
  } catch (err) {
    return NextResponse.json({
      valid: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
}
