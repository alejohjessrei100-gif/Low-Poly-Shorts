// Seaside harbor town (episode 2 "Lie Balloons"). Same street footprint as buildTown (road along -z, x -5..5,
// sidewalks x 5..10, buildings from |x| = 10) so shots line up, but everything visible is new: tall gabled row
// houses in harbor colours, cobblestones, lanterns, planters, a quay with piers, boats and a lighthouse to the
// west, a terraced hillside village to the east and behind the town hall, and a sea horizon with cliffs.
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box, car, LAMP_MATS } from './town.js';
import { bake } from './world.js';

let seed = 21;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const HOUSE = ['#2fa7a0', '#f2766b', '#f2c14e', '#3f6fd1', '#f7f3ea', '#8fd1c4', '#e85d75', '#5bbcd6', '#f59e5b'];
const SHUTTER = ['#1f4e79', '#ffffff', '#2f6b5a', '#c8343f', '#f2c14e'];
const ROOF = [0x3a4256, 0xb5523b, 0x2f5f7a, 0x4a3a3a];

const cobble = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8f8578'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = -1; c < 17; c++) {
    const x = c * 16 + (r % 2) * 8, y = r * 16, v = 150 + rnd() * 50;
    g.fillStyle = `rgb(${v},${v - 8},${v - 22})`; g.beginPath(); g.roundRect(x + 1.5, y + 1.5, 13, 13, 4); g.fill();
  }
}, [3, 60]);
const flagstone = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#cfc4b3'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = 200 + rnd() * 30; g.fillStyle = `rgb(${v},${v - 8},${v - 20})`; g.fillRect(c * 64 + 2 + (r % 2) * 20, r * 64 + 2, 60, 60); }
}, [2, 40]);
const waterTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3f9fd8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 20, y); g.stroke(); }
}, [120, 120]);
const rowFacade = (base, shutter, floors, shop) => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.04})`; g.fillRect(rnd() * w, rnd() * h, 5, 3); }
  const top = 24, bottom = shop ? 150 : 40, fh = (h - top - bottom) / floors;
  for (let f = 0; f < floors; f++) for (let c = 0; c < 2; c++) {
    const x = 40 + c * 120, y = top + f * fh + fh * 0.16, ww = 56, hh = fh * 0.62;
    g.fillStyle = shutter; g.fillRect(x - 22, y, 18, hh); g.fillRect(x + ww + 4, y, 18, hh); // shutters
    g.fillStyle = '#ffffff'; g.fillRect(x - 4, y - 4, ww + 8, hh + 8);
    g.fillStyle = '#8cc4ea'; g.fillRect(x, y, ww, hh);
    g.fillStyle = '#ffffff'; g.fillRect(x + ww / 2 - 2, y, 4, hh); g.fillRect(x, y + hh / 2 - 2, ww, 4);
    g.fillStyle = '#7a4a2a'; g.fillRect(x - 6, y + hh + 2, ww + 12, 10); // flower box
    for (let k = 0; k < 6; k++) { g.fillStyle = ['#ff4d6d', '#ffd84d', '#ff8fc8'][k % 3]; g.beginPath(); g.arc(x + 4 + k * 10, y + hh, 5, 0, 7); g.fill(); }
  }
  if (shop) {
    g.fillStyle = '#2b2f45'; g.fillRect(14, h - 140, w - 28, 120);
    g.fillStyle = '#ffe9b8'; g.fillRect(24, h - 128, 140, 96); g.fillStyle = '#6b4a2a'; g.fillRect(180, h - 128, 56, 108);
  } else { g.fillStyle = '#5a3a2a'; g.fillRect(100, h - 120, 56, 100); g.fillStyle = '#f2c14e'; g.fillRect(146, h - 74, 6, 6); }
});
const stripes = (a, b) => canvasTex(128, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 16, 0, 16, h); } });

// prism roof: triangle (span x height) in the Z-Y plane, extruded along X over `depth`
function gable(span, height, depth, wallM, roofM) {
  const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, height); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2); geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, wallM ? [wallM, roofM] : roofM); m.castShadow = m.receiveShadow = true; return m;
}
function rowHouse(p, x, z, w, h, side, shop) { // side +1: house on +x, facade faces -x
  const col = pick(HOUSE), wallM = std(new THREE.Color(col).getHex()), roofM = std(pick(ROOF), { roughness: 0.6 });
  const front = std(0xffffff, { map: rowFacade(col, pick(SHUTTER), Math.max(2, Math.round((h - 3) / 3.2)), shop) });
  const mats = side > 0 ? [wallM, front, wallM, wallM, wallM, wallM] : [front, wallM, wallM, wallM, wallM, wallM];
  const b = new THREE.Mesh(new THREE.BoxGeometry(12, h, w), mats); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; p.add(b);
  const r = gable(w + 0.6, Math.min(5, w * 0.75), 12.6, wallM, roofM); r.position.set(x, h, z); p.add(r);
  box(0.5, 0.35, w + 0.2, std(0xf7f3ea), x - side * 6.1, h - 0.2, z, p); // cornice
  if (shop) { const aw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, w - 0.6), new THREE.MeshStandardMaterial({ map: stripes(pick(['#e8434f', '#2f6b9a', '#2fa7a0']), '#ffffff') })); aw.position.set(x - side * 6.9, 3.6, z); aw.rotation.z = side * 0.35; aw.castShadow = true; p.add(aw); }
  if (rnd() < 0.4) box(0.9, 1.8, 0.9, std(0xa86a52), x + side * 2, h + 1.2, z + w * 0.2, p); // chimney
}
function lantern(p, x, z) {
  const m = std(0x2b2f45, { metalness: 0.4, roughness: 0.4 });
  box(0.22, 5.4, 0.22, m, x, 2.7, z, p); box(0.5, 0.3, 0.5, m, x, 0.15, z, p);
  const lm = std(0xfff1c8, { emissive: 0xffd88a, emissiveIntensity: 0.6 }); LAMP_MATS.push(lm);
  box(0.75, 0.9, 0.75, lm, x, 5.85, z, p); box(1.0, 0.18, 1.0, m, x, 6.38, z, p);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.5, 4), m); cap.rotation.y = Math.PI / 4; cap.position.set(x, 6.72, z); p.add(cap);
}
function planter(p, x, z) {
  box(1.6, 0.8, 1.6, std(0x8a6a4a), x, 0.7, z, p);
  const leaf = std(0x4f9a50, { roughness: 0.9 });
  [[0, 1.4, 0, 0.75], [0.4, 1.3, 0.3, 0.5], [-0.4, 1.35, -0.3, 0.55]].forEach(([a, b, c, r]) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf); o.position.set(x + a, b, z + c); o.castShadow = true; p.add(o); });
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), std(pick([0xff4d6d, 0xffd84d, 0xff8fc8, 0xffffff]))); f.position.set(x + Math.sin(i * 2.4) * 0.6, 1.75 + (i % 2) * 0.2, z + Math.cos(i * 2.4) * 0.6); p.add(f); }
}
function boat(p, x, z, ry, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.9, 9, 6, 1), std(col)); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.7); hull.position.y = 0.6; g.add(hull);
  box(2.4, 0.2, 7.6, std(0xc99566), 0, 1.25, 0, g); box(1.8, 1.6, 2.4, std(0xffffff), 0, 2.1, -1.2, g); box(1.9, 0.2, 2.6, std(0x3a4256), 0, 3.0, -1.2, g);
  box(0.15, 7, 0.15, std(0xc99566), 0, 4.6, 1.6, g);
  return g;
}
function lighthouse(p, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  box(14, 2, 14, std(0x8a8296), 0, 1, 0, g);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.15, 2.75 - i * 0.15, 4, 20), std(i % 2 ? 0xe8434f : 0xffffff)); c.position.y = 4 + i * 4; c.castShadow = true; g.add(c); }
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.2, 16), std(0xfff4c8, { emissive: 0xffe08a, emissiveIntensity: 1.2 })); glow.position.y = 27.1; g.add(glow);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.4, 16), std(0x2b2f45)); cap.position.y = 29.4; g.add(cap);
  return g;
}

/** terraced hillside of small gabled houses rising away from the street; baked into a few meshes */
function terraces(scene, x0, x1, z0, z1, dir, s) {
  seed = s; const tmp = new THREE.Group();
  const ground = std(0x8fcf74, { roughness: 1 }), wallStone = std(0xb8ab98);
  for (let k = 0; ; k++) {
    const x = dir > 0 ? x0 + k * 16 : x0 - k * 16; if (dir > 0 ? x > x1 : x < x1) break;
    const y = k * 3.2;
    box(16, y + 0.3, z1 - z0, ground, x, (y + 0.3) / 2 - 0.15, (z0 + z1) / 2, tmp);
    box(0.8, y + 0.6, z1 - z0, wallStone, x - dir * 8, (y + 0.6) / 2 - 0.15, (z0 + z1) / 2, tmp);
    for (let z = z0 + 5; z < z1 - 4; z += 7 + rnd() * 3) {
      const w = 5 + rnd() * 2, h = 6 + rnd() * 6, col = new THREE.Color(pick(HOUSE)).getHex();
      const wm = std(col), rm = std(pick(ROOF));
      box(9, h, w, wm, x, y + h / 2, z, tmp);
      const r = gable(w + 0.5, w * 0.7, 9.4, null, rm); r.position.set(x, y + h, z); tmp.add(r);
      for (let f = 0; f < h / 3 - 1; f++) box(0.12, 1.2, 1.1, std(0x8cc4ea), x - dir * 4.55, y + 2.2 + f * 3, z, tmp);
    }
  }
  const baked = bake(tmp); scene.add(baked); return baked;
}

export function buildHarbor(scene) {
  seed = 21;
  const T = new THREE.Group(); scene.add(T);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 280), new THREE.MeshStandardMaterial({ map: cobble(), roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -100); road.receiveShadow = true; T.add(road);
  const sw = new THREE.MeshStandardMaterial({ map: flagstone(), roughness: 0.9 });
  [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 280), sw); p.position.set(s * 7.5, 0.15, -100); p.receiveShadow = true; T.add(p); box(0.3, 0.32, 280, std(0xb8ab98), s * 5.15, 0.16, -100, T); });
  // row houses (same band as the old town: z 22 .. -108)
  [-1, 1].forEach((s) => {
    let z = 22;
    while (z > -108) { const w = 5 + rnd() * 2.2, h = 10 + Math.floor(rnd() * 3) * 3.2; rowHouse(T, s * 16, z - w / 2, w, h, s, rnd() < 0.45); z -= w + 0.15; }
  });
  for (let z = 14; z > -100; z -= 13) { planter(T, 8.3, z - 4); planter(T, -8.3, z + 2); }
  for (let z = 8; z > -100; z -= 26) { lantern(T, 5.8, z); lantern(T, -5.8, z - 13); }
  [[-3.6, -30, 0xffd45c], [2.6, -48, 0x2fa7a0, Math.PI], [-3.6, -66, 0xf2766b], [2.6, 10, 0xf7f3ea, Math.PI]].forEach(([x, z, c, r]) => car(T, x, z, c, r || 0));
  // town square behind the steps
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: flagstone(), roughness: 0.9 })); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.03, -128); sq.receiveShadow = true; T.add(sq);
  // west: promenade, quay, sea, piers, boats, lighthouse
  const prom = new THREE.Mesh(new THREE.PlaneGeometry(14, 320), new THREE.MeshStandardMaterial({ map: flagstone(), roughness: 0.9 })); prom.rotation.x = -Math.PI / 2; prom.position.set(-29, 0.03, -100); prom.receiveShadow = true; T.add(prom);
  box(1.2, 2.6, 320, std(0x9a8f80), -36.6, -1.0, -100, T); // quay wall
  for (let z = 50; z > -260; z -= 4) box(0.15, 1.1, 0.15, std(0x2b2f45), -35.9, 0.55, z, T); box(0.12, 0.12, 320, std(0x2b2f45), -35.9, 1.1, -100, T);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: waterTex(), roughness: 0.2, metalness: 0.1 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(-1537, -0.9, -100); sea.receiveShadow = true; T.add(sea);
  const wood = std(0xb07a4a);
  [-10, -60, -110].forEach((z, i) => {
    box(30, 0.5, 3.4, wood, -52, -0.1, z, T);
    for (let k = 0; k < 6; k++) [-1.4, 1.4].forEach((d) => box(0.35, 2.4, 0.35, wood, -40 - k * 5, -1, z + d, T));
    boat(T, -48 - i * 3, z + 6, 0.1 * i, [0xe8434f, 0x2f6b9a, 0xf2c14e][i]); boat(T, -60 + i * 2, z - 6.5, -0.1, [0xffffff, 0x2fa7a0, 0xe85d75][i]);
  });
  box(8, 2.4, 120, std(0x8a8296), -95, -0.2, -170, T); // breakwater
  lighthouse(T, -95, -228);
  // east and behind the town hall: terraced hillside village
  terraces(scene, 30, 190, -200, 40, 1, 33);
  {
    seed = 55; const tmp = new THREE.Group();
    for (let k = 0; k < 6; k++) { const y = k * 3.6, z = -150 - k * 14; box(70, y + 0.3, 14, std(0x8fcf74, { roughness: 1 }), 0, (y + 0.3) / 2 - 0.15, z, tmp); for (let x = -30; x < 30; x += 8 + rnd() * 3) { const w = 5.5, h = 6 + rnd() * 5, wm = std(new THREE.Color(pick(HOUSE)).getHex()); box(w, h, 8, wm, x, y + h / 2, z, tmp); const r = gable(w + 0.5, 3.6, 8.4, null, std(pick(ROOF))); r.rotation.y = Math.PI / 2; r.position.set(x, y + h, z); tmp.add(r); } }
    // church on top of the hill
    const yc = 6 * 3.6; box(10, 12, 18, std(0xf7f3ea), 10, yc + 6, -240, tmp); const sr = gable(10.6, 6, 18.6, null, std(0x2f5f7a)); sr.rotation.y = Math.PI / 2; sr.position.set(10, yc + 12, -240); tmp.add(sr);
    box(5, 24, 5, std(0xf7f3ea), 10, yc + 12, -228, tmp); const sp = new THREE.Mesh(new THREE.ConeGeometry(3.6, 10, 4), std(0x2f5f7a)); sp.rotation.y = Math.PI / 4; sp.position.set(10, yc + 29, -228); tmp.add(sp);
    const b = bake(tmp); scene.add(b);
  }
  return T;
}

/** horizon: open sea to the west, cliffs and green headlands elsewhere, a few islands */
export function seaBackdrop(scene) {
  seed = 77; const tmp = new THREE.Group();
  const rock = [0xb8a58a, 0xa8927a, 0xc9b79a], green = [0x7cc46e, 0x6fb86a, 0x8fd17c];
  for (let i = 0; i < 30; i++) {
    const a = -0.6 + (i / 30) * 4.4, r = 360 + rnd() * 60, s = 40 + rnd() * 50;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.6, s, 30 + rnd() * 50, 7), std(pick(rock), { roughness: 1 })); c.position.set(Math.sin(a) * r, 10, -80 + Math.cos(a) * r); tmp.add(c);
    const top = new THREE.Mesh(new THREE.SphereGeometry(s * 0.62, 10, 6, 0, 6.3, 0, 1.4), std(pick(green), { roughness: 1 })); top.scale.y = 0.35; top.position.set(c.position.x, 10 + c.geometry.parameters.height / 2 - 1, c.position.z); tmp.add(top);
  }
  [[-260, -40, 30], [-330, -220, 22], [-220, 160, 18]].forEach(([x, z, s]) => { const isl = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8, 0, 6.3, 0, 1.4), std(pick(green), { roughness: 1 })); isl.scale.y = 0.4; isl.position.set(x, -1, z); tmp.add(isl); });
  const b = bake(tmp); b.traverse((o) => { if (o.isMesh) o.castShadow = false; }); scene.add(b); return b;
}
