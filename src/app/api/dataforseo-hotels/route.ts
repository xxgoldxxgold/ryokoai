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

async function findHotelIdentifier(hotelName: string, checkin?: string, checkout?: string, adults?: number): Promise<string | null> {
  const cacheKey = hotelName.toLowerCase().trim();
  const cached = idCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.id;

  // Try Google Hotels SERP first (more reliable for finding hotel_identifier)
  try {
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 15000);
    const hotelSearchBody: Record<string, unknown> = {
      keyword: hotelName,
      location_code: 2840,
      language_code: 'en',
      currency: 'USD',
    };
    if (checkin) hotelSearchBody.check_in = checkin;
    if (checkout) hotelSearchBody.check_out = checkout;
    if (adults) hotelSearchBody.adults = adults;

    const res = await fetch('https://api.dataforseo.com/v3/serp/google/hotels/live/advanced', {
      method: 'POST',
      signal: controller1.signal,
      headers: {
        'Authorization': `Basic ${DATAFORSEO_AUTH}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([hotelSearchBody]),
    });
    clearTimeout(timeout1);
    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotelPack = items.find((i: any) => i.type === 'hotel_pack');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstHotel = hotelPack?.items?.[0] || items.find((i: any) => i.hotel_identifier);
    if (firstHotel?.hotel_identifier) {
      idCache.set(cacheKey, { id: firstHotel.hotel_identifier, expires: Date.now() + 86400000 });
      return firstHotel.hotel_identifier;
    }
  } catch { /* fall through to organic SERP */ }

  // Fallback: organic SERP search
  try {
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 15000);
    const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      signal: controller2.signal,
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
    clearTimeout(timeout2);
    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotelItem = items.find((i: any) => i.type === 'google_hotels');
    if (hotelItem?.hotel_identifier) {
      idCache.set(cacheKey, { id: hotelItem.hotel_identifier, expires: Date.now() + 86400000 });
      return hotelItem.hotel_identifier;
    }
  } catch { /* return null */ }

  return null;
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
    const hotelId = await findHotelIdentifier(hotelName, checkin, checkout, parseInt(adults));
    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel not found', prices: [] });
    }

    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 15000);
    const infoRes = await fetch('https://api.dataforseo.com/v3/business_data/google/hotel_info/live/advanced', {
      method: 'POST',
      signal: controller2.signal,
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
    clearTimeout(timeout2);
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
