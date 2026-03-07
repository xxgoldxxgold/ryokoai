import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

const VPS_SCRAPE_URL = 'https://denwa2.com/proxy-scrape/scrape';
const API_KEY = 'ryokoai_scraper_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(VPS_SCRAPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(110000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
