// Detailed surroundings so no shot ever shows bare grass: suburb blocks (streets, houses, yards, fences, hedges,
// trees, parked cars, mailboxes), plus a backdrop ring of hills and distant towers. Everything static is merged
// into a handful of meshes (one per material look), so hundreds of houses cost a few draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tree, lamp, car, PASTELS, asphalt, tiles, glassTower } from './town.js';

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const MATS = new Map();
const mat = (color, extra = {}) => {
  const key = color + JSON.stringify(extra);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra }));
  return MATS.get(key);
};
function bx(p, w, h, d, m, x, y, z, ry = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o;
}
const ROOFS = [0xd9434f, 0x6b7fd9, 0x5a6a8a, 0x8a5a3c, 0x4f9a90, 0xe8875c];
const CARS = [0xff8f6b, 0x6fb6ff, 0xffd45c, 0xb98cf0, 0x8fd16b, 0xf4f4f4, 0x3a3f52];

// one suburban house on a lot centred at (x, z), front door facing yaw
function home(p, x, z, yaw) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; p.add(g);
  const w = 8 + rnd() * 3, d = 7 + rnd() * 2, h = 5 + Math.floor(rnd() * 2) * 3;
  const wall = mat(new THREE.Color(pick(PASTELS)).getHex());
  bx(g, w, h, d, wall, 0, h / 2, -1);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, Math.max(w, d) * 0.78, 3.2, 4, 1), mat(pick(ROOFS)));
  roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); roof.position.set(0, h + 1.6, -1); g.add(roof);
  if (rnd() < 0.5) bx(g, 1, 2.2, 1, mat(0xa86a52), w * 0.25, h + 2.2, -2);
  const frame = mat(0xffffff), glass = mat(0x8fc8f0, { roughness: 0.2 });
  bx(g, 1.8, 3.2, 0.2, frame, -w * 0.18, 1.6, d / 2 - 0.9); bx(g, 1.4, 2.9, 0.22, mat(pick([0x8a5a3c, 0x3a4a7a, 0xd9434f, 0x2f6b5a])), -w * 0.18, 1.45, d / 2 - 0.85);
  for (let fl = 0; fl < h / 3 - 0.5; fl++) [w * 0.22, -w * 0.38].forEach((wx, i) => {
    if (fl === 0 && i === 1 && w < 9) return;
    bx(g, 1.9, 1.7, 0.2, frame, fl === 0 && i === 0 ? w * 0.22 : wx, 2.4 + fl * 3, d / 2 - 0.9);
    bx(g, 1.5, 1.3, 0.24, glass, fl === 0 && i === 0 ? w * 0.22 : wx, 2.4 + fl * 3, d / 2 - 0.88);
  });
  bx(g, 3, 0.25, 1.6, mat(0xd9cfc4), -w * 0.18, 0.12, d / 2); // step
  // yard: path, fence or hedge, mailbox, maybe a tree / bush / car in the drive
  bx(g, 1.4, 0.06, 4, mat(0xe8e0d4), -w * 0.18, 0.03, d / 2 + 2.6);
  if (rnd() < 0.55) { for (let i = -6; i <= 6; i += 0.9) if (Math.abs(i + w * 0.18) > 1) bx(g, 0.2, 1.1, 0.2, frame, i, 0.55, d / 2 + 4.6); bx(g, 13, 0.18, 0.12, frame, 0, 0.85, d / 2 + 4.6); }
  else { [-4.2, 3.2].forEach((hx) => bx(g, 4.5, 1.3, 1.1, mat(0x5fb35d), hx, 0.65, d / 2 + 4.4)); }
  bx(g, 0.18, 1.2, 0.18, mat(0x6b5a4a), 2.3, 0.6, d / 2 + 4.1); bx(g, 0.5, 0.45, 0.8, mat(pick([0x3a4a7a, 0xd9434f, 0x2f6b5a])), 2.3, 1.3, d / 2 + 4.1);
  if (rnd() < 0.45) tree(g, w / 2 + 1.5, d / 2 + 1, 0.7 + rnd() * 0.3);
  else bx(g, 1.4, 1.1, 1.4, mat(0x6cc76a), w / 2 - 0.5, 0.55, d / 2 + 0.4);
  if (rnd() < 0.35) car(g, w / 2 + 2.6, -0.5, pick(CARS), 0);
}

// merge every static mesh under `group` by material, keeping position/normal/uv
export function bake(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map(), keepAsIs = [];
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    if (Array.isArray(o.material)) { keepAsIs.push(o); return; } // multi-material meshes (facades) are kept, not merged
    const m = o.material, key = [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.map?.uuid, m.roughness, m.metalness, m.transparent].join('|');
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!buckets.has(key)) buckets.set(key, { m, gs: [] });
    buckets.get(key).gs.push(g);
  });
  const out = new THREE.Group();
  for (const { m, gs } of buckets.values()) {
    const mesh = new THREE.Mesh(mergeGeometries(gs), m); mesh.castShadow = mesh.receiveShadow = true; out.add(mesh);
  }
  for (const o of keepAsIs) { const m = new THREE.Mesh(o.geometry, o.material); o.matrixWorld.decompose(m.position, m.quaternion, m.scale); m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; out.add(m); }
  return out;
}

const inside = (x, z, r) => x > r[0] && x < r[1] && z > r[2] && z < r[3];
const hits = (x0, x1, z0, z1, r) => x1 > r[0] && x0 < r[1] && z1 > r[2] && z0 < r[3];

/** Suburb blocks filling [x0,x1] x [z0,z1]; `avoid` = list of [x0,x1,z0,z1] kept empty (sets, lake, plaza). */
export function suburb(scene, { x0, x1, z0, z1, avoid = [], block = 38, s = 11 }) {
  seed = s;
  const tmp = new THREE.Group();
  const road = new THREE.MeshStandardMaterial({ map: asphalt(), roughness: 0.95 });
  const walk = new THREE.MeshStandardMaterial({ map: tiles(), roughness: 0.9 });
  const clear = (a, b, c, d) => !avoid.some((r) => hits(a, b, c, d, r));
  // streets on a grid: roads along x at each z line, along z at each x line
  for (let x = x0; x <= x1; x += block) for (let z = z0; z < z1; z += block) {
    if (clear(x - 5, x + 5, z, z + block)) { bx(tmp, 8, 0.04, block, road, x, 0.02, z + block / 2); [-1, 1].forEach((sd) => bx(tmp, 2, 0.2, block, walk, x + sd * 5, 0.1, z + block / 2)); }
  }
  for (let z = z0; z <= z1; z += block) for (let x = x0; x < x1; x += block) {
    if (clear(x, x + block, z - 5, z + 5)) { bx(tmp, block, 0.05, 8, road, x + block / 2, 0.025, z); [-1, 1].forEach((sd) => bx(tmp, block, 0.21, 2, walk, x + block / 2, 0.105, z + sd * 5)); }
  }
  // two lots per block side, houses facing the nearer street
  for (let bx0 = x0; bx0 < x1; bx0 += block) for (let bz0 = z0; bz0 < z1; bz0 += block) {
    const cx = bx0 + block / 2, cz = bz0 + block / 2;
    for (const [lx, lz, yaw] of [[cx - 7.5, bz0 + 11, Math.PI], [cx + 7.5, bz0 + 11, Math.PI], [cx - 7.5, bz0 + block - 11, 0], [cx + 7.5, bz0 + block - 11, 0]]) {
      if (!clear(lx - 7, lx + 7, lz - 8, lz + 8)) continue;
      home(tmp, lx, lz, yaw);
    }
    if (clear(cx - 3, cx + 3, cz - 3, cz + 3)) tree(tmp, cx, cz, 1.1);
  }
  // street trees and lamps
  for (let x = x0; x <= x1; x += block) for (let z = z0 + 8; z < z1; z += 19) {
    if (clear(x - 7, x + 7, z - 2, z + 2)) { tree(tmp, x + 6.4, z, 0.8); if ((z / 19 | 0) % 2) lamp(tmp, x - 5.6, z + 6, -1); }
  }
  const baked = bake(tmp);
  scene.add(baked);
  return baked;
}

/** Hills and distant towers in a ring, so the horizon is never empty. */
export function backdrop(scene, cx, cz, r = 330) {
  seed = 99;
  const tmp = new THREE.Group();
  const greens = [0x7cc46e, 0x8fd17c, 0x6fb86a, 0x9ad48a];
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + rnd() * 0.1, rr = r + rnd() * 50, s = 40 + rnd() * 60;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(pick(greens), { roughness: 1 }));
    hill.scale.set(s, 18 + rnd() * 40, s); hill.position.set(cx + Math.sin(a) * rr, -2, cz + Math.cos(a) * rr); tmp.add(hill);
  }
  const gt = glassTower();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.15, rr = r - 60 + rnd() * 30, w = 9 + rnd() * 9, h = 35 + rnd() * 60;
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.4, emissive: 0x9ccff5, emissiveIntensity: 0.3 }));
    t.position.set(cx + Math.sin(a) * rr, h / 2, cz + Math.cos(a) * rr); tmp.add(t);
  }
  const baked = bake(tmp);
  baked.traverse((o) => { if (o.isMesh) { o.castShadow = false; } });
  scene.add(baked);
  return baked;
}
