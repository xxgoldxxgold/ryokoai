import { NextRequest, NextResponse } from 'next/server';

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const ACTOR_ID = 'apify~ai-web-agent';
const IPROYAL_USER = process.env.IPROYAL_USERNAME || '';
const IPROYAL_PASS = process.env.IPROYAL_PASSWORD || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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
    const proxyUrl = `http://${IPROYAL_USER}:${IPROYAL_PASS}_country-id@geo.iproyal.com:12321`;

    const instructions = `Follow these steps carefully like a real human user:

1. You are on Agoda's top page. Find the search box and type "${hotelName}" into it.
2. Wait for autocomplete suggestions to appear. Click the suggestion that best matches "${hotelName}".
3. Set check-in date to ${ciDate} and check-out date to ${coDate}. Then click the search button.
4. On the search results page, find the hotel that matches "${hotelName}".
5. Extract the following information and save it to the dataset as JSON:
   - hotelName: the exact hotel name displayed
   - price: the price per night (number only, no currency symbol)
   - currency: the currency code shown (e.g. USD, IDR)
   - rating: the review score
   - reviewCount: number of reviews
   - address: the hotel location
   - imageUrl: the hotel image URL from the page
   - agodaUrl: the current page URL

IMPORTANT: Only extract data that is actually visible on the page. Do NOT make up or guess any values. If you cannot find a value, set it to null.`;

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiApiKey: OPENAI_API_KEY,
          startUrl: 'https://www.agoda.com/',
          instructions: instructions,
          maxTotalChargeUsd: 0.15,
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
