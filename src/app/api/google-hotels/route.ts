import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { validateDates, validateAdults } from '@/lib/validate';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

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
  const currency = searchParams.get('currency') || 'JPY';

  if (!query || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing q, checkin, checkout' }, { status: 400 });
  }

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const dateErr = validateDates(checkin, checkout);
  if (dateErr) return dateErr;

  const adultsNum = validateAdults(adults);

  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine', 'google_hotels');
    url.searchParams.set('q', query);
    url.searchParams.set('check_in_date', checkin);
    url.searchParams.set('check_out_date', checkout);
    url.searchParams.set('adults', String(adultsNum));
    url.searchParams.set('currency', currency);
    url.searchParams.set('gl', 'jp');
    url.searchParams.set('hl', 'ja');
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
    // 1. "properties" mode: multiple hotels — need property_token to get detailed prices
    // 2. "property details" mode: single hotel, prices/featured_prices at top level
    let featuredPrices: SerpPrice[] = [];
    let regularPrices: SerpPrice[] = [];
    let hotelName: string | null = null;

    const properties = data.properties || [];
    if (properties.length > 0 && !data.name) {
      // Mode 1: properties array — get property_token and fetch detail
      const top = properties[0];
      hotelName = top.name || null;
      const propertyToken = top.property_token;

      if (propertyToken) {
        try {
          const detailUrl = new URL('https://serpapi.com/search');
          detailUrl.searchParams.set('engine', 'google_hotels');
          detailUrl.searchParams.set('q', query);
          detailUrl.searchParams.set('check_in_date', checkin);
          detailUrl.searchParams.set('check_out_date', checkout);
          detailUrl.searchParams.set('adults', String(adultsNum));
          detailUrl.searchParams.set('currency', currency);
          detailUrl.searchParams.set('gl', 'us');
          detailUrl.searchParams.set('hl', 'en');
          detailUrl.searchParams.set('property_token', propertyToken);
          detailUrl.searchParams.set('api_key', SERPAPI_KEY);

          const detailController = new AbortController();
          const detailTimeout = setTimeout(() => detailController.abort(), 15000);
          const detailRes = await fetch(detailUrl.toString(), { signal: detailController.signal });
          clearTimeout(detailTimeout);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detailData = await detailRes.json() as any;
          if (detailData.name) {
            hotelName = detailData.name;
            featuredPrices = detailData.featured_prices || [];
            regularPrices = detailData.prices || [];
          }
        } catch {
          // Detail fetch failed — fall through with empty prices
        }
      }
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
  } catch {
    return NextResponse.json({ error: 'Failed to fetch prices', prices: [] }, { status: 200 });
  }
}
