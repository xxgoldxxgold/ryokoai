import { NextRequest, NextResponse } from 'next/server';

const VPS_URL = 'https://denwa2.com/proxy-scrape/scrape-agoda';
const API_KEY = 'ryokoai_scraper_2026';

export async function POST(req: NextRequest) {
  try {
    const { hotelName, checkIn, checkOut, country } = await req.json();

    if (!hotelName) {
      return NextResponse.json({ error: 'ホテル名を入力してください' }, { status: 400 });
    }

    const res = await fetch(VPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        hotelName,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        country: country || 'id',
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
