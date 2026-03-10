import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { validateDates } from '@/lib/validate';

const GEO_API_URL = process.env.GEO_PRICE_API_URL || 'https://denwa2.com/geo-prices';
const GEO_API_KEY = process.env.GEO_PRICE_API_KEY || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'status';
  const hotel = searchParams.get('hotel');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const adults = searchParams.get('adults') || '2';

  if (!hotel || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const dateErr = validateDates(checkin, checkout);
  if (dateErr) return dateErr;

  const params = new URLSearchParams({ hotel, checkin, checkout, adults, key: GEO_API_KEY });
  const endpoint = action === 'start' ? 'start' : 'status';

  try {
    const res = await fetch(`${GEO_API_URL}/api/geo-prices/${endpoint}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to reach scraper' }, { status: 502 });
  }
}
