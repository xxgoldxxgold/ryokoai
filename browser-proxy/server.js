const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const path = require('path');

chromium.use(stealth());

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 5e6,
  perMessageDeflate: false, // disable compression for speed
});

const PROXY_CONFIG = { host: '', port: '', username: '', password: '' };

const TARGET_URL = 'https://www.booking.com/searchresults.ja.html?ss=AYANA+Resort+Bali%2C+Jimbaran%2C+Bali%2C+Indonesia&ssne=%E3%82%BD%E3%82%A6%E3%83%AB&ssne_untouched=%E3%82%BD%E3%82%A6%E3%83%AB&efdco=1&label=gen173nr-10CAEoggI46AdIM1gEaJACiAEBmAEzuAEXyAEM2AED6AEB-AEBiAIBqAIBuAL-rbLNBsACAdICJGFiNDg0NWI0LWY3MjgtNGJhMi1iMTlmLTkxZTZlMDk5YTYxM9gCAeACAQ&aid=304142&lang=ja&sb=1&src_elem=sb&src=index&dest_id=48855&dest_type=hotel&ac_position=0&ac_click_type=b&ac_langcode=en&ac_suggestion_list_length=5&search_selected=true&search_pageview_id=6fad963f438d0dcd&ac_meta=GhA2ZmFkOTYzZjQzOGQwZGNkIAAoATICZW46DWF5YW5hIHJlc29ydCBAAEoAUAA%3D&checkin=2026-03-10&checkout=2026-03-11&group_adults=2&no_rooms=1&group_children=0';
const PORT = 3100;
const VIEWPORT = { width: 1280, height: 800 };

app.use(express.static(path.join(__dirname, 'public')));

let page = null;
let cdpSession = null;
let lastFrameBuf = null;

async function startBrowser() {
  const launchOptions = {
    headless: false,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
      '--disable-blink-features=AutomationControlled', '--window-size=1280,800',
      '--disable-extensions', '--disable-default-apps',
    ],
  };

  if (PROXY_CONFIG.host && PROXY_CONFIG.port) {
    launchOptions.proxy = { server: `http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}` };
    if (PROXY_CONFIG.username) {
      launchOptions.proxy.username = PROXY_CONFIG.username;
      launchOptions.proxy.password = PROXY_CONFIG.password;
    }
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: VIEWPORT, locale: 'ja-JP', timezoneId: 'Asia/Tokyo',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  });
  page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['ja', 'en-US', 'en'] });
    window.chrome = { runtime: {} };
  });

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Browser opened');

  // CDP Screencast - send binary buffers
  cdpSession = await page.context().newCDPSession(page);

  cdpSession.on('Page.screencastFrame', (frame) => {
    const buf = Buffer.from(frame.data, 'base64');
    lastFrameBuf = buf;
    if (io.engine.clientsCount > 0) {
      io.volatile.emit('frame', buf);
    }
    cdpSession.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
  });

  await cdpSession.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 40,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
    everyNthFrame: 1,
  });
  console.log('CDP Screencast started');

  // Keepalive: resend last frame every 2s for idle screens
  setInterval(() => {
    if (lastFrameBuf && io.engine.clientsCount > 0) {
      io.volatile.emit('frame', lastFrameBuf);
    }
  }, 2000);
}

io.on('connection', (socket) => {
  console.log('Client connected');
  if (lastFrameBuf) socket.emit('frame', lastFrameBuf);

  socket.on('click', async ({ x, y }) => {
    if (!page) return;
    try { await page.mouse.click(x, y); } catch (e) {}
  });

  socket.on('scroll', async ({ x, y, deltaX, deltaY }) => {
    if (!page) return;
    try {
      await page.mouse.move(x, y);
      await page.mouse.wheel(deltaX, deltaY);
    } catch (e) {}
  });

  socket.on('type', async ({ text }) => {
    if (!page) return;
    try { await page.keyboard.type(text); } catch (e) {}
  });

  socket.on('keydown', async ({ key }) => {
    if (!page) return;
    try { await page.keyboard.press(key); } catch (e) {}
  });

  socket.on('navigate', async ({ url }) => {
    if (!page) return;
    console.log('Navigating to:', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('Navigation complete');
    } catch (e) {
      console.error('Navigation error:', e.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

(async () => {
  await startBrowser();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
})();
