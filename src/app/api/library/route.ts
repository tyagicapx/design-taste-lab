import { NextRequest, NextResponse } from 'next/server';
import {
  loadLibrary,
  filterByCategory,
  filterByTags,
  matchToTasteMap,
  findContrastingScreenshots,
  getOnboardingGrid,
} from '@/lib/library/loader';
import { validateSessionId } from '@/lib/security';
import { getSession } from '@/lib/db/queries';
import type { TasteMap } from '@/lib/types';
import type { LibraryCategory } from '@/lib/library/types';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action } = body;

  switch (action) {
    case 'all': {
      const library = loadLibrary();
      return NextResponse.json({ count: library.length, screenshots: library });
    }

    case 'by_category': {
      const { category } = body as { category: LibraryCategory };
      const results = filterByCategory(category);
      return NextResponse.json({ count: results.length, screenshots: results });
    }

    case 'by_tags': {
      const { tags } = body;
      const results = filterByTags(tags);
      return NextResponse.json({ count: results.length, screenshots: results });
    }

    case 'match_taste': {
      const { sessionId, categories, limit, theme } = body;
      if (!sessionId || !validateSessionId(sessionId)) {
        return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
      }
      const session = getSession(sessionId);
      if (!session?.tasteMap) {
        return NextResponse.json({ error: 'No taste map available' }, { status: 400 });
      }
      const results = matchToTasteMap(session.tasteMap as TasteMap, {
        categories,
        limit: limit || 20,
        theme,
      });
      return NextResponse.json({ count: results.length, screenshots: results });
    }

    case 'contrast': {
      const { sessionId, targetAxis, categories, limit } = body;
      if (!sessionId || !validateSessionId(sessionId)) {
        return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
      }
      const session = getSession(sessionId);
      if (!session?.tasteMap) {
        return NextResponse.json({ error: 'No taste map available' }, { status: 400 });
      }
      const results = findContrastingScreenshots(session.tasteMap as TasteMap, targetAxis, {
        categories,
        limit: limit || 5,
      });
      return NextResponse.json({ count: results.length, screenshots: results });
    }

    case 'onboarding_grid': {
      const { count } = body;
      const results = getOnboardingGrid(count || 16);
      return NextResponse.json({ count: results.length, screenshots: results });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
