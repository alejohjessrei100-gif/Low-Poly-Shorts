// Episode 03 "The Mountain Whisper" (52 s). Snowy mountain village. House rules: no blur, steady expressions,
// mostly wide shots (HOUSE_RULES.framing), detailed set with ambient life, clip-checked + autofixed.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { makeAvatar, pose, setFace, talkFace, walk, run, reset } from '../../kit/avatar.js';
import { car, setLamps } from '../../kit/town.js';
import { buildAlpine, mountain } from '../../kit/alpine.js';
import { snowfall, smoke, birds, flags, rings } from '../../kit/life.js';
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
const DECK = 0.6, EDGE = -133.4;

// ---------------------------------------------------------------- world + life
const V = buildAlpine(scene);
const M = mountain(scene);
const SNOW = snowfall(scene);
const SMOKE = smoke(scene, V.chimneys.slice(0, 30));
const BIRDS = birds(scene, [10, 45, -70], 16, 40);
const FLAGS = flags(scene, [[-12, 0.6, -128, 9], [12, 0.6, -128, 9], [-18, 0, -100, 8], [18, 0, -100, 8]]);
const RINGS = rings(scene, 7), BACK = rings(scene, 5, 0xbfe6ff), SOFT = rings(scene, 6, 0xdff4ff);
const ropeSign = P.sign(scene, ['ECHO POINT', 'ASK PIP'], 0, 0, 0, 0, 5, 2.4, { bg: '#f2e6cf', fg: '#5a3a2a', border: '#e8434f' });
const rope = [0, 1, 2, 3, 4, 5].map(() => P.cyl(0.18, 0.2, 2.4, P.std(0xc8a050, { metalness: 0.5 }), 0, 0, 0, scene, 8));
const ropeLine = P.box(18, 0.12, 0.12, P.std(0xe8434f), 0, 0, 0, scene);

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
const pip = actor('pip', { shirt: 0x2f6b9a, pants: 0x3a3a5a, hair: 0x6b3a1a, hairStyle: 'short', skin: 0xf2c9a0, hat: 'beanie', beanieCol: 0xe8434f, scarf: 0xf2c14e, scale: 0.8 });
const rich = actor('rich', { shirt: 0x8a5a3c, pants: 0x22222e, hair: 0x9a9a9a, hairStyle: 'short', skin: 0xf2c9a0, hat: 'tophat', scarf: 0xffffff, glasses: true, scale: 1.05 });
const LOOKS = [
  { shirt: 0xe8434f, pants: 0x3a4a7a, hairStyle: 'short', hair: 0x2a1a12, skin: 0xc98d62, hat: 'beanie', beanieCol: 0x2f6b9a, scarf: 0xffffff },
  { shirt: 0xf2c14e, pants: 0x5a4a3a, hairStyle: 'bun', hair: 0xd9a066, skin: 0xf2c9a0, scarf: 0xe8434f, apron: 0xffffff },
  { shirt: 0x2f8f5a, pants: 0x2a2a3a, hairStyle: 'messy', hair: 0x111111, skin: 0x8a5a3c, hat: 'beanie', beanieCol: 0xf2c14e },
  { shirt: 0x6fb6ff, pants: 0x4a5a7a, hairStyle: 'short', hair: 0x6b3a1a, skin: 0xf6c89a, scarf: 0x2f6b9a },
  { shirt: 0xff8fc8, pants: 0x3a3a5a, hairStyle: 'ponytail', hair: 0x2a1a12, skin: 0xe8b48a, hat: 'beanie', beanieCol: 0xffffff },
  { shirt: 0xb98cf0, pants: 0x2f4a8a, hairStyle: 'short', hair: 0x9a9a9a, skin: 0xe8b48a, glasses: true, scarf: 0xb5523b },
  { shirt: 0xf2853a, pants: 0x4a3a2a, hairStyle: 'messy', hair: 0xd9b25a, skin: 0xf6c89a, hat: 'beanie', beanieCol: 0x2f8f5a },
  { shirt: 0x5fb0a6, pants: 0x2a2a3a, hairStyle: 'ponytail', hair: 0xd9a066, skin: 0xc98d62, scarf: 0xf2c14e },
];
const folk = LOOKS.map((o, i) => actor('folk' + i, o));

// props
const props = [];
const keep = (o) => { props.push(o); return o; };
const mega = keep(new THREE.Group()); scene.add(mega);
{ const c = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.35, 3.4, 20, 1, true), P.std(0xf2c14e, { metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide })); c.rotation.x = Math.PI / 2; c.position.z = 1.7; mega.add(c); P.box(0.3, 1.0, 0.3, P.std(0x2b2f45), 0, -0.6, 0.4, mega); }
const limo = keep(car(scene, 0, 0, 0x1b1b24)); limo.scale.set(1.15, 1.05, 1.7);
const flowers = keep(new THREE.Group()); scene.add(flowers);
{ P.cyl(0.08, 0.08, 1.2, P.std(0x2f8f5a), 0, 0, 0, flowers, 6); [0xff4d6d, 0xffd84d, 0xff8fc8, 0xffffff].forEach((c, i) => { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), P.std(c)); f.position.set(Math.sin(i * 1.6) * 0.3, 0.7, Math.cos(i * 1.6) * 0.3); flowers.add(f); }); }
let msgs = 0;
const phoneScreen = P.liveScreen(256, 448, (c, w, h) => {
  c.fillStyle = '#10142a'; c.fillRect(0, 0, w, h);
  const q = ['will it snow?', "what's for dinner?", 'does she like me??', 'where are my keys', 'is the mountain ok', 'can i ask 1 more'];
  c.font = '800 22px Poppins';
  for (let i = 0; i < Math.min(msgs, q.length); i++) { c.fillStyle = '#5fb6ff'; c.beginPath(); c.roundRect(16, 20 + i * 66, w - 40, 52, 14); c.fill(); c.fillStyle = '#fff'; c.fillText(q[i], 28, 54 + i * 66); }
});
const phone = keep(new THREE.Group()); scene.add(phone);
{ P.box(0.9, 1.6, 0.12, P.std(0x1b1b24), 0, 0, 0, phone, 0.08); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.45), new THREE.MeshBasicMaterial({ map: phoneScreen.tex })); s.position.z = 0.07; phone.add(s); }
const puffs = [0, 1, 2, 3, 4, 5, 6, 7].map(() => { const m = keep(new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }))); scene.add(m); return m; });

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.wrap.visible = false; a.wrap.position.set(0, -80, 0); }
  for (const p of props) p.visible = false;
  RINGS.hide(); BACK.hide(); SOFT.hide();
  ropeSign.visible = false; rope.forEach((r) => (r.visible = false)); ropeLine.visible = false;
  M.setFace(0, false); M.setCrack(0); M.slip(0);
  grade.uniforms.flash.value = 0; setLamps(0.8);
}
function hold(obj, hand, pos = [0, 0, 0], rot = [0, 0, 0]) {
  obj.visible = true; hand.updateWorldMatrix(true, false);
  obj.position.copy(hand.localToWorld(v3(pos)));
  obj.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
const place = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.visible = true; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };
const mouth = (a) => { a.head.updateWorldMatrix(true, false); return a.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.2, 0)); };
// background villagers strolling the lane (wide shots)
function strollers(t, n = 6, zc = -40) {
  [[-3.5, 1], [3.6, -1], [-2.2, 1], [4.2, -1], [-4.4, -1], [2.4, 1]].slice(0, n).forEach(([x, d], i) => {
    const a = folk[i]; const z = zc + 30 - ((t * 1.4 * (0.8 + i * 0.07) + i * 9) % 60);
    put(a, x, 0, d > 0 ? z : 2 * zc - z, d > 0 ? Math.PI : 0); walk(a.av, t + i * 0.4, 1.2, 0.4); setFace(a, 'smile');
  });
}
function shouter(a, x, z, yaw = Math.PI, y = DECK) { put(a, x, y, z, yaw); pose(a, 'yell'); setFace(a, 'yell'); }
const crackK = (t) => clamp01((t - W('crack', 25) + 0.4) / 1.2) * 0.6 + clamp01((t - W('worse', 31.8)) / 1.0) * 0.4;
const healK = (t) => 1 - clamp01((t - W('whispered', 45) - 0.2) / 1.6);
function slope(t) { const k = crackK(t) * healK(t); M.setCrack(k); M.slip(t > W('worse', 31.8) ? 3 * healK(t) * smooth((t - W('worse', 31.8)) / 0.8) : 0); }

// ---------------------------------------------------------------- shots
const SHOTS = [];
// far(): pull a shot's camera k times further from its look point (wider framing, house rule 9)
const far = (o, k) => { const [a, b, l, l2] = o.cam; const L = l2 || l; const f = (p) => p.map((v, j) => L[j] + (v - L[j]) * k); return { ...o, cam: [f(a), f(b), l, l2].filter(Boolean) }; };
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const A = { light: 'alpine' }, ST = { light: 'storm' };
const FACE = M.faceCenter;

// 0 "In this town," aerial over the village to the mountain
S(0, { ...A, c: [0, 0, -40], cam: [[0, 58, 70], [0, 50, 48], [0, 40, -260]], fov: 55, act(t) { strollers(t); } });
// 1 "the mountain talks back." the face lights up
const tTalks = W('talks', 1);
S(W('the', 0.8), { ...A, c: [0, 0, -120], cam: [[16, 30, -96], [13, 34, -108], [0, 220, -460]], fov: 55, act(t) { M.setFace(t > tTalks ? 1 : 0.2, t > tTalks && t < tTalks + 0.9); } });
// 2 "You see, if you shout a question at the mountain," a villager shouts from Echo Point
const tShout = W('shout', 3);
S(W('you', 2.4), far({ ...A, c: [0, 0, -120], cam: [[20, 8, -126], [18.5, 8, -127.5], [-1, 5, -134]], fov: 55, act(t) {
  shouter(folk[0], -2, EDGE, Math.PI); put(folk[3], 4, DECK, -129, 2.6); pose(folk[3], 'idle'); setFace(folk[3], 'smile'); strollers(t, 2, -100);
  RINGS.update(t - tShout, mouth(folk[0]), FACE, { size: 14, dur: 2.2, gap: 0.35 });
} }, 1.35));
// 3 "the echo gives you the answer." echo rings come back
const tEcho = W('echo', 4.5);
S(W('the', 4.6), { ...A, c: [0, 0, -120], cam: [[3, 9, -108], [3, 10, -112], [0, 110, -460]], fov: 58, act(t) {
  shouter(folk[0], -2, EDGE, Math.PI); pose(folk[0], 'idle'); setFace(folk[0], 'happy');
  M.setFace(1, Math.floor((t - tEcho) * 3) % 2 === 0); BACK.update(t - tEcho, FACE, mouth(folk[0]), { size: 12, dur: 2.0, gap: 0.3 });
} });
// 4 "My name is Pip," on the lane, village behind
S(W('my', 6.4), { ...A, c: [0, 0, -40], cam: [[-3, 4.6, -24], [-2.5, 4.5, -26], [3, 3, -40]], fov: 52, act(t) {
  put(pip, 3, 0, -40, -0.35); pose(pip, 'wave'); pip.armR.rotation.z = 2.3 + 0.3 * Math.sin(t * 10); setFace(pip, 'smile'); strollers(t, 4, -55);
} });
// 5 "and I'm the quietest kid in the whole village." loud villagers all around
S(W('and', 7.4), { ...A, c: [0, 0, -40], cam: [[9, 11, -8], [8, 10.5, -12], [0, 3, -44]], fov: 55, act(t) {
  put(pip, 0.5, 0, -42, 0.2); pose(pip, 'shy'); setFace(pip, 'deadpan');
  [[-3.5, -38, 0.6], [3.8, -36, -0.7], [-4, -47, 0.3], [4.4, -48, -0.4], [-1.5, -52, 0], [2.4, -30, -2.8]].forEach(([x, z, r], i) => { const a = folk[i]; put(a, x, 0, z, r); pose(a, i % 2 ? 'cheer' : 'point'); setFace(a, 'happy'); });
} });
// 6 "I've never asked the mountain anything, because nobody can hear me." Pip behind the shouting crowd
S(W("i've", 9.6), { ...A, c: [0, 0, -120], cam: [[14, 8, -108], [12, 8, -111], [0, 3, -131]], fov: 55, act(t) {
  [[-7, EDGE], [-2, EDGE + 0.4], [3, EDGE]].forEach(([x, z], i) => shouter(folk[i], x, z));
  put(pip, 6.5, DECK, -129.5, Math.PI - 0.4); pose(pip, 'idle'); pip.armR.rotation.z = 2.4; setFace(pip, 'deadpan');
  RINGS.update(t - 9.7, mouth(folk[1]), FACE, { size: 12, dur: 2, gap: 0.3 });
} });
// 7 "Everyone else shouts all day." wide over the whole crowd at Echo Point
S(W('everyone', 12.6), { ...A, c: [0, 0, -120], cam: [[0, 22, -96], [0, 20, -101], [0, 12, -170]], fov: 58, act(t) {
  [-9, -6, -3, 0, 3, 6, 9].forEach((x, i) => shouter(folk[i], x, EDGE + (i % 2) * 0.6));
  RINGS.update(t - 12.8, v3([0, 4, EDGE]), FACE, { size: 18, dur: 2.2, gap: 0.25 });
} });
// 8 "What's for dinner?" the cocoa-stall lady yells at the mountain
S(W("what's", 14.4), { ...A, c: [0, 0, -105], cam: [[5, 5.2, -88], [4.4, 5, -90], [-6, 3.6, -104]], fov: 52, act(t) { strollers(t, 3, -80); shouter(folk[1], -6, -104, Math.PI + 0.2, 0); } });
// 9 "Will it snow?" a man standing on the bench in the square
S(W('will', 15.2), far({ ...A, c: [0, 0, -115], cam: [[-1, 6, -104], [-1.5, 6, -106], [-13, 4.8, -120]], fov: 52, act(t) { shouter(folk[2], -13, -120, Math.PI - 0.6, 1.25); } }, 1.35));
// 10 "Does she like me?" a boy with flowers, the girl blushing nearby
S(W('does', 16), { ...A, c: [0, 0, -125], cam: [[-9, 6, -112], [-8, 6, -114], [5, 3.6, -130]], fov: 55, act(t) {
  shouter(folk[3], 4, EDGE + 0.6, Math.PI - 0.2); hold(flowers, folk[3].handL, [0, -0.5, 0.2], [0.6, 0, 0]); folk[3].armL.rotation.set(-0.6, 0, 0.2);
  put(folk[4], 10, DECK, -128, -2.2); pose(folk[4], 'shy'); setFace(folk[4], 'blush');
} });
// 11 "Then a rich guy from the city showed up" a black limo climbs the lane
const tLimo = W('then', 17.3);
S(tLimo, far({ ...A, c: [0, 0, -10], cam: [[-4.5, 8, -40], [-4.2, 7.5, -42], [0, 2, 8]], fov: 55, act(t) {
  const u = t - tLimo; place(limo, 0, 0, 34 - u * 9, 0, Math.PI, 0);
  [[-4.5, -12, 2.6], [4.6, -16, -2.8], [-4.8, -22, 2.9]].forEach(([x, z, r], i) => { const a = folk[i]; put(a, x, 0, z, r); pose(a, 'idle'); setFace(a, 'shock'); });
} }, 1.35));
// 12 "with a giant megaphone" in the square
S(W('giant', 19.2), { ...A, c: [0, 0, -100], cam: [[8, 5.4, -86], [7.2, 5.2, -88], [0, 4.2, -100]], fov: 52, act(t) {
  put(rich, 0, 0, -100, 0.4); pose(rich, 'offer'); rich.armL.rotation.set(-1.5, 0, 0.2); setFace(rich, 'smug');
  hold(mega, rich.handR, [0, -0.2, 0.3], [0, 0, 0]); mega.scale.setScalar(0.75);
  place(limo, -1, 0, -84, 0, Math.PI - 0.3, 0);
} });
// 13 "and asked where the gold was hidden." a huge shout from Echo Point
const tGold = W('asked', 20.3);
S(W('and', 20.1), { ...A, c: [0, 0, -120], cam: [[-16, 9, -112], [-14, 9.5, -115], [0, 2, -168]], fov: 58, act(t) {
  put(rich, 0, DECK, EDGE, Math.PI); pose(rich, 'yell'); setFace(rich, 'yell'); hold(mega, rich.handR, [0, -0.3, 0.6], [-0.2, 0, 0]);
  [[-6, -127], [5, -126.5], [8.5, -129]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, DECK, z, Math.PI + (x > 0 ? 0.5 : -0.5)); pose(a, 'flinch'); setFace(a, 'scared'); });
  RINGS.update(t - tGold, mouth(rich).add(v3([0, 0, -3])), FACE, { size: 40, dur: 1.8, gap: 0.2 });
} });
// 14 "The mountain said," the face answers
const tSaid = W('said', 22.3);
S(W('the', 22.1), { ...A, c: [0, 0, -120], cam: [[-22, 22, -118], [-20, 26, -124], [0, 220, -460]], fov: 55, act(t) { M.setFace(1, Math.floor((t - tSaid) * 3) % 2 === 0); BACK.update(t - tSaid, FACE, v3([0, 4, EDGE]), { size: 16, dur: 2, gap: 0.3 }); } });
// 15 "right under your feet!" the rich guy looks down
S(W('right', 23), { ...A, c: [0, 0, -125], cam: [[-7, 5, -121], [-6.4, 4.8, -122.4], [0, 3, -133]], fov: 52, act(t) {
  put(rich, 0, DECK, EDGE, 0.25); pose(rich, 'idle'); rich.headPivot.rotation.x = 0.5; setFace(rich, 'shock'); hold(mega, rich.handR, [0, -0.3, 0.6], [-1.2, 0, 0]);
} });
// 16 "And the whole slope started to crack." cracks spread on the slope above the village
S(W('and', 24.2), { ...ST, c: [0, 0, -150], cam: [[24, 46, -190], [20, 50, -200], [0, 110, -440]], fov: 55, act(t) { slope(t); } });
// 17 "One more shout and an avalanche would bury the entire village." from beside the hanging snow
S(W('one', 26.3), { ...ST, c: [0, 0, -80], cam: [[70, 190, -420], [62, 180, -410], [0, 0, -60]], fov: 50, act(t) { slope(t); strollers(t, 4, -50); } });
// 18 "Everybody panicked and started screaming," villagers run down the lane
const tPanic = W('everybody', 29);
S(tPanic, { ...ST, c: [0, 0, -80], cam: [[0, 6, -58], [0, 6.5, -62], [0, 3, -100]], fov: 58, act(t) {
  slope(t);
  [[-3.5, 1], [3, 0.6], [-1, 0.3], [4.5, 1.4], [-4.8, 0.8], [1.5, 1.1], [-2.8, 1.6]].forEach(([x, o], i) => { const a = folk[i]; put(a, x, 0, -96 + (t - tPanic) * 7 + o * 6 - (i % 3) * 4, 0); run(a.av, t + i * 0.3); setFace(a, 'scared_talk'); });
} });
// 19 "which made it worse." the slab slips, snow puffs
const tWorse = W('worse', 31.8);
S(W('which', 31.4), { ...ST, c: [0, 0, -150], cam: [[-22, 50, -195], [-18, 53, -205], [0, 110, -440]], fov: 58, act(t) {
  slope(t);
  puffs.forEach((m, i) => { const u = clamp01((t - tWorse - i * 0.06) / 1.2); if (u <= 0) return; m.visible = true; const c = M.crackCenter; m.position.set(c.x - 90 + i * 26, c.y + 8 + u * 8, c.z + 10 + u * 14); m.scale.setScalar(2 + u * 4); m.material.opacity = 0.8 * (1 - u); });
} });
// 20 "That's when I realized something." Pip in the chaos
S(W("that's", 32.8), { ...ST, c: [0, 0, -110], cam: [[-1, 4.6, -97], [-1.2, 4.5, -99], [2, 3, -112]], fov: 52, act(t) {
  slope(t); put(pip, 2, 0, -112, 0.2); pose(pip, 'idle'); setFace(pip, 'determined');
  [[-3, -108], [5, -116], [-6, -118]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, 0, z + ((t * 5 + i * 3) % 6), 0.3); run(a.av, t + i); setFace(a, 'scared_talk'); });
} });
// 21 "The mountain doesn't need a loud voice." behind Pip, facing the mountain
S(W('the', 34.4), { ...ST, c: [0, 0, -150], cam: [[3, 6, -102], [2.6, 6.4, -104], [0, 120, -460]], fov: 55, act(t) { slope(t); put(pip, 0, 0, -114, Math.PI); pose(pip, 'idle'); setFace(pip, 'determined'); } });
// 22 "It needs a quiet one." side view
S(W('it', 36.4), { ...ST, c: [0, 0, -114], cam: [[10, 4.6, -123], [9.4, 4.5, -122.4], [0, 3, -114]], fov: 52, act(t) { slope(t); put(pip, 0, 0, -114, Math.PI - 0.6); pose(pip, 'idle'); setFace(pip, 'determined'); } });
// 23 "So I walked to the edge," everyone freezes and watches
const tWalk = W('so', 37.8);
S(tWalk, far({ ...ST, c: [0, 0, -125], cam: [[16, 8, -108], [14, 8.4, -111], [0, 2, -128]], fov: 55, act(t) {
  slope(t); const u = clamp01((t - tWalk) / 1.2);
  put(pip, 0, u > 0.85 ? DECK : 0, lerp(-116, EDGE, u), Math.PI); if (u < 1) walk(pip.av, t, 1.4, 0.5); setFace(pip, 'determined');
  [[-9, -118], [-5, -122.5], [5, -125]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, 0, z, Math.PI + (x > 0 ? -0.3 : 0.3)); pose(a, 'idle'); setFace(a, 'scared'); });
} }, 1.35));
// 24 "cupped my hands," close-up (1 of 2)
S(W('cupped', 39), { ...ST, c: [0, 0, -133], cam: [[2.6, 4.4, -137.6], [2.3, 4.3, -137.2], [0, 3.5, EDGE]], fov: 50, act(t) { slope(t); put(pip, 0, DECK, EDGE, Math.PI - 0.15); pose(pip, 'yell'); setFace(pip, 'sleepy'); } });
// 25 "and whispered, please, go back to sleep." soft little rings drift to the mountain
const tWhisper = W('whispered', 40.2);
S(W('and', 40.1), { ...ST, c: [0, 0, -150], cam: [[-3, 5, -122], [-3, 5.4, -123.5], [0, 55, -460]], fov: 55, act(t) {
  slope(t); put(pip, 0, DECK, EDGE, Math.PI); pose(pip, 'yell'); setFace(pip, 'sleepy');
  SOFT.update(t - tWhisper, mouth(pip), FACE, { size: 3, dur: 3, gap: 0.45, opacity: 0.6 });
  [[-8, -122], [7, -121]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, 0, z, Math.PI); pose(a, 'shy'); setFace(a, 'scared'); });
} });
// 26 "And for the first time ever, the mountain whispered back," the face glows softly, the cracks heal, the sky clears
S(W('and', 43.3), { ...A, c: [0, 0, -150], cam: [[10, 16, -125], [9, 19, -130], [0, 230, -460]], fov: 55, act(t) { slope(t); M.setFace(0.7, false); BACK.update(t - W('whispered', 45), FACE, v3([0, 4, EDGE]), { size: 4, dur: 2.4, gap: 0.4, opacity: 0.5 }); } });
// 27 "okay." close-up (2 of 2): Pip's face
S(W('okay', 46.4), { ...A, c: [0, 0, -133], cam: [[-1.8, 4.2, -129.6], [-1.6, 4.1, -130.0], [0, 3.6, EDGE]], fov: 50, act(t) { put(pip, 0, DECK, EDGE, 0.2); pose(pip, 'idle'); setFace(pip, 'happy'); } });
// 28 "Now I'm the only one allowed to talk to the mountain." rope, sign, queue
S(W('now', 47.8), far({ ...A, c: [0, 0, -125], cam: [[16, 9, -106], [14, 9.4, -109], [0, 2, -128]], fov: 55, act(t) {
  put(pip, 0, DECK, EDGE + 0.6, 0.15); pose(pip, 'crossArms'); setFace(pip, 'proud');
  place(ropeSign, -7, 3.6, -126.3, 0, 0.25, 0);
  rope.forEach((r, i) => place(r, -9 + i * 3.6, DECK + 1.2, -126));
  place(ropeLine, 0, DECK + 2.1, -126);
  [-1, 2, -3, 4.5, 0.5, -5.5].forEach((x, i) => { const a = folk[i]; put(a, x, 0, -120 + i * 3.6, Math.PI); pose(a, 'idle'); setFace(a, 'smile'); });
} }, 1.35));
// 29 "Everyone else has to text me their questions." the phone buzzes with questions
const tText = W('text', 51);
S(W('everyone', 50.3), { ...A, c: [0, 0, -128], cam: [[6.5, 5.2, -119], [6, 5.0, -120.5], [0, 3.4, -131.5]], fov: 52, act(t) {
  put(pip, 0, DECK, -131.5, 0.3); pose(pip, 'phone'); setFace(pip, 'deadpan');
  msgs = Math.floor(clamp01((t - tText + 0.6) / 1.4) * 6); phoneScreen.draw(); hold(phone, pip.handR, [0, -0.1, 0.35], [-0.3, Math.PI, 0]);
  [[-6, -127], [-3.5, -125], [7.5, -127]].forEach(([x, z], i) => { const a = folk[i]; put(a, x, 0, z, Math.PI); pose(a, 'phone'); setFace(a, 'smile'); });
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
  V.update(t); SMOKE.update(t); BIRDS.update(t); FLAGS.update(t);
  SNOW.update(t, camera, s.light === 'storm' ? 1 : 0.45);
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.HOUSE_RULES = { framing: true, close: [24, 27] };
window.QA = { scene, camera, THREE, actors: actors.map((a) => ({ name: a.name, wrap: a.wrap, head: a.head, legL: a.legL })) };
window.READY = true;
