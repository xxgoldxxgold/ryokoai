import { NextRequest, NextResponse } from 'next/server';

interface TripAdvisorResult {
  name: string;
  document_id: string;
  url: string;
  coords: string;
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

  // 3. Text search: use TripAdvisor TypeAhead API
  try {
    const taUrl = `https://www.tripadvisor.com/TypeAheadJson?action=API&types=hotel&query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(taUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        hotel_key: null,
        hotel_name: null,
        source: 'search_failed',
        candidates: [],
      });
    }

    const data = await res.json();
    const results: TripAdvisorResult[] = data.results || [];

    if (results.length === 0) {
      return NextResponse.json({
        hotel_key: null,
        hotel_name: null,
        source: 'no_results',
        candidates: [],
      });
    }

    // Extract hotel_key from the first result's URL
    const first = results[0];
    const urlKeyMatch = first.url.match(/Hotel_Review-(g\d+-d\d+)/);
    const hotelKey = urlKeyMatch ? urlKeyMatch[1] : null;

    // Build candidate list
    const candidates = results.slice(0, 5).map((r) => {
      const m = r.url.match(/Hotel_Review-(g\d+-d\d+)/);
      return {
        name: r.name,
        hotel_key: m ? m[1] : null,
      };
    }).filter((c) => c.hotel_key);

    return NextResponse.json({
      hotel_key: hotelKey,
      hotel_name: first.name,
      source: 'tripadvisor_typeahead',
      candidates,
    });
  } catch {
    return NextResponse.json({
      hotel_key: null,
      hotel_name: null,
      source: 'search_error',
      candidates: [],
    });
  }
}
