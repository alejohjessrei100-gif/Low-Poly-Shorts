// Face rig test: Kuro cycles through every expression preset (blended, with blinks and glances), then lip-syncs the
// first 5 seconds of episode 7 ("My homework ate my dog! No, really, it was math. Page 42.").
import { createCore, lerp } from '../../kit/core.js';
import { kuro, livingRoom } from '../../kit/kuro.js';
import { faceRig, PRESETS } from '../../kit/face.js';
import { actor, cameraRig } from '../../kit/act.js';
import { polish } from '../../kit/polish.js';
import * as P from '../../kit/props.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: 'blender' });
const { THREE, scene, camera, composer, setLight } = C;
C.allowBlur(true);
scene.add(camera); camera.near = 0.05;
const words = (await (await fetch('../../episodes/07_homework_dog/words.json')).json()).words;
const amp = (await (await fetch('../../episodes/07_homework_dog/amp.json')).json()).amp;
livingRoom(scene);
const K = kuro(scene, 1.45, { r15: true });
const F = faceRig(K, { ink: '#f6f6fa', skin: 0x2a2a34, style: 'dramatic' });
const A = actor(K, { seed: 3 });
const PL = polish(C);
const CAM = cameraRig(camera);
const LIST = ['neutral', 'happy', 'laughing', 'sad', 'crying', 'angry', 'furious', 'scared', 'shocked', 'smug', 'suspicious', 'embarrassed', 'determined', 'bored', 'dread', 'starstruck'];
const STEP = 1.05, T0 = LIST.length * STEP + 0.3; // then the lip-sync section
const labels = LIST.map((n) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.12), new THREE.MeshBasicMaterial({ map: P.textTex([n.toUpperCase()], { w: 1024, h: 220, bg: '#1b1b24', fg: '#ffffff', radius: 40 }), transparent: true })); m.position.set(0.0, 0.98, 0.9); scene.add(m); return m; });
const lipLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.12), new THREE.MeshBasicMaterial({ map: P.textTex(['LIP-SYNC'], { w: 1024, h: 220, bg: '#d83a3a', fg: '#ffffff', radius: 40 }), transparent: true })); lipLabel.position.set(0, 0.98, 0.9); scene.add(lipLabel);
// expression track: each preset keyed a few frames before its slot; then the episode-7 opening with its own acting
const keys = LIST.map((n, i) => [i * STEP - 0.05, n, { blend: 0.09, look: PRESETS[n].look || [Math.sin(i * 1.7) * 0.4, 0] }]);
keys.push([T0 - 0.1, 'scared', { look: [0.5, -0.4] }], [T0 + 0.78, 'shocked', { look: [0.2, -0.3] }], [T0 + 1.55, 'suspicious', { look: [0, 0] }], [T0 + 2.45, 'bored', { look: [-0.2, -0.6] }], [T0 + 3.5, 'smug', { look: [0, 0] }]);
F.track(keys);
F.lipsync(words.map(([s, e, w]) => [s + T0, e + T0, w]), amp.map(() => 0).concat([]), 60, (t) => t > T0);
// amplitude shifted by T0
const ampShift = new Array(Math.round(T0 * 60)).fill(0).concat(amp); F.lipsync(words.map(([s, e, w]) => [s + T0, e + T0, w]), ampShift, 60, (t) => t > T0);
A.keys([[0, 'idle'], [T0 + 0.6, 'crouch', { antic: 0 }], [T0 + 0.86, 'flailUp', { dur: 0.12 }], [T0 + 1.3, 'shockRecoil', { dur: 0.25 }], [T0 + 1.65, 'shrug', { dur: 0.3, antic: 0.12 }], [T0 + 2.5, 'crossArms', { dur: 0.35 }], [T0 + 3.6, 'handsOnHips', { dur: 0.3 }]]);
A.squash([[T0 + 0.82, -0.08, 0.1], [T0 + 0.9, 0.09, 0.2], [T0 + 1.22, -0.1, 0.18]]);
window.SHOT_TIMES = [0]; window.END = T0 + 5.1;
window.renderAt = (t) => {
  setLight('indoor', [0, 0, 0]);
  K.root.position.set(0, 0, 0.45); K.root.rotation.y = 0;
  const lip = t > T0; const jump = lip ? Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - T0 - 0.88) / 0.36)))) * 0.22 : 0; K.root.position.y = jump;
  A.update(t); F.update(t);
  labels.forEach((l, i) => (l.visible = !lip && t >= i * STEP - 0.05 && t < (i + 1) * STEP - 0.05)); lipLabel.visible = lip && t < T0 + 1.2;
  const L = CAM.at(t, lip ? [[T0, [0.3, 1.2, 2.6], [0, 1.0, 0.4], 44], [T0 + 0.8, [0.25, 1.18, 2.3], [0, 1.0, 0.4], 44], [T0 + 1.6, [0.1, 1.28, 1.6], [0, 1.2, 0.45], 36], [T0 + 5.1, [0.05, 1.28, 1.45], [0, 1.2, 0.45], 36]] : [[0, [0.0, 1.26, 1.8], [0, 1.2, 0.45], 34], [T0, [0.0, 1.26, 1.75], [0, 1.2, 0.45], 34]], { shakes: [[T0 + 0.88, 0.035, 0.45]], punch: [[T0 + 0.88, 6, 0.6]] });
  camera.lookAt(L); PL.rimAt(new THREE.Vector3(0, 1.1, 0.45), 1.2); PL.contact('k', K.root, 0, 0.9);
  PL.dof(new THREE.Vector3(0, 1.28, 0.65), { range: 0.35, aperture: 0.02, maxblur: 0.008 });
  if (!window.__NO_RENDER) composer.render();
};
window.READY = true;
