// Usage:  node render.mjs stills   -> one PNG per card in stills/
//         node render.mjs frames   -> every frame in frames/f00000.png ...
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const mode = process.argv[2] || 'frames';
if (!['stills', 'frames'].includes(mode)) {
  console.error('Use: node render.mjs stills | frames');
  process.exit(1);
}

const root = path.dirname(fileURLToPath(import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
};

// Static server on a free port, so the font loads over http://
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(root, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(root)) throw new Error('outside root');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on('pageerror', e => { throw e; });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.goto(url);
  await page.waitForFunction('window.READY === true', { timeout: 30000 });
  if (!(await page.evaluate('window.FONT_OK'))) {
    throw new Error('Font did not load. Is fonts/SpaceGrotesk-700.woff2 present? Run: npm run font');
  }

  const { duration, fps, cards } = await page.evaluate(() => ({
    duration: window.DURATION, fps: window.FPS, cards: window.CARDS,
  }));
  const grab = t => page.evaluate(t => {
    window.renderFrame(t);
    return document.getElementById('c').toDataURL('image/png');
  }, t);
  const save = async (file, dataUrl) =>
    fs.writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

  if (mode === 'stills') {
    await fs.mkdir(path.join(root, 'stills'), { recursive: true });
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const t = c.start + 0.5 + c.hold / 2; // middle of the hold
      await save(path.join(root, 'stills', `card${i + 1}.png`), await grab(t));
      console.log(`stills/card${i + 1}.png  "${c.text}"  t=${t.toFixed(2)}s`);
    }
  } else {
    const dir = path.join(root, 'frames');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const n = Math.round(duration * fps);
    for (let i = 0; i < n; i++) {
      const name = `f${String(i).padStart(5, '0')}.png`;
      await save(path.join(dir, name), await grab(i / fps));
      if (i % 30 === 0) console.log(`frame ${i}/${n}`);
    }
    console.log(`Done: ${n} frames, ${duration.toFixed(2)}s. Now run: npm run encode`);
  }
} finally {
  await browser.close();
  server.close();
}
