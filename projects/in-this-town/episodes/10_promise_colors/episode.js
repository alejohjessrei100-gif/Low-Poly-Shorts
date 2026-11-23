// Episode 10 "In this city, broken promises steal your colors" (142.6 s, voice 1.25x +6). Long-form story.
// Locations: the canal city (painted houses, bridges, school, bakery, the old gray bridge, the clock tower), the top of
// the clock tower, the family dining room. Characters: Nia (gray, blue eyes), Theo, Dad (the gray man), Mom, the old
// woman in the puddle, Rosa and Gus (rule demos), Mr. Dale, the mayor, townsfolk, the faded gray people.
import { createCore, lerp, clamp01 } from '../../kit/core.js';
import { avatar } from '../../kit/rig.js';
import { faceRig } from '../../kit/face.js';
import { actor, cameraRig } from '../../kit/act.js';
import { polish } from '../../kit/polish.js';
import { canalCity, towerTop, diningRoom, drips, colorStreaks, drain, grayable, grayMat } from '../../kit/canal.js';
import * as P from '../../kit/props.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, grade, setLight } = C;
C.allowBlur(true); scene.add(camera); camera.near = 0.05; camera.far = 700;
const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const AMP = await (async () => { try { return (await (await fetch(new URL('./amp.json', import.meta.url))).json()).amp; } catch { return null; } })();
const END = WORDS[WORDS.length - 1][1] + 0.6;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const between = (t, a, b) => clamp01((t - a) / (b - a));

// ---------------------------------------------------------------- sets
const CITY = canalCity(scene);
const TOP = towerTop(scene, 300), TX = 300;
const DIN = diningRoom(scene, -300), DX = -300;
const DRIP = drips(scene, 10), STREAK = colorStreaks(scene, 140);
const chalkStick = P.cyl(0.018, 0.018, 0.09, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 }), 0, 0, 0, scene, 8);
const phone = P.box(0.07, 0.14, 0.012, P.std(0x1b1b24), 0, 0, 0, scene);
const receipt = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })); scene.add(receipt);
const bridgeY = (x) => Math.sin(((x + 6) / 12) * Math.PI) * 1.4 + 0.29; // walking height on the arched footbridges
// puddles under the gray bridge (the old woman only shows in their reflection) and a strip of canal that reflects
const puddles = [[-5.3, -57.0, 0.95], [-6.2, -55.4, 0.55], [-4.6, -55.0, 0.45]].map(([x, z, r]) => { const p = new Reflector(new THREE.CircleGeometry(r * 1.25, 32), { color: 0x9aa0b0, textureWidth: 512, textureHeight: 512, clipBias: 0.003 }); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.02, z); p.visible = false; scene.add(p); return p; });
const canalMirror = new Reflector(new THREE.PlaneGeometry(3.7, 12), { color: 0x7a7e88, textureWidth: 512, textureHeight: 1024, clipBias: 0.003 }); canalMirror.rotation.x = -Math.PI / 2; canalMirror.position.set(-1.9, -0.66, 15.0); canalMirror.visible = false; scene.add(canalMirror);

// ---------------------------------------------------------------- cast
const actors = [];
const make = (name, opts, h, style = 'normal', fo = {}) => { const c = avatar(scene, { r15: true, ...opts }, h, { face: 'neutral' }); const F = faceRig(c, { skin: opts.skin, style, ...fo }); const A = actor(c, { seed: name.length * 3 + 1 }); actors.push({ name, c, root: c.root }); const faceMats = (order) => { const out = []; F.group.traverse((o) => { if (o.material && o.material.userData.order === order && !out.includes(o.material)) out.push(o.material); }); return out; }; return { c, F, A, root: c.root, name, pupils: faceMats(2), mouth: faceMats(8) }; };
const byColor = (o, hex) => { const out = []; o.root.traverse((m) => { if (m.isMesh && m.material && m.material.color && !out.includes(m.material)) { const c0 = m.material.userData.c0 || m.material.color; if (c0.getHex() === new THREE.Color(hex).getHex()) out.push(m.material); } }); return out; };
const NIA = make('nia', { skin: 0xf2c49a, shirt: 0xf2c14e, pants: 0x3a5a9a, hair: 0xe07a2a, hairStyle: 'ponytail' }, 1.45, 'dramatic', { pupilColor: 0x2a7aff, mouthColor: 0xd8203a });
const THEO = make('theo', { skin: 0xf6c89a, shirt: 0x4ab86a, pants: 0x2a3a6a, hair: 0x5a3a22, hairStyle: 'messy', hat: 'beanie', beanieCol: 0xe8434f, backpack: 0xff8a2a }, 1.12, 'dramatic');
const DAD = make('dad', { skin: 0xe8b890, shirt: 0x2e8a6a, pants: 0x3a3a46, hair: 0x4a2a12, hairStyle: 'short' }, 1.82, 'normal');
const MOM = make('mom', { skin: 0xf0c8a0, shirt: 0xe8463c, pants: 0x2a2a46, hair: 0x2a1a12, hairStyle: 'bun' }, 1.68, 'normal');
const OLD = make('old', { skin: 0x9a9aa2, shirt: 0x7a7a84, pants: 0x5a5a64, shoes: 0x4a4a52, hair: 0xd8d8de, hairStyle: 'bun', scarf: 0x8a8a92 }, 1.5, 'stern', { pupilColor: 0x2a2a30, mouthColor: 0x3a3a40 });
const ROSA = make('rosa', { skin: 0xe8b890, shirt: 0xff5d73, pants: 0x2a5ab8, hair: 0xff8a2a, hairStyle: 'ponytail' }, 1.66, 'dramatic', { mouthColor: 0xd8203a });
const GUS = make('gus', { skin: 0xf0c070, shirt: 0x3d7bff, pants: 0x2a2a46, hair: 0xff7a1a, hairStyle: 'messy' }, 1.75, 'dramatic', { mouthColor: 0xd8203a });
const DALE = make('dale', { skin: 0xe0b088, shirt: 0xf4f4f4, pants: 0x2a2a34, hair: 0x6a6a72, hairStyle: 'short', glasses: true }, 1.78, 'normal');
const MAYOR = make('mayor', { skin: 0xc8946a, shirt: 0x2a5ab8, pants: 0x2a2a34, hair: 0x2a1a12, hairStyle: 'bun', hat: 'tophat' }, 1.7, 'normal', { pupilColor: 0x1fbf4a });
const BAKER = make('baker', { skin: 0xf0c8a0, shirt: 0xffffff, pants: 0x3a3a46, hair: 0x8a5a2a, hairStyle: 'short', hat: 'chef', apron: 0xfff3d8 }, 1.72, 'normal');
const CALLER = make('caller', { skin: 0x8a5a3a, shirt: 0xb07cff, pants: 0x2a2a46, hair: 0x1a1a1a, hairStyle: 'short' }, 1.76, 'normal');
const FOLKCOL = [[0xf0c8a0, 0xff8a3d, 0x2a3a6a, 0x5a3a22, 'ponytail'], [0x8a5a3a, 0x2ec4c4, 0x3a3a46, 0x1a1a1a, 'short'], [0xe8b890, 0xff6fb5, 0x2a2a46, 0xe8d070, 'ponytail'], [0xc8946a, 0x8ad14a, 0x3a3a5a, 0x2a1a12, 'messy'], [0xf6c89a, 0xe8463c, 0x2a3a6a, 0x8a5a2a, 'bun'], [0xe0b088, 0x3d7bff, 0x3a3a46, 0x4a2a12, 'short']];
const FOLK = FOLKCOL.map(([skin, shirt, pants, hair, hairStyle], i) => make('folk' + i, { skin, shirt, pants, hair, hairStyle }, 1.62 + (i % 3) * 0.08, 'normal'));
// the faded gray people (painted faces, no rig: they are many)
const GRAYP = Array.from({ length: 14 }, (_, i) => { const c = avatar(scene, { r15: true, skin: 0x8e8e96, shirt: [0x7a7a84, 0x6a6a74, 0x8a8a92][i % 3], pants: 0x5a5a64, shoes: 0x4a4a52, hair: 0x9a9aa2, hairStyle: ['short', 'bun', 'messy', 'ponytail'][i % 4] }, 1.45 + (i % 5) * 0.09, { face: 'sad' }); const A = actor(c, { seed: 40 + i }); c.root.visible = false; return { c, A, root: c.root }; });
const PL = polish(C), CAM = cameraRig(camera);
// colour control per character
const niaPupil = new Set(NIA.pupils);
const NIA_G = grayable(NIA.root, niaPupil), DAD_G = grayable(DAD.root), ROSA_G = grayable(ROSA.root);
const GUS_LIPS = GUS.mouth, GUS_HAIR = byColor(GUS, 0xff7a1a), GUS_SKIN = byColor(GUS, 0xf0c070), GUS_REST = byColor(GUS, 0x3d7bff).concat(byColor(GUS, 0x2a2a46));
const ROSA_SHIRT = byColor(ROSA, 0xff5d73);
const MAYOR_EYES = MAYOR.pupils;
// Dale's red tie on his chest
const tie = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.05), new THREE.MeshStandardMaterial({ color: 0xd8203a, roughness: 0.6 })); tie.position.set(0, 0.05, 0.53); DALE.c.av.torso.add(tie);
const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.07), tie.material); tieKnot.position.set(0, 0.5, 0.54); DALE.c.av.torso.add(tieKnot);
// mayor's gold sash
{ const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.04), new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 0.4, roughness: 0.4 })); s.position.set(0, 0, 0.53); s.rotation.z = 0.6; MAYOR.c.av.torso.add(s); }

// ---------------------------------------------------------------- staging helpers
const stand = (o, x, y, z, yaw = 0) => { o.root.rotation.order = 'XYZ'; o.root.rotation.set(0, yaw, 0); o.root.position.set(x, y, z); o.root.visible = true; };
const face = (o) => o.c.face.getWorldPosition(new THREE.Vector3());
const keys = (o, t0, list) => o.A.keys(list.map(([dt, n, e]) => [t0 + dt, n, e || {}]));
const expr = (o, t0, list) => o.F.track(list.map(([dt, n, e]) => [t0 + dt, n, e || {}]));
const walk = (o, t, t0, t1, a, b, run = 0) => { o.A.walk([t0, t1, a, b, run]); const u = between(t, t0, t1); o.root.position.set(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u)); o.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); o.root.visible = true; };
const hold = (obj, anchor, pos = [0, 0, 0], rot = [0, 0, 0]) => { obj.visible = true; anchor.updateWorldMatrix(true, false); const q = anchor.getWorldQuaternion(new THREE.Quaternion()); obj.position.copy(anchor.getWorldPosition(new THREE.Vector3())).add(V3(...pos).applyQuaternion(q)); obj.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))); };
const SIT = { legL: [-1.45, 0, -0.05], legR: [-1.45, 0, 0.05], kneeL: 1.45, kneeR: 1.45 };
const seat = (o, i, h) => { const ch = DIN.chairs[i]; const p = ch.getWorldPosition(V3(0, 0, 0)); stand(o, p.x, 0.5 - 0.47 * h + 0.16, p.z + (i < 2 ? -0.08 : 0.08), i < 2 ? 0 : Math.PI); };
const eyesOf = (o) => [-1, 1].map((s) => o.c.head.localToWorld(V3(s * 0.18, 0.7, 0.66)));
// lip-sync windows per speaker (they speak the narrator's quoted lines)
const SPEAK = { nia: [[29.5, 35.9], [104.0, 105.0]], dad: [[98.4, 100.0], [111.1, 112.4]], old: [[60.9, 64.2], [64.7, 67.6]], theo: [[137.7, 139.2]] };
for (const [k, o] of [['nia', NIA], ['dad', DAD], ['old', OLD], ['theo', THEO]]) o.F.lipsync(WORDS, AMP, 60, (t) => SPEAK[k].some(([a, b]) => t >= a && t < b));
// the old woman is only there in reflections
let oldOn = false;
for (const p of puddles) { const ob = p.onBeforeRender; p.onBeforeRender = function (...a) { const v = OLD.root.visible; OLD.root.visible = oldOn; ob.apply(this, a); OLD.root.visible = v; }; }
{ const ob = canalMirror.onBeforeRender; canalMirror.onBeforeRender = function (...a) { const v = NIA.root.visible; NIA.root.visible = false; ob.apply(this, a); NIA.root.visible = v; }; }

// ---------------------------------------------------------------- colour over time
function cityGray(t) {
  if (t < 68.4) return () => 0;
  if (t < 80.6) { const f = -96 + (t - 68.4) * 13; return (cat, z) => { if (cat === 'door') return Math.max(clamp01((f - z) / 10), between(t, 70.9, 71.5)); if (cat === 'window' || cat === 'glass') return Math.max(clamp01((f - z) / 10), between(t, 72.0, 72.6)); if (cat === 'water') return Math.max(clamp01((f - z) / 10), between(t, 72.9, 73.7)); return clamp01((f - z) / 10); }; }
  if (t < 126.9) return () => 1;
  if (t < 129.9) { const b = -96 + (t - 126.9) * 55; return (cat, z) => clamp01((z - b) / 12); }
  return () => 0;
}
function niaPupilGray(t) { if (t < 43.8) return 0; if (t < 107.3) return 0.75 * between(t, 43.8, 47.0); if (t < 127) return 0.75 - 0.55 * between(t, 107.3, 109.0); return 0; }

// ---------------------------------------------------------------- shots
const SH = [];
const S = (t, id, light, a, b, o = {}) => SH.push({ t: Math.max(0, t - 2 / 60), id, light, a, b, ...o });
const T = (x, y, z) => [TX + x, y, z], D = (x, y, z) => [DX + x, y, z];
S(0, 'cityWide', 'day', [[0, 13, 62], [0, 6, -40], 52], [[0, 8, 44], [0, 4, -40], 50], { dof: [V3(0, 3, 0), 60] });
S(2.3, 'rosaDrain', 'day', [[2.0, 1.6, 17.6], [5.5, 1.15, 14], 46], [[2.3, 1.6, 17.0], [5.5, 1.15, 14], 42], { dof: [V3(5.5, 1.2, 14), 3] });
S(4.3, 'seven', 'day', [[1.5, 1.8, 19.5], [5.5, 1.0, 14], 50], [[1.8, 1.7, 18.6], [5.5, 1.0, 14], 46], { dof: [V3(5.5, 1.0, 14), 4] });
S(6.6, 'unseen', 'day', [[1.2, 2.2, 21.5], [5.5, 1.0, 13], 54], [[1.5, 2.1, 20.5], [5.5, 1.0, 13], 50], { dof: [V3(5.5, 1, 13), 6] });
S(8.9, 'gusLips', 'day', [[-3.3, 1.66, 21.6], [-5.5, 1.58, 20], 34], [[-3.6, 1.66, 21.3], [-5.5, 1.58, 20], 30], { dof: 'gus' });
S(11.5, 'gusHair', 'day', [[-2.6, 1.7, 22.4], [-5.5, 1.3, 20], 46], [[-2.9, 1.7, 22.0], [-5.5, 1.3, 20], 42], { dof: 'gus' });
S(14.6, 'dale', 'day', [[2.2, 1.7, -5.2], [5.5, 1.3, -8.4], 50], [[2.4, 1.65, -5.5], [5.5, 1.3, -8.4], 46], { dof: [V3(5.6, 1.4, -7.8), 3] });
S(18.5, 'mayor', 'day', [[-2.3, 1.9, -13.3], [-5.5, 1.45, -16.8], 50], [[-2.5, 1.85, -13.7], [-5.5, 1.45, -16.8], 46], { dof: [V3(-5.9, 1.7, -16), 4] });
S(22.2, 'because', 'day', [[3.5, 3.6, 40], [0, 1.6, 14], 54], [[3.0, 3.0, 36], [0, 1.6, 12], 50], { dof: [V3(3, 1.5, 22), 14] });
S(24.8, 'probably', 'day', [[3.0, 1.6, 28.8], [5.3, 1.35, 25.5], 46], [[3.2, 1.6, 28.2], [5.3, 1.35, 25.5], 42], { dof: [V3(5.3, 1.4, 25.5), 3] });
S(26.2, 'bakery', 'day', [[-3.0, 1.7, 1.2], [-6.8, 1.5, -2.0], 48], [[-3.2, 1.7, 0.7], [-6.8, 1.5, -2.0], 44], { dof: [V3(-6.9, 1.6, -2.4), 4] });
S(27.9, 'caller', 'day', [[3.4, 1.7, 32.0], [5.6, 1.55, 30], 42], [[3.6, 1.7, 31.6], [5.6, 1.55, 30], 38], { dof: [V3(5.6, 1.6, 30), 3] });
S(29.5, 'niaIntro', 'day', [[0.6, 2.6, 15.8], [0, 2.3, 8], 44], [[0.4, 2.55, 14.4], [0, 2.4, 8], 40], { dof: 'nia' });
S(32.8, 'niaEyes', 'day', [[0.12, 0.02, 1.15], [0, 0, 0], 32], [[0.06, 0.02, 0.95], [0, 0, 0], 30], { dof: 'nia', close: true, rel: 'nia' });
S(35.9, 'promiseTheo', 'day', [[1.7, 1.45, 22.4], [6.1, 1.0, 22.3], 50], [[1.9, 1.42, 22.35], [6.1, 1.0, 22.3], 48], { dof: [V3(6.1, 1, 22.2), 3] });
S(40.1, 'late', 'day', [[2.4, 1.6, 6.2], [5.6, 1.0, -4], 48], [[2.6, 1.6, 5.8], [5.6, 1.0, 0], 46], { dof: [V3(5.6, 1, -1), 8] });
S(41.2, 'towerRings', 'day', [[-3.0, 8, -64], [0, 21, -88], 50], [[-2.2, 8.5, -66], [0, 21.5, -88], 46], { shakes: [[41.85, 0.03, 0.5]], punch: [[41.85, 4, 0.5]] });
S(42.7, 'feltIt', 'day', [[4.9, 1.45, 5.8], [5.6, 1.1, 3], 44], [[4.95, 1.45, 5.5], [5.6, 1.1, 3], 42], { dof: 'nia' });
S(43.8, 'drip', 'day', [[0.08, 0.0, 1.2], [0, -0.04, 0], 32], [[0.04, 0.0, 1.0], [0, -0.04, 0], 30], { dof: 'nia', close: true, rel: 'nia' });
S(46.4, 'midnight', 'day', [[0, 21.2, -71], [0, 21.6, -88], 44], [[0, 21.4, -73], [0, 21.8, -88], 42], { dof: [V3(0, 22, -87.9), 3] });
S(49.0, 'emptySchool', 'day', [[2.6, 1.8, 29.0], [6.0, 1.1, 24.0], 50], [[2.8, 1.75, 28.4], [6.0, 1.1, 24.0], 46], { dof: [V3(6.2, 1.1, 22.6), 5] });
S(52.0, 'underBridge', 'dusk', [[-5.4, 1.9, -40.5], [-5.5, 1.2, -57], 46], [[-5.5, 1.8, -43.5], [-5.5, 1.2, -57], 44], { dof: [V3(-5.5, 1.2, -55), 8] });
S(55.5, 'puddle', 'dusk', [[-5.0, 0.75, -59.6], [-5.3, 0.15, -56.6], 44], [[-5.05, 0.7, -59.3], [-5.3, 0.15, -56.6], 40], { puddle: true });
S(58.0, 'chalkHand', 'dusk', [[1.15, -0.15, 0.75], [0, -0.5, 0], 46], [[1.05, -0.15, 0.7], [0, -0.5, 0], 44], { dof: 'nia', rel: 'nia' });
S(60.9, 'puddleTalk', 'dusk', [[-5.5, 0.6, -59.3], [-5.3, 0.2, -56.4], 38], [[-5.45, 0.58, -59.0], [-5.3, 0.2, -56.4], 34], { puddle: true });
S(64.7, 'warning', 'dusk', [[-5.0, 1.6, -56.4], [-2.4, 10, -92], 52], [[-5.05, 1.6, -56.9], [-2.2, 11, -92], 50], { dof: [V3(0, 18, -92), 40] });
S(68.5, 'drainWide', 'dusk', [[0, 15, 46], [0, 3, -40], 55], [[0, 13, 40], [0, 3, -40], 52], { dof: [V3(0, 3, 0), 60] });
S(71.0, 'doors', 'dusk', [[1.8, 1.8, 19.5], [-7.2, 1.3, 12], 48], [[1.9, 1.8, 19.0], [-7.2, 1.3, 12], 46], { dof: [V3(-7, 1.3, 13), 8] });
S(72.1, 'windows', 'dusk', [[1.2, 4.8, 23.5], [-7.2, 5.4, 30], 48], [[1.1, 4.9, 23.0], [-7.2, 5.4, 30], 46], { dof: [V3(-7.2, 5.2, 29), 8] });
S(73.0, 'water', 'dusk', [[0.4, 2.4, 27], [0, -0.6, 10], 50], [[0.4, 2.3, 26], [0, -0.6, 10], 48], { dof: [V3(0, -0.6, 14), 10] });
S(74.0, 'reflection', 'dusk', [[2.6, 1.3, 13.2], [-3.6, 0.1, 15.0], 46], [[2.4, 1.25, 13.6], [-3.6, 0.1, 15.0], 44], { mirror: true, dof: [V3(-3.5, 0, 18), 6] });
S(76.4, 'grayHands', 'night', [[0.3, 1.9, -26.5], [0, 2.4, -36], 48], [[0.3, 1.9, -27.5], [0, 2.4, -36], 46], { dof: [V3(0, 2.4, -36), 6] });
S(78.5, 'footsteps', 'night', [[-0.9, 0.45, -63.2], [0, 0.4, -72], 46], [[-0.9, 0.45, -64.6], [0, 0.4, -74], 44], { dof: [V3(0, 0.3, -68), 4] });
S(80.7, 'topWide', 'indoorNight', [T(3.9, 2.5, 4.1), T(-1.0, 1.4, -0.5), 56], [T(3.7, 2.4, 3.9), T(-1.0, 1.4, -0.5), 52], { dof: [V3(TX + 0.4, 1.5, 0.6), 6] });
S(84.8, 'ribbons', 'indoorNight', [T(2.2, 1.7, 2.3), T(1.2, 1.7, 0.6), 42], [T(2.0, 1.65, 2.0), T(1.2, 1.7, 0.6), 40], { dof: [V3(TX + 1.2, 1.7, 0.6), 2] });
S(87.4, 'turns', 'indoorNight', [T(-0.4, 1.8, 3.4), T(0.3, 1.55, 0.0), 44], [T(-0.35, 1.8, 3.1), T(0.3, 1.6, 0.0), 42], { dof: 'dad' });
S(90.0, 'dadFace', 'indoorNight', [[-0.1, 0.02, 1.25], [0, -0.02, 0], 32], [[-0.05, 0.02, 1.1], [0, -0.02, 0], 30], { dof: 'dad', close: true, rel: 'dad' });
S(91.1, 'flashDinner', 'indoor', [D(-2.7, 1.75, 2.5), D(0.6, 1.1, -0.9), 52], [D(-2.4, 1.7, 2.3), D(0.8, 1.1, -0.9), 50], { dof: [V3(DX + 1.5, 1.2, -1.2), 6], memory: true });
S(94.8, 'ghostDad', 'indoorNight', [D(1.7, 2.3, 2.7), D(0, 0.65, 0), 52], [D(1.55, 2.2, 2.5), D(0, 0.65, 0), 50], { dof: [V3(DX, 1, 0), 4] });
S(98.4, 'promiseStay', 'indoorNight', [T(-0.9, 1.55, 4.3), T(0.3, 1.5, 0.4), 44], [T(-0.85, 1.55, 4.0), T(0.3, 1.5, 0.4), 42], { dof: 'dad' });
S(100.9, 'didnt', 'indoorNight', [[0.35, 0.05, -1.3], [0, -0.1, 0], 40], [[0.3, 0.05, -1.2], [0, -0.1, 0], 38], { dof: 'nia', rel: 'nia' });
S(101.8, 'grabHand', 'indoorNight', [T(-0.2, 1.3, 0.5), T(-0.6, 0.85, 2.3), 48], [T(-0.25, 1.28, 0.7), T(-0.6, 0.85, 2.3), 46], { dof: [V3(TX - 0.6, 0.9, 2.3), 3] });
S(104.0, 'walkHome', 'indoorNight', [[-0.35, 0.05, -1.3], [0, -0.1, 0], 40], [[-0.3, 0.05, -1.2], [0, -0.1, 0], 38], { dof: 'nia', rel: 'nia' });
S(105.5, 'stairs', 'indoorNight', [T(1.8, 2.0, 4.1), T(-2.2, 1.0, 2.6), 48], [T(1.6, 1.9, 3.8), T(-2.6, 1.0, 2.6), 46], { dof: [V3(TX - 2.4, 1, 2.6), 4] });
S(107.3, 'blueBack', 'indoorNight', [[-1.3, 0.05, 0.35], [0, -0.08, 0], 40], [[-1.15, 0.05, 0.3], [0, -0.08, 0], 38], { dof: 'nia', rel: 'nia' });
S(109.4, 'dadLaughs', 'indoorNight', [[-0.4, 0.0, 1.9], [0, -0.2, 0], 42], [[-0.35, 0.0, 1.7], [0, -0.2, 0], 40], { dof: 'dad', rel: 'dad' });
S(113.1, 'crowd', 'indoorNight', [T(3.8, 2.5, 4.2), T(-0.5, 1.4, -0.5), 54], [T(3.4, 2.3, 3.8), T(-0.5, 1.4, -0.5), 50], { dof: [V3(TX, 1.4, 0), 8], shakes: [[113.4, 0.02, 0.5]] });
S(117.6, 'chalkOut', 'indoorNight', [[1.6, -0.15, 1.1], [0, -0.35, 0], 46], [[1.5, -0.15, 1.0], [0, -0.35, 0], 44], { dof: 'nia', rel: 'nia' });
S(118.8, 'clockFace', 'indoorNight', [T(-1.9, 1.6, 1.5), T(0, 1.9, -4.0), 54], [T(-1.7, 1.65, 1.2), T(0, 2.0, -4.0), 52], { dof: [V3(TX, 3, -4), 6] });
S(121.4, 'writing', 'night', [[0, 19.6, -69], [0, 22, -88], 42], [[0, 20.4, -72], [0, 22, -88], 40], { dof: [V3(0, 22, -88), 20] });
S(124.6, 'bell', 'indoorNight', [T(3.4, 2.2, 3.6), T(1.2, 5.6, 0.6), 54], [T(3.2, 2.3, 3.4), T(1.2, 5.6, 0.6), 52], { shakes: [[125.3, 0.06, 0.7], [125.9, 0.04, 0.6]], punch: [[125.3, 6, 0.6]], flash: [[125.3, 0.5]] });
S(126.0, 'snap', 'indoorNight', [T(2.6, 2.2, 2.9), T(1.2, 3.2, 0.6), 48], [T(2.5, 2.4, 2.6), T(1.2, 4.2, 0.6), 50], { shakes: [[126.2, 0.03, 0.4]] });
S(127.0, 'colorsFly', 'night', [[0, 17, 30], [0, 8, -50], 56], [[0, 15, 24], [0, 7, -50], 54], { dof: [V3(0, 6, -20), 60] });
S(129.9, 'morningWide', 'morning', [[-1.5, 4.5, 46], [0, 2, -20], 54], [[-1, 3.5, 38], [0, 2, -20], 52], { dof: [V3(0, 2, 10), 40] });
S(132.4, 'dinnerDad', 'indoor', [D(1.7, 2.3, 2.7), D(0, 0.65, 0), 52], [D(1.55, 2.2, 2.5), D(0, 0.65, 0), 50], { dof: [V3(DX, 1, 0), 4] });
S(133.6, 'peoplePromise', 'morning', [[3.0, 1.6, 28.8], [5.4, 1.2, 25.5], 46], [[3.2, 1.6, 28.2], [5.4, 1.2, 25.5], 44], { dof: [V3(5.4, 1.2, 25.5), 4] });
S(135.9, 'theoAsks', 'indoor', [[0.3, 0.15, -1.6], [0, -0.1, 0], 42], [[0.28, 0.14, -1.45], [0, -0.1, 0], 40], { dof: 'theo', rel: 'theo' });
S(139.7, 'lipsGray', 'indoor', [[0.05, 0.0, 1.2], [0, -0.05, 0], 32], [[0.03, 0.0, 1.0], [0, -0.05, 0], 30], { dof: 'nia', close: true, rel: 'nia' });

const CITYSHOTS = /^(cityWide|rosaDrain|seven|unseen|gus|dale|mayor|because|probably|bakery|caller|niaIntro|niaEyes|promiseTheo|late|towerRings|feltIt|drip|midnight|emptySchool|underBridge|puddle|chalkHand|warning|drainWide|doors|windows|water|reflection|grayHands|footsteps|writing|colorsFly|morningWide|peoplePromise)/;
const TOPSHOTS = /^(topWide|ribbons|turns|dadFace|promiseStay|didnt|grabHand|walkHome|stairs|blueBack|dadLaughs|crowd|chalkOut|clockFace|bell|snap)$/;
const sceneOf = (id) => (TOPSHOTS.test(id) ? 'top' : CITYSHOTS.test(id) ? 'city' : 'din');
const clockAt = (t) => { if (t < 41.3) return [2, 59]; if (t < 46.4) return [3, 0]; if (t < 49.0) { const m = 180 + ease(between(t, 46.6, 48.9)) * (539); return [Math.floor(m / 60), m % 60]; } if (t < 125.3) return [11, 59]; return [12, 0]; };
const ALL = [NIA, THEO, DAD, MOM, OLD, ROSA, GUS, DALE, MAYOR, BAKER, CALLER, ...FOLK];

function pose(t) {
  let i = 0; SH.forEach((s, j) => { if (t >= s.t) i = j; }); const s = SH[i], id = s.id, sc = sceneOf(id), t0 = s.t, t1 = (SH[i + 1] || { t: END }).t, u = between(t, t0, t1);
  const center = sc === 'city' ? [0, 0, 0] : sc === 'top' ? [TX, 0, 0] : [DX, 0, 0];
  setLight(s.light, center);
  // reset
  for (const o of ALL) o.root.visible = false; GRAYP.forEach((g) => (g.root.visible = false)); oldOn = false;
  chalkStick.visible = phone.visible = receipt.visible = false; puddles.forEach((p) => (p.visible = !!s.puddle)); canalMirror.visible = !!s.mirror; DRIP.hide(); STREAK.hide();
  const night = /night|dusk/i.test(s.light) && sc === 'city';
  CITY.lamps.emissiveIntensity = night ? 2.2 : 0; CITY.houses.forEach((h) => (h.glassM.emissiveIntensity = night ? (s.light === 'dusk' ? 0.5 : 0.9) : 0)); CITY.clockM.emissiveIntensity = night ? 0.7 : 0;
  grade.uniforms.flash.value = 0; for (const [ft, fa] of s.flash || []) { const d = t - ft; if (d > 0 && d < 0.25) grade.uniforms.flash.value = fa * (1 - d / 0.25); }
  if (s.memory) grade.uniforms.flash.value = Math.max(grade.uniforms.flash.value, 0.16 * (1 - between(t, t0, t0 + 0.5)) + 0.06);
  // colours
  drain(cityGray(t)); CITY.sway(t); CITY.setTime(...clockAt(t)); TOP.setTime(...clockAt(t));
  NIA_G.set(t < 126.9 || (id === 'flashDinner') ? (id === 'flashDinner' ? 0 : 1) : 0); for (const m of NIA.pupils) grayMat(m, id === 'flashDinner' ? 0 : niaPupilGray(t));
  if (t > 126.9 && t < 129.9 && sc !== 'din') NIA_G.set(1 - between(t, 127.2, 129.0));
  DAD_G.set(id === 'flashDinner' || t >= 129.9 ? 0 : 1); DAD_G.fade(1);
  ROSA_G.set(0); ROSA_G.fade(1); for (const m of [...GUS_LIPS, ...GUS_HAIR, ...GUS_SKIN, ...GUS_REST]) grayMat(m, 0); for (const m of MAYOR_EYES) grayMat(m, 0); grayMat(tie.material, 0); for (const m of NIA.mouth) grayMat(m, NIA_G.ms[0] ? (t < 126.9 && id !== 'flashDinner' ? 1 : t < 129.9 && sc !== 'din' ? 1 - between(t, 127.2, 129.0) : 0) : 0);
  TOP.anim(t, 0, 0); TOP.writeChalk(between(t, 119.0, 123.6) * 32); CITY.writeChalk(between(t, 119.0, 123.6) * 32);
  // townsfolk stroll the quays in daytime city shots
  if (sc === 'city' && !night && /^(cityWide|because|late|morningWide|peoplePromise|niaIntro|unseen)$/.test(id)) FOLK.forEach((o, k) => { const side = k % 2 ? 1 : -1, sp = 1.1 + (k % 3) * 0.15, L = 110, off = k * 19; const seg = Math.floor((t * sp + off) / L), ts = (seg * L - off) / sp; const dir = k % 3 === 0 ? -1 : 1; const za = dir > 0 ? 44 : -60, zb = dir > 0 ? -66 : 50; walk(o, t, ts, ts + L / sp * (Math.abs(zb - za) / L), V3(side * (5.0 + (k % 2) * 0.9), 0, za), V3(side * (5.0 + (k % 2) * 0.9), 0, zb)); keys(o, 0, [[0, 'idle']]); expr(o, 0, [[0, t > 129 ? 'happy' : 'neutral', { look: [0, 0] }]]); });
  const E = NIA, TH = THEO;
  // ----------------------------------------------------------------- rule demos
  if (/^(cityWide)$/.test(id)) { stand(ROSA, 5.5, 0, 14, -Math.PI / 2); keys(ROSA, t0, [[0, 'idle']]); expr(ROSA, t0, [[0, 'happy']]); }
  if (/^(rosaDrain|seven|unseen)$/.test(id)) {
    stand(ROSA, 5.5, 0, 14, -Math.PI / 2 + 0.25);
    const ks = between(t, 2.6, 3.5); for (const m of ROSA_SHIRT) grayMat(m, ks); if (t > 4.4) ROSA_G.set(Math.max(ks > 0 ? 0 : 0, between(t, 4.4, 6.1))); for (const m of ROSA_SHIRT) grayMat(m, Math.max(ks, between(t, 4.4, 6.1)));
    if (id === 'rosaDrain') { keys(ROSA, t0, [[0, 'idle'], [0.3, 'presentPalm', { armL: [-0.9, -0.1, -0.35], elbowL: -1.0, dur: 0.3 }]]); expr(ROSA, t0, [[0, 'neutral', { look: [0, -0.5] }], [0.4, 'shocked', { look: [0.2, -0.6] }]]); }
    if (id === 'seven') { keys(ROSA, t0, [[0, 'shockRecoil', { dur: 0.3 }], [1.2, 'slump', { dur: 0.6 }]]); expr(ROSA, t0, [[0, 'scared', { look: [0, -0.4] }], [1.2, 'crying', { look: [0, -0.3] }]]); }
    if (id === 'unseen') { ROSA_G.set(1); ROSA_G.fade(1 - between(t, 6.9, 8.4)); keys(ROSA, t0, [[0, 'slump']]); expr(ROSA, t0, [[0, 'sad', { look: [-0.6, 0] }]]); walk(FOLK[0], t, 6.6, 8.9, V3(4.9, 0, 18), V3(4.9, 0, 10)); walk(FOLK[1], t, 6.6, 8.9, V3(6.2, 0, 9.6), V3(6.2, 0, 17.6)); keys(FOLK[0], t0, [[0, 'idle']]); keys(FOLK[1], t0, [[0, 'idle']]); expr(FOLK[0], t0, [[0, 'happy']]); expr(FOLK[1], t0, [[0, 'neutral']]); }
  }
  if (/^gus/.test(id)) {
    stand(GUS, -5.5, 0, 20, Math.PI / 2 + 0.35); for (const m of GUS_LIPS) grayMat(m, between(t, 10.6, 11.0)); for (const m of GUS_HAIR) grayMat(m, between(t, 12.2, 12.6)); for (const m of GUS_SKIN) grayMat(m, between(t, 13.5, 13.9));
    keys(GUS, t0, id === 'gusLips' ? [[0, 'idle'], [0.6, 'facepalm', { armR: [-1.9, 0.3, 0.2], elbowR: -2.3, head: [0, 0, 0], dur: 0.25 }]] : [[0, 'shrug', { dur: 0.3 }], [1.6, 'shockRecoil', { dur: 0.25 }]]);
    expr(GUS, t0, id === 'gusLips' ? [[0, 'neutral', { look: [0.3, 0] }], [0.6, 'shocked', { look: [0, -0.3] }]] : [[0, 'scared', { look: [0, 0.6] }], [1.5, 'dread', { look: [0, -0.5] }]]);
  }
  if (id === 'dale') { stand(DALE, 6.0, 0, -7.6, Math.atan2(-1, -1.6) + 0.5); stand(FOLK[3], 5.0, 0, -9.2, Math.atan2(1, 1.6) - 0.3); keys(DALE, t0, [[0, 'crossArms'], [1.6, 'shrug', { dur: 0.3 }]]); expr(DALE, t0, [[0, 'smug', { look: [-0.4, 0] }], [2.7, 'shocked', { look: [0, -0.7] }]]); keys(FOLK[3], t0, [[0, 'presentPalm', { dur: 0.3 }]]); expr(FOLK[3], t0, [[0, 'angry']]); hold(receipt, FOLK[3].c.handR, [0, -0.08, 0.06], [0.3, 0, 0]); grayMat(tie.material, between(t, 17.6, 18.0)); }
  if (id === 'mayor') { stand(MAYOR, -5.95, 0, -16, Math.PI / 2 + 0.15); keys(MAYOR, t0, [[0, 'idle'], [0.8, 'point', { armR: [-1.4, 0.6, 0.05], dur: 0.3 }], [2.4, 'presentPalm', { dur: 0.3 }]]); expr(MAYOR, t0, [[0, 'happy', { look: [0.4, 0] }], [2.4, 'embarrassed', { look: [0.6, 0] }]]); for (const m of MAYOR_EYES) grayMat(m, between(t, 20.8, 21.5)); stand(FOLK[4], -3.7, 0, -17.9, -Math.PI / 2 - 0.5); stand(FOLK[2], -3.1, 0, -16.6, -Math.PI / 2 - 0.2); keys(FOLK[4], t0, [[0, 'crossArms']]); keys(FOLK[2], t0, [[0, 'handsOnHips']]); expr(FOLK[4], t0, [[0, 'suspicious']]); expr(FOLK[2], t0, [[0, 'bored']]); }
  if (id === 'probably') { stand(FOLK[5], 5.0, 0, 25.0, 0.6); stand(FOLK[2], 5.7, 0, 26.0, Math.PI + 0.6); keys(FOLK[5], t0, [[0, 'presentPalm']]); keys(FOLK[2], t0, [[0, 'shrug', { dur: 0.3 }]]); expr(FOLK[5], t0, [[0, 'happy']]); expr(FOLK[2], t0, [[0, 'smug', { look: [-0.3, 0] }]]); }
  if (id === 'bakery') { stand(BAKER, -6.3, 0, -0.9, Math.PI / 2 + 0.5); keys(BAKER, t0, [[0, 'idle'], [0.6, 'shrug', { dur: 0.3 }]]); expr(BAKER, t0, [[0, 'neutral'], [0.6, 'smug', { look: [0.4, 0] }]]); }
  if (id === 'caller') { stand(CALLER, 5.6, 0, 30, -Math.PI / 2 - 0.5); keys(CALLER, t0, [[0, 'facepalm', { armR: [-2.0, 0.6, 0.35], elbowR: -2.4, head: [0, 0.2, 0.1], chest: [0, 0, 0], dur: 0.2 }]]); expr(CALLER, t0, [[0, 'bored', { look: [0.5, 0.1] }]]); hold(phone, CALLER.c.handR, [0, -0.02, 0.05], [0, 0, 0]); }
  // ----------------------------------------------------------------- Nia's story
  if (id === 'niaIntro' || id === 'niaEyes') { stand(E, 0, bridgeY(0), 8, 0.1); keys(E, t0, [[0, 'idle'], [1.2, 'presentPalm', { armR: [-0.7, 0.2, 0.3], elbowR: -1.2, dur: 0.4 }]]); expr(E, t0, [[0, 'sad', { look: [0, 0] }]]); FOLK.forEach((o) => { if (Math.abs(o.root.position.z - 8) < 3) o.root.visible = false; }); }
  if (id === 'promiseTheo') { stand(E, 6.2, 0, 22.9, Math.PI); stand(TH, 6.0, 0, 21.7, 0); keys(E, t0, [[0, 'idle'], [0.5, 'point', { armR: [-0.9, -0.3, 0.1], elbowR: -0.4, dur: 0.4 }]]); keys(TH, t0, [[0, 'idle'], [0.5, 'point', { armR: [-1.1, -0.2, 0.1], elbowR: -0.3, dur: 0.4 }]]); expr(E, t0, [[0, 'happy', { look: [0, -0.5] }]]); expr(TH, t0, [[0, 'laughing', { look: [0, 0.5] }]]); }
  if (id === 'late') { walk(E, t, 40.1, 41.25, V3(5.6, 0, -9), V3(5.6, 0, 3), 1); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'scared', { look: [0, 0] }]]); }
  if (id === 'feltIt' || id === 'drip') { stand(E, 5.6, 0, 3, 0); keys(E, t0, id === 'feltIt' ? [[0, 'idle'], [0.2, 'presentPalm', { armR: [-1.0, 0.7, 0.2], elbowR: -1.8, armL: [-0.9, -0.6, -0.2], elbowL: -1.7, dur: 0.25 }]] : [[0, 'presentPalm', { armR: [-1.0, 0.7, 0.2], elbowR: -1.8, armL: [-0.9, -0.6, -0.2], elbowL: -1.7 }]]); expr(E, t0, id === 'feltIt' ? [[0, 'shocked', { look: [0, -0.4] }]] : [[0, 'crying', { look: [0, 0.2] }]]); if (id === 'drip') DRIP.set(eyesOf(E), 1, t); }
  if (id === 'emptySchool') { walk(E, t, 49.0, 50.3, V3(5.6, 0, 30), V3(6.0, 0, 24.5), 1); if (t > 50.3) { E.root.rotation.y = lerp(Math.PI, Math.PI + 0.9 * Math.sin((t - 50.3) * 2.2), 1); } keys(E, t0, [[0, 'idle'], [1.4, 'handsOnHips', { dur: 0.3 }]]); expr(E, t0, [[0, 'scared', { look: [0.6, 0] }], [1.6, 'dread', { look: [-0.7, 0] }]]); }
  // under the old gray bridge
  if (/^(underBridge|puddle|chalkHand|puddleTalk|warning)$/.test(id)) {
    [[-6.6, -54.4, 1.2], [-6.5, -56.2, 1.7], [-6.7, -58.4, 2.0], [-4.3, -59.4, 2.5]].forEach(([x, z, yaw], k) => { const g = GRAYP[k]; g.root.visible = true; g.root.position.set(x, 0, z); g.root.rotation.set(0, yaw, 0); g.A.keys([[0, k % 2 ? 'crouch' : 'slump', {}]]); g.A.update(t); });
    if (id === 'underBridge') { walk(E, t, 52.0, 55.5, V3(-5.4, 0, -46), V3(-5.6, 0, -57.4), 0.6); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'scared', { look: [0.5, 0] }]]); }
    else { stand(E, id === 'warning' ? -5.6 : -6.5, 0, id === 'warning' ? -58.4 : -58.0, id === 'warning' ? Math.PI : 0.6); }
    if (id === 'puddle' || id === 'puddleTalk') { oldOn = true; stand(OLD, -5.25, 0, -55.4, Math.PI); keys(OLD, t0, id === 'puddle' ? [[0, 'idle'], [0.8, 'presentPalm', { armR: [-1.0, 0.1, 0.3], elbowR: -0.6, dur: 0.4 }]] : [[0, 'point', { armR: [-1.3, 0.2, 0.05] }]]); expr(OLD, t0, [[0, 'neutral', { look: [0.2, -0.2] }]]); OLD.root.visible = false; keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, id === 'puddle' ? 'shocked' : 'scared', { look: [0.3, -0.8] }]]); }
    if (id === 'chalkHand') { keys(E, t0, [[0, 'idle', { armR: [-0.55, 0.0, 0.15], elbowR: -0.9, dur: 0.3 }]]); expr(E, t0, [[0, 'shocked', { look: [0.2, -0.7] }]]); if (t > 58.6) hold(chalkStick, E.c.handR, [0, -0.06, 0.06], [Math.PI / 2, 0, 0]); }
    if (id === 'warning') { keys(E, t0, [[0, 'idle'], [1.0, 'crossArms', { dur: 0.4 }]]); expr(E, t0, [[0, 'determined', { look: [0, 0.6] }]]); }
  }
  // colour leaving the city
  if (id === 'reflection') { stand(E, -4.55, 0, 15.0, Math.PI / 2); keys(E, t0, [[0, 'crouch', { armR: [-0.8, 0.1, 0.3], elbowR: -0.4 }]]); expr(E, t0, [[0, 'shocked', { look: [0.2, -0.8] }]]); }
  if (id === 'grayHands') { for (let k = 0; k < 6; k++) { const g = GRAYP[k + 4], x = -4.5 + k * 1.8; g.root.visible = true; g.root.position.set(x, bridgeY(x) - 0.02, -36 + (k % 2 ? 0.5 : -0.4)); g.root.rotation.set(0, 0, 0); g.A.keys([[0, 'flailUp', {}]]); g.A.update(t + k * 0.7); const w = Math.sin(t * 7 + k) * 0.35; g.c.av.armR.rotation.z += w; g.c.av.armL.rotation.z -= w; } }
  if (id === 'footsteps') { walk(E, t, 78.5, 80.7, V3(0, 0, -64.5), V3(0, 0, -72.5), 0.3); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'determined']]); }
  // ----------------------------------------------------------------- top of the clock tower
  if (sc === 'top') {
    const swing = id === 'bell' ? Math.sin((t - 125.3) * 5.5) * 0.45 * Math.max(0, 1 - (t - 125.3) / 2.2) * (t > 125.3 ? 1 : 0) : 0;
    TOP.anim(t, swing, id === 'snap' ? between(t, 126.1, 127.0) : 0);
    // Dad: back to us at the rope, then he turns
    const dadYaw = id === 'topWide' || id === 'ribbons' ? Math.PI : id === 'turns' ? lerp(Math.PI, 0.25, ease(between(t, 87.7, 88.5))) : 0.15;
    stand(DAD, TX + (id === 'topWide' || id === 'ribbons' ? 0.75 : 0.3), 0, id === 'topWide' || id === 'ribbons' ? 0.1 : 0.0, dadYaw);
    if (id === 'topWide' || id === 'ribbons') keys(DAD, t0, [[0, 'idle', { armR: [-1.5, 0.4, 0], elbowR: -0.9, armL: [-1.4, -0.4, 0], elbowL: -1.0 }]]);
    else if (id === 'promiseStay') keys(DAD, t0, [[0, 'presentPalm', { armR: [-1.2, 0.1, 0.1], elbowR: -0.3, dur: 0.5 }]]);
    else if (id === 'dadLaughs') keys(DAD, t0, [[0, 'handsOnHips', { head: [-0.25, 0, 0], dur: 0.4 }]]);
    else if (id === 'crowd' || id === 'clockFace') keys(DAD, t0, [[0, 'crossArms']]);
    else keys(DAD, t0, [[0, 'idle']]);
    expr(DAD, t0, id === 'dadFace' ? [[0, 'sad', { look: [-0.2, 0] }], [0.5, 'smug', { look: [-0.3, 0] }]] : id === 'dadLaughs' ? [[0, 'laughing', { look: [-0.4, 0] }], [1.6, 'smug', { look: [-0.6, 0] }]] : id === 'promiseStay' ? [[0, 'sad', { look: [-0.4, 0] }]] : [[0, 'neutral', { look: [-0.4, 0] }]]);
    if (id === 'snap' || id === 'bell') DAD.root.visible = id === 'bell';
    // Theo and Nia
    const where = { topWide: [[-0.6, 1.4, 0.3], [-3.2, 2.6, 0.6]], ribbons: [[-0.6, 1.4, 0.3], [-3.2, 2.6, 0.6]], turns: [[-0.8, 1.9, 0.5], [-0.3, 2.6, Math.PI]], dadFace: [[-0.8, 1.9, 0.5], [-0.3, 2.6, Math.PI]] }[id] || null;
    const nPos = where ? where[1] : id === 'stairs' || id === 'blueBack' ? null : /chalkOut/.test(id) ? [-2.9, 2.4, Math.PI / 2 - 0.4] : /clockFace|bell|snap/.test(id) ? [0, -3.6, Math.PI] : [-0.2, 2.4, Math.PI];
    const tPos = where ? where[0] : /clockFace|bell|snap/.test(id) ? [-1.0, -2.8, Math.PI - 0.4] : /chalkOut/.test(id) ? [-3.6, 2.0, 1.2] : [-0.9, 2.0, Math.PI - 0.3];
    if (nPos) stand(E, TX + nPos[0], 0, nPos[1], nPos[2]);
    if (id === 'topWide') walk(E, t, 80.9, 83.2, V3(TX - 3.4, 0, 2.8), V3(TX - 0.6, 0, 2.6), 0.2);
    stand(TH, TX + tPos[0], 0, tPos[1], tPos[2]);
    keys(TH, t0, [[0, id === 'crowd' ? 'shockRecoil' : 'idle', { dur: 0.3 }]]); expr(TH, t0, [[0, id === 'topWide' ? 'scared' : id === 'grabHand' ? 'happy' : 'scared', { look: [0.3, 0.3] }]]);
    if (id === 'topWide') { keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'shocked', { look: [0.4, 0] }]]); }
    if (id === 'turns' || id === 'dadFace') { keys(E, t0, [[0, 'shockRecoil', { dur: 0.3 }]]); expr(E, t0, [[0, 'shocked', { look: [0.3, 0.2] }]]); }
    if (id === 'promiseStay') { keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'sad', { look: [0.3, 0.2] }]]); }
    if (id === 'didnt' || id === 'walkHome') { keys(E, t0, id === 'didnt' ? [[0, 'idle', { head: [0, 0, 0] }]] : [[0, 'idle'], [0.2, 'point', { armR: [-1.2, -0.4, 0.1], dur: 0.3 }]]); expr(E, t0, [[0, 'determined', { look: [0.4, 0.3] }]]); if (id === 'didnt') E.c.head.rotation.y += Math.sin((t - t0) * 9) * 0.25 * (t - t0 < 0.8 ? 1 : 0); }
    if (id === 'grabHand') { keys(E, t0, [[0, 'idle'], [0.5, 'point', { armL: [-0.5, 0.2, -0.3], elbowL: -0.2, armR: [0.1, 0, 0.1], dur: 0.3 }]]); expr(E, t0, [[0, 'determined', { look: [-0.5, -0.4] }]]); keys(TH, t0, [[0, 'idle'], [0.6, 'point', { armR: [-0.6, 0.2, 0.2], elbowR: -0.2, dur: 0.3 }]]); }
    if (id === 'stairs' || id === 'blueBack') { const a = V3(TX - 0.2, 0, 2.4), b = V3(TX - 2.9, 0, 2.5); if (id === 'stairs') walk(E, t, 105.6, 107.3, a, b, 0); else stand(E, b.x, 0, b.z, -Math.PI / 2); keys(E, t0, [[0, 'idle']]); expr(E, t0, id === 'blueBack' ? [[0, 'determined', { look: [0, 0] }], [1.0, 'happy', { look: [0, 0] }]] : [[0, 'determined', { look: [0, 0] }]]); if (id === 'stairs') walk(TH, t, 105.6, 107.3, V3(TX - 0.9, 0, 2.0), V3(TX - 3.6, 0, 2.0), 0); else stand(TH, TX - 3.6, 0, 2.0, -Math.PI / 2); }
    if (id === 'dadLaughs' || id === 'crowd') { stand(E, TX - 2.6, 0, 2.5, Math.PI / 2 + 0.4); stand(TH, TX - 3.4, 0, 2.0, Math.PI / 2 + 0.4); keys(E, t0, [[0, id === 'crowd' ? 'shockRecoil' : 'idle', { dur: 0.3 }]]); expr(E, t0, [[0, 'scared', { look: [0.6, 0.2] }]]); }
    if (id === 'chalkOut') { keys(E, t0, [[0, 'idle'], [0.2, 'presentPalm', { armR: [-1.3, 0.2, 0.3], elbowR: -1.0, dur: 0.3 }]]); expr(E, t0, [[0, 'determined', { look: [0.2, -0.3] }]]); hold(chalkStick, E.c.handR, [0, -0.06, 0.06], [Math.PI / 2, 0, 0]); }
    if (id === 'clockFace' || id === 'bell' || id === 'snap') { const wr = id === 'clockFace' ? Math.sin(t * 9) * 0.2 : 0; keys(E, t0, [[0, 'point', { armR: [-2.2 + wr, 0.2, 0.2 + wr], elbowR: -0.3 }]]); expr(E, t0, [[0, 'determined', { look: [0, 0.5] }]]); if (id === 'clockFace') hold(chalkStick, E.c.handR, [0, -0.06, 0.06], [Math.PI / 2, 0, 0]); }
    // the gray crowd
    if (/^(crowd|clockFace|bell|snap)$/.test(id)) { const grow = id === 'crowd' ? ease(between(t, 113.3, 115.5)) : 1; GRAYP.forEach((g, k) => { if (k >= 12) return; const ang = (k / 12) * Math.PI * 1.6 + 0.8, r = 3.6 - grow * 1.0; const x = TX + Math.cos(ang) * r * 1.05, z = Math.sin(ang) * r * 0.9 + 0.2; if (z < -3.7) return; g.root.visible = true; g.root.position.set(x, 0, z); g.root.rotation.set(0, Math.atan2(TX - 0.5 - x, 1.2 - z), 0); g.A.keys([[0, 'point', { armR: [-1.4, 0.1, 0.1], armL: [-1.4, -0.1, -0.1], elbowR: -0.2, elbowL: -0.2 }]]); g.A.update(t + k); }); }
  }
  // ----------------------------------------------------------------- dining room
  if (sc === 'din') {
    if (id === 'flashDinner') { seat(MOM, 2, 1.68); seat(E, 0, 1.3); seat(TH, 1, 0.9); keys(MOM, t0, [[0, 'idle', SIT]]); keys(E, t0, [[0, 'idle', SIT]]); keys(TH, t0, [[0, 'idle', SIT]]); expr(MOM, t0, [[0, 'happy', { look: [0.6, 0] }]]); expr(E, t0, [[0, 'happy', { look: [0.7, 0.1] }]]); expr(TH, t0, [[0, 'laughing', { look: [0.7, 0] }]]); const k = ease(between(t, 92.0, 94.6)); stand(DAD, DX + lerp(2.3, 3.4, k), 0, -1.6, lerp(-Math.PI / 2 - 0.6, Math.PI / 2, ease(between(t, 92.6, 93.6)))); keys(DAD, t0, [[0, 'idle'], [0.4, 'presentPalm', { armR: [-2.6, 0.2, 0.4], elbowR: -0.3, dur: 0.3 }]]); expr(DAD, t0, [[0, 'happy', { look: [-0.4, 0] }]]); DAD.c.av.armR.rotation.z += Math.sin(t * 9) * 0.3; if (t > 94.3) DAD.root.visible = false; }
    if (id === 'ghostDad' || id === 'dinnerDad') { seat(MOM, 2, 1.68); seat(E, 1, 1.45); seat(TH, 3, 1.12); seat(DAD, 0, 1.82); for (const o of [MOM, E, TH, DAD]) keys(o, t0, [[0, 'idle', SIT]]); if (id === 'ghostDad') { DAD_G.set(1); DAD_G.fade(0.32); expr(MOM, t0, [[0, 'sad', { look: [0, -0.3] }]]); expr(E, t0, [[0, 'sad', { look: [0, -0.3] }]]); expr(TH, t0, [[0, 'sad', { look: [0, -0.3] }]]); expr(DAD, t0, [[0, 'sad', { look: [0.5, 0] }]]); } else { expr(MOM, t0, [[0, 'laughing']]); expr(E, t0, [[0, 'happy', { look: [-0.5, 0] }]]); expr(TH, t0, [[0, 'happy']]); expr(DAD, t0, [[0, 'laughing', { look: [0.5, 0] }]]); } }
    if (id === 'theoAsks' || id === 'lipsGray') { seat(E, 1, 1.45); seat(TH, 3, 1.12); seat(MOM, 2, 1.68); seat(DAD, 0, 1.82); DAD_G.set(0); for (const o of [MOM, E, TH, DAD]) keys(o, t0, [[0, 'idle', SIT]]); expr(TH, t0, [[0, 'happy', { look: [0, -0.2] }], [1.8, 'suspicious', { look: [0, -0.2] }]]); expr(MOM, t0, [[0, 'happy']]); expr(DAD, t0, [[0, 'happy', { look: [0.4, 0] }]]); expr(E, t0, id === 'lipsGray' ? [[0, 'neutral', { look: [0, 0.2] }], [0.2, 'shocked', { look: [0, 0.2] }]] : [[0, 'happy', { look: [0, 0.2] }]]); if (id === 'lipsGray') for (const m of NIA.mouth) grayMat(m, 0.55 * between(t, 140.9, 141.9)); }
  }
  // ----------------------------------------------------------------- outside the tower: chalk, colour flying back, morning
  if (id === 'colorsFly') STREAK.set(V3(0, 22, -88), between(t, 127.0, 129.9));
  if (id === 'morningWide') { /* townsfolk stroll (above) */ }
  if (id === 'peoplePromise') { stand(FOLK[5], 5.0, 0, 25.0, 0.6); stand(FOLK[2], 5.7, 0, 26.0, Math.PI + 0.6); keys(FOLK[5], t0, [[0, 'point', { armR: [-1.0, -0.3, 0.1], elbowR: -0.3, dur: 0.3 }]]); keys(FOLK[2], t0, [[0, 'point', { armR: [-1.0, -0.3, 0.1], elbowR: -0.3, dur: 0.3 }]]); expr(FOLK[5], t0, [[0, 'laughing']]); expr(FOLK[2], t0, [[0, 'happy']]); stand(ROSA, 6.3, 0, 23.6, -Math.PI / 2 - 0.6); keys(ROSA, t0, [[0, 'handsOnHips']]); expr(ROSA, t0, [[0, 'happy']]); }
  // ----------------------------------------------------------------- actors, faces, camera, polish
  for (const o of ALL) if (o.root.visible || (o === OLD && oldOn)) { if (o === OLD) o.root.visible = true; o.A.update(t); o.F.update(t); if (o === OLD) o.root.visible = false; }
  if (id === 'didnt') E.c.head.rotation.y += Math.sin((t - t0) * 9) * 0.3 * (t - t0 < 0.8 ? 1 : 0);
  if (id === 'grayHands') GRAYP.slice(4, 10).forEach((g, k) => { const w = Math.sin(t * 7 + k) * 0.4; g.c.av.armR.rotation.z += w; g.c.av.armL.rotation.z -= w; });
  if (id === 'flashDinner' && DAD.root.visible) DAD.c.av.armR.rotation.z += Math.sin(t * 9) * 0.3;
  const REL = { nia: NIA, dad: DAD, theo: THEO, gus: GUS }[s.rel]; const fr = REL ? face(REL) : null; const rp = (p) => (fr ? [fr.x + p[0], fr.y + p[1], fr.z + p[2]] : p);
  const cam = CAM.at(t, [[0, rp(s.a[0]), rp(s.a[1]), s.a[2]], [1, rp(s.b[0]), rp(s.b[1]), s.b[2]]].map(([k, p, l, f]) => [k === 0 ? t0 : t1, p, l, f]), { shakes: s.shakes || [], punch: s.punch || [] });
  camera.lookAt(cam);
  const fogFar = sc === 'city' ? (id === 'cityWide' || id === 'drainWide' || id === 'colorsFly' || id === 'morningWide' ? 320 : 220) : 60; scene.fog.near = sc === 'city' ? 40 : 10; scene.fog.far = fogFar;
  const target = s.dof === 'nia' ? face(NIA) : s.dof === 'dad' ? face(DAD) : s.dof === 'gus' ? face(GUS) : s.dof === 'theo' ? face(THEO) : s.dof;
  if (target && target.isVector3) PL.dof(target, { range: 0.9, aperture: 0.012, maxblur: 0.006 }); else if (target) PL.dof(target[0], { range: target[1], aperture: 0.01, maxblur: 0.005 }); else PL.dof(V3(0, 0, 0), { on: false });
  const rimT = NIA.root.visible ? face(NIA) : DAD.root.visible ? face(DAD) : cam;
  PL.rimAt(rimT, sc === 'top' ? 0.9 : 1.0, sc === 'top' ? 0xffd8a0 : 0xfff4e0);
  PL.hideContacts(); [['n', NIA], ['t', THEO], ['d', DAD], ['m', MOM], ['r', ROSA], ['g', GUS], ['dl', DALE], ['my', MAYOR], ['b', BAKER], ['c', CALLER]].forEach(([k, o]) => { if (o.root.visible && sc !== 'din') PL.contact(k, o.root, 0, 0.8); });
}
window.renderAt = (t) => { if (window.__NO_RENDER) { pose(t); return; } C.renderAccum(2, (k) => pose(t - k / 120)); };
window.SHOT_TIMES = SH.map((s) => s.t); window.SHOT_IDS = SH.map((s) => s.id); window.END = END;
window.HOUSE_RULES = { framing: false, close: SH.filter((s) => s.close).map((s) => s.t) };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { rotation: { x: 0 } } })) };
window.READY = true;
