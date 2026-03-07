import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const proxyChain = require('proxy-chain');

export const maxDuration = 60;

const IPROYAL_HOST = 'geo.iproyal.com';
const IPROYAL_PORT = '12321';
const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar';

export async function POST(req: NextRequest) {
  let browser = null;
  let proxyUrl = '';

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

    const originalProxy = `http://${proxyUser}:${ipRoyalPass}@${IPROYAL_HOST}:${IPROYAL_PORT}`;
    proxyUrl = await proxyChain.anonymizeProxy(originalProxy);

    const executablePath = await chromium.executablePath(CHROMIUM_URL);

    browser = await puppeteer.launch({
      args: chromium.args.concat([`--proxy-server=${proxyUrl}`]),
      defaultViewport: { width: 1280, height: 800 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    const hl = lang || cc;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=${cc}&hl=${hl}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const screenshot = await page.screenshot({ fullPage: true, encoding: 'base64' });
    const title = await page.title();

    return NextResponse.json({
      success: true,
      title,
      screenshot: `data:image/png;base64,${screenshot}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
    if (proxyUrl) await proxyChain.closeAnonymizedProxy(proxyUrl, true);
  }
}
