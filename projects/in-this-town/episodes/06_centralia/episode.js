// Episode 06 (true story) "The Ground SWALLOWED This 12-Year-Old" - Centralia, Pennsylvania, 14 Feb 1981 (37.8 s).
// Classic avatars at real size (kit/rig.js), coal-town set in winter (kit/coal.js), mine-fire cutaway, steam.
// Facts and sources: ep06/true/SOURCES.md. House rules: no blur, steady faces, mostly wide shots, clip-checked.
import { createCore, smooth, lerp, clamp01, canvasTex } from '../../kit/core.js';
import { buildCoalTown, mineCutaway, steam, HOLE, HOLE_R, GRANDMA, FRONT } from '../../kit/coal.js';
import { avatar } from '../../kit/rig.js';
import { prop, preload } from '../../kit/assets.js';
import { snowfall } from '../../kit/life.js';
import * as P from '../../kit/props.js';
import { loadFixes, setShot, offsetActor, applyCamera } from '../../kit/autofix-runtime.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
scene.add(camera);
camera.near = 0.08; camera.far = 900;

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.5;
await loadFixes(new URL('./autofix.json', import.meta.url));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const H = HOLE;

// ---------------------------------------------------------------- world
const T = buildCoalTown(scene);
const CUTAWAY = mineCutaway(scene, 1000);
const STEAM = steam(scene, 320);
const SNOW = snowfall(scene, 900, { box: [30, 16, 30], speed: 1.1, size: 0.03 });
await preload(['tree_pine', 'sedan', 'van', 'truck', 'suv']);
for (let k = 0; k < 26; k++) { const a = k * 2.39, r = 60 + (k * 37 % 90); const t = await prop(scene, 'tree_pine', 8 + (k % 4) * 2, { by: 'height' }); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 50); if (Math.abs(t.position.x) < 14) t.position.x += 30; }
for (const [x, z] of [[-33, -27], [-36.5, -33]]) { const t = await prop(scene, 'tree_pine', 6.5, { by: 'height' }); t.position.set(x, 0, z); }
const parked = [];
for (const [m, x, z, ry] of [['sedan', -3, -12, 0], ['suv', 3, -22, Math.PI], ['van', -3, -44, 0], ['sedan', 3, -56, Math.PI]]) { const c = await prop(scene, m, m === 'van' ? 5 : 4.6); c.position.set(x, 0, z); c.rotation.y = ry; parked.push(c); }
const roadCar = await prop(scene, 'sedan', 4.6);
const trucks = [await prop(scene, 'van', 5.2), await prop(scene, 'truck', 5.4)];
// snowman Todd is building, the newspaper on grandma's porch
const snowman = new THREE.Group(); scene.add(snowman); snowman.position.set(H.x - 1.25, 0, H.z - 0.95);
{ const sn = P.std(0xf4f6fa, { roughness: 0.95 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), sn); b.position.y = 0.36; snowman.add(b); const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), sn); m.position.y = 0.95; snowman.add(m); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), sn); hd.position.y = 1.38; snowman.add(hd);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 8), P.std(0xf2783a)); nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.38, 0.24); snowman.add(nose); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), P.std(0x111111)); e.position.set(s * 0.07, 1.45, 0.19); snowman.add(e); } snowman.rotation.y = 0.9; }
const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshStandardMaterial({ map: P.textTex(['SATURDAY · FEB. 14, 1981', 'MINE FIRE: BOY HURT?'], { w: 1024, h: 730, bg: '#efe8d8', fg: '#1b1b24', radius: 4, sizes: [64, 92] }), roughness: 0.9 }));
paper.rotation.set(-Math.PI / 2, 0, 0.5); paper.position.set(-FRONT + 1.2, 0.565, -31 + 0.6); scene.add(paper); paper.visible = false;
// dirt chunks for the collapse
const chunks = Array.from({ length: 14 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12 + (i % 3) * 0.06, 0.1, 0.14), P.std(i % 4 ? 0x5a4030 : 0xeef2f7)); scene.add(m); return m; });

// ---------------------------------------------------------------- cast: the classic avatars at real size
const actors = [];
function cast(name, opts, h, face) { const c = avatar(scene, opts, h, { face }); const a = { name, c, root: c.root, seated: false }; actors.push(a); return a; }
const todd = cast('todd', { skin: 0xf6c89a, shirt: 0x2f4a7a, pants: 0x3a4a6a, shoes: 0x3a2a20, hair: 0x6a4a2a, hairStyle: 'short', hat: 'beanie', beanieCol: 0xd8203a }, 1.45, 'happy');
const eric = cast('eric', { skin: 0xf2c49a, shirt: 0x8a5a2a, pants: 0x2c3e74, shoes: 0x2a2a30, hair: 0x3a2a1a, hairStyle: 'messy', scarf: 0x3a6a4a }, 1.68, 'determined');
const grandma = cast('grandma', { skin: 0xf6d2b0, shirt: 0x8a5a9a, pants: 0x5a5a6a, hair: 0xd8d8d8, hairStyle: 'bun', glasses: true, apron: 0xf4f0e6 }, 1.58, 'shock');
const folk = [
  cast('folk0', { skin: 0xd8a070, shirt: 0x6a2a24, pants: 0x3a3a46, hairStyle: 'short', hat: 'beanie', beanieCol: 0x2a4a6a }, 1.78, 'deadpan'),
  cast('folk1', { skin: 0xf0c090, shirt: 0x2a6a5a, pants: 0x3a4a7a, hair: 0x7a4a2a, hairStyle: 'ponytail' }, 1.68, 'scared'),
  cast('folk2', { skin: 0x8a5a3a, shirt: 0x5a5a62, pants: 0x2a2a30, hairStyle: 'short', hat: 'hardhat' }, 1.8, 'determined'),
  cast('folk3', { skin: 0xf6c89a, shirt: 0xc8a030, pants: 0x2c3e74, hair: 0x3a2a1a, hairStyle: 'messy', backpack: 0x3a6aa8 }, 1.35, 'scared'),
];
// Todd gets muddy after the fall: tint his clothes toward mud (face plane untouched)
const toddMats = []; todd.c.inner.traverse((o) => { if (o.isMesh && o.material && !o.material.map && o.material.color) toddMats.push([o.material, o.material.color.clone()]); });
const MUD = new THREE.Color(0x4a3426);
const muddy = (k) => toddMats.forEach(([m, c0]) => m.color.copy(c0).lerp(MUD, k * 0.55));
const boxes = folk.map(() => { const b = new THREE.Group(); scene.add(b); P.box(0.55, 0.4, 0.45, P.std(0xb08a5a), 0, 0, 0, b); P.box(0.56, 0.04, 0.1, P.std(0xd8c8a0), 0, 0.2, 0, b); return b; });

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.root.visible = false; a.root.position.set(0, -80, 0); a.seated = false; a.c.root.rotation.set(0, 0, 0); }
  boxes.forEach((b) => (b.visible = false)); chunks.forEach((c) => (c.visible = false)); trucks.forEach((t) => (t.visible = false));
  roadCar.visible = false; paper.visible = false; snowman.visible = true; muddy(0);
  T.lid.visible = true; T.lid.position.copy(H); T.lid.rotation.set(0, 0, 0); T.holeLight.intensity = 0; T.setGone(0); T.lip.visible = false; parked.forEach((c) => (c.visible = true));
  grade.uniforms.flash.value = 0; SNOW.hide();
}
function put(a, x, y, z, yaw = 0) { a.root.visible = true; a.root.position.set(x, y, z); offsetActor(a.name, a.root.position); a.root.rotation.set(0, yaw, 0); a.seated = false; }
const toward = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
/** Todd hanging from the root inside the hole (hands up on the root, feet over the drop) */
function hanging(t, yOff = 0, look = 0.0) {
  put(todd, H.x - 0.05, -2.22 + yOff, H.z + 0.02, 0.6); todd.c.pose('climb', t);
  const s = Math.sin(t * 2.2) * 0.06; todd.c.armL.rotation.x = -2.95 + s; todd.c.armR.rotation.x = -2.9 - s; todd.c.armL.rotation.z = -0.25; todd.c.armR.rotation.z = 0.25;
  todd.c.av.legL.rotation.x = 0.15 + Math.sin(t * 3) * 0.15; todd.c.av.legR.rotation.x = -0.1 - Math.sin(t * 3) * 0.15; todd.c.tiltHead(look); muddy(0.5);
}
function holeSteam(t, k = 1, tint = 0xeeeedc) { STEAM.vent(V3(H.x, -1.2, H.z), t, { per: Math.round(16 * k), h: 5.5, r0: 0.5, r1: 2.6, o: 0.6 * k, speed: 0.45, drift: [0.5, 0, 0.3], tint }); STEAM.vent(V3(H.x, -0.4, H.z), t + 0.37, { per: Math.round(8 * k), h: 3, r0: 0.4, r1: 1.6, o: 0.45 * k, speed: 0.6, tint }); }
const shake = (t, k) => V3(Math.sin(t * 61) * 0.06 * k, Math.sin(t * 47 + 1) * 0.05 * k, Math.sin(t * 53 + 2) * 0.04 * k);

// ---------------------------------------------------------------- shots
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const WIN = { light: 'winter' };
const tFall = W('swallowed', 3) - 0.05;

// 0 "A 12-year-old was playing in his grandma's backyard," cold open: Todd builds a snowman behind the house
S(0, { ...WIN, snow: 0.6, c: [H.x, 0, H.z], cam: [[H.x - 4.3, 1.5, H.z + 1.9], [H.x - 3.9, 1.45, H.z + 1.6], [H.x - 0.5, 0.8, H.z - 0.4]], fov: 52, act(t) {
  put(todd, H.x, 0, H.z, toward(H.x, H.z, snowman.position.x, snowman.position.z)); todd.c.pose('pick-up', 0.15 + Math.max(0, Math.sin(t * 3)) * 0.18, null, 0, 0, { once: true }); todd.c.setFace('happy');
} });
// 1 "when the ground swallowed him." the snow gives way under him
S(W('when', 2.1), { ...WIN, snow: 0.6, c: [H.x, 0, H.z], cam: [[H.x + 6.4, 2.3, H.z + 5.6], [H.x + 6.0, 2.2, H.z + 5.2], [H.x, 0.5, H.z]], fov: 52, act(t, k, s) {
  const d = t - tFall;
  if (d < 0) { put(todd, H.x, 0, H.z, 0.9); todd.c.pose('pick-up', 0.2, null, 0, 0, { once: true }); todd.c.setFace('happy'); }
  else { const y = -Math.min(2.4, 9 * d * d + 0.6 * d); put(todd, H.x, y, H.z, 0.9); todd.c.pose('flail', t); todd.c.setFace('shock'); T.lid.position.y = -Math.min(9, 6 * d * d); T.lid.rotation.x = d * 2; if (d > 0.5) T.lid.visible = false;
    chunks.forEach((c, i) => { c.visible = d < 1.1; const a = i * 0.45; c.position.set(H.x + Math.cos(a) * (0.6 + d * 0.3), 0.1 + d * 2.5 * ((i % 3) * 0.3 + 0.4) - 5 * d * d, H.z + Math.sin(a) * (0.6 + d * 0.3)); c.rotation.set(d * 9 + i, d * 6, i); });
    holeSteam(t, clamp01(d * 2)); T.holeLight.intensity = 6 * clamp01(d * 2); T.lip.visible = true; }
  s.shake = d > 0 && d < 0.9 ? 1 - d / 0.9 : 0;
} });
// 2 "This is Todd Domboski." the memory of him just before (washed-out colours)
S(W('this', 4.4), { ...WIN, snow: 0.5, memory: true, c: [H.x, 0, H.z], cam: [[H.x + 0.9, 1.15, H.z + 3.0], [H.x + 0.8, 1.12, H.z + 2.7], [H.x + 0.1, 0.95, H.z]], fov: 50, act(t) {
  put(todd, H.x + 0.1, 0, H.z, toward(H.x, H.z, H.x + 0.9, H.z + 3.0)); todd.c.pose('wave', t); todd.c.setFace('happy');
} });
// 3 "Centralia, Pennsylvania." the town in the snow, smoke from chimneys and from the ground
S(W('centralia', 6.2), { ...WIN, snow: 0, aerial: true, c: [0, 0, -50], cam: [[46, 42, 30], [40, 38, 22], [-6, 0, -58]], fov: 55, act(t) {
  [[folk[0], -6.2, 6], [folk[1], 6.4, -20]].forEach(([a, x, z], i) => { put(a, x, 0, z - ((t * 1.2) % 20), Math.PI); a.c.pose('walk', t + i * 0.3); });
} });
// 4 "Valentine's Day, 1981." grandma's front door with a paper heart, the morning paper on the porch
S(W("valentine's", 7.7), { ...WIN, snow: 0.5, c: [-9, 0, -30], cam: [[-4.3, 1.55, -26.0], [-4.6, 1.5, -26.4], [-8.6, 1.3, -29.7]], fov: 50, act() { paper.visible = true; } });
// 5 "And the hole wasn't empty." straight down into the hole: Todd hanging from a root
S(W('and', 9.8), { ...WIN, snow: 0.4, c: [H.x, 0, H.z], cam: [[H.x + 0.25, 2.9, H.z + 0.6], [H.x + 0.2, 2.4, H.z + 0.45], [H.x, -1.6, H.z]], fov: 50, act(t) {
  T.lid.visible = false; snowman.visible = true; hanging(t, 0, -0.5); todd.c.setFace('scared'); holeSteam(t, 0.55); T.holeLight.intensity = 5;
} });
// 6 "It was full of hot, poisonous steam." steam pours out of the hole, glow below
S(W('it', 11.3), { ...WIN, snow: 0.3, c: [H.x, 0, H.z], cam: [[H.x + 3.6, 0.7, H.z + 2.8], [H.x + 3.2, 0.9, H.z + 2.4], [H.x, 1.2, H.z]], fov: 54, act(t) {
  T.lid.visible = false; T.lip.visible = true; holeSteam(t, 1.25, 0xe8e6c8); T.holeLight.intensity = 8; hanging(t, 0, -0.5);
} });
// 7 "Because under this town, a coal mine has been on fire since 1962." cutaway of the burning mine
S(W('because', 13.5), { light: 'winter', c: [1000, 0, 0], cam: [[1000, -4, 36], [1000, -6, 28], [1000, -7, 0]], fov: 55, act(t) {
  CUTAWAY.tops.forEach((p, i) => STEAM.vent(p, t + i * 0.3, { per: 6, h: 6, r0: 0.6, r1: 2.6, o: 0.5, speed: 0.4 }));
} });
// 8 "Smoke rises out of the roads." the cracked road steams; a car drives through it
S(W('smoke', 18), { ...WIN, snow: 0.3, c: [0, 0, -80], cam: [[2.6, 1.55, -60], [2.3, 1.6, -63.5], [-0.4, 1.0, -88]], fov: 52, act(t) {
  roadCar.visible = true; roadCar.position.set(-2.1, 0, -112 + (t - 18) * 9); roadCar.rotation.y = 0;
} });
// 9 "Snow melts in the middle of winter." a bare green patch in the snow, warm ground steaming
S(W('snow', 19.9), { ...WIN, snow: 0.6, c: [-24, 0, -52], cam: [[-17.8, 2.3, -44.5], [-18.4, 2.0, -45.4], [-24, 0.2, -52]], fov: 52, act(t) {
  STEAM.vent(T.melt, t, { per: 10, h: 3.5, r0: 0.6, r1: 2.4, o: 0.4, speed: 0.3, drift: [0.4, 0, 0.6] });
  STEAM.vent(T.melt.clone().add(V3(1.4, 0, -0.8)), t + 0.5, { per: 6, h: 2.5, r0: 0.4, r1: 1.5, o: 0.35, speed: 0.35 });
} });
// 10 "Todd grabbed a tree root and hung on." close-up 1 of 3: his hands on the root, the drop below
S(W('todd', 21.5), { ...WIN, snow: 0.3, c: [H.x, 0, H.z], cam: [[H.x + 1.05, 0.95, H.z + 0.8], [H.x + 0.95, 0.88, H.z + 0.72], [H.x - 0.05, -0.65, H.z]], fov: 46, act(t) {
  T.lid.visible = false; T.lip.visible = true; hanging(t, 0, -0.55); todd.c.setFace('determined'); holeSteam(t, 0.35); T.holeLight.intensity = 6;
} });
// 11 "He couldn't see. He could barely breathe." close-up 2 of 3: his face in the steam
S(W('he', 23.4), { ...WIN, snow: 0.2, c: [H.x, 0, H.z], cam: [[H.x + 0.62, 0.22, H.z + 0.55], [H.x + 0.58, 0.18, H.z + 0.5], [H.x - 0.05, -1.05, H.z]], fov: 46, act(t) {
  T.lid.visible = false; T.lip.visible = true; hanging(t, 0, -0.6); todd.c.setFace('scared'); holeSteam(t, 1.1, 0xe8e6c8); T.holeLight.intensity = 7;
  grade.uniforms.flash.value = Math.max(0, Math.sin(t * 2.2 * Math.PI)) * 0.05; // pulsing dizziness, very light
} });
// 12 "Then his teenage cousin Eric spotted something in the steam." Eric runs out of the back door to the hole
const tRun = W('then', 25.7);
S(tRun, { ...WIN, snow: 0.5, c: [H.x + 4, 0, H.z], cam: [[H.x + 8.2, 2.1, H.z + 6.0], [H.x + 7.6, 2.0, H.z + 5.4], [H.x + 3.2, 0.9, H.z + 0.2]], fov: 54, act(t) {
  T.lid.visible = false; T.lip.visible = true; hanging(t); holeSteam(t, 0.9); T.holeLight.intensity = 5;
  const u = clamp01((t - tRun) / 1.5), x = lerp(GRANDMA.back.x - 0.6, H.x + 1.15, u), z = lerp(GRANDMA.back.z, H.z + 0.1, u);
  put(eric, x, 0, z, toward(x, z, H.x, H.z)); if (u < 1) eric.c.pose('sprint', t); else { eric.c.pose('pick-up', 0.12, null, 0, 0, { once: true }); }
  eric.c.setFace(u < 1 ? 'scared' : 'shock');
} });
// 13 "Todd's red hat." close-up 3 of 3: Eric's view down into the steam - a red hat
S(W("todd's", 28.1), { ...WIN, snow: 0.2, c: [H.x, 0, H.z], cam: [[H.x + 0.7, 2.5, H.z + 0.35], [H.x + 0.6, 2.25, H.z + 0.3], [H.x - 0.05, -0.9, H.z]], fov: 46, act(t) {
  T.lid.visible = false; T.lip.visible = true; hanging(t, 0, -0.6); todd.c.setFace('scared'); T.holeLight.intensity = 5;
  STEAM.vent(V3(H.x + 0.4, -0.8, H.z + 0.3), t, { per: 6, h: 3, r0: 0.4, r1: 1.4, o: 0.45, speed: 0.5 }); STEAM.vent(V3(H.x - 0.45, -0.9, H.z - 0.3), t + 0.4, { per: 6, h: 3, r0: 0.4, r1: 1.3, o: 0.45, speed: 0.55 });
} });
// 14 "Eric reached down and pulled him out." he leans in, Todd comes up out of the steam
const tPull = W('pulled', 30.6);
S(W('eric', 29.8), { ...WIN, snow: 0.4, c: [H.x, 0, H.z], cam: [[H.x + 3.4, 1.35, H.z + 3.3], [H.x + 3.1, 1.3, H.z + 3.0], [H.x + 0.4, 0.55, H.z]], fov: 52, act(t) {
  T.lid.visible = false; T.lip.visible = true; holeSteam(t, 0.8); T.holeLight.intensity = 5;
  const u = smooth((t - tPull + 0.6) / 1.0);
  put(eric, H.x + 1.15 + u * 0.35, 0, H.z + 0.1, -Math.PI / 2 + 0.05); eric.c.pose('pick-up', lerp(0.33, 0.12, u), null, 0, 0, { once: true }); eric.c.setFace('determined');
  eric.c.armR.rotation.x = lerp(-0.9, -1.6, u); eric.c.armL.rotation.x = lerp(-0.9, -1.4, u);
  if (u < 0.85) { hanging(t, u * 2.1, -0.6); todd.root.position.x = lerp(H.x - 0.05, H.x + 0.2, u); } else { put(todd, H.x + 0.55, 0, H.z + 0.05, 0.6); todd.c.pose('crouch', t); muddy(0.5); }
  todd.c.setFace('squeeze');
} });
// 15 "Todd survived." sitting in the snow, muddy; grandma runs out
S(W('todd', 31.7), { ...WIN, snow: 0.6, c: [H.x + 2, 0, H.z], cam: [[H.x + 4.6, 1.35, H.z + 2.9], [H.x + 4.3, 1.3, H.z + 2.6], [H.x + 1.5, 0.55, H.z + 0.3]], fov: 52, act(t) {
  T.lid.visible = false; T.lip.visible = true; holeSteam(t, 0.6);
  put(todd, H.x + 1.4, 0, H.z + 0.25, 1.9); todd.seated = true; todd.c.pose('sit', 0); todd.c.av.body.position.y = 0.62; muddy(0.55); todd.c.setFace('sleepy');
  put(eric, H.x + 1.75, 0, H.z - 0.55, -0.4); eric.c.pose('holding-right', t); eric.c.setFace('smile');
  const u = clamp01((t - 31.7) / 0.8); put(grandma, lerp(GRANDMA.back.x - 0.6, H.x + 2.7, u), 0, lerp(GRANDMA.back.z, H.z + 0.9, u), toward(GRANDMA.back.x, GRANDMA.back.z, H.x + 1.4, H.z)); grandma.c.pose(u < 1 ? 'sprint' : 'hug', t);
} });
// 16 "The town didn't. Almost everyone moved away." houses disappear one by one; moving trucks leave
const tGone = W('the', 32.7);
S(tGone, { ...WIN, snow: 0, aerial: true, c: [0, 0, -50], cam: [[34, 46, 18], [28, 43, 8], [-4, 0, -56]], fov: 55, act(t, k) {
  T.lid.visible = false; T.lip.visible = true; T.setGone(clamp01((t - tGone - 0.2) / 2.0) * 1.0); snowman.visible = false;
  trucks.forEach((tr, i) => { tr.visible = true; tr.position.set(2.1, 0, -70 + (t - tGone) * 10 - i * 14); tr.rotation.y = 0; });
  folk.forEach((a, i) => { const x = i % 2 ? 6.2 : -6.2, z = -30 - i * 9 + (t - tGone) * 1.2; put(a, x, 0, z, 0); a.c.poseArms('walk', t + i * 0.2, 'holding-both', 0); boxes[i].visible = true; a.c.handR.updateWorldMatrix(true, false); boxes[i].position.copy(a.c.handR.getWorldPosition(new THREE.Vector3())).add(V3(0, -0.05, 0.25)); boxes[i].rotation.y = 0; });
} });
// 17 "And the fire?" today: empty streets, a few houses, the church on the hill, the ground still steaming
S(W('and', 35.4), { light: 'winterDusk', snow: 0.4, c: [0, 0, -70], cam: [[-1.0, 1.9, -40], [-0.8, 2.0, -44], [16, 8, -150]], fov: 54, act() { T.setGone(1); T.lid.visible = false; snowman.visible = false; parked.forEach((c) => (c.visible = false)); } });
// 18 "It's still burning right now." the fire under the town, closer, glowing
S(W("it's", 36.2), { light: 'underground', c: [1000, 0, 0], cam: [[1000, -8, 20], [1000, -11, 10], [1000, -12, 0]], fov: 55, act(t) {
  CUTAWAY.tops.forEach((p, i) => STEAM.vent(p, t + i * 0.3, { per: 6, h: 6, r0: 0.6, r1: 2.6, o: 0.5, speed: 0.4 }));
} });
SHOTS.sort((a, b) => a.t - b.t);

// ---------------------------------------------------------------- life: steam from vents and chimneys, snow
function life(t, s, i) {
  CUTAWAY.update(t);
  if (s.c[0] < 500) {
    const vents = s.aerial || i === 8 || i === 17 ? T.vents : T.vents.slice(0, 3);
    vents.forEach((v, j) => STEAM.vent(v, t + j * 0.21, { per: s.aerial ? 5 : 7, h: s.aerial ? 9 : 5, r0: s.aerial ? 1.2 : 0.6, r1: s.aerial ? 4 : 2.6, o: 0.5, speed: 0.3 }));
    if (s.aerial || i === 0 || i === 4) T.chimneys.filter((_, j) => j % 6 === 0).slice(0, 9).forEach((ch, j) => STEAM.vent(ch, t + j * 0.17, { per: 4, h: 4, r0: 0.4, r1: 1.6, o: 0.35, speed: 0.25, tint: 0xc8ccd4 }));
  }
  if (s.snow) SNOW.update(t, camera, s.snow);
  T.holeLight.intensity *= 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 5.3);
}

// ---------------------------------------------------------------- render
const LIGHTS = []; scene.traverse((o) => { if (o.isPointLight || o.isSpotLight) LIGHTS.push(o); });
function shotIndex(t) { let i = 0; SHOTS.forEach((x, j) => { if (t >= x.t) i = j; }); return i; }
window.renderAt = (t) => {
  const i = shotIndex(t), s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END;
  const k = clamp01((t - s.t) / (t1 - s.t));
  hideAll(); STEAM.begin(); s.shake = 0;
  setLight(s.light, s.c || [0, 0, 0]);
  const [from, to, look, lookTo] = s.cam;
  camera.position.set(...from.map((v, j) => lerp(v, to[j], k)));
  camera.fov = s.fov || 55; camera.updateProjectionMatrix();
  const L = new THREE.Vector3(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  setShot(i);
  s.act(t, k, s);
  if (s.shake) { const o = shake(t, s.shake); camera.position.add(o); L.add(o.multiplyScalar(0.5)); }
  applyCamera(i, camera, L);
  life(t, s, i);
  STEAM.end();
  if (s.memory) { grade.uniforms.sat.value = 0.55; grade.uniforms.lift.value.set(0.06, 0.05, 0.04); }
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.HOUSE_RULES = { framing: true, close: [10, 11, 13] };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { get rotation() { return { x: a.seated ? 2 : 0 }; } } })) };
window.READY = true;
