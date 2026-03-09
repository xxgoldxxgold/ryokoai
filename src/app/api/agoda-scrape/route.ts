import { NextRequest, NextResponse } from 'next/server';

const VPS_URL = process.env.AGODA_SCRAPE_URL || '';
const API_KEY = process.env.AGODA_SCRAPE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { hotelName, checkIn, checkOut, country } = await req.json();

    if (!hotelName) {
      return NextResponse.json({ error: 'ホテル名を入力してください' }, { status: 400 });
    }

    const payload = JSON.stringify({
      hotelName,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      country: country || 'id',
    });

    // Retry up to 2 times on failure
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(VPS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: payload,
      });

      const data = await res.json();

      // If success with hotels, or non-retryable error, return immediately
      if (data.success && data.data?.hotels?.length > 0) {
        return NextResponse.json(data);
      }

      // On last attempt, return whatever we got
      if (attempt === 1) {
        return NextResponse.json(data);
      }

      // Wait before retry
      await new Promise(r => setTimeout(r, 3000));
    }

    return NextResponse.json({ error: 'リトライ失敗' }, { status: 500 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
