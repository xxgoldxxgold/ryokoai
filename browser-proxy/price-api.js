const express = require('express');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

chromium.use(stealth());

const app = express();
app.use(express.json());
app.use('/debug', express.static(path.join(__dirname, 'debug')));

const IPROYAL = {
  host: 'geo.iproyal.com',
  port: 12321,
  username: 'wUxAArPgvXq2phyo',
  password: 'RQgt7vf07ToEIDHg',
};

const API_KEY = 'ryokoai_geo_2026';
const PORT = 3101;

const DEFAULT_COUNTRIES = ['jp', 'us', 'id', 'in', 'th', 'kr', 'vn', 'ph', 'my', 'sg'];

// Ensure debug dir exists
const debugDir = path.join(__dirname, 'debug');
if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

function getProxyUrl(country) {
  return {
    server: `http://${IPROYAL.host}:${IPROYAL.port}`,
    username: IPROYAL.username,
    password: `${IPROYAL.password}_country-${country}`,
  };
}

async function fetchPrice(hotelUrl, country) {
  let browser;
  try {
    const proxy = getProxyUrl(country);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      proxy: { server: proxy.server },
    });

    const context = await browser.newContext({
      proxy: { server: proxy.server, username: proxy.username, password: proxy.password },
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      timezoneId: 'Asia/Tokyo',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Block only heavy media and trackers to save proxy bandwidth
    await page.route('**/*.{mp4,webm,ogg,avi}', route => route.abort());
    await page.route('**/{doubleclick,googlesyndication,facebook,hotjar}**', route => route.abort());

    await page.goto(hotelUrl, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(8000);

    // Save debug screenshot
    await page.screenshot({ path: path.join(debugDir, `${country}.jpg`), type: 'jpeg', quality: 50 });

    // Extract price from Booking.com
    const priceData = await page.evaluate(() => {
      const selectors = [
        '[data-testid="price-and-discounted-price"]',
        '.prco-valign-middle-helper',
        '.bui-price-display__value',
        '.hp_price_breakdown__total_price',
        '[data-testid="price-for-x-nights"]',
        '.hprt-price-price',
        'td.hprt-table-cell-price',
      ];

      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const text = el.textContent.trim();
          const match = text.match(/[\d,.\s]+/);
          if (match && match[0].trim().length > 0) {
            return { raw: text.replace(/\s+/g, ' '), amount: match[0].replace(/[,\s]/g, '') };
          }
        }
      }

      // Fallback: search page text for currency + number patterns
      if (!document.body) return null;
      const body = document.body.innerText || '';
      const patterns = [
        /(?:¥|JPY)\s?[\d,.]+/,
        /(?:USD|US\$|\$)\s?[\d,.]+/,
        /(?:IDR|Rp)\s?[\d,.]+/,
        /(?:INR|₹)\s?[\d,.]+/,
        /(?:THB|฿)\s?[\d,.]+/,
        /(?:KRW|₩)\s?[\d,.]+/,
        /(?:VND|₫)\s?[\d,.]+/,
        /(?:PHP|₱)\s?[\d,.]+/,
        /(?:MYR|RM)\s?[\d,.]+/,
        /(?:SGD|S\$)\s?[\d,.]+/,
        /(?:EUR|€)\s?[\d,.]+/,
        /(?:GBP|£)\s?[\d,.]+/,
      ];
      for (const pat of patterns) {
        const m = body.match(pat);
        if (m) {
          const num = m[0].match(/[\d,.]+/);
          return { raw: m[0], amount: num ? num[0].replace(/,/g, '') : null };
        }
      }
      return null;
    });

    await browser.close();

    return {
      country: country.toUpperCase(),
      price: priceData ? priceData.raw : null,
      amount: priceData ? parseFloat(priceData.amount) : null,
      success: !!priceData,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    return {
      country: country.toUpperCase(),
      price: null,
      amount: null,
      success: false,
      error: e.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function auth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/geo-prices', auth, async (req, res) => {
  const { url, countries } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  const countryList = countries ? countries.split(',') : DEFAULT_COUNTRIES;
  console.log(`Fetching prices for ${countryList.length} countries: ${url}`);

  // Fetch 2 at a time to limit memory
  const results = [];
  for (let i = 0; i < countryList.length; i += 2) {
    const batch = countryList.slice(i, i + 2);
    const batchResults = await Promise.all(
      batch.map(c => fetchPrice(url, c.trim().toLowerCase()))
    );
    results.push(...batchResults);
    console.log(`  Done: ${batch.join(', ')}`);
  }

  results.sort((a, b) => {
    if (!a.amount) return 1;
    if (!b.amount) return -1;
    return a.amount - b.amount;
  });

  res.json({
    hotelUrl: url,
    results,
    cheapest: results.find(r => r.success) || null,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Price API running on http://0.0.0.0:${PORT}`);
});
