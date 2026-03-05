import { NextRequest, NextResponse } from 'next/server';
import {
  searchCheapFlights,
  getAirlineName,
  getAirlineLogoUrl,
  buildFlightAffiliateUrl,
} from '@/lib/travelpayouts/flights';
import type { FlightSearchResult } from '@/types/flight';

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, depart_date, return_date, adults = 1 } = await req.json();

    if (!origin || !destination || !depart_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const marker = process.env.TRAVELPAYOUTS_MARKER || '';
    const flights = await searchCheapFlights(origin, destination, depart_date, return_date);

    if (!flights || flights.length === 0) {
      return NextResponse.json([]);
    }

    const prices = flights.map((f) => f.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const results: FlightSearchResult[] = flights.map((flight, idx) => {
      const airlineName = getAirlineName(flight.airline);
      const affiliateUrl = buildFlightAffiliateUrl(
        origin,
        destination,
        depart_date,
        return_date,
        adults,
        marker
      );

      return {
        id: `${flight.airline}-${flight.flight_number}-${idx}`,
        airline: airlineName,
        airline_logo: getAirlineLogoUrl(flight.airline),
        outbound: {
          departure: flight.departure_at,
          arrival: '',
          duration_minutes: 0,
          stops: idx, // 0 = direct, 1 = 1 stop, etc.
          segments: [
            {
              departure_time: flight.departure_at,
              arrival_time: '',
              duration_minutes: 0,
              airline: airlineName,
              flight_number: `${flight.airline}${flight.flight_number}`,
              origin,
              destination,
            },
          ],
        },
        ...(flight.return_at
          ? {
              inbound: {
                departure: flight.return_at,
                arrival: '',
                duration_minutes: 0,
                stops: 0,
                segments: [
                  {
                    departure_time: flight.return_at,
                    arrival_time: '',
                    duration_minutes: 0,
                    airline: airlineName,
                    flight_number: '',
                    origin: destination,
                    destination: origin,
                  },
                ],
              },
            }
          : {}),
        offers: [
          {
            agency: 'Aviasales',
            price: flight.price,
            currency: 'USD',
            is_cheapest: flight.price === minPrice,
            affiliate_url: affiliateUrl,
          },
        ],
        savings: {
          amount: maxPrice - flight.price,
          percentage:
            maxPrice > 0
              ? Math.round(((maxPrice - flight.price) / maxPrice) * 100)
              : 0,
          cheapest_agency: 'Aviasales',
        },
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
