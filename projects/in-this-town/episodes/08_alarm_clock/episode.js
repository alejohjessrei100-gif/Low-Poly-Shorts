// Episode 08 "My Alarm Clock Fought Back" (43.6 s, voice 1.35x +6). Hero: Velo. Side characters: the alarm clock,
// the bus driver, the teacher. Three locations: bedroom, street + bus + school, classroom.
// Uses the upgraded rig: expressive faces + lip-sync (kit/face.js), R15 acting (kit/act.js), eased camera, rim light,
// contact shadows, depth of field and motion blur (kit/polish.js, core.renderAccum).
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { kuro, alarmClock, livingRoom, street, classroom } from '../../kit/kuro.js';
import { avatar } from '../../kit/rig.js';
import { faceRig } from '../../kit/face.js';
import { actor, cameraRig, gaitPose } from '../../kit/act.js';
import { polish, dust } from '../../kit/polish.js';
import * as P from '../../kit/props.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
C.allowBlur(true); scene.add(camera); camera.near = 0.05; camera.far = 500;

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const AMP = await (async () => { try { return (await (await fetch(new URL('./amp.json', import.meta.url))).json()).amp; } catch { return null; } })();
const END = WORDS[WORDS.length - 1][1] + 0.5;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const between = (t, a, b) => clamp01((t - a) / (b - a));

// ---------------------------------------------------------------- sets
const R = livingRoom(scene, { plant: false }), ST = street(scene, 200), CL = classroom(scene, 400);
const SX = 200, CX = 400, SZ = ST.SZ;
R.couch.visible = false; R.lamp.visible = false; R.socks.visible = false;
{ // bedroom additions: bed, pillow, blanket, nightstand clock spot, wardrobe with doors
  const wood = P.std(0x8a5a3a), sheet = P.std(0xf4f0e6);
  P.box(2.2, 0.4, 1.05, wood, 3.2, 0.2, -2.9, scene); P.box(2.1, 0.12, 0.95, P.std(0x9ab8e8), 3.2, 0.46, -2.9, scene, 0.04); P.box(0.5, 0.13, 0.8, sheet, 3.75, 0.58, -2.9, scene, 0.05); P.box(0.08, 0.9, 1.05, wood, 4.3, 0.45, -2.9, scene);
  P.box(0.4, 0.04, 0.4, wood, 1.65, 0.57, -2.95, scene);
}
const blanket = P.box(1.6, 0.14, 1.0, P.std(0xe85a6a, { roughness: 1 }), 0, 0, 0, scene, 0.05);
const wardrobe = new THREE.Group(); wardrobe.position.set(-0.6, 0, -3.0); scene.add(wardrobe);
P.box(1.7, 2.3, 0.8, P.std(0x6a4a34), 0, 1.15, -0.2, wardrobe); P.box(1.5, 2.1, 0.05, P.std(0x1c1410), 0, 1.15, 0.2, wardrobe);
const wdoors = [-1, 1].map((s) => { const d = new THREE.Group(); d.position.set(s * 0.82, 0, 0.2); wardrobe.add(d); P.box(0.8, 2.2, 0.05, P.std(0x8a5a3a), -s * 0.4, 1.15, 0.03, d); P.box(0.04, 0.25, 0.05, P.std(0xd8b04a, { metalness: 0.8 }), -s * 0.1, 1.1, 0.07, d); return [d, s]; });
const shoes = new THREE.Group(); scene.add(shoes); for (const x of [-0.08, 0.08]) P.box(0.1, 0.09, 0.26, P.std(0xf4f4f4), x, 0.05, 0, shoes, 0.03);
// the school bus (front toward -z, door on the +x side, driver on the -x side); origin at the floor, centre
const bus = new THREE.Group(); scene.add(bus);
const busDoor = new THREE.Group(); bus.add(busDoor);
{ const y = P.std(0xf2b822, { roughness: 0.5 }), dk = P.std(0x1b1b24), gl = new THREE.MeshStandardMaterial({ color: 0x9ad0f0, roughness: 0.1, transparent: true, opacity: 0.55 });
  // hollow bus: floor, roof, back wall, solid lower side walls, glass upper walls with pillars; the front is open so the driver can be seen
  P.box(2.5, 0.12, 8.2, dk, 0, 0.78, 0, bus); P.box(2.55, 0.14, 8.3, y, 0, 3.0, 0, bus, 0.04); P.box(2.45, 0.08, 8.1, P.std(0xf4f0e6), 0, 3.1, 0, bus); P.box(2.5, 2.5, 0.1, y, 0, 1.95, 4.1, bus);
  for (const s of [-1, 1]) { P.box(0.08, 0.7, 8.2, y, s * 1.25, 1.2, 0, bus); P.box(0.04, 1.4, 8.2, gl, s * 1.25, 2.25, 0, bus); for (let k = 0; k < 8; k++) P.box(0.1, 1.4, 0.1, y, s * 1.25, 2.25, -4.0 + k * 1.15, bus); }
  P.box(2.5, 1.0, 1.4, y, 0, 0.9, -4.8, bus, 0.1); P.box(2.5, 0.5, 0.1, y, 0, 2.8, -4.1, bus); P.box(2.4, 0.2, 0.9, dk, 0, 1.45, -4.0, bus);
  for (const [x, z] of [[-1.1, -3.4], [1.1, -3.4], [-1.1, 2.6], [1.1, 2.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 20), dk); w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, z); w.castShadow = true; bus.add(w); }
  P.box(1.6, 0.4, 0.06, dk, 0, 1.4, -5.27, bus); for (const s of [-1, 1]) P.box(0.3, 0.18, 0.06, P.std(0xfff2b0, { emissive: 0xffe08a, emissiveIntensity: 0.8 }), s * 0.9, 0.95, -5.28, bus);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.34), new THREE.MeshStandardMaterial({ map: P.textTex(['SCHOOL BUS'], { w: 1024, h: 170, bg: '#f2b822', fg: '#1b1b24', radius: 4 }) })); sg.position.set(0, 3.05, -4.12); bus.add(sg);
  P.box(0.06, 1.0, 0.95, y, 0, 0.5, 0, busDoor); busDoor.position.set(1.28, 0.8, -3.5); P.box(0.05, 0.9, 0.7, gl, 0.02, 1.4, 0, busDoor);
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) P.box(0.9, 0.5, 0.5, P.std(0x3a6aa8), s * 0.65, 1.1, -2 + k * 1.5, bus, 0.04);
  P.box(0.5, 0.4, 0.4, dk, -0.6, 1.2, -3.9, bus); }
// ---------------------------------------------------------------- cast
const actors = [];
const reg = (name, c) => { actors.push({ name, c, root: c.root }); return c; };
const velo = reg('velo', kuro(scene, 1.45, { r15: true }));
const teacher = reg('teacher', avatar(scene, { skin: 0xd8a070, shirt: 0x5a8a6a, pants: 0x3a3a46, hair: 0x2a1a12, hairStyle: 'bun', glasses: true, r15: true }, 1.72, { face: 'neutral' }));
const driver = reg('driver', avatar(scene, { skin: 0xe0b080, shirt: 0x2a4a8a, pants: 0x2a2a30, hair: 0x6a4a2a, hairStyle: 'short', hat: 'police', r15: true }, 1.75, { face: 'neutral' }));
const CLK = alarmClock(scene);
const FV = faceRig(velo, { ink: '#f6f6fa', skin: 0x2a2a34, style: 'dramatic' });
const FT = faceRig(teacher, { ink: '#1b1b24', skin: 0xd8a070, style: 'deadpan' });
const FD = faceRig(driver, { ink: '#1b1b24', skin: 0xe0b080, style: 'stern' });
const AV = actor(velo, { seed: 3 }), AT = actor(teacher, { seed: 5 }), AD = actor(driver, { seed: 9 });
const PL = polish(C), DUST = dust(scene, 12, 0xc8b8a0), CAM = cameraRig(camera);
const detention = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshBasicMaterial({ map: P.textTex(['DETENTION'], { w: 1024, h: 320, bg: '#fbf6e8', fg: '#d8203a', border: '#d8203a', radius: 24 }), transparent: true })); scene.add(detention);
const rubble = new THREE.Group(); scene.add(rubble); for (let i = 0; i < 9; i++) P.box(0.25 + (i % 3) * 0.1, 0.12, 0.2, P.std(i % 2 ? 0xa8503a : 0xd8d0c0), 0, 0, 0, rubble);
const busNose = P.box(2.6, 2.3, 3, P.std(0xf2b822), 0, 0, 0, scene, 0.1);

// ---------------------------------------------------------------- performance data
const T = (w, after = 0) => { const f = WORDS.find(([s, , x]) => s >= after - 0.01 && x.toLowerCase().replace(/[^a-z0-9']/g, '') === w); if (!f) throw new Error('word ' + w); return f[0]; };
FV.track([[0, 'smug'], [2.72, 'determined', { look: [0.6, 0] }], [3.3, 'bored', { look: [0.3, 0.3] }], [4.3, 'bored', { lid: 0.92, blend: 0.2 }], [5.9, 'neutral'], [6.15, 'scared', { look: [0.7, -0.3] }], [8.7, 'shocked', { look: [0.5, -0.6] }], [11.8, 'scared', { look: [0, 0.3] }], [13.78, 'dread'], [14.3, 'determined', { look: [0.4, -0.3] }], [16.15, 'scared', { look: [-0.6, 0.2] }], [19.4, 'scared', { look: [0.8, 0] }], [20.9, 'embarrassed', { look: [0.5, 0] }], [22.6, 'nervous' in {} ? 'nervous' : 'scared', { look: [0.9, 0] }], [24.0, 'smug', { look: [0.5, 0] }], [25.4, 'shocked'], [27.5, 'dread', { look: [0, -0.4] }], [30.4, 'embarrassed', { look: [0.7, -0.2] }], [33.7, 'sad', { look: [0.6, -0.4] }], [36.1, 'sad', { look: [0, -0.7] }], [38.1, 'angry', { look: [0.5, 0.3] }], [39.4, 'furious', { look: [0.5, 0] }], [40.7, 'bored', { lid: 0.92, blend: 0.4 }]]);
FT.track([[0, 'neutral'], [27.6, 'shocked'], [29.6, 'shocked'], [31.2, 'suspicious', { look: [0.6, 0] }], [34.5, 'suspicious'], [36.0, 'determined'], [38.0, 'bored']]);
FD.track([[0, 'bored'], [21.6, 'suspicious', { look: [0.6, 0] }], [24.4, 'shocked'], [26.3, 'angry']]);
const talkV = [[2.72, 3.9], [4.3, 5.6], [6.15, 7.1], [11.8, 12.6], [14.4, 15.8], [19.4, 20.4], [24.0, 25.1], [30.3, 31.1], [38.1, 40.2], [40.7, 44]];
FV.lipsync(WORDS, AMP, 60, (t) => talkV.some(([a, b]) => t >= a && t < b));
FT.lipsync(WORDS, AMP, 60, () => false); FD.lipsync(WORDS.filter((w) => w[0] >= 23 && w[0] < 23.9), AMP, 60, () => true);
AV.keys([[0, 'idle'], [2.7, 'shrug', { dur: 0.3 }], [4.3, 'slump', { dur: 0.3 }], [3.4, 'idle', { head: [0, 1.25, 1.45], dur: 0.1 }], [5.95, 'idle', { head: [0, 1.25, 1.45] }], [8.9, 'shockRecoil', { dur: 0.2, antic: 0.1 }], [11.9, 'flailUp', { dur: 0.15, antic: 0.08 }], [13.9, 'slump', { dur: 0.25 }], [14.45, 'pickup', { dur: 0.25 }], [15.1, 'idle'], [20.8, 'shockRecoil'], [22.5, 'point', { armR: [-0.9, 0.4, 0.2], dur: 0.25 }], [24.0, 'handsOnHips', { dur: 0.25 }], [25.4, 'shockRecoil', { dur: 0.15 }], [30.3, 'facepalm', { dur: 0.3 }], [33.7, 'slump', { dur: 0.3 }], [38.1, 'point', { dur: 0.2, antic: 0.1 }], [39.5, 'crossArms', { dur: 0.3 }], [40.7, 'idle', { head: [0, 1.25, 1.45], dur: 0.3 }]]);
AT.keys([[0, 'idle'], [27.7, 'shockRecoil', { dur: 0.2 }], [29.5, 'idle'], [31.3, 'crossArms', { dur: 0.3 }], [36.1, 'point', { armR: [-0.6, 0.3, 0.3], dur: 0.2 }], [37.3, 'idle']]);
AD.keys([[0, 'idle'], [21.7, 'crossArms', { dur: 0.3 }], [23.0, 'shrug', { dur: 0.25 }], [26.3, 'shockRecoil', { dur: 0.2 }]]);
AV.squash([[9.5, -0.07, 0.12], [13.82, -0.12, 0.2], [20.0, 0.08, 0.2], [27.6, -0.1, 0.25]]);

// ---------------------------------------------------------------- helpers
const lay = (c, x, y, z) => { c.root.rotation.order = 'YXZ'; c.root.rotation.set(-Math.PI / 2, -Math.PI / 2, 0); c.root.position.set(x, y, z); };
const stand = (c, x, y, z, yaw = 0) => { c.root.rotation.order = 'XYZ'; c.root.rotation.set(0, yaw, 0); c.root.position.set(x, y, z); c.root.visible = true; };
const face = (c) => c.face.getWorldPosition(new THREE.Vector3());

// ---------------------------------------------------------------- shots
const SH = [];
const S = (t, cam, o = {}) => SH.push({ t: Math.max(0, t - 2 / 60), cam, ...o });
const IN = 'indoor', OUT = 'day';
const CLK0 = V3(1.65, 0.59, -2.95); // clock on the nightstand
S(0, [[0, [1.0, 0.95, -0.3], [1.65, 0.85, -2.95], 40], [2.78, [1.2, 1.0, -0.6], [1.65, 0.82, -2.95], 36]], { light: IN, dof: [CLK0.clone().setY(0.8), 0.5], shakes: [[1.92, 0.03, 0.3]], where: 'bed' });
S(2.78, [[2.78, [0.6, 1.3, 2.0], [0.1, 1.15, -2.6], 38], [3.5, [0.6, 1.3, 1.8], [0.1, 1.15, -2.6], 36]], { light: IN, where: 'standVelo', dof: 'face' });
S(3.5, [[3.5, [3.3, 2.0, -1.0], [3.6, 0.75, -2.9], 46], [4.38, [3.6, 2.1, -1.6], [3.7, 0.75, -2.9], 42]], { light: IN, where: 'bed', dof: [V3(3.2, 0.6, -2.9), 2.5] });
S(4.38, [[4.38, [2.6, 1.9, -1.3], [3.2, 0.8, -2.9], 46], [6.22, [2.2, 1.8, -1.7], [2.8, 0.85, -2.9], 42]], { light: IN, where: 'bed', slap: true, dof: [V3(1.65, 0.8, -2.95), 0.8] });
S(6.22, [[6.22, [1.5, 1.0, -1.6], [1.65, 0.83, -2.95], 36], [8.7, [1.45, 0.95, -1.9], [1.65, 0.85, -2.95], 32]], { light: IN, where: 'bed', talkClock: true, dof: [V3(1.65, 0.83, -2.95), 0.35] });
S(8.8, [[8.8, [-1.5, 1.6, 3.4], [2.2, 0.7, -2.9], 58], [11.88, [-1.2, 1.55, 3.2], [2.0, 0.8, -2.8], 56]], { light: IN, where: 'pull', shakes: [[9.4, 0.04, 0.3]], dof: [V3(2.2, 0.8, -2.8), 5] });
S(11.88, [[11.88, [3.2, 1.7, 2.5], [1.5, 1.0, -2.8], 58], [13.5, [1.0, 1.4, 2.0], [-0.3, 0.9, -2.8], 54], [13.9, [0.6, 1.3, 1.6], [-0.6, 0.9, -2.9], 50]], { light: IN, where: 'fly', shakes: [[13.82, 0.06, 0.4]], punch: [[13.82, 6, 0.5]], dof: [V3(-0.3, 1, -2.8), 5] });
S(14.48, [[14.48, [0.6, 1.5, 3.2], [-1.2, 0.9, -1.5], 52], [16.28, [-1.0, 1.4, 3.3], [-3.4, 0.9, 1.0], 54]], { light: IN, where: 'shoes', dof: 'face' });
S(16.28, [[16.28, [SX + 3.2, 1.5, -17], [SX, 0.9, -9], 56], [19.4, [SX + 4.5, 1.7, -33.5], [SX, 0.9, -26], 54]], { light: OUT, where: 'chase', dof: [V3(SX, 1, -20), 12] });
S(18.1, [[18.1, [SX + 1.3, 0.6, -22], [SX, 0.6, -17.8], 44], [19.48, [SX + 1.3, 0.6, -28], [SX, 0.6, -23.5], 42]], { light: OUT, where: 'tick', ringShot: true, shakes: [[18.1, 0.02, 1.2]], dof: [V3(SX, 0.55, -14.5), 1.2] });
S(19.48, [[19.48, [SX + 4.6, 1.6, -23], [SX - 1.5, 1.3, -31], 54], [21.7, [SX + 5.0, 1.8, -25.5], [SX - 1.5, 1.6, -34], 52]], { light: OUT, where: 'board', dof: [V3(SX - 1.5, 1.4, -31), 6] });
S(21.7, [[21.7, [SX - 1.9, 2.5, -42.6], [SX - 2.6, 2.3, -36.9], 38], [24.0, [SX - 2.1, 2.45, -41.6], [SX - 2.6, 2.3, -36.9], 34]], { light: OUT, where: 'driver', rel: true, talkD: true, dof: [V3(SX - 2.7, 1.5, -34.5), 1.5] });
S(24.0, [[24.0, [SX + 1.7, 2.2, -34.0], [SX - 1.5, 2.2, -36.6], 44], [25.48, [SX + 1.5, 2.2, -34.4], [SX - 1.5, 2.2, -36.6], 42]], { light: OUT, where: 'inside', rel: true, dof: [V3(SX - 1.5, 1.3, -36.4), 1.5] });
S(25.48, [[25.48, [SX + 6.0, 2.2, -28], [SX - 1.7, 1.6, -34.5], 50], [27.5, [SX + 6.5, 2.4, -31], [SX - 1.7, 1.2, -38], 48]], { light: OUT, where: 'rip', rel: true, shakes: [[26.52, 0.05, 0.4]], punch: [[26.52, 5, 0.4]], dof: [V3(SX - 1.7, 1.4, -36), 6] });
S(27.56, [[27.56, [SX + 3.8, 2.0, -60], [SX - 2, 1.3, -72], 54], [29.0, [SX + 4.6, 2.2, -64], [SX - 2, 1.3, -74], 52]], { light: OUT, where: 'crash', shakes: [[27.7, 0.1, 0.8]], punch: [[27.7, 8, 0.7]], dof: [V3(SX - 2, 1.5, -73), 8] });
S(28.94, [[28.94, [CX + 3.2, 1.7, 3.8], [CX - 1.2, 1.0, -1.5], 56], [31.3, [CX + 2.4, 1.6, 3.0], [CX - 0.6, 1.0, -2.0], 52]], { light: IN, where: 'class', shakes: [[29.2, 0.05, 0.4]], dof: [V3(CX - 1.2, 1, -1.5), 6] });
S(31.32, [[31.32, [CX + 3.4, 1.55, -0.8], [CX + 0.6, 1.4, -3.3], 40], [32.5, [CX + 3.0, 1.55, -1.0], [CX + 0.6, 1.4, -3.3], 36]], { light: IN, where: 'stare', onlyTeacher: true, dof: 'teacher' });
S(32.52, [[32.52, [CX - 0.4, 0.75, 0.8], [CX - 1.0, 0.7, 1.9], 38], [33.8, [CX - 0.5, 0.72, 0.9], [CX - 1.0, 0.7, 1.9], 34]], { light: IN, where: 'stare', onlyClock: true, dof: 'clock' });
S(33.82, [[33.82, [CX + 1.6, 1.2, 4.0], [CX - 0.9, 0.9, 1.4], 44], [36.1, [CX + 1.1, 1.2, 3.4], [CX - 0.9, 0.9, 1.4], 40]], { light: IN, where: 'class2', talkClock: true, dof: [V3(CX - 0.9, 0.9, 1.4), 3] });
S(36.18, [[36.18, [CX + 2.3, 1.7, -0.3], [CX + 0.6, 1.0, -2.6], 44], [38.1, [CX + 1.9, 1.4, -0.6], [CX + 0.6, 0.9, -2.5], 36]], { light: IN, where: 'write', dof: [V3(CX + 0.6, 1.0, -2.5), 3] });
S(38.2, [[38.2, [CX - 3.0, 1.2, 2.6], [CX - 2.4, 1.0, 0.0], 44], [39.46, [CX - 2.9, 1.2, 2.2], [CX - 2.4, 1.0, 0.0], 38]], { light: IN, where: 'angry', talkV: true, dof: 'face' });
S(39.46, [[39.46, [CX - 1.5, 0.7, 2.4], [CX - 2.1, 0.72, 1.3], 40], [40.7, [CX - 1.6, 0.68, 2.0], [CX - 2.1, 0.72, 1.3], 34]], { light: IN, where: 'angry', onlyClock: true, smug: true, dof: 'clock' });
S(40.76, [[40.76, [3.2, 2.2, -1.3], [3.7, 0.8, -2.9], 40], [END, [3.7, 2.0, -1.8], [3.9, 0.8, -2.9], 34]], { light: IN, where: 'sleep', dof: [V3(3.5, 0.85, -2.9), 2.2] });

function pose(t) {
  let i = 0; SH.forEach((s, j) => { if (t >= s.t) i = j; }); const s = SH[i], w = s.where;
  setLight(s.light, w === 'chase' || w === 'tick' || w === 'board' || w === 'driver' || w === 'inside' || w === 'rip' || w === 'crash' ? [SX, 0, -30] : w.startsWith('class') || w === 'stare' || w === 'write' || w === 'angry' ? [CX, 0, 0] : [0, 0, 0]);
  DUST.hide(); PL.hideContacts();
  [velo, teacher, driver].forEach((c) => (c.root.visible = false)); CLK.g.visible = false; busNose.visible = false; rubble.visible = false; detention.visible = false; shoes.visible = false;
  bus.position.set(SX - 2, 0, -33.5); bus.rotation.set(0, 0, 0); busDoor.position.set(1.28, 0.8, -3.5); busDoor.rotation.set(0, 0, 0); blanket.position.set(3.05, 0.9, -2.9); blanket.rotation.set(0, 0, 0); blanket.scale.set(0.62, 1, 1.0);
  wdoors.forEach(([d, sg]) => (d.rotation.y = 0)); R.door.rotation.y = 0; ST.doors.forEach((d) => (d.rotation.y = 0));
  const clockOn = !s.onlyTeacher; let cm = { t, mood: 'glare', legsOn: t > 1.9, legScale: t > 1.9 ? 0.4 + 0.6 * Math.min(1.25, 0.5 + 6 * (t - 1.9)) : 0.1 };
  const vk = V3(0, 0, 0);
  let lookAt = null;
  if (w === 'bed' || w === 'standVelo') { /* handled below */ }
  // --- bedroom
  if (w === 'bed') { lay(velo, 2.55, 0.66, -2.9); velo.root.visible = true;  CLK.g.visible = true; CLK.g.position.copy(CLK0); CLK.g.rotation.y = 0.35; CLK.set({ ...cm, ring: t > 1.9 && t < 2.6 ? 1 : 0 }); }
  if (w === 'standVelo') { stand(velo, 0.1, 0, -2.2, 0.15); }
  if (w === 'bed' && t >= 3.5) { blanket.visible = true; }
  if (w === 'bed' && s.slap) { CLK.g.visible = true; CLK.g.position.copy(CLK0); const sn = Math.floor(between(t, 4.4, 5.9) * 5); const u = (between(t, 4.4, 5.9) * 5) % 1; cm.mood = 'glare'; CLK.set({ ...cm, ring: 0 }); CLK.body.scale.y = 1 - 0.2 * Math.max(0, Math.sin(Math.PI * Math.min(1, u * 3))); }
  if (s.talkClock) { CLK.g.visible = true; CLK.g.position.copy(CLK0); CLK.g.rotation.y = 0.2; CLK.set({ t, mood: t > 7.5 && t < 8.6 ? 'talk' : 'glare', legsOn: true, armsUp: 0.9 }); }
  if (w === 'pull') { lay(velo, 2.55, 0.66, -2.9); velo.root.visible = true; const u = between(t, 9.4, 10.4), pu = between(t, 10.4, 11.9); CLK.g.visible = true; const jx = lerp(1.65, 2.7, ease(between(t, 9.4, 9.9))), jy = 0.59 - 0.59 * ease(between(t, 9.4, 9.8)) + Math.sin(Math.PI * between(t, 9.4, 9.9)) * 0.5; CLK.g.position.set(jx + (t > 10.4 ? -pu * 0.2 : 0), t > 9.9 ? 0.46 : jy, -2.2); CLK.g.rotation.y = -0.4; CLK.set({ t, mood: 'scream', walk: t > 10.4 ? 0.6 : 0, armsUp: 1.6, ring: 0.6 }); blanket.position.set(lerp(3.05, 1.2, ease(pu)), 0.9 + Math.sin(Math.PI * pu) * 0.5, lerp(-2.9, -2.0, ease(pu))); blanket.rotation.set(0, 0, Math.sin(Math.PI * pu) * 0.5); if (t > 11.88) velo.root.visible = false; }
  if (w === 'fly') { const u = between(t, 11.95, 13.82); const x = lerp(3.0, -0.4, u), y = u < 0.6 ? 0.85 + 1.2 * Math.sin(Math.PI * u / 0.6) : lerp(0.85, 0.7, (u - 0.6) / 0.4); stand(velo, x, t < 11.95 ? 0.85 : t < 13.82 ? y - 0.7 : 0, -2.6 + 0.0, Math.PI - 0.2); velo.root.rotation.z = u < 1 ? -u * 9 : 0; if (t < 11.95) { lay(velo, 2.55, 0.66, -2.9); } if (t > 13.82) { velo.root.rotation.z = 0; stand(velo, -0.4 - between(t, 13.82, 14.2) * 0.3, 0, -2.3, 0.1); } velo.root.visible = true; wdoors.forEach(([d, sg]) => (d.rotation.y = sg * -1.6 * ease(between(t, 13.78, 14.0)))); CLK.g.visible = true; CLK.g.position.set(1.0, 0.0, -1.2); CLK.g.rotation.y = -0.6; CLK.set({ t, mood: 'smug', walk: 0 }); blanket.position.set(1.2, 0.2, -2.0); }
  if (w === 'shoes') { const u = between(t, 14.5, 15.4), r = between(t, 15.5, 16.25); wdoors.forEach(([d, sg]) => (d.rotation.y = sg * -1.6)); shoes.visible = t < 15.2; shoes.position.set(-0.6, 0.0, -2.4); const x = lerp(-0.6, -4.0, ease(r)), z = lerp(-2.3, 1.0, ease(r)); stand(velo, x, 0, z, r > 0 ? -Math.PI / 2 - 0.9 : 0); R.door.rotation.y = -1.3 * between(t, 15.9, 16.25); }
  // --- street
  if (w === 'chase' || w === 'tick') { const rt = between(t, 16.28, 19.48); const vz = lerp(-8, -27, ease(rt) * 0.4 + rt * 0.6); stand(velo, SX, 0, vz, Math.PI); AV.walk([16.28, 19.48, V3(SX, 0, -8), V3(SX, 0, -27), 1]); CLK.g.visible = true; CLK.g.position.set(SX + 0.2, 0, vz + 2.3); CLK.g.rotation.y = Math.PI; CLK.set({ t, mood: 'scream', walk: 1.1, armsUp: 1.4, ring: 0.8 }); }
  if (w === 'board' || w === 'driver' || w === 'inside' || w === 'rip') {
    const bz = -33.5 - Math.max(0, t - 20.4) * 5.1; bus.position.z = Math.max(bz, -71.5); if (t < 25.48 && t > 21.6) bus.position.z = -33.5 - (t - 20.4) * 5.1;
    const roofOn = t > 20.64; if (w === 'board') { const u = between(t, 19.55, 20.1); stand(velo, lerp(SX - 0.2, SX - 0.75, ease(u)), Math.sin(Math.PI * Math.min(1, u * 1.4)) * 0.9 + (u > 0.6 ? 0.55 * ease((u - 0.6) / 0.4) : 0), lerp(-26.5, -31.8, ease(u)) + (t > 20.1 ? (bus.position.z + 33.5) : 0), Math.PI / 2 + 0.2); velo.root.visible = true; }
    if (w === 'board') { const u = between(t, 20.64, 21.2); CLK.g.visible = true; const bx = bus.position.x, bzz = bus.position.z; const px = t < 20.64 ? SX - 0.2 : lerp(SX - 0.2, bx, ease(u)), pz = t < 20.64 ? -24 : lerp(-27, bzz - 1.2, ease(u)); CLK.g.position.set(px, t < 20.64 ? 0 : lerp(0, 3.25, ease(u)) + Math.sin(Math.PI * u) * 1.2, pz); CLK.set({ t, mood: 'scream', walk: t < 20.64 ? 1.1 : 0, armsUp: 1.5, ring: 0.5 }); CLK.g.rotation.y = Math.PI; }
    if (w === 'driver') { stand(driver, bus.position.x - 0.6, 0.84, bus.position.z - 3.4, Math.PI + 0.35); driver.root.visible = true; stand(velo, bus.position.x + 0.5, 0.84, bus.position.z - 2.8, Math.PI + 0.3); velo.root.visible = true; CLK.g.visible = true; CLK.g.position.set(bus.position.x, 3.25, bus.position.z - 1.2); CLK.set({ t, mood: 'glare', armsUp: 1.2 }); }
    if (w === 'inside') { stand(driver, bus.position.x - 0.6, 0.84, bus.position.z - 3.4, Math.PI + 0.35); driver.root.visible = true; stand(velo, bus.position.x + 0.5, 0.84, bus.position.z - 2.8, Math.PI + 0.3); velo.root.visible = true; CLK.g.visible = true; CLK.g.position.set(bus.position.x, 3.25, bus.position.z - 1.2); CLK.set({ t, mood: 'glare', armsUp: 1.2 }); }
    if (w === 'rip') { const u = between(t, 25.8, 26.5), du = Math.max(0, t - 26.5); CLK.g.visible = true; CLK.g.position.set(bus.position.x + 1.5 - 0.2 * u, 3.25 - 1.7 * ease(u) + (t > 26.5 ? -0.4 : 0), bus.position.z - 3.5); CLK.g.rotation.y = Math.PI / 2; CLK.set({ t, mood: t > 26.4 ? 'smug' : 'scream', armsUp: 2.2, ring: 0.3 }); if (du > 0) { busDoor.position.set(1.28 + du * 9, 0.8 + Math.sin(du * 4) * 1.2 - du * du * 4, -3.5 + du * 1.5); busDoor.rotation.set(du * 5, du * 3, du * 4); busDoor.visible = busDoor.position.y > 0.1; } stand(driver, bus.position.x - 0.6, 0.84, bus.position.z - 3.4, Math.PI + 0.35); driver.root.visible = true; stand(velo, bus.position.x + 0.5, 0.84, bus.position.z - 2.8, Math.PI / 2); velo.root.visible = true; }
  }
  if (w === 'crash') { bus.position.z = -71.5 - 0.3 * Math.sin(Math.PI * between(t, 27.66, 28.3)); bus.rotation.x = -0.06 * Math.sin(Math.PI * between(t, 27.66, 28.2)); ST.doors.forEach((d, k) => (d.rotation.y = (k ? 1 : -1) * 1.5 * ease(between(t, 27.66, 28.0)))); const u = between(t, 27.66, 28.8); DUST.set(V3(SX, 0.1, -75.5), u, 0.4); CLK.g.visible = true; CLK.g.position.set(SX - 2, 3.25, bus.position.z - 2.4); CLK.set({ t, mood: 'smug', armsUp: 1.6 }); rubble.visible = true; rubble.children.forEach((b, k) => { const du = Math.max(0, t - 27.66); b.position.set(SX + Math.sin(k * 2.2) * (1.5 + du * 2.2), Math.max(0.06, 1.4 + du * 3 * ((k % 3) * 0.3 + 0.4) - 4.9 * du * du), -75.6 + Math.cos(k * 2.2) * du * 2 - du * 1); b.rotation.set(du * 6 + k, du * 4, k); }); bus.position.x = SX - 2; busDoor.visible = false; }
  // --- classroom
  if (w === 'class') { const u = between(t, 29.0, 30.3); stand(velo, lerp(CX - 4.6, CX - 1.2, ease(u)), 0, lerp(-3.0, 0.4, ease(u)), Math.PI / 2 - 0.4 + 0.3 * u); velo.root.rotation.z = 0; CLK.g.visible = true; CLK.g.position.set(lerp(CX - 5.2, CX - 2.2, ease(between(t, 29.0, 30.3))), 0, lerp(-3.0, 0.9, ease(between(t, 29.0, 30.3)))); CLK.g.rotation.y = Math.PI / 2 - 0.3; CLK.set({ t, mood: 'scream', walk: t < 30.3 ? 1 : 0, armsUp: 1.4 }); stand(teacher, CX + 0.6, 0, -3.3, 0.0); busNose.visible = true; busNose.position.set(CX - 6.4, 1.3, -3.2); rubble.visible = true; rubble.children.forEach((b, k) => { b.position.set(CX - 4.6 + (k % 3) * 0.4, 0.07, -3.9 + Math.floor(k / 3) * 0.6); b.rotation.set(0, k, 0); }); }
  if (w === 'stare') { stand(teacher, CX + 0.6, 0, -3.3, 0.0); stand(velo, CX - 1.2, 0, 0.4, Math.PI / 2 - 0.2); CLK.g.visible = true; CLK.g.position.set(CX - 1.0, 0, 1.9); CLK.g.rotation.y = Math.PI; CLK.set({ t, mood: 'glare', armsUp: 0.4 }); busNose.visible = true; busNose.position.set(CX - 6.4, 1.3, -3.2); }
  if (w === 'class2') { stand(teacher, CX + 0.6, 0, -3.3, 0.0); stand(velo, CX - 0.9, 0, 0.3, 0.6); CLK.g.visible = true; CLK.g.position.set(CX - 1.5, 0, 1.2); CLK.g.rotation.y = 2.4; CLK.set({ t, mood: t > 34.6 && t < 35.3 ? 'talk' : 'glare', armsUp: t > 34.6 ? 2.2 : 0.4 }); busNose.visible = true; busNose.position.set(CX - 6.4, 1.3, -3.2); }
  if (w === 'write') { stand(teacher, CX + 0.6, 0, -3.3, 0.0); stand(velo, CX - 0.2, 0, 0.7, 0.6); CLK.g.visible = true; CLK.g.position.set(CX - 0.9, 0, 1.2); CLK.g.rotation.y = 2.6; CLK.set({ t, mood: 'smug' }); detention.visible = t > 36.9; detention.position.set(CX + 0.6, 1.75, -3.7); detention.scale.setScalar(0.6 + 0.4 * ease(between(t, 36.9, 37.5))); busNose.visible = true; busNose.position.set(CX - 6.4, 1.3, -3.2); }
  if (w === 'angry') { stand(velo, CX - 2.4, 0, 0.0, 0.2); stand(teacher, CX + 0.6, 0, -3.3, 0.0); CLK.g.visible = true; CLK.g.position.set(CX - 2.1, 0, 1.3); CLK.g.rotation.y = 0.3; CLK.set({ t, mood: s.smug ? 'smug' : 'smug' }); detention.visible = true; detention.position.set(CX + 0.6, 1.75, -3.7); busNose.visible = true; busNose.position.set(CX - 6.4, 1.3, -3.2); }
  if (w === 'sleep') { lay(velo, 2.55, 0.66, -2.9); velo.root.visible = true; CLK.g.visible = true; CLK.g.position.set(3.45, 0.93 + Math.sin(t * 2.2) * 0.012, -2.9); CLK.g.rotation.y = 0.3; CLK.g.scale.setScalar(0.95); CLK.set({ t, mood: 'smug', legsOn: true, armsUp: 0.2 }); blanket.position.set(2.95, 0.9, -2.9); }
  else CLK.g.scale.setScalar(1);
  if (s.onlyTeacher) { CLK.g.visible = false; }
  // actors + faces
  AV.update(t); AT.update(t); AD.update(t); FV.update(t); FT.update(t); FD.update(t);
  if (s.onlyClock) { velo.root.visible = velo.root.visible; }
  const keysCam = s.cam.map(([tt, p, l, f]) => [tt, p, l, f]);
  const L = CAM.at(t, keysCam, { shakes: s.shakes || [], punch: s.punch || [] }); if (s.rel) { const dz = bus.position.z + 33.5; camera.position.z += dz; L.z += dz; } camera.lookAt(L);
  const fp = velo.root.visible ? face(velo) : CLK.g.position.clone().setY(CLK.g.position.y + 0.5);
  PL.rimAt(fp, 1.2); for (const [k, c] of [['v', velo], ['t', teacher], ['d', driver]]) if (c.root.visible) PL.contact(k, c.root, c.root.position.y > 0.8 && w !== 'fly' ? 0 : 0, 0.85);
  if (CLK.g.visible) PL.contact('c', CLK.g, 0, 0.5);
  const d = s.dof; if (d === 'face') PL.dof(face(velo), { range: 0.9, aperture: 0.012, maxblur: 0.006 }); else if (d === 'teacher') PL.dof(face(teacher), { range: 0.9, aperture: 0.012, maxblur: 0.006 }); else if (d === 'clock') PL.dof(CLK.g.position.clone().setY(0.55), { range: 0.5, aperture: 0.014, maxblur: 0.006 }); else if (d) PL.dof(d[0], { range: d[1], aperture: 0.012, maxblur: 0.006 }); else PL.dof(V3(0, 0, 0), { on: false });
}
window.renderAt = (t) => {
  if (window.__NO_RENDER) { pose(t); return; }
  C.renderAccum(2, (k) => pose(t - k / 120));
};
window.SHOT_TIMES = SH.map((s) => s.t); window.END = END;
window.HOUSE_RULES = { framing: false };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { rotation: { x: 0 } } })) };
window.READY = true;
