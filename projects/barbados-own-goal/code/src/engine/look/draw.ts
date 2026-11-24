// Canvas2D painted textures for the shopping-cart short: flat 2D 1930s characters + in-world props.
import * as THREE from 'three';
export const INK = '#241726';
const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};
const fillInk = (g: CanvasRenderingContext2D, col: string, lw = 7) => { g.fillStyle = col; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); };

export type Who = 'goldman' | 'woman' | 'man' | 'grandma' | 'youngman' | 'youngwoman' | 'shopper' | 'shopper2' | 'kid';
type Look = {skin: string; top: string; bottom: string; hair: string; dress?: boolean; hat?: string; hatKind?: 'fedora' | 'cloche' | 'cap'; glasses?: boolean; bun?: boolean; bigArms?: boolean; tie?: string; scale?: number};
export const LOOKS: Record<Who, Look> = {
  goldman: {skin: '#f2c6a0', top: '#3d4a66', bottom: '#2c3449', hair: '#3a2a22', hat: '#5a4636', hatKind: 'fedora', glasses: true, tie: '#d0532f'},
  woman: {skin: '#f0c09a', top: '#d0532f', bottom: '#d0532f', hair: '#7a3b22', dress: true, hat: '#2f6f73', hatKind: 'cloche'},
  man: {skin: '#e6b08a', top: '#e9dcc0', bottom: '#4a4a58', hair: '#2a1f1a', bigArms: true, hat: '#4a4a58', hatKind: 'cap'},
  grandma: {skin: '#f2ccb0', top: '#8f6aa8', bottom: '#8f6aa8', hair: '#d9d6de', dress: true, bun: true, glasses: true, scale: 0.92},
  youngman: {skin: '#d9a07a', top: '#f2b234', bottom: '#384a6b', hair: '#2a1f1a', tie: '#2f6f73'},
  youngwoman: {skin: '#f5cfae', top: '#3f9a8c', bottom: '#3f9a8c', hair: '#e0a040', dress: true},
  shopper: {skin: '#f0c09a', top: '#5b7fb5', bottom: '#5b7fb5', hair: '#4a2a1e', dress: true, hat: '#d0532f', hatKind: 'cloche'},
  shopper2: {skin: '#c98d68', top: '#a8443a', bottom: '#3a3a48', hair: '#1e1612', hat: '#3a3a48', hatKind: 'fedora'},
  kid: {skin: '#f2c6a0', top: '#f2b234', bottom: '#4a6a9a', hair: '#7a4a2a', scale: 0.62},
};
export type Pose = {mouth?: boolean; smile?: 'big' | 'flat' | 'fake' | 'frown' | 'smirk'; basket?: 'heavy' | 'none'; arms?: 'down' | 'push' | 'cross' | 'up' | 'point'; sweat?: boolean; wink?: boolean; eyes?: 'side' | 'front' | 'closed'};

/** 256x512 canvas, feet at bottom centre. Character ~1.7 m when mapped to a 0.85 x 1.7 plane. */
export function drawPerson(who: Who, p: Pose = {}) {
  const c = cv(256, 512), g = c.getContext('2d')!, L = LOOKS[who];
  g.lineJoin = 'round'; g.lineCap = 'round';
  const cx = 128, s = L.scale ?? 1;
  g.translate(cx, 512); g.scale(s, s); g.translate(-cx, -512);
  // legs + shoes
  for (const dx of [-22, 22]) { rr(g, cx + dx - 13, 360, 26, 130, 8); fillInk(g, L.dress ? L.skin : L.bottom); rr(g, cx + dx - 18 + (dx > 0 ? 6 : -6), 480, 36, 20, 9); fillInk(g, INK, 4); }
  // body
  g.beginPath();
  if (L.dress) { g.moveTo(cx - 44, 205); g.lineTo(cx + 44, 205); g.lineTo(cx + 66, 400); g.quadraticCurveTo(cx, 414, cx - 66, 400); g.closePath(); }
  else { rr(g, cx - 48, 200, 96, 175, 26); }
  fillInk(g, L.top);
  if (!L.dress) { g.beginPath(); g.moveTo(cx, 205); g.lineTo(cx, 370); g.lineWidth = 4; g.strokeStyle = 'rgba(36,23,38,.45)'; g.stroke(); }
  if (L.tie) { g.beginPath(); g.moveTo(cx - 9, 208); g.lineTo(cx + 9, 208); g.lineTo(cx + 6, 290); g.lineTo(cx, 302); g.lineTo(cx - 6, 290); g.closePath(); fillInk(g, L.tie, 4); }
  if (L.dress) { g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(cx - 40 + (i * 37) % 84, 230 + ((i * 53) % 160), 5, 0, 7); g.fill(); } }
  // arms
  const arm = (side: number, ang: number, len = 150) => {
    g.save(); g.translate(cx + side * 46, 214); g.rotate(ang * side);
    const w = L.bigArms ? 40 : 26; rr(g, -w / 2, 0, w, len, w / 2); fillInk(g, L.dress ? L.skin : L.top);
    g.beginPath(); g.arc(0, len, w * 0.48, 0, 7); fillInk(g, L.skin, 5); g.restore();
  };
  const a = p.arms ?? 'down';
  if (a === 'push') { arm(-1, -1.25, 120); arm(1, -1.25, 120); }
  else if (a === 'cross') { arm(-1, -0.9, 100); arm(1, -0.9, 100); }
  else if (a === 'up') { arm(-1, 2.6, 140); arm(1, 2.6, 140); }
  else if (a === 'point') { arm(-1, 0.15); arm(1, -1.6, 140); }
  else { arm(-1, 0.18); arm(1, p.basket === 'heavy' ? 0.02 : 0.18, p.basket === 'heavy' ? 175 : 150); }
  if (p.basket === 'heavy') { // wicker basket hanging low on the right hand
    const bx = cx + 58, by = 392; rr(g, bx - 34, by, 68, 52, 8); fillInk(g, '#c8914a', 5);
    g.strokeStyle = 'rgba(36,23,38,.5)'; g.lineWidth = 3; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(bx - 34 + i * 13.6, by); g.lineTo(bx - 34 + i * 13.6, by + 52); g.stroke(); }
    g.beginPath(); g.arc(bx, by, 30, Math.PI, 0); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    for (const [dx, col] of [[-20, '#e8483a'], [2, '#f2b234'], [20, '#5aa05a']] as [number, string][]) { g.beginPath(); g.arc(bx + dx, by - 4, 13, 0, 7); fillInk(g, col, 4); }
  }
  // neck + head
  rr(g, cx - 13, 176, 26, 34, 6); fillInk(g, L.skin, 5);
  g.beginPath(); g.ellipse(cx, 130, 56, 62, 0, 0, 7); fillInk(g, L.skin);
  // hair
  g.beginPath(); g.ellipse(cx, 92, 58, 34, 0, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(cx + 58, 112); g.quadraticCurveTo(cx, 84, cx - 58, 112); g.closePath(); fillInk(g, L.hair, 5);
  if (L.bun) { g.beginPath(); g.arc(cx, 58, 24, 0, 7); fillInk(g, L.hair, 5); }
  if (L.dress && !L.bun && !L.hat) { g.beginPath(); g.ellipse(cx - 52, 140, 16, 34, 0.2, 0, 7); fillInk(g, L.hair, 5); g.beginPath(); g.ellipse(cx + 52, 140, 16, 34, -0.2, 0, 7); fillInk(g, L.hair, 5); }
  // face
  const ex = p.eyes === 'side' ? 10 : 0;
  for (const d of [-20, 20]) {
    if (p.eyes === 'closed' || (p.wink && d > 0)) { g.beginPath(); g.moveTo(cx + d - 9, 126); g.quadraticCurveTo(cx + d, 133, cx + d + 9, 126); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
    else { g.beginPath(); g.ellipse(cx + d + ex, 126, 6.5, 9, 0, 0, 7); g.fillStyle = INK; g.fill(); }
  }
  if (L.glasses) for (const d of [-20, 20]) { g.beginPath(); g.arc(cx + d, 126, 15, 0, 7); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  g.fillStyle = 'rgba(230,110,90,.35)'; for (const d of [-32, 32]) { g.beginPath(); g.ellipse(cx + d, 150, 11, 7, 0, 0, 7); g.fill(); }
  g.lineWidth = 5; g.strokeStyle = INK;
  if (p.mouth) { g.beginPath(); g.ellipse(cx, 160, 13, 11, 0, 0, 7); g.fillStyle = '#6a1e24'; g.fill(); g.stroke(); }
  else {
    const sm = p.smile ?? 'flat'; g.beginPath();
    if (sm === 'big') { g.moveTo(cx - 22, 154); g.quadraticCurveTo(cx, 182, cx + 22, 154); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke(); }
    else if (sm === 'fake') { g.moveTo(cx - 28, 156); g.quadraticCurveTo(cx, 172, cx + 28, 156); g.lineTo(cx - 28, 156); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(cx + i * 10, 157); g.lineTo(cx + i * 10, 166); } g.lineWidth = 2.5; g.stroke(); }
    else if (sm === 'frown') { g.moveTo(cx - 16, 166); g.quadraticCurveTo(cx, 154, cx + 16, 166); g.stroke(); }
    else if (sm === 'smirk') { g.moveTo(cx - 14, 160); g.quadraticCurveTo(cx + 6, 166, cx + 20, 152); g.stroke(); }
    else { g.moveTo(cx - 14, 160); g.lineTo(cx + 14, 160); g.stroke(); }
  }
  if (p.sweat) { g.beginPath(); g.moveTo(cx + 62, 92); g.quadraticCurveTo(cx + 76, 112, cx + 62, 118); g.quadraticCurveTo(cx + 50, 112, cx + 62, 92); fillInk(g, '#9fd8f0', 4); }
  // hats
  if (L.hat) {
    if (L.hatKind === 'fedora') { rr(g, cx - 78, 76, 156, 16, 8); fillInk(g, L.hat, 5); rr(g, cx - 46, 34, 92, 50, 16); fillInk(g, L.hat, 5); g.fillStyle = INK; g.fillRect(cx - 46, 68, 92, 10); }
    else if (L.hatKind === 'cloche') { g.beginPath(); g.ellipse(cx, 96, 64, 46, 0, Math.PI, 0); g.lineTo(cx + 70, 104); g.lineTo(cx - 70, 104); g.closePath(); fillInk(g, L.hat, 5); g.beginPath(); g.arc(cx + 34, 70, 10, 0, 7); fillInk(g, '#f2e3c0', 4); }
    else { g.beginPath(); g.ellipse(cx, 88, 58, 30, 0, Math.PI, 0); g.closePath(); fillInk(g, L.hat, 5); rr(g, cx - 4, 82, 74, 14, 7); fillInk(g, L.hat, 5); }
  }
  return tex(c);
}

/** in-world sign: text on a painted board */
export function drawSign(lines: string[], o: {w?: number; h?: number; bg?: string; fg?: string; font?: string; border?: string} = {}) {
  const w = o.w ?? 1024, h = o.h ?? 512, c = cv(w, h), g = c.getContext('2d')!;
  g.fillStyle = o.bg ?? '#f2e3c0'; g.fillRect(0, 0, w, h);
  g.lineWidth = 18; g.strokeStyle = o.border ?? INK; g.strokeRect(9, 9, w - 18, h - 18);
  g.fillStyle = o.fg ?? INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((t, i) => {
    let fs = (h * 0.72) / n; g.font = `${o.font ?? '900'} ${fs}px "Archivo Black", Anton, Impact, sans-serif`;
    while (g.measureText(t).width > w * 0.86) { fs *= 0.94; g.font = `${o.font ?? '900'} ${fs}px "Archivo Black", Anton, Impact, sans-serif`; }
    g.fillText(t, w / 2, (h / n) * (i + 0.5) + 4);
  });
  return tex(c);
}


export function drawCalendar(day: number) {
  const c = cv(256, 320), g = c.getContext('2d')!;
  g.fillStyle = '#fbf3e0'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#d0532f'; g.fillRect(0, 0, 256, 80);
  g.lineWidth = 10; g.strokeStyle = INK; g.strokeRect(5, 5, 246, 310);
  g.fillStyle = '#fff'; g.font = '900 48px "Archivo Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DAY', 128, 44);
  g.fillStyle = INK; g.font = '900 190px "Archivo Black", Impact, sans-serif'; g.fillText(String(day), 128, 210);
  return tex(c);
}
export function drawSky(top: string, bot: string) {
  const c = cv(16, 256), g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); return tex(c);
}
export function drawCoin() {
  const c = cv(128, 128), g = c.getContext('2d')!; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fillStyle = '#f2c23a'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.arc(64, 64, 42, 0, 7); g.lineWidth = 3; g.strokeStyle = '#b8821c'; g.stroke();
  g.fillStyle = '#b8821c'; g.font = '900 70px "Archivo Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 64, 68);
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 50, 3.5, 4.4); g.stroke(); return tex(c);
}
export function drawBulb() { // proper incandescent bulb, alpha cut-out
  const c = cv(256, 256), g = c.getContext('2d')!; g.lineJoin = g.lineCap = 'round';
  g.strokeStyle = '#ffd84a'; g.lineWidth = 10; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.42; g.beginPath(); g.moveTo(128 + Math.cos(a) * 92, 108 + Math.sin(a) * 92); g.lineTo(128 + Math.cos(a) * 118, 108 + Math.sin(a) * 118); g.stroke(); }
  g.beginPath(); g.moveTo(98, 150); g.bezierCurveTo(60, 120, 70, 36, 128, 30); g.bezierCurveTo(186, 36, 196, 120, 158, 150); g.lineTo(158, 176); g.lineTo(98, 176); g.closePath(); fillInk(g, '#ffe98a', 7);
  g.beginPath(); g.moveTo(112, 176); g.lineTo(116, 120); g.lineTo(128, 100); g.lineTo(140, 120); g.lineTo(144, 176); g.lineWidth = 4; g.strokeStyle = '#b2391f'; g.stroke();
  rr(g, 96, 176, 64, 18, 5); fillInk(g, '#9aa2ad', 6); rr(g, 100, 196, 56, 16, 5); fillInk(g, '#7b838e', 6); rr(g, 112, 214, 32, 12, 5); fillInk(g, INK, 4);
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(100, 78, 9, 22, 0.4, 0, 7); g.fill(); return tex(c);
}

// ------------------------------------------------------------------ world painters (v2)
const R = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
export const rep = (t: THREE.Texture, x = 1, y = 1) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
const mk = (w: number, h: number) => { const c = cv(w, h); return [c, c.getContext('2d')!] as const; };
const speck = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, rnd: () => number, s = 3, col = '36,23,38') => { for (let k = 0; k < n; k++) { g.fillStyle = `rgba(${col},${rnd() * a})`; g.fillRect(rnd() * w, rnd() * h, s, s); } };
const FONT = '"Archivo Black", Impact, sans-serif';

export function drawTiles() { // cream / teal checker linoleum, bevelled, scuffed. 1 tile = 1 m, 4x4 checks
  const [c, g] = mk(512, 512), rnd = R(11);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const teal = (i + j) % 2 === 0; g.fillStyle = teal ? '#3b8884' : '#eadfc4'; g.fillRect(i * 128, j * 128, 128, 128);
    g.fillStyle = teal ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.35)'; g.fillRect(i * 128 + 4, j * 128 + 4, 120, 5); g.fillRect(i * 128 + 4, j * 128 + 4, 5, 120);
    g.fillStyle = 'rgba(36,23,38,.18)'; g.fillRect(i * 128 + 4, j * 128 + 119, 120, 5); g.fillRect(i * 128 + 119, j * 128 + 4, 5, 120);
    g.fillStyle = `rgba(36,23,38,${rnd() * 0.07})`; g.fillRect(i * 128, j * 128, 128, 128);
  }
  g.strokeStyle = 'rgba(36,23,38,.5)'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  speck(g, 512, 512, 1400, 0.09, rnd, 3);
  g.strokeStyle = 'rgba(36,23,38,.07)'; g.lineWidth = 6; for (let k = 0; k < 7; k++) { g.beginPath(); const x = rnd() * 512, y = rnd() * 512; g.moveTo(x, y); g.lineTo(x + 70 + rnd() * 60, y + rnd() * 30 - 15); g.stroke(); }
  return rep(tex(c));
}
export function drawWallpaper(wm = 1.333) { // striped + damask paper over panelled wainscot, chair rail, crown. 256 px per metre, covers the full 3.6 m height
  const w = Math.round(256 * wm), h = 922, [c, g] = mk(w, h), rnd = R(5), wain = 256, top = h - wain;
  g.fillStyle = '#e8b56a'; g.fillRect(0, 0, w, h);
  const n = Math.max(2, Math.round(w / 40)), sw = w / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#e0a85a' : '#eec47e'; g.fillRect(i * sw, 0, sw, top); }
  for (let i = 0; i < n; i += 2) for (let y = 70; y < top - 20; y += 52) { const x = i * sw + sw * 1.0, yy = y + (i % 4 ? 26 : 0);
    g.fillStyle = 'rgba(160,80,40,.35)'; g.beginPath(); g.moveTo(x, yy - 12); g.lineTo(x + 8, yy); g.lineTo(x, yy + 12); g.lineTo(x - 8, yy); g.closePath(); g.fill(); g.beginPath(); g.arc(x, yy, 3, 0, 7); g.fillStyle = 'rgba(255,240,200,.5)'; g.fill(); }
  speck(g, w, top, 500, 0.05, rnd, 4);
  const vg = g.createLinearGradient(0, 0, 0, top); vg.addColorStop(0, 'rgba(60,30,10,.28)'); vg.addColorStop(0.12, 'rgba(60,30,10,0)'); g.fillStyle = vg; g.fillRect(0, 0, w, top);
  // crown moulding
  g.fillStyle = '#f2e3c0'; g.fillRect(0, 0, w, 26); g.fillStyle = '#c9b48a'; g.fillRect(0, 26, w, 6); g.fillStyle = 'rgba(36,23,38,.3)'; g.fillRect(0, 32, w, 8);
  // wainscot panelling
  g.fillStyle = '#7a3b22'; g.fillRect(0, top, w, wain);
  const np = 2, pw = w / np;
  for (let i = 0; i < np; i++) { const x = i * pw + 14, y = top + 36, ww = pw - 28, hh = wain - 78;
    g.fillStyle = '#6a3019'; g.fillRect(x, y, ww, hh); g.fillStyle = '#8b4a2b'; g.fillRect(x + 8, y + 8, ww - 16, hh - 16);
    g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(x + 8, y + 8, ww - 16, 5); g.fillRect(x + 8, y + 8, 5, hh - 16); g.fillStyle = 'rgba(20,8,4,.3)'; g.fillRect(x + 8, y + hh - 13, ww - 16, 5); g.fillRect(x + ww - 13, y + 8, 5, hh - 16); }
  g.fillStyle = '#f2e3c0'; g.fillRect(0, top - 6, w, 22); g.fillStyle = '#d3bf92'; g.fillRect(0, top + 14, w, 5); g.fillStyle = 'rgba(36,23,38,.35)'; g.fillRect(0, top + 19, w, 8);
  g.fillStyle = '#4e2314'; g.fillRect(0, h - 26, w, 26); g.fillStyle = '#6a3019'; g.fillRect(0, h - 30, w, 5);
  return rep(tex(c));
}
export function drawWire() { // dark-outlined light wire grid, transparent
  const [c, g] = mk(256, 256); const N = 6, st = 256 / N;
  for (const [col, lw] of [['rgba(36,23,38,.9)', 16], ['#eef3f8', 8]] as [string, number][]) { g.strokeStyle = col; g.lineWidth = lw; for (let i = 0; i < N; i++) { const p = i * st + st / 2; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 256); g.moveTo(0, p); g.lineTo(256, p); g.stroke(); } }
  return rep(tex(c));
}
export function drawAwning() { // canvas stripes with folds and stitching
  const [c, g] = mk(512, 128);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#f4e8c8' : '#c8432a'; g.fillRect(i * 32, 0, 32, 128); g.fillStyle = 'rgba(36,23,38,.18)'; g.fillRect(i * 32, 0, 3, 128); g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(i * 32 + 14, 0, 6, 128); }
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(36,23,38,.28)'); gr.addColorStop(0.35, 'rgba(36,23,38,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  return tex(c);
}
export function drawValance() { // scalloped awning skirt, alpha cut-out
  const [c, g] = mk(512, 64); g.lineJoin = 'round';
  for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 32, 0); g.lineTo(i * 32 + 32, 34); g.arc(i * 32 + 16, 34, 16, 0, Math.PI); g.closePath(); g.fillStyle = i % 2 ? '#f4e8c8' : '#c8432a'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  g.fillStyle = 'rgba(36,23,38,.25)'; g.fillRect(0, 0, 512, 5); return tex(c);
}
export function drawWood(base: string, o: {planks?: number; vertical?: boolean; seed?: number; dark?: number; knots?: boolean} = {}) {
  const [c, g] = mk(256, 256), rnd = R(o.seed ?? 3), np = o.planks ?? 4, ph = 256 / np;
  g.save(); if (o.vertical) { g.translate(256, 0); g.rotate(Math.PI / 2); }
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let p = 0; p < np; p++) { const y0 = p * ph;
    g.fillStyle = `rgba(${rnd() < 0.5 ? '255,235,200' : '30,12,4'},${0.05 + rnd() * 0.1})`; g.fillRect(0, y0, 256, ph);
    g.lineWidth = 1.6; for (let k = 0; k < 9; k++) { const y = y0 + 4 + rnd() * (ph - 8); g.strokeStyle = `rgba(40,18,6,${0.10 + rnd() * (o.dark ?? 0.16)})`; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(70, y + (rnd() - 0.5) * 6, 160, y + (rnd() - 0.5) * 6, 256, y + (rnd() - 0.5) * 3); g.stroke(); }
    if (o.knots !== false && rnd() < 0.6) { const kx = rnd() * 256, ky = y0 + ph * (0.3 + rnd() * 0.4); g.strokeStyle = 'rgba(40,18,6,.3)'; g.lineWidth = 2; for (let r = 3; r < 10; r += 3) { g.beginPath(); g.ellipse(kx, ky, r * 1.8, r * 0.8, 0, 0, 7); g.stroke(); } }
    g.fillStyle = 'rgba(30,12,4,.55)'; g.fillRect(0, y0, 256, 2.5); g.fillStyle = 'rgba(255,230,190,.14)'; g.fillRect(0, y0 + 2.5, 256, 2);
  }
  g.restore(); return rep(tex(c));
}
export function drawBrick(base = '#b9552f', mortar = '#d8c9a8') { // 1 m tile, 4 x 10 bricks
  const [c, g] = mk(256, 256), rnd = R(9); g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 10; r++) for (let i = -1; i < 4; i++) {
    const x = i * 64 + (r % 2 ? 32 : 0), y = r * 25.6, col = new THREE.Color(base).offsetHSL((rnd() - 0.5) * 0.02, 0, (rnd() - 0.5) * 0.09);
    g.fillStyle = '#' + col.getHexString(); g.fillRect(x + 2, y + 2, 60, 21.6);
    g.fillStyle = 'rgba(255,230,200,.16)'; g.fillRect(x + 2, y + 2, 60, 3); g.fillStyle = 'rgba(30,10,5,.22)'; g.fillRect(x + 2, y + 19, 60, 4);
  }
  speck(g, 256, 256, 500, 0.12, rnd, 3); return rep(tex(c));
}
export function drawMatcap(kind: 'chrome' | 'brass') {
  const [c, g] = mk(256, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  if (kind === 'chrome') { [[0, '#a9d6f5'], [0.30, '#e8f6ff'], [0.46, '#ffffff'], [0.5, '#242c38'], [0.58, '#5c6c7c'], [0.8, '#c9b8a0'], [1, '#f0e2c6']].forEach(([o, col]) => gr.addColorStop(o as number, col as string)); }
  else { [[0, '#fff2b8'], [0.35, '#e9bd4a'], [0.5, '#7a4a10'], [0.7, '#c8932c'], [1, '#f4d27a']].forEach(([o, col]) => gr.addColorStop(o as number, col as string)); }
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const hl = g.createRadialGradient(92, 84, 2, 92, 84, 52); hl.addColorStop(0, 'rgba(255,255,255,.95)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(0, 0, 256, 256);
  const rim = g.createRadialGradient(128, 128, 90, 128, 128, 128); rim.addColorStop(0, 'rgba(36,23,38,0)'); rim.addColorStop(1, 'rgba(36,23,38,.55)'); g.fillStyle = rim; g.fillRect(0, 0, 256, 256);
  return tex(c);
}
export function drawTin() { // pressed-tin ceiling, 1 tile = 1 m
  const [c, g] = mk(256, 256); g.fillStyle = '#eadbb2'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 64, y = j * 64;
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.strokeRect(x + 5, y + 5, 54, 54); g.strokeStyle = 'rgba(90,60,30,.35)'; g.strokeRect(x + 8, y + 8, 54, 54);
    g.beginPath(); g.arc(x + 32, y + 32, 14, 0, 7); g.strokeStyle = 'rgba(90,60,30,.4)'; g.stroke(); g.beginPath(); g.arc(x + 32, y + 32, 3, 0, 7); g.fillStyle = 'rgba(90,60,30,.4)'; g.fill(); }
  return rep(tex(c));
}
export function drawAsphalt(base = '#5c5e6c') { const [c, g] = mk(256, 256), rnd = R(21); g.fillStyle = base; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 1800, 0.22, rnd, 2, '255,255,255'); speck(g, 256, 256, 900, 0.3, rnd, 3);
  g.strokeStyle = 'rgba(20,12,24,.4)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); let x = rnd() * 256, y = rnd() * 256; g.moveTo(x, y); for (let s = 0; s < 5; s++) { x += rnd() * 40 - 10; y += rnd() * 40 - 10; g.lineTo(x, y); } g.stroke(); } return rep(tex(c)); }
export function drawSidewalk(base = '#b9b3a8') { const [c, g] = mk(256, 256), rnd = R(33); g.fillStyle = base; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 1200, 0.2, rnd, 2, '255,255,255'); speck(g, 256, 256, 700, 0.18, rnd, 3);
  g.strokeStyle = 'rgba(36,23,38,.55)'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.lineWidth = 2; g.stroke(); return rep(tex(c)); }
export function drawBurlap() { const [c, g] = mk(128, 128), rnd = R(4); g.fillStyle = '#d6b98a'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 4) { g.fillStyle = 'rgba(90,60,30,.16)'; g.fillRect(i, 0, 1.6, 128); g.fillRect(0, i, 128, 1.6); } speck(g, 128, 128, 300, 0.2, rnd, 2);
  g.fillStyle = 'rgba(90,40,30,.75)'; g.font = `900 30px ${FONT}`; g.textAlign = 'center'; g.fillText('FLOUR', 64, 66); g.font = `900 14px ${FONT}`; g.fillText('50 LBS', 64, 88); return tex(c); }
export function drawCanLabel() { // light label art; multiplied by per-instance tint
  const [c, g] = mk(256, 128), rnd = R(8); g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#c8c2b4'; g.fillRect(0, 0, 256, 14); g.fillRect(0, 114, 256, 14); g.fillStyle = INK; g.fillRect(0, 14, 256, 3); g.fillRect(0, 111, 256, 3);
  g.fillStyle = '#b8b0a0'; g.fillRect(0, 0, 256, 3);
  for (let i = 0; i < 2; i++) { const cx = 32 + i * 128; g.beginPath(); g.ellipse(cx, 64, 40, 34, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.fillStyle = '#9a1f12'; g.font = `900 26px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(['PEAS', 'SOUP', 'BEAN', 'PEAR'][Math.floor(rnd() * 4)], cx, 66); }
  g.fillStyle = 'rgba(36,23,38,.55)'; for (let i = 0; i < 6; i++) g.fillRect(70 + (i % 3) * 8 + Math.floor(i / 3) * 128 - 70 * 0, 28, 0, 0);
  return tex(c);
}
export function drawBoxLabel() {
  const [c, g] = mk(128, 192), rnd = R(2); g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#d9d2c0'; g.fillRect(0, 0, 128, 40); g.fillRect(0, 168, 128, 24);
  g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(4, 4, 120, 184);
  g.beginPath(); g.arc(64, 98, 34, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = '#b2391f'; g.font = `900 38px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', 64, 100);
  g.fillStyle = INK; g.font = `900 22px ${FONT}`; g.fillText(['OATS', 'SOAP', 'RICE', 'TEA'][Math.floor(rnd() * 4)], 64, 22); g.fillRect(24, 148, 80, 6); g.fillRect(36, 160, 56, 5);
  return tex(c);
}
export function drawCrate() { const t = drawWood('#c79a5c', {planks: 3, seed: 14}); return t; }
export function drawPrices() { // atlas of 4 shelf price cards
  const [c, g] = mk(512, 96); const L = ['5¢', '10¢', '2/25¢', '19¢'];
  L.forEach((t, i) => { const x = i * 128; g.fillStyle = '#fbf3e0'; g.fillRect(x + 3, 3, 122, 90); g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(x + 3, 3, 122, 90); g.fillStyle = '#b2391f'; g.fillRect(x + 8, 8, 112, 14);
    g.fillStyle = INK; g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x + 64, 60); }); return tex(c);
}
export function drawPlaque(lines: [string, number, string?][], o: {w?: number; h?: number; bg?: string; border?: string; inner?: string; pad?: number; rivets?: boolean} = {}) {
  const w = o.w ?? 1024, h = o.h ?? 512, [c, g] = mk(w, h); g.fillStyle = o.bg ?? '#f2e3c0'; g.fillRect(0, 0, w, h);
  const bw = Math.min(w, h) * 0.05; g.lineWidth = bw; g.strokeStyle = o.border ?? INK; g.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
  if (o.inner) { g.lineWidth = bw * 0.35; g.strokeStyle = o.inner; g.strokeRect(bw * 1.5, bw * 1.5, w - bw * 3, h - bw * 3); }
  if (o.rivets) { g.fillStyle = o.border ?? INK; for (const [x, y] of [[bw * 2.2, bw * 2.2], [w - bw * 2.2, bw * 2.2], [bw * 2.2, h - bw * 2.2], [w - bw * 2.2, h - bw * 2.2]]) { g.beginPath(); g.arc(x, y, bw * 0.4, 0, 7); g.fill(); } }
  const tot = lines.reduce((a, l) => a + l[1], 0); let y = h * 0.08; const H = h * 0.84; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [t, wt, col] of lines) { const lh = (H * wt) / tot; let fs = lh * 0.86; g.font = `900 ${fs}px ${FONT}`; while (g.measureText(t).width > w * 0.82 && fs > 6) { fs *= 0.95; g.font = `900 ${fs}px ${FONT}`; } g.fillStyle = col ?? INK; g.fillText(t, w / 2, y + lh / 2 + 2); y += lh; }
  return tex(c);
}
export function drawChalk() { const [c, g] = mk(512, 384), rnd = R(6); g.fillStyle = '#2d4036'; g.fillRect(0, 0, 512, 384); speck(g, 512, 384, 900, 0.1, rnd, 5, '255,255,255');
  g.lineWidth = 18; g.strokeStyle = '#8a5a30'; g.strokeRect(9, 9, 494, 366); g.fillStyle = '#f4f1e6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 52px ${FONT}`; g.fillText("TODAY'S SPECIALS", 256, 62); g.font = `900 40px ${FONT}`; g.textAlign = 'left';
  [['EGGS', '18¢ DOZ'], ['MILK', '10¢ QT'], ['BREAD', '8¢ LOAF'], ['COFFEE', '25¢ LB']].forEach(([a, b], i) => { g.fillText(a, 50, 140 + i * 62); g.textAlign = 'right'; g.fillText(b, 462, 140 + i * 62); g.textAlign = 'left'; });
  g.strokeStyle = 'rgba(244,241,230,.5)'; g.lineWidth = 3; g.setLineDash([4, 8]); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(200, 150 + i * 62); g.lineTo(300, 150 + i * 62); g.stroke(); } return tex(c); }
export function drawDay() { // daylight seen through a window: sky, sun glow, hazy street buildings
  const [c, g] = mk(256, 256), rnd = R(15), sk = g.createLinearGradient(0, 0, 0, 256); sk.addColorStop(0, '#8cc4ee'); sk.addColorStop(0.6, '#d8ecf4'); sk.addColorStop(1, '#fff4d4'); g.fillStyle = sk; g.fillRect(0, 0, 256, 256);
  const sun = g.createRadialGradient(190, 60, 4, 190, 60, 90); sun.addColorStop(0, 'rgba(255,250,220,1)'); sun.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = sun; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 4; i++) { const x = rnd() * 256, y = 40 + rnd() * 70; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 14, y + (k % 2) * 4, 22, 11, 0, 0, 7); g.fill(); } }
  let x = 0; while (x < 256) { const w = 28 + rnd() * 36, h = 60 + rnd() * 70; g.fillStyle = `rgba(${150 + rnd() * 40},${120 + rnd() * 30},${105 + rnd() * 30},.9)`; g.fillRect(x, 256 - h - 18, w, h + 18);
    g.fillStyle = 'rgba(255,240,200,.5)'; for (let wy = 256 - h - 6; wy < 232; wy += 16) for (let wx = x + 5; wx < x + w - 8; wx += 12) g.fillRect(wx, wy, 6, 8); x += w; }
  g.fillStyle = '#9a9488'; g.fillRect(0, 238, 256, 18); return tex(c);
}
export function drawDisplay() { // painted shop-window display seen from the street: gold arch lettering, can pyramids, produce
  const [c, g] = mk(256, 208); g.lineJoin = 'round'; g.fillStyle = '#6b4a30'; g.fillRect(0, 0, 256, 208);
  const wl = g.createLinearGradient(0, 0, 0, 208); wl.addColorStop(0, '#a07040'); wl.addColorStop(1, '#4a2e1c'); g.fillStyle = wl; g.fillRect(0, 0, 256, 208);
  g.fillStyle = '#d8a860'; g.fillRect(0, 140, 256, 8); g.fillStyle = '#3a2416'; g.fillRect(0, 148, 256, 60);
  const cans = ['#d0532f', '#f2b234', '#3f8a86', '#b2391f', '#5b7fb5'];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++) { const x = 30 + r * 12 + i * 24, y = 138 - r * 22; g.beginPath(); g.rect(x, y - 22, 22, 22); g.fillStyle = cans[(i + r) % 5]; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + 3, y - 14, 16, 7); }
  for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(150 + (i % 5) * 18 + (i > 4 ? 9 : 0), 126 - Math.floor(i / 5) * 16, 10, 0, 7); g.fillStyle = i % 3 ? '#e8483a' : '#f2a02a'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
  g.fillStyle = '#f2e3c0'; g.fillRect(172, 150, 70, 30); g.lineWidth = 3; g.strokeStyle = INK; g.strokeRect(172, 150, 70, 30); g.fillStyle = '#b2391f'; g.font = `900 18px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SALE 5¢', 207, 166);
  g.fillStyle = '#f2d27a'; g.font = `900 22px ${FONT}`; g.fillText('FRESH FRUITS', 128, 24); g.font = `900 16px ${FONT}`; g.fillText('& VEGETABLES', 128, 46); g.strokeStyle = '#f2d27a'; g.lineWidth = 3; g.beginPath(); g.moveTo(20, 60); g.lineTo(236, 60); g.stroke();
  const rf = g.createLinearGradient(0, 0, 256, 208); rf.addColorStop(0.3, 'rgba(255,255,255,0)'); rf.addColorStop(0.45, 'rgba(255,255,255,.22)'); rf.addColorStop(0.55, 'rgba(255,255,255,0)'); g.fillStyle = rf; g.fillRect(0, 0, 256, 208); return tex(c);
}
export function drawSkyBack() { const [c, g] = mk(512, 256), rnd = R(19), sk = g.createLinearGradient(0, 0, 0, 256); sk.addColorStop(0, '#76a8dc'); sk.addColorStop(0.55, '#f3d29a'); sk.addColorStop(1, '#f6b878'); g.fillStyle = sk; g.fillRect(0, 0, 512, 256);
  g.fillStyle = 'rgba(255,245,225,.8)'; for (let i = 0; i < 8; i++) { const x = rnd() * 512, y = 40 + rnd() * 100; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 18, y + (k % 2) * 5, 34, 10, 0, 0, 7); g.fill(); } }
  let x = 0; while (x < 512) { const w = 24 + rnd() * 40, h = 20 + rnd() * 55; g.fillStyle = 'rgba(170,110,90,.55)'; g.fillRect(x, 256 - h, w, h); x += w + 2; } return tex(c); }
export function drawPegboard() { const [c, g] = mk(512, 256), rnd = R(12); g.fillStyle = '#b08850'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = 'rgba(40,20,8,.55)'; for (let x = 8; x < 512; x += 16) for (let y = 8; y < 256; y += 16) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  g.lineJoin = g.lineCap = 'round'; const tool = (f: () => void) => { f(); };
  tool(() => { g.save(); g.translate(60, 40); g.rotate(-0.2); rr(g, -4, 0, 10, 80, 3); fillInk(g, '#d8b070', 4); rr(g, -22, -14, 46, 20, 4); fillInk(g, '#9aa2ad', 4); g.restore(); });
  tool(() => { g.beginPath(); g.moveTo(130, 30); g.lineTo(250, 40); g.lineTo(250, 66); g.lineTo(130, 52); g.closePath(); fillInk(g, '#c9d1da', 4); rr(g, 104, 34, 30, 24, 8); fillInk(g, '#a8683a', 4); });
  tool(() => { for (const d of [0, 1]) { g.save(); g.translate(300 + d * 30, 30); g.rotate(d ? 0.1 : -0.1); rr(g, -7, 0, 14, 90, 6); fillInk(g, d ? '#d0532f' : '#2f6f73', 4); g.restore(); } });
  tool(() => { g.beginPath(); g.arc(400, 80, 34, 0, 7); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); g.lineWidth = 3.5; g.strokeStyle = '#c9d1da'; g.stroke(); g.beginPath(); g.arc(400, 80, 34, 0, 7); g.lineWidth = 0; });
  tool(() => { g.save(); g.translate(470, 30); g.rotate(0.15); rr(g, -6, 0, 12, 100, 4); fillInk(g, '#9aa2ad', 4); g.beginPath(); g.arc(0, 4, 14, 0, 7); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); });
  tool(() => { g.fillStyle = 'rgba(36,23,38,.18)'; for (const [x, y, w, h] of [[40, 22, 60, 110], [128, 24, 130, 40], [282, 24, 60, 110], [364, 40, 76, 80], [446, 24, 44, 130]]) rr(g, x + 5, y + 6, w, h, 8), g.fill(); });
  speck(g, 512, 256, 300, 0.1, rnd, 3); return tex(c); }
export function drawRegister() { const [c, g] = mk(256, 192); g.fillStyle = '#d9a84a'; g.fillRect(0, 0, 256, 192);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(24 + i * 29, 38 + r * 38, 11, 0, 7); g.fillStyle = (i + r) % 5 === 0 ? '#b2391f' : '#f6f1e4'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.fillStyle = INK; g.font = `900 12px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String((i + r * 3) % 10), 24 + i * 29, 39 + r * 38); }
  g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(4, 4, 248, 184); return tex(c); }
export function drawTag() { const [c, g] = mk(256, 96); g.fillStyle = '#1c1a22'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#f6f1e4'; for (let i = 0; i < 3; i++) { g.fillRect(14 + i * 80, 14, 66, 68); g.fillStyle = INK; g.font = `900 52px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(['1', '9', '8'][i], 47 + i * 80, 52); g.fillStyle = '#f6f1e4'; }
  g.lineWidth = 8; g.strokeStyle = '#8a5a14'; g.strokeRect(4, 4, 248, 88); return tex(c); }
export function drawDial() { const [c, g] = mk(128, 128); g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fillStyle = '#fbf3e0'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  g.lineWidth = 3; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283; g.beginPath(); g.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); g.stroke(); }
  g.fillStyle = '#b2391f'; g.beginPath(); g.moveTo(64, 64); g.lineTo(100, 40); g.lineTo(66, 58); g.closePath(); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(64, 64, 5, 0, 7); g.fill(); return tex(c); }
export function drawClock() { const [c, g] = mk(128, 128); g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fillStyle = '#fbf3e0'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.lineWidth = i % 3 ? 3 : 6; g.beginPath(); g.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); g.lineTo(64 + Math.cos(a) * 55, 64 + Math.sin(a) * 55); g.stroke(); }
  g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(88, 74); g.stroke(); return tex(c); }
export function drawBarrelEnd() { const [c, g] = mk(128, 128); g.fillStyle = '#b8864e'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(40,18,6,.4)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * 18, 0); g.lineTo(i * 18, 128); g.stroke(); } return tex(c); }
export function drawCar() { const [c, g] = mk(8, 8); g.fillStyle = '#fff'; g.fillRect(0, 0, 8, 8); return tex(c); }
export function drawInterior() { // dim warm store interior seen through the shop door glass
  const [c, g] = mk(256, 256), rnd = R(40), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5a3a24'); gr.addColorStop(1, '#8a5a30'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let l = 0; l < 4; l++) { g.fillStyle = '#3a2416'; g.fillRect(0, 60 + l * 50, 256, 5); for (let i = 0; i < 14; i++) { g.fillStyle = ['#d0532f', '#f2b234', '#3f8a86', '#e9dcc0', '#5b7fb5'][Math.floor(rnd() * 5)]; g.fillRect(i * 19 + 2, 60 + l * 50 - 24, 15, 24); } }
  for (const x of [60, 196]) { const lg = g.createRadialGradient(x, 30, 2, x, 30, 70); lg.addColorStop(0, 'rgba(255,230,160,.95)'); lg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = lg; g.fillRect(0, 0, 256, 140); }
  g.fillStyle = '#3b8884'; g.fillRect(0, 232, 256, 24); const rf = g.createLinearGradient(0, 0, 256, 256); rf.addColorStop(0.35, 'rgba(255,255,255,0)'); rf.addColorStop(0.5, 'rgba(255,255,255,.2)'); rf.addColorStop(0.6, 'rgba(255,255,255,0)'); g.fillStyle = rf; g.fillRect(0, 0, 256, 256); return tex(c);
}
