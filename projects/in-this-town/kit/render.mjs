// Headless frame renderer: serves the project, steps window.renderAt(t), saves JPEG frames.
//   node kit/render.mjs episodes/01_shadow out_dir --fps 60 --from 0 --to 5.5   (or --times 0.5,1.2 for stills)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const ep = args[0], out = args[1];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fps = +opt('fps', 60), t0 = +opt('from', 0), t1 = +opt('to', 5.5);
const times = opt('times', '') ? opt('times').split(',').map(Number) : null;
fs.mkdirSync(out, { recursive: true });

const root = path.resolve('.');
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => { if (m.type() === 'error') console.error('page:', m.text()); });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(`http://localhost:${port}/${ep}/index.html`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });

let list0 = times;
if (args.includes('--shots')) { // QA: one still in the middle of every shot
  const { st, end } = await page.evaluate(() => ({ st: window.SHOT_TIMES, end: window.END }));
  list0 = st.map((t, i) => +(((t + (st[i + 1] ?? end)) / 2).toFixed(3)));
  const only = opt('only', ''); if (only) { const ids = only.split(',').map(Number); list0 = list0.filter((_, i) => ids.includes(i)); }
}

const f0 = Math.round(t0 * fps), f1 = Math.round(t1 * fps);
const list = list0 || Array.from({ length: f1 - f0 }, (_, i) => (f0 + i) / fps);
const start = Date.now();
for (let i = 0; i < list.length; i++) {
  const url = await page.evaluate((t) => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, list[i]);
  const name = list0 ? `still_${list[i].toFixed(2)}.jpg` : `${String(Math.round(list[i] * fps)).padStart(5, '0')}.jpg`; // global frame number
  fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  if (i % 30 === 0) console.log(`frame ${i + 1}/${list.length}  ${((Date.now() - start) / (i + 1) / 1000).toFixed(2)} s/frame`);
}
await browser.close();
server.close();
