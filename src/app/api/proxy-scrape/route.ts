import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const ACTOR_ID = 'knagymate~fast-agoda-scraper';

export async function POST(req: NextRequest) {
  try {
    const { hotelName, checkIn, checkOut, adults, currency } = await req.json();

    if (!hotelName) {
      return NextResponse.json({ error: 'ホテル名を入力してください' }, { status: 400 });
    }

    const ci = checkIn || '2026-05-10';
    const co = checkOut || '2026-05-11';
    const curr = currency || 'JPY';
    const ad = adults || 2;

    // Build Agoda search URL
    const searchUrl = `https://www.agoda.com/search?q=${encodeURIComponent(hotelName)}&checkIn=${ci}&checkOut=${co}&rooms=1&adults=${ad}&currency=${curr}`;

    // Start Apify actor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}&maxItems=10&maxTotalChargeUsd=1`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: searchUrl }),
      }
    );
    const runData = await runRes.json();
    const runId = runData?.data?.id;
    const datasetId = runData?.data?.defaultDatasetId;

    if (!runId) {
      return NextResponse.json({ error: 'Apify実行の開始に失敗しました' }, { status: 500 });
    }

    // Poll for completion (max ~4 minutes)
    let status = 'RUNNING';
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusData = await statusRes.json();
      status = statusData?.data?.status;
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') break;
    }

    if (status !== 'SUCCEEDED') {
      return NextResponse.json({ error: `スクレイピングが失敗しました (${status})` }, { status: 500 });
    }

    // Get results
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=20`
    );
    const items = await itemsRes.json();

    return NextResponse.json({ success: true, hotels: items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
