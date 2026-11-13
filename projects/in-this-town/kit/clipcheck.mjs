// Rendering-bug check, run before every video render (house rule 3).
//   node kit/clipcheck.mjs episodes/<ep> [--samples 0.08,0.5,0.92] [--no-frames]
// Geometry (kit/qa-page.js QA_CHECK): CAM_INSIDE, BLOCKED, HIDDEN, OFFSCREEN, ALL_OFFSCREEN, CLIP
// Frames (QA_FRAME, rendered): BLACK, FLAT, POP (sudden jump inside a shot)
// Intended cases go in episodes/<ep>/clip_allow.json. OFFSCREEN of a single extra is informational.
// Writes episodes/<ep>/qa_report.json; exit code 1 when anything needs fixing.
import fs from 'node:fs'; import path from 'node:path';
import { openEpisode, loadAllow, allowed } from './qa-open.mjs';

const args = process.argv.slice(2);
const ep = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const samples = opt('samples', '0.08,0.5,0.92').split(',').map(Number);
const frames = !args.includes('--no-frames');
const allow = loadAllow(ep);
const { page, close } = await openEpisode(ep);
const { st, end } = await page.evaluate(() => ({ st: window.SHOT_TIMES, end: window.END }));
const report = [];
let bad = 0;
for (let i = 0; i < st.length; i++) {
  const t0 = st[i], t1 = i + 1 < st.length ? st[i + 1] : end;
  for (const u of samples) {
    const t = t0 + (t1 - t0) * u;
    const r = await page.evaluate(({ t, frames }) => { window.__NO_RENDER = true; const g = window.QA_CHECK(t); const f = frames ? window.QA_FRAME(t) : { issues: [] }; return [...g.issues, ...f.issues]; }, { t, frames: frames && u === 0.5 });
    const list = r.filter((x) => !allowed(allow, i, x.text));
    if (!list.length) continue;
    const needs = list.filter((x) => x.type !== 'OFFSCREEN');
    if (needs.length) bad++;
    report.push({ shot: i, t: +t.toFixed(2), issues: list.map((x) => x.text) });
    console.log(`shot ${String(i).padStart(2)} @${t.toFixed(2)}s  ${[...new Set(list.map((x) => x.text))].join(' | ')}`);
  }
}
fs.writeFileSync(path.join(ep, 'qa_report.json'), JSON.stringify({ bad, report }, null, 1));
console.log(bad ? `\n${bad} sample(s) need fixing (run kit/autofix.mjs)` : '\nclean: no clipping, blocking or broken frames found');
await close();
process.exit(bad ? 1 : 0);
