// Coal-region town in winter (episode 6, the Centralia true story), built in METRES for the classic avatars.
// Main road (Locust Ave) along -z: x -4..4, house fronts at |x| = 9, rows from z +24 to -120, back rows at |x| = 40.
// Grandma's house is on the left at z -31; its fenced backyard (x -38..-18.5, z -40..-22) has a real hole in the
// ground at HOLE where the subsidence opens. A cutaway of the burning mine stands apart at x = 1000.
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box } from './town.js';
import { bake } from './world.js';
import { textTex } from './props.js';

let seed = 33;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
export const ROAD = 4, FRONT = 9;
export const HOLE = new THREE.Vector3(-27, 0, -31), HOLE_R = 0.75;
export const YARD = { x0: -38, x1: -18.5, z0: -40, z1: -22 };
export const GRANDMA = { back: new THREE.Vector3(-18.6, 0, -29.5), front: new THREE.Vector3(-9, 0, -31) };

const cyl = (rt, rb, h, m, x, y, z, p, seg = 10) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; p.add(c); return c; };
const glow = (c, k = 1.5) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.6 });

// ---------------------------------------------------------------- textures
const snowTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#eef2f7'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = rnd(); g.fillStyle = v < 0.5 ? 'rgba(190,205,225,.35)' : 'rgba(255,255,255,.6)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2); }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(140,130,110,.18)'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 6, 1 + rnd() * 3, rnd() * 3, 0, 7); g.fill(); }
}, [1, 1]);
const roadTex = (len) => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#55555c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) { const v = 70 + rnd() * 40; g.fillStyle = `rgba(${v},${v},${v + 6},.4)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.fillStyle = '#e8d07a'; g.fillRect(w / 2 - 3, 0, 6, h);
  g.fillStyle = 'rgba(240,244,250,.85)'; for (let i = 0; i < 30; i++) g.fillRect(rnd() < 0.5 ? rnd() * 22 : w - rnd() * 22, rnd() * h, 6 + rnd() * 14, 4 + rnd() * 10); // snow on the edges
  for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(25,25,28,.75)'; g.lineWidth = 2 + rnd() * 2; g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (rnd() - 0.5) * 40; y += 8 + rnd() * 26; g.lineTo(x, y); } g.stroke(); }
}, [1, len / 14]);
const sidingTex = (base) => canvasTex(64, 64, (g) => { g.fillStyle = base; g.fillRect(0, 0, 64, 64); for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, r * 16 + 13, 64, 3); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, r * 16, 64, 2); } }, [1, 1]);
const earthTex = () => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#4a3426'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = pick(['rgba(30,20,14,.5)', 'rgba(110,80,60,.35)', 'rgba(70,60,56,.5)']); g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 5, 2 + rnd() * 4); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,4,2,.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, [3, 1]);
const STEAM_TEX = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.5, 'rgba(240,242,246,.45)'); gr.addColorStop(1, 'rgba(240,242,246,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

// ---------------------------------------------------------------- steam: soft sprites rising from vents
export function steam(scene, max = 260) {
  const pool = Array.from({ length: max }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: STEAM_TEX, transparent: true, depthWrite: false, color: 0xf2f2ee })); s.visible = false; scene.add(s); return s; });
  let used = 0;
  return {
    begin() { used = 0; },
    /** one vent: per puffs, rising h metres, starting size r0 growing to r1, opacity o, tint */
    vent(p, t, { per = 8, h = 4, r0 = 0.5, r1 = 2.2, o = 0.55, speed = 0.35, drift = [0.6, 0, 0.2], tint = 0xf2f2ee, phase = 0 } = {}) {
      for (let k = 0; k < per && used < max; k++) {
        const s = pool[used++], u = (t * speed + k / per + phase) % 1;
        s.visible = true; s.material.color.set(tint);
        s.position.set(p.x + drift[0] * u + Math.sin(u * 5 + k) * 0.15 * r1, p.y + u * h, p.z + drift[2] * u + Math.cos(u * 4 + k) * 0.1 * r1);
        s.scale.setScalar(r0 + (r1 - r0) * u); s.material.opacity = Math.sin(Math.PI * Math.min(1, u * 1.15)) * o;
      }
    },
    end() { for (let i = used; i < max; i++) pool[i].visible = false; },
  };
}

// ---------------------------------------------------------------- pieces
function windowAt(p, x, y, z, out, w = 0.95, h = 1.35, lit = 0.25) {
  const trim = std(0xf4f0e6);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x3a4a5a, emissive: 0xffd9a0, emissiveIntensity: lit, roughness: 0.15, metalness: 0.3 }));
  gl.position.set(x + out * 0.05, y, z); gl.rotation.y = out > 0 ? Math.PI / 2 : -Math.PI / 2; p.add(gl);
  for (const s of [-1, 1]) { box(0.12, h + 0.16, 0.08, trim, x + out * 0.06, y, z + s * (w / 2 + 0.04), p); box(0.12, 0.08, w + 0.16, trim, x + out * 0.06, y + s * (h / 2 + 0.04), z, p); }
  box(0.1, h, 0.05, trim, x + out * 0.07, y, z, p); box(0.24, 0.06, w + 0.3, trim, x + out * 0.12, y - h / 2 - 0.08, z, p);
}
/** two-storey frame house, gable to the street; out = +1 faces +x, -1 faces -x. Returns { g, chimney } (not baked) */
export function house(x, z, out, col, { w = 7, d = 9, porch = true, lit = 0.25 } = {}) {
  const g = new THREE.Group(); const H = 6.2;
  const wall = new THREE.MeshStandardMaterial({ map: sidingTex(col), roughness: 0.85 }); wall.map.repeat.set(d / 1.2, H / 0.8);
  const fx = x; // facade x; body extends away from the street
  box(d, H, w, wall, fx - out * d / 2, H / 2, z, g);
  // roof: ridge runs along x (gable faces the street), snow on top
  const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.35, 0); s.lineTo(0, 2.6); s.lineTo(w / 2 + 0.35, 0); s.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: d + 0.6, bevelEnabled: false }), std(0xe8edf3, { roughness: 0.9 }));
  roof.rotation.y = Math.PI / 2; roof.position.set(fx - out * (d + 0.3) + (out > 0 ? 0 : 0), H, z); if (out > 0) roof.position.x = fx - d - 0.3; else roof.position.x = fx - 0.3; roof.castShadow = true; g.add(roof);
  const gs = new THREE.Shape(); gs.moveTo(-w / 2, 0); gs.lineTo(0, 2.45); gs.lineTo(w / 2, 0); gs.closePath();
  for (const e of [0, 1]) { const gb = new THREE.Mesh(new THREE.ShapeGeometry(gs), wall); gb.position.set(e ? fx + out * 0.01 : fx - out * (d + 0.01), H, z); gb.rotation.y = Math.PI / 2 * (e ? out : -out); g.add(gb); }
  box(0.2, 0.2, w + 0.8, std(0x4a4a52), fx + out * 0.15, H + 0.05, z, g); // eave trim
  // door, windows
  box(0.1, 2.2, 1.0, std(pick([0x6a2a24, 0x2f4a3a, 0x2a3a5a, 0x5a4a3a])), fx + out * 0.05, 0.6 + 1.1, z + w * 0.25, g);
  windowAt(g, fx, 2.1, z - w * 0.2, out, 1.0, 1.4, lit); windowAt(g, fx, 4.6, z - w * 0.2, out, 0.95, 1.3, lit); windowAt(g, fx, 4.6, z + w * 0.25, out, 0.95, 1.3, lit);
  windowAt(g, fx, 7.0, z, out, 0.7, 0.9, lit * 0.5);
  if (porch) {
    box(2.2, 0.55, w, std(0x8a8078), fx + out * 1.1, 0.28, z, g); box(2.4, 0.12, w + 0.2, std(0xe8edf3), fx + out * 1.15, 3.0, z, g);
    for (const s2 of [-1, 1]) cyl(0.08, 0.08, 2.45, std(0xf4f0e6), fx + out * 2.05, 1.78, z + s2 * (w / 2 - 0.25), g, 8);
    for (let k = 0; k < 6; k++) box(0.05, 0.6, 0.05, std(0xf4f0e6), fx + out * 2.1, 0.85, z - w / 2 + 0.5 + k * 0.5, g);
    box(0.06, 0.06, 3.0, std(0xf4f0e6), fx + out * 2.1, 1.15, z - w / 2 + 1.75, g);
    for (let k = 0; k < 3; k++) box(0.35, 0.18, 1.2, std(0x9a9088), fx + out * (2.35 + k * 0.33), 0.46 - k * 0.18, z + w * 0.25, g);
  }
  const ch = new THREE.Vector3(fx - out * d * 0.75, H + 2.6, z + w * 0.25); box(0.7, 2.4, 0.7, std(0x8a4a3a), ch.x, ch.y - 0.8, ch.z, g);
  return { g: bake(g), chimney: ch.clone().setY(ch.y + 0.5) };
}
function bareTree(p, x, z, h = 7, y = 0) {
  const bark = std(0x4a3a30, { roughness: 1 });
  cyl(0.12 * h / 7, 0.2 * h / 7, h * 0.55, bark, x, y + h * 0.275, z, p, 7);
  for (let k = 0; k < 6; k++) { const a = k * 2.4 + rnd(), l = h * (0.3 + rnd() * 0.25), b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, l, 5), bark); const y0 = y + h * (0.4 + rnd() * 0.3); b.position.set(x + Math.cos(a) * l * 0.35, y0 + l * 0.38, z + Math.sin(a) * l * 0.35); b.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); b.castShadow = true; p.add(b);
    for (let j = 0; j < 2; j++) { const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.04, l * 0.5, 4), bark); t2.position.set(b.position.x + Math.cos(a + j) * l * 0.3, b.position.y + l * 0.35, b.position.z + Math.sin(a + j) * l * 0.3); t2.rotation.set(Math.sin(a + j) * 0.9, 0, -Math.cos(a + j) * 0.9); p.add(t2); } }
}
function church(p, x, z) { // white church with three onion domes on the hill
  const wh = std(0xf2f0ea), dm = std(0x4a8a6a, { metalness: 0.4, roughness: 0.4 }), gold = std(0xd8b04a, { metalness: 0.8, roughness: 0.3 });
  box(9, 8, 15, wh, x, 4, z, p); box(5, 12, 5, wh, x, 6, z + 8.5, p);
  const s = new THREE.Shape(); s.moveTo(-4.8, 0); s.lineTo(0, 3); s.lineTo(4.8, 0); s.closePath();
  const r = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 15.4, bevelEnabled: false }), std(0x6a8a7a)); r.position.set(x, 8, z - 7.7); p.add(r);
  for (const [dx, dy, dz, k] of [[0, 12, 8.5, 1.3], [0, 11, -4, 1.0], [0, 11.6, 2.5, 1.1]]) {
    cyl(1.0 * k, 1.0 * k, 1.6 * k, wh, x + dx, dy + 0.8 * k, z + dz, p, 12);
    const on = new THREE.Mesh(new THREE.SphereGeometry(1.25 * k, 16, 12), dm); on.scale.y = 1.25; on.position.set(x + dx, dy + 2.6 * k, z + dz); p.add(on);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.45 * k, 1.4 * k, 12), dm); tip.position.set(x + dx, dy + 4.3 * k, z + dz); p.add(tip);
    box(0.1, 1.4 * k, 0.1, gold, x + dx, dy + 5.6 * k, z + dz, p); box(0.1, 0.1, 0.7 * k, gold, x + dx, dy + 5.8 * k, z + dz, p);
  }
  for (let k = 0; k < 4; k++) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.2), glow(0xffd9a0, 0.4)); wdw.position.set(x - 4.51, 4, z - 5 + k * 3); wdw.rotation.y = -Math.PI / 2; p.add(wdw); }
}

// ---------------------------------------------------------------- the town
export function buildCoalTown(scene) {
  const tmp = new THREE.Group();
  // ground with a square cut for the backyard; the yard has a round hole for the subsidence
  const snowM = new THREE.MeshStandardMaterial({ map: snowTex(), roughness: 0.95 }); snowM.map.repeat.set(0.12, 0.12);
  const outer = new THREE.Shape(); outer.moveTo(-450, -450); outer.lineTo(450, -450); outer.lineTo(450, 450); outer.lineTo(-450, 450); outer.closePath();
  const yh = new THREE.Path(); yh.moveTo(YARD.x0, -YARD.z0); yh.lineTo(YARD.x0, -YARD.z1); yh.lineTo(YARD.x1, -YARD.z1); yh.lineTo(YARD.x1, -YARD.z0); yh.closePath(); outer.holes.push(yh);
  const ground = new THREE.Mesh(new THREE.ShapeGeometry(outer), snowM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ys = new THREE.Shape(); ys.moveTo(YARD.x0, -YARD.z0); ys.lineTo(YARD.x1, -YARD.z0); ys.lineTo(YARD.x1, -YARD.z1); ys.lineTo(YARD.x0, -YARD.z1); ys.closePath();
  const hh = new THREE.Path(); hh.absarc(HOLE.x, -HOLE.z, HOLE_R, 0, Math.PI * 2, true); ys.holes.push(hh);
  const yard = new THREE.Mesh(new THREE.ShapeGeometry(ys, 48), snowM); yard.rotation.x = -Math.PI / 2; yard.receiveShadow = true; scene.add(yard);
  // the hole: earth walls, a root, glow at the bottom
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R * 0.8, 10, 28, 6, true), new THREE.MeshStandardMaterial({ map: earthTex(), side: THREE.BackSide, roughness: 1 })); wall.position.set(HOLE.x, -5, HOLE.z); scene.add(wall);
  const lip = new THREE.Mesh(new THREE.RingGeometry(HOLE_R, HOLE_R + 0.45, 28, 1), new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 1, transparent: true, opacity: 0.85 })); lip.rotation.x = -Math.PI / 2; lip.position.set(HOLE.x, 0.012, HOLE.z); scene.add(lip); // churned mud around the edge
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(HOLE_R * 0.8, 20), glow(0xff5a1a, 2.2)); bottom.rotation.x = -Math.PI / 2; bottom.position.set(HOLE.x, -9.9, HOLE.z); scene.add(bottom);
  const holeLight = new THREE.PointLight(0xff7a2a, 0, 9, 1.6); holeLight.position.set(HOLE.x, -6, HOLE.z); scene.add(holeLight);
  const rootM = std(0x6a4a34, { roughness: 1 });
  const root = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(HOLE.x - HOLE_R - 0.2, -0.35, HOLE.z + 0.2), V(HOLE.x - 0.3, -0.5, HOLE.z + 0.15), V(HOLE.x + 0.2, -0.75, HOLE.z - 0.05), V(HOLE.x + 0.4, -1.2, HOLE.z - 0.15)]), 12, 0.06, 6), rootM); root.castShadow = true; scene.add(root);
  const root2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(HOLE.x + HOLE_R + 0.1, -0.6, HOLE.z), V(HOLE.x + 0.3, -0.9, HOLE.z + 0.2), V(HOLE.x + 0.1, -1.5, HOLE.z + 0.3)]), 8, 0.04, 5), rootM); scene.add(root2);
  // the lid of snowy ground that falls in
  const lid = new THREE.Group(); lid.position.copy(HOLE); scene.add(lid);
  { const top = new THREE.Mesh(new THREE.CircleGeometry(HOLE_R + 0.02, 28), snowM); top.rotation.x = -Math.PI / 2; top.position.y = 0.005; lid.add(top); const side = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R * 0.9, 0.4, 28), std(0x5a4030, { roughness: 1 })); side.position.y = -0.2; lid.add(side); }
  // road, cross streets
  const rd = new THREE.Mesh(new THREE.PlaneGeometry(ROAD * 2, 330), new THREE.MeshStandardMaterial({ map: roadTex(330), roughness: 0.85 })); rd.rotation.x = -Math.PI / 2; rd.position.set(0, 0.02, -60); rd.receiveShadow = true; scene.add(rd);
  for (const cz of [-4, -66]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(160, 7), new THREE.MeshStandardMaterial({ map: roadTex(160), roughness: 0.85 })); c.material.map.repeat.set(1, 160 / 14); c.material.map.rotation = Math.PI / 2; c.rotation.x = -Math.PI / 2; c.position.set(0, 0.015, cz); scene.add(c); }
  // houses (each its own baked group so they can disappear when people move away)
  const COLS = ['#e8e4dc', '#d8d0b8', '#b8c4cc', '#c8b8a0', '#a8b8a0', '#d8c8c0', '#9aa8b8', '#c8a888'];
  const houses = [], chimneys = [];
  const addHouse = (x, z, out, opts = {}) => { const h = house(x, z, out, opts.col || pick(COLS), opts); scene.add(h.g); houses.push({ g: h.g, x, z, keep: !!opts.keep }); chimneys.push(h.chimney); return h; };
  for (let z = 22; z > -126; z -= 8.6) {
    if (z < -0.5 && z > -7.5) continue; if (z < -62.5 && z > -69.5) continue; // cross streets
    if (Math.abs(z - -31) < 4.3) addHouse(-FRONT, -31, 1, { col: '#c8d4dc', keep: true }); else addHouse(-FRONT, z, 1, { keep: z < -100 });
    addHouse(FRONT, z, -1, { keep: Math.abs(z + 48) < 4 });
  }
  for (let z = 18; z > -120; z -= 9.5) { if (z < 0 && z > -8) continue; if (z < -60 && z > -72) continue; if (z < -18 && z > -44) { addHouse(44, z, -1); continue; } addHouse(-46, z, 1); addHouse(44, z, -1); }
  // grandma's backyard: fence, clothesline, shed, bare tree, sled
  const fw = std(0x8a7a6a, { roughness: 1 });
  const fence = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3); for (let k = 0; k <= n; k++) { const u = k / n; box(0.1, 1.25, 0.1, fw, x0 + (x1 - x0) * u, 0.62, z0 + (z1 - z0) * u, tmp); } const L = Math.hypot(x1 - x0, z1 - z0), rail = box(L, 0.08, 0.05, fw, (x0 + x1) / 2, 0.95, (z0 + z1) / 2, tmp); rail.rotation.y = -Math.atan2(z1 - z0, x1 - x0); };
  fence(YARD.x0, YARD.z0, YARD.x1, YARD.z0); fence(YARD.x0, YARD.z1, YARD.x1, YARD.z1); fence(YARD.x0, YARD.z0, YARD.x0, YARD.z1);
  for (const z of [-24.5, -37.5]) { cyl(0.06, 0.06, 2.4, std(0x9aa0aa, { metalness: 0.6 }), -32, 1.2, z, tmp, 6); box(0.08, 0.08, 1.0, std(0x9aa0aa, { metalness: 0.6 }), -32, 2.35, z, tmp); }
  for (const s of [-0.4, 0.4]) cyl(0.008, 0.008, 13, std(0xdddddd), -32, 2.32, -31 + s * 0, tmp, 4).rotation.x = Math.PI / 2;
  for (const [z, c, w, hh2] of [[-26.5, 0xc8343f, 0.9, 0.7], [-28, 0xf4f0e6, 1.2, 0.8], [-34.5, 0x3a6aa8, 0.8, 0.9], [-36, 0xf2c14e, 0.6, 0.5]]) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(w, hh2), new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.9 })); cl.position.set(-32, 2.3 - hh2 / 2, z); cl.rotation.y = Math.PI / 2; tmp.add(cl); }
  box(3, 2.4, 2.6, std(0x7a5a44), -35.6, 1.2, -38.2, tmp); box(3.4, 0.25, 3.0, std(0xe8edf3), -35.6, 2.5, -38.2, tmp); box(0.08, 1.9, 0.9, std(0x4a3a30), -34.08, 0.95, -38.2, tmp);
  bareTree(tmp, -28.4, -33.2, 7.5);
  const sled = box(0.45, 0.06, 1.2, std(0xc8343f), -36.6, 0.65, -24.0, tmp); sled.rotation.z = 1.2;
  for (const [x, z] of [[-20.4, -25.2], [-20.8, -26.0]]) cyl(0.28, 0.25, 0.85, std(0x6a6a72, { metalness: 0.5 }), x, 0.43, z, tmp, 12);
  // porch heart on grandma's front door (Valentine's Day) and newspaper on the steps
  const heart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape(0.28)), glow(0xd8203a, 0.25)); heart.position.set(-FRONT + 0.12, 2.15, -31 + 7 * 0.25); heart.rotation.y = Math.PI / 2; scene.add(heart);
  // warning sign on the road, power poles, hills, trees, church
  const warn = new THREE.Group(); warn.position.set(5.6, 0, -78); warn.rotation.y = -Math.PI / 2 + 0.35; tmp.add(warn);
  for (const s of [-0.9, 0.9]) box(0.1, 2.6, 0.1, std(0x5a5a62), s, 1.3, 0, warn);
  const wm = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshStandardMaterial({ map: textTex(['WARNING', 'DANGER', 'MINE FIRE AREA'], { w: 1024, h: 700, bg: '#f2c14e', fg: '#1b1b24', border: '#1b1b24', sizes: [120, 150, 100] }) })); wm.position.set(0, 2.0, 0.06); warn.add(wm);
  for (let z = 30; z > -200; z -= 26) { cyl(0.13, 0.16, 9, std(0x6a5040, { roughness: 1 }), 5.2, 4.5, z, tmp, 7); box(0.12, 0.12, 1.8, std(0x6a5040), 5.2, 8.5, z, tmp); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = 230 + rnd() * 80; const hl = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), std(pick([0xdfe4ea, 0xc8d0d8, 0xb8c0c8]), { flatShading: true })); hl.scale.set(80 + rnd() * 60, 35 + rnd() * 30, 70 + rnd() * 40); hl.position.set(Math.cos(a) * r, -10, Math.sin(a) * r - 60); scene.add(hl); }
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), snowM); hill.scale.set(38, 9, 30); hill.position.set(40, -2, -158); scene.add(hill);
  for (let k = 0; k < 90; k++) { const x = (rnd() < 0.5 ? -1 : 1) * (56 + rnd() * 120), z = 40 - rnd() * 240; bareTree(tmp, x, z, 6 + rnd() * 5); }
  for (let k = 0; k < 14; k++) bareTree(tmp, -40 + rnd() * 80, -130 - rnd() * 40, 6 + rnd() * 4);
  const baked = bake(tmp); scene.add(baked);
  // church group lifted onto the hill
  const ch = new THREE.Group(); church(ch, 40, -158); ch.position.y = 6.4; scene.add(bake(ch));
  // steam vents along the road and in empty lots, with melted patches of bare ground
  const vents = [V(6.2, 0, -72), V(-5.3, 0, -84), V(1.6, 0.02, -80), V(-2.2, 0.02, -93), V(12, 0, -96), V(-14, 0, -102), V(18, 0, -64), V(-20, 0, -74)];
  for (const v of vents) { const pt = new THREE.Mesh(new THREE.CircleGeometry(1.6 + rnd() * 1.2, 14), new THREE.MeshStandardMaterial({ color: pick([0x5a4a38, 0x6a6a44, 0x4a3a2a]), roughness: 1 })); pt.rotation.x = -Math.PI / 2; pt.position.set(v.x, 0.012, v.z); pt.scale.set(1, 0.7 + rnd() * 0.5, 1); scene.add(pt); }
  const melt = V(-24, 0, -52); { const pt = new THREE.Mesh(new THREE.CircleGeometry(3.2, 20), new THREE.MeshStandardMaterial({ color: 0x5a7040, roughness: 1 })); pt.rotation.x = -Math.PI / 2; pt.position.set(melt.x, 0.013, melt.z); scene.add(pt); }
  return {
    houses, chimneys, vents, melt, lid, lip, holeLight, bottom,
    /** k = 0: 1981 town; k = 1: almost everyone gone (only `keep` houses stand). order = left to right in time */
    setGone(k) { houses.forEach((h, i) => { const r = ((i * 7919) % 97) / 97; h.g.visible = h.keep || r >= k; }); },
  };
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function heartShape(s) { const h = new THREE.Shape(); h.moveTo(0, -s); h.bezierCurveTo(-s * 1.6, s * 0.1, -s * 0.7, s * 1.1, 0, s * 0.45); h.bezierCurveTo(s * 0.7, s * 1.1, s * 1.6, s * 0.1, 0, -s); return h; }

// ---------------------------------------------------------------- cutaway of the burning mine (at x = 1000)
export function mineCutaway(scene, X = 1000) {
  const g = new THREE.Group(); g.position.set(X, 0, 0); scene.add(g);
  const strata = canvasTex(512, 512, (c, w, h) => {
    const L = [[0, 0.04, '#eef2f7'], [0.04, 0.16, '#5a4030'], [0.16, 0.42, '#7a6a5a'], [0.42, 0.6, '#1a1a1e'], [0.6, 1, '#4a4a52']];
    for (const [a, b, col] of L) { c.fillStyle = col; c.fillRect(0, a * h, w, (b - a) * h); }
    for (let i = 0; i < 1600; i++) { const y = rnd() * h; c.fillStyle = y / h > 0.42 && y / h < 0.6 ? 'rgba(60,60,70,.6)' : 'rgba(0,0,0,.18)'; c.fillRect(rnd() * w, y, 3 + rnd() * 6, 2); }
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(0, h * (0.2 + k * 0.1)); for (let x = 0; x <= w; x += 32) c.lineTo(x, h * (0.2 + k * 0.1) + Math.sin(x * 0.03 + k) * 6); c.stroke(); }
  });
  const W = 46, D = 24, H = 24;
  const front = new THREE.MeshStandardMaterial({ map: strata, roughness: 1 });
  const blk = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [std(0x4a4a52), std(0x4a4a52), new THREE.MeshStandardMaterial({ map: snowTex(), roughness: 1 }), std(0x2a2a30), front, std(0x4a4a52)]);
  blk.position.set(0, -H / 2, -D / 2); g.add(blk);
  // mine galleries in the coal seam (depth 10-14) with timber props and fire
  const fireM = glow(0xff6a1a, 2.6), emberM = glow(0xffb03a, 3.2), timber = std(0x6a4a2a);
  const fires = [], lights = [];
  for (let k = 0; k < 5; k++) {
    const x = -18 + k * 9; box(6.5, 3, 1.2, std(0x0c0a0c), x, -12, 0.0, g);
    for (const s of [-2.6, 0, 2.6]) { box(0.3, 3, 0.3, timber, x + s, -12, 0.5, g); } box(6.4, 0.3, 0.3, timber, x, -10.6, 0.5, g);
    for (let j = 0; j < 4; j++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + rnd() * 0.5, 0), j % 2 ? fireM : emberM); f.position.set(x - 2 + j * 1.3, -13 + rnd() * 0.6, 0.65); g.add(f); fires.push(f); }
    const l = new THREE.PointLight(0xff6a1a, 18, 10, 1.6); l.position.set(x, -11.5, 2); g.add(l); lights.push(l);
  }
  // detail: rocks in the strata, burning coal lumps and flame tongues in the galleries, carts on rails, lanterns
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3();
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 1), std(0x6a6058, { flatShading: true, roughness: 1 }), 260);
  for (let i = 0; i < 260; i++) { const y = -1.5 - rnd() * 21; if (y < -9.5 && y > -14.5) { i--; continue; } Pv.set(-22 + rnd() * 44, y, 0.05); q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3)); Sv.setScalar(0.4 + rnd() * 1.4).multiply(new THREE.Vector3(1.4, 0.7, 0.5)); m4.compose(Pv, q, Sv); rocks.setMatrixAt(i, m4); }
  g.add(rocks);
  const lumpM = glow(0xff7a2a, 2.2);
  const lumps = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 1), lumpM, 240);
  for (let i = 0; i < 240; i++) { const k = i % 5, x = -18 + k * 9; Pv.set(x - 3 + rnd() * 6, -13.4 + rnd() * 0.5, 0.35 + rnd() * 0.4); q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)); Sv.setScalar(0.5 + rnd()); m4.compose(Pv, q, Sv); lumps.setMatrixAt(i, m4); }
  g.add(lumps);
  const tongues = [];
  for (let k = 0; k < 5; k++) for (let j = 0; j < 5; j++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.25 + rnd() * 0.2, 1.0 + rnd() * 0.9, 10, 3), j % 2 ? emberM : fireM); f.position.set(-18 + k * 9 - 2.4 + j * 1.2, -12.6 + rnd() * 0.3, 0.75); g.add(f); tongues.push(f); }
  for (let k = 0; k < 5; k++) { const x = -18 + k * 9; box(6.2, 0.06, 0.08, std(0x5a5a62, { metalness: 0.7 }), x, -13.45, 0.45, g); box(6.2, 0.06, 0.08, std(0x5a5a62, { metalness: 0.7 }), x, -13.45, 0.25, g);
    if (k % 2 === 0) { const cx = x + 1.8; box(1.1, 0.6, 0.55, std(0x4a3a30, { metalness: 0.4 }), cx, -13.0, 0.4, g); for (const s2 of [-0.35, 0.35]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), std(0x2a2a30)); wh.rotation.x = Math.PI / 2; wh.position.set(cx + s2, -13.3, 0.7); g.add(wh); } for (let c = 0; c < 6; c++) { const lm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), std(0x111114)); lm.position.set(cx - 0.35 + (c % 3) * 0.32, -12.65, 0.35 + Math.floor(c / 3) * 0.15); g.add(lm); } }
    const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 8), glow(0xffd28a, 1.8)); lan.position.set(x - 2.6, -11.0, 0.7); g.add(lan); }
  for (const [x, z] of [[-18, -3], [-2, -9], [18, -4], [6, -16]]) bareTree(g, x, z, 6);
  // cracks from the fire to the surface
  const crackM = glow(0xff4a10, 2.0), cracks = [];
  for (const cx of [-14, -1, 12]) { let x = cx, y = -10.4; for (let s = 0; s < 6; s++) { const nx = x + (rnd() - 0.5) * 2.2, ny = y + 1.75; const L = Math.hypot(nx - x, ny - y); const c = box(0.14, L, 0.1, crackM, (x + nx) / 2, (y + ny) / 2, 0.06, g); c.rotation.z = -Math.atan2(nx - x, ny - y); cracks.push(c); x = nx; y = ny; } cracks.push({ top: V(X + x, 0.2, -1.5) }); }
  // a street on top: two houses, a tree, the road edge
  const h1 = house(-8, -6, 1, '#c8d4dc', { w: 6, d: 7 }), h2 = house(12, -6, -1, '#d8c8c0', { w: 6, d: 7 });
  h1.g.scale.setScalar(0.9); h2.g.scale.setScalar(0.9); g.add(h1.g, h2.g);
  const tops = cracks.filter((c) => c.top).map((c) => c.top);
  return {
    g, tops,
    update(t) { fires.forEach((f, i) => { const k = 0.75 + 0.35 * Math.sin(t * (7 + i) + i * 2) * Math.sin(t * 3.1 + i); f.scale.setScalar(k); }); tongues.forEach((f, i) => { f.scale.set(1, 0.7 + 0.45 * Math.abs(Math.sin(t * (6 + i % 4) + i)), 1); }); lumpM.emissiveIntensity = 1.8 + 0.6 * Math.sin(t * 4.2); lights.forEach((l, i) => { l.intensity = 14 + 8 * Math.sin(t * (9 + i) + i) * Math.sin(t * 4.3); }); crackM.emissiveIntensity = 1.6 + 0.8 * Math.sin(t * 5); },
  };
}
