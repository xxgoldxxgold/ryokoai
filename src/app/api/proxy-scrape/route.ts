import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const maxDuration = 60;

const IPROYAL_HOST = 'geo.iproyal.com';
const IPROYAL_PORT = '12321';
const CHROMIUM_URL = 'https://github.com/nichochar/chromium-build-standalone/releases/download/v133.0.0/chromium-v133.0.0-pack.tar';

export async function POST(req: NextRequest) {
  try {
    const ipRoyalUser = process.env.IPROYAL_USERNAME;
    const ipRoyalPass = process.env.IPROYAL_PASSWORD;

    if (!ipRoyalUser || !ipRoyalPass) {
      return NextResponse.json({ error: 'プロキシの設定がされていません' }, { status: 500 });
    }

    const { query, countryCode, lang } = await req.json();

    if (!query) {
      return NextResponse.json({ error: '検索キーワードを入力してください' }, { status: 400 });
    }

    const cc = countryCode || 'tr';
    const proxyUser = `${ipRoyalUser}_country-${cc}`;
    const proxyServer = `http://${IPROYAL_HOST}:${IPROYAL_PORT}`;

    const executablePath = await chromium.executablePath(CHROMIUM_URL);

    const browser = await puppeteer.launch({
      args: chromium.args.concat([`--proxy-server=${proxyServer}`]),
      defaultViewport: { width: 1280, height: 800 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.authenticate({ username: proxyUser, password: ipRoyalPass });

    const hl = lang || cc;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=${cc}&hl=${hl}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const screenshot = await page.screenshot({ fullPage: true, encoding: 'base64' });
    const title = await page.title();

    await browser.close();

    return NextResponse.json({
      success: true,
      title,
      screenshot: `data:image/png;base64,${screenshot}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
