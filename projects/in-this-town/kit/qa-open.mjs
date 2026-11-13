// Opens an episode headless with the QA checks injected. Used by clipcheck.mjs and autofix.mjs.
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname);

export async function openEpisode(ep, { width = 540, height = 960 } = {}) {
  const root = path.resolve('.');
  const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf' };
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(r); }).listen(0);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto(`http://localhost:${srv.address().port}/${ep}/index.html`);
  await page.waitForFunction(() => window.READY === true && window.QA, null, { timeout: 180000 });
  await page.addScriptTag({ content: fs.readFileSync(path.join(HERE, 'qa-page.js'), 'utf8') });
  return { page, close: async () => { await browser.close(); srv.close(); } };
}

/** allowlist: { "<shot>": ["CLIP mayor", ...], "*": ["OFFSCREEN"] } - prefix match on the issue text */
export function loadAllow(ep) {
  const f = path.join(ep, 'clip_allow.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
}
export const allowed = (allow, shot, text) => [...(allow['*'] || []), ...(allow[String(shot)] || [])].some((p) => text.startsWith(p));
