// Farm town "Pigeon Creek" (episode 5 "No Phones Till 18"), built in METRES to match the CC0 characters.
// Main street runs along -z: road x -5..5, sidewalks x 5..8 (top 0.15), shop fronts at |x| = 8, town from z +8 to -70.
// Around it: cornfields (instanced, they sway), a red barn with silos, a windmill pump, a water tower, farmhouses,
// two cell phone towers (the storm knocks them out), power poles, hills. Static parts are baked for phones.
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box } from './town.js';
import { bake } from './world.js';
import { textTex } from './props.js';

let seed = 91;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
export const ROAD = 5, FRONT = 8, SWY = 0.15;
export const TIME = { value: 0 }, WIND = { value: 0.3 }; // corn sway uniforms (the episode sets them per frame)

const cyl = (rt, rb, h, m, x, y, z, p, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; p.add(c); return c; };
const glow = (c, k = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.5 });

// ---------------------------------------------------------------- textures (metres: repeat = size / tile)
const grassTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#6fa64a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) { const v = rnd(); g.fillStyle = v < 0.5 ? 'rgba(90,150,60,.5)' : v < 0.8 ? 'rgba(140,190,90,.45)' : 'rgba(180,170,90,.35)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2); }
}, [140, 140]);
const asphaltTex = (len) => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#4c4f5a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) { const v = 60 + rnd() * 40; g.fillStyle = `rgba(${v},${v},${v + 8},.4)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.fillStyle = '#f2c14e'; g.fillRect(w / 2 - 5, 40, 4, 180); g.fillRect(w / 2 + 1, 40, 4, 180); g.fillRect(w / 2 - 5, 296, 4, 180); g.fillRect(w / 2 + 1, 296, 4, 180);
  g.fillStyle = '#e9edf5'; g.fillRect(8, 0, 5, h); g.fillRect(w - 13, 0, 5, h);
  for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(30,30,36,.5)'; g.lineWidth = 2; g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 30; y += rnd() * 25; g.lineTo(x, y); } g.stroke(); }
}, [1, len / 12]);
const concreteTex = (len) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#c9c3b8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a49d92'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 1); g.lineTo(w, 1); g.moveTo(1, 0); g.lineTo(1, h); g.stroke();
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,110,100,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
}, [2, len / 1.5]);
const brickTex = (base, rep) => canvasTex(128, 128, (g) => {
  g.fillStyle = '#5a3a30'; g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const k = rnd(); g.fillStyle = k < 0.3 ? shade(base, -18) : k < 0.6 ? shade(base, 10) : base; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); }
}, rep);
const sidingTex = (base, rep) => canvasTex(64, 64, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, r * 16 + 13, 64, 3); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, r * 16, 64, 2); }
}, rep);
const soilTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) { g.fillStyle = 'rgba(60,40,24,.6)'; g.fillRect(r * 16, 0, 6, h); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(150,120,80,${rnd() * 0.4})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
}, [1, 1]);
const cornTopTex = () => canvasTex(128, 128, (g, w, h) => { // far fields seen from above: rows of green with tassels
  g.fillStyle = '#4e7d34'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let i = 0; i < 30; i++) { g.fillStyle = rnd() < 0.5 ? '#6b9a40' : '#3d6a2a'; g.fillRect(r * 16 + rnd() * 10, rnd() * h, 6, 5); g.fillStyle = 'rgba(230,200,110,.7)'; if (rnd() < 0.25) g.fillRect(r * 16 + rnd() * 10, rnd() * h, 3, 3); }
}, [1, 1]);
function shade(hex, k) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k / 255); return '#' + c.getHexString(); }

// ---------------------------------------------------------------- building parts (out = direction the facade faces on x)
const faceY = (out) => (out > 0 ? Math.PI / 2 : -Math.PI / 2);
function signBoard(p, lines, x, y, z, out, w, h, o = {}) {
  box(0.12, h + 0.16, w + 0.16, std(o.frame ?? 0x3a2a20), x - out * 0.02, y, z, p);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textTex(lines, { w: 1024, h: Math.round(1024 * h / w), bg: o.bg || '#f4ead2', fg: o.fg || '#7a2a24', border: o.border || null, radius: 12, sizes: o.sizes || null }), roughness: 0.7, emissive: o.glow ? 0xffffff : 0, emissiveMap: null, emissiveIntensity: 0 }));
  m.position.set(x + out * 0.05, y, z); m.rotation.y = faceY(out); p.add(m); return m;
}
/** 3D window: frame bars, glass sheen, interior picture, sill, optional shutters and flower box */
const INTERIORS = {};
function interiorTex(kind) {
  if (INTERIORS[kind]) return INTERIORS[kind];
  INTERIORS[kind] = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = kind === 'home' ? '#4a3a40' : '#3a3540'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,230,180,.35)'); gr.addColorStop(1, 'rgba(0,0,0,.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (kind === 'home') { g.fillStyle = '#e8dcc6'; g.fillRect(0, 0, 60, h); g.fillRect(w - 60, 0, 60, h); g.fillStyle = '#c84a3a'; for (let y = 0; y < h; y += 24) { g.fillRect(4, y + 4, 52, 3); g.fillRect(w - 56, y + 4, 52, 3); } g.fillStyle = '#ffd9a0'; g.beginPath(); g.arc(w / 2, 70, 20, 0, 7); g.fill(); }
    else { for (let s = 0; s < 4; s++) { g.fillStyle = '#8a6a4a'; g.fillRect(0, 50 + s * 55, w, 6); for (let i = 0; i < 14; i++) { g.fillStyle = pick(['#e8434f', '#f2c14e', '#3ea0e0', '#6bbf59', '#f4ead2', '#e88a3a']); const bw = 8 + rnd() * 10; g.fillRect(i * 18 + rnd() * 4, 50 + s * 55 - 10 - rnd() * 22, bw, 30); } } }
  });
  return INTERIORS[kind];
}
const GLASS = new THREE.MeshStandardMaterial({ color: 0xbfd8f0, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.28 });
function windowAt(p, x, y, z, out, w, h, { trim = 0xf4f0e6, kind = 'home', shutters = null, flowers = false, mullion = true } = {}) {
  const T = std(trim);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: interiorTex(kind), roughness: 0.9, emissive: 0xffe0b0, emissiveIntensity: 0.12 }));
  pic.position.set(x + out * 0.03, y, z); pic.rotation.y = faceY(out); p.add(pic);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), GLASS); gl.position.set(x + out * 0.09, y, z); gl.rotation.y = faceY(out); p.add(gl);
  const t = 0.09;
  box(0.14, t, w + 2 * t, T, x + out * 0.07, y + h / 2 + t / 2, z, p); box(0.14, t, w + 2 * t, T, x + out * 0.07, y - h / 2 - t / 2, z, p);
  box(0.14, h, t, T, x + out * 0.07, y, z - w / 2 - t / 2, p); box(0.14, h, t, T, x + out * 0.07, y, z + w / 2 + t / 2, p);
  if (mullion) { box(0.1, h, 0.05, T, x + out * 0.08, y, z, p); box(0.1, 0.05, w, T, x + out * 0.08, y + h * 0.1, z, p); }
  box(0.3, 0.07, w + 0.35, T, x + out * 0.15, y - h / 2 - 0.12, z, p); // sill
  if (shutters != null) for (const s of [-1, 1]) { const sh = box(0.06, h + 0.1, w * 0.45, std(shutters), x + out * 0.06, y, z + s * (w / 2 + t + w * 0.25), p); for (let k = 0; k < 5; k++) box(0.08, 0.025, w * 0.4, std(shade(shutters, -30)), x + out * 0.08, y - h / 2 + 0.12 + k * h / 5, z + s * (w / 2 + t + w * 0.25), p); }
  if (flowers) { box(0.25, 0.2, w + 0.1, std(0x6b4a2a), x + out * 0.2, y - h / 2 - 0.28, z, p); for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), std(pick([0xe8434f, 0xf2c14e, 0xffffff, 0xd85aa0]))); f.position.set(x + out * 0.22, y - h / 2 - 0.12, z - w / 2 + 0.1 + k * (w - 0.2) / 5); p.add(f); } }
}
function awning(p, x, z, out, w, y, colA, colB) {
  const tex = canvasTex(256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? colA : colB; g.fillRect(i * 32, 0, 32, 64); } }, [Math.max(1, Math.round(w / 2)), 1]);
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide });
  const a = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, w), m); a.position.set(x + out * 0.75, y, z); a.rotation.z = -out * 0.32; a.castShadow = true; p.add(a);
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, w), m); v.position.set(x + out * 1.47, y - 0.38, z); v.castShadow = true; p.add(v);
  for (const s of [-1, 1]) box(0.04, 0.04, 0.04, std(0x2a2a30), x + out * 1.4, y - 0.25, z + s * w / 2, p);
}

/** a main-street store: 1 or 2 storeys, brick or siding, shop windows, door, awning, sign, cornice, upper windows */
function store(p, side, zc, w, o) {
  const out = -side, fx = side * FRONT, D = 11, H = o.floors === 2 ? 7.4 : 4.3;
  const wall = o.wall === 'brick' ? new THREE.MeshStandardMaterial({ map: brickTex(o.color, [w / 2.2, H / 1.1]), roughness: 0.9 }) : new THREE.MeshStandardMaterial({ map: sidingTex(o.color, [w / 1.2, H / 0.8]), roughness: 0.8 });
  const trim = std(o.trim ?? 0xf4f0e6);
  box(D, H, w, wall, side * (FRONT + D / 2), H / 2, zc, p);
  const fp = o.parapet ?? 1.1; // false front above the roof line
  box(0.35, fp, w, wall, fx + side * 0.18, H + fp / 2, zc, p);
  box(0.6, 0.28, w + 0.3, trim, fx + out * 0.08, H + fp, zc, p); // cornice
  box(0.3, 0.18, w + 0.1, trim, fx + out * 0.05, 4.05, zc, p); // band above the shopfront
  for (let k = 0; k < 2; k++) box(0.2, 1.6, 0.25, trim, fx - side * 0.0 + out * 0.04, H + fp - 0.7, zc - w / 2 + 0.3 + k * (w - 0.6), p);
  // shopfront: door + two windows, kick plates
  const dz = zc + (o.doorAt ?? 0) * w;
  box(0.1, 2.35, 1.15, std(o.door ?? 0x2f4a3a), fx + out * 0.06, SWY + 1.175, dz, p);
  box(0.12, 0.12, 1.35, trim, fx + out * 0.08, SWY + 2.42, dz, p);
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), GLASS); dg.position.set(fx + out * 0.12, SWY + 1.65, dz); dg.rotation.y = faceY(out); p.add(dg);
  cyl(0.04, 0.04, 0.04, std(0xd8b04a, { metalness: 0.8, roughness: 0.3 }), fx + out * 0.13, SWY + 1.15, dz + 0.4, p, 8);
  const span = [zc - w / 2 + 0.4, dz - 0.75, dz + 0.75, zc + w / 2 - 0.4];
  for (const [a, b] of [[span[0], span[1]], [span[2], span[3]]]) { const ww = b - a; if (ww < 0.8) continue; windowAt(p, fx, SWY + 1.85, (a + b) / 2, out, ww - 0.2, 2.0, { trim: o.trim ?? 0xf4f0e6, kind: o.kind || 'shop', mullion: false }); box(0.12, 0.62, ww, trim, fx + out * 0.06, SWY + 0.31, (a + b) / 2, p); }
  if (o.awning) awning(p, fx, zc, out, w * 0.92, SWY + 3.05, o.awning[0], o.awning[1]);
  signBoard(p, o.sign, fx + out * 0.12, SWY + 3.55, zc, out, Math.min(w * 0.8, o.signW || 7), 0.75, o.signStyle || {});
  if (o.floors === 2) { const n = Math.max(2, Math.floor(w / 2.6)); for (let k = 0; k < n; k++) windowAt(p, fx, 5.75, zc - w / 2 + (k + 0.5) * w / n, out, 1.05, 1.55, { trim: o.trim ?? 0xf4f0e6, kind: 'home', shutters: o.shutters ?? null, flowers: rnd() < 0.4 }); }
  // roof clutter
  box(1.4, 0.9, 1.0, std(0x9aa0aa), side * (FRONT + D * 0.6), H + 0.45, zc + w * 0.2, p);
  if (rnd() < 0.6) box(0.7, 1.6, 0.7, std(0x8a4a3a), side * (FRONT + D * 0.8), H + 0.8, zc - w * 0.25, p);
}

function lampPost(p, x, z) {
  const k = std(0x23262e, { metalness: 0.6, roughness: 0.4 });
  cyl(0.16, 0.2, 0.4, k, x, SWY + 0.2, z, p, 10); cyl(0.06, 0.07, 3.6, k, x, SWY + 2.2, z, p, 8);
  cyl(0.2, 0.12, 0.12, k, x, SWY + 4.05, z, p, 10);
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd890, emissiveIntensity: 0.6, roughness: 0.3 })); lan.position.set(x, SWY + 4.35, z); p.add(lan);
  cyl(0.24, 0.05, 0.18, k, x, SWY + 4.66, z, p, 8);
}
function bench(p, x, z, out) {
  const w = std(0x7a5232), k = std(0x23262e);
  box(0.45, 0.06, 1.6, w, x, SWY + 0.45, z, p); box(0.06, 0.4, 1.6, w, x - out * 0.22, SWY + 0.72, z, p);
  for (const s of [-1, 1]) box(0.45, 0.45, 0.06, k, x, SWY + 0.22, z + s * 0.7, p);
}
function hydrant(p, x, z) { const r = std(0xd83a32); cyl(0.13, 0.15, 0.55, r, x, SWY + 0.28, z, p, 10); const t = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), r); t.position.set(x, SWY + 0.55, z); p.add(t); box(0.36, 0.08, 0.08, r, x, SWY + 0.4, z, p); }
function trashCan(p, x, z) { const g = std(0x3a5a3a); cyl(0.26, 0.23, 0.85, g, x, SWY + 0.43, z, p, 12); cyl(0.28, 0.28, 0.06, std(0x2a3a2a), x, SWY + 0.88, z, p, 12); }
function mailbox(p, x, z) { const b = std(0x2f5aa8); box(0.45, 0.7, 0.45, b, x, SWY + 0.75, z, p); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.45, 12, 1, false, 0, Math.PI), b); t.rotation.z = Math.PI / 2; t.rotation.y = Math.PI / 2; t.position.set(x, SWY + 1.1, z); p.add(t); for (const s of [-1, 1]) for (const r of [-1, 1]) box(0.05, 0.4, 0.05, std(0x1c2a50), x + s * 0.18, SWY + 0.2, z + r * 0.18, p); }
function planter(p, x, z) { box(1.0, 0.45, 1.0, std(0x9a8a7a), x, SWY + 0.23, z, p); for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), std(k % 3 ? 0x4f8a3a : pick([0xe8434f, 0xf2c14e, 0xd85aa0]))); f.position.set(x + (rnd() - 0.5) * 0.6, SWY + 0.55 + rnd() * 0.15, z + (rnd() - 0.5) * 0.6); p.add(f); } }

/** utility pole with crossarm; returns the 3 wire attach points */
function pole(p, x, z, h = 8.5) {
  const wd = std(0x6a5040, { roughness: 1 });
  cyl(0.14, 0.17, h, wd, x, h / 2, z, p, 8); box(0.12, 0.12, 2.0, wd, x, h - 0.5, z, p);
  const pts = [];
  for (const s of [-0.85, 0, 0.85]) { cyl(0.05, 0.05, 0.16, std(0x7aa0b0), x, h - 0.36, z + s, p, 6); pts.push(new THREE.Vector3(x, h - 0.28, z + s)); }
  box(0.4, 0.55, 0.4, std(0x8a8a90), x + 0.25, h - 1.6, z, p); // transformer
  return pts;
}
function wire(p, a, b, sag = 0.5, m) {
  const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; const v = a.clone().lerp(b, u); v.y -= Math.sin(u * Math.PI) * sag; pts.push(v); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.018, 3, false);
  const w = new THREE.Mesh(g, m); p.add(w);
}

// ---------------------------------------------------------------- bigger landmarks
function townHall(p, zc) { // right side, set back with a plaza, columns, clock tower, flag
  const W = 18, D = 14, x0 = 12, H = 8;
  const stone = new THREE.MeshStandardMaterial({ map: brickTex('#d8cfc0', [W / 2.5, H / 1.2]), roughness: 0.85 }), wht = std(0xf4f0e6);
  box(D, H, W, stone, x0 + D / 2, H / 2, zc, p);
  box(4.1, 0.15, W + 4, std(0xcfc8bc), 10.05, 0.075, zc, p); // plaza level with the sidewalk, starts where it ends
  for (let k = 0; k < 3; k++) box(1.2 - k * 0.0, 0.18, 8, std(0xe0dbd2), x0 - 0.6 - k * 0.0 - (2 - k) * 0.4, 0.15 + 0.09 + k * 0.18, zc, p);
  box(1.6, 0.6, 9.5, wht, x0 - 0.4, 0.3 + 0.15, zc, p); // porch deck
  for (let k = 0; k < 4; k++) { cyl(0.28, 0.32, 5.4, wht, x0 - 0.9, 0.75 + 2.7, zc - 3.6 + k * 2.4, p, 16); box(0.8, 0.25, 0.8, wht, x0 - 0.9, 6.25, zc - 3.6 + k * 2.4, p); }
  box(2.0, 0.9, 10, wht, x0 - 0.5, 6.8, zc, p); // entablature
  signBoard(p, ['TOWN HALL'], x0 - 1.55, 6.8, zc, -1, 6, 0.7, { bg: '#f4f0e6', fg: '#2a3a5a', frame: 0xf4f0e6 });
  box(0.12, 2.6, 1.8, std(0x5a3a2a), x0 - 0.06, 0.75 + 1.3, zc, p); // double door
  for (const s of [-1, 1]) for (const f of [0, 1]) windowAt(p, x0, 2.4 + f * 3.4, zc + s * 6.2, -1, 1.3, 2.0, { trim: 0xf4f0e6, kind: 'home', shutters: 0x2f4a6a });
  box(0.7, 0.4, W + 0.4, wht, x0 - 0.1, H + 0.2, zc, p);
  // clock tower
  const tx = x0 + 4;
  box(4, 4.5, 4, wht, tx, H + 2.25, zc, p); box(4.4, 0.35, 4.4, std(0x2a3a5a), tx, H + 4.6, zc, p);
  box(3, 2.2, 3, wht, tx, H + 5.85, zc, p);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x4a7a6a, { metalness: 0.4, roughness: 0.4 })); dome.position.set(tx, H + 6.95, zc); p.add(dome);
  cyl(0.06, 0.06, 1.6, std(0xd8b04a, { metalness: 0.8 }), tx, H + 9.2, zc, p, 6);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.25, 32), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g) => { g.fillStyle = '#fbf6e8'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#2a3a5a'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#2a3a5a'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(128 + Math.sin(a) * 100 - 5, 128 - Math.cos(a) * 100 - 5, 10, 10); } g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 50); g.moveTo(128, 128); g.lineTo(180, 150); g.stroke(); }), roughness: 0.6 }));
  face.position.set(tx - 2.02, H + 2.4, zc); face.rotation.y = -Math.PI / 2; p.add(face);
  return { flag: new THREE.Vector3(9.4, 10.4, zc + 6.8), steps: new THREE.Vector3(x0 - 1.8, 0.69, zc), door: new THREE.Vector3(x0 - 0.2, 0.75, zc) };
}

function theater(p, zc) { // right side, marquee with bulbs
  store(p, 1, zc, 10, { floors: 2, wall: 'brick', color: '#8a3a4a', sign: ['STAR'], signStyle: { bg: '#2a1a2a', fg: '#ffd23e' }, signW: 3, kind: 'shop' });
  const mx = FRONT - 1.1, mz = zc;
  box(2.2, 1.3, 7.5, std(0x2a1a2a), mx, SWY + 3.6, mz, p);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 1.0), new THREE.MeshStandardMaterial({ map: textTex(['NOW SHOWING', 'KEVIN: THE PIGEON'], { w: 1024, h: 144, bg: '#fbf6e8', fg: '#2a1a2a', sizes: [44, 56] }), emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.6 }));
  t.position.set(mx - 1.12, SWY + 3.6, mz); t.rotation.y = -Math.PI / 2; p.add(t);
  const bulb = new THREE.SphereGeometry(0.06, 8, 6), bm = glow(0xffe08a, 1.6);
  for (let k = 0; k < 26; k++) for (const y of [SWY + 4.28, SWY + 2.92]) { const b = new THREE.Mesh(bulb, bm); b.position.set(mx - 1.12, y, mz - 3.65 + k * 0.29); p.add(b); }
}

function barn(p, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const W = 12, L = 16, H = 5.5, red = new THREE.MeshStandardMaterial({ map: sidingTex('#b8322a', [10, 6]), roughness: 0.85 }), wht = std(0xf4f0e6);
  box(W, H, L, red, 0, H / 2, 0, g);
  const s = new THREE.Shape(); s.moveTo(-W / 2 - 0.3, 0); s.lineTo(-W / 2 + 1.2, 2.6); s.lineTo(0, 4.2); s.lineTo(W / 2 - 1.2, 2.6); s.lineTo(W / 2 + 0.3, 0); s.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: L + 0.6, bevelEnabled: false }), std(0x5a5a62, { metalness: 0.4, roughness: 0.5 })); roof.position.set(0, H, -L / 2 - 0.3); roof.castShadow = true; g.add(roof);
  const gs = new THREE.Shape(); gs.moveTo(-W / 2, 0); gs.lineTo(-W / 2 + 1.35, 2.45); gs.lineTo(0, 4.0); gs.lineTo(W / 2 - 1.35, 2.45); gs.lineTo(W / 2, 0); gs.closePath();
  for (const e of [-1, 1]) { const gb = new THREE.Mesh(new THREE.ShapeGeometry(gs), red); gb.position.set(0, H, e * (L / 2 + 0.01)); if (e < 0) gb.rotation.y = Math.PI; g.add(gb); }
  // big door with white X, hay loft door, trim
  box(4.2, 4.2, 0.1, red, 0, 2.1, L / 2 + 0.06, g); for (const a of [0.78, -0.78]) { const b = box(0.22, 5.6, 0.06, wht, 0, 2.1, L / 2 + 0.13, g); b.rotation.z = a; }
  box(4.4, 0.22, 0.08, wht, 0, 4.25, L / 2 + 0.12, g); box(0.22, 4.4, 0.08, wht, -2.2, 2.1, L / 2 + 0.12, g); box(0.22, 4.4, 0.08, wht, 2.2, 2.1, L / 2 + 0.12, g);
  box(1.8, 1.6, 0.1, std(0x6a2a24), 0, H + 1.4, L / 2 + 0.06, g); box(2.0, 0.15, 0.1, wht, 0, H + 2.25, L / 2 + 0.1, g);
  for (const e of [-1, 1]) box(0.25, H, 0.25, wht, e * W / 2, H / 2, L / 2 + 0.05, g);
  // silos
  for (const [sx, sz, sh] of [[W / 2 + 3.2, -3, 14], [W / 2 + 3.2, 3.6, 11]]) { cyl(2.4, 2.4, sh, std(0xc8ccd4, { metalness: 0.5, roughness: 0.45 }), sx, sh / 2, sz, g, 24); for (let k = 1; k < sh / 1.6; k++) cyl(2.43, 2.43, 0.08, std(0x9aa0aa, { metalness: 0.5 }), sx, k * 1.6, sz, g, 24); const d = new THREE.Mesh(new THREE.SphereGeometry(2.45, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x9aa0aa, { metalness: 0.6, roughness: 0.35 })); d.position.set(sx, sh, sz); g.add(d); }
  // hay bales, fence paddock
  for (let k = 0; k < 6; k++) { const b = cyl(0.75, 0.75, 1.3, std(0xd8b45a, { roughness: 1 }), -W / 2 - 2.5 - (k % 3) * 1.6, 0.75 + Math.floor(k / 3) * 1.4, -4 + (k % 2) * 0.2, g, 16); b.rotation.z = Math.PI / 2; b.rotation.y = 0.2 * (k % 2); }
  return g;
}

function farmhouse(p, x, z, ry = 0, col = '#f4f0e6') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const W = 9, L = 8, H = 6;
  box(W, H, L, new THREE.MeshStandardMaterial({ map: sidingTex(col, [8, 6]), roughness: 0.8 }), 0, H / 2, 0, g);
  const s = new THREE.Shape(); s.moveTo(-L / 2 - 0.5, 0); s.lineTo(0, 3); s.lineTo(L / 2 + 0.5, 0); s.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: W + 0.8, bevelEnabled: false }), std(0x4a4a5a)); roof.rotation.y = Math.PI / 2; roof.position.set(-W / 2 - 0.4, H, 0); roof.castShadow = true; g.add(roof);
  const gs = new THREE.Shape(); gs.moveTo(-L / 2, 0); gs.lineTo(0, 2.8); gs.lineTo(L / 2, 0); gs.closePath();
  for (const e of [-1, 1]) { const gb = new THREE.Mesh(new THREE.ShapeGeometry(gs), std(col)); gb.position.set(e * (W / 2 + 0.01), H, 0); gb.rotation.y = e * Math.PI / 2; g.add(gb); }
  box(0.8, 2.4, 0.8, std(0x8a4a3a), 2.4, H + 1.6, 1.2, g);
  // porch
  box(W, 0.4, 2.4, std(0x9a8a7a), 0, 0.2, L / 2 + 1.2, g); for (let k = 0; k < 4; k++) box(0.18, 2.6, 0.18, std(0xf4f0e6), -W / 2 + 0.3 + k * (W - 0.6) / 3, 1.7, L / 2 + 2.25, g);
  box(W + 0.3, 0.15, 2.7, std(0x4a4a5a), 0, 3.05, L / 2 + 1.25, g);
  box(1.0, 2.2, 0.1, std(0x2f4a6a), 0, 1.5, L / 2 + 0.06, g);
  for (const wx of [-2.6, 2.6]) { const w = new THREE.Group(); w.position.set(wx, 0, L / 2); w.rotation.y = -Math.PI / 2; g.add(w); windowAt(w, 0, 1.9, 0, 1, 1.1, 1.4, { shutters: 0x2f4a6a }); const w2 = new THREE.Group(); w2.position.set(wx, 0, L / 2); w2.rotation.y = -Math.PI / 2; g.add(w2); windowAt(w2, 0, 4.4, 0, 1, 1.0, 1.3, { shutters: 0x2f4a6a, flowers: true }); }
  return { g, chimney: new THREE.Vector3(2.4, H + 2.9, 1.2).applyEuler(new THREE.Euler(0, ry, 0)).add(new THREE.Vector3(x, 0, z)) };
}

/** farm windmill pump: lattice tower, spinning fan, tail vane. Returns the fan for animation. */
function windmill(p, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  const m = std(0x9aa0aa, { metalness: 0.6, roughness: 0.4 }), H = 10;
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const l = box(0.12, H + 0.3, 0.12, m, a * 0.9, H / 2, b * 0.9, g); l.rotation.set(-b * 0.08, 0, a * 0.08); }
  for (let k = 1; k < 6; k++) { const s = 0.9 - k * 0.14; for (const r of [0, Math.PI / 2]) { const bb = box(2 * s, 0.06, 0.06, m, 0, k * 1.8, 0, g); bb.rotation.y = r; bb.position.x = r ? 0 : 0; const c = box(2 * s, 0.06, 0.06, m, 0, k * 1.8, 0, g); c.rotation.y = r; c.position.set(r ? s : 0, k * 1.8, r ? 0 : s); bb.position.set(r ? -s : 0, k * 1.8, r ? 0 : -s); } }
  const hub = new THREE.Group(); hub.position.set(0, H + 0.6, 0.5); g.add(hub);
  const fan = new THREE.Group(); hub.add(fan);
  for (let k = 0; k < 18; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.03), std(0xe8e4dc)); b.position.set(Math.sin(k / 18 * Math.PI * 2) * 1.2, Math.cos(k / 18 * Math.PI * 2) * 1.2, 0); b.rotation.z = -k / 18 * Math.PI * 2; b.rotation.y = 0.35; fan.add(b); }
  cyl(0.25, 0.25, 0.3, std(0x4a4a52), 0, 0, 0, fan, 12).rotation.x = Math.PI / 2;
  box(0.08, 0.08, 2.6, m, 0, H + 0.6, -1.0, g); box(0.04, 1.2, 1.4, std(0xc8343f), 0, H + 0.7, -2.2, g);
  cyl(1.6, 1.6, 1.2, std(0x8a8a90, { metalness: 0.5 }), 2.6, 0.6, 2.2, g, 20); // water tank
  return fan;
}

function waterTower(p, x, z) {
  const m = std(0x9aa8b8, { metalness: 0.5, roughness: 0.4 }), H = 18;
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; const l = cyl(0.22, 0.28, H, m, x + Math.cos(a) * 3.3, H / 2, z + Math.sin(a) * 3.3, p, 8); l.rotation.set(Math.sin(a) * 0.06, 0, -Math.cos(a) * 0.06); }
  for (const y of [6, 12]) { const r = new THREE.Mesh(new THREE.TorusGeometry(3.6 - y * 0.03, 0.07, 6, 24), m); r.rotation.x = Math.PI / 2; r.position.set(x, y, z); p.add(r); }
  const band = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#c8d4e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a4a7a'; g.font = '800 120px Poppins'; g.textAlign = 'center'; g.fillText('PIGEON CREEK', w * 0.25, 170); g.fillText('PIGEON CREEK', w * 0.75, 170); });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 6, 32), [new THREE.MeshStandardMaterial({ map: band, metalness: 0.3, roughness: 0.4 }), m, m]); tank.position.set(x, H + 3, z); tank.castShadow = true; p.add(tank);
  const top = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.2, 32), m); top.position.set(x, H + 7.1, z); p.add(top);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(4.6, 32, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m); bot.scale.y = 0.4; bot.position.set(x, H, z); p.add(bot);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.05, 4, 40), std(0x4a4a52)); rail.rotation.x = Math.PI / 2; rail.position.set(x, H + 1.2, z); p.add(rail);
}

/** lattice cell tower with antenna panels and a red beacon. setDown(k): k=0 working, k=1 knocked out (panels hang, beacon dead). */
export function cellTower(scene, x, z, H = 32) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const m = std(0xb8bec8, { metalness: 0.6, roughness: 0.35 });
  const leg = (a, r) => new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
  const R0 = 2.6, R1 = 0.7, A = [0, 2.094, 4.189];
  for (const a of A) { const b = leg(a, R0), t = leg(a, R1); t.y = H; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, b.distanceTo(t), 6), m); l.position.copy(b).lerp(t, 0.5); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t.clone().sub(b).normalize()); g.add(l); }
  const STEP = 2.6;
  for (let y = STEP; y < H; y += STEP) { const r = R0 + (R1 - R0) * (y / H), r2 = R0 + (R1 - R0) * ((y - STEP) / H); for (let i = 0; i < 3; i++) { const a = leg(A[i], r), b = leg(A[(i + 1) % 3], r); a.y = b.y = y; const c = leg(A[(i + 1) % 3], r2); c.y = y - STEP; for (const [p0, p1] of [[a, b], [a, c]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, p0.distanceTo(p1), 4), m); l.position.copy(p0).lerp(p1, 0.5); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(l); } } }
  box(4.2, 0.12, 4.2, m, 0, H - 2.5, 0, g);
  const top = new THREE.Group(); top.position.set(0, H - 2.2, 0); g.add(top);
  const panels = [];
  for (const a of A) { const arm = new THREE.Group(); arm.position.copy(leg(a + 1.047, 1.6)); arm.rotation.y = -a - 1.047 + Math.PI / 2; top.add(arm);
    for (const s of [-0.5, 0, 0.5]) { const pnl = new THREE.Group(); pnl.position.set(s, 1.4, 0); arm.add(pnl); box(0.32, 1.9, 0.14, std(0xf2f2f4), 0, -0.95, 0, pnl); panels.push(pnl); } box(1.6, 0.08, 0.08, m, 0, 1.4, 0, arm); }
  const beaconM = glow(0xff2a2a, 2.4); const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), beaconM); beacon.position.y = H + 0.4; g.add(beacon);
  cyl(0.05, 0.05, 1.2, m, 0, H - 0.1, 0, g, 6);
  const bl = new THREE.PointLight(0xff2a2a, 0, 14, 1.6); bl.position.y = H + 0.4; g.add(bl);
  box(3.2, 2.4, 2.4, std(0xd8d4cc), 3.4, 1.2, 0, g); // equipment shed
  cyl(0.05, 0.05, 2.4, std(0x5a5a62), -3.2, 1.2, 1.2, g, 4); box(5.6, 1.8, 0.03, new THREE.MeshStandardMaterial({ color: 0x8a8a90, wireframe: true }), 0, 0.9, 3.4, g); // fence
  const zap = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 0.35), glow(0xfff2a0, 3), 40); zap.visible = false; g.add(zap);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  return {
    g, top: new THREE.Vector3(x, H + 0.4, z),
    update(t, down, sparks = 0) {
      const blink = Math.floor(t * 1.2) % 2 === 0;
      beaconM.emissiveIntensity = down > 0.5 ? 0.05 : blink ? 2.4 : 0.4; bl.intensity = down > 0.5 ? 0 : blink ? 6 : 0;
      panels.forEach((pn, i) => { pn.rotation.x = down * (0.6 + (i % 3) * 0.5) * (i % 2 ? 1 : -1); pn.rotation.z = down * 0.4 * ((i % 4) - 1.5); });
      top.rotation.z = down * 0.12;
      zap.visible = sparks > 0;
      if (sparks > 0) { for (let i = 0; i < 40; i++) { const a = i * 2.4, u = (sparks * 1.8 + i * 0.137) % 1; V.set(Math.cos(a) * u * 3, H - 2 + Math.sin(i) * 0.6 - u * u * 4, Math.sin(a) * u * 3); q.setFromEuler(new THREE.Euler(i, a, 0)); m4.compose(V, q, S.setScalar(1 - u)); zap.setMatrixAt(i, m4); } zap.instanceMatrix.needsUpdate = true; }
    },
  };
}

/** instanced corn stalks over a field; they sway with TIME/WIND */
function cornField(scene, x0, x1, z0, z1, rowGap = 0.95, step = 0.62) {
  [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)]; [z0, z1] = [Math.min(z0, z1), Math.max(z0, z1)];
  const parts = [];
  const stem = new THREE.BoxGeometry(0.05, 2.1, 0.05); stem.translate(0, 1.05, 0); parts.push(stem);
  for (let k = 0; k < 4; k++) { const l = new THREE.PlaneGeometry(0.75, 0.14); l.translate(0.38, 0, 0); l.rotateZ(-0.35 - (k % 2) * 0.25); l.rotateY(k * 1.7); l.translate(0, 0.6 + k * 0.32, 0); parts.push(l); }
  const tas = new THREE.ConeGeometry(0.08, 0.35, 4); tas.translate(0, 2.25, 0); parts.push(tas);
  const ear = new THREE.CylinderGeometry(0.045, 0.035, 0.24, 5); ear.rotateZ(0.4); ear.translate(0.07, 1.15, 0); parts.push(ear);
  const cols = parts.map((g) => (g === tas ? [0.85, 0.72, 0.38] : g === ear ? [0.93, 0.82, 0.45] : [0.36, 0.56, 0.22]));
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const geo = mergeAll(flat);
  const colorAttr = []; flat.forEach((g, i) => { for (let v = 0; v < g.attributes.position.count; v++) colorAttr.push(...cols[i]); });
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colorAttr, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => { sh.uniforms.uTime = TIME; sh.uniforms.uWind = WIND; sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float ph = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.17; float sw = sin(uTime * 2.1 + ph) * 0.6 + sin(uTime * 3.7 + ph * 1.7) * 0.4; transformed.x += sw * uWind * position.y * position.y * 0.05; transformed.z += cos(uTime * 1.6 + ph) * uWind * position.y * 0.03;'); };
  const n = Math.floor((x1 - x0) / rowGap) * Math.floor((z1 - z0) / step);
  const inst = new THREE.InstancedMesh(geo, mat, n); inst.castShadow = true; inst.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(); let i = 0;
  for (let x = x0 + rowGap / 2; x < x1 && i < n; x += rowGap) for (let z = z0 + step / 2; z < z1 && i < n; z += step) { V.set(x + (rnd() - 0.5) * 0.2, 0, z + (rnd() - 0.5) * 0.2); q.setFromEuler(new THREE.Euler(0, rnd() * 6.28, (rnd() - 0.5) * 0.08)); const s = 0.85 + rnd() * 0.3; S.set(s, s, s); m4.compose(V, q, S); inst.setMatrixAt(i++, m4); }
  inst.count = i; scene.add(inst);
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: soilTex(), roughness: 1 })); soil.material.map.repeat.set((x1 - x0) / 7.6, (z1 - z0) / 7.6); soil.rotation.x = -Math.PI / 2; soil.position.set((x0 + x1) / 2, 0.01, (z0 + z1) / 2); soil.receiveShadow = true; scene.add(soil);
  return inst;
}
function mergeAll(gs) { // tiny merge (non-indexed) so this file does not need BufferGeometryUtils
  const pos = [], nor = [], uv = [];
  for (const g of gs) { pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return out;
}
/** distant fields: a low block of corn seen from far away */
function farCorn(p, x0, x1, z0, z1) {
  [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)]; [z0, z1] = [Math.min(z0, z1), Math.max(z0, z1)];
  const t = cornTopTex(); t.repeat.set((x1 - x0) / 8, (z1 - z0) / 8);
  const side = canvasTex(128, 64, (g) => { g.fillStyle = '#3d6a2a'; g.fillRect(0, 0, 128, 64); for (let i = 0; i < 60; i++) { g.fillStyle = rnd() < 0.5 ? '#5b8a3a' : '#2f5a22'; g.fillRect(rnd() * 128, rnd() * 64, 3, 14); } g.fillStyle = 'rgba(230,200,110,.8)'; for (let i = 0; i < 30; i++) g.fillRect(rnd() * 128, rnd() * 6, 3, 4); }, [(x1 - x0) / 4, 1]);
  const ms = new THREE.MeshStandardMaterial({ map: side, roughness: 0.9 }), mt = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 2.2, z1 - z0), [ms, ms, mt, mt, ms, ms]); b.position.set((x0 + x1) / 2, 1.1, (z0 + z1) / 2); b.receiveShadow = true; p.add(b);
}

// ---------------------------------------------------------------- the whole place
/**
 * builds Pigeon Creek. Returns anchors + animated parts:
 * { fan, towers: [cellTower...], chimneys, sign (entrance sign group, its two faces), hall (town hall anchors), grocery }
 */
export function buildFarm(scene) {
  const tmp = new THREE.Group();
  // ground, roads, sidewalks
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const RL = 420, rd = new THREE.Mesh(new THREE.PlaneGeometry(ROAD * 2, RL), new THREE.MeshStandardMaterial({ map: asphaltTex(RL), roughness: 0.85 })); rd.rotation.x = -Math.PI / 2; rd.position.set(0, 0.02, -60); rd.receiveShadow = true; scene.add(rd);
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(260, 8), new THREE.MeshStandardMaterial({ color: 0xb89a6a, roughness: 1 })); cross.rotation.x = -Math.PI / 2; cross.position.set(0, 0.015, -84); scene.add(cross); // gravel farm lane
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(3, SWY, 80), new THREE.MeshStandardMaterial({ map: concreteTex(80), roughness: 0.9 })); sw.position.set(s * (ROAD + 1.5), SWY / 2, -31); sw.receiveShadow = true; scene.add(sw);
    box(0.18, SWY + 0.02, 80, std(0xb8b2a6), s * (ROAD + 0.09), SWY / 2 + 0.01, -31, tmp);
  }
  // ---- main street stores (left side faces +x, right side faces -x)
  const L = -1, R = 1;
  store(tmp, L, 3.5, 9, { floors: 1, wall: 'siding', color: '#e8d2a8', trim: 0xc8343f, sign: ['DINER'], signStyle: { bg: '#c8343f', fg: '#fff6e0' }, awning: ['#c8343f', '#fff6e0'], signW: 4, door: 0xc8343f });
  store(tmp, L, -7, 10, { floors: 2, wall: 'brick', color: '#a8553a', sign: ['HARDWARE'], signStyle: { bg: '#2a3a2a', fg: '#f2c14e' }, awning: ['#2f6a3a', '#e8e0c8'], shutters: 0x2f4a3a });
  store(tmp, L, -23, 18, { floors: 2, wall: 'brick', color: '#b86a48', sign: ['GROCERY'], signStyle: { bg: '#fbf6e8', fg: '#2f7a3a', border: '#2f7a3a', sizes: [150] }, signW: 9, awning: ['#2f7a3a', '#fbf6e8'], doorAt: 0.0, kind: 'shop' });
  store(tmp, L, -38, 9.5, { floors: 1, wall: 'siding', color: '#c9d8e8', trim: 0x2a4a7a, sign: ['POST OFFICE'], signStyle: { bg: '#2a4a7a', fg: '#ffffff' }, signW: 6, door: 0x2a4a7a });
  store(tmp, L, -48.5, 8, { floors: 2, wall: 'siding', color: '#e8c8d0', sign: ['BARBER'], signStyle: { bg: '#ffffff', fg: '#c8343f' }, awning: ['#c8343f', '#ffffff'], shutters: 0x8a3a4a });
  store(tmp, L, -59, 10.5, { floors: 2, wall: 'brick', color: '#8a8a7a', sign: ['BANK'], signStyle: { bg: '#2a2a3a', fg: '#e8d090' }, signW: 4, door: 0x2a2a3a });
  store(tmp, L, -69, 8, { floors: 1, wall: 'siding', color: '#f2e4b8', sign: ['BAKERY'], signStyle: { bg: '#fff6e0', fg: '#a8553a' }, awning: ['#e88a3a', '#fff6e0'], signW: 4 });
  store(tmp, R, 3, 10, { floors: 1, wall: 'siding', color: '#c8b48a', trim: 0x6a4a2a, sign: ['FEED & SEED'], signStyle: { bg: '#6a4a2a', fg: '#f2e4b8' }, signW: 6, door: 0x6a4a2a });
  store(tmp, R, -8.5, 10, { floors: 2, wall: 'brick', color: '#9a4a3a', sign: ['LIBRARY'], signStyle: { bg: '#f4f0e6', fg: '#2a3a5a' }, signW: 5, shutters: 0x2a3a5a });
  const hall = townHall(tmp, -25);
  store(tmp, R, -41.5, 8, { floors: 2, wall: 'siding', color: '#d8e8c8', sign: ['CAFE'], signStyle: { bg: '#3a5a3a', fg: '#fff6e0' }, awning: ['#3a5a3a', '#f4f0e6'], signW: 3.5, shutters: 0x3a5a3a });
  theater(tmp, -52);
  store(tmp, R, -62.5, 9, { floors: 1, wall: 'brick', color: '#b86a48', sign: ['TOYS & GAMES'], signStyle: { bg: '#f2c14e', fg: '#2a3a8a' }, awning: ['#2a3a8a', '#f2c14e'], signW: 6 });
  // alleys get back walls so you never see into nothing
  for (const s of [L, R]) box(0.3, 4, 90, std(0x8a7a6a), s * (FRONT + 11.2), 2, -31, tmp);
  // street furniture
  for (let z = 6; z > -72; z -= 13) for (const s of [L, R]) { if (s === R && z < -16 && z > -36) continue; lampPost(tmp, s * (ROAD + 0.6), z); }
  for (const [s, z] of [[L, -2], [L, -31], [R, -14], [R, -46], [L, -54]]) bench(tmp, s * (FRONT - 0.5), z, -s);
  for (const [s, z] of [[L, -12.5], [R, -38], [L, -64]]) hydrant(tmp, s * (ROAD + 0.5), z);
  for (const [s, z] of [[L, 0], [R, -11.5], [L, -44], [R, -66]]) trashCan(tmp, s * (ROAD + 0.55), z);
  mailbox(tmp, L * (ROAD + 0.6), -35.5);
  for (const [s, z] of [[L, -9], [L, -17.5], [L, -50], [R, -3], [R, -45]]) planter(tmp, s * (FRONT - 0.65), z);
  // power poles along the east verge outside town, and along the farm lane
  const wm = std(0x1c1c20); let prev = null;
  for (let z = 120; z > -200; z -= 30) { if (z < 12 && z > -78) { prev = null; continue; } const pts = pole(tmp, 9.5, z); if (prev) for (let k = 0; k < 3; k++) wire(tmp, prev[k], pts[k], 0.6, wm); prev = pts; }
  prev = null; for (let x = 15; x < 120; x += 30) { const pts = pole(tmp, x, -88.5); if (prev) for (let k = 0; k < 3; k++) wire(tmp, prev[k], pts[k], 0.5, wm); prev = pts; }
  // ---- countryside
  const b = barn(tmp, -34, -112, 0.3);
  const fh = farmhouse(tmp, -58, -98, 0.6), fh2 = farmhouse(tmp, 46, 30, -Math.PI / 2 + 0.2, '#e8d8b0'), fh3 = farmhouse(tmp, -42, 44, Math.PI / 2 - 0.3, '#d8e4ec');
  const fan = windmill(tmp, -14, -96);
  waterTower(tmp, -24, -30);
  // houses behind the shops along two side streets (seen over/between roofs and from the air)
  for (let z = -6; z > -70; z -= 16) for (const s of [L, R]) { if (s === R && z > -40 && z < -10) continue; const h = farmhouse(tmp, s * 34, z, s > 0 ? -Math.PI / 2 : Math.PI / 2, pick(['#f4f0e6', '#e8d8b0', '#d8e4ec', '#e8c8c0', '#d8e8c8'])); h.g.scale.setScalar(0.85); }
  // fences along the road outside town
  const fw = std(0xf4f0e6); for (const s of [L, R]) for (let z = 14; z < 110; z += 2.5) { box(0.1, 1.0, 0.1, fw, s * 10.5, 0.5, z, tmp); box(0.05, 0.1, 2.5, fw, s * 10.5, 0.85, z + 1.25, tmp); box(0.05, 0.1, 2.5, fw, s * 10.5, 0.45, z + 1.25, tmp); }
  // entrance sign (south end, faces arriving traffic and our camera at +z)
  const SIGN = new THREE.Group(); SIGN.position.set(7.6, 0, 24); SIGN.rotation.y = -0.35; scene.add(SIGN);
  for (const s of [-1, 1]) box(0.25, 3.2, 0.25, std(0x6a4a2a), s * 2.4, 1.6, 0, SIGN);
  box(5.6, 2.4, 0.18, std(0x6a4a2a), 0, 2.2, -0.02, SIGN);
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 2.15), new THREE.MeshStandardMaterial({ roughness: 0.7 })); signFace.position.set(0, 2.2, 0.08); SIGN.add(signFace);
  for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), std(k % 2 ? 0xe8434f : 0xf2c14e)); f.position.set(-2.4 + k * 0.95, 0.2, 0.4); SIGN.add(f); }
  // hills on the horizon, tree lines, far fields
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = 300 + rnd() * 60; const hl = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), std(pick([0x5f9a48, 0x6fa64a, 0x7aa858]), { flatShading: true })); hl.scale.set(70 + rnd() * 50, 25 + rnd() * 25, 60 + rnd() * 40); hl.position.set(Math.cos(a) * r, -8, Math.sin(a) * r - 40); scene.add(hl); }
  farCorn(tmp, 48, 110, -92, -180); farCorn(tmp, 12, 44, -124, -180); farCorn(tmp, -100, -66, -92, -150); farCorn(tmp, -100, -50, 60, 140); farCorn(tmp, 60, 130, 50, 140); farCorn(tmp, 52, 110, -10, -80);
  const baked = bake(tmp); scene.add(baked);
  // instanced near fields (sway in the wind)
  cornField(scene, 11.5, 40, 16, 60); cornField(scene, -40, -11.5, 16, 60); cornField(scene, 12, 44, -92, -120, 1.0, 0.7);
  const towers = [cellTower(scene, 44, -36), cellTower(scene, -72, 46, 28)];
  return { fan, towers, sign: { g: SIGN, face: signFace }, hall, chimneys: [fh.chimney, fh2.chimney, fh3.chimney], barn: b };
}

/** trees from the CC0 library (Kenney/Quaternius) - call after buildFarm, async */
export async function plantTrees(scene, prop) {
  const spots = [];
  for (let z = 16; z < 120; z += 14) spots.push(['tree_oak', -8.4, z + rnd() * 3, 6 + rnd() * 2]);
  const FIELDS = [[11, 44, 14, 62], [-42, -11, 14, 62], [11, 112, -90, -182], [-102, -64, -90, -152], [-102, -48, 58, 142], [58, 132, 48, 142], [50, 112, -8, -82], [-22, 22, -78, 12], [20, 50, -80, 12], [-50, -20, -80, 12]];
  for (let k = 0; k < 60; k++) { const a = rnd() * 6.28, r = 60 + rnd() * 120; const x = Math.cos(a) * r, z = Math.sin(a) * r - 40; if (Math.abs(x) < 20 || FIELDS.some((f) => x > f[0] && x < f[1] && z < Math.max(f[2], f[3]) && z > Math.min(f[2], f[3]))) continue; spots.push([pick(['tree_oak', 'tree_autumn', 'tree_fat', 'tree_pine']), x, z, 6 + rnd() * 4]); }
  for (const [x, z] of [[-48, -100], [-62, -88], [-30, -96], [52, 22], [40, 40], [-36, 52], [-50, 36]]) spots.push([pick(['tree_oak', 'tree_fat', 'tree_autumn']), x, z, 7 + rnd() * 2]);
  for (const [s, z] of [[1, -36], [-1, -64.5], [1, -67]]) spots.push(['tree_autumn', s * (ROAD + 1.0), z, 5]);
  const out = [];
  for (const [m, x, z, h] of spots) { const t = await prop(scene, m, h, { by: 'height' }); t.position.set(x, Math.abs(x) < FRONT && Math.abs(x) > ROAD && z < 8 && z > -70 ? SWY : 0, z); t.rotation.y = rnd() * 6.28; out.push(t); }
  return out;
}

// ---------------------------------------------------------------- storm: rain around the camera, lightning bolts, clouds
export function storm(scene) {
  const N = 2600;
  const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.55, 0.012), new THREE.MeshBasicMaterial({ color: 0xc8d4e8, transparent: true, opacity: 0.55 }), N); rain.frustumCulled = false; rain.visible = false; scene.add(rain);
  const seeds = Array.from({ length: N }, () => [rnd(), rnd(), rnd()]);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.18)), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  const boltM = new THREE.MeshBasicMaterial({ color: 0xf2f4ff }); const bolt = new THREE.Group(); bolt.visible = false; scene.add(bolt);
  const cloudM = new THREE.MeshStandardMaterial({ color: 0x4a5266, roughness: 1, flatShading: true });
  const clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), cloudM, 90); clouds.visible = false; scene.add(clouds);
  for (let i = 0; i < 90; i++) { V.set((rnd() - 0.5) * 340, 62 + rnd() * 18, -60 + (rnd() - 0.5) * 340); const s = 14 + rnd() * 18; S.set(s * 1.6, s * 0.55, s); m4.compose(V, new THREE.Quaternion(), S); clouds.setMatrixAt(i, m4); }
  S.set(1, 1, 1);
  return {
    clouds,
    rain(t, cam, k = 1) { // k = how hard it rains (0..1)
      rain.visible = k > 0; if (!k) return; const n = Math.floor(N * k); rain.count = n;
      for (let i = 0; i < n; i++) { const [a, b, c] = seeds[i]; const y = 18 - ((t * 16 + c * 30) % 30); V.set(cam.x + (a - 0.5) * 34, cam.y + y - 6, cam.z + (b - 0.5) * 34); m4.compose(V, q, S); rain.setMatrixAt(i, m4); }
      rain.instanceMatrix.needsUpdate = true;
    },
    bolt(from, to, on, sd = 1) { // jagged bolt between two points
      bolt.visible = on; if (!on) return;
      while (bolt.children.length) bolt.remove(bolt.children[0]);
      let s = sd * 977; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      let a = from.clone(); const n = 14;
      for (let k = 1; k <= n; k++) { const b = from.clone().lerp(to, k / n); if (k < n) b.add(new THREE.Vector3((r() - 0.5) * 6, 0, (r() - 0.5) * 6)); const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, a.distanceTo(b), 4), boltM); seg.position.copy(a).lerp(b, 0.5); seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); bolt.add(seg); a = b; }
    },
    hide() { rain.visible = false; bolt.visible = false; clouds.visible = false; },
  };
}

// ---------------------------------------------------------------- props for the cast
/** Kevin the pigeon, blocky style, ~0.34 m long. tired: 0..1 droopy eyelids. flap(t) animates the wings. */
export function pigeon(parent) {
  const g = new THREE.Group(); parent.add(g);
  const grey = std(0x8a90a0), dark = std(0x5a6070), neck = std(0x5a8a7a, { metalness: 0.5, roughness: 0.3 }), org = std(0xe8843a);
  const body = new THREE.Group(); body.position.y = 0.11; g.add(body);
  box(0.16, 0.15, 0.28, grey, 0, 0.06, 0, body, 0.04);
  box(0.165, 0.07, 0.12, neck, 0, 0.12, 0.1, body, 0.02);
  box(0.12, 0.04, 0.14, dark, 0, 0.06, -0.19, body); // tail
  const head = new THREE.Group(); head.position.set(0, 0.2, 0.13); body.add(head);
  box(0.11, 0.11, 0.11, std(0x7a8090), 0, 0, 0, head, 0.025);
  box(0.03, 0.025, 0.06, std(0xe8c8a0), 0, -0.015, 0.075, head);
  const lids = [];
  for (const s of [-1, 1]) {
    box(0.012, 0.04, 0.04, std(0xf4f4f4), s * 0.056, 0.012, 0.02, head);
    box(0.014, 0.022, 0.022, std(0xe86a2a), s * 0.058, 0.01, 0.024, head);
    box(0.016, 0.01, 0.01, std(0x111111), s * 0.06, 0.01, 0.026, head);
    const lid = new THREE.Group(); lid.position.set(s * 0.058, 0.032, 0.02); head.add(lid); box(0.018, 0.04, 0.046, std(0x6a7080), 0, -0.02, 0, lid); lids.push(lid);
  }
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.08, 0.1, 0.03); body.add(w); box(0.02, 0.1, 0.24, dark, s * 0.01, -0.04, -0.06, w); box(0.022, 0.03, 0.18, std(0x3a3f4a), s * 0.012, -0.08, -0.08, w); wings.push(w); }
  for (const s of [-1, 1]) { box(0.015, 0.09, 0.015, org, s * 0.04, 0.045, 0, g); box(0.04, 0.01, 0.05, org, s * 0.04, 0.005, 0.015, g); }
  const note = new THREE.Group(); note.position.set(0.04, 0.05, 0); g.add(note); note.visible = false;
  { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 8), std(0xfbf6e8)); n.rotation.z = Math.PI / 2; note.add(n); box(0.012, 0.04, 0.012, std(0xc8343f), 0, 0, 0, note); }
  return {
    g, head, body, wings, note,
    set(tired = 0) { lids.forEach((l) => { l.scale.y = 0.15 + tired * 0.85; l.position.y = 0.032 - (1 - tired) * 0.0; }); },
    flap(t, k = 1) { const a = Math.sin(t * 28) * 1.1 * k; wings[0].rotation.z = -0.15 - a; wings[1].rotation.z = 0.15 + a; },
    fold() { wings[0].rotation.z = 0; wings[1].rotation.z = 0; },
  };
}
export function walkie(parent) {
  const g = new THREE.Group(); parent.add(g);
  box(0.07, 0.15, 0.035, std(0x2a2a30), 0, 0, 0, g, 0.01); box(0.072, 0.05, 0.037, std(0xf2c14e), 0, -0.04, 0, g, 0.008);
  cyl(0.006, 0.008, 0.12, std(0x111111), 0.022, 0.13, 0, g, 6);
  for (let k = 0; k < 4; k++) box(0.045, 0.004, 0.004, std(0x55555c), 0, 0.045 - k * 0.012, 0.019, g);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), glow(0x3eff8b, 2)); led.position.set(-0.022, 0.065, 0.018); g.add(led);
  return g;
}
const MAP_TEX = () => canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = '#f4ead2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#cfe0a8'; for (let i = 0; i < 9; i++) g.fillRect(20 + (i % 3) * 165, 20 + Math.floor(i / 3) * 120, 140, 95);
  g.strokeStyle = '#e8b45a'; g.lineWidth = 14; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * 0.62); g.lineTo(w, h * 0.62); g.stroke();
  g.strokeStyle = '#7ab0d8'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(150, 140, 300, 20, w, 110); g.stroke();
  g.fillStyle = '#c8343f'; g.beginPath(); g.arc(w * 0.7, h * 0.3, 12, 0, 7); g.fill(); g.strokeStyle = '#c8343f'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(w * 0.3, h * 0.85); g.lineTo(w / 2, h * 0.62); g.lineTo(w * 0.7, h * 0.3); g.stroke();
  g.fillStyle = '#5a4a3a'; g.font = '700 26px Poppins'; g.fillText('PIGEON CREEK', 24, h - 18); g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; g.setLineDash([]); g.beginPath(); g.moveTo(w / 3, 0); g.lineTo(w / 3, h); g.moveTo(w * 2 / 3, 0); g.lineTo(w * 2 / 3, h); g.stroke();
});
export function paperMap(parent, w = 0.6, h = 0.45) {
  const g = new THREE.Group(); parent.add(g); const tex = MAP_TEX(); const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const half = new THREE.Mesh(new THREE.PlaneGeometry(w / 2, h), m.clone()); half.material.map = tex.clone(); half.material.map.needsUpdate = true; half.material.map.repeat.set(0.5, 1); half.material.map.offset.set(s > 0 ? 0.5 : 0, 0); half.position.set(s * w / 4 * Math.cos(0.15), 0, -Math.sin(0.15) * w / 4); half.rotation.y = -s * 0.15; g.add(half); }
  return g;
}
