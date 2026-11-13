// Snowy mountain village (episode 3 "The Mountain Whisper").
// Layout: a snow lane along -z (x -6..6, z 30..-100), chalets from |x| = 11, a square at z -100..-122, the Echo Point
// lookout at z -128 on a cliff edge (z -136), a valley below (y -30), and the talking mountain beyond (peak at z -430).
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box, car, LAMP_MATS } from './town.js';
import { bake } from './world.js';
import { liveScreen, textTex } from './props.js';

let seed = 31;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const TIMBER = [0x9a5f3a, 0x7d4a2c, 0xb07448, 0x8a5434, 0x6e3f26];
const TRIM = [0xffffff, 0xe8434f, 0x2f6b5a, 0x2f5f9a, 0xf2c14e];
const SNOW = 0xf4f8ff;
export const GLASS = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb860, emissiveIntensity: 0.55, roughness: 0.3 });

const snowTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#eef4fb'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const v = 215 + rnd() * 40; g.fillStyle = `rgba(${v - 20},${v - 8},${v},.35)`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, 7); g.fill(); }
}, [60, 60]);
const pathTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9e2ee'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(150,165,190,.35)'; g.lineWidth = 3; g.beginPath(); const x = rnd() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 20, h / 3, x - 20, h * 2 / 3, x + 5, h); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
}, [2, 30]);
const stoneTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#8e8a96'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const v = 130 + rnd() * 50; g.fillStyle = `rgb(${v},${v - 4},${v + 8})`; g.beginPath(); g.roundRect(c * 32 + (r % 2) * 16 + 2, r * 21 + 2, 28, 17, 5); g.fill(); }
}, [2, 1]);

function gable(span, height, depth, mat) {
  const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, height); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); geo.translate(0, 0, -depth / 2); geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; return m;
}
const stoneMat = () => new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.95 });

/** chalet with its front facing the lane: side +1 = house on +x (front faces -x) */
function chalet(p, x, z, w, side, opts = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  const d = 10, base = 3, floors = opts.floors || (rnd() < 0.5 ? 2 : 1), fh = 3.6, H = base + floors * fh;
  const wood = std(pick(TIMBER), { roughness: 0.85 }), trim = std(pick(TRIM)), dark = std(0x3a2a22);
  box(d, base, w, stoneMat(), 0, base / 2, 0, g);
  box(d, floors * fh, w, wood, 0, base + floors * fh / 2, 0, g);
  for (let i = 0; i <= floors; i++) box(d + 0.2, 0.25, w + 0.2, dark, 0, base + i * fh, 0, g); // beams
  const fx = -side * (d / 2 + 0.08); // front face x
  // door + steps on the ground floor
  box(0.2, 4.2, 2.4, trim, fx, 2.1, -w * 0.22, g); box(0.24, 3.8, 2.0, std(0x6b3f24), fx - side * 0.04, 1.9, -w * 0.22, g);
  box(1.6, 0.4, 3.0, stoneMat(), fx - side * 0.8, 0.2, -w * 0.22, g); box(0.9, 0.4, 3.0, stoneMat(), fx - side * 1.6, -0.0, -w * 0.22, g);
  // windows: real frames + lit glass + sills + shutters
  const win = (y, zz) => {
    box(0.18, 2.0, 1.7, trim, fx, y, zz, g); box(0.22, 1.6, 1.3, GLASS, fx - side * 0.03, y, zz, g);
    box(0.24, 1.6, 0.1, trim, fx - side * 0.05, y, zz, g); box(0.24, 0.1, 1.3, trim, fx - side * 0.05, y, zz, g);
    box(0.6, 0.18, 2.0, trim, fx - side * 0.25, y - 1.05, zz, g);
    [-1, 1].forEach((s) => box(0.12, 1.8, 0.6, std(pick(TRIM)), fx - side * 0.06, y, zz + s * 1.2, g));
  };
  win(1.9, w * 0.22);
  for (let f = 0; f < floors; f++) { win(base + f * fh + 1.9, -w * 0.25); win(base + f * fh + 1.9, w * 0.25); }
  // balcony on the first timber floor
  if (floors > 1 || rnd() < 0.5) {
    const by = base + 0.1;
    box(1.6, 0.25, w * 0.8, wood, fx - side * 0.8, by, 0, g);
    for (let k = -w * 0.38; k <= w * 0.38; k += 0.6) box(0.12, 1.1, 0.12, dark, fx - side * 1.5, by + 0.65, k, g);
    box(0.14, 0.14, w * 0.8, dark, fx - side * 1.5, by + 1.2, 0, g);
    box(1.4, 0.35, w * 0.78, std(SNOW), fx - side * 0.8, by + 0.3, 0, g); // snow on the balcony
    for (let k = 0; k < 3; k++) { const pot = box(0.5, 0.4, 0.5, std(0xb5523b), fx - side * 1.3, by + 1.45, -w * 0.3 + k * w * 0.3, g); pot.visible = true; }
  }
  // roof: overhanging gable + snow cap + chimney + icicles
  const roofM = std(0x5a3a2a, { roughness: 0.8 });
  const r = gable(w + 1.6, w * 0.55, d + 1.6, roofM); r.position.y = H; g.add(r);
  const sc = gable(w + 1.9, w * 0.55 + 0.35, d + 1.4, std(SNOW, { roughness: 1 })); sc.position.y = H + 0.25; g.add(sc);
  box(1.0, 3.2, 1.0, stoneMat(), side * 2, H + w * 0.35, w * 0.22, g); box(1.2, 0.5, 1.2, std(SNOW), side * 2, H + w * 0.35 + 1.75, w * 0.22, g);
  for (let k = -w / 2; k < w / 2; k += 0.7) { const ic = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4 + rnd() * 0.6, 5), std(0xdff2ff, { roughness: 0.1 })); ic.rotation.x = Math.PI; ic.position.set(fx - side * 0.75, H - 0.3, k); g.add(ic); }
  return { g, chimney: new THREE.Vector3(x + side * 2, H + w * 0.35 + 2.1, z + w * 0.22) };
}

/** instanced snowy pines */
export function pines(scene, spots) {
  const n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6), std(0x6e4a32), n);
  const layers = [0, 1, 2].map((k) => new THREE.InstancedMesh(new THREE.ConeGeometry(2.6 - k * 0.7, 3.2, 8), std([0x2f6b4a, 0x37784f, 0x3f8656][k], { roughness: 0.9 }), n));
  const caps = [0, 1, 2].map((k) => new THREE.InstancedMesh(new THREE.ConeGeometry(1.6 - k * 0.45, 1.2, 8), std(SNOW, { roughness: 1 }), n));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  spots.forEach(([x, y, z, s], i) => {
    const S = new THREE.Vector3(s, s, s);
    m.compose(new THREE.Vector3(x, y + 1.2 * s, z), q, S); trunk.setMatrixAt(i, m);
    for (let k = 0; k < 3; k++) {
      m.compose(new THREE.Vector3(x, y + (3.2 + k * 1.9) * s, z), q, S); layers[k].setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, y + (4.3 + k * 1.9) * s, z), q, S); caps[k].setMatrixAt(i, m);
    }
  });
  [trunk, ...layers, ...caps].forEach((o) => { o.castShadow = true; o.receiveShadow = true; scene.add(o); });
}

// ---------------------------------------------------------------- clutter (all static, baked)
function sled(p, x, z, ry) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g); box(1.0, 0.15, 2.4, std(0xc8343f), 0, 0.55, 0, g); [-0.45, 0.45].forEach((a) => box(0.1, 0.4, 2.6, std(0x3a3f52), a, 0.25, 0.05, g)); }
function skis(p, x, z, side) { [-0.25, 0.25].forEach((a, i) => { const s = box(0.15, 4.2, 0.5, std([0x2f6b9a, 0xf2c14e][i]), x, 2.1, z + a, p); s.rotation.z = side * 0.15; }); }
function firewood(p, x, z, side) { for (let r = 0; r < 4; r++) for (let c = 0; c < 6 - r; c++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 8), std(0x8a5a3c)); l.rotation.x = Math.PI / 2; l.position.set(x, 0.3 + r * 0.5, z - 1.5 + c * 0.58 + r * 0.29); p.add(l); } box(1.8, 0.3, 4, std(SNOW), x, 2.2, z, p); }
function snowman(p, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const w = std(0xffffff, { roughness: 1 });
  [[0, 1.0, 1.0], [0, 2.5, 0.75], [0, 3.6, 0.55]].forEach(([a, b, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), w); s.position.set(a, b, 0); g.add(s); });
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 8), std(0xff8f3a)); nose.rotation.x = Math.PI / 2; nose.position.set(0, 3.6, 0.75); g.add(nose);
  [-0.18, 0.18].forEach((a) => box(0.1, 0.1, 0.05, std(0x111111), a, 3.8, 0.52, g));
  box(1.3, 0.25, 0.25, std(0xe8434f), 0, 3.05, 0, g, 0.08); box(0.9, 0.12, 0.9, std(0x1b1b24), 0, 4.1, 0, g); box(0.6, 0.6, 0.6, std(0x1b1b24), 0, 4.45, 0, g);
}
function lantern(p, x, z) {
  const m = std(0x2b2f45, { metalness: 0.4, roughness: 0.4 });
  box(0.22, 5.2, 0.22, m, x, 2.6, z, p);
  const lm = std(0xfff1c8, { emissive: 0xffc870, emissiveIntensity: 0.8 }); LAMP_MATS.push(lm);
  box(0.7, 0.85, 0.7, lm, x, 5.6, z, p); box(0.95, 0.16, 0.95, m, x, 6.1, z, p); box(0.95, 0.3, 0.95, std(SNOW), x, 6.32, z, p);
}
function bench(p, x, z, ry) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g); box(3, 0.2, 0.9, std(0x9a5f3a), 0, 1.0, 0, g); box(3, 0.7, 0.15, std(0x9a5f3a), 0, 1.55, -0.4, g); [-1.2, 1.2].forEach((a) => box(0.16, 1.0, 0.9, std(0x3a3f52), a, 0.5, 0, g)); box(3, 0.18, 0.9, std(SNOW), 0, 1.2, 0, g); }
function signpost(p, x, z, words) { box(0.25, 5, 0.25, std(0x7d4a2c), x, 2.5, z, p); words.forEach((w, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: textTex([w], { w: 512, h: 128, bg: '#f2e6cf', fg: '#5a3a2a', radius: 16 }), side: THREE.DoubleSide })); m.position.set(x + (i % 2 ? -1.4 : 1.4), 4.2 - i * 1.0, z); m.rotation.y = i % 2 ? 0.3 : -0.3; p.add(m); }); }
function stall(p, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  box(6, 2.2, 2.4, std(0x9a5f3a), 0, 1.1, 0, g); box(6.6, 0.25, 3.0, std(0x7d4a2c), 0, 2.3, 0, g);
  [-2.9, 2.9].forEach((a) => box(0.25, 4.6, 0.25, std(0x7d4a2c), a, 2.3, -1.1, g));
  const roof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.25, 3.4), new THREE.MeshStandardMaterial({ map: canvasTex(128, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#e8434f' : '#ffffff'; c.fillRect(i * 16, 0, 16, h); } }) })); roof.position.set(0, 4.7, -0.3); roof.rotation.x = 0.25; g.add(roof);
  box(7, 0.3, 3.4, std(SNOW), 0, 5.0, -0.4, g).rotation.x = 0.25;
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 10), std([0xffffff, 0xe8434f, 0x2f6b9a][i % 3])); c.position.set(-2.2 + i * 0.85, 2.7, 0.6); g.add(c); }
  for (let i = 0; i < 4; i++) box(0.9, 1.5, 0.1, std([0xe8434f, 0xf2c14e, 0x2f6b9a, 0x2f8f5a][i]), -2.4 + i * 1.6, 3.4, -1.05, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.9), new THREE.MeshStandardMaterial({ map: textTex(['HOT COCOA'], { w: 512, h: 128, bg: '#5a3a2a', fg: '#ffe9b8', radius: 16 }) })); sign.position.set(0, 4.1, 1.25); g.add(sign);
}

// ---------------------------------------------------------------- the village
export function buildAlpine(scene) {
  seed = 31;
  const T = new THREE.Group(); scene.add(T);
  const snow = new THREE.Mesh(new THREE.PlaneGeometry(700, 172), new THREE.MeshStandardMaterial({ map: snowTex(), roughness: 1 }));
  snow.rotation.x = -Math.PI / 2; snow.position.set(0, 0, -50); snow.receiveShadow = true; T.add(snow); // plateau: z 36 .. -136
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(12, 140), new THREE.MeshStandardMaterial({ map: pathTex(), roughness: 0.9 }));
  lane.rotation.x = -Math.PI / 2; lane.position.set(0, 0.02, -36); lane.receiveShadow = true; T.add(lane);
  // cliff edge and valley floor
  const cliff = box(700, 32, 2, std(0xb8c2d4, { roughness: 1 }), 0, -16, -137, T);
  const valley = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1200), new THREE.MeshStandardMaterial({ map: snowTex(), roughness: 1 }));
  valley.rotation.x = -Math.PI / 2; valley.position.set(0, -30, -740); valley.receiveShadow = true; T.add(valley);

  const tmp = new THREE.Group();
  const chimneys = [];
  [-1, 1].forEach((s) => { let z = 26; while (z > -92) { const w = 9 + rnd() * 3; const c = chalet(tmp, s * 16, z - w / 2, w, s); chimneys.push(c.chimney); z -= w + 2.5; } });
  // second row and hamlets for wide shots
  [-1, 1].forEach((s) => { let z = 20; while (z > -86) { const w = 9 + rnd() * 3; const c = chalet(tmp, s * (34 + rnd() * 6), z - w / 2, w, s, { floors: 1 }); chimneys.push(c.chimney); z -= w + 6 + rnd() * 6; } });
  for (let i = 0; i < 22; i++) { const s = rnd() < 0.5 ? -1 : 1, x = s * (55 + rnd() * 70), z = 25 - rnd() * 110; if (Math.hypot(x + 42, z + 20) < 22) continue; chalet(tmp, x, z, 9, s, { floors: 1 }); } // hamlets, kept clear of the square and Echo Point
  // lane dressing
  for (let z = 18; z > -92; z -= 14) { lantern(tmp, 7.5, z); lantern(tmp, -7.5, z - 7); }
  [[8.6, 6, 0.3], [-8.8, -20, -0.4], [8.4, -48, 0.2], [-8.6, -70, 0.5]].forEach(([x, z, r]) => sled(tmp, x, z, r));
  [[10.4, -4, 1], [-10.4, -33, -1], [10.4, -60, 1]].forEach(([x, z, s]) => skis(tmp, x, z, s));
  [[-10.6, 10, -1], [10.6, -26, 1], [-10.6, -80, -1]].forEach(([x, z, s]) => firewood(tmp, x, z, s));
  [[8.6, -14, -0.5], [-8.8, -54, 0.6]].forEach(([x, z, r]) => snowman(tmp, x, z, r));
  [[9.0, -36, -Math.PI / 2], [-9.0, 0, Math.PI / 2]].forEach(([x, z, r]) => bench(tmp, x, z, r));
  for (let z = 30; z > -98; z -= 3) [-6.4, 6.4].forEach((x) => { if (rnd() < 0.6) { const h = 0.4 + rnd() * 0.5; box(1 + rnd(), h, 1.5 + rnd(), std(SNOW, { roughness: 1 }), x + (x > 0 ? 0.2 : -0.2), h / 2, z, tmp); } }); // snow banks
  // the square
  const sq = new THREE.Mesh(new THREE.CircleGeometry(20, 40), new THREE.MeshStandardMaterial({ map: pathTex(), roughness: 0.9 })); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.025, -112); sq.receiveShadow = true; T.add(sq);
  stall(tmp, -11, -108, Math.PI / 2 - 0.3); stall(tmp, 11.5, -104, -Math.PI / 2 + 0.3);
  snowman(tmp, 12, -118, -0.8); bench(tmp, -13, -120, 1.0); signpost(tmp, 8, -124, ['ECHO POINT', 'CITY 40 MI']);
  for (let i = 1; i < 8; i++) { if (i === 4) continue; const a = i / 8 * 6.283; lantern(tmp, Math.sin(a) * 17, -112 + Math.cos(a) * 17); }
  // Echo Point lookout: deck, railing, telescope, little bell
  box(26, 0.6, 9, std(0x8a5434), 0, 0.3, -131, tmp);
  for (let x = -13; x <= 13; x += 1.3) box(0.2, 1.6, 0.2, std(0x5a3a22), x, 1.4, -135.3, tmp);
  box(26.4, 0.25, 0.3, std(0x5a3a22), 0, 2.2, -135.3, tmp); box(26.4, 0.3, 0.5, std(SNOW), 0, 2.45, -135.3, tmp);
  box(0.3, 2.6, 0.3, std(0x3a3f52), 9, 1.9, -133.5, tmp); const tel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 12), std(0xc8a050, { metalness: 0.6 })); tel.rotation.x = 1.2; tel.position.set(9, 3.3, -133.8); tmp.add(tel);
  // frozen pond with fences
  const pond = new THREE.Mesh(new THREE.CircleGeometry(14, 40), std(0xa8d8f0, { roughness: 0.1, metalness: 0.1 })); pond.rotation.x = -Math.PI / 2; pond.position.set(-42, 0.04, -20); T.add(pond);
  for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; box(0.25, 1.4, 0.25, std(0x7d4a2c), -42 + Math.sin(a) * 15.5, 0.7, -20 + Math.cos(a) * 15.5, tmp); }
  // cable car towers
  [[30, 0, -70], [44, 30, -200], [56, 80, -300]].forEach(([x, y, z]) => { box(1.4, 22, 1.4, std(0x3a3f52, { metalness: 0.5 }), x, y + 11, z, tmp); box(6, 0.8, 1.2, std(0x3a3f52), x, y + 22, z, tmp); });
  const baked = bake(tmp); scene.add(baked);

  // pines: plateau edges, valley and mountain foot
  const spots = [];
  for (let i = 0; i < 260; i++) { const x = (rnd() < 0.5 ? -1 : 1) * (50 + rnd() * 240), z = 30 - rnd() * 165; if (Math.hypot(x + 42, z + 20) < 18) continue; spots.push([x, 0, z, 0.8 + rnd() * 0.9]); }
  for (let i = 0; i < 220; i++) { const x = (rnd() - 0.5) * 520, z = -150 - rnd() * 120; spots.push([x, -30, z, 1 + rnd() * 1.3]); }
  pines(scene, spots);

  // cable (line) + moving cabin
  const cablePts = [[30, 22, -70], [44, 52, -200], [56, 102, -300]].map((v) => new THREE.Vector3(...v));
  const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePts), new THREE.LineBasicMaterial({ color: 0x2b2f45 })); scene.add(cable);
  const cabin = new THREE.Group(); scene.add(cabin);
  box(3, 2.6, 2.4, std(0xe8434f), 0, -2.6, 0, cabin, 0.2); box(3.1, 1.0, 2.5, std(0x9fd0f0, { roughness: 0.1 }), 0, -2.2, 0, cabin); box(0.2, 2.2, 0.2, std(0x3a3f52), 0, -0.9, 0, cabin);
  const cableAt = (u) => { const k = Math.min(1.999, Math.max(0, u * 2)), i = Math.floor(k); return cablePts[i].clone().lerp(cablePts[i + 1], k - i); };

  return { T, chimneys, cliff, update(t) { const u = (Math.sin(t * 0.05) * 0.5 + 0.5); cabin.position.copy(cableAt(u)); cabin.rotation.z = Math.sin(t * 1.3) * 0.05; } };
}

// ---------------------------------------------------------------- the talking mountain
export function mountain(scene) {
  seed = 41;
  const g = new THREE.Group(); scene.add(g);
  const MZ = -660, R = 300, H = 520; // peak centre z, base radius, height (base at y -30)
  const rock = std(0xaaa6ba, { roughness: 1, flatShading: true }), snowM = std(SNOW, { roughness: 1, flatShading: true });
  const peak = new THREE.Mesh(new THREE.ConeGeometry(R, H, 11, 6), rock); peak.position.set(0, -30 + H / 2, MZ); g.add(peak);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(R * 0.62, H * 0.62, 11, 4), snowM); cap.position.set(0, -30 + H - H * 0.31 + 1, MZ); g.add(cap);
  [[-330, -600, 200, 330], [340, -620, 210, 360], [-180, -860, 220, 420], [220, -880, 230, 440], [-560, -760, 200, 300], [580, -780, 210, 320]].forEach(([x, z, r, h]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 3), rock); m.position.set(x, -30 + h / 2, z); g.add(m);
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.5, h * 0.5, 9, 2), snowM); c.position.set(x, -30 + h * 0.75 + 1, z); g.add(c);
  });
  const tilt = Math.atan(R / H);
  const surfZ = (y) => MZ + R * (1 - (y + 30) / H);
  let glow = 0, talk = false;
  const face = liveScreen(512, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const col = `rgba(${70 + glow * 180},${80 + glow * 170},${120 + glow * 135},.95)`;
    const eye = (x) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, 200, 52, 34, 0, 0, 7); c.fill(); };
    eye(170); eye(342);
    c.strokeStyle = col; c.lineWidth = 26; c.lineCap = 'round';
    c.beginPath(); if (talk) { c.ellipse(256, 350, 70, 40, 0, 0, 7); } else { c.moveTo(170, 345); c.quadraticCurveTo(256, 390, 342, 345); } c.stroke();
  });
  const fy = 250;
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(170, 170), new THREE.MeshBasicMaterial({ map: face.tex, transparent: true, depthWrite: false }));
  fm.position.set(0, fy, surfZ(fy) + 2); fm.rotation.x = -tilt; g.add(fm);
  // the slope above the village that cracks: crack overlay + a snow slab that can slip
  const sy = 110;
  const crack = liveScreen(512, 512, (c, w, h, k) => {
    c.clearRect(0, 0, w, h); if (!(k > 0)) return;
    c.strokeStyle = '#2b3150'; c.lineWidth = 16; c.lineCap = 'round';
    let s2 = 7; const r2 = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647);
    const n = Math.floor(58 * k);
    c.beginPath(); let x = 30, y = 250; c.moveTo(x, y);
    for (let i = 0; i < n; i++) { x += 8; y += (r2() - 0.5) * 30; c.lineTo(x, y); if (i % 9 === 4) { c.moveTo(x, y); c.lineTo(x + (r2() - 0.5) * 40, y + 30 + r2() * 40); c.moveTo(x, y); } }
    c.stroke();
  });
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshBasicMaterial({ map: crack.tex, transparent: true, depthWrite: false }));
  cm.position.set(0, sy, surfZ(sy) + 3); cm.rotation.x = -tilt; g.add(cm);
  const slabHome = new THREE.Vector3(0, sy + 45, surfZ(sy + 45) + 2);
  return {
    g, faceCenter: new THREE.Vector3(0, fy, surfZ(fy) + 2), crackCenter: new THREE.Vector3(0, sy, surfZ(sy)), slabCenter: slabHome.clone(),
    setFace(gl, t) { glow = gl; talk = t; face.draw(); },
    setCrack(k) { crack.draw(k); },
    slip() {},
  };
}
