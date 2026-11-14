// Neon night city (episode 4 "Pineapple Crime"), built in METRES to match the CC0 characters (1.75 m) and cars.
// Road x -5..5 (10 m, wet and reflective), sidewalks x 5..8.5 (top 0.15), building fronts at |x| = 8.5.
// Floors are 3.2 m, so towers read as real buildings next to people. The SLICE PALACE pizza shop stands alone
// (left side, z -30..-44), and the giant street screen has its own clean tower (right side, z -8..-28).
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box } from './town.js';
import { bake } from './world.js';
import { textTex } from './props.js';

let seed = 61;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const NEON = ['#ff3ea5', '#3ef0ff', '#ffd23e', '#8b5cff', '#3eff8b', '#ff6a3e'];
const WALL = [0x2a2440, 0x33284a, 0x1f2a44, 0x3a2a3a, 0x24304a, 0x2c2236];
export const NEON_MATS = [];
const glowM = (m, k) => { NEON_MATS.push([m, k]); return m; };
const neonMat = (hex, k = 2.2) => glowM(new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: 0.4 }), k);
const signMat = (t, k = 1.6) => glowM(new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, side: THREE.DoubleSide }), k);
/** 0 = city dark, 1 = full neon */
export function setNeon(k) { for (const [m, base] of NEON_MATS) m.emissiveIntensity = base * k; }
export const ROAD = 5, FRONT = 8.5, SWY = 0.15;

const wetRoad = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#1a1826'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 30 + rnd() * 30; g.fillStyle = `rgba(${v},${v},${v + 20},.5)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.fillStyle = '#ffd23e'; g.fillRect(w / 2 - 5, 30, 10, 170); g.fillRect(w / 2 - 5, 290, 10, 170);
  g.fillStyle = '#e9edf5'; g.fillRect(10, 0, 8, h); g.fillRect(w - 18, 0, 8, h);
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(120,140,200,${0.08 + rnd() * 0.1})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 50, 10 + rnd() * 18, 0, 0, 7); g.fill(); }
}, [1, 24]);
const pavement = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3a3448'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2436'; g.lineWidth = 5;
  for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
}, [1.75, 150]);
const windowsLit = () => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) if (rnd() < 0.45) { g.fillStyle = pick(['#ffd9a0', '#ffe8c0', '#a0d8ff', '#ff9ad5', '#ffc870']); g.fillRect(c * 42 + 9, r * 32 + 8, 24, 17); }
});
const facadeTex = () => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#3a3450'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) { g.fillStyle = '#1c1a2a'; g.fillRect(c * 42 + 7, r * 32 + 6, 28, 21); g.fillStyle = '#4a4466'; g.fillRect(c * 42 + 5, r * 32 + 27, 32, 3); }
});
const FLOOR = 3.2, COL = 1.6; // one texture tile = 16 floors x 6 window columns

function tower(p, x, z, w, h, side, { clean = false } = {}) {
  const d = 12, wall = std(pick(WALL), { roughness: 0.8 });
  const map = facadeTex(), em = windowsLit();
  [map, em].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / (6 * COL), (h - 4) / (16 * FLOOR)); t.offset.set(0, 0); });
  const front = glowM(new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 0.9, roughness: 0.7 }), 0.9);
  // upper floors (textured), ground floor (shop) separate so windows never sit at street level
  const up = new THREE.Mesh(new THREE.BoxGeometry(d, h - 4, w), side > 0 ? [wall, front, wall, wall, wall, wall] : [front, wall, wall, wall, wall, wall]);
  up.position.set(x, 4 + (h - 4) / 2, z); up.castShadow = up.receiveShadow = true; p.add(up);
  box(d, 4, w, std(0x1c1a2a), x, 2, z, p);
  const fx = x - side * (d / 2 + 0.02);
  box(0.12, 0.25, w + 0.1, std(0x4a4466), fx, 4, z, p); // ledge
  if (clean) return;
  // shop front: glass, neon sign, awning, door
  box(0.1, 2.6, w * 0.62, new THREE.MeshStandardMaterial({ color: 0x0c0a18, roughness: 0.08, metalness: 0.5, emissive: 0x2a1840, emissiveIntensity: 0.6 }), fx - side * 0.02, 1.6, z - w * 0.12, p);
  box(0.12, 2.3, 1.1, std(0x2b2f45), fx - side * 0.03, 1.3, z + w * 0.34, p);
  const col = pick(NEON), word = pick(['NOODLES', 'ARCADE', 'LAUNDRY', 'KARAOKE', 'DONUTS', 'TACOS', 'COMICS', 'SUSHI', 'BUBBLE TEA', 'PHONES', 'RAMEN', 'GAMES']);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.7, 6), 0.8), signMat(textTex([word], { w: 1024, h: 150, bg: '#140f22', fg: col, radius: 30, border: col }), 1.7));
  sg.position.set(fx - side * 0.06, 3.35, z); sg.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; p.add(sg);
  box(1.1, 0.08, w * 0.62, std(pick([0x8b2a5a, 0x2a5a8b, 0x5a2a8b])), fx - side * 0.55, 2.95, z - w * 0.12, p).rotation.z = side * 0.3;
  if (rnd() < 0.6) box(0.18, 3.2, 0.7, neonMat(new THREE.Color(pick(NEON)).getHex(), 1.8), fx - side * 0.5, 6.2, z + w * 0.3, p);
  // fire escape (one platform per floor) and AC units
  if (rnd() < 0.55) for (let f = 2; f < Math.min(7, (h - 2) / FLOOR); f++) { const y = f * FLOOR; box(0.9, 0.08, w * 0.35, std(0x1c1c24, { metalness: 0.6 }), fx - side * 0.45, y, z - w * 0.18, p); box(0.05, 0.9, w * 0.35, std(0x1c1c24, { metalness: 0.6 }), fx - side * 0.9, y + 0.45, z - w * 0.18, p); }
  for (let k = 0; k < 3; k++) if (rnd() < 0.5) box(0.5, 0.45, 0.7, std(0x8a8aa0), fx - side * 0.25, 5 + rnd() * (h - 8), z + (rnd() - 0.5) * w * 0.7, p);
  box(1.6, 1.6, 1.6, std(0x4a4a5a), x + side * 2, h + 0.8, z, p);
  if (rnd() < 0.3) { const bb = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), signMat(textTex([pick(['NO PINEAPPLE!', 'SAY NO', 'EAT PLAIN', 'PIZZA POLICE'])], { w: 1024, h: 512, bg: '#1a0f2a', fg: pick(NEON), radius: 20 }), 1.2)); bb.position.set(x, h + 3.5, z); bb.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; p.add(bb); box(0.2, 3.5, 0.2, std(0x1c1c24), x, h + 1.75, z, p); }
}

/** builds the street. Returns anchors the episode uses. */
export function buildNeon(scene) {
  seed = 61;
  const T = new THREE.Group(); scene.add(T);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 300), new THREE.MeshStandardMaterial({ map: wetRoad(), roughness: 0.18, metalness: 0.55 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.005, -100); road.receiveShadow = true; T.add(road);
  [-1, 1].forEach((s) => { const sw = new THREE.Mesh(new THREE.BoxGeometry(3.5, SWY, 300), new THREE.MeshStandardMaterial({ map: pavement(), roughness: 0.45, metalness: 0.25 })); sw.position.set(s * 6.75, SWY / 2, -100); sw.receiveShadow = true; T.add(sw); box(0.12, SWY + 0.02, 300, std(0x8a8aa0), s * 5.03, SWY / 2, -100, T); });
  const tmp = new THREE.Group();
  const SHOP = [-44, -30], SCREEN = [-28, -8]; // z spans reserved (left shop, right screen tower)
  [-1, 1].forEach((s) => {
    let z = 30;
    while (z > -230) {
      const w = 8 + rnd() * 6, h = 18 + Math.floor(rnd() * 12) * FLOOR, z0 = z, z1 = z - w;
      const res = s < 0 ? SHOP : SCREEN;
      if (z0 > res[1] && z1 < res[1]) { const ww = z0 - res[1] - 0.3; if (ww > 4) tower(tmp, s * (FRONT + 6), z0 - ww / 2, ww, h, s); z = res[0] - 0.3; continue; } // trim at the reserved lot
      if (z1 < res[1] && z0 > res[0]) { z = res[0] - 0.3; continue; } // never overlap the reserved lots
      tower(tmp, s * (FRONT + 6), z - w / 2, w, h, s); z = z1 - 0.3;
    }
  });
  // the screen tower (clean face, no signs or fire escapes in front of the screen)
  tower(tmp, FRONT + 6, (SCREEN[0] + SCREEN[1]) / 2, SCREEN[1] - SCREEN[0] - 0.2, 32, 1, { clean: true });
  // far skyline
  for (let i = 0; i < 46; i++) { const x = (rnd() - 0.5) * 260, z = -170 - rnd() * 140, w = 10 + rnd() * 14, h = 40 + rnd() * 90; tower(tmp, x, z, w, h, x > 0 ? 1 : -1, { clean: true }); }
  // street lamps (6 m), bins, hydrants, overhead lantern cables
  for (let z = 20; z > -190; z -= 18) [-1, 1].forEach((s) => {
    const zz = z + s * 9; if (s > 0 && zz < -6 && zz > -30) return; // keep the screen view clear
    box(0.14, 6, 0.14, std(0x1c1c24, { metalness: 0.6 }), s * 7.9, 3, zz, tmp); box(1.3, 0.1, 0.14, std(0x1c1c24), s * 7.3, 6, zz, tmp);
    box(0.55, 0.18, 0.35, neonMat(s > 0 ? 0xff3ea5 : 0x3ef0ff, 2.5), s * 6.7, 5.9, zz, tmp);
  });
  for (let z = 6; z > -180; z -= 23) { if (!(z < -26 && z > -48)) box(0.55, 0.9, 0.55, std(0x2f6b5a), -7.9, SWY + 0.45, z, tmp); box(0.3, 0.75, 0.3, std(0xc8343f), 7.95, SWY + 0.37, z - 11, tmp); }
  for (let z = 4; z > -170; z -= 30) { if (z < -6 && z > -30) continue; box(17, 0.03, 0.03, std(0x111111), 0, 7.2, z, tmp); for (let x = -7.5; x <= 7.5; x += 1.5) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), neonMat(new THREE.Color(pick(['#ff5a5a', '#ffd23e', '#ff3ea5'])).getHex(), 1.6)); l.position.set(x, 6.8 - Math.abs(x) * 0.03, z); tmp.add(l); } }
  // SLICE PALACE: 3-storey brick shop on its own lot, front at x -8.5, z -30 .. -44
  const P = new THREE.Group(); P.position.set(-FRONT - 6, 0, (SHOP[0] + SHOP[1]) / 2); tmp.add(P);
  const brick = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#4a2420'; g.fillRect(0, 0, 128, 128); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { g.fillStyle = (r + c) % 3 ? '#8a3a32' : '#7a3028'; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } }, [5, 4]), roughness: 0.9 });
  box(12, 10, 13.6, brick, 0, 5, 0, P);
  box(0.14, 2.5, 6.3, std(0x2b1810), 6.03, 1.55, -1.6, P); // window frame (front face 6.10)
  box(0.04, 2.3, 6, new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb860, emissiveIntensity: 0.8 }), 6.16, 1.55, -1.6, P); // big window, 4 cm proud of the frame (no z-fighting)
  box(0.1, 2.3, 1.2, std(0x2b2f45), 6.03, 1.3, 4.8, P); // door at world z about -32.2
  for (let f = 1; f < 3; f++) for (let k = -2; k <= 2; k++) { box(0.1, 1.4, 1.1, new THREE.MeshStandardMaterial({ color: 0x2a1c30, emissive: 0xffc870, emissiveIntensity: f === 1 && k % 2 ? 0.6 : 0.1 }), 6.02, f * 3.3 + 1.6, k * 2.5, P); box(0.3, 0.12, 1.3, std(0xc8b8a0), 6.1, f * 3.3 + 0.85, k * 2.5, P); }
  const pal = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.3), signMat(textTex(['SLICE PALACE'], { w: 1024, h: 210, bg: '#1a0f12', fg: '#ffd23e', radius: 30, border: '#ff6a3e' }), 1.9));
  pal.position.set(6.1, 3.5, -1.2); pal.rotation.y = Math.PI / 2; P.add(pal);
  const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(1.4, 0.7); tri.lineTo(0, 1.4); tri.closePath();
  const sl = new THREE.Mesh(new THREE.ShapeGeometry(tri), neonMat(0xffb23e, 2)); sl.position.set(6.12, 4.5, 3.2); sl.rotation.y = Math.PI / 2; P.add(sl);
  box(1.3, 0.08, 7, std(0x2a5a3a), 6.6, 2.85, -1.6, P).rotation.z = -0.3;
  const baked = bake(tmp); scene.add(baked);
  return {
    T,
    vents: [[-3, 0.05, -60], [3, 0.05, -95], [-3, 0.05, -130]].map((v) => new THREE.Vector3(...v)),
    shopDoor: new THREE.Vector3(-FRONT - 0.4, SWY, -32.2),
    screen: { x: FRONT - 0.05, y: 8.6, z: (SCREEN[0] + SCREEN[1]) / 2, w: 11, h: 6.2 },
  };
}

/** pizzeria interior (metres), open toward +z. Fridge on the back wall swings open onto the secret pineapple room. */
export function pizzeria(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const W = 10, D = 8, H = 3.4;
  const tile = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#f2ece0' : '#2a2a3a'; c.fillRect(i * 32, j * 32, 32, 32); } }, [6, 5]), roughness: 0.6 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), tile); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wallM = std(0xd96a4a);
  // back wall with a doorway hidden behind the fridge (x 0.1 .. 1.1, up to 2.1 m)
  const HL = 0.1, HR = 1.1, HT = 2.1;
  box(HL + W / 2, H, 0.2, wallM, (-W / 2 + HL) / 2, H / 2, -D / 2, g); box(W / 2 - HR, H, 0.2, wallM, (HR + W / 2) / 2, H / 2, -D / 2, g); box(HR - HL, H - HT, 0.2, wallM, (HL + HR) / 2, (HT + H) / 2, -D / 2, g);
  box(0.2, H, D, wallM, -W / 2, H / 2, 0, g); box(0.2, H, D, wallM, W / 2, H / 2, 0, g); box(W, 0.2, D, std(0x2a2430), 0, H, 0, g);
  box(HL + W / 2, 1.0, 0.22, std(0xf2ece0), (-W / 2 + HL) / 2, 0.5, -D / 2 + 0.01, g); box(W / 2 - HR, 1.0, 0.22, std(0xf2ece0), (HR + W / 2) / 2, 0.5, -D / 2 + 0.01, g);
  // counter + register, ovens, menu, photos, plant
  box(3.6, 1.0, 0.8, std(0x6b3f24), -2.4, 0.5, -1.4, g); box(3.8, 0.06, 0.95, std(0x2a2430), -2.4, 1.03, -1.4, g); box(0.4, 0.3, 0.3, std(0x3a3f52), -1.2, 1.2, -1.4, g);
  [-3.6, -2.0].forEach((ox) => { box(1.3, 1.0, 0.8, std(0x8a8a96, { metalness: 0.5 }), ox, 1.6, -3.5, g); box(0.9, 0.3, 0.05, new THREE.MeshStandardMaterial({ color: 0xff8a3e, emissive: 0xff6a1e, emissiveIntensity: 1.4 }), ox, 1.55, -3.08, g); });
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.0), new THREE.MeshStandardMaterial({ map: textTex(['MENU', 'CHEESE $3   PEPPERONI $4', 'PINEAPPLE  ???'], { w: 1024, h: 430, bg: '#1b1b24', fg: '#ffffff', sizes: [90, 50, 60] }) })); menu.position.set(-2.8, 2.6, -D / 2 + 0.12); g.add(menu);
  for (let i = 0; i < 3; i++) box(0.5, 0.4, 0.04, std([0xffd23e, 0x3ef0ff, 0xff3ea5][i]), 3.2 + i * 0.7, 2.4, -D / 2 + 0.12, g);
  // booths (seat 0.45, table 0.75)
  const booths = [];
  [[3.2, 0.6], [3.2, 2.9]].forEach(([bx, bz]) => {
    [-0.75, 0.75].forEach((o) => { box(1.8, 0.45, 0.5, std(0xc8343f), bx, 0.225, bz + o, g); box(1.8, 0.6, 0.15, std(0xc8343f), bx, 0.75, bz + o + Math.sign(o) * 0.25, g); });
    box(1.6, 0.05, 0.7, std(0xf2ece0), bx, 0.75, bz, g); box(0.1, 0.72, 0.1, std(0x2a2430), bx, 0.37, bz, g);
    booths.push(new THREE.Vector3(x + bx, 0, z + bz));
  });
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f6b5a, emissive: 0xffd9a0, emissiveIntensity: 0.5, side: THREE.DoubleSide })); l.position.set(-3 + i * 3, H - 0.5, 0.5); g.add(l); }
  const pl = new THREE.PointLight(0xffd0a0, 14, 14, 1.4); pl.position.set(0, H - 0.4, 0.5); g.add(pl);
  // the fridge (0.9 x 2.0) with its hinge on the left, and the secret room behind the back wall
  const FR = new THREE.Group(); FR.position.set(0.6, 0, -D / 2 + 0.45); g.add(FR);
  const fm = std(0xc8d2dc, { metalness: 0.3, roughness: 0.3 }); // hollow shell, no back: the secret way through
  box(0.06, 2.1, 0.7, fm, -0.47, 1.05, -0.05, FR); box(0.06, 2.1, 0.7, fm, 0.47, 1.05, -0.05, FR); box(1.0, 0.06, 0.7, fm, 0, 2.07, -0.05, FR); box(1.0, 0.04, 0.7, fm, 0, 0.02, -0.05, FR);
  const hinge = new THREE.Group(); hinge.position.set(-0.45, 0, 0.32); FR.add(hinge);
  box(0.9, 2.0, 0.08, std(0xe6eef6, { metalness: 0.3, roughness: 0.3 }), 0.45, 1.05, 0, hinge, 0.02);
  box(0.05, 0.8, 0.08, std(0x8a8a96, { metalness: 0.7 }), 0.82, 1.2, 0.08, hinge);
  const SR = new THREE.Group(); SR.position.set(0.6, 0, -D / 2 - 1.8); g.add(SR);
  box(4, 3, 0.2, std(0x3a2a4a), 0, 1.5, -1.6, SR); box(0.2, 3, 3.4, std(0x3a2a4a), -2, 1.5, 0, SR); box(0.2, 3, 3.4, std(0x3a2a4a), 2, 1.5, 0, SR); box(4, 0.2, 3.4, std(0x3a2a4a), 0, 3, 0, SR);
  const flr = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.4), std(0x6a4a3a)); flr.rotation.x = -Math.PI / 2; flr.position.y = 0.01; SR.add(flr);
  for (let i = 0; i < 3; i++) { box(0.9, 0.5, 0.6, std(0x9a6a3a), -1.2 + i * 1.1, 0.25, -1.1, SR); for (let k = 0; k < 2; k++) { const p = pineapple(SR); p.scale.setScalar(0.32); p.position.set(-1.4 + i * 1.1 + k * 0.4, 0.62, -1.1); } }
  const glow = new THREE.PointLight(0xffd23e, 0, 6, 1.4); glow.position.set(0, 2.2, -0.3); SR.add(glow);
  // ---- dressing: stools, pizza boxes, soda fridge, shelves, plants, condiments, clock, neon sign, gumball machine
  const cy = (rt, rb, h, m, px, py, pz, seg = 16) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(px, py, pz); c.castShadow = c.receiveShadow = true; g.add(c); return c; };
  const chrome = std(0xb8bcc8, { metalness: 0.8, roughness: 0.25 }), red = std(0xc8343f), cream = std(0xf2ece0);
  for (const sx of [-3.7, -2.9, -2.1, -1.3]) { cy(0.04, 0.05, 0.7, chrome, sx, 0.35, -0.55); cy(0.2, 0.2, 0.08, red, sx, 0.74, -0.55, 20); cy(0.18, 0.22, 0.03, chrome, sx, 0.015, -0.55, 20); }
  for (let k = 0; k < 6; k++) box(0.45, 0.06, 0.45, std(k % 2 ? 0xf2ece0 : 0xe8dcc6), -3.9, 1.09 + k * 0.065, -1.35, g); // pizza box stack
  box(0.35, 0.25, 0.25, std(0x3a3f52), -0.9, 1.19, -1.5, g); // till
  for (let k = 0; k < 3; k++) cy(0.05, 0.05, 0.16, std([0xc8343f, 0xf2c14e, 0x2f8f3a][k]), -1.6 - k * 0.14, 1.14, -1.75, 10); // sauce bottles
  // soda fridge on the right wall: glass door with rows of coloured bottles
  const SF = new THREE.Group(); SF.position.set(W / 2 - 0.5, 0, -2.4); g.add(SF);
  box(0.8, 2.0, 0.9, std(0x2b2f45), 0, 1.0, 0, SF); box(0.04, 1.7, 0.75, new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x8fd0ff, emissiveIntensity: 0.35, transparent: true, opacity: 0.35 }), -0.42, 1.05, 0, SF);
  for (let r = 0; r < 4; r++) { box(0.6, 0.03, 0.75, chrome, -0.05, 0.35 + r * 0.42, 0, SF); for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8), std([0xc8343f, 0x3ef0ff, 0xffd23e, 0x3eff8b][(r + k) % 4], { roughness: 0.3 })); b.position.set(-0.25, 0.49 + r * 0.42, -0.3 + k * 0.12); SF.add(b); } }
  box(0.06, 0.25, 0.75, new THREE.MeshStandardMaterial({ color: 0xff3ea5, emissive: 0xff3ea5, emissiveIntensity: 1.2 }), -0.41, 1.88, 0, SF);
  // wall shelf with jars and a radio between the back-wall photos and the booths
  box(1.6, 0.05, 0.3, std(0x6b3f24), 3.6, 1.55, -D / 2 + 0.25, g);
  for (let k = 0; k < 5; k++) cy(0.07, 0.07, 0.2 + (k % 2) * 0.08, std([0xf2b23e, 0xc8343f, 0x2f8f3a, 0xe8dcc6, 0x8b5cff][k]), 2.95 + k * 0.32, 1.68 + (k % 2) * 0.04, -D / 2 + 0.25, 10);
  // wall clock and a neon slice on the right wall
  const clock = cy(0.3, 0.3, 0.06, cream, W / 2 - 0.13, 2.6, 1.6, 24); clock.rotation.z = Math.PI / 2;
  box(0.02, 0.22, 0.03, std(0x111111), W / 2 - 0.16, 2.66, 1.6, g); box(0.02, 0.03, 0.16, std(0x111111), W / 2 - 0.16, 2.6, 1.66, g);
  const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(0.9, 0.45); tri.lineTo(0, 0.9); tri.closePath();
  const ns = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshStandardMaterial({ color: 0xffb23e, emissive: 0xffb23e, emissiveIntensity: 1.6, side: THREE.DoubleSide })); ns.position.set(W / 2 - 0.12, 1.6, 0.2); ns.rotation.y = -Math.PI / 2; g.add(ns);
  // condiments, napkin holders and cups on both booth tables
  [[3.2, 0.6], [3.2, 2.9]].forEach(([bx, bz]) => {
    box(0.12, 0.12, 0.08, chrome, bx + 0.55, 0.84, bz, g); cy(0.035, 0.035, 0.16, red, bx + 0.42, 0.86, bz + 0.1, 10); cy(0.035, 0.035, 0.16, std(0xf2c14e), bx + 0.42, 0.86, bz - 0.1, 10);
    cy(0.05, 0.04, 0.13, std(0xffffff), bx - 0.55, 0.84, bz + 0.18, 12); cy(0.05, 0.04, 0.13, std(0x3ef0ff), bx - 0.55, 0.84, bz - 0.2, 12);
  });
  // potted plants and a gumball machine by the entrance
  for (const [px, pz] of [[-4.5, 3.4], [4.5, 3.6]]) { cy(0.28, 0.22, 0.5, std(0xc8843a), px, 0.25, pz, 16); for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), std(0x2f8f3a)); l.position.set(px + Math.sin(k * 2.4) * 0.18, 0.62 + (k % 3) * 0.18, pz + Math.cos(k * 2.4) * 0.18); l.castShadow = true; g.add(l); } }
  cy(0.12, 0.2, 0.9, red, -4.4, 0.45, 2.2, 16); const gb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.1 })); gb.position.set(-4.4, 1.15, 2.2); g.add(gb);
  for (let k = 0; k < 14; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), std([0xff3ea5, 0xffd23e, 0x3ef0ff, 0x3eff8b][k % 4])); b.position.set(-4.4 + Math.sin(k * 2.1) * 0.13, 1.05 + (k % 4) * 0.06, 2.2 + Math.cos(k * 2.1) * 0.13); g.add(b); }
  // warm string lights sagging across the ceiling, hanging pans over the ovens, a mop bucket by the fridge
  const bulbG = new THREE.SphereGeometry(0.055, 12, 9), bulbM = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc870, emissiveIntensity: 2.2 });
  for (const sz of [-3.3, -1.0, 1.4, 3.4]) { for (let k = 0; k <= 26; k++) { const u = k / 26, px = -4.8 + u * 9.6, py = H - 0.12 - Math.sin(u * Math.PI * 3) ** 2 * 0.35; const b = new THREE.Mesh(bulbG, bulbM); b.position.set(px, py - 0.06, sz); g.add(b); } }
  for (let k = 0; k < 4; k++) { const pan = cy(0.16, 0.12, 0.05, std(0x2a2a30, { metalness: 0.7, roughness: 0.4 }), -4.3 + k * 0.45, 2.75, -3.3, 18); pan.rotation.x = Math.PI / 2; box(0.03, 0.25, 0.03, std(0x2a2a30), -4.3 + k * 0.45, 2.95, -3.3, g); }
  cy(0.22, 0.18, 0.35, std(0xf2c14e), 1.6, 0.18, -3.5, 16); cy(0.015, 0.015, 1.3, std(0x8a6a4a), 1.68, 0.8, -3.5, 6);
  // two round cafe tables with bentwood chairs, a jukebox, and a tiled backsplash behind the ovens
  for (const [tx, tz] of [[-3.0, 2.0], [-0.6, 2.9]]) {
    cy(0.42, 0.42, 0.04, cream, tx, 0.76, tz, 32); cy(0.04, 0.04, 0.72, chrome, tx, 0.38, tz, 10); cy(0.25, 0.28, 0.03, chrome, tx, 0.015, tz, 24);
    for (const a of [0.4, 0.4 + Math.PI]) { const C = new THREE.Group(); C.position.set(tx + Math.sin(a) * 0.62, 0, tz + Math.cos(a) * 0.62); C.rotation.y = a + Math.PI; g.add(C);
      const wood = std(0x6b3f24); const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 24), wood); seat.position.y = 0.46; C.add(seat);
      for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 8), wood); l.position.set(lx, 0.23, lz); C.add(l); }
      const back = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 20, Math.PI), wood); back.position.set(0, 0.62, -0.18); C.add(back);
      for (const bx of [-0.08, 0, 0.08]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), wood); r.position.set(bx, 0.62, -0.18); C.add(r); } }
    cy(0.05, 0.04, 0.13, std(0xffffff), tx + 0.15, 0.85, tz, 12); const pl2 = cy(0.16, 0.16, 0.015, cream, tx - 0.12, 0.79, tz + 0.05, 24);
  }
  const JB = new THREE.Group(); JB.position.set(-W / 2 + 0.45, 0, 0.6); JB.rotation.y = Math.PI / 2; g.add(JB);
  const jb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.55), std(0x6b2a5a)); jb.position.y = 0.6; JB.add(jb);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.55, 28, 1, false, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0xffb23e, emissive: 0xff8a3e, emissiveIntensity: 1.1 })); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI / 2; arch.position.y = 1.2; JB.add(arch);
  for (let k = 0; k < 5; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.02), new THREE.MeshStandardMaterial({ color: 0x3ef0ff, emissive: [0x3ef0ff, 0xff3ea5, 0x3eff8b, 0xffd23e, 0x8b5cff][k], emissiveIntensity: 1.4 })); bar.position.set(-0.24 + k * 0.12, 0.7, 0.28); JB.add(bar); }
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.19, 0.19, 0.03), std(0xe8f0f2, { roughness: 0.3 }), 26 * 6); let ti = 0; const tm = new THREE.Matrix4();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 26; c++) { tm.makeRotationY(Math.PI / 2).setPosition(-W / 2 + 0.115, 1.1 + r * 0.2, -3.75 + c * 0.2); tiles.setMatrixAt(ti++, tm); } // backsplash on the left wall behind the counter
  g.add(tiles);
  // glass pizza display on the counter, flour sacks by the ovens, a chalkboard A-frame at the door
  box(1.5, 0.34, 0.6, new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2 }), -2.7, 1.24, -1.45, g);
  box(1.54, 0.03, 0.64, chrome, -2.7, 1.42, -1.45, g);
  for (let k = 0; k < 3; k++) { const sack = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), std(0xe8dcc6, { roughness: 1 })); sack.scale.set(1, 1.3, 0.75); sack.position.set(-4.55 + (k % 2) * 0.12, 0.3 + Math.floor(k / 2) * 0.45, -2.6 + k * 0.42); sack.castShadow = true; g.add(sack); }
  const AF = new THREE.Group(); AF.position.set(-1.8, 0, 3.4); AF.rotation.y = 0.3; g.add(AF);
  const chalk = new THREE.MeshStandardMaterial({ map: textTex(['TODAY', 'PLAIN CHEESE', '(sigh)'], { w: 512, h: 700, bg: '#1e2a24', fg: '#ffffff', sizes: [90, 56, 50] }) });
  for (const sgn of [1, -1]) { const pnl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.03), [std(0x6b3f24), std(0x6b3f24), std(0x6b3f24), std(0x6b3f24), sgn > 0 ? chalk : std(0x6b3f24), sgn < 0 ? chalk : std(0x6b3f24)]); pnl.position.set(0, 0.42, sgn * 0.14); pnl.rotation.x = sgn * 0.3; AF.add(pnl); }
  return { g, hinge, glow, pl, booths, fridge: new THREE.Vector3(x + 0.6, 0, z - D / 2 + 0.8), counter: new THREE.Vector3(x - 2.4, 0, z - 1.4), setFridge(k) { hinge.rotation.y = -k * 1.9; glow.intensity = k * 9; } };
}

/** a pineapple (about 1.4 units tall at scale 1; scale 0.3 is a real one) */
export function pineapple(parent) {
  const g = new THREE.Group(); parent.add(g);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), std(0xf2b23e)); b.scale.y = 1.3; b.position.y = 0.58; b.castShadow = true; g.add(b);
  for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 5), std(0x2f8f3a)); l.position.set(Math.sin(k) * 0.12, 1.45, Math.cos(k) * 0.12); l.rotation.z = Math.sin(k) * 0.4; g.add(l); }
  return g;
}
/** pizza slice with pineapple bits, about 0.3 m long */
export function slice(parent, pine = true) {
  const outer = new THREE.Group(); parent.add(outer);
  const g = new THREE.Group(); g.scale.setScalar(0.16); outer.add(g);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-0.8, 1.8); s.quadraticCurveTo(0, 2.1, 0.8, 1.8); s.closePath();
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }), std(0xffc85a)); m.rotation.x = -Math.PI / 2; g.add(m);
  const crust = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.12, 6, 12, 1.2), std(0xc8843a)); crust.rotation.set(-Math.PI / 2, 0, Math.PI / 2 - 0.6); crust.position.set(0, 0.1, -1.6); g.add(crust);
  if (pine) for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), std(0xffe066)); p.position.set((i % 2 - 0.5) * 0.4, 0.17, -0.5 - i * 0.28); g.add(p); }
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10), std(0xc8343f)); p.position.set((i - 1) * 0.3, 0.16, -0.9 - (i % 2) * 0.4); g.add(p); }
  return outer;
}
