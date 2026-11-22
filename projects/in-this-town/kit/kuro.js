// Kuro shorts ("My Homework Ate My Dog"): the hero Kuro, a blocky dog, the homework monster, a cartoon puff,
// and three sets in METRES: living room (x 0), suburban street + school front (x 200), classroom (x 400).
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box } from './town.js';
import { bake } from './world.js';
import { textTex } from './props.js';
import { house } from './coal.js';
import { avatar } from './rig.js';

let seed = 17;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const cyl = (rt, rb, h, m, x, y, z, p, seg = 14) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; p.add(c); return c; };
const glow = (c, k = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.5 });
const plane = (w, h, mat, x, y, z, ry, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; p.add(m); return m; };

// ---------------------------------------------------------------- Kuro: black body, white spiky hair, white face features
export function kuro(parent, height = 1.45, extra = {}) {
  return avatar(parent, { skin: 0x2a2a34, shirt: 0x18181f, pants: 0x111117, shoes: 0x0a0a0e, hair: 0xf6f6fa, hairStyle: 'spiky', faceInk: '#f6f6fa', ...extra }, height, { face: 'neutral' });
}

// ---------------------------------------------------------------- a blocky dog (~0.7 m), tail wag, walk, sit, glasses, backpack
export function dog(parent) {
  const g = new THREE.Group(); parent.add(g);
  const fur = std(0xd89a58), wht = std(0xf6ecdc), dk = std(0x2a1a12), ear = std(0x9a5a30);
  const body = new THREE.Group(); body.position.y = 0.36; g.add(body);
  box(0.26, 0.24, 0.52, fur, 0, 0, 0, body, 0.05); box(0.2, 0.18, 0.06, wht, 0, -0.02, 0.25, body, 0.03);
  const head = new THREE.Group(); head.position.set(0, 0.19, 0.27); body.add(head);
  box(0.27, 0.25, 0.26, fur, 0, 0.02, 0, head, 0.05); box(0.15, 0.11, 0.14, wht, 0, -0.05, 0.17, head, 0.03); box(0.06, 0.05, 0.04, dk, 0, -0.01, 0.25, head, 0.015);
  for (const s of [-1, 1]) { box(0.045, 0.05, 0.02, dk, s * 0.07, 0.06, 0.13, head, 0.01); box(0.015, 0.015, 0.01, std(0xffffff), s * 0.075, 0.07, 0.142, head); const e = box(0.06, 0.16, 0.12, ear, s * 0.15, 0.02, -0.02, head, 0.02); e.rotation.z = s * 0.25; }
  const tongue = box(0.05, 0.015, 0.06, std(0xe8606d), 0, -0.11, 0.2, head); tongue.visible = false;
  const tail = new THREE.Group(); tail.position.set(0, 0.06, -0.26); body.add(tail); const tm = cyl(0.025, 0.035, 0.26, fur, 0, 0.12, 0, tail, 8); tm.rotation.x = 0;
  const legs = [];
  for (const [x, z] of [[-0.085, 0.17], [0.085, 0.17], [-0.085, -0.17], [0.085, -0.17]]) { const l = new THREE.Group(); l.position.set(x, 0.26, z); g.add(l); box(0.075, 0.26, 0.075, fur, 0, -0.13, 0, l, 0.02); box(0.08, 0.04, 0.1, wht, 0, -0.24, 0.015, l, 0.015); legs.push(l); }
  const glasses = new THREE.Group(); head.add(glasses); glasses.position.set(0, 0.06, 0.135);
  { const fm = std(0x111118, { roughness: 0.3 }); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.009, 6, 18), fm); r.position.x = s * 0.07; glasses.add(r); } box(0.05, 0.01, 0.01, fm, 0, 0.005, 0, glasses); } glasses.visible = false;
  const pack = new THREE.Group(); body.add(pack); box(0.22, 0.14, 0.24, std(0xd83a3a), 0, 0.17, -0.02, pack, 0.03); box(0.24, 0.02, 0.03, std(0x2a2a30), 0, 0.12, 0.12, pack); pack.visible = false;
  const star = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.07)), glow(0xf2c14e, 0.6)); star.position.set(0, 0.0, 0.29); star.visible = false; body.add(star);
  return {
    g, head, tail, glasses, pack, star, tongue,
    /** mode: stand | walk | sit | proud ; wag 0..1 */
    pose(mode, t, wag = 1) {
      body.rotation.set(0, 0, 0); body.position.y = 0.36; head.rotation.set(0, 0, 0); legs.forEach((l) => l.rotation.set(0, 0, 0));
      tail.rotation.set(-0.6, 0, Math.sin(t * 18) * 0.7 * wag);
      if (mode === 'walk') { const s = Math.sin(t * 10); legs[0].rotation.x = s * 0.5; legs[3].rotation.x = s * 0.5; legs[1].rotation.x = -s * 0.5; legs[2].rotation.x = -s * 0.5; body.position.y = 0.36 + Math.abs(Math.cos(t * 10)) * 0.02; head.rotation.x = Math.sin(t * 10) * 0.04; }
      if (mode === 'sit' || mode === 'proud') { body.rotation.x = -0.55; body.position.y = 0.3; legs[2].rotation.x = -1.2; legs[3].rotation.x = -1.2; legs[2].position.y = 0.12; legs[3].position.y = 0.12; head.rotation.x = mode === 'proud' ? 0.25 : 0.45; } else { legs[2].position.y = 0.26; legs[3].position.y = 0.26; }
      tongue.visible = mode === 'walk' || mode === 'stand';
    },
  };
}
function starShape(r) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * 0.45 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath(); return s; }

// ---------------------------------------------------------------- the homework monster: a worksheet that opens like a mouth
const sheetTex = (answers) => canvasTex(512, 724, (g, w, h) => {
  g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(90,140,220,.45)'; g.lineWidth = 2; for (let y = 120; y < h; y += 34) { g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30, y); g.stroke(); }
  g.strokeStyle = 'rgba(220,90,90,.5)'; g.beginPath(); g.moveTo(70, 0); g.lineTo(70, h); g.stroke();
  g.fillStyle = '#1b1b24'; g.font = '800 46px Poppins'; g.fillText('MATH', 90, 70); g.font = '700 26px Poppins'; g.fillText('PAGE 42', 340, 70); g.fillText('NAME: KURO', 90, 104);
  const Q = ['1/2 + 1/4 =', '3/4 - 1/2 =', '2/3 + 1/3 =', '5/8 - 1/8 =', '1/3 x 3 =', '7/10 - 2/5 =', '1/2 + 1/2 =', '3/5 + 1/5 ='], A = ['3/4', '1/4', '1', '1/2', '1', '3/10', '1', '4/5'];
  g.font = '700 30px Poppins'; Q.forEach((q, i) => { g.fillStyle = '#1b1b24'; g.fillText(`${i + 1}.  ${q}`, 90, 180 + i * 66); if (answers) { g.fillStyle = '#2a4ab8'; g.font = '700 32px Poppins'; g.fillText(A[i], 370, 180 + i * 66); g.font = '700 30px Poppins'; } else { g.strokeStyle = '#999'; g.beginPath(); g.moveTo(360, 186 + i * 66); g.lineTo(460, 186 + i * 66); g.stroke(); } });
  if (answers) { g.fillStyle = 'rgba(110,70,40,.35)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(410 + k * 18, 650 - k * 10, 10, 13, 0.3, 0, 7); g.fill(); } } // paw prints
});
const A_PLUS = canvasTex(256, 256, (g) => { g.strokeStyle = '#d8203a'; g.fillStyle = '#d8203a'; g.lineWidth = 14; g.beginPath(); g.arc(128, 128, 104, 0, 7); g.stroke(); g.font = '800 120px Poppins'; g.textAlign = 'center'; g.fillText('A+', 128, 170); });
export function homework(parent) {
  const g = new THREE.Group(); parent.add(g);
  const inner = new THREE.Group(); g.add(inner);
  const W = 0.42, L = 0.6, T = 0.012;
  const paper = std(0xfbfaf4, { roughness: 0.9 }), mouth = std(0x8a1a2a, { roughness: 0.8 }), tongueM = std(0xe86a7a);
  const blank = sheetTex(false), done = sheetTex(true);
  const topM = new THREE.MeshStandardMaterial({ map: blank, roughness: 0.85 });
  const lower = new THREE.Mesh(new THREE.BoxGeometry(W, T, L), [paper, paper, mouth, paper, paper, paper]); lower.position.set(0, T / 2 + 0.06, 0); lower.castShadow = true; inner.add(lower);
  const life = []; // eyes, teeth, legs, tongue: hidden while it is still just a worksheet
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), tongueM); tongue.scale.set(1.3, 0.25, 1.6); tongue.position.set(0, 0.075, 0.03); inner.add(tongue); life.push(tongue);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.06 + T, -L / 2); inner.add(hinge);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(W, T, L), [paper, paper, topM, mouth, paper, paper]); upper.position.set(0, T / 2, L / 2); upper.castShadow = true; hinge.add(upper);
  const toothM = std(0xffffff, { roughness: 0.4 });
  for (let i = 0; i < 7; i++) { const x = -W / 2 + 0.04 + i * (W - 0.08) / 6; const a = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), toothM); a.position.set(x, -0.026, L - 0.025); a.rotation.x = Math.PI; hinge.add(a); const b = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), toothM); b.position.set(x + 0.015, 0.06 + T + 0.025, L / 2 - 0.025); inner.add(b); life.push(a, b); }
  const eyes = [];
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), std(0xffffff, { roughness: 0.3 })); e.position.set(s * 0.1, 0.05, L * 0.78); hinge.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), std(0x111111)); p.position.set(s * 0.1, 0.07, L * 0.78 + 0.035); hinge.add(p); const brow = box(0.09, 0.015, 0.02, std(0x1b1b24), s * 0.1, 0.115, L * 0.78, hinge); brow.rotation.z = -s * 0.35; eyes.push(p); life.push(e, p, brow); }
  const aplus = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshBasicMaterial({ map: A_PLUS, transparent: true, depthWrite: false })); aplus.rotation.x = -Math.PI / 2; aplus.position.set(0.08, T / 2 + 0.002, L * 0.33); upper.add(aplus); aplus.visible = false;
  const legs = [];
  for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.12, 0.06, 0.05); inner.add(l); box(0.03, 0.06, 0.03, paper, 0, -0.03, 0, l); box(0.06, 0.01, 0.07, paper, 0, -0.058, 0.02, l); legs.push(l); life.push(l); }
  const tail = new THREE.Group(); tail.position.set(-0.12, 0.09, L / 2 - 0.02); inner.add(tail); cyl(0.022, 0.03, 0.22, std(0xd89a58), 0, 0.1, 0, tail, 8); tail.visible = false;
  return {
    g, inner, hinge, aplus, tail, W, L,
    mouthPos() { inner.updateWorldMatrix(true, false); return inner.localToWorld(new THREE.Vector3(0, 0.12, L / 2 + 0.05)); },
    set(scale = 1, { chew = 0, open = null, t = 0, run = 0, answers = false, tailOn = false, look = 0, alive = true } = {}) {
      inner.scale.setScalar(scale); life.forEach((m) => (m.visible = alive)); lower.position.y = alive ? T / 2 + 0.06 : T / 2; hinge.position.y = alive ? 0.06 + T : T;
      const a = open != null ? open : 0.12 + Math.abs(Math.sin(t * 9)) * 0.55 * chew;
      hinge.rotation.x = -a;
      topM.map = answers ? done : blank;
      tail.visible = tailOn; tail.rotation.set(-0.5, 0, Math.sin(t * 16) * 0.8);
      legs.forEach((l, i) => { l.rotation.x = run ? Math.sin(t * 16 + i * Math.PI) * 0.9 : 0; });
      inner.position.y = run ? Math.abs(Math.sin(t * 16)) * 0.04 * scale : 0;
      eyes.forEach((p, i) => { p.position.x = (i ? 0.1 : -0.1) + look * 0.02; });
    },
  };
}

/** cartoon puff cloud (burps, crashes): set(pos, u 0..1, size) */
export function puff(parent, n = 9) {
  const m = new THREE.MeshStandardMaterial({ color: 0xf4f6ea, roughness: 1, transparent: true, opacity: 0.9 });
  const balls = Array.from({ length: n }, (_, i) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), m); b.userData.noAO = true; parent.add(b); b.visible = false; return b; });
  return {
    set(p, u, size = 0.3, tint = 0xf4f6ea) { m.color.set(tint); balls.forEach((b, i) => { b.visible = u > 0 && u < 1; const a = i * 2.4; const r = size * (0.4 + u * 1.6); b.position.set(p.x + Math.cos(a) * r * 0.7, p.y + Math.sin(i) * r * 0.4 + u * size, p.z + Math.sin(a) * r * 0.7); b.scale.setScalar(size * (0.5 + u) * (0.6 + (i % 3) * 0.25)); }); m.opacity = 0.9 * (1 - u * u); },
    hide() { balls.forEach((b) => (b.visible = false)); },
  };
}

// ---------------------------------------------------------------- living room (x 0): couch, lamp, socks, dog bed, door, window
export function livingRoom(scene) {
  const tmp = new THREE.Group(), live = new THREE.Group(); scene.add(live);
  const W = 9, D = 7, H = 2.8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { for (let r = 0; r < 8; r++) { g.fillStyle = pick(['#b8875a', '#a87a50', '#c49466']); g.fillRect(0, r * 32, w, 32); g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, r * 32, w, 2); g.fillRect(((r * 97) % 200) + 20, r * 32, 2, 32); } }, [3, 3]), roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; tmp.add(floor);
  const paper = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 4; i++) { g.fillStyle = '#d8c8a8'; g.fillRect(i * 32 + 12, 0, 8, 128); } }, [6, 2]), roughness: 0.9 });
  box(W, H, 0.15, paper, 0, H / 2, -D / 2, tmp); // back wall
  // left wall with a door opening at z 1.2 (1.0 wide), right wall with a window at z 0.3 (1.4 x 1.2, sill 0.9)
  box(0.15, H, D / 2 + 1.2 - 0.5, paper, -W / 2, H / 2, (-D / 2 + 0.7) / 2, tmp); box(0.15, H, D / 2 - 1.7, paper, -W / 2, H / 2, (1.7 + D / 2) / 2, tmp); box(0.15, H - 2.15, 1.0, paper, -W / 2, (H + 2.15) / 2, 1.2, tmp);
  box(0.15, H, D / 2 + 0.3 - 0.7, paper, W / 2, H / 2, (-D / 2 - 0.4) / 2, tmp); box(0.15, H, D / 2 - 1.0, paper, W / 2, H / 2, (1.0 + D / 2) / 2, tmp); box(0.15, 0.9, 1.4, paper, W / 2, 0.45, 0.3, tmp); box(0.15, H - 2.1, 1.4, paper, W / 2, 2.45, 0.3, tmp);
  const trim = std(0xf4f0e6); box(0.2, 0.06, 1.6, trim, W / 2 - 0.05, 0.9, 0.3, tmp); for (const z of [-0.43, 1.03]) box(0.18, 1.3, 0.08, trim, W / 2 - 0.05, 1.5, z, tmp); box(0.18, 0.08, 1.6, trim, W / 2 - 0.05, 2.12, 0.3, tmp);
  box(W, 0.12, 0.04, trim, 0, 0.06, -D / 2 + 0.09, tmp); box(0.04, 0.12, D, trim, -W / 2 + 0.09, 0.06, 0, tmp);
  box(W, 0.1, D, std(0xf2eee6), 0, H + 0.05, 0, tmp); // ceiling
  // the room continues toward the camera (dining end) so wide shots never see the edge of the set
  { const ext = 7; const f2 = new THREE.Mesh(new THREE.PlaneGeometry(W, ext), floor.material); f2.rotation.x = -Math.PI / 2; f2.position.set(0, 0, D / 2 + ext / 2); f2.receiveShadow = true; tmp.add(f2);
    for (const s2 of [-1, 1]) box(0.15, H, ext, paper, s2 * W / 2, H / 2, D / 2 + ext / 2, tmp); box(W, 0.1, ext, std(0xf2eee6), 0, H + 0.05, D / 2 + ext / 2, tmp);
    box(1.4, 0.05, 0.9, std(0x8a5a3a), 2.6, 0.75, 5.6, tmp); for (const [a, b2] of [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]]) box(0.05, 0.74, 0.05, std(0x6a4a2a), 2.6 + a, 0.37, 5.6 + b2, tmp); }
  // outside the window: lawn, fence, a tree
  const out = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std(0x7aa858)); out.rotation.x = -Math.PI / 2; out.position.set(W / 2 + 15, -0.01, 0); tmp.add(out);
  for (let k = 0; k < 16; k++) box(0.08, 1.0, 0.08, trim, W / 2 + 6, 0.5, -4 + k * 0.5, tmp); box(0.05, 0.08, 8, trim, W / 2 + 6, 0.8, 0, tmp);
  cyl(0.15, 0.2, 2.5, std(0x6a4a34), W / 2 + 4, 1.25, 1.5, tmp); const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), std(0x5a9a48, { flatShading: true })); crown.position.set(W / 2 + 4, 3, 1.5); tmp.add(crown);
  // door (hinged, swings open), rug, coffee table, TV, bookshelf, plant, photos, ceiling light
  const door = new THREE.Group(); door.position.set(-W / 2 + 0.05, 0, 0.7); scene.add(door); box(0.06, 2.1, 1.0, std(0x8a5a3a), 0, 1.05, 0.5, door); cyl(0.04, 0.04, 0.06, std(0xd8b04a, { metalness: 0.8 }), 0.06, 1.0, 0.88, door, 8).rotation.z = Math.PI / 2;
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshStandardMaterial({ map: canvasTex(256, 176, (g, w, h) => { g.fillStyle = '#b84a4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2d8a0'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28); g.strokeRect(34, 34, w - 68, h - 68); }), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.006, -0.9); tmp.add(rug);
  box(1.2, 0.06, 0.6, std(0x6a4a34), 0, 0.42, -1.3, tmp); for (const [a, b] of [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]]) box(0.05, 0.4, 0.05, std(0x4a3424), a, 0.2, -1.3 + b, tmp);
  box(0.45, 0.6, 1.6, std(0x4a3a30), -W / 2 + 0.35, 0.3, -1.6, tmp); box(0.06, 0.65, 1.15, std(0x111118), -W / 2 + 0.4, 0.95, -1.6, tmp); plane(1.05, 0.56, glow(0x3a6aa8, 0.6), -W / 2 + 0.44, 0.95, -1.6, Math.PI / 2, tmp);
  const shelf = new THREE.Group(); shelf.position.set(-2.8, 0, -D / 2 + 0.25); tmp.add(shelf); box(1.2, 1.9, 0.35, std(0x7a5a3a), 0, 0.95, 0, shelf); for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) box(0.1, 0.28 + rnd() * 0.08, 0.24, std(pick([0xc8343f, 0x2a6aa8, 0xf2c14e, 0x3a8a5a, 0xe8e4dc])), -0.45 + k * 0.15, 0.3 + r * 0.45, 0.02, shelf);
  cyl(0.18, 0.14, 0.35, std(0xc8843a), 3.6, 0.17, -2.9, tmp); for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), std(0x3a8a4a)); l.position.set(3.6 + Math.sin(k) * 0.15, 0.55 + (k % 3) * 0.18, -2.9 + Math.cos(k) * 0.15); tmp.add(l); }
  for (let k = 0; k < 3; k++) { box(0.5, 0.4, 0.04, std(0x3a2a20), -0.8 + k * 0.8, 1.9 + (k % 2) * 0.15, -D / 2 + 0.1, tmp); plane(0.42, 0.32, std(pick([0x9ad0f0, 0xf2c8a0, 0xa8d8a0])), -0.8 + k * 0.8, 1.9 + (k % 2) * 0.15, -D / 2 + 0.125, 0, tmp); }
  const ceil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 20), glow(0xfff2d0, 1.2)); ceil.position.set(0, H - 0.05, -0.5); tmp.add(ceil);
  const pl = new THREE.PointLight(0xffe6c0, 9, 12, 1.4); pl.position.set(0, H - 0.4, 0); scene.add(pl);
  // dog bed
  const bed = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.13, 8, 20), std(0x5a6ab8)); bed.rotation.x = Math.PI / 2; bed.position.set(-2.6, 0.12, 0.2); tmp.add(bed); cyl(0.36, 0.36, 0.06, std(0x8a9ad8), -2.6, 0.05, 0.2, tmp, 20);
  // clutter: armchair, toy basket, magazines, floor cushions, a guitar, a cat tree, shoes by the door
  { const ac = std(0xc8843a, { roughness: 0.9 }); box(0.9, 0.42, 0.85, ac, -3.4, 0.21, -2.4, tmp, 0.08); box(0.9, 0.55, 0.2, ac, -3.4, 0.68, -2.75, tmp, 0.08); for (const s2 of [-1, 1]) box(0.18, 0.55, 0.85, ac, -3.4 + s2 * 0.42, 0.3, -2.4, tmp, 0.06); box(0.6, 0.12, 0.6, std(0xe8d8b0), -3.4, 0.46, -2.35, tmp, 0.05); }
  cyl(0.28, 0.24, 0.35, std(0xb89a6a), 3.4, 0.18, 2.2, tmp, 16); for (let k = 0; k < 9; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09 + (k % 3) * 0.03, 14, 10), std(pick([0xd83a3a, 0x3ea0e0, 0xf2c14e, 0x3eae5a, 0xe87aa0]))); b.position.set(3.4 + Math.sin(k * 2.2) * 0.14, 0.4 + (k % 3) * 0.06, 2.2 + Math.cos(k * 2.2) * 0.14); tmp.add(b); }
  for (let k = 0; k < 4; k++) { const mg = box(0.28, 0.012, 0.36, std(pick([0xf4f0e6, 0xd83a3a, 0x3a6aa8, 0xf2c14e])), 0.15 + k * 0.06, 0.46 + k * 0.013, -1.35 + k * 0.03, tmp); mg.rotation.y = k * 0.3; }
  for (const [x, z, c] of [[2.6, 1.6, 0x8a5aa8], [3.1, 1.2, 0xf2c14e]]) box(0.6, 0.18, 0.6, std(c, { roughness: 1 }), x, 0.09, z, tmp, 0.08);
  { const gt = new THREE.Group(); gt.position.set(-4.2, 0, -3.0); gt.rotation.set(0, 0.6, -0.15); tmp.add(gt); const bdy = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), std(0xc87a3a)); bdy.scale.set(1, 1.25, 0.35); bdy.position.y = 0.3; gt.add(bdy); box(0.06, 0.6, 0.04, std(0x3a2a20), 0, 0.85, 0, gt); }
  { const ct = new THREE.Group(); ct.position.set(3.8, 0, -0.9); tmp.add(ct); box(0.6, 0.1, 0.6, std(0xd8c8a8), 0, 0.05, 0, ct); cyl(0.07, 0.07, 1.3, std(0xd8c8a8), 0, 0.7, 0, ct, 12); for (const y of [0.6, 1.3]) box(0.5, 0.06, 0.5, std(0xb8a888), 0, y, 0, ct); const bl = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 8, 18), std(0x9a8a6a)); bl.rotation.x = Math.PI / 2; bl.position.y = 1.38; ct.add(bl); }
  for (let k = 0; k < 3; k++) { box(0.12, 0.08, 0.28, std(pick([0x2a2a30, 0xd83a3a, 0xf4f4f4])), -4.1, 0.04, 2.3 + k * 0.25, tmp, 0.03); }
  for (let k = 0; k < 2; k++) { const cu = box(0.42, 0.14, 0.4, std(pick([0xf2c14e, 0x3ea0e0])), -0.6 + k * 1.2, 0.07, 2.4, tmp, 0.06); cu.rotation.y = k * 0.5; }
  scene.add(bake(tmp));
  // things that get eaten (kept separate): couch, side table + lamp, socks
  const couch = new THREE.Group(); couch.position.set(0, 0, -D / 2 + 0.6); live.add(couch);
  { const cm = std(0x2a8a8a, { roughness: 0.9 }), cm2 = std(0x3aa0a0, { roughness: 0.9 }); box(2.3, 0.42, 0.95, cm, 0, 0.21, 0, couch, 0.06); box(2.3, 0.6, 0.25, cm, 0, 0.72, -0.35, couch, 0.08); for (const s of [-1, 1]) box(0.25, 0.62, 0.95, cm, s * 1.15, 0.31, 0, couch, 0.08); for (const s of [-0.52, 0.52]) box(1.0, 0.16, 0.75, cm2, s, 0.5, 0.06, couch, 0.06); box(0.4, 0.35, 0.12, std(0xf2c14e), -0.7, 0.72, -0.18, couch, 0.05); }
  const lampT = new THREE.Group(); lampT.position.set(1.65, 0, -D / 2 + 0.55); live.add(lampT); box(0.5, 0.55, 0.5, std(0x7a5a3a), 0, 0.275, 0, lampT);
  const lamp = new THREE.Group(); lamp.position.set(1.65, 0.55, -D / 2 + 0.55); live.add(lamp);
  cyl(0.1, 0.13, 0.08, std(0xd8b04a, { metalness: 0.7, roughness: 0.3 }), 0, 0.04, 0, lamp); cyl(0.025, 0.025, 0.45, std(0xd8b04a, { metalness: 0.7 }), 0, 0.3, 0, lamp, 8); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.26, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4e0b8, emissive: 0xffd9a0, emissiveIntensity: 0.6, side: THREE.DoubleSide })); shade.position.y = 0.6; lamp.add(shade);
  const socks = new THREE.Group(); socks.position.set(1.3, 0, 0.8); live.add(socks);
  for (const [x, z, c, r] of [[0, 0, 0xd83a3a, 0.3], [0.18, 0.12, 0xf4f4f4, -0.8], [-0.12, 0.2, 0x3a6aa8, 1.4], [0.05, -0.2, 0xf2c14e, 2.2]]) { const s2 = new THREE.Group(); s2.position.set(x, 0.03, z); s2.rotation.y = r; socks.add(s2); box(0.09, 0.05, 0.26, std(c), 0, 0, 0, s2, 0.02); box(0.09, 0.05, 0.12, std(c), 0, 0, 0.16, s2, 0.02).rotation.y = 0.9; }
  return { W, D, H, couch, lamp, lampT, socks, door, window: new THREE.Vector3(W / 2, 1.5, 0.3), spot: new THREE.Vector3(0.4, 0, 0.6), bed: new THREE.Vector3(-2.6, 0, 0.2), doorIn: new THREE.Vector3(-W / 2 + 0.6, 0, 1.2) };
}

// ---------------------------------------------------------------- suburban street (x 200) with the school at the end
export function street(scene, X = 200) {
  const tmp = new THREE.Group();
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(150, 220), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#78a85a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(90,140,60,.5)' : 'rgba(150,190,100,.45)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2); } }, [24, 34]), roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(X, -0.005, -40); grass.receiveShadow = true; scene.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 150), new THREE.MeshStandardMaterial({ map: canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#5a5a62'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const v = 80 + rnd() * 40; g.fillStyle = `rgba(${v},${v},${v + 6},.4)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); } g.fillStyle = '#f2d06a'; for (let y = 0; y < h; y += 128) g.fillRect(w / 2 - 4, y + 20, 8, 70); }, [1, 12]), roughness: 0.85 })); road.rotation.x = -Math.PI / 2; road.position.set(X, 0.01, -45); road.receiveShadow = true; scene.add(road);
  for (const s of [-1, 1]) { box(2, 0.12, 150, std(0xc8c4bc), X + s * 5, 0.06, -45, tmp); box(0.15, 0.14, 150, std(0xa8a49c), X + s * 4.05, 0.07, -45, tmp); }
  const ROOFS = [0x8a3a32, 0x4a5a6a, 0x3a4a3a, 0x6a4a3a, 0x2a3a5a], COLS = ['#f2e4c8', '#c8dce8', '#e8c8c0', '#d8e8c8', '#f4f0e6', '#e8d8b0'];
  for (let z = 14; z > -64; z -= 12) for (const s of [-1, 1]) { const h = house(X + s * 13, z, -s, pick(COLS), { roof: pick(ROOFS), lit: 0.1 }); scene.add(h.g);
    for (let k = 0; k < 14; k++) box(0.07, 0.8, 0.07, std(0xf4f0e6), X + s * 8.6, 0.4, z - 5 + k * 0.6 + (k > 6 ? 1.6 : 0), tmp);
    const tr = X + s * 7.4, tz = z - 4; cyl(0.14, 0.2, 2.6, std(0x6a4a34), tr, 1.3, tz, tmp, 8); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), std(pick([0x5a9a48, 0x4a8a40, 0x6aa858]), { flatShading: true })); c.position.set(tr, 3.2, tz); c.castShadow = true; tmp.add(c); }
  { const fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 1), std(0xffffff), 520), stem = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 1), std(0x4a8a3a, { flatShading: true }), 260), m4 = new THREE.Matrix4(); let i = 0, j = 0;
    for (let z = 18; z > -66 && i < 520; z -= 0.55) for (const s of [-1, 1]) { if (i >= 520) break; const x = X + s * (8.9 + rnd() * 0.5); m4.makeTranslation(x, 0.32 + rnd() * 0.1, z + rnd() * 0.3); fm.setMatrixAt(i, m4); fm.setColorAt(i, new THREE.Color(pick([0xe8434f, 0xf2c14e, 0xffffff, 0xd85aa0, 0x8a5aa8]))); i++; if (j < 260 && i % 2) { m4.makeTranslation(x, 0.14, z); stem.setMatrixAt(j++, m4); } }
    fm.count = i; stem.count = j; scene.add(fm, stem); }
  for (let z = 10; z > -66; z -= 16) for (const s of [-1, 1]) { cyl(0.06, 0.08, 4, std(0x2a2a30, { metalness: 0.5 }), X + s * 4.4, 2, z, tmp, 8); const lb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glow(0xfff2d0, 0.5)); lb.position.set(X + s * 4.4, 4.1, z); tmp.add(lb); }
  // the school across the end of the street
  const SZ = -76, brick = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#5a2a22'; g.fillRect(0, 0, 128, 128); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { g.fillStyle = (r + c) % 3 ? '#a8503a' : '#984232'; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } }, [12, 4]), roughness: 0.9 });
  box(34, 8, 12, brick, X, 4, SZ - 6, tmp); box(34.6, 0.5, 12.4, std(0xe8e0d0), X, 8.2, SZ - 6, tmp); box(10, 10, 12, brick, X, 5, SZ - 6, tmp); box(10.6, 0.5, 12.4, std(0xe8e0d0), X, 10.2, SZ - 6, tmp);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshStandardMaterial({ map: textTex(['MAPLE ELEMENTARY'], { w: 1024, h: 190, bg: '#f4f0e6', fg: '#2a3a6a', radius: 10 }) })); sign.position.set(X, 7.6, SZ + 0.02); tmp.add(sign);
  for (let k = 0; k < 8; k++) for (const y of [2.2, 5.6]) { if (Math.abs(k - 3.5) < 1.2) continue; const wx = X - 14 + k * 4; box(2.2, 1.6, 0.1, std(0xf4f0e6), wx, y, SZ + 0.01, tmp); plane(1.9, 1.3, new THREE.MeshStandardMaterial({ color: 0x7ab0d8, roughness: 0.1, metalness: 0.3 }), wx, y, SZ + 0.07, 0, tmp); }
  for (let k = 0; k < 3; k++) box(6, 0.18, 1.0, std(0xd8d4cc), X, 0.09 + k * 0.18, SZ + 2.2 - k * 0.6, tmp);
  cyl(0.08, 0.1, 9, std(0xd8dce4, { metalness: 0.6 }), X + 9, 4.5, SZ + 3, tmp, 8); plane(2.2, 1.3, std(0xc8343f, { side: THREE.DoubleSide }), X + 10.1, 8.2, SZ + 3, 0, tmp);
  box(3.2, 0.9, 0.5, std(0x3a6aa8), X - 8, 0.45, SZ + 2.5, tmp); // bike rack bin
  scene.add(bake(tmp));
  const doors = [];
  for (const s of [-1, 1]) { const d = new THREE.Group(); d.position.set(X + s * 1.2, 0.54, SZ + 0.08); scene.add(d); box(1.15, 2.4, 0.08, std(0x2a4a8a), -s * 0.575, 1.2, 0, d); plane(0.6, 0.9, std(0x9ad0f0), -s * 0.575, 1.7, 0.05, 0, d); doors.push(d); }
  // things that get eaten: mailbox, bench, bush
  const mailbox = new THREE.Group(); mailbox.position.set(X + 4.6, 0.12, -18); scene.add(mailbox);
  { const b = std(0x2f5aa8); box(0.5, 0.75, 0.5, b, 0, 0.8, 0, mailbox); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 14, 1, false, 0, Math.PI), b); t.rotation.z = Math.PI / 2; t.rotation.y = Math.PI / 2; t.position.y = 1.17; mailbox.add(t); for (const a of [-0.2, 0.2]) for (const c of [-0.2, 0.2]) box(0.05, 0.45, 0.05, std(0x1c2a50), a, 0.22, c, mailbox); }
  const bench = new THREE.Group(); bench.position.set(X + 5.4, 0.12, -26); bench.rotation.y = -Math.PI / 2; scene.add(bench);
  { const w = std(0x8a5a32), k = std(0x2a2a30); box(1.7, 0.06, 0.45, w, 0, 0.45, 0, bench); box(1.7, 0.4, 0.06, w, 0, 0.72, -0.22, bench); for (const s of [-0.75, 0.75]) box(0.06, 0.45, 0.45, k, s, 0.22, 0, bench); }
  const bush = new THREE.Group(); bush.position.set(X + 6.6, 0.12, -34); scene.add(bush);
  for (let k = 0; k < 9; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 + (k % 3) * 0.12, 1), std(pick([0x3a8a40, 0x4a9a48, 0x2f7a38]), { flatShading: true })); l.position.set(Math.sin(k * 2.1) * 0.5, 0.45 + (k % 3) * 0.25, Math.cos(k * 2.1) * 0.4); l.castShadow = true; bush.add(l); }
  return { X, SZ, doors, mailbox, bench, bush, schoolDoor: new THREE.Vector3(X, 0.54, SZ + 0.3), kuroHouse: new THREE.Vector3(X - 13, 0, 2) };
}

// ---------------------------------------------------------------- classroom (x 400): desks, chalkboard, teacher's desk
export function classroom(scene, X = 400) {
  const tmp = new THREE.Group(); const W = 10, D = 8, H = 3.0;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#e8e4dc' : '#c8d4dc'; g.fillRect(i * 32, j * 32, 32, 32); } }, [8, 6]), roughness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.position.set(X, 0, 0); fl.receiveShadow = true; tmp.add(fl);
  const wall = std(0xf2e8c8);
  box(W, H, 0.15, wall, X, H / 2, -D / 2, tmp); box(0.15, H, D, wall, X + W / 2, H / 2, 0, tmp);
  box(0.15, H, D - 1.4, wall, X - W / 2, H / 2, 0.7, tmp); box(0.15, H - 2.2, 1.4, wall, X - W / 2, (H + 2.2) / 2, -D / 2 + 0.7, tmp); // door gap at the front left
  box(W, 0.1, D, std(0xf4f4f0), X, H + 0.05, 0, tmp);
  box(W, 1.0, 0.18, std(0xb8c8a0), X, 0.5, -D / 2 + 0.02, tmp);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.5), new THREE.MeshStandardMaterial({ map: canvasTex(1024, 307, (g, w, h) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 54px Poppins'; g.fillText('FRACTIONS', 40, 70); g.font = '600 46px Poppins'; g.fillText('1/2 + 1/4 = 3/4', 40, 150); g.fillText('2/3 + 1/3 = 1', 40, 220); g.fillText('HOMEWORK: PAGE 42!', 470, 150); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(860, 230, 40, 0, Math.PI); g.stroke(); }), roughness: 0.9 }));
  board.position.set(X, 1.75, -D / 2 + 0.09); tmp.add(board); box(5.2, 1.7, 0.06, std(0x8a6a4a), X, 1.75, -D / 2 + 0.06, tmp); box(5, 0.05, 0.12, std(0x8a6a4a), X, 0.98, -D / 2 + 0.12, tmp);
  for (let k = 0; k < 3; k++) { box(0.08, 1.4, 1.6, std(0xf4f0e6), X + W / 2 - 0.05, 1.7, -2 + k * 2.2, tmp); plane(1.4, 1.2, new THREE.MeshStandardMaterial({ color: 0x9ad0f0, emissive: 0x9ad0f0, emissiveIntensity: 0.3 }), X + W / 2 - 0.1, 1.7, -2 + k * 2.2, -Math.PI / 2, tmp); }
  for (let k = 0; k < 3; k++) plane(0.9, 1.2, new THREE.MeshStandardMaterial({ map: textTex([['READ!', 'MATH', 'BE KIND'][k]], { w: 512, h: 680, bg: ['#f2c14e', '#3ea0e0', '#e87aa0'][k], fg: '#ffffff', radius: 20 }) }), X - W / 2 + 0.09, 1.9, 0.8 + k * 1.2, Math.PI / 2, tmp);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.25, 24), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#1b1b24'; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke(); }) })); clock.position.set(X + 3.2, 2.55, -D / 2 + 0.09); tmp.add(clock);
  // student desks 3 x 3 with chairs
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = X - 2.6 + c * 2.6, z = 0.2 + r * 1.3; box(0.9, 0.05, 0.6, std(0xd8b48a), x, 0.72, z, tmp); for (const [a, b] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) box(0.04, 0.7, 0.04, std(0x4a4a52, { metalness: 0.5 }), x + a, 0.35, z + b, tmp); box(0.45, 0.04, 0.42, std(0x3a6aa8), x, 0.44, z + 0.55, tmp); box(0.45, 0.4, 0.04, std(0x3a6aa8), x, 0.66, z + 0.76, tmp); for (const [a, b] of [[-0.2, 0.36], [0.2, 0.36], [-0.2, 0.74], [0.2, 0.74]]) box(0.03, 0.44, 0.03, std(0x4a4a52), x + a, 0.22, z + b, tmp); if ((r + c) % 2) box(0.22, 0.04, 0.3, std(pick([0xc8343f, 0xf2c14e, 0x3a8a5a])), x + 0.1, 0.76, z, tmp); }
  // teacher's desk
  const TD = new THREE.Vector3(X + 0.6, 0.78, -2.5);
  box(1.8, 0.06, 0.85, std(0x8a5a3a), TD.x, 0.75, TD.z, tmp); box(1.8, 0.7, 0.05, std(0x7a4a2a), TD.x, 0.36, TD.z + 0.4, tmp); for (const s of [-0.85, 0.85]) box(0.06, 0.72, 0.8, std(0x7a4a2a), TD.x + s, 0.36, TD.z, tmp);
  const apple = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), std(0xd8203a)); apple.position.set(TD.x + 0.7, 0.85, TD.z - 0.2); tmp.add(apple);
  for (let k = 0; k < 3; k++) box(0.22, 0.05, 0.3, std(pick([0x2a6aa8, 0xc8343f, 0x3a8a5a])), TD.x - 0.7, 0.81 + k * 0.05, TD.z - 0.15, tmp);
  const shelf = new THREE.Group(); shelf.position.set(X + 3.8, 0, 3.6); tmp.add(shelf); box(1.6, 1.2, 0.4, std(0x9a7a5a), 0, 0.6, 0, shelf); for (let k = 0; k < 9; k++) box(0.12, 0.3, 0.25, std(pick([0xc8343f, 0x2a6aa8, 0xf2c14e, 0x3a8a5a])), -0.6 + k * 0.15, 1.35, 0, shelf);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), std(0x3a7ab8)); globe.position.set(X - 4.2, 1.1, 3.4); tmp.add(globe); box(0.5, 0.9, 0.4, std(0x7a5a3a), X - 4.2, 0.45, 3.4, tmp);
  // clutter: backpacks on chairs, cubbies, bulletin board, a hamster cage, plants, pencil cups, a reading rug
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if ((r * 3 + c) % 2 === 0) box(0.3, 0.36, 0.16, std(pick([0xd83a3a, 0x3ea0e0, 0xf2c14e, 0x3eae5a, 0x8a5aa8])), X - 2.6 + c * 2.6, 0.62, 0.2 + r * 1.3 + 0.85, tmp, 0.05);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = X - 2.6 + c * 2.6, z = 0.2 + r * 1.3; cyl(0.04, 0.04, 0.1, std(0x5a8aa8), x - 0.3, 0.8, z - 0.15, tmp, 10); for (let k = 0; k < 3; k++) box(0.012, 0.16, 0.012, std(pick([0xf2c14e, 0xd83a3a, 0x3eae5a])), x - 0.31 + k * 0.012, 0.88, z - 0.15, tmp); }
  const cub = new THREE.Group(); cub.position.set(X - 4.7, 0, 1.6); tmp.add(cub); box(0.5, 1.2, 2.4, std(0xc8a070), 0, 0.6, 0, cub); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) box(0.1, 0.3, 0.45, std(pick([0xd83a3a, 0x3ea0e0, 0xf2c14e, 0x3eae5a])), 0.22, 0.25 + r * 0.38, -0.9 + k * 0.6, cub, 0.04);
  box(2.6, 1.1, 0.04, std(0xb88a5a), X + 3.4, 1.85, -D / 2 + 0.09, tmp); for (let k = 0; k < 9; k++) { const n = plane(0.42, 0.3, std(pick([0xfbfaf4, 0xf2e08a, 0xa8d8f0, 0xf8c8d8])), X + 2.4 + (k % 3) * 0.85, 2.2 - Math.floor(k / 3) * 0.36, -D / 2 + 0.115, 0, tmp); n.rotation.z = (rnd() - 0.5) * 0.2; }
  { const hc = new THREE.Group(); hc.position.set(X + 3.8, 1.2, 3.6); tmp.add(hc); box(0.7, 0.04, 0.45, std(0x3a8a5a), 0, 0, 0, hc); for (let k = 0; k < 12; k++) { const b = cyl(0.006, 0.006, 0.35, std(0xb8bcc8, { metalness: 0.7 }), -0.33 + (k % 6) * 0.13, 0.18, k < 6 ? -0.2 : 0.2, hc, 4); } const hm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), std(0xd8a060)); hm.scale.set(1.3, 0.9, 1); hm.position.set(0.1, 0.06, 0); hc.add(hm); const wh = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20), std(0x3a6aa8)); wh.position.set(-0.15, 0.13, 0); hc.add(wh); }
  for (const [x, z] of [[X + 4.4, -3.4], [X - 4.4, 3.6]]) { cyl(0.2, 0.15, 0.4, std(0xc8843a), x, 0.2, z, tmp, 16); for (let k = 0; k < 8; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), std(0x3a8a4a, { flatShading: true })); l.position.set(x + Math.sin(k) * 0.16, 0.55 + (k % 3) * 0.2, z + Math.cos(k) * 0.16); tmp.add(l); } }
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { for (let i = 6; i > 0; i--) { g.fillStyle = ['#f2c14e', '#3ea0e0', '#e87aa0', '#3eae5a', '#f2783a', '#8a5aa8'][i % 6]; g.beginPath(); g.arc(64, 64, i * 10.5, 0, 7); g.fill(); } }), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(X + 3.3, 0.005, 2.6); tmp.add(rug);
  const pl = new THREE.PointLight(0xfff4e0, 10, 14, 1.3); pl.position.set(X, H - 0.4, 0); scene.add(pl);
  for (const z of [-2, 1.5]) { const f = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.4), glow(0xfafaf0, 0.9)); f.position.set(X, H - 0.03, z); tmp.add(f); }
  scene.add(bake(tmp));
  return { X, desk: TD, door: new THREE.Vector3(X - W / 2 + 0.2, 0, -D / 2 + 0.7) };
}
