import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  hotel_key: string | null;
  hotel_name: string | null;
  source: string;
  candidates: { name: string; hotel_key: string }[];
}

function extractKeyFromUrl(url: string): string | null {
  const m = url.match(/Hotel_Review-(g\d+-d\d+)/);
  return m ? m[1] : null;
}

function isJapanese(text: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

async function searchTripAdvisor(query: string, domain: string): Promise<SearchResult> {
  const url = `https://www.tripadvisor.${domain}/TypeAheadJson?action=API&types=hotel&query=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { hotel_key: null, hotel_name: null, source: 'search_failed', candidates: [] };
    }

    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) {
      return { hotel_key: null, hotel_name: null, source: 'no_results', candidates: [] };
    }

    const candidates = results.slice(0, 5)
      .map((r: { name: string; url: string }) => ({
        name: r.name,
        hotel_key: extractKeyFromUrl(r.url),
      }))
      .filter((c: { hotel_key: string | null }) => c.hotel_key);

    const first = candidates[0];
    return {
      hotel_key: first?.hotel_key || null,
      hotel_name: first?.name || null,
      source: `tripadvisor_${domain}`,
      candidates,
    };
  } catch {
    clearTimeout(timeout);
    return { hotel_key: null, hotel_name: null, source: 'search_error', candidates: [] };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  if (!query.trim()) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  // 1. Direct hotel_key format: g60982-d87993
  const keyMatch = query.match(/(g\d+-d\d+)/);
  if (keyMatch) {
    return NextResponse.json({
      hotel_key: keyMatch[1],
      hotel_name: null,
      source: 'direct_key',
      candidates: [],
    });
  }

  // 2. TripAdvisor URL: Hotel_Review-g60982-d87993-Reviews-...
  const taMatch = query.match(/Hotel_Review-(g\d+-d\d+)/);
  if (taMatch) {
    return NextResponse.json({
      hotel_key: taMatch[1],
      hotel_name: null,
      source: 'tripadvisor_url',
      candidates: [],
    });
  }

  // 3. Text search via TripAdvisor TypeAhead
  const ja = isJapanese(query);

  if (ja) {
    // Try Japanese TripAdvisor first, then English
    const jaResult = await searchTripAdvisor(query, 'jp');
    if (jaResult.hotel_key) {
      return NextResponse.json(jaResult);
    }
    // Fallback to .com
    const enResult = await searchTripAdvisor(query, 'com');
    return NextResponse.json(enResult);
  } else {
    // English: try .com first, then .jp
    const enResult = await searchTripAdvisor(query, 'com');
    if (enResult.hotel_key) {
      return NextResponse.json(enResult);
    }
    const jaResult = await searchTripAdvisor(query, 'jp');
    return NextResponse.json(jaResult);
  }
}
