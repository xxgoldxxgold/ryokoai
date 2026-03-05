import { NextRequest, NextResponse } from 'next/server';

const GEO_API_URL = process.env.GEO_PRICE_API_URL || 'https://denwa2.com/geo-prices';
const GEO_API_KEY = process.env.GEO_PRICE_API_KEY || 'ryokoai_geo_2026';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotel = searchParams.get('hotel');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const adults = searchParams.get('adults') || '2';

  if (!hotel || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      hotel,
      checkin,
      checkout,
      adults,
      key: GEO_API_KEY,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5 min timeout

    const res = await fetch(`${GEO_API_URL}/api/geo-prices?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to fetch geo prices' }, { status: 500 });
  }
}
