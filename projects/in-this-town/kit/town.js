// Pastel town: main street along -z, sidewalks, painted buildings, trees, lamps, cars, town hall, skyline.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex } from './core.js';

const PASTELS = ['#f7e7a6', '#c9e7d8', '#d9d0f2', '#bfe0f7', '#f6cfd8', '#fbe0c2', '#e6f2c4', '#cfd9f7'];
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function std(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra }); }
function box(w, h, d, m, x, y, z, parent, r = 0) {
  const g = r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}

// ---------------------------------------------------------------- textures
const asphalt = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#4a5068'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 60 + rnd() * 40; g.fillStyle = `rgba(${v},${v + 4},${v + 24},.35)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.fillStyle = '#f4e9a8'; g.fillRect(w / 2 - 7, 40, 14, 190); g.fillRect(w / 2 - 7, 296, 14, 190); // centre dashes
  g.fillStyle = '#e9edf5'; g.fillRect(14, 0, 9, h); g.fillRect(w - 23, 0, 9, h); // edge lines
}, [1, 14]);
const tiles = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e3dcd2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c4b9ad'; g.lineWidth = 4;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(150,130,120,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
}, [2, 40]);
const facade = (base, rows, cols, shop) => canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 4, 2); }
  const top = 30, bottom = shop ? 130 : 30, ch = (h - top - bottom) / rows, cw = w / cols;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * cw + cw * 0.2, y = top + r * ch + ch * 0.18, ww = cw * 0.6, hh = ch * 0.6;
    g.fillStyle = '#ffffff'; g.fillRect(x - 5, y - 5, ww + 10, hh + 10); // frame
    const gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#9fd3f5'); gr.addColorStop(0.55, '#5a9fd6'); gr.addColorStop(1, '#c7e8ff');
    g.fillStyle = gr; g.fillRect(x, y, ww, hh);
    g.fillStyle = '#ffffff'; g.fillRect(x + ww / 2 - 2, y, 4, hh); g.fillRect(x, y + hh * 0.45, ww, 4);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 5, y + hh + 5, ww + 10, 6); // sill shadow
  }
  if (shop) { // shopfront: awning stripes + big window
    const aw = ['#f08aa0', '#ffffff'];
    for (let i = 0; i < 8; i++) { g.fillStyle = aw[i % 2]; g.fillRect(i * w / 8, h - 130, w / 8, 26); }
    g.fillStyle = '#7fc4ee'; g.fillRect(18, h - 96, w - 70, 80); g.fillStyle = '#ffffff'; g.fillRect(w - 46, h - 100, 34, 100);
  }
  g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, 0, w, 14);
});
const glassTower = () => canvasTex(128, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#bfe6ff'); gr.addColorStop(1, '#6fb8ec');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.55)';
  for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 3);
  for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 3, h);
});

// ---------------------------------------------------------------- props
function tree(p, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); p.add(g);
  box(0.6, 3, 0.6, std(0x8b5a3c), 0, 1.5, 0, g, 0.15);
  const leaf = std(0x6cc76a, { roughness: 0.9 }), leaf2 = std(0x8fdc6b, { roughness: 0.9 });
  [[0, 4.2, 0, 2.1, leaf], [0.9, 3.7, 0.4, 1.4, leaf2], [-0.8, 3.8, -0.3, 1.5, leaf2], [0.1, 5.3, -0.2, 1.4, leaf2]].forEach(([a, b, c, r, m]) => {
    const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); o.position.set(a, b, c); o.castShadow = o.receiveShadow = true; g.add(o);
  });
  box(1.6, 0.3, 1.6, std(0x8a7a6a), 0, 0.15, 0, g); // planter
}
function lamp(p, x, z, side) {
  const m = std(0x3c4a6b, { metalness: 0.3, roughness: 0.5 });
  box(0.25, 7, 0.25, m, x, 3.5, z, p);
  box(1.6 * side, 0.18, 0.2, m, x - 0.8 * side, 7, z, p);
  box(0.7, 0.35, 0.5, std(0xfff4c8, { emissive: 0xfff0b0, emissiveIntensity: 0.6 }), x - 1.5 * side, 6.8, z, p);
}
function car(p, x, z, color, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; p.add(g);
  box(2.3, 1.1, 4.6, std(color, { roughness: 0.35 }), 0, 0.95, 0, g, 0.3);
  box(2.0, 0.9, 2.4, std(color, { roughness: 0.35 }), 0, 1.85, -0.2, g, 0.3);
  box(2.04, 0.65, 2.0, std(0x9fd0f0, { roughness: 0.1, metalness: 0.2 }), 0, 1.9, -0.2, g, 0.15);
  [[-1.1, 1.5], [1.1, 1.5], [-1.1, -1.5], [1.1, -1.5]].forEach(([a, b]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.4, 16), std(0x25252c)); w.rotation.z = Math.PI / 2; w.position.set(a, 0.48, b); w.castShadow = true; g.add(w);
  });
  box(0.5, 0.25, 0.08, std(0xfff6d0, { emissive: 0xfff6d0, emissiveIntensity: 0.4 }), -0.7, 1.05, 2.3, g); box(0.5, 0.25, 0.08, std(0xfff6d0, { emissive: 0xfff6d0, emissiveIntensity: 0.4 }), 0.7, 1.05, 2.3, g);
}
function hydrant(p, x, z) {
  const m = std(0xe8434f, { roughness: 0.4 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.2, 14), m); b.position.set(x, 0.6, z); b.castShadow = true; p.add(b);
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 8, 0, 6.3, 0, 1.6), m); t.position.set(x, 1.2, z); t.castShadow = true; p.add(t);
  box(1.0, 0.22, 0.22, m, x, 0.85, z, p, 0.08);
}
function bench(p, x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; p.add(g);
  const wood = std(0xc9824f), iron = std(0x34405e);
  box(3.2, 0.18, 0.9, wood, 0, 1.0, 0, g, 0.06); box(3.2, 0.7, 0.16, wood, 0, 1.6, -0.42, g, 0.06);
  [-1.3, 1.3].forEach((a) => box(0.16, 1.0, 0.9, iron, a, 0.5, 0, g));
}
function townHall(p, z) {
  const g = new THREE.Group(); g.position.set(0, 0, z); p.add(g);
  const white = std(0xf6f4f0), gold = std(0xf2c14e, { metalness: 0.5, roughness: 0.3 });
  box(36, 2, 16, std(0xdcd6cc), 0, 1, 0, g); // steps
  box(32, 14, 12, white, 0, 9, -1, g);
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 12, 16), white); c.position.set(-12.25 + i * 3.5, 8, 6.2); c.castShadow = c.receiveShadow = true; g.add(c); }
  box(34, 1.6, 14, white, 0, 16.6, 0, g);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 18.5, 5, 4, 1), white); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.42); roof.position.set(0, 19.9, 0); roof.castShadow = true; g.add(roof);
  box(10, 6, 10, white, 0, 21, -2, g);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.6, 32, 16, 0, 6.3, 0, 1.6), gold); dome.position.set(0, 24, -2); dome.castShadow = true; g.add(dome);
  // clock
  const clock = canvasTex(256, 256, (c) => {
    c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill();
    c.strokeStyle = '#2b2f45'; c.lineWidth = 10; c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.fillStyle = '#2b2f45'; c.fillRect(128 + Math.sin(a) * 96 - 5, 128 - Math.cos(a) * 96 - 5, 10, 10); }
    c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(128, 128); c.lineTo(128, 52); c.moveTo(128, 128); c.lineTo(178, 128); c.stroke();
  });
  const cm = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshStandardMaterial({ map: clock, roughness: 0.6 })); cm.position.set(0, 21, 3.05); g.add(cm);
  const flag = std(0x6fb6ff); box(0.15, 5, 0.15, std(0x888888), 0, 29.6, -2, g); box(2.4, 1.4, 0.06, flag, 1.25, 31.2, -2, g);
}

// ---------------------------------------------------------------- build
export function buildTown(scene) {
  const T = new THREE.Group(); scene.add(T);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 280), new THREE.MeshStandardMaterial({ map: asphalt(), roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -100); road.receiveShadow = true; T.add(road);
  const sw = new THREE.MeshStandardMaterial({ map: tiles(), roughness: 0.9 });
  [-1, 1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 280), sw); p.position.set(s * 7.5, 0.15, -100); p.receiveShadow = true; T.add(p);
    box(0.3, 0.32, 280, std(0xd4cdc4), s * 5.15, 0.16, -100, T); // curb
  });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std(0x9ed97c, { roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.02, -100); grass.receiveShadow = true; T.add(grass);
  // crosswalk
  for (let i = 0; i < 6; i++) box(1.0, 0.03, 3, std(0xf4f4f4), -3.75 + i * 1.5, 0.02, -18, T);

  // buildings
  [-1, 1].forEach((s) => {
    let z = 22;
    while (z > -108) {
      const d = 9 + rnd() * 5, h = 9 + Math.floor(rnd() * 4) * 3.5, depth = 12;
      const col = PASTELS[Math.floor(rnd() * PASTELS.length)];
      const rows = Math.round(h / 3.4), shop = rnd() < 0.6;
      const tex = facade(col, rows, Math.max(2, Math.round(d / 3)), shop);
      const top = std(new THREE.Color(col).multiplyScalar(0.92));
      // BoxGeometry material order: +x, -x, +y, -y, +z, -z; the street-facing side gets the facade
      const front = std(0xffffff, { map: tex });
      const fixed = s > 0 ? [std(col), front, top, top, std(col), std(col)] : [front, std(col), top, top, std(col), std(col)];
      const g = new THREE.BoxGeometry(depth, h, d);
      const b = new THREE.Mesh(g, fixed); b.position.set(s * (10 + depth / 2), h / 2, z - d / 2); b.castShadow = b.receiveShadow = true; T.add(b);
      box(depth + 0.6, 0.7, d + 0.6, std(new THREE.Color(col).multiplyScalar(0.85)), s * (10 + depth / 2), h + 0.35, z - d / 2, T); // roof ledge
      if (rnd() < 0.5) box(2.2, 1.6, 2.2, std(0xb8bfcc), s * (12 + rnd() * 6), h + 1.5, z - d / 2, T); // rooftop AC
      z -= d + 0.4;
    }
  });
  for (let z = 14; z > -100; z -= 13) { tree(T, 8.3, z - 4, 0.9); tree(T, -8.3, z + 2, 0.9); }
  for (let z = 8; z > -100; z -= 26) { lamp(T, 5.8, z, 1); lamp(T, -5.8, z - 13, -1); }
  car(T, -3.6, -30, 0xff8f6b); car(T, 2.6, -48, 0x6fb6ff, Math.PI); car(T, -3.6, -66, 0xffd45c); car(T, 2.6, 10, 0xb98cf0, Math.PI);
  hydrant(T, 5.9, -4.5);
  bench(T, 9.0, 5.5, -Math.PI / 2);
  townHall(T, -122);
  // skyline: pale glass towers behind the town hall
  const gt = glassTower();
  for (let i = 0; i < 14; i++) {
    const w = 10 + rnd() * 10, h = 40 + rnd() * 70, x = -90 + i * 13 + rnd() * 6;
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.4, emissive: 0x9ccff5, emissiveIntensity: 0.35 }));
    t.position.set(x, h / 2, -175 - rnd() * 40); T.add(t);
  }
  return T;
}
