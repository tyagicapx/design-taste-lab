import { NextRequest, NextResponse } from 'next/server';
import { compileTasteSpec } from '@/lib/modules/taste-compiler';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  // Run async
  (async () => {
    try {
      await compileTasteSpec(sessionId);
    } catch (error) {
      console.error('Compilation failed:', error);
    }
  })();

  return NextResponse.json({ status: 'compiling' });
}
