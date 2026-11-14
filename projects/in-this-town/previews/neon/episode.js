// Set preview for episode 4 (no voice yet): a few camera views of the neon city and the pizzeria.
import { createCore } from '../../kit/core.js';
import { buildNeon, pizzeria, slice, pineapple, setNeon } from '../../kit/neon.js';
import { policeCar } from '../../kit/props.js';
import { makeAvatar, pose, setFace } from '../../kit/avatar.js';
await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: 'blender' });
const { THREE, scene, camera, composer, setLight } = C;
scene.add(camera);
buildNeon(scene);
const PZ = pizzeria(scene, 1000, 0);
const cars = [policeCar(scene, -4, -46, 0.3), policeCar(scene, 3, -38, -0.4)];
const marco = makeAvatar({ shirt: 0xffd23e, pants: 0x2a2a3a, hair: 0x2a1a12, hairStyle: 'messy', skin: 0xe8b48a }); marco.root.position.set(-9.5, 0.3, -30); marco.root.rotation.y = Math.PI / 2; scene.add(marco.root); setFace(marco, 'determined');
const cop = makeAvatar({ shirt: 0x2a3f7a, pants: 0x1f2b55, hair: 0x3a2a1a, hairStyle: 'short', hat: 'police', skin: 0xc98d62 }); cop.root.position.set(-6, 0.3, -42); cop.root.rotation.y = 2.4; scene.add(cop.root); pose(cop, 'point'); setFace(cop, 'angry');
const s = slice(scene); s.position.set(1000.5, 2.9, -3.2);
const V = [
  { l: 'neon', c: [0, 0, -40], cam: [0, 9, 30], look: [0, 12, -90] },
  { l: 'neon', c: [0, 0, -40], cam: [8, 5, -20], look: [-12, 5, -40] },
  { l: 'neon', c: [0, 0, -60], cam: [0, 40, 10], look: [0, 0, -80] },
  { l: 'indoor', c: [1000, 0, 0], cam: [1006, 5, 12], look: [1000, 3, -5], fridge: 0.9 },
];
window.SHOT_TIMES = V.map((_, i) => i); window.END = V.length;
window.renderAt = (t) => {
  const v = V[Math.min(V.length - 1, Math.floor(t))];
  setLight(v.l, v.c); camera.position.set(...v.cam); camera.fov = 55; camera.updateProjectionMatrix(); camera.lookAt(...v.look);
  setNeon(1); PZ.setFridge(v.fridge || 0); cars.forEach((c) => c.flash(t * 3));
  composer.render();
};
window.READY = true;
