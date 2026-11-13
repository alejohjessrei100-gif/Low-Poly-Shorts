// Original blocky avatar: rounded boxes, face decals, pivoted limbs, poses.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex } from './core.js';

const geo = {};
function rbox(w, h, d, r = 0.12) {
  const k = [w, h, d, r].join();
  return geo[k] || (geo[k] = new RoundedBoxGeometry(w, h, d, 3, r));
}

// ---------------------------------------------------------------- faces (canvas decals)
const FACES = {};
function face(name, ink = '#1b1b24', eyeFill = null) {
  const key = name + ink + eyeFill;
  if (FACES[key]) return FACES[key];
  FACES[key] = canvasTex(256, 256, (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = 12;
    const eye = (x, y, rx, ry) => {
      if (eyeFill) { g.fillStyle = eyeFill; }
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = ink;
    };
    const white = (x, y, r) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = ink; };
    switch (name) {
      case 'smile':
        eye(88, 104, 15, 24); eye(168, 104, 15, 24); white(93, 96, 6); white(173, 96, 6);
        g.beginPath(); g.arc(128, 150, 46, 0.2, Math.PI - 0.2); g.stroke(); break;
      case 'smirk':
        eye(88, 108, 14, 20); eye(168, 108, 14, 20);
        g.beginPath(); g.moveTo(70, 80); g.lineTo(106, 86); g.moveTo(150, 86); g.lineTo(186, 76); g.stroke();
        g.beginPath(); g.moveTo(92, 172); g.quadraticCurveTo(140, 190, 176, 156); g.stroke(); break;
      case 'scared':
      case 'scared_talk': {
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(88, 104, 26, 32, 0, 0, 7); g.ellipse(168, 104, 26, 32, 0, 0, 7); g.fill();
        g.fillStyle = ink; eye(88, 108, 11, 13); eye(168, 108, 11, 13);
        g.lineWidth = 9; g.beginPath(); g.moveTo(60, 62); g.lineTo(108, 52); g.moveTo(148, 52); g.lineTo(196, 62); g.stroke();
        if (name === 'scared_talk') { g.beginPath(); g.ellipse(128, 182, 26, 30, 0, 0, 7); g.fill(); g.fillStyle = '#e8606d'; g.beginPath(); g.ellipse(128, 196, 15, 11, 0, 0, 7); g.fill(); }
        else { g.lineWidth = 10; g.beginPath(); g.moveTo(92, 182); for (let i = 0; i <= 6; i++) g.lineTo(92 + i * 12, 182 + (i % 2 ? -9 : 9)); g.stroke(); }
        break;
      }
      case 'glow': // shadow-person: glowing eyes + grin
        g.fillStyle = eyeFill; g.beginPath(); g.ellipse(88, 106, 18, 12, -0.25, 0, 7); g.ellipse(168, 106, 18, 12, 0.25, 0, 7); g.fill();
        g.strokeStyle = eyeFill; g.lineWidth = 9; g.beginPath(); g.arc(128, 140, 52, 0.35, Math.PI - 0.35); g.stroke(); break;
    }
  });
  return FACES[key];
}

// ---------------------------------------------------------------- avatar
export function makeAvatar({ skin = 0xf6c89a, shirt = 0x3fb6a8, pants = 0x2c3e74, shoes = 0x30303a, hair = 0x5a3a22,
  backpack = null, shadowMode = false } = {}) {
  const mat = (c, extra = {}) => shadowMode
    ? new THREE.MeshBasicMaterial({ color: 0x241a40, ...extra })
    : new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0, ...extra });
  const root = new THREE.Group();
  const body = new THREE.Group(); // hips pivot (for jumps/flips): origin at hip height
  body.position.y = 2;
  root.add(body);
  const add = (parent, g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = !shadowMode; o.receiveShadow = !shadowMode; parent.add(o); return o; };

  const torso = add(body, rbox(2, 2, 1, 0.14), mat(shirt), 0, 1, 0);
  if (!shadowMode) { // hoodie pocket + zip line for detail
    add(torso, rbox(1.3, 0.55, 0.06, 0.05), mat(new THREE.Color(shirt).multiplyScalar(0.82)), 0, -0.45, 0.5);
    add(torso, rbox(0.06, 1.2, 0.04, 0.02), mat(0xf2f2f2), 0, 0.25, 0.51);
  }
  const headPivot = new THREE.Group(); headPivot.position.set(0, 2, 0); body.add(headPivot);
  const head = add(headPivot, rbox(1.25, 1.25, 1.25, 0.32), mat(skin), 0, 0.68, 0);
  const faceMat = new THREE.MeshBasicMaterial({ map: face(shadowMode ? 'glow' : 'smile', '#1b1b24', shadowMode ? '#f4f1ff' : null), transparent: true, depthWrite: false });
  const faceP = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), faceMat);
  faceP.position.set(0, 0.66, 0.632);
  headPivot.add(faceP);
  if (hair && !shadowMode) { // messy blocky hair: cap + tufts
    const hm = mat(hair);
    add(headPivot, rbox(1.36, 0.42, 1.36, 0.16), hm, 0, 1.36, -0.02);
    [[-0.45, 1.6, 0.3, 0.3], [0.1, 1.66, 0.42, 0.5], [0.5, 1.58, 0.1, -0.4], [-0.2, 1.62, -0.35, 0.2]].forEach(([x, y, z, r]) => {
      const t = add(headPivot, rbox(0.42, 0.34, 0.42, 0.1), hm, x, y, z); t.rotation.set(r * 0.5, r, r * 0.6);
    });
    add(headPivot, rbox(1.36, 0.7, 0.3, 0.12), hm, 0, 1.0, -0.56); // back of hair
    add(headPivot, rbox(0.5, 0.26, 0.2, 0.08), hm, -0.32, 1.18, 0.62).rotation.z = 0.25; // fringe
  }
  if (shadowMode) { // spiky hair silhouette so it reads as Leo's shadow
    [[-0.4, 1.42], [0, 1.5], [0.4, 1.42]].forEach(([x, y]) => add(headPivot, rbox(0.42, 0.42, 1.0, 0.08), mat(0), x, y, 0).rotation.z = x * 0.6);
  }
  if (backpack) {
    const bp = add(torso, rbox(1.5, 1.6, 0.6, 0.18), mat(backpack), 0, 0.05, -0.75);
    if (!shadowMode) add(bp, rbox(1.1, 0.6, 0.2, 0.08), mat(new THREE.Color(backpack).multiplyScalar(0.8)), 0, -0.3, -0.36);
  }
  const limb = (x, y, m, len = 2) => {
    const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p);
    add(p, rbox(1, len, 1, 0.14), m, 0, -len / 2, 0);
    return p;
  };
  const armL = limb(-1.5, 1.95, mat(shirt));
  const armR = limb(1.5, 1.95, mat(shirt));
  [armL, armR].forEach((a) => { add(a, rbox(0.98, 0.62, 0.98, 0.14), mat(skin), 0, -1.72, 0); }); // hands
  const legL = limb(-0.5, 0, mat(pants));
  const legR = limb(0.5, 0, mat(pants));
  [legL, legR].forEach((l) => add(l, rbox(1.04, 0.4, 1.12, 0.12), mat(shoes), 0, -1.82, 0.05));

  return { root, body, headPivot, head, faceMat, armL, armR, legL, legR, shadowMode };
}

export function setFace(av, name) {
  av.faceMat.map = face(name, '#1b1b24', null);
}

// ---------------------------------------------------------------- poses (angles in radians), blended
export const POSES = {
  idle: { armL: [0, 0, 0.06], armR: [0, 0, -0.06], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0, 0] },
  flinch: { armL: [0, 0, -2.8], armR: [0, 0, 2.8], legL: [0.12, 0, -0.08], legR: [-0.1, 0, 0.08], head: [0.18, 0, 0] },
  crouch: { armL: [0.6, 0, 0.2], armR: [0.6, 0, -0.2], legL: [-0.9, 0, 0], legR: [-0.9, 0, 0], head: [0.1, 0, 0] },
  tuck: { armL: [-1.4, 0, 0.3], armR: [-1.4, 0, -0.3], legL: [-1.8, 0, 0], legR: [-1.8, 0, 0], head: [0.3, 0, 0] },
  tada: { armL: [-2.6, 0, -0.35], armR: [-2.6, 0, 0.35], legL: [0, 0, -0.12], legR: [0, 0, 0.12], head: [-0.15, 0, 0] },
  wave: { armL: [0, 0, 0.06], armR: [-2.7, 0, 0.25], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0.2, 0] },
};

export function pose(av, a, b = a, k = 0) {
  const A = POSES[a], B = POSES[b];
  for (const part of ['armL', 'armR', 'legL', 'legR']) {
    av[part].rotation.set(...A[part].map((v, i) => v + (B[part][i] - v) * k));
  }
  av.headPivot.rotation.set(...A.head.map((v, i) => v + (B.head[i] - v) * k));
}
