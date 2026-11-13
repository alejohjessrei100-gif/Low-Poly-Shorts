// Props and sets. Everything is built from rounded boxes, cylinders and canvas textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex } from './core.js';

export const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
export const glowMat = (color, k = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.5 });
export function box(w, h, d, m, x, y, z, parent, r = 0) {
  const g = r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
export function cyl(rt, rb, h, m, x, y, z, parent, seg = 20) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
export function group(parent, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }

// ---------------------------------------------------------------- text signs
export function textTex(lines, { w = 1024, h = 256, bg = '#ffffff', fg = '#1b1b24', font = 800, border = null, radius = 40, sizes = null } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, h, radius); g.fill();
    if (border) { g.strokeStyle = border; g.lineWidth = 18; g.beginPath(); g.roundRect(9, 9, w - 18, h - 18, radius); g.stroke(); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines];
    L.forEach((ln, i) => {
      const size = sizes ? sizes[i] : Math.min(h / L.length * 0.62, w / (ln.length * 0.62));
      g.font = `${font} ${size}px Poppins`;
      g.fillText(ln, w / 2, h * (i + 0.5) / L.length + 4);
    });
  });
}
export function sign(parent, lines, x, y, z, ry, sw, sh, opts = {}) {
  const t = textTex(lines, { w: 1024, h: Math.round(1024 * sh / sw), ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: opts.glow ? 0xffffff : 0, emissiveMap: opts.glow ? t : null, emissiveIntensity: opts.glow || 0, side: THREE.DoubleSide }));
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}

// ---------------------------------------------------------------- dynamic screen (phone, countdown) - redraw per frame
export function liveScreen(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, draw: (...a) => { draw(c.getContext('2d'), w, h, ...a); tex.needsUpdate = true; } };
}

export function phone(parent) {
  const g = new THREE.Group(); parent.add(g);
  box(0.95, 1.8, 0.12, std(0x22232c, { roughness: 0.3 }), 0, 0, 0, g, 0.08);
  const scr = liveScreen(360, 680, (c, w, h, mode, k) => {
    c.fillStyle = mode === 'news' ? '#ffffff' : '#9fd3f5'; c.fillRect(0, 0, w, h);
    if (mode === 'news') {
      c.fillStyle = '#e8434f'; c.fillRect(0, 0, w, 200);
      c.fillStyle = '#fff'; c.font = '800 58px Poppins'; c.textAlign = 'center'; c.fillText('BREAKING', w / 2, 90); c.fillText('NEWS', w / 2, 158);
      c.fillStyle = '#1b1b24'; c.font = '800 44px Poppins'; c.fillText('CITY BANK', w / 2, 300); c.fillText('ROBBED!', w / 2, 356);
      c.fillStyle = '#d7dbe6'; c.fillRect(40, 420, w - 80, 200); c.fillStyle = '#241a40'; c.fillRect(150, 450, 60, 150); c.beginPath(); c.arc(180, 455, 34, 0, 7); c.fill();
      c.fillStyle = '#e8434f'; c.font = '800 30px Poppins'; c.fillText('?', 250, 470);
    }
  });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.6), new THREE.MeshBasicMaterial({ map: scr.tex }));
  s.position.z = 0.065; g.add(s);
  return { g, scr };
}

// ---------------------------------------------------------------- street props
export function skateboard(parent) {
  const g = new THREE.Group(); parent.add(g);
  box(1.2, 0.12, 3.2, std(0xff7a3d), 0, 0.45, 0, g, 0.05);
  [[-0.45, 1.05], [0.45, 1.05], [-0.45, -1.05], [0.45, -1.05]].forEach(([x, z]) => { const w = cyl(0.18, 0.18, 0.2, std(0xf4f1e6), x, 0.2, z, g, 12); w.rotation.z = Math.PI / 2; });
  return g;
}
export function ramp(parent, x, z) { // low end at z, rises toward -z over 6 units, 5 wide
  const g = group(parent, 0, 0, 0);
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(6, 0); shape.lineTo(6, 3.2); shape.quadraticCurveTo(2.5, 0.4, 0, 0);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false }), std(0xf2b84b));
  m.rotation.y = Math.PI / 2; m.position.set(x - 2.5, 0, z); m.castShadow = m.receiveShadow = true; g.add(m);
  box(5, 0.3, 0.3, std(0x8a95a8, { metalness: 0.5 }), x, 3.25, z - 6, g);
  box(5, 3.2, 1.2, std(0xe0a43a), x, 1.6, z - 6.6, g);
  return g;
}
export function tapeRoll(parent) {
  const g = new THREE.Group(); parent.add(g);
  const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.45, 16, 32), std(0xd9c08a, { roughness: 0.5 })); r.castShadow = true; g.add(r);
  const strip = box(1.6, 0.04, 5, std(0xe8d9a8, { transparent: true, opacity: 0.85 }), 0, -1.4, 2.4, g);
  return { g, strip };
}
export function bench(parent, x, z, ry) {
  const g = group(parent, x, 0, z, ry);
  const wood = std(0xc9824f), iron = std(0x34405e);
  box(3.2, 0.18, 0.9, wood, 0, 1.0, 0, g, 0.06); box(3.2, 0.7, 0.16, wood, 0, 1.6, -0.42, g, 0.06);
  [-1.3, 1.3].forEach((a) => box(0.16, 1.0, 0.9, iron, a, 0.5, 0, g));
  return g;
}
export function iceCream(parent) {
  const g = new THREE.Group(); parent.add(g);
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 12), std(0xd99a52)); c.rotation.x = Math.PI; g.add(c);
  [0xff9cc2, 0xfff1d0].forEach((col, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), std(col)); s.position.y = 0.5 + i * 0.4; g.add(s); });
  return g;
}
export function pigeon(parent) {
  const g = new THREE.Group(); parent.add(g);
  box(0.6, 0.5, 0.9, std(0x9aa3b8), 0, 0.45, 0, g, 0.2);
  box(0.4, 0.4, 0.4, std(0x7d86a0), 0, 0.85, 0.35, g, 0.15);
  box(0.12, 0.08, 0.2, std(0xf2a33a), 0, 0.82, 0.62, g, 0.03);
  [-0.12, 0.12].forEach((x) => box(0.08, 0.08, 0.04, std(0x111111), x, 0.92, 0.56, g));
  return g;
}

// ---------------------------------------------------------------- vehicles
export function policeCar(parent, x, z, ry) {
  const g = group(parent, x, 0, z, ry);
  box(2.3, 1.1, 4.8, std(0xf6f7fb, { roughness: 0.35 }), 0, 0.95, 0, g, 0.3);
  box(2.32, 0.5, 2.0, std(0x1f2b55, { roughness: 0.35 }), 0, 1.1, 0.2, g, 0.1);
  box(2.0, 0.9, 2.4, std(0xf6f7fb, { roughness: 0.35 }), 0, 1.85, -0.2, g, 0.3);
  box(2.04, 0.65, 2.0, std(0x9fd0f0, { roughness: 0.1 }), 0, 1.9, -0.2, g, 0.15);
  [[-1.1, 1.5], [1.1, 1.5], [-1.1, -1.5], [1.1, -1.5]].forEach(([a, b]) => { const w = cyl(0.48, 0.48, 0.4, std(0x25252c), a, 0.48, b, g, 16); w.rotation.z = Math.PI / 2; });
  const red = glowMat(0xff2a3c, 0), blue = glowMat(0x2a6bff, 0);
  box(0.8, 0.3, 0.5, red, -0.45, 2.45, -0.2, g, 0.08); box(0.8, 0.3, 0.5, blue, 0.45, 2.45, -0.2, g, 0.08);
  const lr = new THREE.PointLight(0xff2a3c, 0, 18); lr.position.set(-0.5, 3, -0.2); g.add(lr);
  const lb = new THREE.PointLight(0x2a6bff, 0, 18); lb.position.set(0.5, 3, -0.2); g.add(lb);
  return { g, flash: (t) => { const a = Math.floor(t * 6) % 2; red.emissiveIntensity = a ? 3 : 0.2; blue.emissiveIntensity = a ? 0.2 : 3; lr.intensity = a ? 30 : 0; lb.intensity = a ? 0 : 30; } };
}

// ---------------------------------------------------------------- rooms
function room(parent, x, z, w, d, h, wallCol, floorTex) {
  const g = group(parent, x, 0, z);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wm = std(wallCol);
  box(w, h, 0.4, wm, 0, h / 2, -d / 2, g); box(0.4, h, d, wm, -w / 2, h / 2, 0, g); box(0.4, h, d, wm, w / 2, h / 2, 0, g);
  box(w, 0.4, d, std(0xf4f0ea), 0, h, 0, g); // ceiling
  box(w, 0.5, 0.45, std(0xffffff), 0, 0.25, -d / 2 + 0.05, g); // skirting
  return g;
}
const woodFloor = () => canvasTex(512, 512, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#c99566' : '#d4a173'; c.fillRect(0, i * 64, w, 64); c.fillStyle = 'rgba(80,40,20,.35)'; c.fillRect(0, i * 64, w, 3); c.fillRect((i * 173) % w, i * 64, 3, 64); } }, [3, 3]);
const tileFloor = () => canvasTex(256, 256, (c, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#f7f2ea' : '#e8798f'; c.fillRect(i * 64, j * 64, 64, 64); } }, [6, 6]);
const carpet = () => canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#8fb8e8'; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, [4, 4]);
const wallpaper = (a, b) => canvasTex(256, 256, (c, w, h) => { c.fillStyle = a; c.fillRect(0, 0, w, h); c.fillStyle = b; for (let i = 0; i < 8; i++) c.fillRect(i * 32, 0, 12, h); });

export function windowFrame(parent, x, y, z, ry, w = 3, h = 3, night = false) {
  const g = group(parent, x, y, z, ry);
  const sky = canvasTex(256, 256, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); if (night) { gr.addColorStop(0, '#0a1440'); gr.addColorStop(1, '#2a4a9a'); } else { gr.addColorStop(0, '#4fa8f5'); gr.addColorStop(1, '#cfeaff'); } c.fillStyle = gr; c.fillRect(0, 0, W, H); if (night) { c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(180, 70, 26, 0, 7); c.fill(); for (let i = 0; i < 40; i++) c.fillRect(Math.random() * W, Math.random() * H * 0.7, 2, 2); } });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sky })); g.add(p);
  const f = std(0xffffff);
  box(w + 0.3, 0.25, 0.3, f, 0, h / 2, 0.05, g); box(w + 0.3, 0.25, 0.3, f, 0, -h / 2, 0.05, g);
  box(0.25, h, 0.3, f, -w / 2, 0, 0.05, g); box(0.25, h, 0.3, f, w / 2, 0, 0.05, g); box(0.15, h, 0.2, f, 0, 0, 0.05, g); box(w, 0.15, 0.2, f, 0, 0, 0.05, g);
  return g;
}

export function bedroom(parent, x, z) {
  const g = room(parent, x, z, 16, 14, 9, 0xbcd7f2, carpet());
  const wp = new THREE.Mesh(new THREE.PlaneGeometry(15.6, 8.6), new THREE.MeshStandardMaterial({ map: wallpaper('#bcd7f2', '#cfe3f7') })); wp.position.set(0, 4.5, -6.78); g.add(wp);
  // bed (head against back wall, left side)
  const bed = group(g, -3.5, 0, -3.2);
  box(4.4, 1.3, 7, std(0x8a5a3c), 0, 0.65, 0, bed, 0.12);
  box(4.2, 0.8, 6.6, std(0xffffff), 0, 1.6, 0.1, bed, 0.3);
  const blanket = box(4.3, 0.5, 4.4, std(0x4f7fd9), 0, 2.05, 1.2, bed, 0.2);
  box(2.4, 0.6, 1.4, std(0xfff5e6), 0, 2.3, -2.4, bed, 0.25);
  box(4.6, 3.2, 0.4, std(0x8a5a3c), 0, 1.6, -3.4, bed, 0.12);
  // nightstand + lamp
  const ns = group(g, 0.4, 0, -5.4);
  box(1.8, 1.8, 1.6, std(0xd9a066), 0, 0.9, 0, ns, 0.1);
  cyl(0.15, 0.3, 1.2, std(0xf2c14e), 0, 2.4, 0, ns);
  const shade = cyl(0.55, 0.85, 0.9, glowMat(0xfff1c0, 0.8), 0, 3.3, 0, ns);
  const lampLight = new THREE.PointLight(0xffd79a, 25, 14, 1.6); lampLight.position.set(0, 3.2, 0.6); ns.add(lampLight);
  // door on the right wall
  const doorG = group(g, 7.75, 0, 1.5, -Math.PI / 2);
  box(3.6, 6.6, 0.3, std(0xffffff), 0, 3.3, -0.05, doorG); // frame
  const hinge = group(doorG, -1.55, 0, 0.1);
  const door = box(3.1, 6.2, 0.25, std(0xd98e5a), 1.55, 3.1, 0, hinge, 0.05);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), std(0xf2c14e, { metalness: 0.6, roughness: 0.3 })); knob.position.set(1.25, -0.1, 0.25); door.add(knob);
  const lock = box(0.18, 0.5, 0.1, std(0xc9a04a, { metalness: 0.6, roughness: 0.3 }), 1.25, 0.55, 0.2, door);
  // window, poster, desk
  const moon = new THREE.PointLight(0x8fb0ff, 0, 30, 1.2); moon.position.set(4, 5.5, -4.5); g.add(moon);
  const win = windowFrame(g, 4, 5, -6.75, 0, 3.6, 3.2, false);
  const winNight = windowFrame(g, 4, 5, -6.74, 0, 3.6, 3.2, true); winNight.visible = false;
  sign(g, ['BRAVE', 'MODE'], -7.75, 5.5, -1.5, Math.PI / 2, 2.4, 1.6, { bg: '#ffcf4d', fg: '#1b1b24' });
  box(3.6, 0.2, 1.8, std(0xf2f2f2), 5.2, 2.6, -5.6, g); box(0.2, 2.6, 1.6, std(0xd0d0d0), 3.6, 1.3, -5.6, g); box(0.2, 2.6, 1.6, std(0xd0d0d0), 6.8, 1.3, -5.6, g);
  return { g, bed, blanket, lampLight, shade, hinge, lock, win, winNight, moon };
}

export function bakery(parent, x, z) {
  const g = room(parent, x, z, 18, 14, 9, 0xffe0b8, tileFloor());
  box(14, 2.6, 2.2, std(0xf6d6e6), 0, 1.3, 1.5, g, 0.15); // counter
  box(14.4, 0.3, 2.6, std(0xffffff), 0, 2.75, 1.5, g, 0.1);
  for (let i = 0; i < 3; i++) box(16, 0.25, 1.6, std(0xc99566), 0, 2.8 + i * 1.8, -6.1, g); // shelves
  const breadM = std(0xd9934c, { roughness: 0.8 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 9; j++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.8, 4, 10), breadM); b.rotation.z = Math.PI / 2; b.position.set(-7 + j * 1.75, 3.25 + i * 1.8, -6.1); b.castShadow = true; g.add(b); }
  const cakeM = [std(0xff9cc2), std(0xfff1d0), std(0x9fd8b0)];
  for (let j = 0; j < 6; j++) { cyl(0.7, 0.7, 0.9, cakeM[j % 3], -5.5 + j * 2.2, 3.35, 1.5, g); }
  sign(g, ['BAKERY'], 0, 7.4, -6.75, 0, 7, 1.6, { bg: '#e8607d', fg: '#ffffff' });
  const flying = [];
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.8, 4, 10), breadM); b.castShadow = true; g.add(b); flying.push(b); }
  return { g, flying };
}

export function livingRoom(parent, x, z) {
  const g = room(parent, x, z, 16, 14, 9, 0xd9d0f2, woodFloor());
  const couch = group(g, 0, 0, 2.5, Math.PI);
  box(6, 1.4, 2.6, std(0x5fb0a6), 0, 0.9, 0, couch, 0.3); box(6, 2.2, 0.8, std(0x5fb0a6), 0, 1.9, 1.0, couch, 0.3);
  [-3, 3].forEach((a) => box(0.8, 1.9, 2.6, std(0x4f9a90), a, 1.1, 0, couch, 0.3));
  const tv = group(g, 0, 0, -6.2);
  box(5, 1.4, 1.4, std(0x8a5a3c), 0, 0.7, 0, tv, 0.1);
  box(5.6, 3.2, 0.3, std(0x18181f), 0, 3.3, 0.1, tv, 0.08);
  const screen = liveScreen(512, 288, (c, w, h, t) => { const hue = (t * 80) % 360; c.fillStyle = `hsl(${hue},70%,60%)`; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2 + Math.sin(t * 3) * 120, h / 2, 50, 0, 7); c.fill(); c.fillStyle = '#1b1b24'; c.font = '800 40px Poppins'; c.textAlign = 'center'; c.fillText('COOKING SHOW', w / 2, h - 30); });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.9), new THREE.MeshBasicMaterial({ map: screen.tex })); sm.position.set(0, 3.3, 0.27); tv.add(sm);
  const tvLight = new THREE.PointLight(0x9fd0ff, 18, 16); tvLight.position.set(0, 3.3, 2); tv.add(tvLight);
  const popcorn = group(g, 0, 0, 0);
  return { g, screen, popcorn };
}

export function vault(parent, x, z) {
  const g = room(parent, x, z, 18, 14, 9, 0xb9c2d4, canvasTex(64, 64, (c) => { c.fillStyle = '#9aa3b8'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#8a93a8'; c.fillRect(0, 0, 32, 32); c.fillRect(32, 32, 32, 32); }, [8, 8]));
  const door = cyl(4, 4, 0.8, std(0xc0c6d4, { metalness: 0.7, roughness: 0.35 }), 0, 4.4, -6.6, g, 40); door.rotation.x = Math.PI / 2;
  cyl(1.2, 1.2, 1.2, std(0x8a93a8, { metalness: 0.7, roughness: 0.3 }), 0, 4.4, -6.1, g, 24).rotation.x = Math.PI / 2;
  const goldM = std(0xf2c14e, { metalness: 0.6, roughness: 0.3 }), cash = std(0x6fcf7f);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(1.6, 0.6, 0.9, i % 2 ? goldM : cash, -6 + j * 1.8, 0.3 + i * 0.62, -3.8, g, 0.05);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(1.6, 0.6, 0.9, i % 2 ? cash : goldM, 3.2 + j * 1.8, 0.3 + i * 0.62, -3.8, g, 0.05);
  return { g };
}

export function moneyBag(parent) {
  const g = new THREE.Group(); parent.add(g);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), std(0xd9c08a)); b.scale.set(1, 1.1, 1); b.castShadow = true; g.add(b);
  sign(g, ['$'], 0, 0, 0.78, 0, 0.7, 0.7, { bg: 'rgba(0,0,0,0)', fg: '#2e7d32' });
  return g;
}

// ---------------------------------------------------------------- exteriors
export function house(parent, x, z, ry, col = 0xf6cfd8, roofCol = 0x6b7fd9) {
  const g = group(parent, x, 0, z, ry);
  box(12, 7, 10, std(col), 0, 3.5, 0, g);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 9.2, 4.2, 4, 1), std(roofCol)); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.8); roof.position.set(0, 9.1, 0); roof.castShadow = true; g.add(roof);
  box(2.2, 4, 0.3, std(0xffffff), 0, 2, 5.05, g); box(1.8, 3.6, 0.3, std(0x8a5a3c), 0, 1.8, 5.15, g);
  const wins = [];
  [[-3.6, 4.2], [3.6, 4.2], [-3.6, 1.6], [3.6, 1.6]].slice(0, 2).forEach(([a, b]) => {
    box(2.6, 2.4, 0.3, std(0xffffff), a, b, 5.05, g);
    const w = box(2.2, 2.0, 0.32, new THREE.MeshStandardMaterial({ color: 0x8fc8f0, emissive: 0xffd27a, emissiveIntensity: 0 }), a, b, 5.08, g); wins.push(w);
  });
  box(14, 0.4, 3, std(0xd9cfc4), 0, 0.2, 6.6, g); // porch
  return { g, wins };
}

export function powerPlantExterior(parent, x, z) {
  const g = group(parent, x, 0, z);
  const conc = std(0x8f96a8), dark = std(0x5a6178);
  box(30, 14, 18, conc, 0, 7, 0, g);
  box(31, 1, 19, dark, 0, 14.5, 0, g);
  [-9, -3, 3].forEach((a) => { cyl(1.8, 2.4, 26, std(0x9aa1b4), a, 13, -4, g); cyl(1.9, 1.9, 1.2, std(0xd9434f), a, 24, -4, g); });
  for (let i = 0; i < 6; i++) box(2.6, 4, 0.3, std(0x2a3352, { emissive: 0x6fd0ff, emissiveIntensity: 0.25 }), -11 + i * 4.4, 9, 9.05, g);
  box(6, 6, 0.4, std(0x3a3f52), 0, 3, 9.1, g);
  sign(g, ['OLD POWER PLANT'], 0, 12.2, 9.3, 0, 14, 1.8, { bg: '#d9434f', fg: '#ffffff' });
  // fence
  for (let i = -20; i <= 20; i += 2) box(0.15, 3.6, 0.15, std(0x6b7288, { metalness: 0.4 }), i, 1.8, 20, g);
  box(41, 0.15, 0.15, std(0x6b7288), 0, 3.4, 20, g); box(41, 0.15, 0.15, std(0x6b7288), 0, 1.6, 20, g);
  const danger = sign(g, ['DANGER', 'HIGH VOLTAGE'], 6, 2.4, 20.1, 0, 3.4, 1.8, { bg: '#ffd84d', fg: '#1b1b24' });
  // power lines + pylons leading away
  for (let i = 0; i < 4; i++) { const p = group(g, 26 + i * 18, 0, 6); box(0.5, 16, 0.5, std(0x7a8197), 0, 8, 0, p); box(8, 0.4, 0.4, std(0x7a8197), 0, 15, 0, p); }
  return { g, danger };
}

export function powerPlantInterior(parent, x, z) {
  const g = group(parent, x, 0, z);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#3a4058'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#2a2f44'; c.lineWidth = 4; c.strokeRect(0, 0, 128, 128); c.fillStyle = '#ffd84d'; c.fillRect(0, 0, 128, 6); }, [14, 14]), roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wall = std(0x4a5170);
  box(90, 34, 1, wall, 0, 17, -45, g); box(1, 34, 90, wall, -45, 17, 0, g); box(1, 34, 90, wall, 45, 17, 0, g);
  box(41, 34, 1, wall, -24.5, 17, 45, g); box(41, 34, 1, wall, 24.5, 17, 45, g); box(8, 26, 1, wall, 0, 21, 45, g); // front wall with a doorway
  for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xa8c4ff, 160, 70, 1.3); l.position.set(-30 + (i % 3) * 30, 30, i < 3 ? -20 : 20); g.add(l); }
  for (let i = -40; i <= 40; i += 10) { if (Math.abs(i) > 5) box(1.2, 34, 1.2, std(0x6b7288, { metalness: 0.4 }), i, 17, -44, g); }
  box(90, 1.4, 1.4, std(0x6b7288), 0, 33.5, -40, g); box(90, 1.4, 1.4, std(0x6b7288), 0, 30, 10, g);
  // the machine
  const M = group(g, 0, 0, -18);
  cyl(7, 8, 3, std(0x5a6178, { metalness: 0.5, roughness: 0.4 }), 0, 1.5, 0, M, 32);
  const core = cyl(4.5, 4.5, 16, std(0x7b84a0, { metalness: 0.6, roughness: 0.3 }), 0, 11, 0, M, 32);
  const rings = [];
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.45, 12, 40), glowMat(0x6fd0ff, 1.2)); r.rotation.x = Math.PI / 2; r.position.y = 5 + i * 3.6; M.add(r); rings.push(r); }
  cyl(3, 4.5, 3, std(0x5a6178, { metalness: 0.5 }), 0, 20.5, 0, M, 32);
  const coreLight = new THREE.PointLight(0x6fd0ff, 120, 60, 1.5); coreLight.position.set(0, 12, 6); M.add(coreLight);
  // cables to the walls ("wired to every power line in the city")
  const cableM = std(0x1d2030, { roughness: 0.6 });
  const cables = [];
  for (let i = 0; i < 10; i++) {
    const a = -1.2 + i * 0.27;
    const end = new THREE.Vector3(Math.sin(a) * 44, 22 + (i % 3) * 3, -18 + Math.cos(a) * -26);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.sin(a) * 5, 16, -18 + Math.cos(a) * 0.1), new THREE.Vector3(Math.sin(a) * 22, 8, -18 + Math.cos(a) * -8), end);
    const c = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.45, 8, false), cableM); c.castShadow = true; g.add(c); cables.push(c);
  }
  // money stacks around it
  const cash = std(0x6fcf7f), band = std(0xffffff);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, r = 11 + (i % 3) * 2.2, hgt = 1 + (i * 7) % 4;
    for (let k = 0; k < hgt; k++) { box(2.2, 0.9, 1.3, cash, Math.sin(a) * r, 0.45 + k * 0.92, -18 + Math.cos(a) * r, g, 0.05); }
    box(0.3, hgt * 0.92, 1.32, band, Math.sin(a) * r, hgt * 0.46, -18 + Math.cos(a) * r, g);
  }
  // countdown screen on the back wall (portrait, so it fits a 9:16 frame)
  const screen = liveScreen(640, 720, (c, w, h, secs, flash) => {
    c.fillStyle = '#0b0f22'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ff3b4d'; c.lineWidth = 18; c.strokeRect(9, 9, w - 18, h - 18);
    c.fillStyle = flash ? '#ff3b4d' : '#ff6b78'; c.textAlign = 'center';
    c.font = '800 86px Poppins'; c.fillText('CITY', w / 2, 140); c.fillText('BLACKOUT IN', w / 2, 240);
    c.font = '800 190px Poppins'; const sc = Math.max(0, Math.ceil(secs)); c.fillText(`${String(Math.floor(sc / 60)).padStart(2, '0')}:${String(sc % 60).padStart(2, '0')}`, w / 2, 520);
    c.font = '800 54px Poppins'; c.fillText('SECONDS', w / 2, 630);
  });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(14, 15.75), new THREE.MeshBasicMaterial({ map: screen.tex })); sm.position.set(0, 25, -44.3); g.add(sm);
  const screenLight = new THREE.PointLight(0xff4050, 80, 50, 1.4); screenLight.position.set(0, 22, -36); g.add(screenLight);
  // the big red button
  const B = group(g, 0, 0, 2);
  cyl(1.6, 2, 3.2, std(0x3a3f52, { metalness: 0.4 }), 0, 1.6, 0, B, 24);
  box(3.6, 0.2, 3.6, std(0xffd84d), 0, 3.25, 0, B);
  const btn = cyl(1.1, 1.2, 0.8, glowMat(0xff2a3c, 0.6), 0, 3.7, 0, B, 28);
  const btnLight = new THREE.PointLight(0xff2a3c, 25, 12); btnLight.position.set(0, 5, 0); B.add(btnLight);
  sign(B, ['CANCEL'], 0, 2.2, 1.65, 0, 2.4, 0.7, { bg: '#ffd84d', fg: '#1b1b24' });
  return { g, M, rings, core, coreLight, screen, btn, B, cables };
}

export function school(parent, x, z, ry) {
  const g = group(parent, x, 0, z, ry);
  box(34, 12, 12, std(0xf2b96b), 0, 6, 0, g);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { box(3.2, 3, 0.3, std(0xffffff), -13 + i * 5.2, 3.6 + r * 4.6, 6.05, g); box(2.8, 2.6, 0.32, std(0x8fc8f0), -13 + i * 5.2, 3.6 + r * 4.6, 6.08, g); }
  box(5, 6, 0.4, std(0xffffff), 0, 3, 6.1, g); box(4.2, 5.4, 0.42, std(0xd9434f), 0, 2.7, 6.12, g);
  sign(g, ['SCHOOL'], 0, 10.4, 6.25, 0, 10, 2, { bg: '#ffffff', fg: '#2f4a8a' });
  box(0.2, 14, 0.2, std(0xcccccc), 14, 7, 9, g); box(3, 1.8, 0.05, std(0x6fb6ff), 15.5, 13, 9, g);
  return g;
}

export function bank(parent, x, z, ry) {
  const g = group(parent, x, 0, z, ry);
  const white = std(0xf1efe9);
  box(30, 1.6, 6, std(0xdcd6cc), 0, 0.8, 7, g);
  box(28, 14, 12, white, 0, 7, 0, g);
  for (let i = 0; i < 6; i++) cyl(0.75, 0.85, 11.5, white, -11 + i * 4.4, 7.4, 7.2, g);
  box(30, 1.6, 14, white, 0, 14.6, 0.6, g);
  sign(g, ['CITY BANK'], 0, 16.5, 7.7, 0, 16, 2.6, { bg: '#2f4a8a', fg: '#ffd84d' });
  const doorL = box(2.2, 6, 0.3, std(0x6d4a2e), -1.15, 4.6, 6.1, g); const doorR = box(2.2, 6, 0.3, std(0x6d4a2e), 1.15, 4.6, 6.1, g);
  doorL.rotation.y = 0.9; doorR.rotation.y = -0.6;
  const alarm = glowMat(0xff2a3c, 0); box(1.2, 1.2, 1.2, alarm, 9, 12.5, 6.4, g, 0.3); box(1.2, 1.2, 1.2, alarm, -9, 12.5, 6.4, g, 0.3);
  const aLight = new THREE.PointLight(0xff2a3c, 0, 30); aLight.position.set(0, 12, 10); g.add(aLight);
  const bills = [];
  const billM = new THREE.MeshStandardMaterial({ color: 0x8fdc8f, side: THREE.DoubleSide });
  for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), billM); g.add(b); bills.push(b); }
  // bills are animated in the episode in this group's local space (in front of the doors = +z)
  return { g, bills, flash: (t) => { const a = (Math.sin(t * 14) + 1) / 2; alarm.emissiveIntensity = a * 3; aLight.intensity = a * 80; } };
}
