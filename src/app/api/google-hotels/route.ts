import { NextRequest, NextResponse } from 'next/server';

const SERPAPI_KEY = process.env.SERPAPI_KEY || 'cb66256e697b8d0950261d58b89144171bc38edc6e058bfae78fbf4b1404e126';

interface SerpPrice {
  source: string;
  logo?: string;
  link?: string;
  official?: boolean;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as any;

    if (data.error) {
      return NextResponse.json({ error: data.error, prices: [] }, { status: 200 });
    }

    // SerpAPI has two response modes:
    // 1. "properties" mode: multiple hotels, prices inside properties[0]
    // 2. "property details" mode: single hotel, prices/featured_prices at top level
    let featuredPrices: SerpPrice[] = [];
    let regularPrices: SerpPrice[] = [];
    let hotelName: string | null = null;

    const properties = data.properties || [];
    if (properties.length > 0) {
      // Mode 1: properties array
      const top = properties[0];
      hotelName = top.name || null;
      featuredPrices = top.featured_prices || [];
      regularPrices = top.prices || [];
    } else if (data.name) {
      // Mode 2: property details at top level
      hotelName = data.name || null;
      featuredPrices = data.featured_prices || [];
      regularPrices = data.prices || [];
    }

    // Merge featured + regular, dedup by source name
    const allPrices: SerpPrice[] = [];
    const seenSources = new Set<string>();

    for (const p of featuredPrices) {
      const src = (p.source || '').toLowerCase();
      if (!seenSources.has(src)) {
        seenSources.add(src);
        allPrices.push(p);
      }
    }
    for (const p of regularPrices) {
      const src = (p.source || '').toLowerCase();
      if (!seenSources.has(src)) {
        seenSources.add(src);
        allPrices.push(p);
      }
    }

    const prices = allPrices.map((p) => ({
      source: p.source || 'Unknown',
      logo: p.logo || null,
      link: p.link || null,
      official: p.official || false,
      rate: p.rate_per_night?.extracted_before_taxes_fees || p.rate_per_night?.extracted_lowest || 0,
      rateWithTax: p.rate_per_night?.extracted_lowest || 0,
    })).filter((p) => p.rate > 0);

    return NextResponse.json({
      hotel_name: hotelName,
      prices,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, prices: [] }, { status: 200 });
  }
}
