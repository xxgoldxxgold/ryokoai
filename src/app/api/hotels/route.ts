import { NextRequest, NextResponse } from 'next/server';
import { buildHotelSearchUrl } from '@/lib/travelpayouts/hotels';

export async function POST(req: NextRequest) {
  try {
    const { destination, check_in, check_out, adults = 1, estimated_prices } = await req.json();

    if (!destination || !check_in || !check_out) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const marker = process.env.TRAVELPAYOUTS_MARKER || '';
    const links = buildHotelSearchUrl(destination, check_in, check_out, adults, marker);

    return NextResponse.json({
      destination,
      check_in,
      check_out,
      adults,
      booking_links: links,
      estimated_prices: estimated_prices || null,
      message: `${destination}のホテルを以下のサイトで比較できます。`,
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
