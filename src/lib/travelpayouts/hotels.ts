const BASE_URL = 'http://engine.hotellook.com/api/v2';

interface LookupResult {
  id: number;
  cityName: string;
  fullName: string;
  countryCode: string;
  location: { lat: number; lon: number };
}

interface CacheHotel {
  hotelId: number;
  hotelName: string;
  stars: number;
  priceFrom: number;
  location: { lat: number; lon: number };
}

export async function lookupCity(query: string, lang = 'en'): Promise<LookupResult | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const url = `${BASE_URL}/lookup.json?query=${encodeURIComponent(query)}&lang=${lang}&lookFor=city&limit=1&token=${token}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = await res.json();
  const locations = data?.results?.locations;
  return locations?.[0] || null;
}

export async function searchHotelsCache(
  location: string,
  checkIn: string,
  checkOut: string,
  currency = 'usd',
  limit = 10
): Promise<CacheHotel[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const url = `${BASE_URL}/cache.json?location=${encodeURIComponent(location)}&checkIn=${checkIn}&checkOut=${checkOut}&currency=${currency}&limit=${limit}&token=${token}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = await res.json();
  return data || [];
}

export async function startHotelSearch(
  cityId: number,
  checkIn: string,
  checkOut: string,
  adults: number,
  children = 0,
  currency = 'usd'
): Promise<string | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const marker = process.env.TRAVELPAYOUTS_MARKER;

  const url = `${BASE_URL}/search/start.json`;
  const params = new URLSearchParams({
    cityId: cityId.toString(),
    checkIn,
    checkOut,
    adultsCount: adults.toString(),
    childrenCount: children.toString(),
    currency,
    token: token!,
    marker: marker!,
  });

  const res = await fetch(`${url}?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  return data?.searchId || null;
}

interface SearchResultHotel {
  id: number;
  hotelName: string;
  stars: number;
  address: string;
  location: { lat: number; lon: number };
  rating: number;
  photoCount: number;
  rooms: {
    agencyId: string;
    agencyName: string;
    bookingURL: string;
    price: number;
    tax: number;
    total: number;
    type: string;
    freeCancellation?: boolean;
  }[];
}

export async function getHotelSearchResults(
  searchId: string,
  limit = 10
): Promise<SearchResultHotel[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;

  // Poll up to 5 times with 3s interval
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const url = `${BASE_URL}/search/getResult.json?searchId=${searchId}&sortBy=price&sortAsc=1&limit=${limit}&token=${token}`;
    const res = await fetch(url);
    if (!res.ok) continue;

    const data = await res.json();
    if (data?.result?.length > 0) {
      return data.result;
    }
  }

  return [];
}

export function buildHotelPhotoUrl(hotelId: number, size = '640x480'): string {
  return `https://photo.hotellook.com/image_v2/crop/h${hotelId}_0/${size}.auto`;
}
