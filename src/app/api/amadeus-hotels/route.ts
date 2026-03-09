import { NextRequest, NextResponse } from 'next/server';

const AMADEUS_KEY = process.env.AMADEUS_KEY || '';
const AMADEUS_SECRET = process.env.AMADEUS_SECRET || '';
const AMADEUS_BASE = 'https://test.api.amadeus.com';

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${AMADEUS_KEY}&client_secret=${AMADEUS_SECRET}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Amadeus auth failed');
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

interface AmadeusHotel {
  hotelId: string;
  name: string;
}

async function searchHotelsByCity(cityCode: string, token: string): Promise<AmadeusHotel[]> {
  const url = new URL(`${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-city`);
  url.searchParams.set('cityCode', cityCode);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return (data.data || []).map((h: { hotelId: string; name: string }) => ({
    hotelId: h.hotelId,
    name: h.name,
  }));
}

async function searchHotelsByGeo(lat: number, lng: number, token: string): Promise<AmadeusHotel[]> {
  const url = new URL(`${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-geocode`);
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lng.toString());
  url.searchParams.set('radius', '5');
  url.searchParams.set('radiusUnit', 'KM');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return (data.data || []).map((h: { hotelId: string; name: string }) => ({
    hotelId: h.hotelId,
    name: h.name,
  }));
}

function fuzzyMatch(hotelName: string, amadeusName: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const a = normalize(hotelName);
  const b = normalize(amadeusName);
  if (a.includes(b) || b.includes(a)) return true;
  const aWords = hotelName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const bWords = amadeusName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const matched = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
  return matched.length >= 2;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelName = searchParams.get('hotelName') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = searchParams.get('adults') || '2';
  const cityCode = searchParams.get('cityCode') || '';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!hotelName || !checkin || !checkout) {
    return NextResponse.json({ error: 'Missing hotelName, checkin, checkout' }, { status: 400 });
  }

  try {
    const token = await getToken();

    // Step 1: Find hotel IDs
    let hotels: AmadeusHotel[] = [];
    if (lat && lng) {
      hotels = await searchHotelsByGeo(parseFloat(lat), parseFloat(lng), token);
    } else if (cityCode) {
      hotels = await searchHotelsByCity(cityCode, token);
    } else {
      return NextResponse.json({ error: 'Need cityCode or lat/lng', hotels_searched: 0, offers: [] });
    }

    // Step 2: Fuzzy match hotel name
    const matched = hotels.filter(h => fuzzyMatch(hotelName, h.name));
    if (matched.length === 0) {
      return NextResponse.json({
        error: 'Hotel not found in Amadeus',
        hotels_searched: hotels.length,
        offers: [],
      });
    }

    // Step 3: Get offers (try up to 3 matched hotels)
    const hotelIds = matched.slice(0, 3).map(h => h.hotelId).join(',');
    const offersUrl = new URL(`${AMADEUS_BASE}/v3/shopping/hotel-offers`);
    offersUrl.searchParams.set('hotelIds', hotelIds);
    offersUrl.searchParams.set('adults', adults);
    offersUrl.searchParams.set('checkInDate', checkin);
    offersUrl.searchParams.set('checkOutDate', checkout);
    offersUrl.searchParams.set('currencyCode', 'JPY');

    const offersRes = await fetch(offersUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const offersData = await offersRes.json();

    if (offersData.errors) {
      return NextResponse.json({
        error: offersData.errors[0]?.detail || 'Amadeus error',
        matched_hotels: matched.map(h => h.name),
        offers: [],
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offers = (offersData.data || []).map((hotel: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roomOffers = (hotel.offers || []).map((offer: any) => ({
        id: offer.id,
        roomType: offer.room?.typeEstimated?.category || 'Standard',
        bedType: offer.room?.typeEstimated?.bedType || '',
        description: offer.room?.description?.text || '',
        price: parseFloat(offer.price?.total || '0'),
        currency: offer.price?.currency || 'USD',
        boardType: offer.boardType || '',
      }));
      return {
        hotelName: hotel.hotel?.name || '',
        hotelId: hotel.hotel?.hotelId || '',
        offers: roomOffers,
      };
    });

    return NextResponse.json({ offers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, offers: [] }, { status: 200 });
  }
}
