import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query, countryCode, lang, proxyHost, proxyPort, proxyUser, proxyPass } = await req.json();

    if (!query || !proxyHost || !proxyPort || !proxyUser || !proxyPass) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const proxyServer = `http://${proxyHost}:${proxyPort}`;

    const browser = await puppeteer.launch({
      args: [...chromium.args, `--proxy-server=${proxyServer}`],
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.authenticate({ username: proxyUser, password: proxyPass });

    const gl = countryCode || 'tr';
    const hl = lang || gl;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=${gl}&hl=${hl}`;

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
