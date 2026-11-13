// Episode 02 "Lie Balloons" (53 s). Deterministic: window.renderAt(t). House rules: no blur, 45-60 s, clip-checked.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { makeAvatar, pose, setFace, talkFace, walk, reset } from '../../kit/avatar.js';
import { buildTown, townHall, setLamps } from '../../kit/town.js';
import { suburb, backdrop } from '../../kit/world.js';
import { cluster, swarm, shreds } from '../../kit/balloons.js';
import * as P from '../../kit/props.js';
import { loadFixes, setShot, offsetActor, applyCamera } from '../../kit/autofix-runtime.js';
import * as Z from '../../kit/sets2.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'));
const { THREE, scene, camera, composer, grade, setLight } = C;
scene.add(camera);
buildTown(scene, { hall: false });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), P.std(0x9ed97c, { roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -60); ground.receiveShadow = true; scene.add(ground);

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.45;
await loadFixes(new URL('./autofix.json', import.meta.url));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const SIDE = 0.3;
const v3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- world
suburb(scene, { x0: 30, x1: 182, z0: -190, z1: 20, s: 5 });
suburb(scene, { x0: -182, x1: -30, z0: -190, z1: 20, s: 9 });
backdrop(scene, 0, -70, 340);
const HZ = -122;
const HALL = townHall(scene, HZ);
const hallClock = Z.clockFace(256); HALL.clock.material = new THREE.MeshStandardMaterial({ map: hallClock.tex, roughness: 0.6 }); HALL.clock.scale.setScalar(0.78); HALL.clock.position.y = 22.0; HALL.clock.position.z = 3.1;
P.box(4, 6.2, 0.1, P.std(0x1c1826, { roughness: 1 }), 0, 5.1, 5.02, HALL.g); P.box(4.8, 0.6, 0.4, P.std(0xf2c14e, { metalness: 0.5 }), 0, 8.4, 5.1, HALL.g);
const pit = P.box(34, 0.12, 15, P.std(0x8a6a4a, { roughness: 1 }), 0, 0.06, HZ - 1, scene);
// money bags + sign on the hall roof
const roofBags = [-9, -6.5, -4, 4, 6.5, 9].map((x, i) => { const b = P.moneyBag(HALL.g); b.position.set(x, 18.2, 4.6 - (i % 2) * 1.6); b.scale.setScalar(1.2); return b; });
const islandSign = P.sign(HALL.g, ['TROPICAL', 'ISLAND →'], 11, 20.4, 5.6, -0.2, 6, 3.2, { bg: '#ffd84d', fg: '#e8434f' });
// tall flagpole beside the steps
const POLE = [6.6, 0.3, -111];
P.cyl(0.22, 0.3, 30, P.std(0xdfe3ec, { metalness: 0.5, roughness: 0.3 }), POLE[0], POLE[1] + 15, POLE[2], scene, 12);
P.box(4, 2.4, 0.08, P.std(0x6fb6ff), POLE[0] + 2.1, 28.6, POLE[2], scene);
P.box(2.4, 0.5, 2.4, P.std(0xb8bfcc), POLE[0], 0.55, POLE[2], scene);
// interiors
const BR = P.bedroom(scene, 1000, 0);
const LR = P.livingRoom(scene, 1000, 100);
const table = P.group(scene, 1000, 0, 98.2);
P.box(5, 0.3, 2.6, P.std(0xc99566), 0, 2.6, 0, table, 0.08); [[-2.2, -1], [2.2, -1], [-2.2, 1], [2.2, 1]].forEach(([a, b]) => P.box(0.3, 2.5, 0.3, P.std(0x8a5a3c), a, 1.25, b, table));

// ---------------------------------------------------------------- cast
const actors = [];
function actor(name, opts) {
  const av = makeAvatar(opts);
  const wrap = new THREE.Group(), tilt = new THREE.Group();
  wrap.add(tilt); tilt.add(av.root); scene.add(wrap);
  const a = { name, av, wrap, tilt, ...av };
  actors.push(a);
  return a;
}
function put(a, x, y, z, yaw = 0) { a.wrap.visible = true; a.wrap.position.set(x, y, z); offsetActor(a.name, a.wrap.position); a.wrap.rotation.set(0, yaw, 0); a.tilt.rotation.set(0, 0, 0); reset(a.av); }
const ava = actor('ava', { shirt: 0x5fd3b0, pants: 0x6b7fd9, hair: 0x8a4a2a, hairStyle: 'ponytail', skin: 0xe8b48a });
const bro = actor('brother', { shirt: 0xff8f6b, pants: 0x3a4a7a, hair: 0x8a4a2a, hairStyle: 'messy', skin: 0xe8b48a, scale: 0.9 });
const mayor = actor('mayor', { shirt: 0x2b3a6a, pants: 0x22222e, hair: 0x9a9a9a, hairStyle: 'short', skin: 0xf2c9a0, hat: 'tophat', scale: 1.08 });
const kid = actor('kid', { shirt: 0xffd45c, pants: 0x3a4a7a, hairStyle: 'short', hair: 0x2a1a12, skin: 0xc98d62, scale: 0.75 });
const FOLK_LOOKS = [
  { shirt: 0xff8f6b, pants: 0x3a4a7a, hairStyle: 'short', hair: 0x2a1a12, skin: 0xc98d62 },
  { shirt: 0x8fd16b, pants: 0x5a4a3a, hairStyle: 'bun', hair: 0xd9a066, skin: 0xf2c9a0 },
  { shirt: 0x6fb6ff, pants: 0x2a2a3a, hairStyle: 'messy', hair: 0x111111, skin: 0x8a5a3c },
  { shirt: 0xffd45c, pants: 0x4a5a7a, hairStyle: 'ponytail', hair: 0x6b3a1a, skin: 0xf6c89a },
  { shirt: 0xb98cf0, pants: 0x3a3a5a, hairStyle: 'short', hair: 0x9a9a9a, skin: 0xe8b48a, glasses: true },
  { shirt: 0xf6cfd8, pants: 0x2f4a8a, hairStyle: 'messy', hair: 0xd9b25a, skin: 0xf6c89a },
  { shirt: 0x5fb0a6, pants: 0x4a3a2a, hairStyle: 'short', hair: 0x1a1210, skin: 0x8a5a3c },
  { shirt: 0xe8607d, pants: 0x2a2a3a, hairStyle: 'ponytail', hair: 0xd9a066, skin: 0xf2c9a0 },
];
const folk = FOLK_LOOKS.map((o, i) => actor('folk' + i, o));
// lie balloons per person
const CL = new Map();
CL.set(bro, cluster(scene, 12, { size: 0.75, spread: 1.6, height: 2.2, s: 2 }));
CL.set(mayor, cluster(scene, 40, { size: 0.95, spread: 2.2, height: 3.4, s: 4 }));
CL.set(kid, cluster(scene, 1, { size: 0.35, height: 1.6, s: 6 }));
CL.set(ava, cluster(scene, 1, { size: 0.28, height: 1.4, s: 7 }));
folk.forEach((a, i) => CL.set(a, cluster(scene, i === 0 ? 1 : 1 + ((i * 3) % 5), { size: i === 0 ? 3.2 : 0.7, spread: 1.1, height: i === 0 ? 4.5 : 2.4, s: 10 + i })));
const headTop = new THREE.Vector3();
function balloons(a, t, o = {}) { a.head.updateWorldMatrix(true, false); a.head.getWorldPosition(headTop); headTop.y += 0.9 * (a.av.root.scale.x || 1); CL.get(a).update(t, headTop, o); }

// swarm tied to the hall roof
const anchors = [];
for (let i = 0; i < 18; i++) { const x = -16 + i * 1.9; if (Math.abs(x) > 5.5) anchors.push(v3([x, 17.4, 6.2])); anchors.push(v3([x, 17.4, -8]), v3([x, 17.4, -1])); }
for (let i = 0; i < 8; i++) anchors.push(v3([-16, 17.4, -6 + i * 1.6]), v3([16, 17.4, -6 + i * 1.6]));
for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; anchors.push(v3([Math.sin(a) * 4.4, 25, -2 + Math.cos(a) * 4.4])); }
const SW = swarm(scene, anchors, { per: 4, size: 1.7, height: 8, s: 9 });
const SHR = shreds(scene);

// props
const props = [];
const keep = (o) => { props.push(o); return o; };
const homework = keep(P.sign(scene, ['HOMEWORK', 'DONE! ✔'], 0, 0, 0, 0, 1.8, 1.2, { bg: '#ffffff', fg: '#2b3a6a', border: '#5fb6ff' }));
const rock = keep(new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), P.std(0x8a8296))); scene.add(rock);
const vase = keep(P.cyl(0.35, 0.5, 1.2, P.std(0x5fb6ff), 0, 0, 0, scene, 16));
const sash = keep(P.box(0.5, 3.2, 0.12, P.std(0xe8434f), 0, 0, 0, scene));
const medal = keep(P.cyl(0.45, 0.45, 0.12, P.std(0xf2c14e, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, scene, 20));
const plate = keep(P.cyl(1.1, 1.1, 0.12, P.std(0xffffff), 0, 0, 0, scene, 24));
const burnt = keep(new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), P.std(0x1e1a22, { roughness: 1 }))); scene.add(burnt);
const smoke = [0, 1, 2, 3, 4].map(() => { const m = keep(new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), new THREE.MeshStandardMaterial({ color: 0x8a8a96, transparent: true, opacity: 0.55 }))); scene.add(m); return m; });
const rings = [0, 1, 2, 3].map(() => { const m = keep(new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }))); scene.add(m); return m; });
const CONF = 260;
const confetti = keep(new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), CONF));
['#ff4d6d', '#ffd84d', '#6fb6ff', '#8fdc6b', '#b98cf0'].forEach((c, k) => { for (let i = k; i < CONF; i += 5) confetti.setColorAt(i, new THREE.Color(c)); });
scene.add(confetti);
const dust = keep(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xe6d8c0, transparent: true, opacity: 0.7 }), 60)); scene.add(dust);

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.wrap.visible = false; a.wrap.position.set(0, -80, 0); }
  for (const c of CL.values()) c.hide();
  for (const p of props) p.visible = false;
  SW.hide(); SHR.mesh.visible = false;
  HALL.g.position.y = 0; HALL.g.rotation.set(0, 0, 0); pit.visible = false;
  roofBags.forEach((b) => (b.visible = false)); islandSign.visible = false;
  hallClock.set(11, 52);
  grade.uniforms.flash.value = 0; setLamps(0.6);
}
function hold(obj, hand, pos = [0, 0, 0], rot = [0, 0, 0]) {
  obj.visible = true; hand.updateWorldMatrix(true, false);
  obj.position.copy(hand.localToWorld(v3(pos)));
  obj.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
const place = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.visible = true; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };
const m4 = new THREE.Matrix4();
// story clock for the hall: tied, lifted height, popped
const tTie = W('tying', 22), tHundreds = W('hundreds', 24), tNoon = W('noon', 25.5), tLift = W('lifted', 26.5);
const tPop = W('pop', 41), tBurst = W('burst', 42.5), tCrash = W('crashed', 43.8);
function hallState(t) {
  const tied = clamp01((t - tTie + 0.3) / (tHundreds - tTie + 0.6));
  let y = 0;
  if (t > tLift - 0.3) y = 24 * smooth((t - tLift + 0.3) / 2.4) + Math.sin(t * 1.1) * 0.6;
  const pop = clamp01((t - tPop) / (tBurst - tPop + 0.5));
  if (t > tCrash) y = Math.max(0, 24 * (1 - ((t - tCrash) / 0.55) ** 2));
  return { tied, y, pop };
}
function hallFrame(t, showBags = true) {
  const s = hallState(t);
  HALL.g.position.y = s.y; HALL.g.rotation.z = s.y > 0.5 && t < tCrash ? Math.sin(t * 0.8) * 0.015 : 0;
  pit.visible = s.y > 0.3;
  if (s.tied > 0 && s.pop < 1) SW.update(t, HALL.g, { tied: s.tied, pop: s.pop });
  if (showBags && t > tTie) roofBags.forEach((b) => (b.visible = true));
  return s;
}
function popBursts(t) { // shreds for balloons popping in the last 1.2 s
  const out = [];
  for (let k = 0; k < 12; k++) {
    const t0 = t - k * 0.1, a = hallState(t0 - 0.1).pop, b = hallState(t0).pop;
    if (b > a) SW.popping(HALL.g, a, b).slice(0, 4).forEach((p) => out.push([p.x, p.y, p.z, t0]));
  }
  SHR.update(t, out.slice(0, 48));
}
function streetFolk(t, list = folk, n = 6) {
  [[-6.2, -20, 1], [6.2, -24, -1], [-6.6, -33, 1], [6.0, -6, -1], [-6.2, -48, 1], [6.2, -40, -1]].slice(0, n).forEach(([x, z, d], i) => {
    const a = list[i]; put(a, x, SIDE, z + ((t * 1.6 + i * 3) % 8) * d, d > 0 ? Math.PI : 0); walk(a.av, t + i * 0.3, 1.2, 0.4); setFace(a, 'smile');
    balloons(a, t);
  });
}
function confettiAt(c, u) {
  confetti.visible = true;
  for (let i = 0; i < CONF; i++) {
    const a = i * 2.399, r = 2 + (i % 13) * 1.0;
    m4.makeRotationFromEuler(new THREE.Euler(u * 3 + i, u * 2 + i * 0.5, 0));
    m4.setPosition(c[0] + Math.sin(a) * r, c[1] - ((u * 4 + (i % 17)) % 14), c[2] + Math.cos(a) * r * 0.6);
    confetti.setMatrixAt(i, m4);
  }
  confetti.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------- shots
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const DAY = { light: 'day' };
const ST = HZ + 8; // front edge of the hall steps (z = -114)

// 0 "In this town," aerial: everyone walks around with balloons over their heads
S(0, { ...DAY, cam: [[0, 34, 30], [0, 30, 18], [0, 8, -100]], fov: 50, act(t) { streetFolk(t); } });
// 1 "every lie you tell floats above your head as a balloon" - a man fibs, a balloon inflates
const tFloats = W('floats', 1.5);
S(W('every', 0.6), { ...DAY, c: [7, 0, -9], cam: [[1.6, 4.4, -1.4], [2.1, 4.6, -2.4], [6.6, 5.8, -9.5]], fov: 46, act(t) {
  const a = folk[4]; put(a, 6.6, SIDE, -9.5, -0.6); pose(a, 'offer'); talkFace(a, WORDS, t, 'talk', 'smile');
  balloons(a, t, { inflate: smooth((t - tFloats + 0.2) / 0.5) });
  put(folk[5], 5.4, SIDE, -13, 0.4); setFace(folk[5], 'deadpan'); balloons(folk[5], t);
} });
// 2 "You see, small lies make small balloons" - kid with cookie crumbs, a tiny balloon pops up
const tSmall = W('small', 4.4);
S(W('you', 3.6), { ...DAY, c: [-6, 0, -4], cam: [[-2.4, 3.4, 3.2], [-2.8, 3.3, 2.4], [-6.4, 3.0, -3.5]], fov: 44, act(t) {
  put(kid, -6.4, SIDE, -3.5, 0.55); pose(kid, 'shy'); talkFace(kid, WORDS, t, 'talk', 'blush');
  place(vase, -7.6, SIDE + 0.5, -1.6, 0, 0, Math.PI / 2);
  balloons(kid, t, { inflate: smooth((t - tSmall) / 0.4) });
} });
// 3 "and big lies make giant ones." - one huge balloon lifts a man onto his tiptoes
const tGiant = W('giant', 7);
S(W('and', 6), { ...DAY, c: [-7, 0, -18], cam: [[-1.6, 2.2, -7], [-2.0, 2.6, -8.4], [-7, 7.5, -18]], fov: 56, act(t) {
  const a = folk[0], k = smooth((t - tGiant + 0.3) / 0.6);
  put(a, -7, SIDE + 0.5 * k + Math.sin(t * 3) * 0.08 * k, -18, 0.5); pose(a, 'idle', 'flinch', 0.25 * k); talkFace(a, WORDS, t, 'talk', k > 0.5 ? 'scared' : 'smile');
  balloons(a, t, { inflate: 0.25 + 0.75 * k });
} });
// 4 "My name is Ava," - waves, nothing over her head
S(W('my', 8.2), { ...DAY, c: [7, 0, 4], cam: [[0.6, 4.4, 8.2], [1.2, 4.3, 7.2], [6.8, 4.0, 1.2]], fov: 40, act(t) {
  put(ava, 6.8, SIDE, 1.2, -0.75); pose(ava, 'wave'); ava.armR.rotation.z = 2.3 + 0.3 * Math.sin(t * 10); talkFace(ava, WORDS, t, 'happy_talk', 'smile');
} });
// 5 "and I've never told a single lie." - proud close-up
S(W('and', 9.2), { ...DAY, c: [7, 0, 4], cam: [[3.6, 5.6, 6.2], [4.0, 5.4, 5.4], [6.6, 4.6, 1.4]], fov: 38, act(t) {
  put(ava, 6.8, SIDE, 1.2, -0.6); pose(ava, 'crossArms'); talkFace(ava, WORDS, t, 'happy_talk', 'proud');
} });
// 6 "So I'm the only person in town with nothing over my head." - crowd, every head has balloons but hers
S(W('so', 11), { ...DAY, c: [0, 0, -20], cam: [[0, 9, -2], [0, 10, -4.5], [0, 3, -22]], fov: 50, act(t) {
  [[-4, -18], [-1.5, -21], [1.8, -19], [4.4, -22], [-3, -25], [3, -26], [0.2, -27.5], [-5.5, -23]].forEach(([x, z], i) => {
    const a = folk[i]; put(a, x, 0, z, Math.sin(i) * 0.3); pose(a, 'idle'); setFace(a, 'smile'); balloons(a, t, { inflate: i === 0 ? 0.35 : 1 });
  });
  put(ava, 0.2, 0, -16.5, 0.1); pose(ava, 'idle'); ava.headPivot.rotation.x = -0.35; setFace(ava, 'smile');
} });
// 7 "My brother has 12 balloons just from homework." - bedroom, balloons squashed on the ceiling
S(W('my', 13.8), { light: 'indoor', c: [1000, 0, 0], cam: [[1001.2, 4.4, 7.5], [1001.0, 4.6, 6.3], [1000, 5.2, -1]], fov: 54, act(t) {
  put(bro, 1000.4, 0, -1.2, 0); pose(bro, 'offer'); talkFace(bro, WORDS, t, 'talk', 'smile');
  hold(homework, bro.body, [0, 1.2, 1.1], [0, 0, 0]); bro.armL.rotation.set(-1.2, 0, 0.3); bro.armR.rotation.set(-1.2, 0, -0.3);
  balloons(bro, t, { squash: 1.2 });
} });
// 8 "The mayor has so many," - walking down the street under a mountain of balloons
S(W('the', 16.2), { ...DAY, c: [6, 0, -30], cam: [[3, 1.6, -18], [3.4, 2.0, -20], [7, 9, -32]], fov: 58, act(t) {
  put(mayor, 7.2, SIDE, -32 + (t - 16.3) * 1.2, 0); walk(mayor.av, t, 1.1, 0.4); setFace(mayor, 'smug'); balloons(mayor, t);
} });
// 9 "he has to turn sideways to get through doors." - squeezing into the town hall
const tSide = W('sideways', 17.9);
S(W('he', 17.4), { ...DAY, c: [0, 0, HZ], cam: [[9, 7.5, ST + 17], [8, 7.6, ST + 15.5], [0, 8.5, HZ + 5]], fov: 52, act(t) {
  const k = smooth((t - tSide) / 0.4);
  put(mayor, lerp(1.6, 0, k), 2, HZ + 6.9 - 0.8 * smooth((t - tSide - 0.6) / 0.8), -Math.PI / 2 * k); pose(mayor, 'idle', 'armsOut', 0.2 * (1 - k)); setFace(mayor, 'smug');
  balloons(mayor, t, { squash: 1 - 0.55 * k, sway: 0.4 });
} });
// 10 "That's when I noticed something strange." - Ava on the sidewalk, suspicious
S(W("that's", 19.6), { ...DAY, c: [7, 0, -60], cam: [[2.4, 4.6, -51.5], [2.9, 4.5, -52.5], [7, 4.2, -58]], fov: 38, act(t) {
  put(ava, 7.2, SIDE, -58, -0.7); pose(ava, 'idle'); ava.headPivot.rotation.y = 0.5; talkFace(ava, WORDS, t, 'determined_talk', 'determined');
} });
// 11 "The mayor was tying all his balloons to the town hall," - on the roof, tying strings
S(W('the', 21.7), { ...DAY, c: [0, 0, HZ], cam: [[-11, 22, ST + 12], [-9.5, 21.5, ST + 10.5], [2, 18.5, HZ + 5]], fov: 50, act(t) {
  hallFrame(t);
  put(mayor, 2.5, 17.4, HZ + 5.2, 0.4); pose(mayor, 'carry'); mayor.armR.rotation.x = -1.3 + Math.sin(t * 9) * 0.3; setFace(mayor, 'smug');
  balloons(mayor, t, { inflate: 1 - clamp01((t - tTie) / 2.6) });
} });
// 12 "hundreds of them." - wide: the hall under a cloud of balloons
S(W('hundreds', 24.5), { ...DAY, c: [0, 0, HZ], cam: [[2, 30, -64], [1.5, 29, -70], [0, 26, HZ]], fov: 56, act(t) { hallFrame(t); } });
// 13 "At noon," - the hall clock strikes twelve
S(W('at', 25.2), { ...DAY, c: [0, 0, HZ], cam: [[0, 22.6, -102], [0, 22.4, -106], [0, 22, HZ + 3]], fov: 28, act(t) { hallFrame(t); hallClock.set(t < tNoon + 0.15 ? 11 : 12, t < tNoon + 0.15 ? 59 : 0); } });
// 14 "the whole building lifted off the ground" - low and wide from the street
S(W('the', 26.3), { ...DAY, c: [0, 0, HZ], cam: [[3, 1.6, -82], [3, 2.6, -86], [0, 14, HZ], [0, 26, HZ]], fov: 60, act(t) {
  hallClock.set(12, 1); const s = hallFrame(t);
  dust.visible = true;
  for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, u = clamp01((t - tLift + 0.2) / 2.2), r = 17 + u * 10; m4.makeScale(1.5 + u * 2, 1.2 + u, 1.5 + u * 2); m4.setPosition(Math.sin(a) * r, 0.8 + u * 1.5, HZ - 1 + Math.cos(a) * r * 0.55); dust.setMatrixAt(i, m4); }
  dust.instanceMatrix.needsUpdate = true; dust.material.opacity = 0.75 * (1 - clamp01((t - tLift - 1.2) / 1.5)) * (t > tLift - 0.2 ? 1 : 0);
} });
// 15 "with all the town's money inside," - mayor on the roof edge with the money bags
S(W('with', 28), { ...DAY, c: [0, 24, HZ], cam: [[-8, 36, ST + 17], [-7, 36.5, ST + 15.5], [0.5, 44.5, HZ + 5]], fov: 46, act(t) {
  hallClock.set(12, 2); const s = hallFrame(t);
  put(mayor, 0.5, s.y + 17.4, HZ + 5.4, -0.3); pose(mayor, 'cheer'); setFace(mayor, 'happy_talk');
  hold(roofBags[2], mayor.handL, [0, -0.9, 0], [0, 0, 0]);
} });
// 16 "heading for a tropical island." - shades on, island sign, the hall drifting over the suburbs
S(W('heading', 29.9), { ...DAY, c: [0, 24, HZ], cam: [[30, 52, -70], [27, 51, -74], [0, 38, HZ]], fov: 46, act(t) {
  const s = hallFrame(t); islandSign.visible = true;
  put(mayor, 0.5, s.y + 17.4, HZ + 5.4, 0.4); pose(mayor, 'wave'); mayor.armR.rotation.z = 2.3 + 0.3 * Math.sin(t * 9); setFace(mayor, 'cool');
} });
// 17 "Nobody could stop him," - people on the street look up, helpless
S(W('nobody', 31.6), { ...DAY, c: [0, 0, -100], cam: [[1.5, 3.4, -83], [1.5, 3.2, -85], [0, 32, HZ]], fov: 64, act(t) {
  hallFrame(t);
  [[-6, -101], [-1.5, -96.5], [3.4, -99], [6.4, -103.5], [-3.6, -105], [1.6, -104.5]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, 0, z, Math.PI + Math.sin(i) * 0.4); pose(a, i % 2 ? 'cheer' : 'point'); a.headPivot.rotation.x = -0.5; setFace(a, 'shock'); balloons(a, t); });
} });
// 18 "because nobody can pop a lie," - a thrown rock bounces off a balloon
const tRock = W('pop', 33.4);
S(W('because', 32.6), { ...DAY, c: [0, 24, HZ], cam: [[11, 39, ST + 10], [10.4, 39.5, ST + 9], [2, 44, HZ + 8]], fov: 44, act(t) {
  const s = hallFrame(t);
  const u = t - tRock + 0.5, hit = [2, s.y + 21.5, HZ + 8.5];
  if (u > 0 && u < 0.5) place(rock, lerp(6, hit[0], u / 0.5), lerp(s.y + 15, hit[1], u / 0.5), lerp(ST + 4, hit[2], u / 0.5), u * 9, u * 7, 0);
  else if (u >= 0.5 && u < 1.6) { const w = u - 0.5; place(rock, hit[0] + w * 4, hit[1] + w * 2 - 7 * w * w, hit[2] + w * 3, u * 9, 0, 0); }
} });
// 19 "except the truth." - Ava, determined
S(W('except', 34.6), { ...DAY, c: [8, 0, -104], cam: [[5.0, 4.9, -99.6], [5.4, 4.8, -100.4], [8.2, 4.6, -104.6]], fov: 38, act(t) {
  hallFrame(t); put(ava, 8.2, SIDE, -104.6, -0.55); pose(ava, 'idle'); ava.headPivot.rotation.x = -0.25; talkFace(ava, WORDS, t, 'determined_talk', 'determined');
} });
// 20 "So I climbed the flagpole" - hand over hand, the floating hall behind
const tClimb = W('so', 36);
const climbY = (t) => lerp(1.2, 21.5, smooth((t - tClimb) / (W('yelled', 37.3) - tClimb + 0.2)));
S(tClimb, { ...DAY, c: [POLE[0], 10, POLE[2]], cam: [[1.5, 4, POLE[2] + 12], [1.5, 14, POLE[2] + 12], [POLE[0], 4, POLE[2]], [POLE[0], 20, POLE[2]]], fov: 52, act(t) {
  hallFrame(t);
  put(ava, POLE[0], climbY(t), POLE[2] + 0.75, Math.PI); pose(ava, 'climb'); const sw = Math.sin(t * 10); ava.armL.rotation.x = -2.9 + sw * 0.35; ava.armR.rotation.x = -2.9 - sw * 0.35; ava.legL.rotation.x = -0.8 + sw * 0.5; ava.legR.rotation.x = -0.8 - sw * 0.5; setFace(ava, 'determined');
} });
// 21 "and yelled the loudest truth in town." - at the top, hands cupped
const POLE_TOP = 21.6;
S(W('and', 37.2), { ...DAY, c: [POLE[0], 20, POLE[2]], cam: [[POLE[0] + 3.2, POLE_TOP + 6.6, POLE[2] + 10], [POLE[0] + 2.8, POLE_TOP + 6.4, POLE[2] + 8.8], [POLE[0] - 1, POLE_TOP + 7, POLE[2] - 6]], fov: 56, act(t) {
  hallFrame(t); avaTop(t, 'yell'); setFace(ava, 'determined_talk');
} });
function avaTop(t, p) { put(ava, POLE[0] + 0.95, POLE_TOP, POLE[2] + 0.2, Math.PI + 0.35); pose(ava, p); ava.legL.rotation.set(-0.5, 0, -0.3); ava.legR.rotation.set(-0.2, 0, 0.3); }
// 22 "The mayor is a thief!" - extreme close, shout rings fly toward the hall
const tThief = W('the', 39.4);
S(tThief, { ...DAY, c: [POLE[0], 20, POLE[2]], cam: [[POLE[0] + 3.9, POLE_TOP + 5.4, POLE[2] - 1.8], [POLE[0] + 3.6, POLE_TOP + 5.3, POLE[2] - 1.5], [POLE[0] + 0.9, POLE_TOP + 4.8, POLE[2] + 0.2]], fov: 46, act(t) {
  hallFrame(t); avaTop(t, 'yell'); ava.wrap.rotation.y = Math.PI - 0.6; setFace(ava, 'yell');
  rings.forEach((r, i) => { const u = ((t - tThief) * 1.3 - i * 0.25); if (u < 0 || u > 1) return; r.visible = true; r.position.set(POLE[0] + 0.4 - u * 8, POLE_TOP + 4.8 + u * 4, POLE[2] - 0.8 - u * 9); r.scale.setScalar(0.6 + u * 3); r.lookAt(POLE[0] - 10, POLE_TOP + 9, POLE[2] - 10); r.material.opacity = 0.8 * (1 - u); });
} });
// 23 "Pop, pop, pop!" - balloons burst
S(tPop, { ...DAY, c: [0, 24, HZ], cam: [[6, 42, ST + 8], [5.4, 42.4, ST + 7], [0, 46, HZ + 4]], fov: 52, act(t) { hallFrame(t); popBursts(t); } });
// 24 "Every balloon burst," - wide, the mayor's face
S(W('every', 42), { ...DAY, c: [0, 24, HZ], cam: [[-4.5, 45.5, ST + 10], [-3.9, 45.2, ST + 9], [0.5, 44, HZ + 5.4]], fov: 44, act(t) {
  const s = hallFrame(t); popBursts(t);
  put(mayor, 0.5, s.y + 17.4, HZ + 5.4, 0.3); pose(mayor, 'flinch'); setFace(mayor, 'shock');
} });
// 25 "and the town hall crashed right back where it belonged." - drops onto its foundation
S(W('and', 43.4), { ...DAY, c: [0, 0, HZ], cam: [[3, 6, -82], [2.6, 5.5, -84], [0, 12, HZ]], fov: 60, act(t) {
  const s = hallFrame(t); hallClock.set(12, 18);
  const u = t - tCrash - 0.55;
  grade.uniforms.flash.value = u > 0 && u < 0.2 ? 0.5 * (1 - u / 0.2) : 0;
  if (u > 0) { dust.visible = true; for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, w = clamp01(u / 1.6), r = 17 + w * 14; m4.makeScale(2 + w * 3, 1.5 + w * 1.5, 2 + w * 3); m4.setPosition(Math.sin(a) * r, 1 + w * 2, HZ - 1 + Math.cos(a) * r * 0.55); dust.setMatrixAt(i, m4); } dust.instanceMatrix.needsUpdate = true; dust.material.opacity = 0.8 * (1 - clamp01(u / 1.8)); }
  if (u > 0) camera.position.y += Math.sin(t * 60) * 0.15 * Math.max(0, 1 - u / 0.6);
} });
// 26 "Now, I'm the new mayor." - sash on, crowd cheering on the steps
const tNew = W('now', 46);
S(tNew, { ...DAY, c: [0, 0, HZ], cam: [[2.4, 11.5, ST + 15], [2.0, 11, ST + 13.6], [0, 5.5, ST - 1]], fov: 46, act(t) {
  put(ava, 0, 2, ST - 0.6, 0); pose(ava, 'cheer'); ava.av.body.position.y = 2 + Math.abs(Math.sin(t * 6)) * 0.3; talkFace(ava, WORDS, t, 'happy_talk', 'happy');
  hold(sash, ava.body, [0, 1, 0.56], [0, 0, 0.75]); hold(medal, ava.body, [0.35, 1.3, 0.62], [Math.PI / 2, 0, 0]);
  [[-3.8, ST + 2.6], [3.0, ST + 2.8], [-2.0, ST + 7.2], [2.6, ST + 7.4]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, SIDE, z, Math.PI + (x > 0 ? 0.3 : -0.3)); pose(a, 'cheer'); a.av.body.position.y = 2 + Math.abs(Math.sin(t * 7 + i)) * 0.4; setFace(a, 'happy'); });
  confettiAt([0, 15, ST + 2], t - tNew);
} });
// 27 "And for the first time ever, there's a tiny balloon over my head." - it pops into existence
const tTiny = W('tiny', 49);
S(W('and', 47.5), { ...DAY, c: [0, 0, HZ], cam: [[1.4, 5.6, ST + 6.2], [1.2, 5.8, ST + 5.6], [0, 7.6, ST - 0.6]], fov: 48, act(t) {
  put(ava, 0, 2, ST - 0.6, 0.15); pose(ava, 'idle'); hold(sash, ava.body, [0, 1, 0.56], [0, 0, 0.75]);
  const k = smooth((t - tTiny + 0.25) / 0.35);
  ava.headPivot.rotation.x = -0.35 * k; setFace(ava, k > 0.5 ? 'shock' : 'happy');
  if (k > 0) balloons(ava, t, { inflate: k });
} });
// 28 "Because I told my brother his cooking is amazing." - burnt dinner, forced smile
S(W('because', 50.6), { light: 'indoor', c: [1000, 0, 100], cam: [[1000.6, 7.2, 108.6], [1000.4, 7.0, 107.8], [1000.2, 4.2, 97.0]], fov: 54, act(t) {
  put(bro, 1002.3, 0, 96.0, 0.25); pose(bro, 'serve'); setFace(bro, 'proud');
  put(ava, 998.0, 0, 95.9, -0.15); pose(ava, 'idle'); ava.armR.rotation.set(-0.4, 0, -2.6); talkFace(ava, WORDS, t, 'happy_talk', 'forced');
  balloons(ava, t, { inflate: 1 }); balloons(bro, t, { squash: 1.1 });
  place(plate, 1000.6, 2.82, 98.0); place(burnt, 1000.6, 3.4, 98.0, 0.3, 0.6, 0);
  smoke.forEach((m, i) => { const u = ((t * 0.6 + i * 0.2) % 1); place(m, 1000.6 + Math.sin(i * 2 + t) * 0.3, 3.9 + u * 3, 98.0 + Math.cos(i) * 0.2); m.scale.setScalar(0.6 + u * 1.4); m.material.opacity = 0.55 * (1 - u); });
} });
SHOTS.sort((a, b) => a.t - b.t);

// ---------------------------------------------------------------- render
const LIGHTS = []; scene.traverse((o) => { if (o.isPointLight || o.isSpotLight) LIGHTS.push(o); });
function shotIndex(t) { let i = 0; SHOTS.forEach((x, j) => { if (t >= x.t) i = j; }); return i; }
window.renderAt = (t) => {
  const i = shotIndex(t), s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END;
  const k = clamp01((t - s.t) / (t1 - s.t));
  hideAll();
  setLight(s.light, s.c || [0, 0, 0], s.sun);
  const [from, to, look, lookTo] = s.cam;
  camera.position.set(...from.map((v, j) => lerp(v, to[j], k)));
  camera.fov = s.fov || 45; camera.updateProjectionMatrix();
  const L = new THREE.Vector3(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  setShot(i);
  s.act(t, k);
  applyCamera(i, camera, L);
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.QA = { scene, camera, THREE, actors: actors.map((a) => ({ name: a.name, wrap: a.wrap, head: a.head, legL: a.legL })) };
window.READY = true;
