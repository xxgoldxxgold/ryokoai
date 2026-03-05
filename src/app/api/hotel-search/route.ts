import { NextRequest, NextResponse } from 'next/server';

interface Candidate {
  name: string;
  hotel_key: string;
}

// Japanese location name → English mappings
const LOCATION_MAP: Record<string, string[]> = {
  'ワイキキ': ['waikiki'],
  'ホノルル': ['honolulu'],
  'ハワイ': ['hawaii', 'honolulu', 'waikiki', 'maui', 'kona'],
  '東京': ['tokyo'],
  '京都': ['kyoto'],
  '大阪': ['osaka'],
  '沖縄': ['okinawa'],
  'バリ': ['bali'],
  'プーケット': ['phuket'],
  'バンコク': ['bangkok'],
  'シンガポール': ['singapore'],
  'クアラルンプール': ['kuala lumpur'],
  'ランカウイ': ['langkawi'],
  'パリ': ['paris'],
  'ロンドン': ['london'],
  'ニューヨーク': ['new york'],
  'ソウル': ['seoul'],
  '台北': ['taipei'],
  '香港': ['hong kong'],
  'ドバイ': ['dubai'],
  'マカオ': ['macau', 'macao'],
  '北海道': ['hokkaido', 'sapporo', 'niseko'],
  '福岡': ['fukuoka'],
  '名古屋': ['nagoya'],
  '箱根': ['hakone'],
  '軽井沢': ['karuizawa'],
  'セブ': ['cebu'],
  'マニラ': ['manila'],
  'ジャカルタ': ['jakarta'],
  'ダナン': ['da nang', 'danang'],
  'ホーチミン': ['ho chi minh'],
  'ハノイ': ['hanoi'],
  'マルディブ': ['maldives'],
  'モルディブ': ['maldives'],
  'カンクン': ['cancun'],
  'ラスベガス': ['las vegas'],
  'ロサンゼルス': ['los angeles'],
  'サンフランシスコ': ['san francisco'],
  'マイアミ': ['miami'],
  'シドニー': ['sydney'],
  'メルボルン': ['melbourne'],
};

function slugToName(slug: string): string {
  return slug
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Extract location keywords from query (both Japanese and English) */
function extractLocations(query: string): string[] {
  const locations: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Check Japanese location names
  for (const [jp, enList] of Object.entries(LOCATION_MAP)) {
    if (query.includes(jp)) {
      locations.push(...enList);
    }
  }

  // Check English location names already in query
  for (const enList of Object.values(LOCATION_MAP)) {
    for (const en of enList) {
      if (lowerQuery.includes(en.toLowerCase())) {
        locations.push(en);
      }
    }
  }

  return [...new Set(locations)];
}

/** Deduplicate candidates by hotel_key (d-number) and name */
function dedup(candidates: Candidate[]): Candidate[] {
  const seenKeys = new Set<string>();
  const seenNames = new Set<string>();
  const result: Candidate[] = [];

  for (const c of candidates) {
    const dKey = c.hotel_key.match(/d\d+/)?.[0] || c.hotel_key;
    const normName = c.name.toLowerCase().replace(/\s+/g, ' ').trim();

    if (seenKeys.has(dKey) || seenNames.has(normName)) continue;
    seenKeys.add(dKey);
    seenNames.add(normName);
    result.push(c);
  }

  return result;
}

/** Filter and sort candidates based on location keywords from query */
function filterAndSort(candidates: Candidate[], locations: string[]): { filtered: Candidate[]; autoSelect: boolean } {
  if (locations.length === 0) {
    return { filtered: candidates, autoSelect: candidates.length === 1 };
  }

  // Score each candidate: how many location keywords match
  const scored = candidates.map((c) => {
    const nameLower = c.name.toLowerCase();
    const matchCount = locations.filter((loc) => nameLower.includes(loc.toLowerCase())).length;
    return { candidate: c, matchCount };
  });

  // Separate matching vs non-matching
  const matching = scored.filter((s) => s.matchCount > 0);
  const nonMatching = scored.filter((s) => s.matchCount === 0);

  // If we have location-matching candidates, filter out non-matching ones
  if (matching.length > 0) {
    // Sort by match count descending
    matching.sort((a, b) => b.matchCount - a.matchCount);
    const filtered = matching.map((s) => s.candidate);
    // Auto-select if only 1 location match
    return { filtered, autoSelect: filtered.length === 1 };
  }

  // No location matches at all — return all but don't auto-select
  return { filtered: candidates, autoSelect: false };
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

    const pattern = /Hotel_Review-(g\d+-d\d+)-Reviews-(?:or\d+-)?([A-Za-z0-9_]+)/g;
    const found = new Map<string, string>();
    let match;

    while ((match = pattern.exec(html)) !== null) {
      const key = match[1];
      const nameSlug = match[2];
      if (!found.has(key)) {
        found.set(key, slugToName(nameSlug));
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
      auto_select: true,
    });
  }

  // Extract location keywords from query for filtering
  const locations = extractLocations(query);

  // 2. Try TripAdvisor TypeAhead first
  const taCandidates = await searchViaTripAdvisor(query);
  if (taCandidates.length > 0) {
    const deduped = dedup(taCandidates);
    const { filtered, autoSelect } = filterAndSort(deduped, locations);
    return NextResponse.json({
      hotel_key: filtered[0]?.hotel_key || null,
      hotel_name: filtered[0]?.name || null,
      source: 'tripadvisor',
      candidates: filtered,
      auto_select: autoSelect,
    });
  }

  // 3. Fallback: Brave Search
  const braveCandidates = await searchViaBrave(query);
  if (braveCandidates.length > 0) {
    const deduped = dedup(braveCandidates);
    const { filtered, autoSelect } = filterAndSort(deduped, locations);
    return NextResponse.json({
      hotel_key: filtered[0]?.hotel_key || null,
      hotel_name: filtered[0]?.name || null,
      source: 'brave',
      candidates: filtered,
      auto_select: autoSelect,
    });
  }

  return NextResponse.json({
    hotel_key: null,
    hotel_name: null,
    source: 'no_results',
    candidates: [],
    auto_select: false,
  });
}
