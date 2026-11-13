// Episode 2 set pieces: clock tower (exterior + interior machine room), lake, siren, clouds, ice cream truck,
// anchor + chain, boots shop, delivery truck, billboard. Same building blocks as props.js.
import * as THREE from 'three';
import { std, glowMat, box, cyl, group, sign, liveScreen, textTex } from './props.js';
import { canvasTex } from './core.js';

const brick = (a = '#c96a52', b = '#b65a44') => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#e8d8c8'; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let k = -1; k < 5; k++) { c.fillStyle = (r + k) % 3 ? a : b; c.fillRect(k * 64 + (r % 2) * 32 + 2, r * 16 + 2, 60, 12); }
}, [3, 8]);

// ---------------------------------------------------------------- clock face (shared by tower and close-ups)
export function clockFace(size = 512) {
  let hh = 3, mm = 0;
  const s = liveScreen(size, size, (c, w, h) => {
    c.fillStyle = '#fff8e6'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.47, 0, 7); c.fill();
    c.strokeStyle = '#2b2f45'; c.lineWidth = w * 0.035; c.stroke();
    c.fillStyle = '#2b2f45'; c.font = `800 ${w * 0.1}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle';
    ['XII', 'III', 'VI', 'IX'].forEach((t, i) => { const a = i * Math.PI / 2; c.fillText(t, w / 2 + Math.sin(a) * w * 0.36, h / 2 - Math.cos(a) * w * 0.36); });
    for (let i = 0; i < 12; i++) if (i % 3) { const a = i / 12 * 6.283; c.beginPath(); c.arc(w / 2 + Math.sin(a) * w * 0.38, h / 2 - Math.cos(a) * w * 0.38, w * 0.018, 0, 7); c.fill(); }
    const hand = (a, len, wd, col) => { c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round'; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.sin(a) * len, h / 2 - Math.cos(a) * len); c.stroke(); };
    hand(((hh % 12) + mm / 60) / 12 * 6.283, w * 0.22, w * 0.04, '#2b2f45');
    hand(mm / 60 * 6.283, w * 0.33, w * 0.025, '#d9434f');
    c.fillStyle = '#2b2f45'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.03, 0, 7); c.fill();
  });
  return { tex: s.tex, set(h, m) { hh = h; mm = m; s.draw(0); } };
}

// ---------------------------------------------------------------- the old clock tower, door facing +z
export function clockTower(parent, x, z) {
  const g = group(parent, x, 0, z);
  const bm = std(0xffffff, { map: brick() }), trim = std(0xe8dcc8), roofM = std(0x4f5a8a), dark = std(0x2b2f45);
  box(16, 3, 16, trim, 0, 1.5, 0, g); // plinth
  box(13, 46, 13, bm, 0, 26, 0, g);
  [-6.6, 6.6].forEach((a) => [-6.6, 6.6].forEach((b) => box(1.4, 46, 1.4, trim, a, 26, b, g)));
  for (let y = 10; y < 46; y += 9) box(13.6, 0.8, 13.6, trim, 0, y, 0, g);
  box(4, 6.5, 0.6, dark, 0, 6.2, 6.6, g); box(5, 0.8, 1, trim, 0, 9.8, 6.7, g);
  for (let y = 14; y < 40; y += 9) [[0, 6.62, 0], [6.62, 0, Math.PI / 2], [0, -6.62, Math.PI], [-6.62, 0, -Math.PI / 2]].forEach(([a, b, r]) => {
    const w = box(1.6, 3.2, 0.3, std(0x8fc8f0, { emissive: 0xffd27a, emissiveIntensity: 0 }), a, y, b, g); w.rotation.y = r;
  });
  // clock storey
  box(15, 14, 15, trim, 0, 56, 0, g);
  const face = clockFace(512);
  const fm = new THREE.MeshStandardMaterial({ map: face.tex, roughness: 0.5, emissive: 0xfff2d0, emissiveMap: face.tex, emissiveIntensity: 0.15 });
  [[0, 7.55, 0], [7.55, 0, Math.PI / 2], [0, -7.55, Math.PI], [-7.55, 0, -Math.PI / 2]].forEach(([a, b, r]) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(5.6, 48), fm); m.position.set(a, 56, b); m.rotation.y = r; g.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.7, 0.35, 8, 48), std(0xf2c14e, { metalness: 0.5, roughness: 0.3 })); ring.position.set(a * 1.005, 56, b * 1.005); ring.rotation.y = r; g.add(ring);
  });
  // belfry and roof
  box(15.6, 1, 15.6, roofM, 0, 63.5, 0, g);
  [-6, 6].forEach((a) => [-6, 6].forEach((b) => box(1.6, 7, 1.6, trim, a, 67.5, b, g)));
  const bell = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 12, 0, 6.3, 0, 1.9), std(0xd9a640, { metalness: 0.6, roughness: 0.35 })); bell.position.set(0, 69, 0); g.add(bell);
  box(16, 1, 16, roofM, 0, 71.5, 0, g);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 11.3, 14, 4, 1), roofM); roof.rotation.y = Math.PI / 4; roof.position.set(0, 79, 0); roof.castShadow = true; g.add(roof);
  // statue platform at the very top (the statue is placed by the episode)
  cyl(1.8, 2.2, 1.2, trim, 0, 86.4, 0, g, 16);
  const top = new THREE.Object3D(); top.position.set(0, 87, 0); g.add(top);
  // plaza around it
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#e6dccf'; c.fillRect(0, 0, w, h); c.strokeStyle = '#cbbfae'; c.lineWidth = 3; for (let i = 0; i < w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, [10, 10]), roughness: 0.9 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.06; plaza.receiveShadow = true; g.add(plaza);
  return { g, face, bell, top };
}

// ---------------------------------------------------------------- lake with a dock and reeds
export function lake(parent, x, z, w, d) {
  const g = group(parent, x, 0, z);
  const water = liveScreen(256, 256, (c, W, H, t) => {
    c.fillStyle = '#5fb6e6'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const y = (i * 37 + t * 12) % H, xx = (i * 71) % W; c.beginPath(); c.moveTo(xx, y); c.quadraticCurveTo(xx + 14, y - 5, xx + 28, y); c.stroke(); }
  });
  water.tex.wrapS = water.tex.wrapT = THREE.RepeatWrapping; water.tex.repeat.set(w / 20, d / 20);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: water.tex, roughness: 0.15, metalness: 0.1 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.08; m.receiveShadow = true; g.add(m);
  const shore = std(0xd9c79a);
  box(w + 3, 0.3, 1.5, shore, 0, 0.1, -d / 2 - 0.7, g); box(w + 3, 0.3, 1.5, shore, 0, 0.1, d / 2 + 0.7, g);
  box(1.5, 0.3, d, shore, -w / 2 - 0.7, 0.1, 0, g); box(1.5, 0.3, d, shore, w / 2 + 0.7, 0.1, 0, g);
  const wood = std(0xb07a4a);
  box(3, 0.4, 14, wood, -w / 4, 0.7, d / 2 - 6, g);
  for (let i = 0; i < 4; i++) [-1.3, 1.3].forEach((a) => cyl(0.2, 0.2, 1.6, wood, -w / 4 + a, 0.3, d / 2 - 12 + i * 4, g, 8));
  for (let i = 0; i < 30; i++) { const a = i * 2.4; cyl(0.08, 0.08, 1.6 + (i % 3) * 0.4, std(0x5a9a4a), Math.sin(a) * w * 0.48, 0.8, d / 2 - 1 + (i % 2) * 0.6 - (i % 5), g, 5); }
  return { g, water };
}

// ---------------------------------------------------------------- tower interior: stairs, walkway, machine, lever
export function towerInterior(parent, x, z) {
  const g = group(parent, x, 0, z);
  const W = 34, D = 28, H = 44;
  const wall = std(0xffffff, { map: brick('#a8604e', '#96503f') }), stone = std(0x8a8296), metal = std(0x7a8296, { metalness: 0.5, roughness: 0.4 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#7d7488'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#6f6679'; c.fillRect(0, 0, 64, 64); c.fillRect(64, 64, 64, 64); }, [8, 8]), roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  box(W, H, 0.6, wall, 0, H / 2, -D / 2, g); box(0.6, H, D, wall, -W / 2, H / 2, 0, g); box(0.6, H, D, wall, W / 2, H / 2, 0, g);
  box(W, 0.6, D, stone, 0, H, 0, g);
  // tall arched windows with evening light
  [-11, 11].forEach((a) => { box(3.2, 9, 0.3, std(0xffc98a, { emissive: 0xffb070, emissiveIntensity: 0.9 }), a, 30, -D / 2 + 0.35, g); box(3.8, 0.5, 0.6, stone, a, 25.3, -D / 2 + 0.5, g); });
  // stairs climbing the left wall up to the walkway (y 18)
  const N = 24;
  for (let i = 0; i < N; i++) box(4, 0.6, 1.4, stone, -W / 2 + 2.3, 0.6 + i * 0.75, D / 2 - 2 - i * 1.0, g);
  // walkway along the back wall with a railing
  box(W - 1, 0.8, 5, metal, 0, 18, -D / 2 + 2.8, g);
  const railM = std(0xf2c14e, { metalness: 0.6, roughness: 0.3 });
  box(W - 6, 0.25, 0.25, railM, 2, 20.6, -D / 2 + 5.2, g);
  for (let i = -13; i <= 15; i += 2.5) box(0.2, 2.6, 0.2, railM, i, 19.3, -D / 2 + 5.2, g);
  // the machine: base, glowing core, coils, pipes, wall gears
  const M = group(g, 2, 0, -3);
  cyl(6.5, 7.5, 3, metal, 0, 1.5, 0, M, 32);
  cyl(4.5, 5, 12, std(0x4a5068, { metalness: 0.6, roughness: 0.35 }), 0, 9, 0, M, 32);
  const coreM = glowMat(0x7fd8ff, 1.6);
  const core = cyl(2.2, 2.2, 13, coreM, 0, 9.5, 0, M, 24); core.material.transparent = true; core.material.opacity = 0.9;
  const coils = [];
  for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.45, 10, 40), glowMat(0x9fe0ff, 1.2)); r.rotation.x = Math.PI / 2; r.position.y = 4.5 + i * 2.6; M.add(r); coils.push(r); }
  cyl(3, 4.5, 3, metal, 0, 16.5, 0, M, 24);
  [[-7, 0], [7, 0]].forEach(([a]) => { const p = cyl(0.6, 0.6, 30, std(0xb87a4a, { metalness: 0.6, roughness: 0.3 }), a * 1.6, 15, -10, g, 12); });
  const gears = [];
  [[-12, 34, 4.5], [-4, 37, 3.2], [10, 35, 4], [15, 28, 2.6]].forEach(([a, b, r]) => {
    const gg = group(g, a, b, -D / 2 + 0.8);
    const disc = cyl(r, r, 0.6, std(0xc8a050, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, gg, 28); disc.rotation.x = Math.PI / 2;
    for (let k = 0; k < 12; k++) { const t = box(r * 0.28, r * 0.28, 0.6, disc.material, Math.sin(k / 12 * 6.283) * r, Math.cos(k / 12 * 6.283) * r, 0, gg); t.rotation.z = -k / 12 * 6.283; }
    cyl(r * 0.25, r * 0.25, 0.8, metal, 0, 0, 0.2, gg, 16).rotation.x = Math.PI / 2;
    gears.push(gg);
  });
  // gauge: 1H 2H 5H FOREVER, needle driven by the episode
  let needle = 0;
  const gauge = liveScreen(512, 512, (c, w, h) => {
    c.fillStyle = '#1b1f33'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff8e6'; c.beginPath(); c.arc(w / 2, h * 0.62, w * 0.42, Math.PI, 0); c.fill();
    c.fillStyle = '#1b1f33'; c.font = '800 44px Poppins'; c.textAlign = 'center';
    [['1H', -1.35], ['2H', -0.75], ['5H', -0.1], ['∞', 0.55]].forEach(([t, a]) => c.fillText(t, w / 2 + Math.sin(a) * w * 0.32, h * 0.62 - Math.cos(a) * w * 0.32 + 14));
    c.fillStyle = '#ff3b4d'; c.beginPath(); c.arc(w / 2 + Math.sin(1.2) * w * 0.32, h * 0.62 - Math.cos(1.2) * w * 0.32, 0, 0, 7);
    const a = -1.35 + needle * 1.9;
    c.strokeStyle = '#e8434f'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(w / 2, h * 0.62); c.lineTo(w / 2 + Math.sin(a) * w * 0.36, h * 0.62 - Math.cos(a) * w * 0.36); c.stroke();
    c.fillStyle = '#1b1f33'; c.beginPath(); c.arc(w / 2, h * 0.62, 22, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = '800 48px Poppins'; c.fillText('GRAVITY OFF', w / 2, h * 0.88);
  });
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: gauge.tex })); gm.position.set(2, 25, -D / 2 + 0.7); g.add(gm);
  box(7.6, 7.6, 0.4, metal, 2, 25, -D / 2 + 0.5, g);
  // countdown screen on the right wall
  let secs = 600;
  const count = liveScreen(640, 640, (c, w, h, t, flash) => {
    c.fillStyle = '#0b0f22'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ff3b4d'; c.lineWidth = 18; c.strokeRect(9, 9, w - 18, h - 18);
    c.fillStyle = flash ? '#ff3b4d' : '#ff6b78'; c.textAlign = 'center';
    c.font = '800 70px Poppins'; c.fillText('GRAVITY OFF', w / 2, 130); c.fillText('FOREVER IN', w / 2, 215);
    const s = Math.max(0, Math.ceil(secs)); c.font = '800 180px Poppins'; c.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, w / 2, 430);
    c.font = '800 50px Poppins'; c.fillText('MINUTES', w / 2, 540);
  });
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: count.tex })); cm.position.set(W / 2 - 0.4, 28, -1); cm.rotation.y = -Math.PI / 2; g.add(cm);
  // the lever on the walkway: base box + pivot with a long arm and a red knob
  const LV = group(g, 12, 18.4, -D / 2 + 3.2);
  box(2.4, 1.6, 2.4, metal, 0, 0.8, 0, LV);
  const pivot = group(LV, 0, 1.6, 0);
  box(0.5, 6, 0.5, std(0x3a3f52, { metalness: 0.6, roughness: 0.3 }), 0, 3, 0, pivot);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), std(0xe8434f, { roughness: 0.3 })); knob.position.y = 6.2; knob.castShadow = true; pivot.add(knob);
  const plate = textTex(['FOREVER ←      → OFF'], { w: 1024, h: 160, bg: '#2b2f45', fg: '#ffd84d', radius: 20 });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.8), new THREE.MeshBasicMaterial({ map: plate })); pm.position.set(0, 1.0, 1.25); LV.add(pm);
  // alarm beacons
  const alarms = [];
  [[-14, 40, -10], [14, 40, -10], [0, 40, 8]].forEach(([a, b, c2]) => {
    const l = new THREE.PointLight(0xff2a3a, 0, 60, 1.2); l.position.set(a, b - 2, c2); g.add(l);
    const m = box(1.4, 1.4, 1.4, glowMat(0xff2a3a, 0.2), a, b, c2, g); alarms.push({ l, m });
  });
  const lamps = [];
  [[-10, 36, 0], [10, 36, 0], [0, 36, -8]].forEach(([a, b, c2]) => { const l = new THREE.PointLight(0xffc98a, 120, 70, 1.3); l.position.set(a, b, c2); g.add(l); lamps.push(l); box(1.2, 0.6, 1.2, glowMat(0xffe0b0, 1.5), a, b + 0.6, c2, g); });
  return {
    g, W, D, H, pivot, gears, coils, core,
    setNeedle(k) { needle = k; gauge.draw(0); },
    setCount(s, flash = false) { secs = s; count.draw(0, flash); },
    alarm(t) { const on = t >= 0; alarms.forEach(({ l, m }, i) => { const f = on ? 0.5 + 0.5 * Math.sin(t * 9 + i * 2) : 0; l.intensity = on ? 220 * f : 0; m.material.emissiveIntensity = on ? 0.4 + 2 * f : 0.2; }); },
  };
}

// ---------------------------------------------------------------- small pieces
export function sirenPole(parent, x, y, z) {
  const g = group(parent, x, y, z);
  cyl(0.25, 0.3, 6, std(0x6a7086, { metalness: 0.5 }), 0, 3, 0, g, 10);
  const head = group(g, 0, 6.2, 0);
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((r) => { const hg = group(head, 0, 0, 0, r); const h = cyl(0.25, 1.0, 1.6, std(0xdfe3ec, { metalness: 0.3 }), 0, 0, 0.9, hg, 16); h.rotation.x = Math.PI / 2; });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10), glowMat(0xff2a3a, 0.3)); beacon.position.y = 1.0; head.add(beacon);
  const light = new THREE.PointLight(0xff2a3a, 0, 30, 1.5); light.position.y = 1.0; head.add(light);
  return { g, head, on(t) { const f = t < 0 ? 0 : 0.5 + 0.5 * Math.sin(t * 12); beacon.material.emissiveIntensity = t < 0 ? 0.3 : 0.6 + 2.5 * f; light.intensity = t < 0 ? 0 : 60 * f; head.rotation.y = t < 0 ? 0 : t * 4; } };
}

export function cloud(parent, s = 1) {
  const g = new THREE.Group(); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xdfe8ff, emissiveIntensity: 0.25 });
  [[0, 0, 0, 3.2], [3, -0.4, 0.5, 2.4], [-3, -0.5, -0.3, 2.5], [1.2, 1.4, -0.5, 2.2], [-1.4, 1.0, 0.8, 2.0], [5, -0.9, -0.6, 1.6], [-5.2, -0.9, 0.4, 1.5]].forEach(([a, b, c, r]) => {
    const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), m); o.position.set(a * s, b * s, c * s); o.receiveShadow = true; g.add(o);
  });
  return g;
}

export function football(parent) {
  const t = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b1b24'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { c.beginPath(); const x = i * 44 + (j % 2) * 22 + 10, y = j * 44 + 20; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; c.lineTo(x + Math.sin(a) * 11, y - Math.cos(a) * 11); } c.fill(); } });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 14), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); b.castShadow = true; parent.add(b); return b;
}

export function iceTruck(parent) {
  const g = new THREE.Group(); parent.add(g);
  const pink = std(0xffb3cf, { roughness: 0.4 }), white = std(0xffffff), glass = std(0x9fd0f0, { roughness: 0.1 });
  box(4, 4.6, 8, pink, 0, 3.1, -1, g, 0.3);
  box(4, 3, 3, white, 0, 2.3, 4.4, g, 0.3); box(3.6, 1.4, 0.2, glass, 0, 3.0, 5.9, g);
  box(0.2, 2, 3.6, glass, 2.05, 3.6, -1, g); box(0.6, 0.25, 4, white, 2.3, 2.5, -1, g);
  const banner = textTex(['ICE CREAM'], { w: 1024, h: 220, bg: '#ffffff', fg: '#e8607d', radius: 30 });
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.3), new THREE.MeshBasicMaterial({ map: banner })); bm.position.set(2.03, 5.0, -1); bm.rotation.y = Math.PI / 2; g.add(bm);
  const bm2 = bm.clone(); bm2.position.x = -2.03; bm2.rotation.y = -Math.PI / 2; g.add(bm2);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 16), std(0xe0a060)); cone.rotation.x = Math.PI; cone.position.set(0, 6.6, -1); g.add(cone);
  const scoop = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), std(0xff9cc2)); scoop.position.set(0, 8.1, -1); g.add(scoop);
  [[-1.9, 3.3], [1.9, 3.3], [-1.9, -3.2], [1.9, -3.2]].forEach(([a, b]) => { const w = cyl(0.7, 0.7, 0.5, std(0x25252c), a, 0.7, b, g, 16); w.rotation.z = Math.PI / 2; });
  return g;
}

export function trashBin(parent, col = 0x4f9a90) {
  const g = new THREE.Group(); parent.add(g);
  cyl(0.8, 0.7, 2, std(col), 0, 1, 0, g, 16); cyl(0.88, 0.88, 0.25, std(new THREE.Color(col).multiplyScalar(0.8).getHex()), 0, 2.1, 0, g, 16);
  return g;
}

export function anchor(parent) {
  const g = new THREE.Group(); parent.add(g);
  const m = std(0x4a5068, { metalness: 0.6, roughness: 0.4 });
  box(0.9, 9, 0.9, m, 0, 4.5, 0, g);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.3, 10, 24), m); ring.position.y = 9.9; ring.castShadow = true; g.add(ring);
  box(5, 0.7, 0.7, m, 0, 7.6, 0, g);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.5, 10, 30, Math.PI), m); arm.rotation.z = Math.PI; arm.position.y = 3.3; arm.castShadow = true; g.add(arm);
  [-1, 1].forEach((s) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 4), m); f.position.set(s * 3.4, 3.8, 0); f.castShadow = true; g.add(f); });
  return g;
}

/** chain of n links between two points; call .span(a, b) each frame */
export function chain(parent, n = 18) {
  const m = std(0x6a7086, { metalness: 0.6, roughness: 0.35 });
  const links = [];
  for (let i = 0; i < n; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.13, 6, 14), m); l.castShadow = true; parent.add(l); links.push(l); }
  const up = new THREE.Vector3(0, 1, 0);
  return {
    links,
    span(a, b, sag = 0) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A).normalize();
      links.forEach((l, i) => {
        const k = (i + 0.5) / n; l.visible = true;
        l.position.lerpVectors(A, B, k); l.position.y -= Math.sin(k * Math.PI) * sag;
        l.quaternion.setFromUnitVectors(up, dir); if (i % 2) l.rotateY(Math.PI / 2);
      });
    },
    hide() { links.forEach((l) => (l.visible = false)); },
  };
}

export function heavyBoot(parent, gold = false) {
  const g = new THREE.Group(); parent.add(g);
  const m = std(gold ? 0xf2c14e : 0x5a6074, { metalness: 0.7, roughness: 0.3 }), sole = std(0x2b2f45);
  box(1.3, 2.2, 1.3, m, 0, 1.4, -0.2, g, 0.15); box(1.4, 0.9, 2.3, m, 0, 0.55, 0.3, g, 0.15); box(1.5, 0.35, 2.5, sole, 0, 0.12, 0.3, g, 0.08);
  [0.9, 1.5, 2.1].forEach((y) => box(1.36, 0.14, 1.36, std(0xf2c14e, { metalness: 0.8, roughness: 0.25 }), 0, y, -0.2, g));
  return g;
}

export function bootsShop(parent, x, z, ry) {
  const g = group(parent, x, 0, z, ry);
  box(16, 12, 8, std(0x2b2f45), 0, 6, -4, g);
  box(16.6, 1, 8.6, std(0xf2c14e, { metalness: 0.5, roughness: 0.3 }), 0, 12.3, -4, g);
  sign(g, ['HEAVY BOOTS'], 0, 9.6, 0.15, 0, 12, 2.6, { bg: '#f2c14e', fg: '#1b1f33' });
  box(12, 5, 0.3, std(0x9fd0f0, { roughness: 0.1, emissive: 0xffe6b0, emissiveIntensity: 0.25 }), 0, 3.6, 0.05, g);
  const boots = [];
  for (let i = 0; i < 4; i++) { const b = heavyBoot(g, i % 2 === 1); b.position.set(-4.5 + i * 3, 1.3, 0.9); b.scale.setScalar(0.9); boots.push(b); }
  box(13, 1.1, 1.6, std(0xf6f4f0), 0, 0.55, 1.0, g);
  const price = sign(g, ['$1,000', 'A PAIR'], 6.6, 4.4, 1.2, -0.15, 3.4, 2.6, { bg: '#ffffff', fg: '#e8434f', border: '#e8434f', sizes: [120, 70] });
  return { g, boots, price };
}

export function bootTruck(parent) {
  const g = new THREE.Group(); parent.add(g);
  const gold = std(0xf2c14e, { metalness: 0.4, roughness: 0.35 }), dark = std(0x2b2f45);
  box(3.6, 4.4, 9, gold, 0, 3.2, -1.5, g, 0.2);
  box(3.4, 3, 3, dark, 0, 2.5, 4.4, g, 0.3); box(3.0, 1.2, 0.2, std(0x9fd0f0, { roughness: 0.1 }), 0, 3.1, 5.9, g);
  const logo = textTex(['BOOTS INC.'], { w: 1024, h: 220, bg: '#2b2f45', fg: '#f2c14e', radius: 30 });
  [-1, 1].forEach((s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.5), new THREE.MeshBasicMaterial({ map: logo })); m.position.set(s * 1.83, 3.6, -1.5); m.rotation.y = s * Math.PI / 2; g.add(m); });
  [[-1.7, 3.6], [1.7, 3.6], [-1.7, -4], [1.7, -4]].forEach(([a, b]) => { const w = cyl(0.75, 0.75, 0.5, std(0x25252c), a, 0.75, b, g, 16); w.rotation.z = Math.PI / 2; });
  return g;
}

/** big digital billboard; .show(text, sub) redraws */
export function billboard(parent, x, y, z, ry) {
  const g = group(parent, x, y, z, ry);
  let txt = '1 HOUR', sub = 'GRAVITY HOUR TODAY';
  const s = liveScreen(1024, 576, (c, w, h) => {
    c.fillStyle = '#10142a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#7fd8ff'; c.font = '800 70px Poppins'; c.textAlign = 'center'; c.fillText(sub, w / 2, 130);
    c.fillStyle = '#ffd84d'; c.font = '800 230px Poppins'; c.fillText(txt, w / 2, 400);
    c.fillStyle = '#ff6b78'; c.font = '800 46px Poppins'; c.fillText('HOLD ON TO SOMETHING!', w / 2, 510);
  });
  box(16.8, 9.8, 0.6, std(0x2b2f45), 0, 0, -0.35, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: s.tex })); g.add(m);
  cyl(0.4, 0.4, y, std(0x6a7086), 0, -y / 2, -0.6, g, 10);
  return { g, show(a, b = sub) { txt = a; sub = b; s.draw(0); } };
}
