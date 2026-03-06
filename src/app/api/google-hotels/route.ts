import { NextRequest, NextResponse } from 'next/server';

const SERPAPI_KEY = process.env.SERPAPI_KEY || 'cb66256e697b8d0950261d58b89144171bc38edc6e058bfae78fbf4b1404e126';

interface SerpPrice {
  source: string;
  logo?: string;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
}

interface SerpProperty {
  name?: string;
  type?: string;
  overall_rating?: number;
  reviews?: number;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
  prices?: SerpPrice[];
  link?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = searchParams.get('adults') || '2';
  const currency = searchParams.get('currency') || 'USD';

  if (!query || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing q, checkin, checkout' }, { status: 400 });
  }

  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine', 'google_hotels');
    url.searchParams.set('q', query);
    url.searchParams.set('check_in_date', checkin);
    url.searchParams.set('check_out_date', checkout);
    url.searchParams.set('adults', adults);
    url.searchParams.set('currency', currency);
    url.searchParams.set('gl', 'us');
    url.searchParams.set('hl', 'en');
    url.searchParams.set('api_key', SERPAPI_KEY);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error, prices: [] }, { status: 200 });
    }

    const properties = (data.properties || []) as SerpProperty[];

    // Find the best matching property (first result is usually the best match)
    const topProperty = properties[0];
    if (!topProperty) {
      return NextResponse.json({ prices: [], hotel_name: null });
    }

    // Extract prices from the top property
    const prices = (topProperty.prices || []).map((p: SerpPrice) => ({
      source: p.source || 'Unknown',
      logo: p.logo || null,
      rate: p.rate_per_night?.extracted_before_taxes_fees || p.rate_per_night?.extracted_lowest || 0,
      rateWithTax: p.rate_per_night?.extracted_lowest || 0,
    })).filter((p: { rate: number }) => p.rate > 0);

    // Also include the top-level rate if available
    const topRate = topProperty.rate_per_night?.extracted_before_taxes_fees
      || topProperty.rate_per_night?.extracted_lowest
      || 0;

    return NextResponse.json({
      hotel_name: topProperty.name || null,
      overall_rating: topProperty.overall_rating || null,
      reviews: topProperty.reviews || null,
      top_rate: topRate,
      prices,
      property_count: properties.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, prices: [] }, { status: 200 });
  }
}
