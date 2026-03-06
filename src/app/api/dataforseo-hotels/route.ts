import { NextRequest, NextResponse } from 'next/server';

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH || 'eEB4LmdvbGQ6ZDg1ZjM5MDQwZDg1OGVkNw==';

// In-memory cache for hotel identifiers (survives across requests in same serverless instance)
const idCache = new Map<string, { id: string; expires: number }>();

interface DfsPrice {
  title: string;
  price: number;
  currency: string;
  url: string | null;
  domain: string | null;
  is_paid?: boolean;
}

async function findHotelIdentifier(hotelName: string): Promise<string | null> {
  const cacheKey = hotelName.toLowerCase().trim();
  const cached = idCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.id;

  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${DATAFORSEO_AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      keyword: `${hotelName} hotel`,
      location_code: 2840,
      language_code: 'en',
    }]),
  });
  const data = await res.json();
  const items = data.tasks?.[0]?.result?.[0]?.items || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotelItem = items.find((i: any) => i.type === 'google_hotels');
  if (!hotelItem?.hotel_identifier) return null;

  // Cache for 24 hours
  idCache.set(cacheKey, { id: hotelItem.hotel_identifier, expires: Date.now() + 86400000 });
  return hotelItem.hotel_identifier;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelName = searchParams.get('q') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = searchParams.get('adults') || '2';

  if (!hotelName || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing q, checkin, checkout' }, { status: 400 });
  }

  try {
    const hotelId = await findHotelIdentifier(hotelName);
    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel not found', prices: [] });
    }

    const infoRes = await fetch('https://api.dataforseo.com/v3/business_data/google/hotel_info/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DATAFORSEO_AUTH}`,
        'Content-Type': 'application/json',
      },
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
    const infoData = await infoRes.json();
    const result = infoData.tasks?.[0]?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: 'No hotel data', prices: [] });
    }

    const rawItems: DfsPrice[] = result.prices?.items || [];
    const hotelTitle = result.title || hotelName;

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
      hotel_name: hotelTitle,
      prices: deduped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, prices: [] }, { status: 200 });
  }
}
