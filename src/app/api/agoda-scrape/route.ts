import { NextRequest, NextResponse } from 'next/server';

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const ACTOR_ID = 'knagymate~fast-agoda-scraper';
const IPROYAL_USER = process.env.IPROYAL_USERNAME || '';
const IPROYAL_PASS = process.env.IPROYAL_PASSWORD || '';

export async function POST(req: NextRequest) {
  try {
    const { action, runId, datasetId, search, checkIn, checkOut } = await req.json();

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
      const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=1`);
      const items = await res.json();
      const hotel = Array.isArray(items) ? items[0] || null : null;
      return NextResponse.json({ hotel, debug_keys: hotel ? Object.keys(hotel) : [] });
    }

    // Default: start run
    if (!search) {
      return NextResponse.json({ error: 'ホテル名を入力してください' }, { status: 400 });
    }

    const proxyUrl = `http://${IPROYAL_USER}:${IPROYAL_PASS}_country-id@geo.iproyal.com:12321`;

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}&maxItems=10`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: search,
          checkInDate: checkIn || '2026-05-10',
          checkOutDate: checkOut || '2026-05-11',
          maxItems: 10,
          maxTotalChargeUsd: 0.05,
          proxyConfiguration: {
            useApifyProxy: false,
            proxyUrls: [proxyUrl],
          },
          blockImages: true,
          blockAds: true,
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
