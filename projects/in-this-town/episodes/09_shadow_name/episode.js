// Episode 09 "In This Town, You Can't Hear Your Name Twice" (146.7 s, voice 1.25x +6). Long-form story.
// Locations: the town street (night), Eli's house, the Dim Wood, the House of Names. Characters: Eli, Max, Mrs. Plum,
// Ash (the shadow), townsfolk, a crowd of shadows. Upgraded rig: expressive faces, R15 acting, eased cameras, rim
// light, contact shadows, depth of field, motion blur.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { livingRoom, street } from '../../kit/kuro.js';
import { avatar } from '../../kit/rig.js';
import { faceRig } from '../../kit/face.js';
import { actor, cameraRig } from '../../kit/act.js';
import { polish } from '../../kit/polish.js';
import { storm } from '../../kit/farm.js';
import { dimWood, nameHall, fireflies, mirror, bigMirror, nameTag, flatPerson } from '../../kit/shadowkit.js';
import * as P from '../../kit/props.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
C.allowBlur(true); scene.add(camera); camera.near = 0.05; camera.far = 600;
const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const AMP = await (async () => { try { return (await (await fetch(new URL('./amp.json', import.meta.url))).json()).amp; } catch { return null; } })();
const END = WORDS[WORDS.length - 1][1] + 0.6;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const between = (t, a, b) => clamp01((t - a) / (b - a));

// ---------------------------------------------------------------- sets
const HOUSE = livingRoom(scene, { plant: false });
const TOWN = street(scene, 200); const SX = 200;
const WOOD = dimWood(scene, 600), WX = 600;
const HALL = nameHall(scene, 800), HX = 800;
const RAIN = storm(scene), FLY = fireflies(scene, 170);
HOUSE.couch.visible = false; HOUSE.lamp.visible = false; HOUSE.socks.visible = false;
{ // stairs on the right of the house, a candle and a book on the coffee table
  const wood = P.std(0x7a5a3a); for (let k = 0; k < 8; k++) P.box(1.1, 0.2 * (k + 1), 0.3, wood, 3.9, 0.1 * (k + 1), 0.9 + (7 - k) * 0.3 + 0.0, scene);
  P.box(1.2, 0.1, 1.2, wood, 3.9, 1.6, 0.0, scene);
}
const candle = new THREE.Group(); candle.position.set(0.25, 0.45, -1.3); scene.add(candle); P.cyl(0.03, 0.03, 0.12, P.std(0xf4f0e6), 0, 0.06, 0, candle, 10); const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd070 })); flame.scale.y = 1.6; flame.position.y = 0.15; candle.add(flame);
const candleLight = new THREE.PointLight(0xffb060, 6, 9, 1.6); candleLight.position.set(0.25, 0.7, -1.3); scene.add(candleLight);
const book = P.box(0.3, 0.03, 0.22, P.std(0x3a6aa8), -0.2, 0.46, -1.3, scene);
const flashlight = new THREE.Group(); scene.add(flashlight); P.cyl(0.025, 0.03, 0.22, P.std(0x2a2a30), 0, 0, 0, flashlight, 10).rotation.x = Math.PI / 2; { const bm = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending })); bm.rotation.x = -Math.PI / 2; bm.position.z = 1.6; flashlight.add(bm); }
const MIR = mirror(scene), BIG = bigMirror(scene);
const wallPlane = P.box(8, 4, 0.1, P.std(0x6a6a7a), 0, 0, 0, scene); // plain wall used for the "no shadow" shot

// ---------------------------------------------------------------- cast
const actors = [];
const make = (name, opts, h, face, style, ink = '#1b1b24') => { const c = avatar(scene, { r15: true, ...opts }, h, { face }); const F = faceRig(c, { ink, skin: opts.skin, style }); const A = actor(c, { seed: name.length * 3 + 1 }); actors.push({ name, c, root: c.root }); return { c, F, A, root: c.root, name }; };
const ELI = make('eli', { skin: 0xf2c49a, shirt: 0x4a7ad8, pants: 0x2c3e74, hair: 0x4a2a12, hairStyle: 'messy' }, 1.45, 'neutral', 'dramatic');
const MAX = make('max', { skin: 0xf6c89a, shirt: 0xf2c14e, pants: 0x3a4a6a, hair: 0x8a5a2a, hairStyle: 'messy' }, 1.12, 'neutral', 'dramatic');
const PLUM = make('plum', { skin: 0xe8c8a8, shirt: 0x8a5a9a, pants: 0x4a4a5a, hair: 0xe8e8ee, hairStyle: 'bun', glasses: true, scarf: 0xc8843a }, 1.55, 'neutral', 'stern');
const ASH = make('ash', { skin: 0x16121f, shirt: 0x16121f, pants: 0x16121f, shoes: 0x0a0810, hair: 0x16121f, hairStyle: 'messy', faceInk: '#f6f6fa' }, 1.45, 'smug', 'normal', '#f6f6fa');
const FOLK = [['Pancake', 0xd8743a, 0x2a6a5a], ['Captain', 0x8a5a3a, 0x24304a], ['Mouse', 0xf0c090, 0x8a3a5a]].map(([tag, skin, shirt], i) => { const o = make('folk' + i, { skin, shirt, pants: 0x3a3a46, hair: 0x2a1a12, hairStyle: i === 1 ? 'short' : 'ponytail', hat: i === 1 ? 'police' : null }, 1.65 + i * 0.05, 'neutral', 'normal'); o.tag = nameTag(o.root, tag, 2.15 * 1.0); o.tag.visible = false; return o; });
const CROWD = Array.from({ length: 14 }, (_, i) => avatar(scene, { shadowMode: true, r15: true }, 1.45 + (i % 4) * 0.12));
const WALLELI = flatPerson(scene, 1.45, {}), WALLMAX = flatPerson(scene, 1.12, {});
const PL = polish(C), CAM = cameraRig(camera);

// ---------------------------------------------------------------- staging helpers
const stand = (o, x, y, z, yaw = 0) => { o.root.rotation.order = 'XYZ'; o.root.rotation.set(0, yaw, 0); o.root.position.set(x, y, z); o.root.visible = true; };
const face = (o) => o.c.face.getWorldPosition(new THREE.Vector3());
const keys = (o, t0, list) => o.A.keys(list.map(([dt, n, e]) => [t0 + dt, n, e || {}]));
const expr = (o, t0, list) => o.F.track(list.map(([dt, n, e]) => [t0 + dt, n, e || {}]));
const walk = (o, t, t0, t1, a, b, run = 0) => { o.A.walk([t0, t1, a, b, run]); const u = between(t, t0, t1); o.root.position.set(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u)); o.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); o.root.visible = true; };
const hold = (obj, anchor, pos = [0, 0, 0], rot = [0, 0, 0]) => { obj.visible = true; anchor.updateWorldMatrix(true, false); const q = anchor.getWorldQuaternion(new THREE.Quaternion()); obj.position.copy(anchor.getWorldPosition(new THREE.Vector3())).add(V3(...pos).applyQuaternion(q)); obj.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))); };
const talk = []; ELI.F.lipsync(WORDS, AMP, 60, (t) => talk.some(([a, b]) => t >= a && t < b));

// ---------------------------------------------------------------- shots (camera: from -> to, eased across the shot)
const SH = [];
const S = (t, id, light, a, b, o = {}) => SH.push({ t: Math.max(0, t - 2 / 60), id, light, a, b, ...o });
const TC = [SX, 0, -12];
S(0, 'townWide', 'night', [[SX + 5, 2.4, 6], [SX, 1.2, -18], 54], [[SX + 3.5, 2.0, -2], [SX, 1.2, -20], 50], { dof: [V3(SX, 1, -18), 20], shots: [] });
S(2.2, 'eliHears', 'night', [[SX + 1.8, 1.5, -8.0], [SX, 1.2, -12.5], 46], [[SX + 1.5, 1.45, -9.0], [SX, 1.25, -12.5], 42], { talkOn: true, dof: 'eli' });
S(4.4, 'eliClose', 'night', [[SX + 0.3, 1.5, -10.6], [SX, 1.3, -12.5], 36], [[SX + 0.1, 1.45, -11.0], [SX, 1.3, -12.5], 32], { dof: 'eli' });
S(6.9, 'swap', 'night', [[SX - 3.6, 1.5, -8.5], [SX, 1.0, -12.5], 52], [[SX - 3.2, 1.4, -9.0], [SX, 1.0, -12.5], 48], { dof: [V3(SX, 1, -12.5), 4], shakes: [[7.4, 0.04, 0.4]] });
S(8.7, 'ashLeaves', 'night', [[SX + 2.8, 1.6, -9.0], [SX, 1.1, -16], 50], [[SX + 3.4, 1.8, -7.5], [SX, 1.1, -19], 46], { dof: [V3(SX, 1, -17), 6] });
S(11.8, 'eliFlat', 'night', [[SX - 7.4, 1.6, -14.8], [SX - 12.9, 1.1, -17.6], 46], [[SX - 8.2, 1.5, -15.6], [SX - 12.9, 1.15, -17.6], 40], { dof: [V3(SX - 12.9, 1.2, -17.6), 4] });
S(15.42, 'folk', 'night', [[SX - 1.4, 1.7, -4], [SX, 1.5, -22], 52], [[SX - 1.0, 1.7, -6], [SX, 1.5, -22], 48], { dof: [V3(SX, 1.5, -22), 12] });
S(17.84, 'folkClose', 'night', [[SX + 0.8, 1.6, -16.5], [SX, 1.7, -20.5], 40], [[SX + 0.4, 1.6, -17.2], [SX, 1.7, -20.5], 36], { dof: [V3(SX, 1.7, -20.5), 3] });
S(20.66, 'eliSmile', 'night', [[SX + 1.4, 1.5, -9.4], [SX, 1.25, -12.5], 40], [[SX + 1.1, 1.45, -10.0], [SX, 1.25, -12.5], 36], { talkOn: true, dof: 'eli' });
S(23.8, 'houseWide', 'indoorNight', [[2.2, 1.9, 6.3], [0.1, 0.8, -1.6], 54], [[1.6, 1.7, 5.4], [0.1, 0.9, -1.6], 50], { flash: [[24.6, 0.6], [24.8, 0.4]], dof: [V3(0.1, 0.9, -1.6), 6] });
S(26.5, 'maxYells', 'indoorNight', [[1.9, 0.9, 6.4], [3.7, 0.8, 3.9], 46], [[2.4, 0.9, 6.0], [3.7, 0.8, 3.9], 42], { dof: [V3(3.7, 0.8, 3.9), 3], shakes: [[28.6, 0.03, 0.3]] });
S(31.26, 'whisperBehind', 'indoorNight', [[-0.6, 1.5, -0.2], [0.0, 1.2, -2.6], 42], [[-0.4, 1.45, -0.8], [0.0, 1.2, -2.6], 36], { dof: 'eli' });
S(35.24, 'eliFreeze', 'indoorNight', [[0.7, 1.4, -0.4], [0.0, 1.2, -1.9], 34], [[0.5, 1.4, -0.8], [0.0, 1.2, -1.9], 30], { dof: 'eli' });
S(36.42, 'wallBare', 'indoorNight', [[1.5, 1.3, 1.6], [-0.5, 1.1, -3.4], 50], [[1.2, 1.3, 1.4], [-0.8, 1.1, -3.4], 46], { dof: [V3(-0.5, 1.2, -3.4), 4] });
S(39.02, 'ashDoor', 'indoorNight', [[1.4, 1.3, 5.4], [3.9, 2.1, 0.4], 46], [[1.8, 1.4, 5.2], [3.9, 2.0, 0.6], 44], { dof: [V3(3.9, 2.0, 0.6), 5] });
S(40.9, 'ashDown', 'indoorNight', [[-1.2, 1.3, 4.6], [3.6, 0.9, 2.6], 52], [[-1.8, 1.4, 3.8], [-2.0, 1.0, 1.4], 52], { dof: [V3(2, 1, 2), 8], rain: 0.5 });
S(44.16, 'clockDawn', 'indoorNight', [[1.0, 1.7, 4.0], [4.5, 1.5, 0.3], 46], [[2.6, 1.6, 3.4], [4.5, 1.5, 0.3], 40], { dof: [V3(4.5, 1.5, 0.3), 3] });
S(46.0, 'eliHands', 'indoorNight', [[0.7, 1.3, 0.2], [0.0, 1.0, -1.6], 40], [[0.4, 1.2, -0.3], [0.0, 1.0, -1.6], 34], { dof: 'eli', talkOn: true });
S(49.24, 'maxStand', 'indoorNight', [[1.6, 1.0, 6.4], [3.7, 0.8, 3.9], 46], [[2.0, 1.0, 6.0], [3.7, 0.8, 3.9], 42], { dof: [V3(3.7, 0.8, 3.9), 3] });
S(51.12, 'maxFlat', 'indoorNight', [[-0.6, 1.2, 1.4], [1.9, 1.0, -3.4], 46], [[-0.2, 1.2, 1.0], [1.9, 1.0, -3.4], 40], { dof: [V3(1.9, 1.0, -3.4), 3] });
S(53.34, 'runToPlum', 'night', [[SX + 1.8, 1.6, -4.0], [SX - 4, 1.0, -14], 54], [[SX - 3.5, 1.7, -14], [SX - 11, 1.2, -20], 52], { rain: 0.8, dof: [V3(SX - 8, 1.2, -18), 10] });
S(55.5, 'plumDoor', 'night', [[SX - 10.5, 1.5, -12.2], [SX - 10.5, 1.3, -20.2], 44], [[SX - 10.5, 1.5, -13.4], [SX - 10.5, 1.3, -20.2], 40], { rain: 0.8, dof: [V3(SX - 10, 1.4, -20.3), 3] });
S(59.28, 'plumClose', 'night', [[SX - 10.9, 1.5, -15.2], [SX - 11.6, 1.5, -20.2], 38], [[SX - 10.9, 1.5, -16.2], [SX - 11.6, 1.5, -20.2], 34], { rain: 0.8, dof: 'plum' });
S(64.94, 'woodWide', 'night', [[WX + 4, 2.6, 8], [WX, 1.8, -10], 56], [[WX + 3, 2.2, 3], [WX, 1.8, -12], 52], { fog: 1, dof: [V3(WX, 1.6, -10), 14] });
S(67.66, 'shoes', 'night', [[WX + 0.2, 1.5, -2.5], [WX + 1.0, 3.6, -8], 54], [[WX + 0.2, 1.6, -4.0], [WX + 1.0, 3.9, -9], 50], { fog: 1, dof: [V3(WX + 2, 4, -6), 5] });
S(69.06, 'whisperWood', 'night', [[WX + 0.5, 1.5, -15.2], [WX - 0.4, 1.2, -12.0], 38], [[WX + 0.3, 1.5, -14.6], [WX - 0.4, 1.2, -12.0], 34], { fog: 1, dof: 'eli', follow: [[0.5, 0.15, -3.0], [0.3, 0.15, -2.4]] });
S(72.5, 'eliWorry', 'night', [[WX + 0.6, 1.45, -29.0], [WX, 1.25, -26], 34], [[WX + 0.4, 1.45, -28.4], [WX, 1.25, -26], 30], { fog: 1, dof: 'eli', follow: [[0.6, 0.1, -2.6], [0.4, 0.1, -2.1]] });
S(77.86, 'keepWalking', 'night', [[WX + 1.0, 1.6, -42], [WX, 1.1, -54], 52], [[WX + 1.2, 1.7, -46], [WX, 1.1, -58], 50], { fog: 1, dof: [V3(WX, 1, -46), 10], follow: [[0.9, 0.35, 3.6], [1.1, 0.4, 3.2]], fov: 50 });
S(79.02, 'stoneDoor', 'night', [[WX + 2.6, 1.9, -61], [WX - 0.4, 2.4, -72], 54], [[WX + 1.6, 1.9, -64.5], [WX - 0.4, 2.6, -72], 48], { fog: 1, dof: [V3(WX, 2.2, -72), 8] });
S(82.62, 'hallWide', 'indoorNight', [[HX + 4.6, 2.4, -18.6], [HX, 1.8, 8], 58], [[HX + 3.4, 2.2, -16], [HX, 1.8, 8], 54], { dof: [V3(HX, 1.5, 6), 18] });
S(87.5, 'twoJars', 'indoorNight', [[HX, 1.4, 4.4], [HX, 1.25, 9.5], 48], [[HX, 1.38, 5.6], [HX, 1.25, 9.5], 42], { dof: [V3(HX, 1.3, 9.5), 4] });
S(89.6, 'ashSmile', 'indoorNight', [[HX + 1.2, 1.5, 2.6], [HX, 1.35, 7.0], 40], [[HX + 0.8, 1.5, 3.4], [HX, 1.35, 7.0], 34], { dof: 'ash' });
S(92.86, 'youCame', 'indoorNight', [[HX + 0.7, 1.4, 5.4], [HX, 1.35, 7.0], 34], [[HX + 0.4, 1.4, 5.8], [HX, 1.35, 7.0], 30], { dof: 'ash' });
S(94.68, 'eliMirror', 'indoorNight', [[HX - 1.0, 1.5, 3.8], [HX, 1.3, 1.2], 42], [[HX - 0.8, 1.45, 3.2], [HX, 1.3, 1.2], 36], { dof: 'eli', talkOn: true });
S(95.84, 'handsFlat', 'indoorNight', [[HX + 0.3, 1.05, 3.4], [HX, 1.0, 1.9], 40], [[HX + 0.2, 1.02, 3.0], [HX, 1.0, 1.9], 36], { dof: [V3(HX, 1.0, 1.9), 2] });
S(97.86, 'mirrorPov', 'indoorNight', [[HX, 1.2, 0.8], [HX, 1.2, 2.0], 40], [[HX, 1.2, 0.8], [HX, 1.2, 2.0], 40], { noRim: true });
S(100.4, 'smallShape', 'indoorNight', [[HX, 1.2, 0.8], [HX, 1.2, 2.0], 28], [[HX, 1.2, 0.8], [HX, 1.2, 2.0], 24], { noRim: true });
S(103.46, 'ashSad', 'indoorNight', [[HX + 0.8, 1.4, 4.6], [HX, 1.35, 7.0], 32], [[HX + 0.5, 1.35, 5.2], [HX, 1.35, 7.0], 28], { dof: 'ash' });
S(106.12, 'eliNames', 'indoorNight', [[HX - 0.9, 1.45, 3.2], [HX, 1.3, 1.2], 38], [[HX - 0.6, 1.4, 2.9], [HX, 1.3, 1.2], 34], { dof: 'eli', talkOn: true });
S(109.1, 'jarsCrack', 'indoorNight', [[HX + 2.4, 1.7, 5.8], [HX, 1.3, 9.5], 44], [[HX + 2.0, 1.9, 6.6], [HX, 1.4, 9.5], 40], { dof: [V3(HX, 1.3, 9.5), 3], shakes: [[109.5, 0.03, 0.4]] });
S(112.18, 'nameChest', 'indoorNight', [[HX - 0.7, 1.4, 3.0], [HX, 1.2, 1.2], 36], [[HX - 0.5, 1.4, 2.7], [HX, 1.2, 1.2], 32], { dof: 'eli' });
S(113.68, 'ashSpeaks', 'indoorNight', [[HX + 0.8, 1.5, 4.8], [HX, 1.35, 7.0], 34], [[HX + 0.5, 1.45, 5.4], [HX, 1.35, 7.0], 30], { dof: 'ash' });
S(118.88, 'crowd', 'indoorNight', [[HX - 2.6, 1.8, 4.2], [HX, 1.3, -6], 56], [[HX - 2.0, 1.9, 3.4], [HX, 1.3, -7], 52], { dof: [V3(HX, 1.3, -6), 14], shakes: [[119.0, 0.03, 0.4]] });
S(121.84, 'allWant', 'indoorNight', [[HX + 0.8, 1.55, 4.6], [HX, 1.35, 7.0], 32], [[HX + 0.5, 1.5, 5.4], [HX, 1.35, 7.0], 28], { dof: 'ash' });
S(123.84, 'sunrise', 'indoorNight', [[HX + 2.2, 1.8, 3.4], [HX, 1.4, -6], 56], [[HX + 1.2, 1.6, 2.2], [HX, 1.4, -8], 50], { dof: [V3(HX, 1.4, -8), 8], sunrise: true, shakes: [[124.4, 0.04, 0.5]], punch: [[124.4, 6, 0.6]] });
S(128.18, 'dissolve', 'indoorNight', [[HX - 1.8, 1.6, 4.0], [HX, 1.4, -8], 56], [[HX - 1.0, 1.7, 0.0], [HX, 1.6, -14], 50], { dof: [V3(HX, 1.4, -8), 10], sunrise: true, fly: true });
S(133.06, 'morning', 'morning', [[SX + 4.0, 2.0, 2], [SX, 1.4, -14], 54], [[SX + 2.6, 1.8, -4], [SX, 1.4, -16], 50], { dof: [V3(SX, 1.4, -15), 16] });
S(138.52, 'nightMirror', 'indoorNight', [[0.9, 1.3, 1.2], [0.0, 1.1, -2.6], 44], [[0.6, 1.25, 0.6], [0.0, 1.1, -2.6], 38], { dof: 'eli' });
S(141.44, 'finalMirror', 'indoorNight', [[0.0, 1.2, 0.6], [0.0, 1.2, 2.0], 26], [[0.0, 1.2, 0.8], [0.0, 1.2, 2.0], 22], { noRim: true });

function sceneOf(id) { if (/^(townWide|eliHears|eliClose|swap|ashLeaves|eliFlat|folk|folkClose|eliSmile|runToPlum|plumDoor|plumClose|morning)$/.test(id)) return 'town'; if (/^(wood|shoes|whisperWood|eliWorry|keepWalking|stoneDoor)/.test(id)) return 'wood'; if (/^(hall|twoJars|ash(Smile|Sad|Speaks)|youCame|eliMirror|handsFlat|mirrorPov|smallShape|eliNames|jarsCrack|nameChest|crowd|allWant|sunrise|dissolve)/.test(id)) return 'hall'; return 'house'; }

function pose(t) {
  let i = 0; SH.forEach((s, j) => { if (t >= s.t) i = j; }); const s = SH[i], id = s.id, sc = sceneOf(id), u = between(t, s.t, (SH[i + 1] || { t: END }).t);
  const t0 = s.t; const center = sc === 'town' ? [SX, 0, -12] : sc === 'wood' ? [WX, 0, -30] : sc === 'hall' ? [HX, 0, 2] : [0, 0, 0];
  setLight(s.light, center);
  // reset
  for (const o of [ELI, MAX, PLUM, ASH, ...FOLK]) { o.root.visible = false; } CROWD.forEach((c) => (c.root.visible = false)); [WALLELI, WALLMAX].forEach((w) => (w.root.visible = false)); flashlight.visible = false; MIR.g.visible = false; BIG.m.visible = false; wallPlane.visible = false; FOLK.forEach((f) => (f.tag.visible = false)); FLY.m.visible = false;
  candle.visible = candleLight.visible = sc === 'house'; candleLight.intensity = sc === 'house' ? 5 + Math.sin(t * 17) * 1.2 + Math.sin(t * 9) : 0; flame.scale.set(1, 1.6 + Math.sin(t * 20) * 0.25, 1);
  HALL.beam.material.opacity = 0; HALL.sun.intensity = 0; HALL.leafOpen = 0; WOOD.leaf.rotation.y = 0; WOOD.sway(t);
  HALL.jEli.fl.visible = HALL.jMax.fl.visible = true; HALL.jEli.gl.visible = HALL.jMax.gl.visible = true;
  grade.uniforms.flash.value = 0; for (const [ft, fa] of s.flash || []) { const d = t - ft; if (d > 0 && d < 0.18) grade.uniforms.flash.value = fa * (1 - d / 0.18); }
  HOUSE.door.rotation.y = 0;
  const E = ELI, M = MAX, A = ASH, PM = PLUM;
  // ----------------------------------------------------------------- town
  if (id === 'townWide') { stand(E, SX + 0.2, 0, -12, Math.PI); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'neutral', { look: [0.4, 0] }], [1.6, 'scared', { look: [0.7, 0.1] }]]); stand(MAX, SX - 1.4, 0, -4, Math.PI); MAX.root.visible = false; }
  if (id === 'eliHears') { stand(E, SX, 0, -12.5, 0.0); keys(E, t0, [[0, 'idle'], [1.3, 'shockRecoil', { dur: 0.25, antic: 0.1 }]]); expr(E, t0, [[0, 'scared', { look: [0.8, 0] }], [0.9, 'dread', { look: [-0.5, 0.3] }]]); }
  if (id === 'eliClose') { stand(E, SX, 0, -12.5, 0.0); keys(E, t0, [[0, 'idle'], [0.9, 'crouch', { dur: 0.4 }]]); expr(E, t0, [[0, 'scared', { look: [0.9, -0.1] }], [1.0, 'scared', { look: [-0.7, 0.1] }], [1.8, 'dread', { look: [0.4, 0] }]]); }
  if (id === 'swap') { const k = between(t, 7.3, 8.5); stand(E, SX, 0, -12.5, 0.0); keys(E, t0, [[0, 'idle'], [0.6, 'shockRecoil', { dur: 0.2 }]]); expr(E, t0, [[0, 'dread'], [0.5, 'shocked']]); stand(A, SX - 1.6 * ease(k), 0, -12.5 - 0.0, 0.2); A.root.visible = k > 0; keys(A, t0, [[0, 'idle']]); expr(A, t0, [[0, 'smug']]); grade.uniforms.flash.value = t > 7.35 && t < 7.55 ? 0.7 : 0; }
  if (id === 'ashLeaves') { const wk = [8.7, 11.8, V3(SX - 0.4, 0, -13), V3(SX - 0.2, 0, -26)]; walk(A, t, wk[0], wk[1], wk[2], wk[3], 0); expr(A, t0, [[0, 'smug']]); const tr = between(t, 9.5, 10.5); if (t > 10.4) { A.root.rotation.y = Math.PI + 0.6 * Math.sin(Math.PI * 0.5); } }
  if (id === 'eliFlat') { WALLELI.root.visible = true; WALLELI.root.position.set(SX - 12.9, 0.02, -17.6); WALLELI.root.rotation.set(0, Math.PI / 2, 0); WALLELI.pose('stuck', t); }
  if (id === 'folk') { FOLK.forEach((f, k) => { stand(f, SX + (k - 1) * 1.5 + 0.0, 0, -10 - k * 4 - ((t - t0) * 0.5), Math.PI); keys(f, t0, [[0, 'idle']]); expr(f, t0, [[0, 'neutral']]); f.tag.visible = t > 17.0; }); }
  if (id === 'folkClose') { FOLK.forEach((f, k) => { stand(f, SX + (k - 1) * 0.9, 0, -20.5 + k * -0.0, Math.PI); keys(f, t0, [[0, 'idle']]); expr(f, t0, [[0, 'happy']]); f.tag.visible = t > 17.84 + k * 0.7; }); }
  if (id === 'eliSmile') { stand(E, SX, 0, -12.5, 0.0); keys(E, t0, [[0, 'idle'], [1.2, 'shrug', { dur: 0.3 }]]); expr(E, t0, [[0, 'smug'], [1.6, 'sad', { look: [0.3, -0.4] }]]); }
  if (id === 'runToPlum') { walk(E, t, 53.34, 55.5, V3(SX + 1.0, 0, -4), V3(SX - 9.6, 0, -20.0), 1); expr(E, t0, [[0, 'scared', { look: [0.6, 0] }]]); }
  if (id === 'plumDoor' || id === 'plumClose') { stand(E, SX - 9.4, 0.0, -20.2, -Math.PI / 2 + 0.8); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'scared', { look: [0.5, 0.2] }]]); stand(PM, SX - 11.6, 0.0, -20.2, Math.PI / 2 - 0.9); keys(PM, t0, [[0, 'idle'], [0.2, 'presentPalm', { dur: 0.3 }]]); expr(PM, t0, [[0, 'stern']].map(([a, b]) => [a, 'determined']), 0); MIR.g.visible = true; MIR.show('eli'); MIR.g.position.set(SX - 10.6, 1.15, -20.0); MIR.g.rotation.set(0, Math.PI / 2, 0); if (t > 56.7) { hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); } }
  if (id === 'morning') { for (let k = 0; k < 3; k++) { stand(FOLK[k], SX + (k - 1) * 1.8, 0, -9 - k * 2.2, Math.PI); keys(FOLK[k], t0, [[0, 'idle'], [0.5 + k * 0.4, 'presentPalm', { dur: 0.3 }]]); expr(FOLK[k], t0, [[0, 'happy'], [2.5, 'laughing']]); } stand(E, SX + 0.6, 0, -13, Math.PI); keys(E, t0, [[0, 'idle'], [1.5, 'cheer' in {} ? 'cheer' : 'shrug']]); expr(E, t0, [[0, 'happy']]); }
  // ----------------------------------------------------------------- Eli's house
  if (id === 'houseWide') { stand(E, 0.1, 0, -0.6, Math.PI + 0.2); keys(E, t0, [[0, 'slump'], [1.8, 'idle']]); expr(E, t0, [[0, 'bored', { look: [0.2, -0.5] }], [1.0, 'scared', { look: [0.6, 0] }]]); book.visible = true; }
  if (id === 'maxYells') { stand(MAX, 3.7, 0, 3.9, 0.3); keys(MAX, t0, [[0, 'yell'], [1.6, 'yell', { head: [-0.2, 0, 0] }], [2.6, 'yell']]); expr(MAX, t0, [[0, 'dread'], [0.7, 'furious'], [1.6, 'scared']]); MAX.F.lipsync(WORDS, AMP, 60, (tt) => tt > 26.5 && tt < 30.4); }
  if (id === 'whisperBehind') { stand(E, 0.1, 0, -1.7, 0.2); keys(E, t0, [[0, 'idle'], [1.5, 'shockRecoil', { dur: 0.2 }]]); expr(E, t0, [[0, 'neutral'], [0.9, 'scared', { look: [0.6, 0] }], [2.2, 'dread', { look: [-0.7, 0] }]]); }
  if (id === 'eliFreeze') { stand(E, 0.1, 0, -1.7, 0.2); keys(E, t0, [[0, 'idle'], [0.2, 'crouch', { dur: 0.3 }]]); expr(E, t0, [[0, 'dread', { look: [-0.5, 0.2] }], [0.7, 'dread', { look: [0.5, 0.2] }]]); }
  if (id === 'wallBare') { stand(E, 0.1, 0, -2.6, Math.PI); keys(E, t0, [[0, 'idle'], [0.9, 'pickup', { dur: 0.3 }]]); expr(E, t0, [[0, 'scared', { look: [0.2, 0.2] }], [1.2, 'shocked', { look: [0, 0] }]]); }
  if (id === 'ashDoor') { stand(A, 3.9, 1.6, 0.1, Math.PI - 0.4); keys(A, t0, [[0, 'idle'], [0.5, 'presentPalm', { armR: [-2.5, 0, 0.6], dur: 0.2 }]]); expr(A, t0, [[0, 'smug']]); flashlight.visible = true; hold(flashlight, A.c.handL, [0, -0.05, 0.1], [0, 0, 0]); }
  if (id === 'ashDown') { const a = V3(3.9, 1.6, 0.4), b = V3(3.9, 0.0, 3.8), c = V3(-3.6, 0, 1.4); const k = between(t, 40.9, 42.1); if (t < 42.1) { walk(A, t, 40.9, 42.1, a, b, 0); } else { walk(A, t, 42.1, 43.3, b, c, 0.6); } HOUSE.door.rotation.y = -1.3 * between(t, 42.8, 43.2); flashlight.visible = true; hold(flashlight, A.c.handL, [0, -0.05, 0.1], [0, 0, 0]); MAX.root.visible = true; stand(MAX, 3.0, 0, 4.2, Math.PI - 0.5); MAX.root.visible = true; keys(MAX, t0, [[0, 'idle']]); expr(MAX, t0, [[0, 'happy']]); }
  if (id === 'clockDawn') { stand(E, 2.4, 0, 3.2, Math.PI / 2 + 0.3); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'scared', { look: [0.6, 0] }]]); }
  if (id === 'eliHands') { stand(E, 0.1, 0, -1.2, 0.2); keys(E, t0, [[0, 'idle'], [0.5, 'presentPalm', { armR: [-0.9, 0, 0.1], armL: [-0.9, 0, -0.1], elbowL: -1.6, elbowR: -1.6, dur: 0.3 }]]); expr(E, t0, [[0, 'scared', { look: [0, -0.7] }], [1.5, 'dread', { look: [0, -0.7] }]]); }
  if (id === 'maxStand') { stand(MAX, 3.7, 0, 3.9, 0.4); keys(MAX, t0, [[0, 'idle']]); expr(MAX, t0, [[0, 'happy']]); }
  if (id === 'maxFlat') { WALLMAX.root.visible = true; WALLMAX.root.position.set(1.9, 0.02, -3.43); WALLMAX.root.rotation.set(0, 0, 0); WALLMAX.pose('stuck', t); const fade = 1 - 0.55 * between(t, 51.2, 52.7); WALLMAX.root.traverse((o) => { if (o.isMesh && o.material) { o.material.transparent = true; o.material.opacity = fade; } }); }
  // ----------------------------------------------------------------- Dim Wood
  if (id === 'woodWide') { stand(E, WX, 0, -9.0, Math.PI); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'scared', { look: [0.3, 0.1] }]]); walk(E, t, 64.94, 69.0, V3(WX + WOOD.path(-4), 0, -4), V3(WX + WOOD.path(-14), 0, -14), 0); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); }
  if (id === 'shoes' || id === 'whisperWood' || id === 'eliWorry' || id === 'keepWalking') {
    const spec = { shoes: [-5, -8], whisperWood: [-12, -12.6], eliWorry: [-26, -26.5], keepWalking: [-48, -56] }[id]; const za = spec[0], zb = spec[1], z = lerp(za, zb, u);
    if (id === 'keepWalking' || id === 'shoes') { walk(E, t, t0, (SH[i + 1] || { t: END }).t, V3(WX + WOOD.path(za), 0, za), V3(WX + WOOD.path(zb), 0, zb), 0); } else { stand(E, WX + WOOD.path(z), 0, z, Math.PI); keys(E, t0, [[0, 'idle'], [1.5, 'shockRecoil', { dur: 0.25 }]]); }
    expr(E, t0, [[0, id === 'eliWorry' ? 'sad' : 'scared', { look: [0.6, 0.1] }], [1.4, id === 'eliWorry' ? 'determined' : 'dread', { look: [-0.7, 0.2] }]]); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); }
  if (id === 'stoneDoor') { stand(E, WX + WOOD.path(-66) + 0.8, 0, -66.5, Math.PI); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'shocked', { look: [0, 0.4] }]]); WOOD.leaf.rotation.y = 0; }
  // ----------------------------------------------------------------- House of Names
  if (id === 'hallWide') { stand(E, HX, 0, -12, Math.PI); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'shocked', { look: [0, 0.3] }]]); walk(E, t, 82.62, 89.5, V3(HX, 0, -14), V3(HX, 0, 1.5), 0); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); }
  if (id === 'twoJars') { stand(E, HX, 0, 1.4, Math.PI); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'shocked', { look: [0, -0.2] }]]); E.root.visible = false; }
  if (/^(ashSmile|youCame|ashSad|ashSpeaks|allWant)$/.test(id)) { stand(A, HX, 0, 7.0, Math.PI); stand(E, HX, 0, 1.4, 0); keys(A, t0, [[0, 'idle'], [1.0, id === 'ashSad' ? 'slump' : 'idle']]); expr(A, t0, [[0, id === 'ashSad' ? 'sad' : id === 'allWant' ? 'furious' : 'smug']]); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'scared']]); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); if (id === 'ashSmile') { HALL.jEli.j.visible = true; } if (id === 'ashSpeaks') { stand(A, HX + 0.2, 0, 6.8, Math.PI - 0.1); expr(A, t0, [[0, 'smug'], [3.0, 'dread']]); } }
  if (id === 'eliMirror' || id === 'eliNames' || id === 'nameChest') { stand(E, HX, 0, 1.4, 0.0); keys(E, t0, [[0, 'idle'], [0.3, 'point', { armR: [-1.5, 0, 0.1], dur: 0.25 }]]); expr(E, t0, [[0, id === 'eliNames' ? 'determined' : 'scared', { look: [0, 0] }]]); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); stand(A, HX, 0, 7.0, Math.PI); expr(A, t0, [[0, 'smug']]); A.root.visible = false; if (id === 'nameChest') { grade.uniforms.flash.value = 0.15 * Math.max(0, Math.sin(Math.PI * between(t, 112.18, 113.0))); } }
  if (id === 'handsFlat') { stand(E, HX, 0, 1.4, 0); keys(E, t0, [[0, 'presentPalm', { armR: [-1.45, 0, 0.12], armL: [-1.45, 0, -0.12], elbowL: -0.25, elbowR: -0.25 }]]); expr(E, t0, [[0, 'dread', { look: [0, -0.7] }]]); const f = 1 - 0.8 * between(t, 95.9, 97.0); [E.c.armL, E.c.armR].forEach((a) => (a.scale.z = f)); [E.c.elbowL, E.c.elbowR].forEach((a) => (a.scale.z = f)); }
  else { [ELI.c.armL, ELI.c.armR, ELI.c.elbowL, ELI.c.elbowR].forEach((a) => (a.scale.z = 1)); }
  if (id === 'mirrorPov' || id === 'smallShape') { BIG.m.visible = true; BIG.show('small'); BIG.m.position.set(HX, 1.2, 1.3); BIG.m.rotation.set(0, Math.PI, 0); BIG.m.scale.setScalar(id === 'smallShape' ? 1.0 + 0.2 * u : 1.0); }
  if (id === 'jarsCrack') { const k = between(t, 109.3, 111.3); HALL.jEli.gl.scale.setScalar(1 + k * 0.5); HALL.jMax.gl.scale.setScalar(1 + k * 0.5); HALL.jEli.pl.intensity = 4 + 14 * k; HALL.jMax.pl.intensity = 4 + 14 * k; FLY.set(t, between(t, 110.8, 113.6), V3(HX, 1.3, 9.5), V3(HX, 1.3, 1.4)); stand(A, HX, 0, 7.0, Math.PI); expr(A, t0, [[0, 'shocked']]); }
  if (id === 'crowd') { stand(E, HX, 0, 1.4, 0); keys(E, t0, [[0, 'idle'], [0.6, 'shockRecoil', { dur: 0.2 }]]); expr(E, t0, [[0, 'dread', { look: [0.5, 0.3] }]]); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); CROWD.forEach((c, k) => { const row = Math.floor(k / 5), col = k % 5, e = ease(between(t, 118.9 + k * 0.08, 119.9 + k * 0.08)); c.root.visible = e > 0; c.root.position.set(HX + (col - 2) * 1.4 + (row % 2) * 0.6, 0, lerp(-4.0, -3.0 - row * 1.6, e)); c.root.rotation.set(0, 0, 0); c.root.position.y = 0; c.pose('idle', t + k); }); stand(A, HX, 0, 7.0, Math.PI); A.root.visible = true; }
  if (id === 'sunrise' || id === 'dissolve') { const on = ease(between(t, 124.2, 124.8)); HALL.beam.material.opacity = 0.55 * on; HALL.sun.intensity = 40 * on; stand(E, HX, 0, 1.4, 0.0 + Math.PI); E.root.rotation.y = Math.PI; keys(E, t0, [[0, 'point', { armR: [-1.4, 0, 0.1], dur: 0.2 }]]); expr(E, t0, [[0, 'determined', { look: [0, 0] }]]); MIR.g.visible = true; hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); MIR.g.rotateY(Math.PI);
    const dis = id === 'dissolve' ? between(t, 128.4, 131.0) : 0; CROWD.forEach((c, k) => { const row = Math.floor(k / 5), col = k % 5; c.root.visible = dis < 1; c.root.position.set(HX + (col - 2) * 1.4 + (row % 2) * 0.6, 0, -3.0 - row * 1.6); c.root.rotation.set(0, 0, 0); c.root.scale.setScalar(1 - dis * 0.9); c.pose('idle', t + k); if (id === 'sunrise') c.root.scale.setScalar(1); }); stand(A, HX, 0, 7.0, Math.PI); A.root.visible = id === 'sunrise'; if (id === 'dissolve') FLY.set(t, between(t, 129.0, 133.0), V3(HX, 1.2, 4), V3(HX, 3.4, -26)); }
  // ----------------------------------------------------------------- the final night
  if (id === 'nightMirror') { stand(E, 0.1, 0, -1.8, Math.PI); keys(E, t0, [[0, 'idle']]); expr(E, t0, [[0, 'neutral', { look: [0.3, 0] }], [2.0, 'scared', { look: [0.6, 0] }]]); MIR.g.visible = true; MIR.show('eli'); hold(MIR.g, E.c.handR, [0, -0.05, 0.1], [0, 0, 0]); }
  if (id === 'finalMirror') { BIG.m.visible = true; BIG.show('card'); BIG.m.position.set(0, 1.2, 1.3); BIG.m.rotation.set(0, Math.PI, 0); BIG.m.scale.setScalar(1.0 + 0.15 * u); }
  // ----------------------------------------------------------------- actors, faces, camera, polish
  const SET = [ELI, MAX, PLUM, ASH, ...FOLK]; SET.forEach((o) => { if (o.root.visible) { o.A.update(t); o.F.update(t); } });
  const rain = s.rain ?? (sc === 'town' ? 0.7 : 0); const cam = CAM.at(t, [[0, ...s.a], [1, ...s.b]].map(([k, p, l, f]) => [k === 0 ? t0 : (SH[i + 1] || { t: END }).t, p, l, f]), { shakes: s.shakes || [], punch: s.punch || [] });
  if (s.follow) { const f0 = s.follow[0], f1 = s.follow[1], k = ease(u), r = ELI.root.position; camera.position.set(r.x + lerp(f0[0], f1[0], k), r.y + lerp(f0[1], f1[1], k) + 1.2, r.z + lerp(f0[2], f1[2], k)); camera.fov = s.fov || s.a[2]; camera.updateProjectionMatrix(); const fp = face(ELI); cam.copy(fp); }
  camera.lookAt(cam); if (rain > 0) RAIN.rain(t, camera.position, rain); else RAIN.hide();
  scene.fog.near = s.fog ? 6 : scene.fog.near; if (s.fog) scene.fog.far = 55;
  const target = s.dof === 'eli' ? face(ELI) : s.dof === 'ash' ? face(ASH) : s.dof === 'plum' ? face(PLUM) : s.dof;
  if (target && target.isVector3) PL.dof(target, { range: 0.9, aperture: 0.012, maxblur: 0.006 }); else if (target) PL.dof(target[0], { range: target[1], aperture: 0.012, maxblur: 0.006 }); else PL.dof(V3(0, 0, 0), { on: false });
  const rimT = ELI.root.visible ? face(ELI) : ASH.root.visible ? face(ASH) : V3(center[0], 1.3, center[2]);
  if (!s.noRim) PL.rimAt(rimT, sc === 'hall' ? 0.8 : 1.1, sc === 'wood' ? 0xaab8e8 : 0xdfe8ff); else PL.rimAt(rimT, 0);
  PL.hideContacts(); [['e', ELI], ['m', MAX], ['p', PLUM], ['a', ASH]].forEach(([k, o]) => { if (o.root.visible) PL.contact(k, o.root, o.root.position.y > 1 ? 0 : 0, 0.8); });
}
talk.push(...[]);
for (const s of SH) if (s.talkOn) { const i = SH.indexOf(s); talk.push([s.t, (SH[i + 1] || { t: END }).t]); }
window.renderAt = (t) => { if (window.__NO_RENDER) { pose(t); return; } C.renderAccum(2, (k) => pose(t - k / 120)); };
window.SHOT_TIMES = SH.map((s) => s.t); window.END = END;
window.HOUSE_RULES = { framing: false };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { rotation: { x: 0 } } })) };
window.READY = true;
