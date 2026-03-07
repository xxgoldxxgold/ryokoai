const fastify = require('fastify')({ logger: false });
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const proxyChain = require('proxy-chain');
puppeteer.use(StealthPlugin());

const IPROYAL_USER = 'wUxAArPgvXq2phyo';
const IPROYAL_PASS = 'RQgt7vf07ToEIDHg';
const API_KEY = 'ryokoai_scraper_2026';
const CHROMIUM_PATH = '/snap/bin/chromium';

var scraping = false;

async function scrapeAgoda(hotelName, checkIn, checkOut, country) {
  var session = 'sess' + Date.now() + Math.floor(Math.random() * 10000);
  var proxySuffix = '_session-' + session + (country ? '_country-' + country : '');
  var proxyUrl = await proxyChain.anonymizeProxy(
    'socks5://' + IPROYAL_USER + ':' + IPROYAL_PASS + proxySuffix + '@geo.iproyal.com:32325'
  );

  var browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--proxy-server=' + proxyUrl
    ],
    defaultViewport: { width: 1366, height: 768 },
  });

  try {
    var page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // Block images, fonts, media, tracking to save bandwidth
    await page.setRequestInterception(true);
    page.on('request', function(req) {
      var type = req.resourceType();
      var url = req.url();
      if (type === 'image' || type === 'font' || type === 'media' ||
          /google-analytics|googletagmanager|facebook|doubleclick|hotjar|amplitude|sentry|newrelic|optimizely|branch\.io|appsflyer|adjust\.com|criteo|taboola|outbrain/.test(url)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Step 1: Open Agoda
    await page.goto('https://www.agoda.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('input#textInput', { timeout: 45000 });

    // Step 2: Type hotel name
    var searchBox = await page.$('input#textInput');
    if (!searchBox) throw new Error('Search box not found');
    await searchBox.click({ clickCount: 3 });
    await searchBox.type(hotelName, { delay: 30 });
    await new Promise(function(r) { setTimeout(r, 1500); });

    // Step 3: Click first suggestion
    var suggestion = await page.$('li[role="option"]')
      || await page.$('[data-selenium="autocomplete-item"]')
      || await page.$('ul[role="listbox"] li');
    if (suggestion) {
      try { await page.evaluate(function(el) { el.click(); }, suggestion); } catch(e) {}
      await new Promise(function(r) { setTimeout(r, 500); });
    }

    // Step 4: Click search
    var searchBtn = await page.$('[data-selenium="searchButton"]') || await page.$('button[type="submit"]');
    if (!searchBtn) {
      try {
        var buttons = await page.$$('button');
        for (var i = 0; i < buttons.length; i++) {
          var btnText = await page.evaluate(function(el) { return el ? el.innerText || '' : ''; }, buttons[i]).catch(function(){ return ''; });
          if (/search|検索|SEARCH/i.test(btnText)) { searchBtn = buttons[i]; break; }
        }
      } catch(e) {}
    }
    if (searchBtn) {
      try { await page.evaluate(function(el) { el.click(); }, searchBtn); } catch(e) {}
    }

    // Step 5: Wait for results
    try {
      await page.waitForSelector('[data-selenium="hotel-item"], .PropertyCard, [data-element-name="property-card"]', { timeout: 30000 });
      await new Promise(function(r) { setTimeout(r, 1500); });
    } catch(e) {
      await new Promise(function(r) { setTimeout(r, 3000); });
    }

    // Step 6: Extract
    var hotelData = await page.evaluate(function() {
      var results = [];
      var cards = document.querySelectorAll('[data-selenium="hotel-item"], .PropertyCard, [data-element-name="property-card"]');
      if (cards.length === 0) {
        var text = (document.body && document.body.innerText) || '';
        var priceMatch = text.match(/(?:USD|IDR|JPY|EUR|THB|KRW|VND)\s*[\d,.]+/);
        return { hotels: [], pageTitle: document.title, pageUrl: window.location.href, fallbackPrice: priceMatch ? priceMatch[0] : null };
      }
      cards.forEach(function(card) {
        var nameEl = card.querySelector('[data-selenium="hotel-name"], .PropertyCard__hotelName, h3');
        var priceEl = card.querySelector('[data-selenium="display-price"], .PropertyCard__price, [data-element-name="price"]');
        var imgEl = card.querySelector('img');
        var linkEl = card.querySelector('a[href*="/hotel/"], a[href*="agoda.com"]') || card.querySelector('a');
        var name = nameEl ? nameEl.innerText.trim() : '';
        if (name) {
          results.push({
            hotelName: name,
            priceText: priceEl ? priceEl.innerText.trim() : '',
            imageUrl: imgEl ? imgEl.src : '',
            agodaUrl: linkEl ? linkEl.href : ''
          });
        }
      });
      return { hotels: results, pageTitle: document.title, pageUrl: window.location.href };
    });

    return { success: true, data: hotelData };
  } finally {
    await browser.close().catch(function(){});
    await proxyChain.closeAnonymizedProxy(proxyUrl, true).catch(function(){});
  }
}

fastify.post('/scrape-agoda', async function(request, reply) {
  var auth = request.headers['x-api-key'];
  if (auth !== API_KEY) return reply.code(401).send({ error: 'Unauthorized' });
  var body = request.body || {};
  if (!body.hotelName) return reply.code(400).send({ error: 'hotelName is required' });
  if (scraping) return reply.code(429).send({ error: '別のリクエスト処理中です。しばらくお待ちください。' });

  scraping = true;
  try {
    var result = await scrapeAgoda(body.hotelName, body.checkIn, body.checkOut, body.country || 'id');
    return result;
  } catch(err) {
    return reply.code(500).send({ error: err.message });
  } finally {
    scraping = false;
  }
});

fastify.post('/scrape', async function(request, reply) {
  return reply.code(400).send({ error: 'Use /scrape-agoda instead' });
});

fastify.listen({ port: 3456, host: '127.0.0.1' }, function(err) {
  if (err) { console.error(err); process.exit(1); }
  console.log('Agoda scraper running on port 3456');
});
