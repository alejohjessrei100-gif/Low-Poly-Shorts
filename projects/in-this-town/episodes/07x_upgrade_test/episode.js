// Upgrade test: the first 5 seconds of episode 7 with the new face rig (blended expressions, blinks, moving pupils,
// lip-sync), R15 acting (anticipation, follow-through, squash & stretch, idle life), eased camera with punch-in and
// shake on the vine boom, rim light, contact shadows, depth of field and motion blur. Same voice and timing.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { kuro, dog, homework, livingRoom } from '../../kit/kuro.js';
import { faceRig } from '../../kit/face.js';
import { actor, cameraRig } from '../../kit/act.js';
import { polish, dust } from '../../kit/polish.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: 'blender' });
const { THREE, scene, camera, composer, setLight } = C;
C.allowBlur(true); scene.add(camera); camera.near = 0.05; camera.far = 300;
const BASE = new URL('../07_homework_dog/', import.meta.url);
const WORDS = (await (await fetch(new URL('words.json', BASE))).json()).words;
const AMP = (await (await fetch(new URL('amp.json', BASE))).json()).amp;
const END = 5.0;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const R = livingRoom(scene); const SP = R.spot;
const K = kuro(scene, 1.45, { r15: true });
const F = faceRig(K, { ink: '#f6f6fa', skin: 0x2a2a34, style: 'dramatic' });
const A = actor(K, { seed: 7 });
const DOG = dog(scene), HW = homework(scene);
const PL = polish(C), DUST = dust(scene, 12, 0xc8b8a0), CAM = cameraRig(camera);

// ---- Kuro's performance (keys land a few frames before the words / the vine boom at 0.88)
F.track([[0, 'scared', { look: [0.55, -0.7] }], [0.76, 'shocked', { look: [0.35, -0.5], blend: 0.07 }], [1.55, 'suspicious', { look: [0, 0.05] }], [2.15, 'determined', { look: [0, 0] }], [4.45, 'neutral', { look: [0.2, -0.8] }]]);
F.lipsync(WORDS, AMP, 60, (t) => t < 2.52 || t > 4.55); // he speaks on camera in shots 1, 2 and 4
A.keys([[0, 'point', { armR: [-1.05, 0.55, 0.15], elbowR: -0.2, chest: [0.08, 0.25, 0], head: [0.25, 0.3, 0] }], [0.62, 'crouch', { dur: 0.2 }], [0.86, 'flailUp', { dur: 0.1 }], [1.22, 'shockRecoil', { dur: 0.2 }],
  [1.7, 'shrug', { dur: 0.28, antic: 0.1 }], [2.3, 'presentPalm', { dur: 0.25 }], [4.6, 'pickup', { dur: 0.32, antic: 0.08 }]]);
A.squash([[0.74, -0.09, 0.14], [0.86, 0.1, 0.22], [1.21, -0.13, 0.2]]);
const hop = (t) => { const u = (t - 0.86) / 0.36; return u > 0 && u < 1 ? Math.sin(Math.PI * u) * 0.24 : 0; };

// ---- shots: same cuts as the original (words), eased cameras
const SHOTS = [
  { t: 0, light: 'indoor', cam: [[0, [1.1, 0.82, 3.3], [0.3, 0.7, 0.0], 48], [0.85, [0.98, 0.84, 3.0], [0.25, 0.85, -0.4], 46], [1.62, [0.9, 0.9, 2.85], [0.2, 0.95, -0.6], 46]], fx: { shakes: [[0.88, 0.045, 0.5]], punch: [[0.88, 8, 0.6]] }, dof: { range: 1.3, aperture: 0.012 } },
  { t: 1.62, light: 'indoor', cam: [[1.62, [0.75, 1.16, 2.9], [0.1, 1.05, -0.4], 44], [2.52, [0.52, 1.2, 2.25], [0.1, 1.12, -0.4], 40]], dof: { range: 0.55, aperture: 0.016 } },
  { t: 2.52, light: 'indoor', cam: [[2.52, [SP.x + 0.35, 1.32, SP.z + 0.85], [SP.x, 0, SP.z], 46], [3.6, [SP.x + 0.2, 1.08, SP.z + 0.66], [SP.x, 0, SP.z - 0.02], 45], [4.6, [SP.x + 0.08, 0.9, SP.z + 0.52], [SP.x, 0, SP.z - 0.05], 42]], dof: { range: 0.2, aperture: 0.02 }, insert: true },
  { t: 4.6, light: 'indoor', cam: [[4.6, [2.9, 1.7, 5.4], [-0.2, 0.7, 0.2], 54], [5.0, [2.8, 1.68, 5.2], [-0.25, 0.7, 0.2], 54]], dof: { range: 2.5, aperture: 0.008 } },
].map((s) => ({ ...s, t: Math.max(0, s.t - 2 / 60) }));

function pose(t) { // the whole scene at time t (also used for motion-blur sub-frames)
  let i = 0; SHOTS.forEach((s, j) => { if (t >= s.t) i = j; }); const s = SHOTS[i];
  setLight(s.light, [0, 0, 0]);
  DUST.hide(); HW.g.visible = true; DOG.g.visible = false; K.root.visible = true; PL.hideContacts();
  // homework + tail (shots 1-2), plain worksheet (3-4)
  HW.g.position.set(SP.x, 0, SP.z); HW.g.rotation.set(0, i === 0 ? 0.15 : -0.5, 0);
  HW.set(1.5, i < 2 ? { chew: 1, t, tailOn: true } : { alive: false, open: 0 });
  if (i >= 2) { DOG.g.visible = true; DOG.g.position.set(R.bed.x, 0.08, R.bed.z); DOG.g.rotation.set(0, 0.8, 0); DOG.pose('sit', t, 0.2); }
  // Kuro
  if (i === 0) { K.root.position.set(0.15, hop(t), -1.0); K.root.rotation.set(0, 0.25, 0); }
  else if (i === 1) { K.root.position.set(0.1, 0, -0.4); K.root.rotation.set(0, 0.12, 0); }
  else if (i === 3) { K.root.position.set(SP.x - 0.25, 0, SP.z + 0.55); K.root.rotation.set(0, Math.PI - 0.25, 0); }
  else K.root.visible = false;
  A.update(t); F.update(t);
  if (i === 0) { const u = (t - 1.22) / 0.55; if (u > 0 && u < 1) DUST.set(V3(0.15, 0, -1.0), u, 0.08); }
  const L = CAM.at(t, s.cam, s.fx || {}); camera.lookAt(L);
  const face = K.face.getWorldPosition(new THREE.Vector3());
  PL.rimAt(i === 2 ? V3(SP.x, 0.2, SP.z) : face, i === 2 ? 0.4 : 1.3); PL.contact('k', K.root, 0, 0.85);
  PL.dof(s.insert ? V3(SP.x, 0.05, SP.z) : face, s.dof);
}
window.renderAt = (t) => {
  if (window.__NO_RENDER) { pose(t); return; }
  C.renderAccum(3, (k) => pose(t - k / 180)); // motion blur: 180-degree shutter at 30 fps, 3 sub-frames
};
window.__acc = (t, n) => C.renderAccum(n, (k) => pose(t - k / 180));
window.__direct = (t, dof = true) => { pose(t); if (!dof) C.bokeh.enabled = false; composer.render(); }; // debug: no motion blur
window.SHOT_TIMES = SHOTS.map((s) => s.t); window.END = END;
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: [{ name: 'kuro', wrap: K.root, head: K.face, legL: { rotation: { x: 0 } } }] };
window.READY = true;
