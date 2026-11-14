// Automatic geometry fixer: detect -> try small corrections -> re-check -> keep the best -> repeat.
//   node kit/autofix.mjs episodes/<ep> [--fresh] [--only 3,7]
// For every shot with problems it searches, greedily, for the smallest change that removes them:
//   CAM_INSIDE / BLOCKED  pull the camera back along its view, raise it, or slide it sideways
//   HIDDEN                orbit the camera sideways / up so the character's head is clear
//   CLIP                  push the character out of the prop or the other character (horizontal minimum push)
//   TOO_TIGHT             (episodes with HOUSE_RULES.framing) pull back until characters fill <= 45% of the frame
//   ALL_OFFSCREEN         only with --aim: re-aim at the characters' centre, widen the lens (else reported)
// Results go to episodes/<ep>/autofix.json (read at render time by kit/autofix-runtime.js), with a log of
// what changed and what is left for a human. Delete the file to undo everything.
import fs from 'node:fs'; import path from 'node:path';
import { openEpisode, loadAllow, allowed } from './qa-open.mjs';

const args = process.argv.slice(2);
const ep = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const AIM = args.includes('--aim'); // also re-aim shots where no character is in frame
const only = opt('only', '') ? opt('only').split(',').map(Number) : null;
const SAMPLES = [0.08, 0.5, 0.92];
const W = { TOO_TIGHT: 3, CAM_INSIDE: 6, BLOCKED: 4, ALL_OFFSCREEN: AIM ? 5 : 0, CLIP: 3, HIDDEN: 2, OFFSCREEN: 3.5 }; // OFFSCREEN is never fixed, only weighted so fixes cannot push people out of frame
const MAX_CAM = 14, MAX_ACTOR = 3, MAX_ITER = 6;
const file = path.join(ep, 'autofix.json');
const prev = !args.includes('--fresh') && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { shots: {} };
const allow = loadAllow(ep);

const { page, close } = await openEpisode(ep);
await page.evaluate((s) => { window.AUTOFIX = { shots: s }; window.__NO_RENDER = true; }, prev.shots || {});
const { st, end, rules, U } = await page.evaluate(() => ({ st: window.SHOT_TIMES, end: window.END, rules: window.HOUSE_RULES || null, U: window.QA.scale || 1 }));

const add = (a, b, k = 1) => [0, 1, 2].map((j) => (a?.[j] || 0) + (b?.[j] || 0) * k);
const len = (v) => Math.hypot(...(v || [0, 0, 0]));
const round = (v) => v.map((x) => +x.toFixed(2));
const clone = (f) => JSON.parse(JSON.stringify(f || {}));

async function evaluate(i, fix) {
  const t0 = st[i], t1 = i + 1 < st.length ? st[i + 1] : end;
  const res = await page.evaluate(({ i, fix, ts }) => {
    window.AUTOFIX.shots[String(i)] = fix; window.__NO_RENDER = true;
    return ts.map((t) => window.QA_CHECK(t));
  }, { i, fix, ts: SAMPLES.map((u) => t0 + (t1 - t0) * u) });
  const tight = rules && rules.framing && !(rules.close || []).includes(i);
  const issues = res.flatMap((r) => [...r.issues, ...(tight && r.frac > 0.45 ? [{ type: 'TOO_TIGHT', text: `TOO_TIGHT (${Math.round(r.frac * 100)}%)` }] : [])]).filter((x) => !allowed(allow, i, x.text));
  return { issues, info: res[1], score: issues.reduce((s, x) => s + (W[x.type] ?? 1), 0) };
}

function candidates(fix, ev) {
  const out = [], types = new Set(ev.issues.map((x) => x.type));
  const { fwd, right } = ev.info.cam;
  const cam = (d, look = null, why) => out.push({ why, f: { ...clone(fix), cam: round(add(fix.cam, d)), ...(look ? { look: round(add(fix.look, look)) } : {}) } });
  if (types.has('CAM_INSIDE') || types.has('BLOCKED')) {
    for (const d of [0.6, 1.2, 2, 3, 4.5, 6].map((v) => v * U)) cam(fwd.map((v) => -v * d), null, `camera back ${d.toFixed(2)}`);
    for (const d of [0.8, 1.6, 3].map((v) => v * U)) cam([0, d, 0], null, `camera up ${d.toFixed(2)}`);
    for (const s of [-2, -1, 1, 2].map((v) => v * U)) cam(right.map((v) => v * s), right.map((v) => v * s), `camera slide ${s}`);
    for (const d of [2, 4, 7, 10].map((v) => v * U)) cam(fwd.map((v) => v * d), null, `camera forward ${d.toFixed(2)}`); // out of a building, toward the subject
  }
  if (types.has('TOO_TIGHT')) for (const d of [1.5, 3, 5, 8, 12].map((v) => v * U)) cam(fwd.map((v) => -v * d), null, `camera back ${d} (framing)`);
  if (types.has('HIDDEN')) {
    for (const s of [-2.4, -1.2, -0.6, 0.6, 1.2, 2.4].map((v) => v * U)) cam(right.map((v) => v * s), null, `camera orbit ${s.toFixed(2)}`);
    for (const d of [1, 2.5].map((v) => v * U)) cam([0, d, 0], null, `camera up ${d}`);
  }
  for (const x of ev.issues.filter((x) => x.type === 'CLIP' && x.mtv)) {
    for (const k of [1, 1.6]) {
      const f = clone(fix); f.actors = f.actors || {}; f.actors[x.actor] = round(add(f.actors[x.actor], x.mtv, k));
      out.push({ why: `move ${x.actor} ${round(x.mtv.map((v) => v * k)).join(',')}`, f });
    }
  }
  if (AIM && types.has('ALL_OFFSCREEN') && ev.info.centroid) { // off by default: wide establishing shots are meant to be empty
    const d = ev.info.centroid.map((v, j) => v - ev.info.look[j]);
    out.push({ why: 'aim at the characters', f: { ...clone(fix), look: round(add(fix.look, d)) } });
    out.push({ why: 'aim at the characters, wider lens', f: { ...clone(fix), look: round(add(fix.look, d)), fov: (fix.fov || 0) + 8 } });
  }
  return out.filter((c) => len(c.f.cam) <= MAX_CAM * U && Object.values(c.f.actors || {}).every((v) => len(v) <= MAX_ACTOR * U));
}

const shots = clone(prev.shots), log = [];
let fixedShots = 0, leftShots = 0;
for (let i = 0; i < st.length; i++) {
  if (only && !only.includes(i)) continue;
  let fix = clone(shots[String(i)]);
  let cur = await evaluate(i, fix);
  const real = (ev) => ev.issues.filter((x) => x.type !== 'OFFSCREEN' && (AIM || x.type !== 'ALL_OFFSCREEN'));
  const offN = (ev) => ev.issues.filter((x) => x.type === 'OFFSCREEN').length;
  if (!real(cur).length) continue;
  const before = [...new Set(cur.issues.map((x) => x.text.split(' (')[0]))];
  const steps = [];
  for (let it = 0; it < MAX_ITER && cur.score > 0; it++) {
    let best = null;
    for (const c of candidates(fix, cur)) {
      const ev = await evaluate(i, c.f);
      const cost = ev.score + 0.02 * (len(c.f.cam) + Object.values(c.f.actors || {}).reduce((s, v) => s + len(v), 0));
      if (offN(ev) > offN(cur)) continue; // never push someone out of frame
      if (!best || cost < best.cost) best = { ...c, ev, cost };
    }
    if (!best || best.ev.score >= cur.score) break; // no candidate helps: stop (no oscillation)
    fix = best.f; cur = best.ev; steps.push(best.why);
  }
  await page.evaluate(({ i, fix }) => { window.AUTOFIX.shots[String(i)] = fix; }, { i, fix });
  if (steps.length) shots[String(i)] = fix;
  const after = [...new Set(cur.issues.map((x) => x.text.split(' (')[0]))];
  if (steps.length) fixedShots++;
  if (real(cur).length) leftShots++;
  log.push({ shot: i, before, changes: steps, after });
  console.log(`shot ${String(i).padStart(2)}  ${before.join(', ')}\n        -> ${steps.length ? steps.join('; ') : 'no automatic fix found'}${after.length ? `\n        still: ${after.join(', ')}` : '\n        clean'}`);
}
fs.writeFileSync(file, JSON.stringify({ note: 'written by kit/autofix.mjs; delete to undo', shots, log }, null, 1));
console.log(`\nfixed ${fixedShots} shot(s); ${leftShots} shot(s) still need a human look. Saved ${file}`);
await close();
