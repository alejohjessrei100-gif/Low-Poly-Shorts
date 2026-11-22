// Episode 07 "My Homework Ate My Dog" (51 s, voice 1.35x +6). Kuro (black body, white spiky hair) narrates.
// Three locations (house, street, classroom), three side characters (dog, mom, teacher). Classic avatars at real size.
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { kuro, dog, homework, puff, livingRoom, street, classroom } from '../../kit/kuro.js';
import { avatar } from '../../kit/rig.js';
import { prop, preload } from '../../kit/assets.js';
import * as P from '../../kit/props.js';
import { loadFixes, setShot, offsetActor, applyCamera } from '../../kit/autofix-runtime.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
scene.add(camera);
camera.near = 0.05; camera.far = 700;

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.5;
await loadFixes(new URL('./autofix.json', import.meta.url));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- sets
const R = livingRoom(scene);
const ST = street(scene, 200);
const CL = classroom(scene, 400);
const SX = ST.X, CX = CL.X;
await preload(['sedan', 'suv', 'van', 'bush', 'tree_oak']);
for (const [m, x, z, ry] of [['sedan', SX - 2.4, -21, 0], ['suv', SX + 2.4, -29, Math.PI], ['van', SX - 2.4, -52, 0]]) { const c = await prop(scene, m, m === 'van' ? 5 : 4.6); c.position.set(x, 0, z); c.rotation.y = ry; }
for (let k = 0; k < 14; k++) { const t = await prop(scene, 'tree_oak', 7 + (k % 3), { by: 'height' }); t.position.set(SX + (k % 2 ? 1 : -1) * (24 + (k * 7) % 12), 0, 10 - k * 6); }
// a kitchen chair Kuro chews at the end, a detention slip, the teacher's red pen
const chair = new THREE.Group(); scene.add(chair);
const stick = P.box(0.05, 0.45, 0.05, P.std(0x9a6a3a), 0, 0, 0, scene); // the chair leg Kuro gnaws
{ const w = P.std(0x9a6a3a); P.box(0.45, 0.05, 0.45, w, 0, 0.45, 0, chair); P.box(0.45, 0.5, 0.05, w, 0, 0.72, -0.2, chair); for (const [a, b] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) P.box(0.05, 0.45, 0.05, w, a, 0.22, b, chair); }
const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshStandardMaterial({ map: P.textTex(['DETENTION'], { w: 512, h: 320, bg: '#f8c8d8', fg: '#c8203a', border: '#c8203a' }), side: THREE.DoubleSide })); scene.add(slip);
const pen = new THREE.Group(); scene.add(pen); P.cyl(0.008, 0.008, 0.16, P.std(0xd8203a), 0, 0, 0, pen, 8); P.box(0.006, 0.03, 0.006, P.std(0x1b1b24), 0, -0.09, 0, pen);

// ---------------------------------------------------------------- cast
const actors = [];
const add = (name, c) => { const a = { name, c, root: c.root, seated: false }; actors.push(a); return a; };
const K = add('kuro', kuro(scene, 1.45));
const MOM = add('mom', avatar(scene, { skin: 0xf0c090, shirt: 0xe8607a, pants: 0x3a4a7a, hair: 0x7a4a2a, hairStyle: 'ponytail', apron: 0xf4f0e6 }, 1.7, { face: 'smile' }));
const TEACH = add('teacher', avatar(scene, { skin: 0xd8a070, shirt: 0x5a8a6a, pants: 0x3a3a46, hair: 0x2a1a12, hairStyle: 'bun', glasses: true }, 1.72, { face: 'neutral' }));
const DOG = dog(scene);
const HW = homework(scene);
const PUFF = puff(scene);

// ---------------------------------------------------------------- helpers
const eaten = { socks: 1, couch: 1, lamp: 1, mailbox: 1, bench: 1, bush: 1 };
function hideAll() {
  for (const a of actors) { a.root.visible = false; a.root.position.set(0, -80, 0); a.seated = false; }
  DOG.g.visible = false; DOG.glasses.visible = false; DOG.pack.visible = false; DOG.star.visible = false;
  HW.g.visible = false; HW.aplus.visible = false; HW.g.rotation.set(0, 0, 0); PUFF.hide();
  chair.visible = false; slip.visible = false; pen.visible = false; stick.visible = false; chair.children.forEach((c) => (c.visible = true));
  for (const k in eaten) eaten[k] = 1; R.door.rotation.y = 0; ST.doors.forEach((d) => (d.rotation.y = 0));
  grade.uniforms.flash.value = 0;
}
function put(a, x, y, z, yaw = 0) { a.root.visible = true; a.root.position.set(x, y, z); offsetActor(a.name, a.root.position); a.root.rotation.set(0, yaw, 0); a.seated = false; }
const toward = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
function hw(x, z, yaw, scale, o = {}) { HW.g.visible = true; HW.g.position.set(x, o.y || 0, z); HW.g.rotation.set(0, yaw, 0); HW.set(scale, o); }
function dogAt(x, y, z, yaw, mode, t, o = {}) { DOG.g.visible = true; DOG.g.position.set(x, y, z); DOG.g.rotation.set(0, yaw, 0); DOG.pose(mode, t, o.wag ?? 1); DOG.glasses.visible = !!o.glasses; DOG.pack.visible = !!o.pack; DOG.star.visible = !!o.star; }
/** an object being swallowed: shrinks and flies into the mouth over 0.35 s from time te */
function swallow(obj, key, t, te, home, mouth) {
  const u = clamp01((t - te) / 0.35); eaten[key] = 1 - u;
  obj.visible = u < 1; obj.position.lerpVectors(home, mouth, smooth(u)); obj.scale.setScalar(1 - 0.85 * smooth(u));
}
function holdSlip(a) { a.c.handR.updateWorldMatrix(true, false); slip.visible = true; slip.position.copy(a.c.handR.getWorldPosition(new THREE.Vector3())).add(V3(0, 0.02, 0.08)); slip.rotation.set(-0.2, a.root.rotation.y, 0); }
const HOME = { socks: R.socks.position.clone(), couch: R.couch.position.clone(), lamp: R.lamp.position.clone(), mailbox: ST.mailbox.position.clone(), bench: ST.bench.position.clone(), bush: ST.bush.position.clone() };
function resetEaten() { for (const [k, o] of [['socks', R.socks], ['couch', R.couch], ['lamp', R.lamp], ['mailbox', ST.mailbox], ['bench', ST.bench], ['bush', ST.bush]]) { o.visible = true; o.position.copy(HOME[k]); o.scale.setScalar(1); } }
const gone = (...keys) => keys.forEach((k) => { ({ socks: R.socks, couch: R.couch, lamp: R.lamp, mailbox: ST.mailbox, bench: ST.bench, bush: ST.bush })[k].visible = false; });

// ---------------------------------------------------------------- shots
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const IN = { light: 'indoor', c: [0, 0, 0] }, OUT = { light: 'day', c: [SX, 0, -30] }, CLS = { light: 'indoor', c: [CX, 0, 0] };
const SP = R.spot;

// 0 "My homework ate my dog!" the worksheet chewing, a tail wagging out of it; Kuro shocked behind
S(0, { ...IN, cam: [[1.0, 0.75, 3.1], [0.9, 0.78, 2.8], [0.35, 0.55, 0.2]], fov: 50, act(t) {
  hw(SP.x, SP.z, 0.15, 1.5, { chew: 1, t, tailOn: true });
  put(K, 0.15, 0, -1.1, 0.1); K.c.pose('flail', t); K.c.setFace('shock');
} });
// 1 "No, really," Kuro, deadpan, to camera
S(W('no', 1.5), { ...IN, cam: [[0.9, 1.2, 3.4], [0.8, 1.18, 3.2], [0.1, 1.0, -0.4]], fov: 48, act(t) {
  put(K, 0.1, 0, -0.4, toward(0.1, -0.4, 0.9, 3.4)); K.c.pose('shrug', t); K.c.setFace('neutral');
} });
// 2 "it was math. Page 42." just a worksheet on the floor, seen from above
S(W('it', 2.4), { ...IN, cam: [[SP.x + 0.15, 1.25, SP.z + 0.75], [SP.x + 0.1, 1.05, SP.z + 0.6], [SP.x, 0, SP.z]], fov: 46, act(t) {
  hw(SP.x, SP.z, 0.15, 1.5, { alive: false, open: 0 }); dogAt(R.bed.x, 0.08, R.bed.z, 0.8, 'sit', t, { wag: 0.2 });
} });
// 3 "I left it on the floor for one minute." Kuro drops it and walks out of the door; the dog naps
const tLeft = W('i', 4.5);
S(tLeft, { ...IN, cam: [[3.3, 2.0, 6.2], [3.0, 1.95, 5.9], [-1.0, 0.8, 0.0]], fov: 55, act(t) {
  hw(SP.x, SP.z, 0.15, 1.5, { alive: false, open: 0 }); dogAt(R.bed.x, 0.08, R.bed.z, 0.8, 'sit', t, { wag: 0.2 });
  const u = clamp01((t - tLeft - 0.4) / 1.1), x = lerp(SP.x - 0.2, -3.9, u), z = lerp(SP.z + 0.3, 1.2, u);
  put(K, x, 0, z, u > 0 ? -Math.PI / 2 - 0.2 : Math.PI); if (u <= 0) K.c.pose('pick-up', 0.3, null, 0, 0, { once: true }); else K.c.pose('walk', t); K.c.setFace('happy');
  R.door.rotation.y = -1.3 * clamp01((t - tLeft - 0.9) * 2);
} });
// 4 "When I came back, it was chewing." Kuro in the doorway; the worksheet has come alive
S(W('when', 6.0), { ...IN, cam: [[1.9, 1.8, 6.2], [1.7, 1.75, 6.0], [-2.2, 0.9, 0.9]], fov: 55, act(t) {
  R.door.rotation.y = -1.3; hw(SP.x, SP.z, -0.6, 1.5, { chew: 1, t });
  put(K, -3.9, 0, 1.25, Math.PI / 2 - 0.1); K.c.pose('idle', t); K.c.setFace('shock');
} });
// 5 "And my dog was gone, just a tail sticking out of the fractions." close-up 1 of 3: the empty bed, then the tail
S(W('and', 7.9), { ...IN, cam: [[0.2, 0.55, 2.3], [0.9, 0.48, 1.9], [R.bed.x, 0.15, R.bed.z], [SP.x, 0.18, SP.z]], fov: 48, act(t) {
  hw(SP.x, SP.z, -0.3, 1.5, { chew: 0.6, t, tailOn: true });
} });
// 6 "I yelled." Kuro yells at it
S(W('i', 11.1), { ...IN, cam: [[0.4, 1.35, 3.0], [0.25, 1.33, 2.8], [-2.6, 1.05, 1.0]], fov: 50, act(t) {
  put(K, -2.6, 0, 1.0, toward(-2.6, 1.0, SP.x, SP.z)); K.c.pose('yell', t); K.c.setFace('angry'); hw(SP.x, SP.z, -1.2, 1.5, { open: 0.15, t });
} });
// 7 "It burped." a big burp cloud; Kuro recoils
const tBurp = W('burped', 12.4);
S(W('it', 12.2), { ...IN, cam: [[2.9, 1.6, 6.0], [2.7, 1.55, 5.8], [-0.8, 0.7, 0.7]], fov: 54, act(t) {
  const d = t - tBurp; hw(SP.x, SP.z, -1.2, 1.5, { open: d > -0.1 && d < 0.45 ? 0.95 : 0.15, t }); PUFF.set(V3(SP.x - 0.4, 0.35, SP.z + 0.1), clamp01(d / 0.8), 0.25);
  put(K, -2.6, 0, 1.0, toward(-2.6, 1.0, SP.x, SP.z)); K.c.pose(d > 0 ? 'flinch' : 'yell', t); K.c.setFace(d > 0 ? 'squeeze' : 'angry');
} });
// 8 "Then it ate my socks, then a couch, then Mom's favorite lamp." it grows with each bite
const tSocks = W('socks', 13.4), tCouch = W('couch', 14.2), tLamp = W('lamp', 15.4);
S(W('then', 13.1), { ...IN, cam: [[0.3, 2.0, 5.6], [0.2, 2.1, 5.3], [0.4, 0.9, -1.4]], fov: 55, act(t) {
  // path: spot -> socks -> couch front -> lamp
  let x = SP.x, z = SP.z, sc = 1.5, yaw = 0.6;
  if (t > tSocks - 0.2) { x = 1.0; z = 0.9; yaw = 0.9; }
  if (t > tSocks + 0.3) { const u = smooth((t - tSocks - 0.3) / 0.4); x = lerp(1.0, 0, u); z = lerp(0.9, -1.3, u); sc = lerp(1.5, 2.6, u); yaw = lerp(0.9, Math.PI, u); }
  if (t > tCouch + 0.2) { const u = smooth((t - tCouch - 0.2) / 0.5); sc = lerp(2.6, 4.2, u); }
  if (t > tCouch + 0.5) { const u = smooth((t - tCouch - 0.5) / 0.4); x = lerp(0, 1.4, u); z = lerp(-1.3, -1.4, u); yaw = Math.PI + 0.3 * u; }
  if (t > tLamp + 0.2) { const u = smooth((t - tLamp - 0.2) / 0.5); sc = lerp(4.2, 5.2, u); }
  const near = [tSocks, tCouch, tLamp].some((te) => t > te - 0.15 && t < te + 0.35);
  hw(x, z, yaw, sc, { open: near ? 0.9 : null, chew: 1, t }); const m = HW.mouthPos();
  swallow(R.socks, 'socks', t, tSocks, HOME.socks, m); swallow(R.couch, 'couch', t, tCouch, HOME.couch, m); swallow(R.lamp, 'lamp', t, tLamp, HOME.lamp, m);
  put(K, -3.2, 0, 1.6, toward(-3.2, 1.6, x, z)); K.c.pose('flail', t); K.c.setFace('scared');
} });
// 9 "Mom walked in, looked at the empty table, and said," the door opens, Mom stares at the empty side table
const tMom = W('mom', 16.7);
S(tMom, { ...IN, cam: [[2.3, 1.9, 6.6], [2.1, 1.85, 6.4], [-1.6, 1.1, 0.0]], fov: 55, act(t) {
  gone('socks', 'couch', 'lamp'); R.door.rotation.y = -1.3 * clamp01((t - tMom) * 2.5);
  const u = clamp01((t - tMom - 0.3) / 0.9), x = lerp(-5.0, -3.0, u), z = lerp(1.2, 0.6, u);
  put(MOM, x, 0, z, u < 1 ? Math.PI / 2 : toward(x, z, 1.65, -2.95)); MOM.c.pose(u < 1 ? 'walk' : 'idle', t); MOM.c.setFace(u < 1 ? 'smile' : 'deadpan');
  hw(-0.4, -2.3, 0.2, 5.2, { chew: 0.5, t, look: 1 });
  put(K, 0.6, 0, -0.2, toward(0.6, -0.2, -3, 0.6)); K.c.pose('idle', t); K.c.setFace('scared');
} });
// 10 "Kuro, finish your homework." Mom points at Kuro; Kuro is sad
S(W('kuro', 19.1), { ...IN, cam: [[-1.1, 1.45, 4.7], [-1.2, 1.43, 4.4], [-2.0, 1.1, 1.0]], fov: 50, act(t) {
  gone('socks', 'couch', 'lamp'); R.door.rotation.y = -1.3;
  put(MOM, -2.8, 0, 0.7, toward(-2.8, 0.7, -1.3, 1.7) - 0.35); MOM.c.pose('point', t); MOM.c.setFace('angry');
  put(K, -1.3, 0, 1.7, toward(-1.3, 1.7, -2.8, 0.7) + 1.5); K.c.pose('idle', t); K.c.setFace('sad');
} });
// 11 "I said, Mom, it's finishing me." the giant homework opens its mouth right behind Kuro
S(W('i', 20.6), { ...IN, cam: [[-0.3, 1.1, 4.8], [-0.35, 1.15, 4.5], [0.5, 1.4, 0.6]], fov: 55, act(t) {
  gone('socks', 'couch', 'lamp'); put(K, 0.1, 0, 2.0, toward(0.1, 2.0, -0.3, 4.8)); K.c.pose('flinch', t); K.c.setFace('scared');
  hw(0.7, -0.6, 0.05, 5.2, { open: 0.85 + Math.sin(t * 3) * 0.1, t, look: -1 });
  put(MOM, -3.0, 0, 0.6, toward(-3.0, 0.6, 0.1, 2.0)); MOM.c.pose('point', t); MOM.c.setFace('angry');
} });
// 12 "The homework jumped out the window" it shrinks to fit and leaps through it
const tJump = W('jumped', 23);
S(W('the', 22.7), { ...IN, cam: [[-1.6, 1.5, 3.8], [-1.4, 1.5, 3.5], [3.8, 1.3, 0.3]], fov: 55, act(t) {
  gone('socks', 'couch', 'lamp');
  const u = clamp01((t - tJump + 0.1) / 0.7), x = lerp(2.0, 7.0, u), y = Math.sin(Math.PI * Math.min(1, u * 1.2)) * 1.4 + (u > 0.5 ? 0.9 * (u - 0.5) : 0);
  hw(x, 0.3, Math.PI / 2, lerp(3.0, 2.0, clamp01(u * 3)), { y, open: 0.4, t, run: u < 0.15 ? 1 : 0 }); HW.g.rotation.z = -u * 0.4;
  put(K, -0.6, 0, 1.6, toward(-0.6, 1.6, 4.5, 0.3)); K.c.pose('point', t); K.c.setFace('shock');
  put(MOM, -2.4, 0, 0.9, toward(-2.4, 0.9, 4.5, 0.3)); MOM.c.pose('flinch', t); MOM.c.setFace('shock');
} });
// 13 "and ran down the street." outside: it runs off down the street
const tRan = W('and', 23.8);
S(tRan, { ...OUT, cam: [[SX + 1.6, 1.6, 9], [SX + 1.4, 1.65, 8.0], [SX, 1.0, -16]], fov: 55, act(t) {
  const z = 2 - (t - tRan) * 9; hw(SX + 0.8, z, Math.PI, 3, { run: 1, t, open: 0.3 });
} });
// 14 "I chased it." Kuro sprints after it
const tChase = W('i', 25);
S(tChase, { ...OUT, cam: [[SX - 0.2, 1.7, 10.5], [SX - 0.2, 1.7, 7.5], [SX + 0.2, 1.0, -10]], fov: 55, act(t) {
  const z = 3.5 - (t - tChase) * 6.5; put(K, SX - 0.8, 0, z, Math.PI); K.c.pose('sprint', t); K.c.setFace('angry');
  hw(SX + 1.2, -10 - (t - tChase) * 7, Math.PI, 3, { run: 1, t, open: 0.3 });
} });
// 15 "It ate a mailbox, a bench, a whole bush." chomp, chomp, chomp along the sidewalk
const tMail = W('mailbox', 26), tBench = W('bench', 26.6), tBush = W('bush', 27.2);
S(W('it', 25.7), { ...OUT, cam: [[SX - 3.0, 2.8, -1], [SX - 3.0, 3.0, -9], [SX + 4.2, 1.2, -24], [SX + 5, 1.6, -32]], fov: 55, act(t) {
  const keys = [[tMail, HOME.mailbox], [tBench, HOME.bench], [tBush, HOME.bush]];
  let i = 0; while (i < 2 && t > keys[i][0] + 0.25) i++;
  const a = keys[Math.max(0, i - 1)][1], b = keys[i][1], prevT = i ? keys[i - 1][0] + 0.25 : W('it', 25.7) - 0.1, u = smooth(clamp01((t - prevT) / Math.max(0.1, keys[i][0] - 0.1 - prevT)));
  const target = V3(b.x - 0.6, 0, b.z + 2.4), from = i ? V3(a.x - 0.6, 0, a.z + 2.4) : V3(SX + 2.2, 0, -10);
  const sc = 3 + [tMail, tBench, tBush].filter((te) => t > te + 0.2).length * 1.3;
  const near = [tMail, tBench, tBush].some((te) => t > te - 0.15 && t < te + 0.35);
  hw(lerp(from.x, target.x, u), lerp(from.z, target.z, u), Math.PI - 0.2, sc, { run: u < 1 ? 1 : 0, open: near ? 0.95 : 0.3, t }); const m = HW.mouthPos();
  swallow(ST.mailbox, 'mailbox', t, tMail, HOME.mailbox, m); swallow(ST.bench, 'bench', t, tBench, HOME.bench, m); swallow(ST.bush, 'bush', t, tBush, HOME.bush, m);
  const kz = -6 - (t - 25.7) * 4.2; put(K, SX - 1.2, 0, kz, Math.PI); K.c.pose('sprint', t); K.c.setFace('angry');
} });
// 16 "It got bigger with every bite." a giant over the rooftops; tiny Kuro
S(W('it', 28.1), { ...OUT, cam: [[SX - 1.2, 0.6, -27], [SX - 1.3, 0.55, -28], [SX + 0.8, 4.5, -44]], fov: 60, act(t) {
  gone('mailbox', 'bench', 'bush'); hw(SX + 1.0, -48, 0.15, 14, { chew: 0.6, t, look: -1 });
  put(K, SX - 0.6, 0, -35, Math.PI + 0.2); K.c.pose('flinch', t); K.c.setFace('scared');
} });
// 17 "It ran straight into my school," the doors burst open
const tSchool = W('school', 30.3);
S(W('it', 29.3), { ...OUT, cam: [[SX + 7, 3.2, -50], [SX + 6.4, 3.0, -52], [SX, 3.2, -76]], fov: 55, act(t) {
  gone('mailbox', 'bench', 'bush'); const u = clamp01((t - 29.3) / (tSchool + 0.1 - 29.3)); hw(SX, lerp(-56, -74.5, u), Math.PI, lerp(10, 5, u), { run: 1, t, open: 0.3 });
  const d = clamp01((t - tSchool) * 4); ST.doors.forEach((dr, i) => (dr.rotation.y = (i ? 1 : -1) * 1.6 * d)); PUFF.set(V3(SX, 1.5, -75.5), clamp01((t - tSchool) / 0.7), 1.0);
} });
// 18 "into my classroom, right onto the teacher's desk." it bursts in and lands on the desk
const tDesk = W('desk', 32.6);
S(W('into', 30.9), { ...CLS, cam: [[CX + 4.1, 2.3, 3.8], [CX + 3.9, 2.25, 3.6], [CX - 0.8, 0.9, -2.0]], fov: 58, act(t) {
  const u = clamp01((t - 31.0) / (tDesk - 31.0)); const x = lerp(CX - 5.4, CL.desk.x, u), z = lerp(-3.3, CL.desk.z, smooth(u)), y = lerp(0, CL.desk.y, smooth(u)) + Math.sin(Math.PI * u) * 1.0;
  hw(x, z, Math.PI / 2 + 0.4 * u, 2.2, { y, run: u < 1 ? 1 : 0, open: 0.3, t });
  put(TEACH, CL.desk.x + 0.2, 0, CL.desk.z - 1.0, toward(CL.desk.x, CL.desk.z - 1.0, x, z)); TEACH.c.pose(u < 1 ? 'flinch' : 'idle', t); TEACH.c.setFace('shock');
  put(K, CX - 4.0, 0, -3.2, Math.PI / 2); K.c.pose('sprint', t); K.c.setFace('scared');
} });
// 19 "The teacher looked at it, picked up her red pen, and wrote, A plus."
const tPen = W('pen', 34.9), tPlus = W('plus', 36);
S(W('the', 33.4), { ...CLS, cam: [[CX + 2.4, 1.55, 0.4], [CX + 2.2, 1.5, 0.1], [CX + 0.5, 1.15, -2.6]], fov: 50, act(t) {
  hw(CL.desk.x, CL.desk.z, Math.PI / 2 + 0.4, 2.2, { y: CL.desk.y, open: 0.12, t, look: 1 }); HW.aplus.visible = t > tPlus - 0.2; HW.aplus.scale.setScalar(smooth((t - tPlus + 0.2) / 0.3));
  put(TEACH, CL.desk.x + 0.2, 0, CL.desk.z - 1.0, 0.1); TEACH.c.pose(t > tPen - 0.2 ? 'holding-right' : 'idle', t); TEACH.c.setFace(t > tPlus ? 'proud' : 'neutral');
  if (t > tPen - 0.2) { TEACH.c.handR.updateWorldMatrix(true, false); pen.visible = true; pen.position.copy(TEACH.c.handR.getWorldPosition(new THREE.Vector3())).add(V3(0, 0.03, 0.05)); pen.rotation.set(0.8 + Math.sin(t * 20) * 0.2 * (t > tPlus - 0.5 && t < tPlus + 0.2), 0, 0.3); }
} });
// 20 "The homework burped one more time."
const tBurp2 = W('burped', 37.2);
S(W('the', 36.9), { ...CLS, cam: [[CX + 3.0, 1.5, 1.6], [CX + 2.8, 1.45, 1.3], [CX + 0.5, 1.0, -2.5]], fov: 52, act(t) {
  const d = t - tBurp2; hw(CL.desk.x, CL.desk.z, Math.PI / 2 + 0.4, 2.2, { y: CL.desk.y, open: d > -0.1 && d < 0.45 ? 0.95 : 0.12, t }); HW.aplus.visible = true; HW.aplus.scale.setScalar(1);
  PUFF.set(V3(CL.desk.x + 0.5, CL.desk.y + 0.3, CL.desk.z + 0.3), clamp01(d / 0.8), 0.35);
  put(TEACH, CL.desk.x + 0.2, 0, CL.desk.z - 1.0, 0.1); TEACH.c.pose(d > 0 ? 'flinch' : 'idle', t); TEACH.c.setFace(d > 0 ? 'squeeze' : 'proud');
} });
// 21 "And out came my dog, wearing glasses." close-up 2 of 3
const tDog = W('came', 39);
S(W('and', 38.8), { ...CLS, cam: [[CX + 2.0, 1.35, -0.7], [CX + 1.9, 1.32, -0.85], [CL.desk.x + 0.2, 1.05, CL.desk.z + 0.1]], fov: 46, act(t) {
  const u = smooth((t - tDog + 0.1) / 0.5); hw(CL.desk.x - 0.25, CL.desk.z - 0.1, Math.PI / 2 + 0.4, 2.2, { y: CL.desk.y, open: u < 1 ? 0.95 : 0.2, t }); HW.aplus.visible = true;
  dogAt(lerp(CL.desk.x - 0.1, CL.desk.x + 0.45, u), CL.desk.y + Math.sin(Math.PI * u) * 0.3, lerp(CL.desk.z, CL.desk.z + 0.35, u), toward(0, 0, 0.6, 1), u < 1 ? 'stand' : 'proud', t, { glasses: true });
} });
// 22 "Turns out, he did every single problem." the worksheet, all answered, paw prints; the teacher amazed
S(W('turns', 41), { ...CLS, cam: [[CX + 2.5, 1.7, 0.8], [CX + 2.3, 1.65, 0.5], [CX + 0.6, 0.95, -2.5]], fov: 50, act(t) {
  hw(CL.desk.x - 0.3, CL.desk.z - 0.05, 0.2, 1.6, { y: CL.desk.y, alive: false, open: 0, answers: true }); HW.aplus.visible = true; HW.aplus.scale.setScalar(1);
  dogAt(CL.desk.x + 0.45, CL.desk.y, CL.desk.z + 0.35, 0.6, 'proud', t, { glasses: true });
  put(TEACH, CL.desk.x + 0.2, 0, CL.desk.z - 1.0, 0.1); TEACH.c.pose('clap', t); TEACH.c.setFace('happy');
} });
// 23 "My dog got an A plus." a gold star for the dog
S(W('my', 43.1), { ...CLS, cam: [[CX + 1.9, 1.35, -0.5], [CX + 1.8, 1.33, -0.7], [CL.desk.x + 0.4, 1.0, CL.desk.z + 0.3]], fov: 50, act(t) {
  hw(CL.desk.x - 0.3, CL.desk.z - 0.05, 0.2, 1.6, { y: CL.desk.y, alive: false, open: 0, answers: true }); HW.aplus.visible = true; HW.aplus.scale.setScalar(1);
  dogAt(CL.desk.x + 0.45, CL.desk.y, CL.desk.z + 0.35, 0.6, 'proud', t, { glasses: true, star: t > 43.6 });
  put(TEACH, CL.desk.x + 0.25, 0, CL.desk.z - 0.75, 0.6); TEACH.c.pose('interact-right', 0.4, null, 0, 0, { once: true }); TEACH.c.setFace('happy');
} });
// 24 "I got detention for not doing my homework." close-up 3 of 3: Kuro with the pink slip
S(W('i', 45), { ...CLS, cam: [[CX - 2.3, 1.2, 0.5], [CX - 2.35, 1.18, 0.35], [CX - 3.2, 1.0, -1.4]], fov: 46, act(t) {
  put(K, CX - 3.2, 0, -1.4, toward(CX - 3.2, -1.4, CX - 2.3, 0.5)); K.c.pose('holding-right', t); K.c.setFace('sad'); holdSlip(K);
} });
// 25 "Now my dog goes to school every day." the dog trots to school with a backpack and glasses
S(W('now', 47.4), { ...OUT, cam: [[SX + 2.6, 0.95, -39.5], [SX + 2.8, 0.95, -41], [SX + 5, 0.5, -50]], fov: 52, act(t) {
  const z = -43.5 - (t - 47.4) * 1.6; dogAt(SX + 5.0, 0.12, z, Math.PI, 'walk', t, { glasses: true, pack: true });
} });
// 26 "And I stay home and chew the furniture." Kuro on the floor, gnawing a chair
S(W('and', 49.3), { ...IN, cam: [[1.4, 1.15, 3.9], [1.25, 1.12, 3.6], [-0.5, 0.65, 0.9]], fov: 52, act(t) {
  gone('socks', 'couch', 'lamp');
  const yaw = toward(-0.6, 1.1, 1.4, 3.9) - 0.75, f = V3(Math.sin(yaw), 0, Math.cos(yaw));
  put(K, -0.6, 0, 1.1, yaw); K.seated = true; K.c.pose('sit', 0); K.c.av.body.position.y = 0.72; K.c.armL.rotation.x = -1.5; K.c.armR.rotation.x = -1.5 + Math.sin(t * 9) * 0.06; K.c.setFace('happy_talk');
  K.c.head.rotation.x = 0.1 + Math.sin(t * 9) * 0.06;
  const side = V3(Math.cos(yaw), 0, -Math.sin(yaw)); chair.visible = true; chair.position.set(-0.6 - side.x * 0.75, 0, 1.1 - side.z * 0.75); chair.rotation.set(0, yaw + 0.4, 0); chair.children[chair.children.length - 1].visible = false;
  K.c.handR.updateWorldMatrix(true, false); stick.visible = true; stick.position.copy(K.c.handR.getWorldPosition(new THREE.Vector3())).add(V3(0, 0.12, 0)); stick.rotation.set(0.3, yaw, 1.2 + Math.sin(t * 9) * 0.05);
} });
SHOTS.sort((a, b) => a.t - b.t);

// ---------------------------------------------------------------- render
const LIGHTS = []; scene.traverse((o) => { if (o.isPointLight || o.isSpotLight) LIGHTS.push(o); });
function shotIndex(t) { let i = 0; SHOTS.forEach((x, j) => { if (t >= x.t) i = j; }); return i; }
window.renderAt = (t) => {
  const i = shotIndex(t), s = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END;
  const k = clamp01((t - s.t) / (t1 - s.t));
  hideAll(); resetEaten();
  setLight(s.light, s.c);
  const [from, to, look, lookTo] = s.cam;
  camera.position.set(...from.map((v, j) => lerp(v, to[j], k)));
  camera.fov = s.fov || 55; camera.updateProjectionMatrix();
  const L = new THREE.Vector3(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  setShot(i);
  s.act(t, k, s);
  applyCamera(i, camera, L);
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.HOUSE_RULES = { framing: true, close: [5, 21, 24] };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { get rotation() { return { x: a.seated ? 2 : 0 }; } } })) };
window.READY = true;
