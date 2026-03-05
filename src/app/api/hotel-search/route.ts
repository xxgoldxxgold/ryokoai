import { NextRequest, NextResponse } from 'next/server';

interface Candidate {
  name: string;
  hotel_key: string;
}

function slugToName(slug: string): string {
  return slug
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

async function searchViaBrave(query: string): Promise<Candidate[]> {
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query + ' site:tripadvisor.com')}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();

    // Extract Hotel_Review-gXXXXX-dXXXXX-Reviews-Hotel_Name patterns
    const pattern = /Hotel_Review-(g\d+-d\d+)-Reviews-(?:or\d+-)?([A-Za-z0-9_]+)/g;
    const found = new Map<string, string>();
    let match;

    while ((match = pattern.exec(html)) !== null) {
      const key = match[1];
      const nameSlug = match[2];
      if (!found.has(key)) {
        // Clean up the name: remove location suffix like "-Honolulu_Oahu_Hawaii"
        const cleanSlug = nameSlug.split(/[-_](?:Honolulu|Oahu|Hawaii|Tokyo|Japan|Waikiki|New_York|Paris|London|Kyoto|Osaka)/i)[0];
        found.set(key, slugToName(cleanSlug));
      }
    }

    return Array.from(found.entries()).map(([key, name]) => ({
      hotel_key: key,
      name,
    }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

async function searchViaTripAdvisor(query: string): Promise<Candidate[]> {
  const domains = ['com', 'jp'];
  for (const domain of domains) {
    const url = `https://www.tripadvisor.${domain}/TypeAheadJson?action=API&types=hotel&query=${encodeURIComponent(query)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const results = data.results || [];
      if (results.length === 0) continue;

      return results.slice(0, 5)
        .map((r: { name: string; url: string }) => {
          const m = r.url.match(/Hotel_Review-(g\d+-d\d+)/);
          return m ? { name: r.name, hotel_key: m[1] } : null;
        })
        .filter(Boolean) as Candidate[];
    } catch {
      continue;
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  if (!query.trim()) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  // 1. Direct hotel_key or TripAdvisor URL
  const keyMatch = query.match(/(g\d+-d\d+)/);
  if (keyMatch) {
    return NextResponse.json({
      hotel_key: keyMatch[1],
      hotel_name: null,
      source: 'direct',
      candidates: [],
    });
  }

  // 2. Try TripAdvisor TypeAhead first (fast, accurate, but may be blocked on servers)
  const taCandidates = await searchViaTripAdvisor(query);
  if (taCandidates.length > 0) {
    return NextResponse.json({
      hotel_key: taCandidates[0].hotel_key,
      hotel_name: taCandidates[0].name,
      source: 'tripadvisor',
      candidates: taCandidates,
    });
  }

  // 3. Fallback: Brave Search (scrape TripAdvisor keys from search results)
  const braveCandidates = await searchViaBrave(query);
  if (braveCandidates.length > 0) {
    return NextResponse.json({
      hotel_key: braveCandidates[0].hotel_key,
      hotel_name: braveCandidates[0].name,
      source: 'brave',
      candidates: braveCandidates,
    });
  }

  return NextResponse.json({
    hotel_key: null,
    hotel_name: null,
    source: 'no_results',
    candidates: [],
  });
}
