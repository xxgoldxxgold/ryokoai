import { NextRequest, NextResponse } from 'next/server';

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH || 'eEB4LmdvbGQ6ZDg1ZjM5MDQwZDg1OGVkNw==';

const idCache = new Map<string, { id: string; title: string; basePrice: number; locationCode: number; expires: number }>();

interface DfsPrice {
  title: string;
  price: number;
  currency: string;
  url: string | null;
  domain: string | null;
  is_paid?: boolean;
}

const DFS_HEADERS = {
  'Authorization': `Basic ${DATAFORSEO_AUTH}`,
  'Content-Type': 'application/json',
};

// location_code mapping: keyword → DataForSEO location code
const LOCATION_KEYWORDS: { keywords: string[]; code: number }[] = [
  { keywords: ['tokyo', 'osaka', 'kyoto', 'fukuoka', 'sapporo', 'okinawa', 'naha', 'nagoya', 'hakone', 'karuizawa', 'nikko', 'hiroshima', 'kobe', 'yokohama', 'japan', 'namba', 'shinjuku', 'shibuya', 'ginza', 'roppongi', 'asakusa', 'ueno', 'ikebukuro', 'akihabara', 'umeda', 'dotonbori', 'gion', 'arashiyama', 'niseko', 'hokkaido', 'sendai', 'kanazawa', 'takayama', 'miyajima', 'narita', 'haneda', 'kansai'], code: 2392 },
  { keywords: ['bangkok', 'phuket', 'chiang', 'pattaya', 'thailand', 'krabi', 'samui'], code: 2764 },
  { keywords: ['bali', 'jakarta', 'indonesia', 'ubud', 'seminyak', 'kuta', 'lombok'], code: 2360 },
  { keywords: ['singapore'], code: 2702 },
  { keywords: ['seoul', 'busan', 'jeju', 'korea', 'gangnam', 'myeongdong', 'hongdae'], code: 2410 },
  { keywords: ['taipei', 'taiwan', 'kaohsiung', 'taichung'], code: 2158 },
  { keywords: ['hong kong', 'hongkong'], code: 2344 },
  { keywords: ['kuala lumpur', 'langkawi', 'penang', 'malaysia'], code: 2458 },
  { keywords: ['manila', 'cebu', 'boracay', 'philippines', 'palawan'], code: 2608 },
  { keywords: ['hanoi', 'ho chi minh', 'da nang', 'vietnam', 'saigon', 'hoi an', 'nha trang'], code: 2704 },
  { keywords: ['paris', 'nice', 'lyon', 'france', 'marseille'], code: 2250 },
  { keywords: ['london', 'manchester', 'edinburgh', 'uk', 'england', 'britain', 'scotland'], code: 2826 },
  { keywords: ['rome', 'milan', 'venice', 'florence', 'italy', 'naples', 'amalfi'], code: 2380 },
  { keywords: ['barcelona', 'madrid', 'spain', 'seville', 'malaga', 'ibiza'], code: 2724 },
  { keywords: ['berlin', 'munich', 'frankfurt', 'germany', 'hamburg'], code: 2276 },
  { keywords: ['amsterdam', 'netherlands', 'rotterdam'], code: 2528 },
  { keywords: ['dubai', 'abu dhabi', 'uae', 'emirates'], code: 2784 },
  { keywords: ['sydney', 'melbourne', 'australia', 'brisbane', 'gold coast', 'cairns'], code: 2036 },
  { keywords: ['auckland', 'new zealand', 'queenstown', 'wellington'], code: 2554 },
  { keywords: ['cancun', 'mexico', 'playa del carmen', 'tulum'], code: 2484 },
  { keywords: ['maldives', 'male'], code: 2462 },
  { keywords: ['mumbai', 'delhi', 'goa', 'india', 'jaipur', 'bangalore', 'chennai'], code: 2356 },
  { keywords: ['istanbul', 'turkey', 'antalya', 'cappadocia'], code: 2792 },
  { keywords: ['prague', 'czech'], code: 2203 },
  { keywords: ['budapest', 'hungary'], code: 2348 },
  { keywords: ['vienna', 'austria', 'salzburg'], code: 2040 },
  { keywords: ['lisbon', 'porto', 'portugal'], code: 2620 },
  { keywords: ['athens', 'santorini', 'mykonos', 'greece', 'crete'], code: 2300 },
  { keywords: ['cairo', 'egypt', 'luxor', 'hurghada'], code: 2818 },
  { keywords: ['doha', 'qatar'], code: 2634 },
  { keywords: ['macau', 'macao'], code: 2446 },
];

function detectLocationCode(hotelName: string): number[] {
  const lower = hotelName.toLowerCase();
  const codes: number[] = [];
  for (const loc of LOCATION_KEYWORDS) {
    if (loc.keywords.some(k => lower.includes(k))) {
      codes.push(loc.code);
    }
  }
  // Always include US as fallback, but put detected codes first
  if (!codes.includes(2840)) codes.push(2840);
  return codes;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelName = searchParams.get('q') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = searchParams.get('adults') || '2';
  const phase = searchParams.get('phase') || 'all';

  if (!hotelName || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing q, checkin, checkout' }, { status: 400 });
  }

  const cacheKey = hotelName.toLowerCase().trim();
  const cached = idCache.get(cacheKey);
  const hasCached = cached && Date.now() < cached.expires;

  // Phase 1: Find hotel (fast ~3-6s, or instant if cached)
  if (phase === 'search' || (phase === 'all' && !hasCached)) {
    if (hasCached) {
      return NextResponse.json({
        phase: 'search',
        hotel_name: cached.title,
        hotel_id: cached.id,
        base_price: cached.basePrice,
      });
    }

    const locationCodes = detectLocationCode(hotelName);
    let found = false;

    for (const locCode of locationCodes) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch('https://api.dataforseo.com/v3/business_data/google/hotel_searches/live', {
          method: 'POST',
          signal: controller.signal,
          headers: DFS_HEADERS,
          body: JSON.stringify([{
            keyword: hotelName,
            location_code: locCode,
            language_code: 'en',
            check_in: checkin,
            check_out: checkout,
            adults: parseInt(adults),
            currency: 'USD',
          }]),
        });
        clearTimeout(timeout);
        const data = await res.json();
        const items = data.tasks?.[0]?.result?.[0]?.items || [];
        if (items.length === 0 || !items[0].hotel_identifier) continue;

        const first = items[0];
        const title = first.title || hotelName;
        const basePrice = first.prices?.price || 0;
        idCache.set(cacheKey, { id: first.hotel_identifier, title, basePrice, locationCode: locCode, expires: Date.now() + 86400000 });
        found = true;

        if (phase === 'search') {
          return NextResponse.json({
            phase: 'search',
            hotel_name: title,
            hotel_id: first.hotel_identifier,
            base_price: basePrice,
          });
        }
        break; // phase === 'all' falls through to get prices
      } catch { continue; }
    }

    if (!found) {
      return NextResponse.json({ phase: 'search', error: 'Hotel not found' });
    }
  }

  // Phase 2: Get OTA prices
  const entry = idCache.get(cacheKey);
  const hotelId = searchParams.get('id') || entry?.id;
  if (!hotelId) {
    return NextResponse.json({ phase: 'prices', error: 'No hotel identifier', prices: [] });
  }

  try {
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 15000);
    const infoRes = await fetch('https://api.dataforseo.com/v3/business_data/google/hotel_info/live/advanced', {
      method: 'POST',
      signal: controller2.signal,
      headers: DFS_HEADERS,
      body: JSON.stringify([{
        hotel_identifier: hotelId,
        check_in: checkin,
        check_out: checkout,
        adults: parseInt(adults),
        currency: 'USD',
        language_code: 'en',
        location_code: entry?.locationCode || 2840,
      }]),
    });
    clearTimeout(timeout2);
    const infoData = await infoRes.json();
    const result = infoData.tasks?.[0]?.result?.[0];

    if (!result) {
      return NextResponse.json({ phase: 'prices', error: 'No hotel data', prices: [] });
    }

    const rawItems: DfsPrice[] = result.prices?.items || [];
    const hotelTitle = result.title || entry?.title || hotelName;

    const prices = rawItems
      .filter(p => p.price > 0 && p.domain && p.domain !== 'google.com')
      .map(p => ({
        source: p.title || p.domain || 'Unknown',
        price: p.price,
        currency: p.currency || 'USD',
        link: p.url || null,
        domain: p.domain || null,
      }));

    const seen = new Set<string>();
    const deduped = prices.filter(p => {
      const key = (p.domain || p.source).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => a.price - b.price);

    return NextResponse.json({
      phase: 'prices',
      hotel_name: hotelTitle,
      prices: deduped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ phase: 'prices', error: message, prices: [] }, { status: 200 });
  }
}
