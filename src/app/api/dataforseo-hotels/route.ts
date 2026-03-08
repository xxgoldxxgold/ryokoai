import { NextRequest, NextResponse } from 'next/server';

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH || 'eEB4LmdvbGQ6ZDg1ZjM5MDQwZDg1OGVkNw==';

const idCache = new Map<string, { id: string; title: string; basePrice: number; expires: number }>();

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

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('https://api.dataforseo.com/v3/business_data/google/hotel_searches/live', {
        method: 'POST',
        signal: controller.signal,
        headers: DFS_HEADERS,
        body: JSON.stringify([{
          keyword: hotelName,
          location_code: 2840,
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
      if (items.length === 0) {
        return NextResponse.json({ phase: 'search', error: 'Hotel not found' });
      }
      const first = items[0];
      if (!first.hotel_identifier) {
        return NextResponse.json({ phase: 'search', error: 'Hotel not found' });
      }
      const title = first.title || hotelName;
      const basePrice = first.prices?.price || 0;
      idCache.set(cacheKey, { id: first.hotel_identifier, title, basePrice, expires: Date.now() + 86400000 });

      if (phase === 'search') {
        return NextResponse.json({
          phase: 'search',
          hotel_name: title,
          hotel_id: first.hotel_identifier,
          base_price: basePrice,
        });
      }
      // phase === 'all' falls through to get prices too
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ phase: 'search', error: message });
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
        location_code: 2840,
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
