// Episode 04 "Pineapple Crime" (35 s), rebuilt in METRES with CC0 Kenney blocky characters (real skeletal-style
// part animations) and Kenney Car Kit vehicles. House rules: 30-45 s, debate-bait hook, Blender look, no blur,
// steady faces, mostly wide shots, detailed set with ambient life, clip-checked + autofixed.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { buildNeon, pizzeria, slice, pineapple, setNeon, FRONT, SWY } from '../../kit/neon.js';
import { character, prop, preload } from '../../kit/assets.js';
import { smoke, birds } from '../../kit/life.js';
import * as P from '../../kit/props.js';
import { loadFixes, setShot, offsetActor, applyCamera } from '../../kit/autofix-runtime.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
scene.add(camera);
camera.near = 0.1; camera.far = 600;

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.45;
await loadFixes(new URL('./autofix.json', import.meta.url));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const v3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- world + life
const N = buildNeon(scene);
const PZ = pizzeria(scene, 1000, 0);
const STEAM = smoke(scene, N.vents, 5);
const BATS = birds(scene, [0, 30, -60], 10, 16);
await preload(['blocky_a', 'blocky_b', 'blocky_c', 'blocky_d', 'blocky_e', 'blocky_f', 'blocky_g', 'blocky_h', 'blocky_i', 'blocky_j', 'blocky_k', 'blocky_l', 'blocky_m', 'blocky_n', 'blocky_q', 'police_car', 'taxi', 'sedan', 'suv', 'van', 'pizza', 'donut', 'fries', 'burger', 'hot_dog']);
// parked traffic for detail (outside the action lanes)
for (const [m, x, z, ry] of [['taxi', 3.6, 6, Math.PI], ['sedan', -3.6, -6, 0], ['van', 3.6, -60, Math.PI], ['suv', -3.6, -74, 0], ['sedan', 3.6, -88, Math.PI], ['taxi', -3.6, -104, 0]]) { const c = await prop(scene, m, m === 'van' ? 5 : 4.6); c.position.set(x, 0, z); c.rotation.y = ry; }
const cars = [await prop(scene, 'police_car', 4.7), await prop(scene, 'police_car', 4.7)];
const lights = cars.map((c) => { const r = new THREE.PointLight(0xff2a3c, 0, 9, 1.5), b = new THREE.PointLight(0x2a6bff, 0, 9, 1.5); r.position.set(-0.4, 2.0, 0); b.position.set(0.4, 2.0, 0); c.add(r, b); return { r, b }; });
const pizzaWhole = await prop(scene, 'pizza', 0.42);
// Kenney Food Kit dressing inside the pizzeria (counter and the second booth)
for (const [m, sz, x, y, z, ry] of [['pizza', 0.4, 996.85, 1.07, -1.45, 0.4], ['pizza', 0.4, 997.35, 1.07, -1.45, 1.1], ['pizza', 0.4, 997.85, 1.07, -1.45, 2.0], ['donut', 0.12, 999.05, 1.06, -1.2, 0], ['donut', 0.12, 999.2, 1.06, -1.38, 0.5], ['fries', 0.16, 1002.95, 0.78, 2.95, 0.3], ['burger', 0.14, 1003.35, 0.78, 3.05, 0], ['hot_dog', 0.2, 1003.3, 0.78, 2.7, 1.2]]) { const o = await prop(scene, m, sz); o.position.set(x, y, z); o.rotation.y = ry; }
// the giant street screen
let scr = 'psa';
const screen = P.liveScreen(1024, 576, (c, w, h, t = 0) => {
  c.fillStyle = '#10081e'; c.fillRect(0, 0, w, h); c.textAlign = 'center';
  const pine = (x, y, s) => { c.fillStyle = '#f2b23e'; c.beginPath(); c.ellipse(x, y, 40 * s, 54 * s, 0, 0, 7); c.fill(); c.fillStyle = '#2f8f3a'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 9 * s, y - 50 * s); c.lineTo(x + k * 20 * s, y - 100 * s); c.lineTo(x + k * 9 * s + 8 * s, y - 50 * s); c.fill(); } };
  if (scr === 'psa' || scr === 'years') {
    pine(220, 330, 1.6); c.strokeStyle = '#ff2a3c'; c.lineWidth = 26; c.beginPath(); c.arc(220, 310, 130, 0, 7); c.moveTo(128, 218); c.lineTo(312, 402); c.stroke();
    c.fillStyle = '#ffd23e'; c.font = '800 72px Poppins'; c.fillText(scr === 'psa' ? 'PINEAPPLE' : '1 SLICE', 680, 200);
    c.fillText(scr === 'psa' ? 'ON PIZZA' : '=', 680, 290); c.fillStyle = '#ff3ea5'; c.font = '800 96px Poppins'; c.fillText(scr === 'psa' ? 'IS A CRIME' : '10 YEARS', 680, 410);
  } else if (scr === 'live') {
    c.fillStyle = '#2a1c3e'; c.fillRect(40, 40, w - 80, h - 80);
    c.fillStyle = '#c98d62'; c.fillRect(380, 150, 260, 230); c.fillStyle = '#1f2b55'; c.fillRect(370, 110, 280, 70); c.fillRect(330, 380, 360, 160);
    c.fillStyle = '#111'; c.fillRect(440, 230, 30, 30); c.fillRect(550, 230, 30, 30); c.fillStyle = '#3a2a1a'; c.fillRect(440, 300, 140, 22);
    c.fillStyle = '#ffc85a'; c.beginPath(); c.moveTo(520, 330 - Math.sin(t * 6) * 8); c.lineTo(700, 300); c.lineTo(690, 400); c.closePath(); c.fill(); c.fillStyle = '#ffe066'; c.fillRect(600, 330, 26, 22); c.fillRect(640, 350, 22, 20);
    c.fillStyle = '#ff2a3c'; c.beginPath(); c.arc(90, 90, 22, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '800 54px Poppins'; c.textAlign = 'left'; c.fillText('LIVE', 124, 110);
    c.textAlign = 'right'; c.fillText(`👁 ${Math.floor(1000000 + t * 900000).toLocaleString()}`, w - 70, 110);
  } else {
    c.fillStyle = '#3eff8b'; c.font = '800 130px Poppins'; c.fillText('LEGAL', w / 2, 300); c.fillStyle = '#ffd23e'; c.font = '800 62px Poppins'; c.fillText('PINEAPPLE PIZZA IS BACK', w / 2, 420); pine(150, 330, 1.2); pine(w - 150, 330, 1.2);
  }
});
const SC = N.screen;
const SCR = new THREE.Mesh(new THREE.PlaneGeometry(SC.w, SC.h), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
SCR.position.set(SC.x - 0.12, SC.y, SC.z); SCR.rotation.y = -Math.PI / 2; scene.add(SCR);
P.box(0.2, SC.h + 0.4, SC.w + 0.4, P.std(0x1c1c24), SC.x, SC.y, SC.z, scene);
// the chief's new shop sign (right side, further down) and the new menu inside
const chiefSign = P.sign(scene, ["CHIEF'S", 'PINEAPPLE PIZZA'], FRONT - 0.3, 3.85, -58, -Math.PI / 2, 5.0, 1.5, { bg: '#1a0f12', fg: '#ffd23e', border: '#3eff8b', glow: 1.6 });
const menuBoard = P.sign(scene, ['NEW MENU', 'PINEAPPLE  $5', 'EXTRA PINEAPPLE  $6'], 1003.0, 2.65, -3.8, 0, 2.4, 1.0, { bg: '#1b1b24', fg: '#ffd23e', sizes: [80, 60, 50] });

// ---------------------------------------------------------------- cast (Kenney Blocky Characters, CC0)
const actors = [];
async function cast(name, model) { const c = await character(scene, model, 1.75); const a = { name, c, root: c.root, seated: false }; actors.push(a); return a; }
function put(a, x, y, z, yaw = 0) { a.root.visible = true; a.root.position.set(x, y, z); offsetActor(a.name, a.root.position); a.root.rotation.set(0, yaw, 0); a.seated = false; }
const anim = (a, clip, t, o) => a.c.pose(clip, t, null, 0, 0, o);
const marco = await cast('marco', 'blocky_b');
const chief = await cast('chief', 'blocky_j');
const owner = await cast('owner', 'blocky_a');
const cops = [await cast('cop0', 'blocky_j'), await cast('cop1', 'blocky_j')];
const folk = [];
for (const [i, m] of ['blocky_c', 'blocky_e', 'blocky_f', 'blocky_i', 'blocky_n', 'blocky_q', 'blocky_d', 'blocky_g', 'blocky_h', 'blocky_k', 'blocky_l', 'blocky_m'].entries()) folk.push(await cast('folk' + i, m));
// hats sized in metres, parented to the head-top anchor
function hat(a, build) { const g = new THREE.Group(); build(g); a.c.top.add(g); a.c.top.updateWorldMatrix(true, false); const ws = a.c.top.getWorldScale(new THREE.Vector3()); g.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z); return g; }
hat(chief, (g) => { P.cyl(0.27, 0.27, 0.16, P.std(0xffffff), 0, 0.08, 0, g, 20); P.box(0.5, 0.03, 0.22, P.std(0x111111), 0, 0.01, 0.2, g); P.box(0.2, 0.05, 0.02, P.std(0xf2c14e, { metalness: 0.7, roughness: 0.3 }), 0, 0.1, 0.27, g); });
hat(owner, (g) => { P.cyl(0.24, 0.24, 0.1, P.std(0xffffff), 0, 0.05, 0, g, 20); const top = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), P.std(0xffffff)); top.position.y = 0.28; g.add(top); });

// props
const props = [];
const keep = (o) => { props.push(o); return o; };
const slices = [0, 1, 2, 3, 4, 5].map(() => keep(slice(scene)));
const fruit = keep(new THREE.Group()); { const p = pineapple(fruit); p.scale.setScalar(0.22); scene.add(fruit); }
const chunk = keep(P.box(0.11, 0.06, 0.03, P.std(0xffe066), 0, 0, 0, scene));
const crates = [0, 1].map(() => { const g = keep(new THREE.Group()); scene.add(g); P.box(0.8, 0.42, 0.5, P.std(0x9a6a3a), 0, 0, 0, g); for (let k = 0; k < 3; k++) { const p = pineapple(g); p.position.set(-0.25 + k * 0.25, 0.2, 0); p.scale.setScalar(0.17); } return g; });
const booth = keep(new THREE.Group()); scene.add(booth); P.box(1.8, 0.45, 0.5, P.std(0xc8343f), 0, 0, 0, booth); P.box(1.8, 0.6, 0.15, P.std(0xc8343f), 0, 0.5, -0.2, booth);
let live = false;
const phoneScr = P.liveScreen(256, 448, (c, w, h) => { c.fillStyle = '#2a1c3e'; c.fillRect(0, 0, w, h); if (live) { c.fillStyle = '#ff2a3c'; c.beginPath(); c.arc(40, 40, 14, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '800 34px Poppins'; c.fillText('LIVE', 62, 52); c.fillStyle = '#c98d62'; c.fillRect(70, 150, 120, 110); c.fillStyle = '#1f2b55'; c.fillRect(64, 120, 132, 36); } });
const phone = keep(new THREE.Group()); scene.add(phone);
const phones = [];
{ P.box(0.08, 0.15, 0.012, P.std(0x1b1b24), 0, 0, 0, phone, 0.008); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.135), new THREE.MeshBasicMaterial({ map: phoneScr.tex, toneMapped: false })); s.position.z = 0.007; phone.add(s); }
for (let i = 0; i < 4; i++) phones.push(keep(phone.clone()));
const CONF = 220;
const confetti = keep(new THREE.InstancedMesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), CONF));
['#ff3ea5', '#ffd23e', '#3ef0ff', '#3eff8b', '#8b5cff'].forEach((c, k) => { for (let i = k; i < CONF; i += 5) confetti.setColorAt(i, new THREE.Color(c)); });
scene.add(confetti);
const fill = new THREE.PointLight(0xfff0f6, 0, 26, 1.2); fill.position.set(0, 0.4, 0); camera.add(fill); // soft key light that rides with the camera at night

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.root.visible = false; a.root.position.set(0, -80, 0); a.seated = false; }
  for (const p of props) p.visible = false;
  cars.forEach((c, i) => { c.visible = false; lights[i].r.intensity = lights[i].b.intensity = 0; });
  chiefSign.visible = false; menuBoard.visible = false; pizzaWhole.visible = false;
  PZ.setFridge(0); setNeon(1); grade.uniforms.flash.value = 0;
}
function hold(obj, anchor, pos = [0, 0, 0], rot = [0, 0, 0]) {
  obj.visible = true; anchor.updateWorldMatrix(true, false);
  const q = anchor.getWorldQuaternion(new THREE.Quaternion());
  obj.position.copy(anchor.getWorldPosition(new THREE.Vector3())).add(v3(pos).applyQuaternion(q));
  obj.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
const place = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.visible = true; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };
function car(i, x, z, ry, t) { const c = cars[i]; c.visible = true; c.position.set(x, 0, z); c.rotation.y = ry; const on = Math.floor(t * 6) % 2; lights[i].r.intensity = on ? 6 : 0; lights[i].b.intensity = on ? 0 : 6; }
const m4 = new THREE.Matrix4();
function strollers(t, n = 4) {
  [[6.1, 1], [-6.2, -1], [7.3, -1], [-7.2, 1]].slice(0, n).forEach(([x, d], i) => {
    const a = folk[i + 2]; const z = 4 - ((t * 1.3 * (0.85 + i * 0.08) + i * 11) % 60);
    put(a, x, SWY, d > 0 ? z : -56 - z, d > 0 ? Math.PI : 0); anim(a, 'walk', t * (0.9 + i * 0.07) + i * 0.3);
  });
}
function confettiAt(c, u) {
  confetti.visible = true;
  for (let i = 0; i < CONF; i++) { const a = i * 2.399, r = 0.6 + (i % 13) * 0.4; m4.makeRotationFromEuler(new THREE.Euler(u * 3 + i, u * 2 + i * 0.5, 0)); m4.setPosition(c[0] + Math.sin(a) * r, c[1] - ((u * 1.6 + (i % 17) * 0.4) % 6), c[2] + Math.cos(a) * r * 0.6); confetti.setMatrixAt(i, m4); }
  confetti.instanceMatrix.needsUpdate = true;
}
const CROWD = [[0.6, -8.2], [2.0, -8.8], [3.4, -9.4], [-0.6, -9.8], [1.0, -10.4], [2.6, -11.0], [4.0, -11.4], [-1.2, -11.6], [0.3, -12.3], [1.8, -12.8], [3.3, -13.4], [5.6, -12.0]];
const DOOR = N.shopDoor; // (-8.9, 0.15, -32.2)
const toward = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// ---------------------------------------------------------------- shots
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const NE = { light: 'neon' }, IN = { light: 'indoor' };

// 0 "In this city," aerial down the neon street
S(0, { ...NE, c: [0, 0, -30], cam: [[0, 24, 22], [0, 20, 12], [0, 4, -70]], fov: 55, act(t) { scr = 'psa'; screen.draw(t); strollers(t); } });
// 1 "putting pineapple on pizza is a crime." the giant street screen, nothing in front of it
S(W('putting', 0.8), { ...NE, c: [0, 0, -18], cam: [[-3.4, 1.7, 4], [-3.2, 2.1, 1], [8.3, 8.4, -18]], fov: 56, act(t) { scr = 'psa'; screen.draw(t); strollers(t, 2); } });
// 2 "You see, one slice gets you ten years in pizza jail." two cops march a slice-eater to the police car
const tYears = W('10', 4.4);
S(W('you', 3.1), { ...NE, c: [0, 0, -22], cam: [[-3.2, 2.4, -9], [-2.9, 2.4, -10.6], [5, 3.6, -21]], fov: 56, act(t) {
  scr = t > tYears - 0.4 ? 'years' : 'psa'; screen.draw(t); car(0, 2.6, -23, Math.PI, t);
  const u = clamp01((t - 3.2) / 2.2), z = lerp(-19.5, -21.5, u);
  put(folk[0], lerp(6.6, 5.6, u), u < 0.5 ? SWY : 0, z, toward(6, z, 2.6, -23)); anim(folk[0], 'walk', t * 0.8); hold(slices[0], folk[0].c.handR, [0, -0.05, 0.08], [0.6, 0, 0]);
  [[0.75, -0.2], [-0.75, 0.3]].forEach(([dx, dz], i) => { put(cops[i], lerp(6.6, 5.6, u) + dx, u < 0.5 ? SWY : 0, z + dz, toward(6, z, 2.6, -23)); cops[i].c.poseArms('walk', t * 0.8 + i * 0.2, 'interact-right', 0.35); });
} });
// 3 "My name is Marco, and I'm a criminal." a proud nod
S(W('my', 6.4), { ...NE, c: [-6, 0, -14], cam: [[-1.0, 1.65, -9.6], [-1.3, 1.6, -10.4], [-6.6, 1.15, -14]], fov: 50, act(t) { strollers(t, 2); put(marco, -6.6, SWY, -14, 2.1); anim(marco, t > W('criminal', 7.6) - 0.2 ? 'emote-yes' : 'idle', t); } });
// 4 "Every night, I sneak into the last pizza shop that still serves it," along the sidewalk to Slice Palace
const tSneak = W('every', 8.5);
S(tSneak, { ...NE, c: [-6, 0, -26], cam: [[2.6, 3.4, -10], [2.3, 3.4, -12], [-7, 1.1, -27]], fov: 55, act(t) {
  const u = clamp01((t - tSneak) / 3.0); put(marco, lerp(-6.8, -7.9, u), SWY, lerp(-16, -31.6, u), Math.PI + 0.05); anim(marco, 'walk', t * 0.7);
  strollers(t, 2);
} });
// 5 "through a secret door behind the fridge." the fridge swings open onto the pineapple room
const tFridge = W('secret', 12);
S(W('through', 11.5), { ...IN, c: [1000, 0, 0], cam: [[1002.5, 1.95, 3.3], [1002.3, 1.9, 2.9], [999.4, 1.05, -3.2]], fov: 58, act(t) {
  const k = smooth((t - tFridge + 0.2) / 0.6); PZ.setFridge(k);
  put(owner, 997.6, 0, -2.4, 0.5); anim(owner, t > tFridge ? 'emote-yes' : 'idle', t);
  const u = clamp01((t - tFridge - 0.2) / 1.6); put(marco, lerp(1001.0, 1000.6, u), 0, lerp(-1.6, -5.0, u), Math.PI); anim(marco, 'walk', t * 0.8);
  place(pizzaWhole, 998.4, 1.06, -1.4);
} });
// 6 "Then the pizza police raided it." two police cars race in, cops sprint to the door
const tRaid = W('then', 13.8);
S(tRaid, { ...NE, c: [-4, 0, -32], cam: [[3.8, 1.9, -22], [3.5, 1.9, -23.2], [-5.5, 1.0, -33]], fov: 56, act(t) {
  const u = smooth(clamp01((t - tRaid) / 0.9));
  car(0, -2.6, lerp(12, -33, u), Math.PI + 0.25 * u, t); car(1, 2.4, lerp(22, -38, u), Math.PI - 0.35 * u, t);
  if (t > tRaid + 0.85) cops.forEach((c, i) => { const v = clamp01((t - tRaid - 0.9) / 0.9); const x = lerp(-3.9, -8.2, v), z = -32.0 - i * 1.4; put(c, x, x < -5 ? SWY : 0, z, -Math.PI / 2); anim(c, 'sprint', t + i * 0.2); });
} });
// 7 "They took the owner," marched out to the car
const tOwner = W('they', 15.6);
S(tOwner, { ...NE, c: [-5, 0, -32], cam: [[3.2, 2.2, -22], [2.9, 2.2, -23.4], [-5, 1.0, -33]], fov: 56, act(t) {
  car(0, -2.6, -33, Math.PI + 0.25, t);
  const u = clamp01((t - tOwner) / 1.0), x = lerp(-8.4, -5.6, u);
  put(owner, x, x < -5 ? SWY : 0, -32.3, Math.PI / 2); anim(owner, 'walk', t * 0.8);
  put(cops[0], x, x < -5 ? SWY : 0, -31.5, Math.PI / 2); cops[0].c.poseArms('walk', t * 0.8, 'interact-left', 0.35);
  put(cops[1], x, x < -5 ? SWY : 0, -33.1, Math.PI / 2); cops[1].c.poseArms('walk', t * 0.8 + 0.2, 'interact-right', 0.35);
} });
// 8 "the pineapples," crates carried out
const tPines = W('pineapples', 16.6);
S(W('the', 16.6), { ...NE, c: [-5, 0, -32], cam: [[3.0, 2.0, -24.5], [2.8, 2.0, -25.5], [-6, 1.0, -32]], fov: 56, act(t) {
  car(0, -2.6, -33, Math.PI + 0.25, t);
  [0, 1].forEach((i) => { const u = clamp01((t - tPines + 0.2 - i * 0.3) / 1.2), x = lerp(-8.6, -5.6, u); put(cops[i], x, x < -5 ? SWY : 0, -31.6 - i * 1.5, Math.PI / 2); cops[i].c.poseArms('walk', t * 0.8 + i * 0.3, 'holding-both', 0); hold(crates[i], cops[i].c.handR, [0.28, -0.05, 0.2], [0, 0, 0]); });
} });
// 9 "and my favorite booth." two cops carry the red booth out
S(W('and', 17.4), { ...NE, c: [-5, 0, -32], cam: [[2.4, 2.4, -23], [2.2, 2.4, -24.2], [-6, 0.9, -32]], fov: 56, act(t) {
  car(0, -2.6, -33, Math.PI + 0.25, t);
  const u = clamp01((t - 17.5) / 1.4), x = lerp(-8.6, -5.6, u);
  put(cops[0], x, x < -5 ? SWY : 0, -31.0, Math.PI / 2); put(cops[1], x, x < -5 ? SWY : 0, -33.4, Math.PI / 2);
  cops.forEach((c, i) => c.c.poseArms('walk', t * 0.8 + i * 0.3, 'holding-both', 0));
  place(booth, x + 0.15, (x < -5 ? SWY : 0) + 0.95, -32.2, 0, Math.PI / 2, 0);
} });
// 10 "That's when I noticed something strange." Marco peeks over the police car; the chief by the shop
S(W("that's", 18.9), { ...NE, c: [-2, 0, -36], cam: [[7.5, 2.0, -45.6], [7.3, 2.0, -45.0], [-0.8, 1.1, -37.2]], fov: 55, act(t) {
  car(1, 2.4, -38, Math.PI - 0.35, t); put(marco, 4.4, 0, -40.2, toward(4.4, -40.2, -6, -34)); anim(marco, 'pick-up', 0.12, { once: true });
  put(chief, -6.6, SWY, -34.6, Math.PI / 2 + 0.2); anim(chief, 'idle', t);
} });
// 11 "The police chief had pineapple stuck in his teeth." close-up (1 of 2) - vine boom
S(W('the', 20.9), { ...NE, c: [-6.6, 0, -34.6], cam: [[-4.5, 1.5, -34.35], [-4.65, 1.48, -34.42], [-6.6, 1.22, -34.6]], fov: 46, act(t) {
  put(chief, -6.6, SWY, -34.6, Math.PI / 2 - 0.08); anim(chief, 'idle', t * 0.6);
  hold(chunk, chief.c.face, [0.03, -0.08, 0.02], [0, 0, 0.15]);
} });
// 12 "He'd been eating it all along." sneaking a pineapple behind the car, cops looking away
S(W("he'd", 23.2), { ...NE, c: [-2, 0, -36], cam: [[4.2, 2.2, -28], [3.9, 2.2, -29.2], [-1.6, 1.0, -36.4]], fov: 55, act(t) {
  car(0, -2.6, -33, Math.PI + 0.25, t);
  put(chief, -1.4, 0, -36.6, 0.8); anim(chief, 'holding-right', t); hold(fruit, chief.c.handR, [0, -0.05, 0.08], [0, 0, 0]);
  [[-7.6, -30.6, -2.3], [-7.5, -32.4, -2.5]].forEach(([x, z, r], i) => { put(cops[i], x, SWY, z, r); anim(cops[i], 'idle', t + i); });
} });
// 13 "So I grabbed my phone and went live." close-up (2 of 2), over Marco's shoulder
const tLive = W('live', 26);
S(W('so', 24.9), { ...NE, c: [4, 0, -40], cam: [[7.1, 2.2, -44.0], [6.9, 2.15, -43.7], [-0.6, 1.1, -37.2]], fov: 50, act(t) {
  live = t > tLive - 0.2; phoneScr.draw(); car(1, 2.4, -38, Math.PI - 0.35, t);
  put(marco, 4.6, 0, -41.0, toward(4.6, -41, -1.4, -36.6)); anim(marco, 'holding-right', t);
  hold(phone, marco.c.handR, [0, -0.02, 0.06], [-1.2, Math.PI, 0]);
  put(chief, -1.4, 0, -36.6, 0.8); anim(chief, 'holding-right', t); hold(slices[5], chief.c.handR, [0, -0.04, 0.06], [0.5, 0, 0]);
} });
// 14 "The whole city watched him eat a full slice." the screen goes live, the street stares
S(W('the', 26.9), { ...NE, c: [3, 0, -12], cam: [[-3.8, 2.0, 1], [-3.5, 2.3, -1], [5, 5, -15]], fov: 56, act(t) {
  scr = 'live'; screen.draw(t);
  CROWD.forEach(([x, z], i) => { const a = folk[i]; put(a, x, x > 5 ? SWY : 0, z, toward(x, z, SC.x, SC.z)); anim(a, i % 3 === 1 ? 'holding-right' : 'idle', t + i * 0.3); if (i % 3 === 1) hold(phones[i % 4], a.c.handR, [0, -0.02, 0.06], [-1.2, Math.PI, 0]); });
} });
// 15 "...a full slice." the chief caught mid-bite under the flashing lights
S(W('a', 28.2), { ...NE, c: [-2, 0, -36], cam: [[2.6, 1.8, -30.6], [2.4, 1.8, -31.4], [-1.4, 1.2, -36.6]], fov: 55, act(t) {
  car(0, -2.6, -33, Math.PI + 0.25, t); put(chief, -1.4, 0, -36.6, 0.8); anim(chief, 'holding-right', t); hold(slices[5], chief.c.handR, [0, -0.04, 0.06], [0.5, 0, 0]);
  [[-6.2, -31.4], [-6.0, -33.6]].forEach(([x, z], i) => { put(cops[i], x, SWY, z, toward(x, z, -1.4, -36.6)); anim(cops[i], 'emote-no', t + i * 0.2); });
} });
// 16 "Now, pineapple pizza is legal again," the screen says LEGAL; the street celebrates
const tLegal = W('now', 29.4);
S(tLegal, { ...NE, c: [3, 0, -12], cam: [[-4, 2.2, 0.5], [-3.6, 2.5, -1.5], [4.5, 4.5, -14]], fov: 56, act(t) {
  scr = 'legal'; screen.draw(t); confettiAt([2, 6, -10], t - tLegal);
  CROWD.forEach(([x, z], i) => { const a = folk[i]; put(a, x, (x > 5 ? SWY : 0) + Math.abs(Math.sin(t * 6 + i)) * 0.25, z, toward(x, z, SC.x, SC.z)); anim(a, ['emote-yes', 'interact-right', 'attack-kick-right', 'emote-yes'][i % 4], t * 1.2 + i * 0.2); if (i < 6) hold(slices[i], a.c.handL, [0, -0.04, 0.06], [0.5, 0, 0]); });
} });
// 17 "and the police chief opened his own pizza shop." his new neon sign
S(W('and', 32), { ...NE, c: [5, 0, -58], cam: [[-2.2, 2.4, -49], [-2.0, 2.4, -50.4], [7.6, 1.8, -58]], fov: 55, act(t) {
  chiefSign.visible = true; put(chief, 7.0, SWY, -57.2, -Math.PI / 2 + 0.3); anim(chief, 'interact-right', t);
  strollers(t, 3);
} });
// 18 "I'm his best customer." Marco back in his favourite booth, the chief serving
S(W("i'm", 34), { ...IN, c: [1000, 0, 0], cam: [[1002.6, 2.15, 3.85], [1002.6, 2.1, 3.6], [1002.95, 0.85, 0.0]], fov: 58, act(t) {
  menuBoard.visible = true;
  const b = PZ.booths[0];
  put(marco, b.x, 0.02, b.z - 0.75, 0); marco.seated = true; marco.c.poseArms('sit', 0, 'holding-right', 0); hold(slices[1], marco.c.handR, [0, -0.04, 0.06], [0.5, 0, 0]);
  put(chief, b.x - 1.25, 0, b.z + 0.1, Math.PI / 2); anim(chief, 'interact-right', t); place(slices[2], b.x - 0.3, 0.79, b.z + 0.1);
  place(pizzaWhole, b.x + 0.3, 0.78, b.z);
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
  fill.intensity = s.light === 'neon' ? 9 : 0;
  STEAM.update(t); BATS.update(t);
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.HOUSE_RULES = { framing: true, close: [11, 13] };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { get rotation() { return { x: a.seated ? 2 : 0 }; } } })) };
window.READY = true;
