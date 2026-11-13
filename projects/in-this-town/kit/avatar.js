// Original blocky avatar: rounded boxes, face decals, pivoted limbs, poses, walk/run cycles, crowds.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTex } from './core.js';

const geo = {};
export function rbox(w, h, d, r = 0.12) {
  const k = [w, h, d, r].join();
  return geo[k] || (geo[k] = new RoundedBoxGeometry(w, h, d, 3, r));
}

// ---------------------------------------------------------------- faces (canvas decals)
const FACES = {};
const INK = '#1b1b24';
function face(name, glow = null) {
  const key = name + (glow || '');
  if (FACES[key]) return FACES[key];
  FACES[key] = canvasTex(256, 256, (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 12;
    const dot = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
    const shine = (x, y, r) => { g.fillStyle = '#fff'; dot(x, y, r, r); g.fillStyle = INK; };
    const eyes = (ry = 24) => { dot(88, 104, 15, ry); dot(168, 104, 15, ry); shine(93, 96, 6); shine(173, 96, 6); };
    const bigEyes = () => { g.fillStyle = '#fff'; dot(88, 104, 26, 32); dot(168, 104, 26, 32); g.fillStyle = INK; dot(88, 108, 11, 13); dot(168, 108, 11, 13); };
    const brows = (a, b) => { g.lineWidth = 9; g.beginPath(); g.moveTo(60, 62 + a); g.lineTo(108, 52 + b); g.moveTo(148, 52 + b); g.lineTo(196, 62 + a); g.stroke(); g.lineWidth = 12; };
    const mouthOpen = (w = 26, h = 30) => { dot(128, 182, w, h); g.fillStyle = '#e8606d'; dot(128, 182 + h * 0.45, w * 0.58, h * 0.36); g.fillStyle = INK; };
    const smile = (r = 46) => { g.beginPath(); g.arc(128, 150, r, 0.2, Math.PI - 0.2); g.stroke(); };
    const wobble = () => { g.lineWidth = 10; g.beginPath(); g.moveTo(92, 182); for (let i = 0; i <= 6; i++) g.lineTo(92 + i * 12, 182 + (i % 2 ? -9 : 9)); g.stroke(); g.lineWidth = 12; };
    const blush = () => { g.fillStyle = 'rgba(255,110,130,.55)'; dot(58, 150, 22, 12); dot(198, 150, 22, 12); g.fillStyle = INK; };
    const heart = (x, y, s) => { g.fillStyle = '#ff4d6d'; g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.4, y - s * 0.2, x, y + s * 0.9); g.fill(); g.fillStyle = INK; };
    const happyEyes = () => { g.lineWidth = 11; g.beginPath(); g.arc(88, 112, 18, Math.PI + 0.3, -0.3); g.stroke(); g.beginPath(); g.arc(168, 112, 18, Math.PI + 0.3, -0.3); g.stroke(); g.lineWidth = 12; };
    switch (name) {
      case 'smile': eyes(); smile(); break;
      case 'talk': eyes(); mouthOpen(22, 22); break;
      case 'happy': happyEyes(); g.beginPath(); g.moveTo(84, 150); g.quadraticCurveTo(128, 215, 172, 150); g.closePath(); g.fill(); break;
      case 'happy_talk': happyEyes(); mouthOpen(30, 26); break;
      case 'scared': bigEyes(); brows(0, 0); wobble(); break;
      case 'scared_talk': bigEyes(); brows(0, 0); mouthOpen(); break;
      case 'shock': bigEyes(); brows(-14, -16); mouthOpen(20, 34); break;
      case 'deadpan': g.fillRect(70, 100, 38, 10); g.fillRect(150, 100, 38, 10); g.fillRect(98, 175, 60, 10); break;
      case 'determined': eyes(18); g.lineWidth = 11; g.beginPath(); g.moveTo(60, 58); g.lineTo(110, 76); g.moveTo(146, 76); g.lineTo(196, 58); g.stroke(); g.beginPath(); g.moveTo(98, 178); g.lineTo(158, 172); g.stroke(); break;
      case 'determined_talk': eyes(18); g.lineWidth = 11; g.beginPath(); g.moveTo(60, 58); g.lineTo(110, 76); g.moveTo(146, 76); g.lineTo(196, 58); g.stroke(); mouthOpen(22, 20); break;
      case 'angry': eyes(16); g.lineWidth = 12; g.beginPath(); g.moveTo(58, 60); g.lineTo(110, 82); g.moveTo(146, 82); g.lineTo(198, 60); g.stroke(); g.beginPath(); g.arc(128, 200, 30, Math.PI + 0.4, -0.4); g.stroke(); break;
      case 'blush': eyes(); blush(); smile(36); break;
      case 'love': heart(88, 104, 26); heart(168, 104, 26); blush(); smile(); break;
      case 'cool': g.fillStyle = '#101018'; g.beginPath(); g.roundRect(46, 80, 74, 44, 12); g.roundRect(136, 80, 74, 44, 12); g.fill(); g.fillRect(118, 90, 22, 8); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(58, 88, 22, 8); g.fillRect(148, 88, 22, 8); g.fillStyle = INK; g.beginPath(); g.moveTo(92, 166); g.quadraticCurveTo(140, 196, 176, 150); g.stroke(); break;
      case 'squeeze': g.lineWidth = 11; g.beginPath(); g.moveTo(66, 88); g.lineTo(104, 106); g.lineTo(66, 124); g.moveTo(190, 88); g.lineTo(152, 106); g.lineTo(190, 124); g.stroke(); wobble(); break;
      case 'squeeze_talk': g.lineWidth = 11; g.beginPath(); g.moveTo(66, 88); g.lineTo(104, 106); g.lineTo(66, 124); g.moveTo(190, 88); g.lineTo(152, 106); g.lineTo(190, 124); g.stroke(); mouthOpen(20, 22); break;
      case 'smug': g.fillRect(68, 100, 40, 12); g.fillRect(148, 100, 40, 12); dot(88, 112, 13, 9); dot(168, 112, 13, 9); g.lineWidth = 9; g.beginPath(); g.moveTo(60, 74); g.lineTo(108, 80); g.moveTo(148, 80); g.lineTo(196, 70); g.stroke(); g.lineWidth = 11; g.beginPath(); g.moveTo(96, 176); g.quadraticCurveTo(140, 192, 168, 160); g.stroke(); break;
      case 'smug_talk': g.fillRect(68, 100, 40, 12); g.fillRect(148, 100, 40, 12); dot(88, 112, 13, 9); dot(168, 112, 13, 9); g.lineWidth = 9; g.beginPath(); g.moveTo(60, 74); g.lineTo(108, 80); g.moveTo(148, 80); g.lineTo(196, 70); g.stroke(); mouthOpen(22, 18); break;
      case 'yell': eyes(16); g.lineWidth = 12; g.beginPath(); g.moveTo(58, 62); g.lineTo(110, 80); g.moveTo(146, 80); g.lineTo(198, 62); g.stroke(); mouthOpen(34, 40); break;
      case 'proud': happyEyes(); g.beginPath(); g.arc(128, 150, 40, 0.25, Math.PI - 0.25); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(62, 68); g.lineTo(108, 62); g.moveTo(148, 62); g.lineTo(194, 68); g.stroke(); break;
      case 'forced': eyes(); g.lineWidth = 10; g.beginPath(); g.moveTo(84, 176); g.lineTo(172, 176); g.stroke(); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(92 + i * 18, 168); g.lineTo(92 + i * 18, 184); g.stroke(); } g.fillStyle = 'rgba(120,190,255,.8)'; dot(200, 70, 9, 14); g.fillStyle = INK; break;
      case 'sleepy': g.fillRect(70, 108, 38, 9); g.fillRect(150, 108, 38, 9); dot(128, 182, 10, 8); break;
      case 'glow': g.fillStyle = glow; g.beginPath(); g.ellipse(88, 106, 18, 12, -0.25, 0, 7); g.ellipse(168, 106, 18, 12, 0.25, 0, 7); g.fill(); g.strokeStyle = glow; g.lineWidth = 9; g.beginPath(); g.arc(128, 140, 52, 0.35, Math.PI - 0.35); g.stroke(); break;
      case 'glow_evil': g.fillStyle = glow; g.beginPath(); g.moveTo(62, 92); g.lineTo(112, 112); g.lineTo(66, 120); g.closePath(); g.moveTo(194, 92); g.lineTo(144, 112); g.lineTo(190, 120); g.closePath(); g.fill(); g.strokeStyle = glow; g.lineWidth = 9; g.beginPath(); g.moveTo(76, 160); for (let i = 0; i <= 8; i++) g.lineTo(76 + i * 13, 160 + (i % 2 ? 14 : 0)); g.stroke(); break;
      case 'glow_cool': g.fillStyle = glow; g.fillRect(50, 92, 66, 26); g.fillRect(140, 92, 66, 26); g.fillRect(112, 98, 32, 8); g.strokeStyle = glow; g.lineWidth = 9; g.beginPath(); g.moveTo(92, 166); g.quadraticCurveTo(140, 196, 176, 150); g.stroke(); break;
    }
  });
  return FACES[key];
}

// ---------------------------------------------------------------- avatar
export const SHADOW_COLOR = 0x241a40;

export function makeAvatar({ skin = 0xf6c89a, shirt = 0x3fb6a8, pants = 0x2c3e74, shoes = 0x30303a, hair = 0x5a3a22,
  hairStyle = 'messy', hat = null, backpack = null, apron = null, glasses = false, shadowMode = false, scale = 1 } = {}) {
  const mat = (c, extra = {}) => shadowMode
    ? new THREE.MeshBasicMaterial({ color: SHADOW_COLOR, ...extra })
    : new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0, ...extra });
  const root = new THREE.Group();
  const body = new THREE.Group(); // hips pivot (jumps/flips), origin at hip height
  body.position.y = 2;
  root.add(body);
  root.scale.setScalar(scale);
  const add = (parent, g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = !shadowMode; o.receiveShadow = !shadowMode; parent.add(o); return o; };

  const torso = add(body, rbox(2, 2, 1, 0.14), mat(shirt), 0, 1, 0);
  if (!shadowMode && !apron) {
    add(torso, rbox(1.3, 0.55, 0.06, 0.05), mat(new THREE.Color(shirt).multiplyScalar(0.82)), 0, -0.45, 0.5);
    add(torso, rbox(0.06, 1.2, 0.04, 0.02), mat(0xf2f2f2), 0, 0.25, 0.51);
  }
  if (apron && !shadowMode) add(torso, rbox(1.6, 1.9, 0.08, 0.05), mat(apron), 0, -0.1, 0.52);
  const headPivot = new THREE.Group(); headPivot.position.set(0, 2, 0); body.add(headPivot);
  const head = add(headPivot, rbox(1.25, 1.25, 1.25, 0.32), mat(skin), 0, 0.68, 0);
  const faceMat = new THREE.MeshBasicMaterial({ map: face(shadowMode ? 'glow' : 'smile', shadowMode ? '#f4f1ff' : null), transparent: true, depthWrite: false });
  const faceP = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), faceMat);
  faceP.position.set(0, 0.66, 0.632);
  headPivot.add(faceP);
  const hm = mat(hair);
  if (shadowMode && hairStyle !== 'none') hairStyle = 'spiky';
  if (hairStyle === 'messy') {
    add(headPivot, rbox(1.36, 0.42, 1.36, 0.16), hm, 0, 1.36, -0.02);
    [[-0.45, 1.6, 0.3, 0.3], [0.1, 1.66, 0.42, 0.5], [0.5, 1.58, 0.1, -0.4], [-0.2, 1.62, -0.35, 0.2]].forEach(([x, y, z, r]) => {
      const t = add(headPivot, rbox(0.42, 0.34, 0.42, 0.1), hm, x, y, z); t.rotation.set(r * 0.5, r, r * 0.6);
    });
    add(headPivot, rbox(1.36, 0.7, 0.3, 0.12), hm, 0, 1.0, -0.56);
    add(headPivot, rbox(0.5, 0.26, 0.2, 0.08), hm, -0.32, 1.18, 0.62).rotation.z = 0.25;
  } else if (hairStyle === 'ponytail') {
    add(headPivot, rbox(1.36, 0.38, 1.36, 0.16), hm, 0, 1.38, -0.02);
    add(headPivot, rbox(1.36, 1.0, 0.32, 0.12), hm, 0, 0.9, -0.55);
    [-0.66, 0.66].forEach((x) => add(headPivot, rbox(0.14, 0.9, 1.1, 0.06), hm, x, 0.95, -0.1));
    add(headPivot, rbox(1.3, 0.24, 0.22, 0.08), hm, 0, 1.22, 0.6);
    add(headPivot, rbox(0.5, 1.3, 0.5, 0.2), hm, 0, 0.75, -0.95).rotation.x = 0.35;
    add(headPivot, rbox(0.56, 0.22, 0.56, 0.08), mat(0xff6fa0), 0, 1.38, -0.86);
  } else if (hairStyle === 'short') {
    add(headPivot, rbox(1.34, 0.32, 1.34, 0.14), hm, 0, 1.38, -0.02);
    add(headPivot, rbox(1.34, 0.5, 0.26, 0.1), hm, 0, 1.08, -0.56);
  } else if (hairStyle === 'bun') {
    add(headPivot, rbox(1.36, 0.36, 1.36, 0.16), hm, 0, 1.37, -0.02);
    add(headPivot, rbox(1.36, 0.6, 0.28, 0.1), hm, 0, 1.06, -0.56);
    add(headPivot, new THREE.SphereGeometry(0.42, 16, 12), hm, 0, 1.75, -0.35);
  } else if (hairStyle === 'spiky') {
    [[-0.4, 1.42], [0, 1.5], [0.4, 1.42]].forEach(([x, y]) => { add(headPivot, rbox(0.42, 0.42, 1.0, 0.08), mat(0), x, y, 0).rotation.z = x * 0.6; });
  }
  if (hat === 'police' && !shadowMode) {
    add(headPivot, rbox(1.4, 0.45, 1.4, 0.1), mat(0x1f2b55), 0, 1.45, 0);
    add(headPivot, rbox(1.45, 0.1, 0.6, 0.04), mat(0x111111), 0, 1.25, 0.7);
    add(headPivot, rbox(0.3, 0.3, 0.06, 0.04), mat(0xf2c14e, { metalness: 0.6, roughness: 0.3 }), 0, 1.5, 0.71);
  } else if (hat === 'tophat' && !shadowMode) {
    add(headPivot, new THREE.CylinderGeometry(1.15, 1.15, 0.12, 24), mat(0x16161c), 0, 1.36, 0);
    add(headPivot, new THREE.CylinderGeometry(0.72, 0.72, 1.3, 24), mat(0x16161c), 0, 2.0, 0);
    add(headPivot, new THREE.CylinderGeometry(0.735, 0.735, 0.24, 24), mat(0xc8343f), 0, 1.5, 0);
  } else if (hat === 'hardhat' && !shadowMode) {
    add(headPivot, new THREE.SphereGeometry(0.82, 20, 10, 0, 6.3, 0, 1.6), mat(0xffc83d, { roughness: 0.4 }), 0, 1.28, 0);
    add(headPivot, new THREE.CylinderGeometry(0.98, 0.98, 0.1, 24), mat(0xffc83d, { roughness: 0.4 }), 0, 1.3, 0.1);
  } else if (hat === 'chef') {
    add(headPivot, rbox(1.3, 0.4, 1.3, 0.1), mat(0xffffff), 0, 1.45, 0);
    add(headPivot, new THREE.SphereGeometry(0.85, 16, 12), mat(0xffffff), 0, 2.05, 0);
  }
  if (glasses && !shadowMode) add(headPivot, rbox(1.1, 0.3, 0.06, 0.04), mat(0x111118, { roughness: 0.2 }), 0, 0.82, 0.66);
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
  [armL, armR].forEach((a) => add(a, rbox(0.98, 0.62, 0.98, 0.14), mat(skin), 0, -1.72, 0));
  const legL = limb(-0.5, 0, mat(pants));
  const legR = limb(0.5, 0, mat(pants));
  [legL, legR].forEach((l) => add(l, rbox(1.04, 0.4, 1.12, 0.12), mat(shoes), 0, -1.82, 0.05));
  const handR = new THREE.Group(); handR.position.set(0, -2.05, 0.2); armR.add(handR);
  const handL = new THREE.Group(); handL.position.set(0, -2.05, 0.2); armL.add(handL);
  return { root, body, headPivot, head, faceMat, armL, armR, legL, legR, handR, handL, shadowMode, glow: '#f4f1ff' };
}

export function setFace(av, name) {
  av.faceMat.map = av.shadowMode ? face(name.startsWith('glow') ? name : 'glow', av.glow) : face(name);
}
// mouth flaps while a word is being spoken
export function talkFace(av, words, t, open = 'talk', closed = 'smile') {
  const w = words.find(([s, e]) => t >= s && t < e);
  setFace(av, w && Math.floor((t - w[0]) * 9) % 2 === 0 ? open : closed);
}

// ---------------------------------------------------------------- poses (x, y, z radians per part)
export const POSES = {
  idle: { armL: [0, 0, 0.06], armR: [0, 0, -0.06], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0, 0] },
  flinch: { armL: [0, 0, -2.8], armR: [0, 0, 2.8], legL: [0.12, 0, -0.08], legR: [-0.1, 0, 0.08], head: [0.18, 0, 0] },
  crouch: { armL: [0.6, 0, 0.2], armR: [0.6, 0, -0.2], legL: [-0.9, 0, 0], legR: [-0.9, 0, 0], head: [0.1, 0, 0] },
  tuck: { armL: [-1.4, 0, 0.3], armR: [-1.4, 0, -0.3], legL: [-1.8, 0, 0], legR: [-1.8, 0, 0], head: [0.3, 0, 0] },
  tada: { armL: [-2.6, 0, -0.35], armR: [-2.6, 0, 0.35], legL: [0, 0, -0.12], legR: [0, 0, 0.12], head: [-0.15, 0, 0] },
  wave: { armL: [0, 0, 0.06], armR: [-0.3, 0, 2.5], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0.2, 0] },
  cheer: { armL: [-2.9, 0, -0.3], armR: [-2.9, 0, 0.3], legL: [0, 0, -0.1], legR: [0, 0, 0.1], head: [-0.25, 0, 0] },
  point: { armL: [0, 0, 0.06], armR: [-1.55, 0, 0], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0, 0] },
  offer: { armL: [0, 0, 0.06], armR: [-1.3, 0, 0.1], legL: [0, 0, 0], legR: [0, 0, 0], head: [0.1, 0, 0] },
  phone: { armL: [0, 0, 0.06], armR: [-1.35, 0.5, 0.25], legL: [0, 0, 0], legR: [0, 0, 0], head: [0.4, 0, 0] },
  crossArms: { armL: [-1.25, 0, -0.9], armR: [-1.25, 0, 0.9], legL: [0, 0, -0.06], legR: [0, 0, 0.06], head: [-0.1, 0, 0] },
  armsOut: { armL: [0, 0, -1.5], armR: [0, 0, 1.5], legL: [0, 0, -0.2], legR: [0, 0, 0.2], head: [0, 0, 0] },
  reach: { armL: [0, 0, 0.06], armR: [-2.0, 0, 0], legL: [-0.5, 0, 0], legR: [0.4, 0, 0], head: [0, 0, 0] },
  slam: { armL: [-0.3, 0, 0.2], armR: [-1.1, 0, 0], legL: [-0.5, 0, 0], legR: [0.5, 0, 0], head: [0.35, 0, 0] },
  sit: { armL: [-0.3, 0, 0.1], armR: [-0.3, 0, -0.1], legL: [-1.57, 0, 0], legR: [-1.57, 0, 0], head: [0, 0, 0] },
  sitBack: { armL: [-0.2, 0, -0.5], armR: [-0.2, 0, 0.5], legL: [-1.57, 0, 0], legR: [-1.57, 0, 0], head: [-0.15, 0, 0] },
  kneel: { armL: [-0.9, 0, 0.1], armR: [-0.9, 0, -0.1], legL: [-1.57, 0, 0], legR: [0.2, 0, 0], head: [0.5, 0, 0] },
  shy: { armL: [-0.35, 0.6, 0.6], armR: [-0.35, -0.6, -0.6], legL: [0, 0, 0.08], legR: [0, 0, -0.08], head: [0.3, 0, 0] },
  yell: { armL: [-2.0, 0.5, -0.35], armR: [-2.0, -0.5, 0.35], legL: [0, 0, -0.12], legR: [0, 0, 0.12], head: [-0.2, 0, 0] },
  climb: { armL: [-2.9, 0, 0.1], armR: [-2.3, 0, -0.1], legL: [-1.0, 0, 0], legR: [-0.3, 0, 0], head: [-0.25, 0, 0] },
  throw: { armL: [-0.4, 0, 0.3], armR: [-2.7, 0, -0.2], legL: [0.4, 0, 0], legR: [-0.4, 0, 0], head: [-0.2, 0, 0] },
  serve: { armL: [-1.4, 0, 0.15], armR: [-1.4, 0, -0.15], legL: [0, 0, 0], legR: [0, 0, 0], head: [0.15, 0, 0] },
  hug: { armL: [-1.45, 0.75, -0.2], armR: [-1.45, -0.75, 0.2], legL: [0, 0, 0], legR: [0, 0, 0], head: [0.1, 0, 0] },
  yoga: { armL: [-3.0, 0, 0.12], armR: [-3.0, 0, -0.12], legL: [0, 0, 0], legR: [-0.3, 0, 1.4], head: [-0.1, 0, 0] },
  float: { armL: [-0.4, 0, -1.9], armR: [-0.4, 0, 1.9], legL: [0.3, 0, -0.45], legR: [-0.2, 0, 0.45], head: [-0.2, 0, 0] },
  flail: { armL: [-2.6, 0, -0.9], armR: [-2.2, 0, 1.2], legL: [-0.7, 0, -0.3], legR: [0.5, 0, 0.35], head: [-0.3, 0, 0] },
  kick: { armL: [0.4, 0, -0.5], armR: [-0.6, 0, 0.6], legL: [0.2, 0, 0], legR: [-1.4, 0, 0], head: [0.2, 0, 0] },
  pull: { armL: [-1.2, 0, 0.1], armR: [-1.2, 0, -0.1], legL: [0.5, 0, 0], legR: [-0.6, 0, 0], head: [-0.15, 0, 0] },
  push: { armL: [-1.7, 0, 0.1], armR: [-1.7, 0, -0.1], legL: [-0.6, 0, 0], legR: [0.5, 0, 0], head: [0.1, 0, 0] },
  carry: { armL: [-1.3, 0, 0.2], armR: [-1.3, 0, -0.2], legL: [0, 0, 0], legR: [0, 0, 0], head: [0, 0, 0] },
};

export function pose(av, a, b = a, k = 0) {
  const A = POSES[a], B = POSES[b];
  for (const part of ['armL', 'armR', 'legL', 'legR']) av[part].rotation.set(...A[part].map((v, i) => v + (B[part][i] - v) * k));
  av.headPivot.rotation.set(...A.head.map((v, i) => v + (B.head[i] - v) * k));
}

// walk / run cycles (cycles per second)
export function walk(av, t, speed = 1.6, amp = 0.65) {
  const s = Math.sin(t * speed * Math.PI * 2);
  av.legL.rotation.set(s * amp, 0, 0); av.legR.rotation.set(-s * amp, 0, 0);
  av.armL.rotation.set(-s * amp * 0.9, 0, 0.06); av.armR.rotation.set(s * amp * 0.9, 0, -0.06);
  av.headPivot.rotation.set(0, 0, 0);
  av.body.position.y = 2 + Math.abs(Math.cos(t * speed * Math.PI * 2)) * 0.12;
}
export function run(av, t, speed = 2.6) {
  walk(av, t, speed, 1.0);
  av.armL.rotation.x *= 1.2; av.armR.rotation.x *= 1.2;
  av.body.rotation.x = 0.18;
  av.body.position.y = 2 + Math.abs(Math.cos(t * speed * Math.PI * 2)) * 0.3;
}
export function reset(av) {
  av.body.rotation.set(0, 0, 0); av.body.position.set(0, 2, 0); av.headPivot.rotation.set(0, 0, 0);
}

// ---------------------------------------------------------------- crowd of shadow-people (one draw call per pose)
export function shadowCrowd(count, poseName, place) {
  const av = makeAvatar({ shadowMode: true });
  pose(av, poseName);
  av.root.updateMatrixWorld(true);
  const parts = [];
  av.root.traverse((o) => {
    if (o.isMesh && o.material !== av.faceMat) {
      let g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      g = g.index ? g.toNonIndexed() : g;
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      parts.push(g);
    }
  });
  const merged = mergeGeometries(parts);
  const mesh = new THREE.InstancedMesh(merged, new THREE.MeshBasicMaterial({ color: SHADOW_COLOR }), count);
  const eyes = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshBasicMaterial({ map: face('glow', '#f4f1ff'), transparent: true, depthWrite: false }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), off = new THREE.Matrix4().makeTranslation(0, 4.66, 0.64);
  for (let i = 0; i < count; i++) {
    const { pos, rotY = 0, s = 1 } = place(i);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    m.compose(new THREE.Vector3(...pos), q, new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
    eyes.setMatrixAt(i, m.clone().multiply(off));
  }
  const g = new THREE.Group(); g.add(mesh, eyes);
  return g;
}
