// Neon night city (episode 4 "Pineapple Crime"). Street along -z: road x -8..8 (wet, reflective), sidewalks
// x 8..13, buildings from |x| = 13. Tall towers with lit window grids, neon shop signs, fire escapes, AC units,
// billboards, steam vents, overhead cables with lanterns. Pizza shop "SLICE PALACE" front at (-13, z -40) with a
// pizzeria interior set (kept at x 1000) including the fridge that swings open onto a secret pineapple room.
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box } from './town.js';
import { bake } from './world.js';
import { textTex, liveScreen } from './props.js';

let seed = 61;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const NEON = ['#ff3ea5', '#3ef0ff', '#ffd23e', '#8b5cff', '#3eff8b', '#ff6a3e'];
const WALL = [0x2a2440, 0x33284a, 0x1f2a44, 0x3a2a3a, 0x24304a, 0x2c2236];
export const NEON_MATS = [];
const neonMat = (hex, k = 2.2) => { const m = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: 0.4 }); NEON_MATS.push([m, k]); return m; };
/** 0 = city dark (lights out), 1 = full neon */
export function setNeon(k) { for (const [m, base] of NEON_MATS) m.emissiveIntensity = base * k; }

const wetRoad = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#1a1826'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 30 + rnd() * 30; g.fillStyle = `rgba(${v},${v},${v + 20},.5)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.fillStyle = '#ffd23e'; g.fillRect(w / 2 - 6, 40, 12, 180); g.fillRect(w / 2 - 6, 300, 12, 180);
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(120,140,200,${0.08 + rnd() * 0.1})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 50, 10 + rnd() * 18, 0, 0, 7); g.fill(); } // puddles
}, [1, 14]);
const pavement = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3a3448'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2436'; g.lineWidth = 4;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
}, [2, 40]);
const windows = (lit) => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#000000'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) if (rnd() < lit) { g.fillStyle = pick(['#ffd9a0', '#ffe8c0', '#a0d8ff', '#ff9ad5', '#ffc870']); g.fillRect(c * 42 + 8, r * 32 + 6, 26, 18); }
});
const facadeTex = () => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#3a3450'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) { g.fillStyle = '#1c1a2a'; g.fillRect(c * 42 + 6, r * 32 + 4, 30, 22); g.fillStyle = '#4a4466'; g.fillRect(c * 42 + 6, r * 32 + 26, 30, 3); }
});

function tower(p, x, z, w, h, side) {
  const d = 14, wall = std(pick(WALL), { roughness: 0.8 });
  const front = new THREE.MeshStandardMaterial({ map: facadeTex(), emissive: 0xffffff, emissiveMap: windows(0.45), emissiveIntensity: 0.9, roughness: 0.7 });
  NEON_MATS.push([front, 0.9]);
  front.map.repeat.set(Math.max(1, Math.round(w / 8)), Math.max(1, Math.round(h / 16))); front.map.wrapS = front.map.wrapT = THREE.RepeatWrapping;
  front.emissiveMap.repeat.copy(front.map.repeat); front.emissiveMap.wrapS = front.emissiveMap.wrapT = THREE.RepeatWrapping;
  const mats = side > 0 ? [wall, front, wall, wall, wall, wall] : [front, wall, wall, wall, wall, wall];
  const b = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), mats); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; p.add(b);
  const fx = x - side * (d / 2 + 0.05);
  // ground-floor shop: dark glass + neon sign + awning
  box(0.2, 4.2, w * 0.8, new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.1, metalness: 0.4 }), fx, 2.3, z, p);
  const col = pick(NEON);
  const words = pick(['NOODLES', 'ARCADE', 'LAUNDRY', 'KARAOKE', 'DONUTS', 'TACOS', 'COMICS', 'SUSHI', 'BUBBLE TEA', 'PHONES', 'RAMEN', 'GAMES']);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.8, 9), 1.6), (() => { const t = textTex([words], { w: 1024, h: 180, bg: '#140f22', fg: col, radius: 30, border: col }); const m = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.6 }); NEON_MATS.push([m, 1.6]); return m; })());
  sign.position.set(fx - side * 0.12, 5.4, z); sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; p.add(sign);
  box(1.6, 0.2, w * 0.7, std(pick([0x8b2a5a, 0x2a5a8b, 0x5a2a8b])), fx - side * 0.8, 4.5, z, p).rotation.z = side * 0.25;
  // vertical blade sign
  if (rnd() < 0.6) { const vb = box(0.4, 7, 1.4, neonMat(new THREE.Color(pick(NEON)).getHex(), 1.8), fx - side * 1.2, 11, z + w * 0.3, p); vb.castShadow = false; }
  // fire escape
  if (rnd() < 0.55) for (let f = 1; f < Math.min(6, h / 6); f++) { const y = 6 + f * 5; box(1.4, 0.15, w * 0.4, std(0x1c1c24, { metalness: 0.6 }), fx - side * 0.75, y, z - w * 0.15, p); box(0.1, 1.1, w * 0.4, std(0x1c1c24, { metalness: 0.6 }), fx - side * 1.4, y + 0.55, z - w * 0.15, p); }
  // AC units and roof clutter
  for (let k = 0; k < 3; k++) if (rnd() < 0.5) box(0.9, 0.9, 1.3, std(0x8a8aa0), fx - side * 0.5, 8 + rnd() * (h - 12), z + (rnd() - 0.5) * w * 0.7, p);
  box(3, 3, 3, std(0x4a4a5a), x + side * 2, h + 1.5, z, p);
  if (rnd() < 0.35) { const bb = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), (() => { const t = textTex([pick(['PINEAPPLE', 'NO PINEAPPLE!', 'SAY NO', 'EAT PLAIN'])], { w: 1024, h: 512, bg: '#1a0f2a', fg: pick(NEON), radius: 20 }); const m = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.2, side: THREE.DoubleSide }); NEON_MATS.push([m, 1.2]); return m; })()); bb.position.set(x, h + 6, z); bb.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; p.add(bb); box(0.4, 6, 0.4, std(0x1c1c24), x, h + 3, z, p); }
}

export function buildNeon(scene) {
  seed = 61;
  const T = new THREE.Group(); scene.add(T);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 300), new THREE.MeshStandardMaterial({ map: wetRoad(), roughness: 0.18, metalness: 0.55 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -100); road.receiveShadow = true; T.add(road);
  [-1, 1].forEach((s) => { const sw = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 300), new THREE.MeshStandardMaterial({ map: pavement(), roughness: 0.4, metalness: 0.3 })); sw.position.set(s * 10.5, 0.15, -100); sw.receiveShadow = true; T.add(sw); });
  const tmp = new THREE.Group();
  [-1, 1].forEach((s) => { let z = 30; while (z > -200) { const w = 10 + rnd() * 6, h = 26 + rnd() * 50; if (!(s < 0 && z - w / 2 < -32 && z - w / 2 > -50)) tower(tmp, s * (13 + 7), z - w / 2, w, h, s); z -= w + 0.4; } });
  // far skyline
  for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 400, z = -230 - rnd() * 180, w = 12 + rnd() * 18, h = 60 + rnd() * 120; tower(tmp, x, z, w, h, x > 0 ? 1 : -1); }
  // street furniture: lamps (magenta/cyan heads), bins, hydrants, vents, phone booth, bike rack
  for (let z = 20; z > -190; z -= 18) [-1, 1].forEach((s) => {
    box(0.25, 8, 0.25, std(0x1c1c24, { metalness: 0.6 }), s * 8.6, 4, z + s * 9, tmp); box(1.8, 0.2, 0.25, std(0x1c1c24), s * 7.8, 8, z + s * 9, tmp);
    box(0.9, 0.3, 0.6, neonMat(s > 0 ? 0xff3ea5 : 0x3ef0ff, 2.5), s * 7, 7.8, z + s * 9, tmp);
  });
  for (let z = 10; z > -180; z -= 23) { box(0.9, 1.4, 0.9, std(0x2f6b5a), 11.6, 1.0, z, tmp); box(1.2, 0.5, 1.2, std(0x5a5a6a), -11.4, 0.4, z - 9, tmp); }
  // overhead cables with paper lanterns
  for (let z = 0; z > -160; z -= 26) { box(26, 0.05, 0.05, std(0x111111), 0, 14 + Math.sin(z) * 0.5, z, tmp); for (let x = -9; x <= 9; x += 3) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), neonMat(new THREE.Color(pick(['#ff5a5a', '#ffd23e', '#ff3ea5'])).getHex(), 1.6)); l.position.set(x, 13.3 - Math.abs(x) * 0.04, z); tmp.add(l); } }
  // pizza shop front (left side, z -32 .. -50): brick, big neon slice sign, window, door
  const P = new THREE.Group(); P.position.set(-20, 0, -41); tmp.add(P);
  const brick = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#5a2a2a'; g.fillRect(0, 0, 128, 128); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { g.fillStyle = (r + c) % 3 ? '#8a3a32' : '#7a3028'; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } }, [3, 6]), roughness: 0.9 });
  box(14, 22, 18, brick, 0, 11, 0, P);
  box(0.2, 4.2, 9, new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb860, emissiveIntensity: 0.7 }), 7.05, 2.6, -2.5, P);
  box(0.25, 4.6, 2.6, std(0x2b2f45), 7.06, 2.3, 5, P);
  const sliceSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.6), (() => { const t = textTex(['SLICE PALACE'], { w: 1024, h: 260, bg: '#1a0f12', fg: '#ffd23e', radius: 30, border: '#ff6a3e' }); const m = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.8 }); NEON_MATS.push([m, 1.8]); return m; })());
  sliceSign.position.set(7.15, 6.6, 0); sliceSign.rotation.y = Math.PI / 2; P.add(sliceSign);
  const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(2.4, 1.2); tri.lineTo(0, 2.4); tri.closePath();
  const sl = new THREE.Mesh(new THREE.ShapeGeometry(tri), neonMat(0xffb23e, 2)); sl.position.set(7.2, 9, -1.2); sl.rotation.y = Math.PI / 2; P.add(sl);
  box(2.4, 0.25, 12, std(0x2a5a3a), 7.9, 4.7, -1, P).rotation.z = -0.25;
  const baked = bake(tmp); scene.add(baked);
  // steam vents (animated by the episode with the life kit's smoke)
  const vents = [[-6.5, 0.1, -96], [6.5, 0.1, -128], [-6.5, 0.1, -160]].map((v) => new THREE.Vector3(...v));
  return { T, vents, shopDoor: new THREE.Vector3(-12.9, 0, -36) };
}

/** pizzeria interior: open toward +z. Fridge on the back wall swings open onto the pineapple room behind it. */
export function pizzeria(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const W = 22, D = 16, H = 9;
  const tile = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#f2ece0' : '#2a2a3a'; c.fillRect(i * 32, j * 32, 32, 32); } }, [8, 6]), roughness: 0.6 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), tile); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wallM = std(0xd96a4a);
  box(W, H, 0.4, wallM, 0, H / 2, -D / 2, g); box(0.4, H, D, wallM, -W / 2, H / 2, 0, g); box(0.4, H, D, wallM, W / 2, H / 2, 0, g); box(W, 0.4, D, std(0x2a2430), 0, H, 0, g);
  box(W, 2.2, 0.42, std(0xf2ece0), 0, 1.1, -D / 2 + 0.02, g); // wainscot
  // counter, ovens, menu board, booths, hanging lamps
  box(10, 2.6, 2.2, std(0x6b3f24), -3, 1.3, -3.5, g); box(10.4, 0.25, 2.6, std(0x2a2430), -3, 2.72, -3.5, g);
  [-7, -3.2].forEach((ox) => { box(3.4, 3.2, 1.8, std(0x8a8a96, { metalness: 0.5 }), ox, 4.8, -7.2, g); box(2.4, 0.9, 0.1, new THREE.MeshStandardMaterial({ color: 0xff8a3e, emissive: 0xff6a1e, emissiveIntensity: 1.4 }), ox, 4.6, -6.28, g); });
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6), new THREE.MeshStandardMaterial({ map: textTex(['MENU', 'CHEESE  $3   PEPPERONI  $4', 'PINEAPPLE  ???'], { w: 1024, h: 440, bg: '#1b1b24', fg: '#ffffff', sizes: [90, 50, 60] }) })); menu.position.set(5, 6.4, -D / 2 + 0.25); g.add(menu);
  [[6, -1], [6, 3.5]].forEach(([bx, bz]) => { box(5, 1.2, 1.2, std(0xc8343f), bx, 1.6, bz - 1.4, g); box(5, 1.2, 1.2, std(0xc8343f), bx, 1.6, bz + 1.4, g); box(4.6, 0.2, 1.8, std(0xf2ece0), bx, 2.6, bz, g); box(0.4, 2.5, 0.4, std(0x2a2430), bx, 1.25, bz, g); });
  for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.8, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f6b5a, emissive: 0xffd9a0, emissiveIntensity: 0.4, side: THREE.DoubleSide })); l.position.set(-8 + i * 5, H - 1.4, 0); g.add(l); }
  const pl = new THREE.PointLight(0xffd0a0, 60, 30, 1.4); pl.position.set(0, H - 1, 0); g.add(pl);
  // the fridge on the back wall (hinge on its left edge) and the hidden pineapple room behind it
  const FR = new THREE.Group(); FR.position.set(1.4, 0, -D / 2 + 1.0); g.add(FR);
  const hinge = new THREE.Group(); hinge.position.set(-1.4, 0, 0.6); FR.add(hinge);
  const door = box(2.8, 6.2, 0.5, std(0xe6eef6, { metalness: 0.3, roughness: 0.3 }), 1.4, 3.1, 0, hinge, 0.1);
  box(0.15, 2, 0.25, std(0x8a8a96, { metalness: 0.7 }), 2.5, 3.4, 0.3, hinge);
  const hole = box(2.6, 6, 0.1, new THREE.MeshBasicMaterial({ color: 0x0a0812 }), 1.4 - 1.4, 3.05, -0.05, FR);
  // secret room behind the back wall (z -D/2 - 6), glowing yellow, crates of pineapples
  const SR = new THREE.Group(); SR.position.set(1.4, 0, -D / 2 - 5); g.add(SR);
  box(10, 8, 0.4, std(0x3a2a4a), 0, 4, -4.8, SR); box(0.4, 8, 10, std(0x3a2a4a), -5, 4, 0, SR); box(0.4, 8, 10, std(0x3a2a4a), 5, 4, 0, SR);
  const pine = (px, py, pz) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), std(0xf2b23e)); b.scale.y = 1.3; b.position.set(px, py, pz); SR.add(b); for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 5), std(0x2f8f3a)); l.position.set(px + Math.sin(k * 1.3) * 0.12, py + 0.85, pz + Math.cos(k * 1.3) * 0.12); l.rotation.z = Math.sin(k * 1.3) * 0.4; SR.add(l); } };
  for (let i = 0; i < 4; i++) { box(2.2, 1.2, 1.6, std(0x9a6a3a), -3 + i * 2.2, 0.6, -3.6, SR); for (let k = 0; k < 3; k++) pine(-3.6 + i * 2.2 + k * 0.6, 1.6, -3.6); }
  const glow = new THREE.PointLight(0xffd23e, 0, 16, 1.4); glow.position.set(0, 5, -1); SR.add(glow);
  return { g, hinge, glow, pl, setFridge(k) { hinge.rotation.y = -k * 1.9; glow.intensity = k * 80; } };
}

/** a single pineapple prop (for hands, slices, evidence) */
export function pineapple(parent) {
  const g = new THREE.Group(); parent.add(g);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), std(0xf2b23e)); b.scale.y = 1.3; g.add(b);
  for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 5), std(0x2f8f3a)); l.position.set(Math.sin(k) * 0.12, 0.9, Math.cos(k) * 0.12); l.rotation.z = Math.sin(k) * 0.4; g.add(l); }
  return g;
}
/** pizza slice with optional pineapple bits */
export function slice(parent, pine = true) {
  const g = new THREE.Group(); parent.add(g);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-0.8, 1.8); s.quadraticCurveTo(0, 2.1, 0.8, 1.8); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
  const m = new THREE.Mesh(geo, std(0xffc85a)); m.rotation.x = -Math.PI / 2; g.add(m);
  const crust = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.12, 6, 12, 1.2), std(0xc8843a)); crust.rotation.set(-Math.PI / 2, 0, Math.PI / 2 - 0.6); crust.position.set(0, 0.1, -1.6); g.add(crust);
  if (pine) for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), std(0xffe066)); p.position.set((i % 2 - 0.5) * 0.4, 0.17, -0.5 - i * 0.28); g.add(p); }
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10), std(0xc8343f)); p.position.set((i - 1) * 0.3, 0.16, -0.9 - (i % 2) * 0.4); g.add(p); }
  return g;
}
