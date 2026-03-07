import { NextRequest, NextResponse } from 'next/server';

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const ACTOR_ID = 'martin.forejt~google-hotels-scraper';

// POST: start a run
export async function POST(req: NextRequest) {
  try {
    const { action, runId, datasetId, hotelName, checkIn, checkOut, adults, currency } = await req.json();

    // Action: check status
    if (action === 'status' && runId) {
      const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`);
      const data = await res.json();
      return NextResponse.json({
        status: data?.data?.status,
        statusMessage: data?.data?.statusMessage,
      });
    }

    // Action: get results
    if (action === 'results' && datasetId) {
      const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=10`);
      const items = await res.json();
      return NextResponse.json({ hotels: items });
    }

    // Default: start run
    if (!hotelName) {
      return NextResponse.json({ error: 'ホテル名を入力してください' }, { status: 400 });
    }

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: hotelName,
          checkInDate: checkIn || '2026-05-10',
          checkOutDate: checkOut || '2026-05-11',
          numberOfAdults: adults || 2,
          numberOfChildren: 0,
          currencyCode: currency || 'JPY',
          numberOfResults: 5,
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
