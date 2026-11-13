// Episode 02 "Gravity Hour" - full episode. Deterministic: window.renderAt(t).
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { makeAvatar, pose, setFace, talkFace, walk, run, reset } from '../../kit/avatar.js';
import { buildTown, setWindows, setLamps, car, tree } from '../../kit/town.js';
import { suburb, backdrop } from '../../kit/world.js';
import * as P from '../../kit/props.js';
import * as Z from '../../kit/sets2.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'));
const { THREE, scene, camera, composer, bokeh, grade, setLight } = C;
scene.add(camera);
buildTown(scene);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), P.std(0x9ed97c, { roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -60); ground.receiveShadow = true; scene.add(ground);

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.45;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const SIDE = 0.3;
const v3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- world: town + suburbs + clock tower district + backdrop
const TOWER = [100, -60], LAKE = [100, -5];
const SHOP = [41, -104], ANCHOR_LOT = [-58, -20];
suburb(scene, { x0: 30, x1: 182, z0: -170, z1: 20, s: 5, avoid: [[56, 144, -28, 18], [66, 134, -94, -26], [24, 58, -120, -86]] });
suburb(scene, { x0: -182, x1: -30, z0: -170, z1: 20, s: 9, avoid: [[-74, -42, -38, -2]] });
backdrop(scene, 0, -70, 340);
const TW = Z.clockTower(scene, ...TOWER);
const LK = Z.lake(scene, LAKE[0], LAKE[1], 80, 34);
const shop = Z.bootsShop(scene, SHOP[0], SHOP[1], 0);
{ const pv = new THREE.Mesh(new THREE.PlaneGeometry(34, 30), new THREE.MeshStandardMaterial({ map: P.textTex([''], { bg: '#e6dccf' }), roughness: 0.9 })); pv.rotation.x = -Math.PI / 2; pv.position.set(SHOP[0], 0.04, SHOP[1] + 10); pv.receiveShadow = true; scene.add(pv); }
[[26, -96], [56, -96], [30, -114], [53, -114]].forEach(([x, z]) => tree(scene, x, z, 0.9));
// main-street extras: street clock, siren, billboard
const streetClock = Z.clockFace(256);
{
  const g = P.group(scene, -8.4, 0, -2);
  P.cyl(0.2, 0.25, 7, P.std(0x2b2f45, { metalness: 0.4 }), 0, 3.5, 0, g, 10);
  P.cyl(1.6, 1.6, 0.5, P.std(0x2b2f45, { metalness: 0.4 }), 0, 8.2, 0, g, 32).rotation.z = Math.PI / 2;
  [1, -1].forEach((s) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshStandardMaterial({ map: streetClock.tex, roughness: 0.5 })); m.position.set(s * 0.27, 8.2, 0); m.rotation.y = s * Math.PI / 2; g.add(m); });
}
const siren = Z.sirenPole(scene, 8.6, 0.3, -12);
const bill = Z.billboard(scene, -17, 27, -40, Math.PI / 2);
// anchor house lot
const AH = P.house(scene, ANCHOR_LOT[0], ANCHOR_LOT[1], 0, 0xc9e7d8, 0xd9434f);
const anc = Z.anchor(scene); anc.position.set(-51, 0, -7); anc.rotation.y = 0.5;
const ch = Z.chain(scene, 22);
{ const lot = new THREE.Mesh(new THREE.PlaneGeometry(26, 30), P.std(0x8fcf74, { roughness: 1 })); lot.rotation.x = -Math.PI / 2; lot.position.set(-58, 0.02, -20); scene.add(lot); const pit = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), P.std(0x8a6a4a, { roughness: 1 })); pit.rotation.x = -Math.PI / 2; pit.position.set(-58, 0.04, -20); scene.add(pit); }

// interiors (far away; their walls fill the frame)
const TI = Z.towerInterior(scene, 1000, 0);
const LR = P.livingRoom(scene, 1000, 100);
const BK = P.bakery(scene, 1000, 160);
P.windowFrame(scene, 1000 - 7.75, 4.5, 100 - 1, Math.PI / 2, 3.4, 3);

// ---------------------------------------------------------------- cast
const actors = [];
function actor(opts) {
  const av = makeAvatar(opts);
  const wrap = new THREE.Group(), tilt = new THREE.Group();
  wrap.add(tilt); tilt.add(av.root); scene.add(wrap);
  const a = { av, wrap, tilt, ...av };
  actors.push(a);
  return a;
}
function put(a, x, y, z, yaw = 0) {
  a.wrap.visible = true;
  a.wrap.position.set(x, y, z); a.wrap.rotation.set(0, yaw, 0);
  a.tilt.rotation.set(0, 0, 0); a.tilt.position.set(0, 0, 0);
  reset(a.av);
}
// floating: body tumbles slowly around its middle
function drift(a, t, seed = 0, amt = 1) {
  a.tilt.position.y = 2.5; a.av.root.position.y = -2.5;
  a.tilt.rotation.set(Math.sin(t * 0.9 + seed) * 0.35 * amt, 0, Math.sin(t * 0.7 + seed * 2) * 0.5 * amt);
  a.armL.rotation.z += Math.sin(t * 3 + seed) * 0.25; a.armR.rotation.z -= Math.sin(t * 3 + seed) * 0.25;
}
function undrift(a) { a.tilt.position.y = 0; a.av.root.position.y = 0; }

const sam = actor({ shirt: 0xffc83d, pants: 0x3a4a8a, hair: 0x1a1210, hairStyle: 'short', skin: 0xc98d62, backpack: 0x6fb6ff });
const mom = actor({ shirt: 0xb98cf0, pants: 0x4a3a7a, hair: 0x1a1210, hairStyle: 'bun', skin: 0xc98d62 });
const rich = actor({ shirt: 0x3a2a5a, pants: 0x22222e, hair: 0x9a9a9a, hairStyle: 'short', skin: 0xf2c9a0, hat: 'tophat', glasses: true });
const kid1 = actor({ shirt: 0xff8f6b, pants: 0x3a4a7a, hairStyle: 'messy', hair: 0x6b3a1a, scale: 0.8 });
const kid2 = actor({ shirt: 0x8fd16b, pants: 0x2a2a3a, hairStyle: 'ponytail', hair: 0x2a1a12, skin: 0x8a5a3c, scale: 0.8 });
const kid3 = actor({ shirt: 0x6fb6ff, pants: 0x5a4a3a, hairStyle: 'short', hair: 0xd9a066, scale: 0.75 });
const vendor = actor({ shirt: 0xffffff, pants: 0xff9cc2, hairStyle: 'short', hair: 0x3a2a1a, skin: 0xe8b48a, apron: 0xff9cc2 });
const baker = actor({ shirt: 0xb98cf0, pants: 0x5a4a8a, hair: 0x8a4a2a, hairStyle: 'bun', skin: 0xf2c9a0, hat: 'chef', apron: 0xffffff });
const dad = actor({ shirt: 0x6fb6ff, pants: 0x3a3a5a, hairStyle: 'short', hair: 0x3a2a1a, skin: 0xe8b48a });
const anchorGuy = actor({ shirt: 0xf2a33a, pants: 0x4a5a7a, hair: 0x6b4a2a, hairStyle: 'short', skin: 0xf2c9a0, glasses: true });
const guards = [0, 1].map((i) => actor({ shirt: 0x22222e, pants: 0x22222e, hairStyle: 'short', hair: 0x111111, skin: i ? 0x8a5a3c : 0xf2c9a0, glasses: true }));
const workers = [0, 1].map((i) => actor({ shirt: 0xf2853a, pants: 0x3a4a7a, hairStyle: 'short', hair: 0x2a1a12, skin: i ? 0xc98d62 : 0xf6c89a, hat: 'hardhat' }));
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
const folk = FOLK_LOOKS.map((o) => actor(o));
// gold statue of Sam
const statue = actor({ shirt: 0xf2c14e, pants: 0xf2c14e, shoes: 0xd9a640, hair: 0xd9a640, hairStyle: 'short', skin: 0xf2c14e, backpack: 0xd9a640 });
statue.av.root.traverse((o) => { if (o.isMesh && o.material.isMeshStandardMaterial) { o.material.metalness = 0.7; o.material.roughness = 0.28; } });
setFace(statue, 'determined');

// ---------------------------------------------------------------- props
const props = [];
const keep = (o) => { props.push(o); return o; };
const floatCars = [0xff8f6b, 0x6fb6ff, 0xffd45c].map((c) => keep(car(scene, 0, 0, c)));
const bins = [0x4f9a90, 0x6b7fd9, 0xe8875c].map((c) => keep(Z.trashBin(scene, c)));
const truck = keep(Z.iceTruck(scene));
truck.traverse((o) => { if (o.isMesh && o.material.isMeshBasicMaterial) o.scale.x = -1; });
const cone = keep(P.iceCream(scene));
const ball = keep(Z.football(scene));
const clouds = [1.2, 1.0, 0.9, 1.4, 1.1].map((s) => keep(Z.cloud(scene, s)));
const bootsL = keep(Z.heavyBoot(scene, true)), bootsR = keep(Z.heavyBoot(scene, true));
const trucks = [0, 1].map(() => keep(Z.bootTruck(scene)));
const plate = keep(P.cyl(1.2, 1.2, 0.12, P.std(0xffffff), 0, 0, 0, scene, 24));
const cake = keep(P.cyl(0.85, 0.85, 1.0, P.std(0xff9cc2), 0, 0, 0, scene, 24));
const glue = keep(P.box(0.5, 0.9, 0.5, P.std(0xffffff), 0, 0, 0, scene, 0.1));
const belts = [0, 1, 2].map(() => keep(P.box(2.4, 0.25, 0.12, P.std(0x2b2f45), 0, 0, 0, scene)));
const buckles = [0, 1, 2].map(() => keep(P.box(0.4, 0.3, 0.16, P.std(0xc0c6d4, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, scene)));
const popcorn = keep(P.box(1.0, 1.1, 0.8, P.std(0xe8434f), 0, 0, 0, scene, 0.1));
const lampF = keep(P.cyl(0.6, 0.9, 1.2, P.glowMat(0xfff1c8, 0.6), 0, 0, 0, scene, 16));
const cash = keep(P.sign(scene, ['$'], 0, 0, 0, 0, 1.6, 0.8, { bg: '#6fcf7f', fg: '#1b5e20' }));
const stars = keep(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 1500 }, (_, i) => { const u = (i * 0.618034) % 1, v = ((i * 0.7548776) % 1); const a = u * 6.283, e = Math.asin(v); return [Math.cos(e) * Math.sin(a) * 300, Math.sin(e) * 300, Math.cos(e) * Math.cos(a) * 300]; }).flat(), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false })));
scene.add(stars);
const SPL = 160;
const splash = keep(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfeaff, emissiveIntensity: 0.4 }), SPL));
scene.add(splash);
const CONF = 260;
const confetti = keep(new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), CONF));
['#ff4d6d', '#ffd84d', '#6fb6ff', '#8fdc6b', '#b98cf0'].forEach((c, k) => { for (let i = k; i < CONF; i += 5) confetti.setColorAt(i, new THREE.Color(c)); });
scene.add(confetti);
const flashlight = new THREE.PointLight(0xfff2c8, 0, 30, 1.2); scene.add(flashlight);

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.wrap.visible = false; a.wrap.position.set(0, -80, 0); undrift(a); }
  for (const p of props) p.visible = false;
  ch.hide();
  grade.uniforms.flash.value = 0;
  setWindows(0); setLamps(0.6);
  siren.on(-1); TI.alarm(-1);
  BK.flying.forEach((b) => (b.visible = false));
  AH.g.position.y = 0; AH.g.rotation.set(0, 0, 0);
  streetClock.set(2, 59);
  TI.pivot.rotation.x = 0.5;
  bill.show('1 HOUR');
}
function hold(obj, hand, pos = [0, 0, 0], rot = [0, 0, 0]) {
  obj.visible = true;
  hand.updateWorldMatrix(true, false);
  obj.position.copy(hand.localToWorld(v3(pos)));
  obj.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
function wearBoots(a) { // boots on the feet
  [[bootsL, a.legL], [bootsR, a.legR]].forEach(([b, leg]) => { hold(b, leg, [0, -2.55, -0.2], [0, 0, 0]); b.scale.setScalar(0.85); });
}
const place = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.visible = true; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };
const bob = (t, s = 0) => Math.sin(t * 1.6 + s) * 0.35;
const rise = (t, t0, dur, h) => h * smooth((t - t0) / dur);
// Sam clinging to a horizontal anchor point: body hangs off it, k = 0 standing, 1 fully floating
function cling(a, hx, hy, hz, dir, t, k = 1, face = 'squeeze') {
  // dir: which way the body streams away from the hands (+1 = +x, -1 = -x, 0 = up)
  put(a, hx, hy, hz, 0);
  pose(a, 'cheer');
  const ang = dir === 0 ? Math.PI : dir * Math.PI / 2 * k + (dir > 0 ? 0 : 0);
  a.tilt.rotation.z = dir === 0 ? Math.PI : (dir > 0 ? -1 : 1) * Math.PI / 2 * k;
  // hands are 6.0 above the feet in 'cheer': shift so the hands sit on the anchor
  const hand = new THREE.Vector3(0, 6.0, 0).applyEuler(a.tilt.rotation);
  a.wrap.position.set(hx - hand.x, hy - hand.y, hz);
  a.legL.rotation.x = Math.sin(t * 7) * 0.35; a.legR.rotation.x = -Math.sin(t * 7) * 0.35;
  a.tilt.rotation.z += Math.sin(t * 5) * 0.06;
  setFace(a, face);
  return ang;
}
function folkFloat(list, t, base, spread, seedK = 1) {
  list.forEach((a, i) => {
    const [bx, by, bz] = base(i);
    put(a, bx + Math.sin(t * 0.6 + i) * spread, by + bob(t, i), bz + Math.cos(t * 0.5 + i) * spread, i * 1.3 + t * 0.2);
    pose(a, i % 3 ? 'float' : 'cheer'); drift(a, t, i * seedK); setFace(a, i % 2 ? 'happy' : 'happy_talk');
  });
}

// ---------------------------------------------------------------- shots
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const DAY = { light: 'day' };

// 0 "In this town," aerial push down main street to the town hall
S(0, { ...DAY, cam: [[0, 40, 46], [0, 34, 30], [0, 12, -110]], fov: 50, act(t) { streetFolk(t, 0); } });
function streetFolk(t, lift) {
  [[-7, -14], [7.5, -22], [-7.5, -30], [6.8, -6], [-6.6, -40]].forEach(([x, z], i) => {
    const a = folk[i]; put(a, x, SIDE + lift * (2 + i * 1.2) + (lift ? bob(t, i) * 0.6 : 0), z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    if (lift) { pose(a, 'float'); drift(a, t, i, lift); setFace(a, 'happy_talk'); } else { walk(a.av, t + i * 0.3, 1.2, 0.4); a.wrap.position.z += ((t * 2.2 + i * 3) % 12) * (i % 2 ? 1 : -1); a.wrap.rotation.y = i % 2 ? 0 : Math.PI; setFace(a, 'smile'); }
  });
}
// 1 "gravity turns off" - street objects lift off
const tGrav = W('gravity', 0.9);
S(tGrav, { ...DAY, c: [0, 0, -24], cam: [[-3.2, 1.6, -6], [-2.6, 2.2, -9], [1.5, 2.5, -28]], fov: 50, dof: [16, 0.006], act(t) { liftStreet(t, tGrav); } });
function liftStreet(t, t0, scale = 1) {
  const k = (d) => scale * rise(t, t0 + d, 3.2, 1);
  place(floatCars[0], -3.6, 0.05 + 7 * k(0.1) + bob(t) * k(0), -22, k(0) * 0.4, 0.2, k(0) * 0.3);
  place(floatCars[1], 2.6, 0.05 + 9 * k(0.5) + bob(t, 1) * k(0), -36, -k(0) * 0.3, Math.PI, k(0) * 0.25);
  place(floatCars[2], -2.8, 0.05 + 5 * k(0.8), -54, 0, 0.1, -k(0) * 0.2);
  bins.forEach((b, i) => place(b, [6.6, -6.8, 7.0][i], 0.3 + (4 + i * 3) * k(i * 0.2) + bob(t, i) * k(0), [-16, -26, -32][i], k(0) * (0.8 + i * 0.3), 0, k(0) * (0.6 - i * 0.4)));
  streetFolk(t, k(0.3));
}
// 2 "every single day" - town hall clock
S(W('every', 2), { ...DAY, c: [TOWER[0], 40, TOWER[1]], cam: [[TOWER[0] + 3, 57, TOWER[1] + 30], [TOWER[0] + 1.5, 56.5, TOWER[1] + 22], [TOWER[0], 56, TOWER[1] + 7.5]], fov: 36, act() { TW.face.set(2, 58); } });
// 3 "You see, at three o'clock sharp" - street clock ticks to 3:00
const tSharp = W("o'clock", 4);
S(W('you', 3.5), { ...DAY, c: [-8, 0, -2], cam: [[-3.4, 8.6, 1.8], [-4.2, 8.4, 0.8], [-8.4, 8.2, -2]], fov: 34, dof: [5.6, 0.01], act(t) { streetClock.set(t < tSharp + 0.3 ? 2 : 3, t < tSharp + 0.3 ? 59 : 0); } });
// 4 "a siren goes off"
const tSiren = W('a', 5.3);
S(tSiren, { ...DAY, c: [8, 0, -12], cam: [[3.2, 2.4, -6.5], [3.6, 2.8, -7.6], [8.6, 7.4, -12]], fov: 46, dof: [8.6, 0.008], act(t) { siren.on(t - tSiren); } });
// 5 "and anything that isn't tied down"
const tAny = W('and', 6.4);
S(tAny, { ...DAY, c: [0, 0, -24], cam: [[6.4, 1.2, -6], [5.6, 1.8, -8], [0, 4, -30]], fov: 52, dof: [14, 0.006], act(t) { siren.on(t - tSiren); liftStreet(t, tGrav - 1.4); } });
// 6 "floats up into the sky" - looking up from the street
const tFloats = W('floats', 7.5);
S(tFloats, { ...DAY, c: [0, 0, -28], cam: [[0.5, 1.4, -12], [0.5, 1.4, -13.5], [0, 26, -32], [0, 34, -34]], fov: 62, act(t) { liftStreet(t, tGrav - 4.5, 1.6); } });
// 7 "My name is Sam" - Sam on the sidewalk
const tSam = W('my', 9.5);
S(tSam, { ...DAY, c: [7, 0, 4], cam: [[0.4, 4.6, 11.2], [1.2, 4.4, 10.0], [7.2, 4.0, 4]], fov: 40, dof: [8.6, 0.01], act(t) { put(sam, 7.2, SIDE, 4, -0.75); pose(sam, 'idle'); pose(sam, 'wave'); sam.armR.rotation.z = 2.3 + 0.3 * Math.sin(t * 10); talkFace(sam, WORDS, t, 'happy_talk', 'smile'); } });
// 8 "and I'm the only kid in town who's afraid of heights" - Sam looks up, people floating high above
S(W('and', 10.4), { ...DAY, c: [7, 0, 4], cam: [[4.4, 1.3, 10.2], [4.6, 1.4, 9.4], [7.0, 9, 1]], fov: 60, dof: [7.4, 0.006], act(t) {
  put(sam, 7.2, SIDE, 4, -0.6); pose(sam, 'idle', 'flinch', 0.3); sam.headPivot.rotation.x = -0.45; talkFace(sam, WORDS, t, 'scared_talk', 'scared');
  folkFloat(folk.slice(0, 4), t, (i) => [4 + i * 2.5, 16 + i * 5, -6 - i * 4], 1.2);
} });
// 9 "Everyone else loves gravity hour"
S(W('everyone', 12.5), { ...DAY, c: [0, 10, -20], cam: [[6, 9, 4], [4.6, 10.4, 0.6], [0, 12, -24]], fov: 50, act(t) {
  folkFloat(folk, t, (i) => [-6 + (i % 4) * 4, 8 + (i % 3) * 3.5, -12 - Math.floor(i / 2) * 5], 1.0);
  place(floatCars[0], -6, 10 + bob(t), -34, 0.3, 0.6, 0.4);
} });
// 10 "Kids play football on the clouds"
const CL = [30, 70, -30];
S(W('kids', 14.5), { light: 'day', c: CL, cam: [[CL[0] - 14, CL[1] + 9, CL[2] + 18], [CL[0] - 11, CL[1] + 8, CL[2] + 14], [CL[0], CL[1] + 2, CL[2] - 2]], fov: 48, dof: [19, 0.004], act(t) { cloudGame(t); } });
function cloudGame(t) {
  [[0, 0, 0], [9, -1, -6], [-9, 0.5, -5], [3, -2, -16], [-14, -3, 6]].forEach(([a, b, c], i) => place(clouds[i], CL[0] + a, CL[1] + b + Math.sin(t + i) * 0.2, CL[2] + c));
  const u = (t * 0.9) % 2, k = u < 1 ? u : 2 - u;
  put(kid1, CL[0] - 4, CL[1] + 3.6, CL[2] + 0.5, Math.PI / 2); put(kid2, CL[0] + 5, CL[1] + 2.8, CL[2] - 3.5, -Math.PI / 2 - 0.3);
  pose(kid1, k < 0.15 ? 'kick' : 'idle'); pose(kid2, k > 0.85 ? 'kick' : 'cheer');
  setFace(kid1, 'happy'); setFace(kid2, 'happy_talk');
  place(ball, lerp(CL[0] - 3, CL[0] + 4, k), CL[1] + 4 + Math.sin(k * Math.PI) * 4, lerp(CL[2] + 0.5, CL[2] - 3.2, k), t * 4, t * 3, 0);
}
// 11 "The ice cream truck floats around upside down"
const IT = [0, 15, -34];
S(W('the', 16.3), { ...DAY, c: [0, 10, -30], cam: [[6.5, 6.5, -6], [5.6, 7.5, -9], [0.5, 14, -33]], fov: 54, dof: [25, 0.004], act(t) {
  place(truck, IT[0] + Math.sin(t * 0.5) * 0.5, IT[1] + bob(t), IT[2], 0, 0.6 + t * 0.05, Math.PI + Math.sin(t) * 0.08);
  put(vendor, 3.2, IT[1] + 1.2 + bob(t), IT[2] + 2.2, 0.9); vendor.tilt.position.y = 2.5; vendor.av.root.position.y = -2.5; vendor.tilt.rotation.z = Math.PI; pose(vendor, 'offer'); setFace(vendor, 'happy_talk');
  put(kid3, 6.4, IT[1] - 1.6 + bob(t, 2), IT[2] + 3.4, -1.9); pose(kid3, 'reach'); drift(kid3, t, 2, 0.4); setFace(kid3, 'happy');
  hold(cone, vendor.handR, [0, -0.3, 0.3], [Math.PI, 0, 0]);
} });
// 12 "My mom does yoga ten stories in the air"
const MY = [-45, 32, -60];
S(W('my', 18.5), { ...DAY, c: MY, cam: [[MY[0] + 9, MY[1] + 6, MY[2] + 13], [MY[0] + 7.4, MY[1] + 5.2, MY[2] + 10.6], [MY[0], MY[1] + 3, MY[2]]], fov: 44, dof: [12.5, 0.005], act(t) {
  put(mom, MY[0], MY[1] + bob(t) * 0.6, MY[2], 0.55); pose(mom, 'yoga'); setFace(mom, 'sleepy');
  place(clouds[0], MY[0] - 10, MY[1] - 4, MY[2] - 12); place(clouds[1], MY[0] + 12, MY[1] - 8, MY[2] - 20);
} });
// 13 "Me?"
const tMe = W('me', 21);
S(tMe, { ...DAY, c: [6, 0, 8], cam: [[3.2, 4.7, 17.4], [3.5, 4.6, 16.6], [6.8, 4.1, 11.6]], fov: 40, dof: [5.4, 0.016], act(t) { put(sam, 6.9, SIDE, 11.6, -0.55); pose(sam, 'idle'); setFace(sam, 'deadpan'); } });
// 14 "I hug a lamppost and close my eyes" - body streams out like a flag
const tHug = W('i', 21.6);
S(tHug, { ...DAY, c: [4, 0, 8], cam: [[-3.5, 6.4, 18.5], [-2.8, 6.1, 17.4], [2.4, 3.8, 8]], fov: 52, dof: [12, 0.006], act(t) {
  { const k = smooth((t - tHug) / 0.5); cling(sam, 5.8, lerp(6.3, 3.6, k), 8, 1, t, k, 'squeeze'); }
  place(bins[0], 1, 6 + bob(t), 2, t, 0, t * 0.7);
} });
// 15 "Of course, people had gotten really creative." - aerial over the west suburb, the anchored house in view
S(W('of', 24), { ...DAY, c: [-60, 0, -20], cam: [[-20, 34, 26], [-24, 31, 18], [-58, 6, -20]], fov: 44, act(t) { anchorHouse(t); } });
function anchorHouse(t) {
  const y = 7 + Math.sin(t * 1.3) * 0.6;
  AH.g.position.y = y; AH.g.rotation.set(Math.sin(t * 0.9) * 0.04, 0, Math.sin(t * 1.1) * 0.05);
  ch.span([-51 + Math.sin(0.5) * 0, 10.0, -7], [-54.5, y + 0.3, -16.5], 0.6);
  put(anchorGuy, -58, y + 0.4, -14.4, 0.2); pose(anchorGuy, 'wave'); anchorGuy.armR.rotation.z = 2.3 + 0.35 * Math.sin(t * 9); setFace(anchorGuy, 'happy_talk');
}
// 16 "Every couch in town has seatbelts"
const LRC = [1000, 0, 100];
S(W('every', 26.3), { light: 'indoor', c: LRC, cam: [[1000.8, 4.8, 112], [1000.5, 4.6, 110.6], [1000, 3.2, 102.5]], fov: 46, dof: [8.6, 0.01], act(t) {
  [[dad, -1.9], [mom, 0], [kid3, 1.8]].forEach(([a, x], i) => { put(a, 1000 + x, -0.3 + (a === kid3 ? 0.5 : 0), 102.9, 0); pose(a, 'sit'); a.av.body.position.y = 2 + Math.sin(t * 6 + i) * 0.06; setFace(a, i === 1 ? 'happy_talk' : 'smile');
    place(belts[i], 1000 + x, 2.45 + (a === kid3 ? 0.35 : 0), 103.75, 0, 0, 0); place(buckles[i], 1000 + x, 2.45 + (a === kid3 ? 0.35 : 0), 103.82); });
  pose(dad, 'sit'); dad.armR.rotation.x = -1.2;
  place(popcorn, 998.2, 6.2 + bob(t), 104.5, t, t * 0.5, 0); place(lampF, 1003.4, 6.8 + bob(t, 2), 103.5, 0.4, 0, 0.6);
} });
// 17 "The bakery glues its cakes to the plates"
const BKC = [1000, 0, 160];
S(W('the', 27.9), { light: 'indoor', c: BKC, cam: [[1002.2, 5.0, 171], [1001.8, 4.8, 169.4], [1000, 4.0, 160]], fov: 40, dof: [10, 0.008], act(t) {
  put(baker, 1000, 0, 158.8, 0.15); pose(baker, 'offer'); baker.armL.rotation.x = -1.3; setFace(baker, 'happy_talk');
  const flip = smooth((t - CUT(W('the', 27.9)) - 0.5) / 0.6);
  hold(plate, baker.handR, [0, 0.1, 0.9], [flip * Math.PI, 0, 0]); hold(cake, baker.handR, [0, 0.1, 0.9], [flip * Math.PI, 0, 0]); cake.translateY(0.56); plate.scale.setScalar(0.75); cake.scale.setScalar(0.75);
  hold(glue, baker.handL, [0, 0.4, 0.3], [0.3, 0, 0]);
  BK.flying.forEach((b, i) => { b.visible = true; b.position.set(-6 + i * 3, 6 + Math.sin(t * 1.4 + i) * 0.6, -3 + (i % 2) * 2); b.rotation.set(t * 0.6 + i, i, 0); });
} });
// 18 "and one guy tied his entire house to a giant anchor"
S(W('and', 30.4), { ...DAY, c: [-56, 0, -14], cam: [[-41, 17, 12], [-42.5, 16, 8], [-56, 8, -16]], fov: 50, dof: [30, 0.004], act(t) { anchorHouse(t); } });
// 19 "so it wouldn't float away again"
S(W('so', 32.8), { ...DAY, c: [-56, 0, -14], cam: [[-41, 2.0, -3], [-41.8, 2.2, -4.4], [-55, 9.5, -16]], fov: 60, dof: [16, 0.005], act(t) { anchorHouse(t); } });
// 20 "That's when I noticed something strange."
const tStrange = W("that's", 34.7);
S(tStrange, { ...DAY, c: [-6, 0, -2], cam: [[-2.4, 4.6, 10.2], [-2.9, 4.5, 9.2], [-6.8, 4.2, 3.6]], fov: 38, dof: [6.6, 0.014], act(t) {
  put(sam, -6.8, SIDE, 3.6, 0.55); pose(sam, 'idle'); sam.headPivot.rotation.y = -0.4; talkFace(sam, WORDS, t, 'determined_talk', 'determined');
} });
// 21 "Every day, gravity hour lasted a little longer." - clock spins
const tLonger = W('every', 36.6);
S(tLonger, { ...DAY, c: [-8, 0, -2], cam: [[-3.0, 8.4, 2.2], [-4.6, 8.3, 0.6], [-8.4, 8.2, -2]], fov: 30, act(t) { const m = (t - tLonger) * 600; streetClock.set(3 + Math.floor(m / 60), m % 60); } });
// 22 "One hour, then two" - billboard
const tOne = W('one', 39.5), tTwo = W('two', 40.4), tFive = W('five', 41);
S(tOne, { ...DAY, c: [-10, 0, -40], cam: [[4, 9, -24], [2.6, 11, -27], [-17, 26.5, -40]], fov: 42, act(t) { bill.show(t < tTwo ? '1 HOUR' : '2 HOURS'); } });
// 23 "then five"
S(W('then', 41), { ...DAY, c: [-10, 0, -40], cam: [[4, 26.5, -38], [2, 26.5, -39], [-17, 26.5, -40]], fov: 44, act(t) { bill.show(t < tFive ? '2 HOURS' : '5 HOURS', 'GRAVITY HOUR TODAY'); } });
// 24 "And the richest man in town" - outside the boots shop
const SH = [SHOP[0], 0, SHOP[1]];
S(W('and', 42.2), { ...DAY, c: SH, sun: [18, 40, 30], cam: [[SH[0] + 4, 4.4, SH[2] + 13], [SH[0] + 3.2, 4.6, SH[2] + 11], [SH[0] - 0.5, 4.6, SH[2] + 4]], fov: 42, dof: [7.4, 0.01], act(t) {
  put(rich, SH[0] - 0.5, 0.05, SH[2] + 4.2, 0.1); pose(rich, 'crossArms'); wearBoots(rich); talkFace(rich, WORDS, t, 'smug_talk', 'smug');
} });
// 25 "had started selling heavy boots"
S(W('heavy', 43.9), { ...DAY, c: SH, sun: [18, 40, 30], cam: [[SH[0] - 1.6, 2.6, SH[2] + 5.4], [SH[0] - 1.2, 2.5, SH[2] + 4.4], [SH[0] - 1.5, 1.8, SH[2] + 0.9]], fov: 40, dof: [3.6, 0.02], act() {} });
// 26 "for $1,000 a pair" - price sign, customers line up with cash
S(W('1000', 44.7), { ...DAY, c: SH, sun: [18, 40, 30], cam: [[SH[0] + 13, 4, SH[2] + 9], [SH[0] + 11.4, 4.2, SH[2] + 8], [SH[0] + 5.5, 4, SH[2] + 1.6]], fov: 44, dof: [8.5, 0.008], act(t) {
  put(rich, SH[0] + 3, 0.05, SH[2] + 3.4, -0.3); pose(rich, 'offer'); wearBoots(rich); setFace(rich, 'smug');
  [0, 1, 2, 3].forEach((i) => { const a = folk[i]; put(a, SH[0] + 4 + i * 2.6, 0.05, SH[2] + 6 + i * 1.6, -2.6); pose(a, i ? 'idle' : 'offer'); setFace(a, 'scared'); });
  hold(cash, folk[0].handR, [0, -0.3, 0.4], [0, 0, 0]);
} });
// 27 "So for the first time in my life, I followed his trucks" - dusk, Sam behind a parked car
const tFollow = W('so', 46.4);
const RD = -132;
S(tFollow, { light: 'dusk', c: [70, 0, RD], cam: [[53, 4.6, RD + 14], [54, 4.4, RD + 12.5], [66, 2.6, RD - 1]], fov: 56, dof: [11, 0.005], act(t) {
  const u = t - tFollow;
  trucks.forEach((tr, i) => place(tr, 50 + u * 9 + i * -13, 0.05, RD - 1.5, 0, Math.PI / 2, 0));
  const cr = keepCar(); place(cr, 61, 0.05, RD + 3.4, 0, Math.PI / 2, 0);
  put(sam, 61.5, 0.05, RD + 5.4, Math.PI + 0.2); pose(sam, 'crouch'); sam.headPivot.rotation.y = -0.4; setFace(sam, 'determined');
} });
function keepCar() { return floatCars[2]; }
// 28 "all the way to the old clock tower" - tower at dusk
S(W('all', 48.8), { light: 'dusk', c: [TOWER[0], 0, TOWER[1]], cam: [[TOWER[0] + 40, 22, TOWER[1] + 70], [TOWER[0] + 33, 26, TOWER[1] + 58], [TOWER[0], 40, TOWER[1]]], fov: 52, act(t) {
  TW.face.set(5, 0);
  trucks.forEach((tr, i) => place(tr, TOWER[0] + 8 + i * 6, 0.07, TOWER[1] + 18 + i * 3, 0, -0.4, 0));
} });
// interior shots ------------------------------------------------
const IC = [1000, 0, 0];
const ix = (x) => 1000 + x;
function machine(t) { TI.gears.forEach((g, i) => (g.rotation.z = t * (i % 2 ? -0.6 : 0.8))); TI.coils.forEach((c, i) => (c.rotation.z = t * (1 + i * 0.3))); TI.core.material.emissiveIntensity = 1.4 + 0.4 * Math.sin(t * 8); }
const WALK = 18.4, RAILZ = -8.8;
// 29 "Inside was a giant machine"
S(W('inside', 51.3), { light: 'indoor', c: IC, cam: [[ix(-3), 9, 30], [ix(-2), 11, 26], [ix(1), 17, -6]], fov: 62, act(t) {
  machine(t); TI.setNeedle(0.25); TI.setCount(600);
  workers.forEach((a, i) => { put(a, ix(-7 + i * 15), 0, 3 - i * 2, i ? -0.6 : 0.8); walk(a.av, t + i, 1.2, 0.4); setFace(a, 'deadpan'); });
  guards.forEach((a, i) => { put(a, ix(-4 + i * 10), WALK, -11.5, 0.1); pose(a, 'crossArms'); setFace(a, 'deadpan'); });
} });
// 30 "with one huge lever"
S(W('huge', 53.2), { light: 'indoor', c: IC, cam: [[ix(6.5), 23.5, -2.5], [ix(7.6), 23, -4], [ix(12), 22, -10.8]], fov: 44, dof: [8, 0.012], act(t) { machine(t); TI.pivot.rotation.x = 0.5; } });
// 31 "and he was pushing it all the way"
const tPush = W('and', 54.2);
S(tPush, { light: 'indoor', c: IC, cam: [[ix(3.5), 24, -1.6], [ix(4.6), 23.6, -2.6], [ix(10.6), 22.5, -10.6]], fov: 46, dof: [10, 0.01], act(t) {
  machine(t); const k = smooth((t - tPush) / 1.4); TI.pivot.rotation.x = 0.5 - 1.1 * k;
  put(rich, ix(10.2), WALK, -7.6, Math.PI - 0.5); pose(rich, 'push'); wearBoots(rich); talkFace(rich, WORDS, t, 'smug_talk', 'smug');
} });
// 32 "to forever" - gauge needle swings to infinity
const tForever = W('forever', 55.5);
S(W('to', 55.4), { light: 'indoor', c: IC, cam: [[ix(2), 25, -4], [ix(2), 25, -6], [ix(2), 25, -13.3]], fov: 44, act(t) { TI.setNeedle(0.25 + 0.75 * smooth((t - tForever + 0.2) / 0.5) + 0.02 * Math.sin(t * 40)); } });
// 33 "In ten minutes, gravity would switch off for good"
const tTen = W('in', 56.3);
S(tTen, { light: 'indoor', c: IC, cam: [[ix(-2), 28, -1], [ix(-0.5), 28, -1], [ix(16.6), 28, -1]], fov: 46, act(t) { TI.setCount(600 - Math.max(0, t - tTen - 1.5), Math.floor(t * 2) % 2 === 0); } });
// 34 "and anyone without his boots would float into space"
const SP = [-60, 0, -100];
S(W('and', 59), { light: 'dusk', c: SP, cam: [[SP[0] + 2, 22, SP[2] + 26], [SP[0] + 2, 23, SP[2] + 24], [SP[0] - 2, 38, SP[2] - 5]], fov: 62, act(t) {
  stars.visible = true; stars.position.set(SP[0], 0, SP[2]);
  folkFloat(folk, t, (i) => [SP[0] - 7 + (i % 4) * 4.5, 22 + i * 3.2 + (t - 59) * 5, SP[2] - 2 - (i % 3) * 3], 0.6);
} });
// 35 "I ran up the stairs"
const tStairs = W('i', 61.7);
S(tStairs, { light: 'indoor', c: IC, cam: [[ix(-4), 7, 13], [ix(-5), 11, 9], [ix(-14.7), 7, 2], [ix(-14.7), 12, -3]], fov: 52, act(t) {
  machine(t); const u = clamp01((t - tStairs) / 1.0), step = 6 + u * 9;
  put(sam, ix(-14.7), 0.9 + step * 0.75, 12 - 2 - step * 1.0 + 1.0, Math.PI); run(sam.av, t); setFace(sam, 'determined');
} });
// 36 "but then the siren went off" - alarms
const tAlarm = W('but', 62.6);
S(tAlarm, { light: 'indoor', c: IC, cam: [[ix(-10), 22, 6], [ix(-9), 23, 4.5], [ix(-13), 18, -6]], fov: 50, act(t) {
  machine(t); TI.alarm(t - tAlarm);
  put(sam, ix(-13.6), WALK, -10.5, Math.PI / 2); pose(sam, 'flinch'); setFace(sam, 'shock');
} });
// gravity off inside: everyone rises toward the ceiling
const tUp = W('everyone', 64);
function insideFloat(t, withRich = true) {
  const k = smooth((t - tUp + 0.3) / 2.2);
  const WEND = [[-5, 27, 2], [7, 29, -1]], GEND = [[-2, 32, -7], [5, 33, -5]];
  workers.forEach((a, i) => { const s0 = [-7 + i * 15, 0, 3 - i * 2], e = WEND[i]; put(a, ix(lerp(s0[0], e[0], k)), lerp(s0[1], e[1], k) + bob(t, i) * k, lerp(s0[2], e[2], k), i * 2 + t * 0.3); pose(a, 'flail'); drift(a, t, i, k); setFace(a, 'shock'); });
  guards.forEach((a, i) => { const s0 = [-4 + i * 10, WALK, -11.5], e = GEND[i]; put(a, ix(lerp(s0[0], e[0], k)), lerp(s0[1], e[1], k) + bob(t, i + 2) * k, lerp(s0[2], e[2], k), 0.1 + t * 0.2 * (i ? 1 : -1)); pose(a, 'flail'); drift(a, t, i + 3, k); setFace(a, 'scared_talk'); });
  if (withRich) { const kr = smooth((t - W('even', 66.7) + 0.4) / 3.0); put(rich, ix(10.2), WALK + 0.02 + 9 * kr + bob(t, 4) * kr, -10, Math.PI - 0.5); pose(rich, kr > 0.05 ? 'flail' : 'push'); if (kr > 0.05) drift(rich, t, 5); setFace(rich, kr > 0.05 ? 'shock' : 'smug');
    [bootsL, bootsR].forEach((b, i) => place(b, ix(9.6 + i * 1.2), WALK + 0.02, -10 + i * 0.3, 0, Math.PI - 0.5, 0)); }
}
// 37 "Everyone floated away"
S(tUp, { light: 'indoor', c: IC, cam: [[ix(0), 20, 30], [ix(0), 23, 27], [ix(1), 26, -6]], fov: 64, act(t) { machine(t); TI.alarm(t - tAlarm); insideFloat(t); cling(sam, ix(-11.5), 20.6, RAILZ, 0, t, 1); } });
// 38 "The guards, the workers,"
S(W('the', 65.3), { light: 'indoor', c: IC, cam: [[ix(1), 25, 12], [ix(1.5), 26, 10], [ix(1), 30, -6]], fov: 58, dof: [16, 0.005], act(t) { machine(t); TI.alarm(t - tAlarm); insideFloat(t); } });
// 39 "even the richest man" - floats right out of his boots
S(W('even', 66.7), { light: 'indoor', c: IC, cam: [[ix(3), 22, 2], [ix(3.4), 23, 1], [ix(10), 25, -10]], fov: 60, dof: [14, 0.005], act(t) { machine(t); TI.alarm(t - tAlarm); insideFloat(t); } });
// 40 "Everyone, except me," - wide: everyone at the ceiling, Sam on the railing
S(W('everyone', 68), { light: 'indoor', c: IC, cam: [[ix(-2), 16, 13], [ix(-2), 17, 12], [ix(-6), 22, -8]], fov: 62, act(t) { machine(t); TI.alarm(t - tAlarm); insideFloat(t); cling(sam, ix(-8), 20.6, RAILZ, 0, t, 1); } });
// 41 "because I was hugging the railing with my eyes closed, like always."
S(W('because', 69.5), { light: 'indoor', c: IC, cam: [[ix(-4.0), 22.2, -2.6], [ix(-4.6), 22.3, -3.4], [ix(-8), 23.0, RAILZ]], fov: 46, dof: [6.0, 0.014], act(t) { machine(t); TI.alarm(t - tAlarm); cling(sam, ix(-8), 20.6, RAILZ, 0, t, 1, 'squeeze_talk' === '' ? '' : (WORDS.find(([s, e]) => t >= s && t < e) && Math.floor(t * 9) % 2 ? 'squeeze_talk' : 'squeeze')); } });
// 42 "For the first time, being scared was a superpower." - eyes open, determined, low angle
const tHero = W('for', 73.1);
S(tHero, { light: 'indoor', c: IC, cam: [[ix(-7.2), 18.2, -4.2], [ix(-7.5), 18.6, -5.0], [ix(-8), 24, RAILZ]], fov: 50, dof: [5, 0.012], act(t) { machine(t); TI.alarm(t - tAlarm); cling(sam, ix(-8), 20.6, RAILZ, 0, t, 1, t < tHero + 0.5 ? 'squeeze' : 'determined'); } });
// 43 "I pulled myself up, hand over hand"
const tPull = W('i', 76.1), tLever = W('all', 78.2);
const samX = (t) => lerp(-8, 10.6, smooth((t - tPull) / (tLever - tPull + 0.8)));
S(tPull, { light: 'indoor', c: IC, cam: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], camFn(t) { const x = ix(samX(t)); camera.position.set(x - 2.5, 23.2, -0.8); camera.lookAt(x + 0.8, 22.6, RAILZ); }, fov: 50, act(t) {
  machine(t); TI.alarm(t - tAlarm); insideFloat(t);
  cling(sam, ix(samX(t)), 20.6, RAILZ, 0, t, 1, 'determined'); const s = Math.sin(t * 9); sam.armL.rotation.x = -2.9 + s * 0.35; sam.armR.rotation.x = -2.9 - s * 0.35;
} });
// 44 "all the way to the lever"
S(tLever, { light: 'indoor', c: IC, cam: [[ix(5.5), 23, 0], [ix(6.2), 23, -1], [ix(11), 23, -9.5]], fov: 52, dof: [10, 0.008], act(t) {
  machine(t); TI.alarm(t - tAlarm); TI.pivot.rotation.x = -0.6;
  cling(sam, ix(samX(t)), 20.6, RAILZ, 0, t, 1, 'determined_talk');
} });
// 45 "and yanked it back"
const tYank = W('yanked', 79.4);
S(W('and', 79.4), { light: 'indoor', c: IC, cam: [[ix(6.6), 21, -2], [ix(6.2), 21.4, -1.2], [ix(11.6), 23, -9.6]], fov: 52, act(t) {
  machine(t); TI.alarm(t - tAlarm);
  const k = smooth((t - tYank) / 0.25); TI.pivot.rotation.x = -0.6 + 1.25 * k;
  cling(sam, ix(10.6), 20.6, RAILZ, 0, t, 1, k > 0.5 ? 'shock' : 'determined');
  grade.uniforms.flash.value = Math.max(0, 1 - Math.abs(t - tYank - 0.3) / 0.25) * 0.85;
} });
// 46 "Gravity slammed on" - everyone drops
const tSlam = W('gravity', 80.8);
S(tSlam, { light: 'indoor', c: IC, cam: [[ix(0), 18, 30], [ix(0), 16, 28], [ix(2), 13, -6]], fov: 62, act(t) {
  machine(t); TI.pivot.rotation.x = 0.65;
  const f = (d) => clamp01((t - tSlam - d) / 0.45) ** 2;
  workers.forEach((a, i) => { put(a, ix(-7 + i * 15), 26 * (1 - f(i * 0.1)), 3 - i * 2, i); pose(a, f(i * 0.1) >= 1 ? 'kneel' : 'flail'); setFace(a, 'shock'); });
  guards.forEach((a, i) => { put(a, ix(-4 + i * 10), WALK + 14 * (1 - f(0.15 + i * 0.1)), -9, 0.1); pose(a, f(0.15) >= 1 ? 'kneel' : 'flail'); setFace(a, 'shock'); });
  put(rich, ix(9), WALK + 16 * (1 - f(0.3)), -9.5, Math.PI - 0.5); pose(rich, f(0.3) >= 1 ? 'kneel' : 'flail'); setFace(rich, 'shock');
  put(sam, ix(10.6), WALK, RAILZ - 1.2, 0.3); pose(sam, 'tada'); setFace(sam, 'happy');
} });
// 47 "and the whole town dropped into the lake" - dusk aerial, splashes
const tLake = W('and', 81.7);
S(tLake, { light: 'dusk', c: [LAKE[0], 0, LAKE[1]], cam: [[LAKE[0] + 6, 30, LAKE[1] + 46], [LAKE[0] + 4, 27, LAKE[1] + 40], [LAKE[0], 6, LAKE[1] - 14]], fov: 54, act(t) {
  TW.face.set(5, 15); LK.water.draw(t);
  const u = t - tLake;
  const drops = [...folk, kid1, kid2, mom, dad];
  drops.forEach((a, i) => {
    const d = i * 0.12, x = LAKE[0] - 30 + (i * 37) % 60, z = LAKE[1] - 12 + (i * 13) % 24;
    const y = Math.max(-1.5, 40 - 60 * Math.max(0, u - d) ** 2 * 0.9);
    put(a, x, y, z, i); pose(a, 'flail'); setFace(a, 'shock');
  });
  floatCars.forEach((c, i) => place(c, LAKE[0] - 18 + i * 17, Math.max(-1, 46 - 50 * Math.max(0, u - 0.4 - i * 0.2) ** 2), LAKE[1] - 6 + i * 4, i, i * 1.2, 0.4));
  splashAt(drops.map((a, i) => [LAKE[0] - 30 + (i * 37) % 60, LAKE[1] - 12 + (i * 13) % 24, tLake + i * 0.12 + Math.sqrt(41.5 / 54)]), t);
} });
const m4 = new THREE.Matrix4();
function splashAt(list, t) {
  splash.visible = true; let n = 0;
  for (const [x, z, t0] of list) for (let k = 0; k < 10 && n < SPL; k++, n++) {
    const u = t - t0;
    if (u < 0 || u > 1.6) { m4.makeScale(0, 0, 0); splash.setMatrixAt(n, m4); continue; }
    const a = k / 10 * 6.283, sp = 3 + (k % 3);
    m4.makeTranslation(x + Math.cos(a) * sp * u, Math.max(0, 7 * u - 9 * u * u) + 0.2, z + Math.sin(a) * sp * u);
    const s = 1.3 * (1 - u / 1.6); m4.multiply(new THREE.Matrix4().makeScale(s, s, s)); splash.setMatrixAt(n, m4);
  }
  for (; n < SPL; n++) { m4.makeScale(0, 0, 0); splash.setMatrixAt(n, m4); }
  splash.instanceMatrix.needsUpdate = true;
}
// 48 "Now I'm a hero." - plaza celebration, confetti
const tHeroDay = W('now', 84);
S(tHeroDay, { ...DAY, c: [TOWER[0], 0, TOWER[1] + 26], cam: [[TOWER[0] + 3, 4.2, TOWER[1] + 46], [TOWER[0] + 2.4, 4.6, TOWER[1] + 42], [TOWER[0], 5, TOWER[1] + 30]], fov: 46, dof: [12, 0.006], act(t) {
  TW.face.set(3, 0);
  put(sam, TOWER[0], 0.06, TOWER[1] + 30, 0); pose(sam, 'cheer'); sam.av.body.position.y = 2 + Math.abs(Math.sin(t * 6)) * 0.4; setFace(sam, 'happy_talk');
  folk.forEach((a, i) => { const side = i % 2 ? 1 : -1; put(a, TOWER[0] + side * (3 + (i >> 1) * 2.4), 0.06, TOWER[1] + 33 + (i % 3), side * -0.6); pose(a, 'cheer'); a.av.body.position.y = 2 + Math.abs(Math.sin(t * 7 + i)) * 0.4; setFace(a, 'happy'); });
  confettiAt([TOWER[0], 16, TOWER[1] + 32], t - tHeroDay);
} });
function confettiAt(c, u) {
  confetti.visible = true;
  for (let i = 0; i < CONF; i++) {
    const a = i * 2.399, r = 2 + (i % 13) * 1.2;
    m4.makeRotationFromEuler(new THREE.Euler(u * 3 + i, u * 2 + i * 0.5, 0));
    m4.setPosition(c[0] + Math.sin(a) * r + Math.sin(u * 2 + i) * 0.6, c[1] - ((u * 4 + (i % 17)) % 16), c[2] + Math.cos(a) * r * 0.6);
    confetti.setMatrixAt(i, m4);
  }
  confetti.instanceMatrix.needsUpdate = true;
}
// 49 "They even built a statue of me" - tilt up the tower
const tStatue = W('they', 85.3);
S(tStatue, { ...DAY, c: [TOWER[0], 40, TOWER[1]], cam: [[TOWER[0] + 14, 6, TOWER[1] + 40], [TOWER[0] + 14, 10, TOWER[1] + 40], [TOWER[0], 20, TOWER[1]], [TOWER[0], 80, TOWER[1]]], fov: 58, act(t) { TW.face.set(3, 2); statueOnTop(t); } });
function statueOnTop(t) { TW.top.updateWorldMatrix(true, false); const p = TW.top.getWorldPosition(new THREE.Vector3()); put(statue, p.x, p.y, p.z, 0.4); pose(statue, 'tada'); }
// 50 "on top of the clock tower" - the statue up close, the whole town below
S(W('on', 86.6), { ...DAY, c: [TOWER[0], 80, TOWER[1]], cam: [[TOWER[0] + 12, 93, TOWER[1] + 16], [TOWER[0] + 10.5, 92, TOWER[1] + 14], [TOWER[0], 89.5, TOWER[1]]], fov: 44, dof: [17, 0.004], act(t) { statueOnTop(t); } });
// 51 "I've never seen it." - Sam at the bottom, clinging to the tower, eyes shut
const tNever = W("i've", 88.2);
S(tNever, { ...DAY, c: [TOWER[0], 0, TOWER[1] + 8], cam: [[TOWER[0] + 13, 2.4, TOWER[1] + 21], [TOWER[0] + 12.4, 2.2, TOWER[1] + 20], [TOWER[0] + 5, 8, TOWER[1] + 7]], fov: 60, dof: [14, 0.005], act(t) {
  put(sam, TOWER[0] + 6.2, 3.0, TOWER[1] + 8.4, -2.3); pose(sam, 'hug'); talkFace(sam, WORDS, t, 'squeeze_talk', 'squeeze');
} });
SHOTS.sort((a, b) => a.t - b.t);

// ---------------------------------------------------------------- render
const LIGHTS = []; scene.traverse((o) => { if (o.isPointLight || o.isSpotLight) LIGHTS.push(o); });
const INTERIOR_LIGHTS = []; TI.g.traverse((o) => { if (o.isPointLight) INTERIOR_LIGHTS.push([o, o.intensity]); });
function shotIndex(t) { let i = 0; SHOTS.forEach((x, j) => { if (t >= x.t) i = j; }); return i; }
window.renderAt = (t) => { window.__t = t;
  const i = shotIndex(t), s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END;
  const k = clamp01((t - s.t) / (t1 - s.t));
  hideAll();
  const inTower = s.c && s.c[0] > 900 && Math.abs(s.c[2]) < 50;
  INTERIOR_LIGHTS.forEach(([l, v]) => { if (l.color.r < 0.99 || l.color.g > 0.5) l.intensity = inTower ? v : 0; });
  setLight(s.light, s.c || [0, 0, 0], s.sun);
  if (s.light === 'dusk' || s.light === 'night') { setWindows(0.8); setLamps(1.2); }
  s.act(t, k);
  const [from, to, look, lookTo] = s.cam;
  camera.position.set(...from.map((v, j) => lerp(v, to[j], k)));
  camera.fov = s.fov || 45; camera.updateProjectionMatrix();
  camera.lookAt(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  if (s.camFn) s.camFn(t);
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (s.dof) { bokeh.enabled = true; bokeh.uniforms.focus.value = s.dof[0]; bokeh.uniforms.aperture.value = s.dof[1]; bokeh.uniforms.maxblur.value = 0.02; }
  else bokeh.enabled = false;
  composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.READY = true;
window.__dbg = () => ({ cam: camera.position.toArray().map((v) => +v.toFixed(1)), sam: sam.wrap.visible ? sam.wrap.position.toArray().map((v) => +v.toFixed(1)) : null, samRot: sam.tilt.rotation.z.toFixed(2), folk0: folk[0].wrap.visible ? folk[0].wrap.position.toArray().map((v) => +v.toFixed(1)) : null, shot: SHOTS.findIndex((s, i) => s.t <= window.__t && (!SHOTS[i + 1] || SHOTS[i + 1].t > window.__t)) });
