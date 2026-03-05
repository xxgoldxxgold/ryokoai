import { NextRequest, NextResponse } from 'next/server';
import {
  lookupCity,
  startHotelSearch,
  getHotelSearchResults,
  searchHotelsCache,
  buildHotelPhotoUrl,
} from '@/lib/travelpayouts/hotels';
import type { HotelSearchResult, HotelOffer } from '@/types/hotel';

export async function POST(req: NextRequest) {
  try {
    const { destination, check_in, check_out, adults, children = 0, currency = 'usd' } = await req.json();

    if (!destination || !check_in || !check_out || !adults) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Lookup city
    const city = await lookupCity(destination);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Step 2: Try Search API first for OTA-level pricing
    let results: HotelSearchResult[] = [];

    const searchId = await startHotelSearch(city.id, check_in, check_out, adults, children, currency);

    if (searchId) {
      const searchResults = await getHotelSearchResults(searchId);

      if (searchResults.length > 0) {
        results = searchResults.map((hotel) => {
          const offers: HotelOffer[] = (hotel.rooms || []).map((room) => ({
            agency_id: room.agencyId,
            agency_name: room.agencyName,
            price_per_night: Math.round(room.price),
            total_price: Math.round(room.total),
            currency: currency.toUpperCase(),
            room_type: room.type,
            is_cheapest: false,
            affiliate_url: room.bookingURL,
            free_cancellation: room.freeCancellation || false,
          }));

          // Mark cheapest
          if (offers.length > 0) {
            const cheapest = offers.reduce((a, b) =>
              a.total_price < b.total_price ? a : b
            );
            cheapest.is_cheapest = true;
          }

          const prices = offers.map((o) => o.total_price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          return {
            id: hotel.id,
            name: hotel.hotelName,
            stars: hotel.stars,
            address: hotel.address || '',
            location: hotel.location || { lat: 0, lon: 0 },
            guest_score: hotel.rating || 0,
            photo_url: buildHotelPhotoUrl(hotel.id),
            offers,
            savings: {
              amount: maxPrice - minPrice,
              percentage: maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0,
              cheapest_agency: offers.find((o) => o.is_cheapest)?.agency_name || '',
            },
          };
        });
      }
    }

    // Step 3: Fallback to cache API
    if (results.length === 0) {
      const cacheResults = await searchHotelsCache(city.cityName, check_in, check_out, currency);

      results = cacheResults.map((hotel) => ({
        id: hotel.hotelId,
        name: hotel.hotelName,
        stars: hotel.stars,
        address: '',
        location: hotel.location || { lat: 0, lon: 0 },
        guest_score: 0,
        photo_url: buildHotelPhotoUrl(hotel.hotelId),
        offers: [
          {
            agency_id: 'hotellook',
            agency_name: 'Hotellook',
            price_per_night: hotel.priceFrom,
            total_price: hotel.priceFrom,
            currency: currency.toUpperCase(),
            room_type: 'Standard',
            is_cheapest: true,
            affiliate_url: `https://search.hotellook.com/hotels?destination=${encodeURIComponent(city.cityName)}&checkIn=${check_in}&checkOut=${check_out}&adults=${adults}`,
            free_cancellation: false,
          },
        ],
        savings: { amount: 0, percentage: 0, cheapest_agency: 'Hotellook' },
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Hotel search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
