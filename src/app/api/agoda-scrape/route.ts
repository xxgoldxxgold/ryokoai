import { NextRequest, NextResponse } from 'next/server';

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const ACTOR_ID = 'apify~ai-web-agent';
const IPROYAL_USER = process.env.IPROYAL_USERNAME || '';
const IPROYAL_PASS = process.env.IPROYAL_PASSWORD || '';

export async function POST(req: NextRequest) {
  try {
    const { action, runId, datasetId, hotelName, checkIn, checkOut } = await req.json();

    if (action === 'status' && runId) {
      const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`);
      const data = await res.json();
      return NextResponse.json({
        status: data?.data?.status,
        statusMessage: data?.data?.statusMessage,
      });
    }

    if (action === 'results' && datasetId) {
      const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=5`);
      const items = await res.json();
      return NextResponse.json({ results: Array.isArray(items) ? items : [] });
    }

    if (!hotelName) {
      return NextResponse.json({ error: 'ホテル名を入力してください' }, { status: 400 });
    }

    const ciDate = checkIn || '2026-05-10';
    const coDate = checkOut || '2026-05-11';
    const agodaUrl = `https://www.agoda.com/search?city=0&checkIn=${ciDate}&checkOut=${coDate}&rooms=1&adults=2&children=0&searchText=${encodeURIComponent(hotelName)}`;
    const proxyUrl = `http://${IPROYAL_USER}:${IPROYAL_PASS}_country-id@geo.iproyal.com:12321`;

    const instructions = `You are on Agoda hotel search results page. Find the hotel "${hotelName}" in the search results. Extract the following information as JSON and save it to the dataset:
- hotelName: the exact hotel name shown
- price: the price per night (number only, no currency symbol)
- currency: the currency code (e.g. USD, IDR)
- rating: the review score
- reviewCount: number of reviews
- address: the hotel address or location
- imageUrl: the hotel thumbnail image URL
- agodaUrl: the URL to the hotel's page on Agoda

If you see multiple hotels, extract the one that best matches "${hotelName}". If the exact hotel is not found, extract the closest match. Click on the hotel to get more details if needed.`;

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrl: agodaUrl,
          instructions: instructions,
          maxTotalChargeUsd: 0.1,
          proxyConfiguration: {
            useApifyProxy: false,
            proxyUrls: [proxyUrl],
          },
        }),
      }
    );
    const runData = await runRes.json();

    if (!runData?.data?.id) {
      return NextResponse.json({ error: runData?.error?.message || 'Apify実行の開始に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      runId: runData.data.id,
      datasetId: runData.data.defaultDatasetId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
