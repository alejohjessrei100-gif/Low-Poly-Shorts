// Episode 04 "Pineapple Crime" (35 s). Neon night city. House rules: 30-45 s, debate-bait hook, Blender look,
// no blur, steady expressions, mostly wide shots, detailed set with ambient life, clip-checked + autofixed.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { makeAvatar, pose, setFace, walk, run, reset } from '../../kit/avatar.js';
import { buildNeon, pizzeria, slice, pineapple, setNeon } from '../../kit/neon.js';
import { smoke, birds, rings } from '../../kit/life.js';
import * as P from '../../kit/props.js';
import { loadFixes, setShot, offsetActor, applyCamera } from '../../kit/autofix-runtime.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
scene.add(camera);

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.45;
await loadFixes(new URL('./autofix.json', import.meta.url));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const v3 = (a) => new THREE.Vector3(...a);
const SW = 0.3; // sidewalk top

// ---------------------------------------------------------------- world + life
const N = buildNeon(scene);
const PZ = pizzeria(scene, 1000, 0);
const STEAM = smoke(scene, N.vents, 6);
// soft fill light riding with the camera, so characters read at night (like a film crew's key light)
const fill = new THREE.PointLight(0xfff0f6, 0, 70, 1.2); fill.position.set(0, 1, 0); camera.add(fill);
const BATS = birds(scene, [0, 60, -80], 10, 30);
const SHOUT = rings(scene, 4, 0xffd23e);
const cars = [P.policeCar(scene, 0, 0, 0), P.policeCar(scene, 0, 0, 0)];
// giant street screen on the right-hand tower
let scr = 'psa';
const screen = P.liveScreen(1024, 576, (c, w, h, t = 0) => {
  c.fillStyle = '#10081e'; c.fillRect(0, 0, w, h); c.textAlign = 'center';
  const pine = (x, y, s) => { c.fillStyle = '#f2b23e'; c.beginPath(); c.ellipse(x, y, 40 * s, 54 * s, 0, 0, 7); c.fill(); c.fillStyle = '#2f8f3a'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 9 * s, y - 50 * s); c.lineTo(x + k * 20 * s, y - 100 * s); c.lineTo(x + k * 9 * s + 8 * s, y - 50 * s); c.fill(); } };
  if (scr === 'psa' || scr === 'years') {
    pine(220, 330, 1.6); c.strokeStyle = '#ff2a3c'; c.lineWidth = 26; c.beginPath(); c.arc(220, 310, 130, 0, 7); c.moveTo(128, 218); c.lineTo(312, 402); c.stroke();
    c.fillStyle = '#ffd23e'; c.font = '800 70px Poppins'; c.fillText(scr === 'psa' ? 'PINEAPPLE' : '1 SLICE', 680, 200);
    c.fillText(scr === 'psa' ? 'ON PIZZA' : '=', 680, 290); c.fillStyle = '#ff3ea5'; c.font = '800 96px Poppins'; c.fillText(scr === 'psa' ? 'IS A CRIME' : '10 YEARS', 680, 410);
  } else if (scr === 'live') {
    c.fillStyle = '#2a1c3e'; c.fillRect(40, 40, w - 80, h - 80);
    c.fillStyle = '#c98d62'; c.fillRect(380, 150, 260, 230); c.fillStyle = '#1f2b55'; c.fillRect(370, 110, 280, 70); c.fillRect(330, 380, 360, 160);
    c.fillStyle = '#111'; c.fillRect(440, 230, 30, 30); c.fillRect(550, 230, 30, 30);
    c.fillStyle = '#ffc85a'; c.beginPath(); c.moveTo(520, 330 - Math.sin(t * 6) * 8); c.lineTo(700, 300); c.lineTo(690, 400); c.closePath(); c.fill(); c.fillStyle = '#ffe066'; c.fillRect(600, 330, 26, 22); c.fillRect(640, 350, 22, 20);
    c.fillStyle = '#ff2a3c'; c.beginPath(); c.arc(90, 90, 22, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '800 54px Poppins'; c.textAlign = 'left'; c.fillText('LIVE', 124, 110);
    c.textAlign = 'right'; c.fillText(`👁 ${Math.floor(1000000 + t * 900000).toLocaleString()}`, w - 70, 110);
  } else {
    c.fillStyle = '#3eff8b'; c.font = '800 120px Poppins'; c.fillText('LEGAL', w / 2, 300); c.fillStyle = '#ffd23e'; c.font = '800 64px Poppins'; c.fillText('PINEAPPLE PIZZA IS BACK', w / 2, 420); pine(150, 330, 1.2); pine(w - 150, 330, 1.2);
  }
});
const SCR = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.9), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
SCR.position.set(12.8, 11, -22); SCR.rotation.y = -Math.PI / 2; scene.add(SCR);
P.box(0.5, 8.5, 14.6, P.std(0x1c1c24), 13.1, 11, -22, scene);
// the chief's new shop sign (right side, further down)
const chiefSign = P.sign(scene, ["CHIEF'S", 'PINEAPPLE PIZZA'], 12.85, 6.4, -70, -Math.PI / 2, 9, 3, { bg: '#1a0f12', fg: '#ffd23e', border: '#3eff8b', glow: 1.6 });
chiefSign.visible = false;
const menuBoard = P.sign(scene, ['NEW MENU', 'PINEAPPLE  $5', 'EXTRA PINEAPPLE  $6'], 1005, 6.4, -7.7, 0, 6, 2.6, { bg: '#1b1b24', fg: '#ffd23e', sizes: [80, 60, 50] }); menuBoard.visible = false;

// ---------------------------------------------------------------- cast
const actors = [];
function actor(name, opts) {
  const av = makeAvatar(opts);
  const wrap = new THREE.Group(), tilt = new THREE.Group();
  wrap.add(tilt); tilt.add(av.root); scene.add(wrap);
  const a = { name, av, wrap, tilt, ...av };
  actors.push(a); return a;
}
function put(a, x, y, z, yaw = 0) { a.wrap.visible = true; a.wrap.position.set(x, y, z); offsetActor(a.name, a.wrap.position); a.wrap.rotation.set(0, yaw, 0); a.tilt.rotation.set(0, 0, 0); reset(a.av); }
const marco = actor('marco', { shirt: 0xffd23e, pants: 0x2a2a3a, hair: 0x2a1a12, hairStyle: 'messy', skin: 0xe8b48a, backpack: 0x3a2a4a });
const chief = actor('chief', { shirt: 0x1f2b55, pants: 0x1f2b55, hair: 0x9a9a9a, hairStyle: 'short', hat: 'police', skin: 0xc98d62, scale: 1.12 });
const chefChief = actor('chiefChef', { shirt: 0x1f2b55, pants: 0x1f2b55, hair: 0x9a9a9a, hairStyle: 'short', hat: 'police', skin: 0xc98d62, scale: 1.12, apron: 0xffffff });
const owner = actor('owner', { shirt: 0xffffff, pants: 0x3a3a5a, hair: 0x2a1a12, hairStyle: 'short', hat: 'chef', skin: 0xf2c9a0, apron: 0xe8434f });
const cops = [0, 1, 2].map((i) => actor('cop' + i, { shirt: 0x2a3f7a, pants: 0x1f2b55, hair: [0x3a2a1a, 0x111111, 0x6b3a1a][i], hairStyle: 'short', hat: 'police', skin: [0xf2c9a0, 0x8a5a3c, 0xe8b48a][i] }));
const LOOKS = [
  { shirt: 0xff3ea5, pants: 0x2a2a3a, hairStyle: 'ponytail', hair: 0x2a1a12, skin: 0xc98d62 },
  { shirt: 0x3ef0ff, pants: 0x3a3a5a, hairStyle: 'messy', hair: 0xd9a066, skin: 0xf2c9a0 },
  { shirt: 0x8b5cff, pants: 0x2a2a3a, hairStyle: 'short', hair: 0x111111, skin: 0x8a5a3c, glasses: true },
  { shirt: 0x3eff8b, pants: 0x4a3a2a, hairStyle: 'bun', hair: 0x6b3a1a, skin: 0xf6c89a },
  { shirt: 0xff6a3e, pants: 0x2a2a3a, hairStyle: 'short', hair: 0xd9b25a, skin: 0xe8b48a },
  { shirt: 0xffffff, pants: 0x2f4a8a, hairStyle: 'ponytail', hair: 0xd9a066, skin: 0x8a5a3c },
];
const folk = LOOKS.map((o, i) => actor('folk' + i, o));

// props
const props = [];
const keep = (o) => { props.push(o); return o; };
const slices = [0, 1, 2, 3, 4, 5].map(() => keep(slice(scene)));
const fruit = keep(pineapple(scene));
const chunk = keep(P.box(0.22, 0.14, 0.06, P.std(0xffe066), 0, 0, 0, scene));
const crates = [0, 1].map(() => { const g = keep(new THREE.Group()); scene.add(g); P.box(2.2, 1.0, 1.4, P.std(0x9a6a3a), 0, 0, 0, g); for (let k = 0; k < 3; k++) { const p = pineapple(g); p.position.set(-0.6 + k * 0.6, 0.9, 0); p.scale.setScalar(0.8); } return g; });
const booth = keep(new THREE.Group()); scene.add(booth); P.box(4.6, 1.2, 1.2, P.std(0xc8343f), 0, 0, 0, booth); P.box(4.6, 2.2, 0.5, P.std(0xc8343f), 0, 1.0, -0.4, booth);
let live = false;
const phoneScr = P.liveScreen(256, 448, (c, w, h) => { c.fillStyle = '#2a1c3e'; c.fillRect(0, 0, w, h); if (live) { c.fillStyle = '#ff2a3c'; c.beginPath(); c.arc(40, 40, 14, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '800 34px Poppins'; c.fillText('LIVE', 62, 52); c.fillStyle = '#c98d62'; c.fillRect(70, 150, 120, 110); c.fillStyle = '#1f2b55'; c.fillRect(64, 120, 132, 36); } });
const phone = keep(new THREE.Group()); scene.add(phone);
{ P.box(0.9, 1.6, 0.12, P.std(0x1b1b24), 0, 0, 0, phone, 0.08); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.45), new THREE.MeshBasicMaterial({ map: phoneScr.tex, toneMapped: false })); s.position.z = 0.07; phone.add(s); }
const CONF = 220;
const confetti = keep(new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), CONF));
['#ff3ea5', '#ffd23e', '#3ef0ff', '#3eff8b', '#8b5cff'].forEach((c, k) => { for (let i = k; i < CONF; i += 5) confetti.setColorAt(i, new THREE.Color(c)); });
scene.add(confetti);

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.wrap.visible = false; a.wrap.position.set(0, -80, 0); }
  for (const p of props) p.visible = false;
  cars.forEach((c) => { c.g.visible = false; c.flash(-1); });
  SHOUT.hide(); chiefSign.visible = false; menuBoard.visible = false;
  PZ.setFridge(0); setNeon(1); grade.uniforms.flash.value = 0;
}
function hold(obj, hand, pos = [0, 0, 0], rot = [0, 0, 0]) {
  obj.visible = true; hand.updateWorldMatrix(true, false);
  obj.position.copy(hand.localToWorld(v3(pos)));
  obj.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
const place = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.visible = true; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };
const car = (i, x, z, ry, t) => { const c = cars[i]; c.g.visible = true; c.g.position.set(x, 0, z); c.g.rotation.y = ry; c.flash(t); };
const m4 = new THREE.Matrix4();
function strollers(t, n = 4) {
  [[10.5, 1], [-10.6, -1], [11.6, -1], [-11.4, 1]].slice(0, n).forEach(([x, d], i) => {
    const a = folk[i + 2]; const z = 0 - ((t * 1.5 + i * 13) % 70);
    put(a, x, SW, d > 0 ? z : -70 - z, d > 0 ? Math.PI : 0); walk(a.av, t + i * 0.4, 1.2, 0.4); setFace(a, 'smile');
  });
}
function crowd(t, faceSlice = false, cheer = false) {
  [[5, -12], [1, -14], [6.4, -17.5], [2.2, -18.6], [-2.4, -12.5], [-1.6, -17]].forEach(([x, z], i) => {
    const a = folk[i]; put(a, x, 0, z, Math.atan2(12.8 - x, -22 - z) + (cheer ? 0 : 0));
    if (cheer) { pose(a, 'cheer'); a.av.body.position.y = 2 + Math.abs(Math.sin(t * 7 + i)) * 0.4; setFace(a, 'happy'); hold(slices[i % 6], a.handR, [0, -0.2, 0.4], [0.4, 0, 0]); }
    else { pose(a, i % 2 ? 'phone' : 'idle'); a.headPivot.rotation.x = -0.35; setFace(a, 'shock'); }
  });
}
function confettiAt(c, u) {
  confetti.visible = true;
  for (let i = 0; i < CONF; i++) { const a = i * 2.399, r = 2 + (i % 13) * 1.1; m4.makeRotationFromEuler(new THREE.Euler(u * 3 + i, u * 2 + i * 0.5, 0)); m4.setPosition(c[0] + Math.sin(a) * r, c[1] - ((u * 4 + (i % 17)) % 14), c[2] + Math.cos(a) * r * 0.6); confetti.setMatrixAt(i, m4); }
  confetti.instanceMatrix.needsUpdate = true;
}
const SHOP_DOOR = [-11.5, SW, -36];

// ---------------------------------------------------------------- shots
const SHOTS = [];
// far(): pull a shot's camera k times further from its look point (wider framing, house rule 9)
const far = (o, k) => { const [a, b, l, l2] = o.cam; const L = l2 || l; const f = (p) => p.map((v, j) => L[j] + (v - L[j]) * k); return { ...o, cam: [f(a), f(b), l, l2].filter(Boolean) }; };
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const NE = { light: 'neon' }, IN = { light: 'indoor' };

// 0 "In this city," aerial down the neon street
S(0, { ...NE, c: [0, 0, -40], cam: [[0, 42, 40], [0, 36, 24], [0, 8, -110]], fov: 55, act(t) { scr = 'psa'; screen.draw(t); strollers(t); } });
// 1 "putting pineapple on pizza is a crime." the giant street screen
S(W('putting', 0.8), { ...NE, c: [0, 0, -20], cam: [[-5, 4, 10], [-4.6, 4.6, 6], [12.8, 10, -22]], fov: 55, act(t) { scr = 'psa'; screen.draw(t); strollers(t); } });
// 2 "You see, one slice gets you ten years in pizza jail." cops push a slice-eater into a car
const tYears = W('10', 4.4);
S(W('you', 3.1), { ...NE, c: [0, 0, -28], cam: [[-6, 6, -6], [-5.4, 6, -8.4], [6, 6, -28]], fov: 55, act(t) {
  scr = t > tYears - 0.4 ? 'years' : 'psa'; screen.draw(t); car(0, 3.6, -30, 0.25, t);
  put(folk[1], 6.6, 0, -28.5, -1.3); pose(folk[1], 'flinch'); setFace(folk[1], 'scared'); hold(slices[0], folk[1].handR, [0, -0.3, 0.3], [0.4, 0, 0]);
  [[8.4, -27.4, -1.9], [8.1, -30.2, -1.0]].forEach(([x, z, r], i) => { put(cops[i], x, SW, z, r); pose(cops[i], 'carry'); setFace(cops[i], 'angry'); });
} });
// 3 "My name is Marco, and I'm a criminal."
S(W('my', 6.4), { ...NE, c: [-9, 0, -22], cam: [[2, 5, -12], [1.4, 4.9, -13.6], [-9.5, 3.8, -22]], fov: 52, act(t) { strollers(t, 2); put(marco, -9.5, SW, -22, 0.9); pose(marco, 'crossArms'); setFace(marco, 'smug'); } });
// 4 "Every night, I sneak into the last pizza shop that still serves it," crouching to the Slice Palace door
const tSneak = W('every', 8.5);
S(tSneak, { ...NE, c: [-9, 0, -32], cam: [[7, 9.5, -6], [6.4, 9.5, -9], [-10, 3, -33]], fov: 55, act(t) {
  const u = clamp01((t - tSneak) / 3); put(marco, lerp(-9.6, -11.2, u), SW, lerp(-22, -34.5, u), Math.PI + 0.1); walk(marco.av, t, 1.6, 0.4); marco.av.body.position.y -= 0.5; marco.av.body.rotation.x = 0.3; setFace(marco, 'determined');
  strollers(t, 2);
} });
// 5 "through a secret door behind the fridge." the fridge swings open onto the pineapple room
const tFridge = W('secret', 12);
S(W('through', 11.5), { ...IN, c: [1000, 0, 0], cam: [[1008, 6, 9], [1007, 5.8, 7.6], [1001, 3.2, -6]], fov: 55, act(t) {
  const k = smooth((t - tFridge + 0.2) / 0.6); PZ.setFridge(k);
  put(owner, 997, 0, -5.4, 0.2); pose(owner, 'idle'); setFace(owner, 'happy');
  put(marco, 1001.6, 0, lerp(-1.5, -6.2, clamp01((t - tFridge - 0.3) / 1.2)), Math.PI); walk(marco.av, t, 1.4, 0.4); setFace(marco, 'happy');
} });
// 6 "Then the pizza police raided it." cars skid in, lights flashing
const tRaid = W('then', 13.8);
S(tRaid, far({ ...NE, c: [-6, 0, -40], cam: [[9, 7, -14], [8, 7, -16.5], [-9, 3, -40]], fov: 55, act(t) {
  const u = clamp01((t - tRaid) / 0.9); car(0, -3.5, lerp(0, -42, smooth(u)), 0.35 * u, t); car(1, 3.2, lerp(10, -48, smooth(u)), -0.45 * u, t);
  cops.forEach((c, i) => { const v = clamp01((t - tRaid - 0.9) / 1.0); put(c, lerp(-2, -10.5, v) + i * 0.4, v > 0.8 ? SW : 0, -40 + i * 2.6, -Math.PI / 2); run(c.av, t + i); setFace(c, 'angry'); });
} }, 1.5));
// 7 "They took the owner," marched to the car
const tOwner = W('they', 15.6);
S(tOwner, far({ ...NE, c: [-6, 0, -40], cam: [[7, 6, -26], [6.4, 6, -28], [-6, 3, -42]], fov: 55, act(t) {
  car(0, -3.5, -42, 0.35, t); car(1, 3.2, -48, -0.45, t);
  const u = clamp01((t - tOwner) / 1.0), x = lerp(-10.8, -8.6, u);
  put(owner, x, u < 0.5 ? SW : 0, -39.5, Math.PI / 2); walk(owner.av, t, 1.2, 0.4); setFace(owner, 'scared');
  put(cops[0], x, u < 0.5 ? SW : 0, -37.6, Math.PI / 2); pose(cops[0], 'carry'); setFace(cops[0], 'angry');
  put(cops[1], x, u < 0.5 ? SW : 0, -41.4, Math.PI / 2); pose(cops[1], 'carry'); setFace(cops[1], 'angry');
} }, 1.5));
// 8 "the pineapples," crates carried out
const tPines = W('pineapples', 16.6);
S(W('the', 16.6), far({ ...NE, c: [-6, 0, -40], cam: [[8, 5, -30], [7.4, 5, -32], [-8, 2.5, -38]], fov: 55, act(t) {
  car(0, -3.5, -42, 0.35, t);
  [0, 1].forEach((i) => { const u = clamp01((t - tPines + 0.2 - i * 0.3) / 1.2), x = lerp(-11, -6.5, u); put(cops[i], x, u < 0.4 ? SW : 0, -36 - i * 3, Math.PI / 2); walk(cops[i].av, t + i, 1.2, 0.3); cops[i].armL.rotation.x = cops[i].armR.rotation.x = -1.3; setFace(cops[i], 'deadpan'); hold(crates[i], cops[i].body, [0, 1.3, 1.7], [0, 0, 0]); });
} }, 1.5));
// 9 "and my favorite booth." two cops carry the red booth out; Marco across the street, heartbroken
S(W('and', 17.4), far({ ...NE, c: [-6, 0, -40], cam: [[3, 6, -22], [2.6, 6, -24], [-7, 2.6, -40]], fov: 55, act(t) {
  car(0, -3.5, -42, 0.35, t);
  const u = clamp01((t - 17.5) / 1.4), x = lerp(-11, -6.5, u);
  put(cops[0], x, u < 0.4 ? SW : 0, -36.6, Math.PI / 2); put(cops[1], x, u < 0.4 ? SW : 0, -41.2, Math.PI / 2);
  [0, 1].forEach((i) => { walk(cops[i].av, t + i, 1.1, 0.3); cops[i].armL.rotation.x = cops[i].armR.rotation.x = -1.2; setFace(cops[i], 'deadpan'); });
  place(booth, x + 1.2, 2.2, -38.9, 0, Math.PI / 2, 0);
} }, 1.5));
// 10 "That's when I noticed something strange." Marco peeks from behind a police car; the chief by the shop
S(W("that's", 18.9), far({ ...NE, c: [0, 0, -45], cam: [[10, 6, -63], [9.6, 6, -61.5], [-2, 3, -45]], fov: 55, act(t) {
  car(1, 3.2, -48, -0.45, t); put(marco, 6.4, 0, -52.8, -0.6); pose(marco, 'crouch'); setFace(marco, 'determined');
  put(chief, -7, SW, -43, 1.9); pose(chief, 'crossArms'); setFace(chief, 'smug');
} }, 1.5));
// 11 "The police chief had pineapple stuck in his teeth." close-up (1 of 2) - vine boom
S(W('the', 20.9), { ...NE, c: [-7, 0, -43], cam: [[-2.6, 6.1, -43.6], [-2.9, 6.0, -43.5], [-7, 5.7, -43]], fov: 48, act(t) {
  put(chief, -7, SW, -43, Math.PI / 2 - 0.1); pose(chief, 'crossArms'); setFace(chief, 'smug');
  hold(chunk, chief.headPivot, [0.18, 0.42, 0.66], [0, 0, 0.2]);
} });
// 12 "He'd been eating it all along." sneaking a pineapple behind the car while the cops look away
S(W("he'd", 23.2), far({ ...NE, c: [-4, 0, -48], cam: [[8, 6, -34], [7.4, 6, -35.6], [-3.5, 3.2, -49]], fov: 55, act(t) {
  car(0, -3.5, -42, 0.35, t);
  put(chief, -3.8, 0, -49.5, 0.7); pose(chief, 'phone'); setFace(chief, 'happy'); hold(fruit, chief.handR, [0, -0.2, 0.3], [0, 0, 0]);
  [[-9.5, -37.5, -2.2], [-9.2, -41, -2.4]].forEach(([x, z, r], i) => { put(cops[i], x, SW, z, r); pose(cops[i], 'crossArms'); setFace(cops[i], 'deadpan'); });
} }, 1.5));
// 13 "So I grabbed my phone and went live." close-up (2 of 2)
const tLive = W('live', 26);
S(W('so', 24.9), { ...NE, c: [5, 0, -50], cam: [[13, 6.4, -57.4], [12.6, 6.3, -56.9], [3.9, 4.4, -50.4]], fov: 50, act(t) {
  live = t > tLive - 0.2; phoneScr.draw(); car(1, 3.2, -48, -0.45, t);
  put(marco, 6.8, 0, -52.4, -1.75); pose(marco, 'phone'); marco.armR.rotation.set(-1.9, 0.4, 0.2); setFace(marco, 'determined');
  hold(phone, marco.handR, [0, -0.2, 0.4], [-0.2, Math.PI, 0]);
} });
// 14 "The whole city watched him eat a full slice." the giant screen goes live, the street stares
S(W('the', 26.9), far({ ...NE, c: [4, 0, -18], cam: [[-6, 5, -2], [-5.2, 5.6, -5], [8, 9, -22]], fov: 56, act(t) { scr = 'live'; screen.draw(t); crowd(t); } }, 1.9));
// 15 "...a full slice." the chief caught mid-bite under the flashing lights
S(W('a', 28.2), far({ ...NE, c: [-5, 0, -45], cam: [[4, 5.4, -36], [3.4, 5.4, -37.2], [-4.6, 4.4, -46]], fov: 55, act(t) {
  car(0, -3.5, -42, 0.35, t); put(chief, -4.6, 0, -46.5, 0.6); pose(chief, 'phone'); setFace(chief, 'shock'); hold(slices[5], chief.handR, [0, -0.1, 0.5], [0.3, 0, 1.0]);
  [[-10, -38, -1.6], [-9.6, -42, -1.2]].forEach(([x, z, r], i) => { put(cops[i], x, SW, z, r); pose(cops[i], 'flinch'); setFace(cops[i], 'shock'); });
} }, 1.9));
// 16 "Now, pineapple pizza is legal again," the screen says LEGAL; the street celebrates with slices
const tLegal = W('now', 29.4);
S(tLegal, far({ ...NE, c: [4, 0, -18], cam: [[-5, 6, 0], [-4.4, 6.4, -3], [7, 8, -21]], fov: 56, act(t) { scr = 'legal'; screen.draw(t); crowd(t, true, true); confettiAt([6, 14, -16], t - tLegal); } }, 1.9));
// 17 "and the police chief opened his own pizza shop." his new neon sign
S(W('and', 32), far({ ...NE, c: [8, 0, -70], cam: [[-4, 6, -54], [-3.4, 6, -56.4], [11.5, 5, -70]], fov: 55, act(t) {
  chiefSign.visible = true; put(chefChief, 10.4, SW, -70, -Math.PI / 2 + 0.3); pose(chefChief, 'wave'); chefChief.armR.rotation.z = 2.3 + 0.3 * Math.sin(t * 9); setFace(chefChief, 'happy');
  strollers(t, 3);
} }, 1.5));
// 18 "I'm his best customer." Marco back in his favorite booth, the chief serving pineapple pizza
S(W("i'm", 34), { ...IN, c: [1000, 0, 0], cam: [[1000.6, 6.6, 9], [1000.8, 6.4, 8], [1005, 3, -1]], fov: 55, act(t) {
  menuBoard.visible = true;
  put(marco, 1005, 0.3, 0.6, Math.PI); pose(marco, 'sit'); setFace(marco, 'happy'); hold(slices[1], marco.handR, [0, -0.2, 0.4], [0.5, 0, 0]);
  put(chefChief, 1001.4, 0, -1.4, Math.PI / 2); pose(chefChief, 'serve'); setFace(chefChief, 'happy'); place(slices[2], 1004.6, 2.75, -1.2);
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
  camera.fov = s.fov || 55; camera.updateProjectionMatrix();
  const L = new THREE.Vector3(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  setShot(i);
  s.act(t, k);
  applyCamera(i, camera, L);
  fill.intensity = s.light === 'neon' ? 55 : 0;
  STEAM.update(t); BATS.update(t);
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.HOUSE_RULES = { framing: true, close: [11, 13] };
window.QA = { scene, camera, THREE, actors: actors.map((a) => ({ name: a.name, wrap: a.wrap, head: a.head, legL: a.legL })) };
window.READY = true;
