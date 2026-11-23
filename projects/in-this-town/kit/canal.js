// Canal city for episode 10 ("broken promises steal your colors"), built in metres.
// A straight canal along z with brightly painted narrow houses on both quays, arched bridges, boats, laundry lines,
// flower boxes, lamps, a school, a bakery, an unfinished "new bridge", the old gray stone bridge with an underpass,
// and a clock tower at the canal's end. Plus two interiors: the top of the clock tower (bell, rope, gears, the back of
// the clock face) and the family dining room.
// Colour drain: every painted material is registered with a category and a z position; drain(fn) sets how gray each
// one is (fn(cat, z) -> 0..1), so colour can leave the city street by street.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTex } from './core.js';

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });

// ---------------------------------------------------------------- colour drain registry
const PAINT = [];
const GRAY = new THREE.Color();
export function paint(m, cat, z = 0) { m.userData.c0 = m.color.clone(); if (m.emissive) m.userData.e0 = m.emissive.clone(); PAINT.push({ m, cat, z }); return m; }
function grayOf(c) { const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; const v = 0.18 + l * 0.62; return GRAY.setRGB(v * 0.97, v * 0.98, v * 1.04); }
export function grayMat(m, k) { if (!m.userData.c0) { m.userData.c0 = m.color.clone(); if (m.emissive) m.userData.e0 = m.emissive.clone(); } m.color.copy(m.userData.c0).lerp(grayOf(m.userData.c0), k); if (m.userData.e0) m.emissive.copy(m.userData.e0).lerp(grayOf(m.userData.e0).multiplyScalar(0.3), k); }
export function drain(fn) { for (const p of PAINT) grayMat(p.m, fn(p.cat, p.z)); }

/** every material in an object tree, minus `skip` (a Set) -> set(k) grays them; keep stays as is */
export function grayable(root, skip = new Set()) {
  const ms = []; root.traverse((o) => { if (o.isMesh || o.isSprite) for (const m of [].concat(o.material)) if (m && m.color && !skip.has(m) && !ms.includes(m)) ms.push(m); });
  return { ms, set(k) { for (const m of ms) grayMat(m, k); }, fade(a) { for (const m of ms) { m.transparent = a < 1 || m.userData.wasT; m.opacity = a * (m.userData.op0 ?? (m.userData.op0 = m.opacity)); m.depthWrite = a > 0.6; } } };
}

// ---------------------------------------------------------------- merged builders (few draw calls per house)
class Bucket {
  constructor() { this.map = new Map(); }
  add(geo, m, x, y, z, ry = 0, rx = 0) { const g = geo.clone(); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y, z); if (!this.map.has(m)) this.map.set(m, []); this.map.get(m).push(g); return g; }
  box(w, h, d, m, x, y, z, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), m, x, y, z, ry); }
  build(parent) { const out = []; for (const [m, gs] of this.map) { const ng = gs.map((g) => (g.index ? g.toNonIndexed() : g)); ng.forEach((g) => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); }); const mesh = new THREE.Mesh(mergeGeometries(ng), m); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); out.push(mesh); } this.map.clear(); return out; }
}
const gableGeo = (span, h, depth) => { const s = new THREE.Shape(); s.moveTo(-span / 2 - 0.25, 0); s.lineTo(span / 2 + 0.25, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };

const WALLS = [0xff5d73, 0xffc94a, 0x4aa8ff, 0x52c98a, 0xff8a3d, 0xb07cff, 0x2ec4c4, 0xff6fb5, 0xf2e14a, 0x3d7bff, 0xe8463c, 0x8ad14a];
const SHUT = [0x2a8a5a, 0x1d5fa8, 0xffffff, 0x8a2a3a, 0x2a2a6a, 0xf2c14e];
const ROOF = [0xb8553a, 0xa84a32, 0x8a4a3a, 0xc8683a];

function signTex(text, bg = '#ffffff', fg = '#1b1b24', w = 512, h = 128, size = 64) { return canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = fg; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = fg; c.font = `800 ${size}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4); }); }

/** one painted canal house. side -1: on the -x quay, facade faces +x. Returns its door / window mats for draining. */
function house(g, side, z, w, floors, opts = {}) {
  const X0 = side * 7.2; const depth = 7, H = floors * 3.1 + 0.6;
  const col = opts.col ?? pick(WALLS), shut = pick(SHUT);
  const wallM = paint(std(col, { roughness: 0.85 }), 'wall', z), trimM = paint(std(0xffffff), 'trim', z), shutM = paint(std(shut), 'window', z), glassM = paint(std(0x9ac8e8, { roughness: 0.15, metalness: 0.3, emissive: 0xffd08a, emissiveIntensity: 0 }), 'glass', z);
  const doorM = paint(std(pick([0x1d5fa8, 0x2a8a5a, 0x8a2a3a, 0xf2c14e, 0x6a3a8a])), 'door', z), roofM = paint(std(pick(ROOF), { roughness: 0.6 }), 'roof', z), potM = paint(std(0xc8683a), 'trim', z), flowerM = paint(std(pick([0xff3d6e, 0xffd23d, 0xff6a2a, 0xd23dff])), 'flower', z);
  const B = new Bucket(); const fx = X0 + side * 0.0; // facade plane x
  const out = side; // wall extends away from canal
  B.box(depth, H, w, wallM, X0 + out * depth / 2, H / 2, z);
  B.box(0.18, 0.5, w + 0.1, trimM, fx - side * 0.05, 0.25, z); // plinth
  B.box(0.3, 0.25, w + 0.2, trimM, fx - side * 0.1, H - 0.1, z); // cornice
  // roof: gable along x (ridge perpendicular to canal) with eaves
  const rg = gableGeo(w, 2.2, depth + 0.6); rg.rotateY(Math.PI / 2); B.add(rg, roofM, X0 + out * depth / 2, H, z);
  B.box(0.6, 1.4, 0.6, wallM, X0 + out * (depth * 0.7), H + 1.3, z + w * 0.25); B.box(0.75, 0.15, 0.75, trimM, X0 + out * (depth * 0.7), H + 2.05, z + w * 0.25);
  // door on the ground floor
  const dz = z + (rnd() - 0.5) * (w - 2.2) * 0.6;
  B.box(0.12, 2.3, 1.15, trimM, fx - side * 0.02, 1.15, dz); B.box(0.1, 2.1, 0.95, doorM, fx - side * 0.07, 1.05 + 0.02, dz); B.box(0.16, 0.12, 0.12, trimM, fx - side * 0.14, 1.05, dz + 0.3);
  // windows: real frames, glass, shutters, sills with flower boxes
  const cols = w > 4.6 ? 2 : 1;
  for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
    const wz = z + (cols === 1 ? 0 : (k - 0.5) * w * 0.48), y = 1.5 + f * 3.1 + (f === 0 ? 0.2 : 0.4);
    if (f === 0 && Math.abs(wz - dz) < 1.4) continue;
    B.box(0.1, 1.5, 0.95, glassM, fx - side * 0.02, y, wz); // glass, set back
    B.box(0.16, 0.1, 1.15, trimM, fx - side * 0.07, y + 0.8, wz); B.box(0.16, 0.1, 1.15, trimM, fx - side * 0.07, y - 0.8, wz); B.box(0.16, 1.6, 0.1, trimM, fx - side * 0.07, y, wz - 0.53); B.box(0.16, 1.6, 0.1, trimM, fx - side * 0.07, y, wz + 0.53); B.box(0.14, 1.5, 0.06, trimM, fx - side * 0.07, y, wz);
    B.box(0.08, 1.6, 0.5, shutM, fx - side * 0.12, y, wz - 0.85); B.box(0.08, 1.6, 0.5, shutM, fx - side * 0.12, y, wz + 0.85);
    B.box(0.32, 0.08, 1.25, trimM, fx - side * 0.18, y - 0.88, wz);
    if (f > 0 && rnd() < 0.7) { B.box(0.28, 0.25, 1.0, potM, fx - side * 0.3, y - 0.72, wz); for (let p = 0; p < 5; p++) B.add(new THREE.IcosahedronGeometry(0.12, 0), flowerM, fx - side * 0.32, y - 0.52, wz - 0.4 + p * 0.2); }
  }
  B.build(g);
  return { glassM, doorM, wallM, x: fx, z, w, H, dz };
}

function boat(g, x, z, col) {
  const b = new THREE.Group(); b.position.set(x, -0.62, z); g.add(b);
  const hull = paint(std(col), 'boat', z), wood = std(0x8a5a3a);
  const B = new Bucket(); B.box(1.3, 0.45, 4.2, hull, 0, 0, 0); B.box(1.0, 0.08, 3.8, wood, 0, 0.2, 0); B.box(1.1, 0.3, 0.3, wood, 0, 0.3, 0.6); B.box(1.1, 0.3, 0.3, wood, 0, 0.3, -0.9); B.add(new THREE.ConeGeometry(0.66, 0.9, 4, 1).rotateX(Math.PI / 2).rotateZ(Math.PI / 4), hull, 0, 0, 2.5); B.build(b);
  return b;
}

// ---------------------------------------------------------------- the city
export function canalCity(scene) {
  const g = new THREE.Group(); scene.add(g);
  const stone = std(0xd8cfc0, { roughness: 0.95 }), quayM = new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#cfc5b4'; c.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const v = 190 + rnd() * 30; c.fillStyle = `rgb(${v},${v - 8},${v - 20})`; c.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28); } }, [3, 40]) });
  const Z0 = -78, Z1 = 46, L = Z1 - Z0, ZM = (Z0 + Z1) / 2;
  // water (drainable) and canal walls
  const waterM = paint(new THREE.MeshStandardMaterial({ color: 0x1f8fb8, roughness: 0.12, metalness: 0.35, map: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(150,170,190,.5)'; c.lineWidth = 3; for (let i = 0; i < 40; i++) { const y = rnd() * h, x = rnd() * w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 12, y - 4, x + 24, y); c.stroke(); } }, [2, 18]) }), 'water', 0);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(8, L + 30), waterM); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.7, ZM - 10); water.receiveShadow = true; g.add(water);
  const B = new Bucket();
  for (const s of [-1, 1]) { B.box(0.5, 1.6, L + 30, stone, s * 4.0, -0.75, ZM - 10); B.box(3.0, 0.3, L + 30, quayM, s * 5.5, -0.15, ZM - 10); B.box(0.35, 0.18, L + 30, stone, s * 4.05, 0.06, ZM - 10); }
  B.box(80, 0.3, 30, quayM, 0, -0.15, Z0 - 17); // plaza at the tower end
  B.box(80, 0.3, 30, quayM, 0, -0.15, Z1 + 22); // far end street
  B.box(520, 0.2, 520, std(0x6a8a5a), 0, -1.7, -20); // ground under everything
  B.build(g);
  // houses on both quays (gaps where bridges and buildings stand)
  const houses = [];
  const special = { school: [1, 22, 12], bakery: [-1, -2, 6], dale: [1, -8, 6] };
  for (const s of [-1, 1]) { let z = Z1; while (z > Z0) { const w = 4 + rnd() * 2.2; const zc = z - w / 2; let skip = false; for (const [ss, sz, sw] of Object.values(special)) if (ss === s && Math.abs(zc - sz) < (sw + w) / 2) skip = true; if (Math.abs(zc - (-56)) < (6 + w) / 2) skip = true; if (!skip) houses.push(house(g, s, zc, w, 2 + (rnd() < 0.55 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0))); z -= w + 0.05; } }
  // school (+x quay): wider, with a sign and railings
  const school = new THREE.Group(); g.add(school);
  { const z = special.school[1]; const wallM = paint(std(0xffd23d), 'wall', z), trim = paint(std(0xffffff), 'trim', z), roofM = paint(std(0x3d7bff), 'roof', z), glassM = paint(std(0x9ac8e8, { roughness: 0.15, metalness: 0.3, emissive: 0xffd08a, emissiveIntensity: 0 }), 'glass', z), doorM = paint(std(0xe8463c), 'door', z);
    const S = new Bucket(); S.box(10, 8, 12, wallM, 12.2, 4, z); S.box(10.6, 0.5, 12.6, roofM, 12.2, 8.2, z); for (let f = 0; f < 2; f++) for (let k = -2; k <= 2; k++) { if (f === 0 && k === 0) continue; S.box(0.1, 1.6, 1.4, glassM, 7.18, 2 + f * 3.4, z + k * 2.2); S.box(0.16, 0.12, 1.6, trim, 7.12, 2.85 + f * 3.4, z + k * 2.2); S.box(0.16, 0.12, 1.6, trim, 7.12, 1.15 + f * 3.4, z + k * 2.2); }
    S.box(0.12, 2.8, 2.4, trim, 7.17, 1.4, z); S.box(0.1, 2.6, 2.0, doorM, 7.13, 1.3, z); for (let i = 0; i < 3; i++) S.box(0.5, 0.18, 3.2, std(0xd8cfc0), 6.8 - i * 0.45, 0.09 + i * 0.0, z);
    for (let k = -5; k <= 5; k++) if (Math.abs(k) > 1) S.box(0.06, 1.0, 0.06, std(0x2a2a34), 6.6, 0.5, z + k * 0.6); S.box(0.06, 0.06, 6.2, std(0x2a2a34), 6.6, 1.0, z - 3.3); S.box(0.06, 0.06, 6.2, std(0x2a2a34), 6.6, 1.0, z + 3.3); S.build(school);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), paint(new THREE.MeshStandardMaterial({ map: signTex('SCHOOL', '#ffffff', '#1d5fa8', 512, 110, 70), roughness: 0.8 }), 'sign', z)); sg.position.set(7.1, 6.4, z); sg.rotation.y = -Math.PI / 2; school.add(sg); }
  // bakery (-x quay) with the "PROBABLY OPEN" sign
  const bakery = new THREE.Group(); g.add(bakery);
  { const z = special.bakery[1]; const wallM = paint(std(0xff8ab0), 'wall', z), trim = paint(std(0xffffff), 'trim', z), aw = paint(std(0xffffff, { map: canvasTex(128, 32, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ff5d73'; c.fillRect(i * 16, 0, 16, h); } }) }), 'window', z), glassM = paint(std(0xbfe0f7, { roughness: 0.1, metalness: 0.3 }), 'glass', z), roofM = paint(std(0xa84a32), 'roof', z);
    const S = new Bucket(); S.box(7, 7.4, 6, wallM, -10.7, 3.7, z); const rg = gableGeo(6, 2, 7.6); rg.rotateY(Math.PI / 2); S.add(rg, roofM, -10.7, 7.4, z); S.box(0.1, 2.0, 3.6, glassM, -7.18, 1.6, z); S.box(0.16, 0.14, 3.8, trim, -7.12, 2.65, z); S.box(0.16, 2.2, 0.14, trim, -7.12, 1.5, z - 1.85); S.box(0.16, 2.2, 0.14, trim, -7.12, 1.5, z + 1.85);
    const awg = new THREE.BoxGeometry(1.4, 0.06, 5.2); S.add(awg, aw, -6.6, 3.1, z, 0); S.box(0.8, 0.9, 1.2, std(0x8a5a3a), -6.7, 0.45, z + 2.0); S.build(bakery);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), paint(std(0xe0a050), 'flower', z)); b.scale.y = 0.6; b.position.set(-7.4, 1.0, z - 1.2 + i * 0.45); bakery.add(b); }
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.9), paint(new THREE.MeshStandardMaterial({ map: signTex('BAKERY', '#fff3d8', '#8a2a3a', 512, 128, 76) }), 'sign', z)); sg.position.set(-7.12, 4.2, z); sg.rotation.y = Math.PI / 2; bakery.add(sg);
    const prob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshStandardMaterial({ map: signTex('PROBABLY OPEN', '#ffffff', '#1b1b24', 512, 160, 58), roughness: 0.8 })); prob.position.set(-7.1, 1.75, z - 1.2); prob.rotation.y = Math.PI / 2; bakery.add(prob); bakery.userData.prob = prob; }
  // Dale's shop (+x quay)
  const dale = new THREE.Group(); g.add(dale);
  { const z = special.dale[1]; const wallM = paint(std(0x52c98a), 'wall', z), trim = paint(std(0xffffff), 'trim', z), glassM = paint(std(0xbfe0f7, { roughness: 0.1, metalness: 0.3 }), 'glass', z), roofM = paint(std(0x8a4a3a), 'roof', z);
    const S = new Bucket(); S.box(7, 7, 6, wallM, 10.7, 3.5, z); const rg = gableGeo(6, 2, 7.6); rg.rotateY(Math.PI / 2); S.add(rg, roofM, 10.7, 7, z); S.box(0.1, 2.0, 3.6, glassM, 7.18, 1.6, z); S.box(0.16, 0.14, 3.8, trim, 7.12, 2.65, z); S.box(0.16, 2.2, 0.14, trim, 7.12, 1.5, z - 1.85); S.box(0.16, 2.2, 0.14, trim, 7.12, 1.5, z + 1.85); S.box(1.0, 1.0, 2.4, std(0x8a5a3a), 6.4, 0.5, z); S.build(dale);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), paint(new THREE.MeshStandardMaterial({ map: signTex("DALE'S GADGETS", '#ffffff', '#2a8a5a', 512, 128, 50) }), 'sign', z)); sg.position.set(7.12, 4.0, z); sg.rotation.y = -Math.PI / 2; dale.add(sg);
    const ref = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshStandardMaterial({ map: signTex('NO REFUNDS', '#fff3d8', '#8a2a3a', 256, 86, 34) })); ref.position.set(7.08, 1.9, z + 1.2); ref.rotation.y = -Math.PI / 2; dale.add(ref); }
  // bridges: a painted arched footbridge, the unfinished new bridge, the old gray bridge with an underpass
  const arch = (z, col, w = 2.6, rise = 1.4, rail = true) => { const m = paint(std(col), 'bridge', z), r = paint(std(0xffffff), 'trim', z); const S = new Bucket(); const N = 14; for (let i = 0; i < N; i++) { const a = i / (N - 1), x = -6 + a * 12, y = Math.sin(a * Math.PI) * rise; const dx = 12 / (N - 1), ang = Math.atan2(Math.cos(a * Math.PI) * Math.PI * rise / 12, 1); const seg = new THREE.BoxGeometry(dx + 0.06, 0.35, w); seg.rotateZ(ang); S.add(seg, m, x, y + 0.12, z); if (rail) for (const s of [-1, 1]) { const rs = new THREE.BoxGeometry(dx + 0.06, 0.08, 0.08); rs.rotateZ(ang); S.add(rs, r, x, y + 1.15, z + s * (w / 2 - 0.05)); if (i % 2 === 0) S.box(0.07, 1.0, 0.07, r, x, y + 0.65, z + s * (w / 2 - 0.05)); } } S.build(g); };
  arch(36, 0xff5d73); arch(8, 0x3d7bff); arch(-36, 0xffc94a);
  // the new bridge: only half built, scaffolding and a sign
  const newBridge = new THREE.Group(); g.add(newBridge);
  { const z = -20, m = std(0xd8cfc0), wood = std(0x9a6a3a), S = new Bucket(); for (let i = 0; i < 5; i++) { const x = -6 + i * 1.0, y = Math.sin((i / 13) * Math.PI) * 1.4; S.box(1.05, 0.35, 2.6, m, x, y + 0.12, z); } for (let i = 0; i < 4; i++) S.box(0.08, 3, 0.08, wood, -4.6 + i * 0.7, 0.8, z + 1.4); S.box(3, 0.08, 0.08, wood, -3.6, 2.2, z + 1.4); S.box(3, 0.08, 0.08, wood, -3.6, 1.2, z + 1.4); S.build(newBridge);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), new THREE.MeshStandardMaterial({ map: signTex('NEW BRIDGE SOON', '#fff3d8', '#1d5fa8', 512, 170, 54) })); sg.position.set(-5.6, 1.4, z + 2.2); sg.rotation.y = Math.PI / 2 - 0.5; newBridge.add(sg);
    for (const x of [-5.2, -4.4]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 10), paint(std(0xff6a2a), 'sign', z)); c.position.set(x, 0.25, z + 2.0); newBridge.add(c); } }
  // podium for the mayor
  const podium = new THREE.Group(); podium.position.set(-5.4, 0, -16); g.add(podium); { const m = paint(std(0x2a5ab8), 'sign', -16); const S = new Bucket(); S.box(0.9, 1.1, 0.6, m, 0, 0.55, 0); S.box(1.0, 0.08, 0.7, std(0xf2c14e), 0, 1.14, 0); S.build(podium); }
  // old gray bridge: big, stone, already colourless; the quay walkways pass under its side arches
  const grayBridge = new THREE.Group(); g.add(grayBridge);
  const GZ = -56;
  { const gs = std(0x6c6c74, { roughness: 1 }), dark = std(0x4a4a52, { roughness: 1 }), S = new Bucket();
    S.box(26, 1.0, 5, gs, 0, 4.3, GZ); S.box(26, 0.9, 0.4, gs, 0, 5.2, GZ - 2.3); S.box(26, 0.9, 0.4, gs, 0, 5.2, GZ + 2.3);
    for (const x of [-7.6, -3.4, 3.4, 7.6]) S.box(1.2, 4.0, 5, gs, x, 2.0, GZ); // piers: quay passages between 3.4..7.6 on each side, canal in the middle
    for (const s of [-1, 1]) { for (let i = 0; i < 9; i++) { const a = i / 8, x = s * (3.4 + 0.6 + a * 3.0); S.box(0.4, 0.5, 5, dark, x, 3.5 + Math.sin(a * Math.PI) * 0.4 - 0.2, GZ); } S.box(1.2, 4.0, 5, gs, s * 10.5, 2.0, GZ); }
    for (let i = 0; i < 9; i++) { const a = i / 8, x = -2.8 + a * 5.6; S.box(0.7, 0.5, 5, dark, x, 3.6 + Math.sin(a * Math.PI) * 0.4 - 0.3, GZ); }
    S.build(grayBridge); }
  // clock tower at the end of the canal
  const tower = new THREE.Group(); tower.position.set(0, 0, -92); g.add(tower);
  const TC = { y: 22, r: 3.2 };
  { const brick = paint(std(0xc85a3a, { roughness: 0.9 }), 'tower', -92), trim = paint(std(0xf2e8d8), 'trim', -92), roof = paint(std(0x2e6a5a, { metalness: 0.3, roughness: 0.5 }), 'roof', -92), S = new Bucket();
    S.box(8, 30, 8, brick, 0, 15, 0); for (const y of [8, 16, 26.2, 30]) S.box(8.5, 0.5, 8.5, trim, 0, y, 0); for (const s of [-1, 1]) for (const t of [-1, 1]) S.box(0.6, 30, 0.6, trim, s * 4.05, 15, t * 4.05);
    for (const y of [4, 11.5]) for (const s of [-1, 1]) { S.box(1.2, 2.4, 0.2, std(0x2a2a3a), s * 1.6, y, 4.02); S.box(1.5, 0.2, 0.3, trim, s * 1.6, y + 1.3, 4.05); }
    for (let i = 0; i < 4; i++) { S.box(1.6, 3.0, 8.6, std(0x1a1a24), 0, 28.2, 0, i * Math.PI / 2); }
    const sp = new THREE.ConeGeometry(6.2, 9, 4); sp.rotateY(Math.PI / 4); S.add(sp, roof, 0, 34.8, 0); S.box(1.4, 3.2, 1.4, brick, 0, 1.6, 4.4); S.build(tower);
    // door
    const dr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 0.2), paint(std(0x6a3a2a), 'door', -92)); dr.position.set(0, 1.7, 4.1); tower.add(dr); }
  const clockTex = canvasTex(1024, 1024, (c, w) => { const r = w / 2; c.fillStyle = '#f6f0e2'; c.beginPath(); c.arc(r, r, r - 4, 0, 7); c.fill(); c.lineWidth = 26; c.strokeStyle = '#2a2a34'; c.stroke(); c.fillStyle = '#2a2a34'; c.font = '800 110px Poppins'; c.textAlign = 'center'; c.textBaseline = 'middle'; const N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; N.forEach((n, i) => { const a = i / 12 * Math.PI * 2; c.save(); c.translate(r + Math.sin(a) * r * 0.76, r - Math.cos(a) * r * 0.76); c.font = `800 ${n.length > 2 ? 76 : 96}px Poppins`; c.fillText(n, 0, 0); c.restore(); }); for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; c.fillRect(r + Math.sin(a) * r * 0.9 - 4, r - Math.cos(a) * r * 0.9 - 4, 8, 8); } });
  const clockM = paint(new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.6, emissive: 0xfff0c8, emissiveMap: clockTex, emissiveIntensity: 0.0 }), 'clock', -92);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(TC.r, 48), clockM); clock.position.set(0, TC.y, 4.08); tower.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(TC.r, 0.22, 10, 48), paint(std(0xf2c14e, { metalness: 0.6, roughness: 0.3 }), 'clock', -92)); rim.position.copy(clock.position); tower.add(rim);
  const handM = std(0x1b1b24); const hand = (len, wd) => { const p = new THREE.Group(); p.position.set(0, TC.y, 4.2); tower.add(p); const b = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.08), handM); b.position.y = len / 2 - 0.3; p.add(b); return p; };
  const hourH = hand(1.9, 0.26), minH = hand(2.7, 0.16);
  // chalk writing on the clock face (outside view); write(n) shows the first n letters
  const MSG = 'I PROMISE TO BRING EVERYONE HOME';
  const chalkCan = document.createElement('canvas'); chalkCan.width = 1024; chalkCan.height = 1024; const chalkTex = new THREE.CanvasTexture(chalkCan); chalkTex.colorSpace = THREE.SRGBColorSpace;
  const chalk = new THREE.Mesh(new THREE.CircleGeometry(TC.r * 0.98, 48), new THREE.MeshBasicMaterial({ map: chalkTex, transparent: true, depthWrite: false })); chalk.position.set(0, TC.y, 4.3); tower.add(chalk);
  let chalkN = -1;
  const writeChalk = (n, mirror = false) => { n = Math.max(0, Math.min(MSG.length, Math.floor(n))); const key = n + (mirror ? 1000 : 0); if (key === chalkN) return; chalkN = key; const c = chalkCan.getContext('2d'); c.clearRect(0, 0, 1024, 1024); c.save(); if (mirror) { c.translate(1024, 0); c.scale(-1, 1); } c.fillStyle = 'rgba(255,255,255,.96)'; c.strokeStyle = 'rgba(40,40,60,.55)'; c.lineWidth = 10; c.font = '800 92px Poppins'; c.textAlign = 'center'; const lines = ['I PROMISE', 'TO BRING', 'EVERYONE', 'HOME']; let left = n, y = 380; for (const ln of lines) { const s = ln.slice(0, Math.max(0, left)); c.strokeText(s, 512, y); c.fillText(s, 512, y); left -= ln.length + 1; y += 112; } c.restore(); chalkTex.needsUpdate = true; };
  writeChalk(0);
  // a second canal-end view: hills and far roofs so the sky isn't empty
  { const far = new THREE.Group(); g.add(far); const S = new Bucket(); for (let i = 0; i < 60; i++) { const a = rnd() * Math.PI * 2, r = 70 + rnd() * 60, x = Math.cos(a) * r, z = Math.sin(a) * r - 20, h = 6 + rnd() * 14; if (Math.abs(x) < 24 && z > -100 && z < 60) continue; S.box(6 + rnd() * 6, h, 6 + rnd() * 6, paint(std(pick(WALLS)), 'far', z), x, h / 2 - 0.4, z); } S.build(far);
    for (let i = 0; i < 14; i++) { const hill = new THREE.Mesh(new THREE.SphereGeometry(40 + rnd() * 30, 16, 10), paint(std(pick([0x6aa85a, 0x7ab86a, 0x5a9a5a])), 'far', -150)); hill.scale.y = 0.35; const a = i / 14 * Math.PI * 2; hill.position.set(Math.cos(a) * 200, -8, Math.sin(a) * 200 - 20); g.add(hill); } }
  // street dressing: lamps, benches, laundry lines, boats, bikes, crates
  const lampsM = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd890, emissiveIntensity: 0.0 }); const lampPole = std(0x2a2a34, { metalness: 0.5, roughness: 0.4 });
  { const S = new Bucket(); for (const s of [-1, 1]) for (let z = Z1 - 4; z > Z0; z -= 12) { if (Math.abs(z - GZ) < 4) continue; S.box(0.12, 3.6, 0.12, lampPole, s * 4.5, 1.8, z); S.box(0.6, 0.08, 0.08, lampPole, s * 4.75, 3.55, z); S.add(new THREE.SphereGeometry(0.2, 10, 8), lampsM, s * 5.0, 3.38, z); }
    for (const s of [-1, 1]) for (let z = Z1 - 10; z > Z0; z -= 17) { if (Math.abs(z - GZ) < 5) continue; S.box(1.6, 0.08, 0.45, std(0x8a5a3a), s * 6.4, 0.45, z); S.box(1.6, 0.5, 0.08, std(0x8a5a3a), s * 6.6, 0.75, z); for (const e of [-0.7, 0.7]) S.box(0.08, 0.45, 0.4, lampPole, s * 6.4, 0.22, z + e); }
    S.build(g); }
  const lamps = lampsM;
  const laundry = []; for (let i = 0; i < 9; i++) { const z = Z1 - 8 - i * 12.5 + rnd() * 3; if (Math.abs(z - GZ) < 6 || Math.abs(z - 8) < 3 || Math.abs(z + 36) < 3) continue; const y = 6.4 + rnd() * 2; const line = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 14.4, 4), std(0x2a2a34)); line.rotation.z = Math.PI / 2; line.position.set(0, y, z); g.add(line); for (let k = 0; k < 7; k++) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.6 + rnd() * 0.4, 0.7 + rnd() * 0.5), paint(std(pick(WALLS), { side: THREE.DoubleSide }), 'laundry', z)); cl.position.set(-5.5 + k * 1.7 + rnd() * 0.4, y - 0.45, z); cl.rotation.y = Math.PI / 2; g.add(cl); laundry.push(cl); } }
  const boats = []; for (let i = 0; i < 7; i++) { const z = Z1 - 6 - i * 16 - rnd() * 4; if (Math.abs(z - GZ) < 6) continue; boats.push(boat(g, (i % 2 ? 1 : -1) * 2.6, z, pick(WALLS))); }
  // flower pots and crates along the quays
  { const S = new Bucket(); for (let i = 0; i < 40; i++) { const s = rnd() < 0.5 ? -1 : 1, z = Z1 - rnd() * (Z1 - Z0); if (Math.abs(z - GZ) < 5) continue; if (rnd() < 0.5) { S.add(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 10), paint(std(0xc8683a), 'trim', z), s * 6.8, 0.25, z); S.add(new THREE.IcosahedronGeometry(0.34, 0), paint(std(pick([0x4aa84a, 0x3a9a5a])), 'flower', z), s * 6.8, 0.65, z); } else S.box(0.6, 0.5, 0.6, std(0x9a6a3a), s * 6.7, 0.25, z); } S.build(g); }
  return { g, houses, school, bakery, dale, newBridge, podium, grayBridge, GZ, tower, TZ: -92, TC, clock, clockM, hourH, minH, writeChalk, chalk, water, waterM, lamps, laundry, boats, Z0, Z1,
    setTime(h, m) { const mm = (h % 12) * 60 + m; minH.rotation.z = -(m / 60) * Math.PI * 2; hourH.rotation.z = -(mm / 720) * Math.PI * 2; },
    sway(t) { laundry.forEach((l, i) => (l.rotation.x = Math.sin(t * 1.6 + i) * 0.12)); boats.forEach((b, i) => { b.position.y = -0.62 + Math.sin(t * 1.2 + i * 2) * 0.03; b.rotation.z = Math.sin(t * 0.9 + i) * 0.03; }); waterM.map.offset.y = -t * 0.01; } };
}

// ---------------------------------------------------------------- top of the clock tower (interior), at x = X
export function towerTop(scene, X = 300) {
  const g = new THREE.Group(); g.position.set(X, 0, 0); scene.add(g);
  const W = 9, D = 9, H = 7.5;
  const wood = std(0x6a4a32, { roughness: 0.9 }), brick = std(0x8a4a3a, { roughness: 1 }), beam = std(0x4a3222), iron = std(0x3a3a42, { metalness: 0.7, roughness: 0.35 });
  const S = new Bucket();
  S.add(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.85, map: canvasTex(256, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { const v = 90 + rnd() * 30; c.fillStyle = `rgb(${v + 20},${v},${v - 20})`; c.fillRect(0, i * 32, w, 31); } }, [3, 3]) }), 0, 0, 0);
  S.box(W, H, 0.4, brick, 0, H / 2, D / 2); S.box(0.4, H, D, brick, -W / 2, H / 2, 0); S.box(0.4, H, D, brick, W / 2, H / 2, 0); S.box(W, 0.4, D, beam, 0, H, 0);
  // back wall with the round clock hole (z = -D/2): built from strips around a 3.2 m circle
  for (let i = 0; i < 24; i++) { const y = i * (H / 24) + H / 48, dy = y - 3.8, half = Math.abs(dy) < 3.25 ? Math.sqrt(3.25 * 3.25 - dy * dy) : 0; if (half === 0) S.box(W, H / 24 + 0.01, 0.4, brick, 0, y, -D / 2); else { const wl = W / 2 - half; S.box(wl, H / 24 + 0.01, 0.4, brick, -W / 2 + wl / 2, y, -D / 2); S.box(wl, H / 24 + 0.01, 0.4, brick, W / 2 - wl / 2, y, -D / 2); } }
  for (const x of [-3.6, 3.6]) S.box(0.35, H, 0.35, beam, x, H / 2, -D / 2 + 0.4); for (const z of [-2, 2]) S.box(W, 0.3, 0.3, beam, 0, H - 0.5, z);
  // stair hole + rail at the front-left corner
  S.box(2.2, 0.06, 0.06, iron, -3.2, 1.0, 1.6); for (let i = 0; i < 4; i++) S.box(0.06, 1.0, 0.06, iron, -4.2 + i * 0.7, 0.5, 1.6);
  // gears on the side walls
  const gearGeo = (r) => { const parts = [new THREE.CylinderGeometry(r, r, 0.15, 24)]; for (let i = 0; i < 14; i++) { const t = new THREE.BoxGeometry(0.16, 0.15, 0.25); t.translate(0, 0, r + 0.08); t.rotateY(i / 14 * Math.PI * 2); parts.push(t); } return mergeGeometries(parts.map((p) => p.toNonIndexed())).rotateX(Math.PI / 2); };
  S.build(g);
  const gears = []; for (const [x, y, z, r] of [[4.3, 3.2, -1.5, 1.0], [4.3, 4.6, 0.2, 0.6], [-4.3, 3.6, -1.0, 0.9], [-4.3, 2.2, 0.8, 0.55], [2.4, 4.8, -4.2, 0.7]]) { const gm = new THREE.Mesh(gearGeo(r), iron); gm.position.set(x, y, z); gm.rotation.y = x > 3 || x < -3 ? Math.PI / 2 : 0; g.add(gm); gears.push(gm); }
  // the back of the clock face: glowing translucent disc, mirrored numerals, hands
  const backTex = canvasTex(1024, 1024, (c, w) => { const r = w / 2; c.fillStyle = '#fff4d8'; c.beginPath(); c.arc(r, r, r - 4, 0, 7); c.fill(); c.translate(w, 0); c.scale(-1, 1); c.fillStyle = 'rgba(60,50,40,.55)'; c.textAlign = 'center'; c.textBaseline = 'middle'; ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = i / 12 * Math.PI * 2; c.font = `800 ${n.length > 2 ? 76 : 96}px Poppins`; c.fillText(n, r + Math.sin(a) * r * 0.76, r - Math.cos(a) * r * 0.76); }); });
  const face = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshStandardMaterial({ map: backTex, emissive: 0xffe8b0, emissiveMap: backTex, emissiveIntensity: 0.9, roughness: 0.8 })); face.position.set(0, 3.8, -D / 2 + 0.05); g.add(face);
  const hm = std(0x1b1b24); const hand = (len, wd) => { const p = new THREE.Group(); p.position.set(0, 3.8, -D / 2 + 0.15); g.add(p); const b = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.06), hm); b.position.y = len / 2 - 0.3; p.add(b); return p; };
  const hourH = hand(1.9, 0.24), minH = hand(2.7, 0.14);
  const faceLight = new THREE.PointLight(0xffd8a0, 18, 12, 1.4); faceLight.position.set(0, 3.8, -D / 2 + 1.2); g.add(faceLight);
  // chalk on the inside of the face (mirror of the outside writing)
  const chalkCan = document.createElement('canvas'); chalkCan.width = 1024; chalkCan.height = 1024; const chalkTex = new THREE.CanvasTexture(chalkCan); chalkTex.colorSpace = THREE.SRGBColorSpace;
  const chalk = new THREE.Mesh(new THREE.CircleGeometry(3.1, 48), new THREE.MeshBasicMaterial({ map: chalkTex, transparent: true, depthWrite: false })); chalk.position.set(0, 3.8, -D / 2 + 0.2); g.add(chalk);
  let cn = -1; const writeChalk = (n) => { n = Math.max(0, Math.floor(n)); if (n === cn) return; cn = n; const c = chalkCan.getContext('2d'); c.clearRect(0, 0, 1024, 1024); c.fillStyle = 'rgba(255,255,255,.95)'; c.strokeStyle = 'rgba(40,40,60,.6)'; c.lineWidth = 10; c.font = '800 92px Poppins'; c.textAlign = 'center'; const lines = ['I PROMISE', 'TO BRING', 'EVERYONE', 'HOME']; let left = n, y = 380; for (const ln of lines) { const s = ln.slice(0, Math.max(0, left)); c.strokeText(s, 512, y); c.fillText(s, 512, y); left -= ln.length + 1; y += 112; } chalkTex.needsUpdate = true; };
  // the bell and its rope, with ribbons of stolen colour tied along it
  const bell = new THREE.Group(); bell.position.set(1.2, H - 0.6, 0.6); g.add(bell);
  { const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12; pts.push(new THREE.Vector2(0.25 + Math.pow(a, 2.2) * 1.0 + (a > 0.9 ? (a - 0.9) * 2 : 0), -a * 1.8)); } const bm = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), std(0xb8862a, { metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })); bm.castShadow = true; bell.add(bm); const cl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), iron); cl.position.y = -1.6; bell.add(cl); const yoke = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 0.3), beam); yoke.position.y = 0.2; bell.add(yoke); }
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, H - 2.6, 8), std(0xc8a878)); rope.position.set(1.2, (H - 2.6) / 2 + 0.05, 0.6); g.add(rope);
  const RIB = [0xff3d5a, 0xff8a2a, 0xffd23d, 0x4ac85a, 0x3d8aff, 0x9a5aff, 0xff6fb5, 0x2ec4c4, 0xe8463c, 0x8ad14a];
  const ribbons = []; for (let i = 0; i < 16; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.9 + rnd() * 0.6), new THREE.MeshStandardMaterial({ color: RIB[i % RIB.length], emissive: RIB[i % RIB.length], emissiveIntensity: 0.35, side: THREE.DoubleSide, roughness: 0.6 })); r.geometry.translate(0, -0.45, 0); const y = 1.0 + i * 0.27; r.position.set(1.2, y, 0.6); r.rotation.y = i * 1.7; r.rotation.z = 0.25; r.userData = { y, ph: rnd() * 6 }; g.add(r); ribbons.push(r); }
  const lamp = new THREE.PointLight(0x9fb0ff, 10, 14, 1.6); lamp.position.set(-1, H - 1, 2); g.add(lamp);
  // window slits to the night city on the side walls
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.2), new THREE.MeshBasicMaterial({ color: 0x1a2a5a })); w.position.set(s * (W / 2 - 0.21), 3.6, 2.6); w.rotation.y = -s * Math.PI / 2; g.add(w); }
  return { g, X, W, D, H, face, hourH, minH, chalk, writeChalk, bell, rope, ribbons, gears,
    setTime(h, m) { const mm = (h % 12) * 60 + m; minH.rotation.z = (m / 60) * Math.PI * 2; hourH.rotation.z = (mm / 720) * Math.PI * 2; },
    anim(t, swing = 0, snap = 0) { bell.rotation.z = swing; rope.rotation.z = swing * 0.15; gears.forEach((gm, i) => (gm.rotation.z = t * (i % 2 ? -0.4 : 0.3))); ribbons.forEach((r, i) => { if (snap > 0) { const k = Math.min(1, Math.max(0, snap * 1.4 - (i % 5) * 0.08)); r.position.set(X * 0 + 1.2 + Math.sin(i * 2.3) * k * 4, r.userData.y + k * 6, 0.6 + Math.cos(i * 1.7) * k * 3 - k * 2); r.rotation.z = 0.25 + k * 6 + i; r.visible = k < 0.98; } else { r.position.set(1.2, r.userData.y, 0.6); r.rotation.z = 0.25 + Math.sin(t * 2 + r.userData.ph) * 0.15; r.visible = true; } }); } };
}

// ---------------------------------------------------------------- the family dining room, at x = X
export function diningRoom(scene, X = -300) {
  const g = new THREE.Group(); g.position.set(X, 0, 0); scene.add(g);
  const W = 7, D = 6, H = 3.2;
  const wallM = std(0xf6e2b8), wood = std(0x9a6a42), dark = std(0x6a4a32), trim = std(0xffffff);
  const S = new Bucket();
  S.add(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.7, map: canvasTex(256, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { const v = 150 + rnd() * 30; c.fillStyle = `rgb(${v + 30},${v},${v - 40})`; c.fillRect(0, i * 32, w, 31); } }, [3, 3]) }), 0, 0, 0);
  S.box(W, H, 0.2, wallM, 0, H / 2, -D / 2); S.box(0.2, H, D, wallM, -W / 2, H / 2, 0); S.box(0.2, H, D, wallM, W / 2, H / 2, 0); S.box(W, 0.2, D, std(0xfff4e0), 0, H, 0);
  S.box(W, 0.12, 0.06, trim, 0, 0.06, -D / 2 + 0.12);
  // table and four chairs
  S.box(2.2, 0.08, 1.2, wood, 0, 0.62, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.box(0.08, 0.58, 0.08, dark, sx * 1.0, 0.29, sz * 0.5);
  const chair = (x, z, ry) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); const C = new Bucket(); C.box(0.5, 0.06, 0.5, wood, 0, 0.47, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) C.box(0.05, 0.47, 0.05, dark, sx * 0.21, 0.23, sz * 0.21); C.box(0.5, 0.6, 0.05, wood, 0, 0.8, -0.23); C.build(c); return c; };
  const chairs = [chair(-0.6, -0.95, 0), chair(0.6, -0.95, 0), chair(-0.6, 0.95, Math.PI), chair(0.6, 0.95, Math.PI)];
  // window with a view of painted houses, a door, a wall clock, a picture
  S.box(1.8, 1.4, 0.05, std(0x8ac8f0, { emissive: 0x6a9ad0, emissiveIntensity: 0.4 }), -1.6, 1.7, -D / 2 + 0.11); S.box(2.0, 0.1, 0.12, trim, -1.6, 2.45, -D / 2 + 0.14); S.box(2.0, 0.1, 0.12, trim, -1.6, 0.95, -D / 2 + 0.14); S.box(0.1, 1.6, 0.12, trim, -2.55, 1.7, -D / 2 + 0.14); S.box(0.1, 1.6, 0.12, trim, -0.65, 1.7, -D / 2 + 0.14); S.box(0.08, 1.4, 0.12, trim, -1.6, 1.7, -D / 2 + 0.14);
  S.box(0.12, 2.2, 1.0, std(0x3a6aa8), W / 2 - 0.12, 1.1, -1.6); S.box(0.14, 2.35, 1.15, trim, W / 2 - 0.1, 1.15, -1.6);
  S.box(0.9, 0.7, 0.05, std(0x2a2a34), 1.4, 1.9, -D / 2 + 0.12); S.box(0.8, 0.6, 0.06, std(0xf2c14e), 1.4, 1.9, -D / 2 + 0.13);
  S.box(1.2, 0.9, 0.5, wood, -W / 2 + 0.35, 0.45, 1.6); S.build(g);
  const houses = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(256, 192, (c, w, h) => { c.fillStyle = '#8ac8f0'; c.fillRect(0, 0, w, h); const cs = ['#ff5d73', '#ffc94a', '#4aa8ff', '#52c98a', '#ff8a3d', '#b07cff']; for (let i = 0; i < 6; i++) { c.fillStyle = cs[i]; c.fillRect(i * 44, 60 + (i % 3) * 14, 42, h); c.fillStyle = '#ffffff'; c.fillRect(i * 44 + 12, 90 + (i % 3) * 14, 16, 22); } }) })); houses.position.set(-1.6, 1.7, -D / 2 + 0.14); g.add(houses);
  const clockF = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill(); c.strokeStyle = '#2a2a34'; c.lineWidth = 6; c.stroke(); c.fillStyle = '#2a2a34'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(64 + Math.sin(a) * 48 - 3, 64 - Math.cos(a) * 48 - 3, 6, 6); } c.fillRect(62, 26, 4, 40); c.fillRect(62, 62, 26, 4); }) })); clockF.position.set(0.4, 2.45, -D / 2 + 0.12); g.add(clockF);
  // plates, cups, pot of food
  const plates = new THREE.Group(); g.add(plates);
  for (const [x, z] of [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.025, 20), std(0xffffff)); p.position.set(x, 0.675, z); plates.add(p); const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), std(0xe8a050)); f.scale.y = 0.4; f.position.set(x, 0.70, z); plates.add(f); }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.22, 20), std(0xe8463c)); pot.position.set(0, 0.77, 0); plates.add(pot);
  const lampG = new THREE.Group(); lampG.position.set(0, H - 0.9, 0); g.add(lampG); { const sh = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.35, 20, 1, true), std(0xf2c14e, { side: THREE.DoubleSide, emissive: 0xffc870, emissiveIntensity: 0.4 })); lampG.add(sh); const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 4), std(0x2a2a34)); cord.position.y = 0.6; lampG.add(cord); }
  const light = new THREE.PointLight(0xffd090, 14, 9, 1.5); light.position.set(0, H - 1.1, 0); g.add(light);
  return { g, X, W, D, H, chairs, plates, light, seat: (i) => { const c = chairs[i]; return c.getWorldPosition(new THREE.Vector3()); } };
}

/** blue drops for the "dripping out of my eyes" beat: set(origin, u) */
export function drips(scene, n = 10, color = 0x3d8aff) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.2 });
  const d = Array.from({ length: n }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), m); s.scale.y = 1.7; s.visible = false; scene.add(s); return s; });
  return { set(points, u, t) { d.forEach((s, i) => { const p = points[i % points.length]; const ph = ((t * 0.9 + i * 0.37) % 1); s.visible = u > 0; s.position.copy(p).add(new THREE.Vector3(0, -ph * 0.28, 0.02)); s.scale.setScalar(1 - ph * 0.5).setY(1.7 * (1 - ph * 0.5)); }); }, hide() { d.forEach((s) => (s.visible = false)); } };
}

/** colour streaks flying from one point out over the city: set(from, u) */
export function colorStreaks(scene, n = 120) {
  const RIB = [0xff3d5a, 0xff8a2a, 0xffd23d, 0x4ac85a, 0x3d8aff, 0x9a5aff, 0xff6fb5, 0x2ec4c4];
  const ms = RIB.map((c) => new THREE.MeshBasicMaterial({ color: c }));
  const seeds = Array.from({ length: n }, () => [rnd(), rnd(), rnd()]);
  const s = seeds.map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.6), ms[i % ms.length]); m.visible = false; scene.add(m); return m; });
  return { set(from, u) { s.forEach((m, i) => { const [a, b, c] = seeds[i]; const k = Math.min(1, Math.max(0, (u - c * 0.35) / 0.65)); m.visible = k > 0 && k < 1; if (!m.visible) return; const to = new THREE.Vector3((a - 0.5) * 30, 2 + b * 8, from.z + 20 + c * 110); const p = from.clone().lerp(to, k); p.y += Math.sin(k * Math.PI) * (12 + b * 10); m.position.copy(p); const p2 = from.clone().lerp(to, Math.min(1, k + 0.02)); p2.y += Math.sin(Math.min(1, k + 0.02) * Math.PI) * (12 + b * 10); m.lookAt(p2); }); }, hide() { s.forEach((m) => (m.visible = false)); } };
}
