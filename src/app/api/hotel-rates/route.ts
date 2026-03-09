import { NextRequest, NextResponse } from 'next/server';

const XOTELO_BASE = process.env.XOTELO_API_BASE_URL || 'https://data.xotelo.com/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelKey = searchParams.get('hotel_key');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const currency = searchParams.get('currency') || 'JPY';
  const adults = searchParams.get('adults') || '2';

  if (!hotelKey || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing required params: hotel_key, checkin, checkout' }, { status: 400 });
  }

  try {
    const url = `${XOTELO_BASE}/rates?hotel_key=${encodeURIComponent(hotelKey)}&chk_in=${checkin}&chk_out=${checkout}&currency=${currency}&adults=${adults}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'Xotelo API error', rates: [] }, { status: 502 });
    }

    return NextResponse.json({
      rates: data.result?.rates || [],
      checkin: data.result?.chk_in,
      checkout: data.result?.chk_out,
      currency: data.result?.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, rates: [] }, { status: 500 });
  }
}
