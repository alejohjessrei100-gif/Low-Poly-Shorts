// Episode 01 "Your Shadow Is Free" - full episode. Deterministic: window.renderAt(t).
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { makeAvatar, pose, setFace, talkFace, walk, run, reset, shadowCrowd } from '../../kit/avatar.js';
import { buildTown, setWindows, setLamps } from '../../kit/town.js';
import * as P from '../../kit/props.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'));
const { THREE, scene, camera, composer, bokeh, grade, setLight } = C;
scene.add(camera);
buildTown(scene);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), P.std(0x9ed97c, { roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(300, -0.05, 0); ground.receiveShadow = true; scene.add(ground);

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.45;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const SIDE = 0.3;

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
// place an actor: feet position, facing yaw, k = 1 standing / 0 lying flat on the ground (shadows)
function put(a, x, y, z, yaw = 0, k = 1) {
  a.wrap.visible = true;
  a.wrap.position.set(x, y, z); a.wrap.rotation.set(0, yaw, 0);
  a.tilt.rotation.set(Math.PI / 2 * (1 - k), 0, 0);
  a.av.root.scale.set(1, 1, a.av.shadowMode ? 0.04 + 0.96 * k : 1);
  reset(a.av);
}
const leo = actor({ shirt: 0x3fb6a8, pants: 0x2f4a8a, hair: 0x5a3a22, backpack: 0xf4c542 });
leo.av.root.traverse((o) => { if (o.isMesh) o.castShadow = false; }); // Leo's real shadow IS the shadow-person
const sh = actor({ shadowMode: true, backpack: 1 });
const mia = actor({ shirt: 0xff7aa8, pants: 0x6b7fd9, hair: 0x2a1a12, hairStyle: 'ponytail', skin: 0xe8b48a });
const cop = actor({ shirt: 0x2a3f7a, pants: 0x1f2b55, hair: 0x3a2a1a, hairStyle: 'short', hat: 'police', skin: 0xc98d62 });
const cop2 = actor({ shirt: 0x2a3f7a, pants: 0x1f2b55, hair: 0x111111, hairStyle: 'short', hat: 'police', skin: 0xf2c9a0 });
const tapeGuy = actor({ shirt: 0xf2a33a, pants: 0x4a5a7a, hair: 0x6b4a2a, hairStyle: 'short', skin: 0xf2c9a0, glasses: true });
const tapeSh = actor({ shadowMode: true });
const baker = actor({ shirt: 0xb98cf0, pants: 0x5a4a8a, hair: 0x8a4a2a, hairStyle: 'bun', skin: 0xf2c9a0 });
const bakerSh = actor({ shadowMode: true, hat: 'chef' });
const FOLK_LOOKS = [
  { shirt: 0xff8f6b, pants: 0x3a4a7a, hairStyle: 'short', hair: 0x2a1a12, skin: 0xc98d62 },
  { shirt: 0x8fd16b, pants: 0x5a4a3a, hairStyle: 'bun', hair: 0xd9a066, skin: 0xf2c9a0 },
  { shirt: 0x6fb6ff, pants: 0x2a2a3a, hairStyle: 'messy', hair: 0x111111, skin: 0x8a5a3c },
  { shirt: 0xffd45c, pants: 0x4a5a7a, hairStyle: 'ponytail', hair: 0x6b3a1a, skin: 0xf6c89a },
  { shirt: 0xb98cf0, pants: 0x3a3a5a, hairStyle: 'short', hair: 0x9a9a9a, skin: 0xe8b48a, glasses: true },
  { shirt: 0xf6cfd8, pants: 0x2f4a8a, hairStyle: 'messy', hair: 0xd9b25a, skin: 0xf6c89a },
];
const folk = FOLK_LOOKS.map((o) => actor(o));
const folkSh = FOLK_LOOKS.map(() => actor({ shadowMode: true }));

// props
const board = P.skateboard(scene);
const cone = P.iceCream(scene);
const bird = P.pigeon(scene);
const ticket = P.sign(scene, ['MOVIE', 'TICKET'], 0, 0, 0, 0, 1.4, 0.8, { bg: '#ffd84d', fg: '#e8434f' });
const tape = P.tapeRoll(scene);
const ph = P.phone(scene);
const bag = P.moneyBag(scene);
const flashlight = new THREE.SpotLight(0xfff2c8, 0, 40, 0.45, 0.5, 1.2); scene.add(flashlight, flashlight.target);
const props = [board, cone, bird, ticket, tape.g, ph.g, bag];
const strips = [];
for (let i = 0; i < 3; i++) { const s = P.box(1.6, 0.06, 0.5, P.std(0xe8d9a8), 0, 0, 0, scene); strips.push(s); props.push(s); }
const hearts = [];
for (let i = 0; i < 5; i++) { const h = P.sign(scene, ['❤'], 0, 0, 0, 0, 1, 1, { bg: 'rgba(0,0,0,0)', fg: '#ff4d6d' }); h.material.transparent = true; hearts.push(h); props.push(h); }
const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.35, 0.22), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 260);
const CONF = ['#ff4d6d', '#ffd84d', '#6fb6ff', '#8fdc6b', '#b98cf0'];
for (let i = 0; i < 260; i++) confetti.setColorAt(i, new THREE.Color(CONF[i % 5]));
scene.add(confetti); props.push(confetti);
const shards = [];
for (let i = 0; i < 24; i++) { const s = P.box(0.6, 0.6, 0.3, new THREE.MeshBasicMaterial({ color: 0x241a40 }), 0, 0, 0, scene); s.castShadow = false; shards.push(s); props.push(s); }
const popcorn = P.box(1.0, 1.1, 0.8, P.std(0xe8434f), 0, 0, 0, scene, 0.1); props.push(popcorn);

// ---------------------------------------------------------------- sets (far apart; only one is on camera per shot)
const RAMP = P.ramp(scene, -1.5, -9);
P.bench(scene, -8.8, -40, Math.PI / 2);
P.school(scene, -100, 60, Math.PI / 2);
[[0, 1.3, 0, 2.0], [1.4, 1.0, 0.5, 1.5], [-1.3, 1.0, -0.4, 1.6]].forEach(([a, b, c, r]) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), P.std(0x6cc76a, { roughness: 0.9 })); o.position.set(-80.6 + a, b, 65.6 + c); o.castShadow = true; scene.add(o); });
const HL = P.house(scene, -100, 140, Math.PI / 2, 0xfbe0c2, 0xd9434f);
const hlLamps = [];
for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffd27a, 0, 16, 1.5); l.position.set(-93, 2 + (i % 2) * 3, 134 + i * 2.4); scene.add(l); hlLamps.push(l); }
const flood = [];
[[-86, 128], [-86, 152]].forEach(([x, z]) => { P.cyl(0.2, 0.2, 5, P.std(0x555a6a), x, 2.5, z, scene); P.box(1.4, 1, 1, P.glowMat(0xfff4d0, 2), x, 5.2, z, scene); const s = new THREE.SpotLight(0xfff4d0, 0, 40, 0.8, 0.5, 1); s.position.set(x, 5.2, z); s.target.position.set(-96, 3, 140); scene.add(s, s.target); flood.push(s); });
P.house(scene, -100, 220, Math.PI / 2, 0xc9e7d8, 0x6b7fd9);
const cars = [[-84, 210, 0.4], [-80, 222, -0.3], [-86, 232, 1.2], [-74, 216, 2.4]].map(([x, z, r]) => P.policeCar(scene, x, z, r));
const BANK = P.bank(scene, -100, -60, Math.PI / 2);
P.powerPlantExterior(scene, 300, 0);
const PLI = P.powerPlantInterior(scene, 600, 0);
const crowdCarry = shadowCrowd(260, 'carry', (i) => { const a = i * 2.399, r = 15 + (i % 9) * 2.6; return { pos: [600 + Math.sin(a) * r, 0, -18 + Math.cos(a) * r * 0.9], rotY: a + Math.PI / 2 + (i % 3) * 0.3 }; });
const crowdCheer = shadowCrowd(260, 'cheer', (i) => { const a = i * 2.399, r = 13 + (i % 9) * 2.8; return { pos: [600 + Math.sin(a) * r, 0, -18 + Math.cos(a) * r * 0.9], rotY: Math.atan2(-Math.sin(a) * r, 22 - Math.cos(a) * r * 0.9) }; });
scene.add(crowdCarry, crowdCheer);
const BR = P.bedroom(scene, 1000, 0);
const BK = P.bakery(scene, 1000, 60);
const LR = P.livingRoom(scene, 1000, 120);
P.vault(scene, 1000, 180);

// CCTV HUD (camera-attached)
const hud = P.liveScreen(540, 960, (c, w, h, t) => {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; c.font = '800 34px Poppins'; c.textAlign = 'left';
  c.fillText('CAM 03  VAULT', 30, 60);
  c.fillText(`02:${String(14 + Math.floor(t)).padStart(2, '0')} AM`, 30, 104);
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ff3b4d'; c.beginPath(); c.arc(w - 120, 48, 14, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillText('REC', w - 96, 60); }
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 5;
  [[20, 20, 1, 1], [w - 20, 20, -1, 1], [20, h - 20, 1, -1], [w - 20, h - 20, -1, -1]].forEach(([x, y, a, b]) => { c.beginPath(); c.moveTo(x, y + 60 * b); c.lineTo(x, y); c.lineTo(x + 60 * a, y); c.stroke(); });
});
const hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hud.tex, transparent: true, depthTest: false, fog: false }));
hudMesh.renderOrder = 999; camera.add(hudMesh);

// ---------------------------------------------------------------- helpers
const v3 = (a) => new THREE.Vector3(...a);
function lie(a, x, z, yaw = 0, y = SIDE) { put(a, x, y + 0.01, z, yaw, 0); }
function hideAll() {
  for (const a of actors) { a.wrap.visible = false; a.wrap.position.set(0, -50, 0); }
  for (const p of props) p.visible = false;
  crowdCarry.visible = crowdCheer.visible = false; crowdCheer.position.y = 0; RAMP.visible = false; BR.moon.intensity = 0;
  flashlight.intensity = 0;
  hudMesh.visible = false;
  grade.uniforms.cctv.value = 0; grade.uniforms.flash.value = 0;
  setWindows(0); setLamps(0.6);
  hlLamps.forEach((l) => (l.intensity = 0)); flood.forEach((l) => (l.intensity = 0));
  HL.wins.forEach((w) => (w.material.emissiveIntensity = 0));
  BR.lampLight.intensity = 25; BR.shade.material.emissiveIntensity = 0.8; BR.win.visible = true; BR.winNight.visible = false;
  BR.hinge.rotation.y = 0; BR.lock.rotation.z = 0;
  PLI.btn.position.y = 3.7; PLI.btn.material.emissiveIntensity = 0.6;
  BK.flying.forEach((b) => (b.visible = false)); BANK.bills.forEach((b) => (b.visible = false));
  cars.forEach((c) => c.flash(-1));
}
function hold(obj, hand, pos = [0, 0, 0], rot = [0, 0, 0]) { // stick a prop to a hand anchor for this frame
  obj.visible = true;
  hand.updateWorldMatrix(true, false);
  obj.position.copy(hand.localToWorld(v3(pos)));
  obj.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
const hop = (t, f = 3) => Math.abs(Math.sin(t * f * Math.PI)) * 0.4;
const nightRoom = () => { BR.win.visible = false; BR.winNight.visible = true; BR.lampLight.intensity = 0; BR.shade.material.emissiveIntensity = 0.02; BR.moon.intensity = 60; };
const spin = (t) => PLI.rings.forEach((r, i) => (r.rotation.z = t * (1 + i * 0.3)));

// ---------------------------------------------------------------- shots
// {t: start, light, c: light centre, sun: sun offset, cam: [from, to, look(, lookTo)], fov, dof: [focus, aperture], act(t)}
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const SH_FEET = [6.6, SIDE + 0.01, 0.6], SH_STAND = [6.6, SIDE, 3.4];

// 0-3: the approved look-test shots
S(0, { light: 'day', cam: [[0, 25, 36], [0, 21.5, 25], [0, 9, -110]], fov: 46, act: leoIntro });
S(0.94, { light: 'day', cam: [[-1.6, 2.9, 9.4], [-0.6, 2.75, 8.6], [6.6, 2.4, 1.8]], fov: 50, dof: [11.0, 0.006], act: leoIntro });
S(2.0, { light: 'day', cam: [[-3.6, 4.4, 1.3], [-2.7, 4.35, 1.7], [6.6, 4.6, 2.6]], fov: 60, dof: [10.0, 0.006], act: leoIntro });
S(3.6, { light: 'day', cam: [[3.4, 5.2, -6.3], [3.7, 5.1, -5.6], [6.6, 4.5, 0.5]], fov: 42, dof: [6.7, 0.018], act: leoIntro });
function leoIntro(t) {
  put(leo, 6.6, SIDE, 0, -Math.PI / 2);
  leo.body.position.y = 2 + Math.sin(t * 2.4) * 0.03;
  if (t < 1.55) { pose(leo, 'idle'); setFace(leo, 'smile'); }
  else if (t < 2.2) { pose(leo, 'idle', 'flinch', smooth((t - 1.55) / 0.5) * 0.35); setFace(leo, 'scared'); }
  else if (t < 3.6) { pose(leo, 'idle', 'flinch', 0.35 + 0.65 * smooth((t - 2.2) / 0.3)); setFace(leo, 'scared'); }
  else { pose(leo, 'flinch', 'idle', smooth((t - 3.6) / 0.35)); leo.wrap.rotation.y = -2.5; leo.headPivot.rotation.y = 0.12 * Math.sin(t * 3); talkFace(leo, WORDS, t, 'scared_talk', 'scared'); }
  if (t < 3.6) {
    const k = smooth((t - 1.5) / 0.5);
    const p = v3(SH_FEET).lerp(v3(SH_STAND), k);
    put(sh, p.x, p.y, p.z, -Math.PI / 2 * smooth((t - 1.9) / 0.3), k);
    if (t < 2.0) pose(sh, 'idle');
    else if (t < 2.25) pose(sh, 'idle', 'crouch', smooth((t - 2.0) / 0.25));
    else if (t < 3.05) { const u = (t - 2.25) / 0.8; sh.body.position.y = 2 + 4.2 * 4 * u * (1 - u); sh.body.rotation.z = 2 * Math.PI * smooth(u); pose(sh, 'crouch', 'tuck', Math.min(1, u * 3) * (u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25)); }
    else if (t < 3.2) pose(sh, 'crouch');
    else pose(sh, 'crouch', 'tada', smooth((t - 3.2) / 0.2));
  } else { put(sh, 7.6, SIDE, 6.0, -2.82); pose(sh, 'wave'); sh.armR.rotation.z = 2.4 + 0.35 * Math.sin(t * 11); }
}

// "your shadow peels off the ground" - Leo freezes at the ramp, his shadow lifts off the road
const tPeel = W('your', 5.5), tDoes = W('and', 6.5);
S(tPeel, { light: 'day', c: [0, 0, -10], cam: [[5.5, 2.2, -2.5], [4.8, 2.1, -3.2], [-1.5, 2.0, -8]], fov: 55, dof: [9, 0.005], act(t) {
  RAMP.visible = true;
  put(leo, -1.5, 0, -6.5, 1.6); pose(leo, 'idle', 'shy', 0.6); setFace(leo, 'scared');
  board.visible = true; board.position.set(-0.2, 0, -8.2); board.rotation.set(0, 0.3, 0);
  const k = smooth((t - tPeel - 0.2) / 0.9);
  put(sh, -1.5, 0.01, lerp(-7.3, -9.6, k), Math.PI, k); pose(sh, 'idle'); setFace(sh, 'glow');
} });
// "and does it for you" - the shadow skates up the ramp and launches
S(tDoes, { light: 'day', c: [0, 0, -14], cam: [[4.6, 4.2, -9], [4.6, 5.0, -11], [-1.5, 5, -16]], fov: 64, act(t) {
  RAMP.visible = true;
  put(leo, -1.5, 0, -6.2, Math.PI); pose(leo, 'idle', 'flinch', 0.5); setFace(leo, 'shock');
  const u = clamp01((t - tDoes) / 1.6);
  const z = lerp(-6.5, -15.2, clamp01(u / 0.55)) + Math.max(0, u - 0.55) * 4, up = u < 0.55 ? 0 : 1;
  const air = Math.max(0, Math.sin(clamp01((u - 0.55) / 0.45) * Math.PI)) * 5.5;
  const rz = clamp01((-9 - z) / 6); // position up the ramp (0 at the low end, 1 at the lip)
  const rampH = u < 0.55 ? (z > -9 ? 0 : 3.2 * rz * rz) : 3.2 + air;
  put(sh, -1.5, rampH, z, Math.PI);
  pose(sh, 'crouch', 'tada', up * smooth((u - 0.6) / 0.2)); setFace(sh, 'glow');
  sh.body.rotation.y = up * 2 * Math.PI * smooth((u - 0.55) / 0.35);
  board.visible = true; board.position.set(-1.5, rampH - 0.3, z); board.rotation.set(u < 0.55 && z < -9 ? 2 * 3.2 * rz / 6 * 1.2 : 0, 0, 0);
  sh.wrap.position.y += 0.15;
} });
// "My name is Leo"
const tName = W('my', 8.3), tScared = W('and', 9.5);
S(tName, { light: 'day', cam: [[-0.6, 4.4, 12.5], [0.2, 4.3, 11.2], [6.8, 4.0, 5.2]], fov: 45, dof: [9.8, 0.01], act(t) {
  put(leo, 6.6, SIDE, 4.5, -0.73); pose(leo, 'wave'); leo.armR.rotation.z = 2.4 + 0.35 * Math.sin(t * 10); talkFace(leo, WORDS, t, 'happy_talk', 'smile');
  put(sh, 8.6, SIDE, 2.2, -0.9); pose(sh, 'wave'); sh.armR.rotation.z = 2.4 + 0.35 * Math.sin(t * 10 + 1); setFace(sh, 'glow');
} });
// "and I'm scared of pretty much everything" - a pigeon
S(tScared, { light: 'day', c: [0, 0, -54], cam: [[-1.2, 3.0, -47], [-1.7, 3.0, -48.4], [-7.2, 2.4, -55]], fov: 52, dof: [8.6, 0.008], act(t) {
  const u = t - tScared;
  put(leo, -7.2, SIDE, -55 - smooth(u / 0.25) * 1.2, 0.7); leo.body.position.y = 2 + Math.max(0, Math.sin(clamp01(u / 0.4) * Math.PI)) * 1.2;
  pose(leo, 'idle', 'flinch', smooth(u / 0.2)); setFace(leo, 'shock');
  bird.visible = true; bird.position.set(-5.9, SIDE + hop(t, 2) * 0.5, -51.6); bird.rotation.y = Math.PI + 0.4 + Math.sin(t * 4) * 0.4;
} });
// "So my shadow has been living my best life" - bench, shades, ice cream
const tBest = W('so', 11);
S(tBest, { light: 'day', c: [-8, 0, -40], cam: [[-0.6, 4.2, -45.5], [-1.2, 4.0, -44.4], [-8.6, 2.6, -40]], fov: 48, dof: [8.8, 0.01], act(t) {
  put(sh, -8.5, -0.72, -40, Math.PI / 2); pose(sh, 'sitBack'); sh.armR.rotation.set(-1.9, 0, 0.2); setFace(sh, 'glow_cool');
  sh.legR.rotation.x = -1.3 + Math.sin(t * 5) * 0.1;
  hold(cone, sh.handR, [0, 0.5, 0], [Math.PI, 0, 0]);
} });
// "Yesterday, I was too scared to talk to the new girl at school"
const tSchool = W('yesterday', 13);
S(tSchool, { light: 'day', c: [-85, 0, 62], cam: [[-72.0, 4.4, 71.0], [-72.8, 4.3, 70.3], [-83, 3.4, 63]], fov: 48, dof: [7.4, 0.006], act(t) {
  put(leo, -79.0, -0.9, 67.2, -2.37); pose(leo, 'shy'); setFace(leo, 'blush'); leo.headPivot.rotation.y = 0.3;
  put(mia, -88, 0, 58, Math.PI / 2 - 0.3); pose(mia, 'idle'); setFace(mia, 'smile'); mia.body.position.y = 2 + Math.sin(t * 2.2) * 0.04;
} });
// "My shadow walked right up to her and asked her to the movies"
const tAsk = W('my', 16.5);
S(tAsk, { light: 'day', c: [-85, 0, 62], cam: [[-80, 4.2, 48], [-80.5, 4.1, 49.5], [-87, 3.8, 58]], fov: 46, dof: [10.5, 0.008], act(t) {
  const u = clamp01((t - tAsk) / 1.3);
  put(mia, -88, 0, 58, Math.PI / 2 - 0.3); pose(mia, 'idle'); setFace(mia, u > 0.8 ? 'shock' : 'smile');
  put(sh, lerp(-80, -85.3, u), 0, lerp(63, 59.2, u), -2.2);
  if (u < 1) walk(sh.av, t, 1.8); else { pose(sh, 'offer'); hold(ticket, sh.handR, [0, -0.2, 0.6], [-Math.PI / 2, 0, 0]); }
  setFace(sh, 'glow');
} });
// "She said yes" / "to my shadow"
const tYes = W('she', 19), tToMy = W('to', 19.8);
S(tYes, { light: 'day', c: [-85, 0, 62], cam: [[-81.5, 5.4, 60.5], [-82.3, 5.3, 60.0], [-88, 4.8, 58]], fov: 40, dof: [6.5, 0.02], act(t) {
  put(mia, -88, 0, 58, Math.PI / 2 - 0.3); pose(mia, 'cheer', 'shy', 0.5); setFace(mia, 'love');
  hold(ticket, mia.handR, [0, -0.2, 0.6], [-Math.PI / 2, 0, 0]);
  hearts.forEach((h, i) => { h.visible = true; const a = (t * 0.8 + i * 0.2) % 1; h.position.set(-88 + Math.sin(i * 2) * 1.4, 5.6 + a * 3, 58 + 1.2 + Math.cos(i * 2) * 0.6); h.lookAt(camera.position); h.scale.setScalar(0.6 + a * 0.5); });
} });
S(tToMy, { light: 'day', c: [-85, 0, 62], cam: [[-74.6, 4.9, 72.6], [-75.0, 4.85, 72.0], [-77.8, 4.7, 68.4]], fov: 40, dof: [4.6, 0.02], act() {
  put(leo, -77.8, 0, 68.4, 0.65); pose(leo, 'idle'); setFace(leo, 'deadpan');
} });
// "But people in this town had gotten really creative" - busy street
const tCreative = W('but', 21);
S(tCreative, { light: 'day', c: [0, 0, -20], cam: [[0, 14, 14], [0, 12.5, 8], [0, 3, -30]], fov: 50, act(t) {
  const spots = [[-7, -8], [7, -14], [-6.5, -22], [7.5, -28], [-7.5, -34], [6.8, -40]];
  folk.forEach((f, i) => { const [x, z] = spots[i]; put(f, x, SIDE, z + Math.sin(t * 0.5 + i) * 1.5, i % 2 ? Math.PI : 0); walk(f.av, t + i * 0.3, 1.5); setFace(f, 'smile'); });
  folkSh.forEach((s, i) => { const [x, z] = spots[i]; put(s, x + (i % 2 ? -1.2 : 1.2), SIDE, z - 3 + Math.sin(t * 2 + i), i % 2 ? 0 : Math.PI); if (i % 3 === 0) pose(s.av, 'cheer'); else walk(s.av, t + i, 2.2); setFace(s, 'glow'); });
} });
// "Some kept every single light on all night so their shadows couldn't sneak out"
const tLights = W('some', 23.5);
S(tLights, { light: 'night', c: [-95, 0, 140], cam: [[-66, 5, 128], [-68, 4.8, 131], [-97, 4.5, 140]], fov: 46, act(t) {
  setWindows(0.9); setLamps(1.5);
  hlLamps.forEach((l) => (l.intensity = 40)); flood.forEach((l) => (l.intensity = 900));
  HL.wins.forEach((w) => (w.material.emissiveIntensity = 2.2));
  put(folk[4], -90.5, 0, 138, Math.PI / 2); pose(folk[4], 'crossArms'); setFace(folk[4], 'determined');
  put(folkSh[4], -91.5, 0, 141.5, Math.PI / 2); pose(folkSh[4], 'idle'); setFace(folkSh[4], 'glow');
  folkSh[4].body.position.y = 2 + Math.sin(t * 6) * 0.1; folkSh[4].av.armL.rotation.z = -0.5 - 0.4 * Math.sin(t * 7);
} });
// "One guy glued his shadow to the sidewalk with a giant roll of tape"
const tTape = W('one', 27);
S(tTape, { light: 'day', c: [-7, 0, -52], cam: [[1.8, 8.5, -43.5], [1.2, 8.0, -44.5], [-6.6, 1.0, -52.5]], fov: 50, dof: [12.5, 0.005], act(t) {
  put(tapeGuy, -6.0, SIDE, -50, Math.PI); pose(tapeGuy, 'kneel'); setFace(tapeGuy, 'determined');
  lie(tapeSh, -6.0, -51, Math.PI); pose(tapeSh, 'idle'); setFace(tapeSh, 'glow');
  tapeSh.av.armL.rotation.z = -0.3 - 0.3 * Math.sin(t * 9); tapeSh.av.legR.rotation.z = 0.2 * Math.sin(t * 8);
  tape.g.visible = true; tape.g.position.set(-8.2, SIDE + 1.45, -53.2); tape.g.rotation.set(0, Math.PI / 2, t * 2);
  strips.forEach((s, i) => { s.visible = true; s.position.set(-6.0, SIDE + 0.12, -52.2 - i * 1.6); s.rotation.set(0, 0.2 * (i - 1), 0); s.scale.set(2.4, 1, 1); });
} });
// "And the baker's shadow ran the entire bakery" / "while she stayed home watching TV"
const tBaker = W('and', 30.9), tTV = W('while', 32);
S(tBaker, { light: 'indoor', c: [1000, 0, 60], cam: [[1000, 5.5, 72], [1000, 5.2, 70.5], [1000, 4.6, 60]], fov: 50, dof: [11, 0.006], act(t) {
  put(bakerSh, 1000, 0, 62.5, 0); pose(bakerSh, 'cheer'); setFace(bakerSh, 'glow');
  bakerSh.av.armL.rotation.x = -2.6 + Math.sin(t * 12) * 0.4; bakerSh.av.armR.rotation.x = -2.6 - Math.sin(t * 12) * 0.4;
  BK.flying.forEach((b, i) => { b.visible = true; const a = t * 5 + i * 1.25; b.position.set(1000 + Math.cos(a) * 1.8, 8.4 + Math.sin(a) * 1.2, 62.8); b.rotation.set(a, a * 0.5, Math.PI / 2); });
} });
S(tTV, { light: 'indoor', c: [1000, 0, 120], cam: [[1006.2, 4.6, 116.4], [1005.6, 4.4, 116.8], [1000.4, 3.0, 121.8]], fov: 50, dof: [7.6, 0.01], act(t) {
  LR.screen.draw(t);
  put(baker, 1000, -0.3, 122.2, Math.PI); pose(baker, 'sitBack'); baker.av.armR.rotation.set(-1.4 + Math.abs(Math.sin(t * 4)) * 0.5, 0, 0.3); setFace(baker, 'happy');
  popcorn.visible = true; popcorn.position.set(1001.6, 2.3, 121.6);
} });
// "Honestly, it was kind of great"
const tGreat = W('honestly', 35);
S(tGreat, { light: 'day', c: [-8, 0, -40], cam: [[-2.6, 3.8, -36.6], [-2.9, 3.7, -37.4], [-8.5, 2.9, -40.4]], fov: 46, dof: [7, 0.012], act(t) {
  put(leo, -8.5, -0.72, -40.4, Math.PI / 2); pose(leo, 'sitBack'); setFace(leo, 'happy'); leo.headPivot.rotation.z = Math.sin(t * 2) * 0.08;
  leo.av.armR.rotation.set(-1.7, 0, 0.2); hold(cone, leo.handR, [0, 0.5, 0], [Math.PI, 0, 0]);
} });
// "Until this morning" / "my phone buzzed"
const tMorning = W('until', 36.5), tBuzz = W('my', 37.5);
S(tMorning, { light: 'indoor', c: [1000, 0, 0], cam: [[1004.5, 6.5, 6], [1004, 6.2, 5], [996.5, 2.4, -3]], fov: 52, act() {
  put(leo, 996.5, 2.45, -0.3, 0, 0); leo.tilt.rotation.x = -Math.PI / 2; pose(leo, 'idle'); setFace(leo, 'sleepy');
  BR.lampLight.intensity = 0; BR.shade.material.emissiveIntensity = 0.1;
} });
S(tBuzz, { light: 'indoor', c: [1000, 0, 0], cam: [[999.9, 3.9, -2.4], [999.85, 3.7, -2.9], [999.7, 1.9, -4.8]], fov: 38, dof: [3.2, 0.025], act(t) {
  BR.lampLight.intensity = 0; BR.shade.material.emissiveIntensity = 0.1;
  ph.g.visible = true; ph.g.position.set(999.7 + Math.sin(t * 90) * 0.04, 1.88, -4.8); ph.g.rotation.set(-Math.PI / 2, 0, 0.3 + Math.sin(t * 70) * 0.05);
  ph.scr.draw('news');
} });
// "Breaking news" (Leo holds phone) / "someone robbed the city bank"
const tNews = W('breaking', 39), tBank = W('someone', 39.5);
S(tNews, { light: 'indoor', c: [1000, 0, 0], cam: [[1004.2, 5.4, 0.6], [1003.6, 5.3, 0.1], [999.0, 4.4, -2.0]], fov: 42, dof: [5.3, 0.016], act() {
  put(leo, 998.4, 0.25, -2.0, Math.PI / 2 + 0.25); pose(leo, 'phone'); setFace(leo, 'shock');
  leo.av.legL.rotation.x = -1.57; leo.av.legR.rotation.x = -1.57;
  hold(ph.g, leo.handR, [0, 0.2, 0.25], [-Math.PI / 2, Math.PI, 0]); ph.scr.draw('news');
} });
S(tBank, { light: 'day', c: [-95, 0, -60], cam: [[-66, 3, -48], [-68, 3.6, -50], [-96, 9, -60]], fov: 52, act(t) {
  BANK.flash(t);
  BANK.bills.forEach((b, i) => { b.visible = true; const a = (t * 0.35 + i * 0.137) % 1; b.position.set(Math.sin(i * 2.1) * 9, 1 + a * 11 + Math.sin(t * 3 + i) * 0.6, 8 + a * 8 + Math.cos(i * 1.7) * 2); b.rotation.set(t * 3 + i, t * 2 + i, i); });
} });
// security camera: a skinny shadow with messy hair and a backpack
const tCam = W('and', 41.5);
S(tCam, { light: 'indoor', c: [1000, 0, 180], cam: [[1007.4, 8.6, 186.6], [1007.2, 8.6, 186.4], [999.5, 1.6, 177.5]], fov: 74, cctv: true, act(t) {
  const u = clamp01((t - tCam) / 3.2);
  put(sh, lerp(995, 1003, u), 0, 177.6 + Math.sin(u * 6) * 0.3, Math.PI / 2); walk(sh.av, t, 1.4, 0.5); sh.body.rotation.x = 0.25; setFace(sh, 'glow');
  hold(bag, sh.handR, [0, -0.6, 0], [0, 0, 0]);
} });
// "Mine."
const tMine = W('mine', 45.5);
S(tMine, { light: 'indoor', c: [1000, 0, 0], cam: [[1002.0, 5.0, -0.9], [1001.4, 4.98, -1.25], [998.4, 4.7, -2.0]], fov: 40, dof: [3.2, 0.03], act() {
  put(leo, 998.4, 0.25, -2.0, Math.PI / 2 + 0.25); pose(leo, 'flinch'); setFace(leo, 'shock'); leo.av.legL.rotation.x = -1.57; leo.av.legR.rotation.x = -1.57;
} });
// "Within minutes, police cars surrounded my house"
const tPolice = W('within', 46);
S(tPolice, { light: 'morning', c: [-90, 0, 220], cam: [[-52, 16, 238], [-56, 14, 234], [-92, 2, 220]], fov: 46, act(t) {
  cars.forEach((c) => c.flash(t));
  put(cop, -79, 0, 214, -Math.PI / 2 - 0.3); pose(cop, 'point'); setFace(cop, 'angry');
  put(cop2, -81, 0, 228, -Math.PI / 2 + 0.3); pose(cop2, 'crossArms'); setFace(cop2, 'angry');
} });
// "I tried to explain, but nobody believes a scared kid"
const tExplain = W('i', 48.9);
S(tExplain, { light: 'morning', c: [-90, 0, 220], cam: [[-78.5, 5.4, 211.5], [-79.2, 5.3, 212.2], [-89, 4.4, 220.8]], fov: 46, dof: [12.8, 0.01], act(t) {
  cars.forEach((c) => c.flash(t));
  put(leo, -91, 0.3, 219, Math.PI / 2 + 0.4); pose(leo, 'armsOut', 'idle', 0.3 + 0.2 * Math.sin(t * 3)); talkFace(leo, WORDS, t, 'scared_talk', 'scared');
  put(cop, -86.6, 0, 222.4, -Math.PI / 2 - 0.5); pose(cop, 'crossArms'); setFace(cop, 'angry');
} });
// "That's when I noticed something strange" (dusk)
const tStrange = W("that's", 51.8);
S(tStrange, { light: 'dusk', c: [6, 0, 0], sun: [-40, 14, 10], cam: [[3.9, 5.6, -2.9], [4.25, 5.45, -2.5], [6.6, 4.2, 0]], fov: 42, dof: [3.7, 0.02], act() {
  put(leo, 6.6, SIDE, 0, -2.4); pose(leo, 'idle'); leo.headPivot.rotation.x = 0.45; setFace(leo, 'scared');
} });
// "Every shadow in town was pointing the same direction" - all shadows point to -z
const tPoint = W('every', 53.8);
S(tPoint, { light: 'dusk', c: [0, 0, -20], sun: [-40, 14, 10], cam: [[0, 15, 9], [0, 13, 4], [0, 0, -28]], fov: 52, act() {
  const spots = [[-7, -6], [7.2, -10], [-6.5, -18], [7.5, -24], [-7.5, -32], [6.8, -38]];
  folk.forEach((f, i) => { const [x, z] = spots[i]; put(f, x, SIDE, z, i * 1.3); pose(f, 'idle'); f.headPivot.rotation.x = 0.4; setFace(f, 'shock'); });
  folkSh.forEach((s, i) => { const [x, z] = spots[i]; lie(s, x, z - 0.6, Math.PI); pose(s, 'point'); s.av.armR.rotation.set(-3.0, 0, 0); s.av.root.scale.y = 2.2; });
  lie(sh, 6.6, -0.6, Math.PI); pose(sh, 'point'); sh.av.armR.rotation.set(-3.0, 0, 0); sh.av.root.scale.y = 2.2;
  put(leo, 6.6, SIDE, 0, -2.4); pose(leo, 'idle');
} });
// "Toward the old power plant"
const tPlant = W('toward', 56);
S(tPlant, { light: 'dusk', c: [300, 0, 10], sun: [-40, 14, 30], cam: [[300, 3, 60], [300, 4, 52], [300, 10, 0]], fov: 50, act() {} });
// "So that night, for the first time in my life," / "I didn't wait for my shadow to be brave"
const tNight = W('so', 58.4), tBrave = W('i', 60.4);
S(tNight, { light: 'night', c: [300, 0, 30], cam: [[294.5, 4.2, 57], [295, 4.1, 54], [300, 3.2, 36]], fov: 50, act(t) {
  const z = lerp(46, 36, clamp01((t - tNight) / 2.2));
  put(leo, 300, 0, z, Math.PI); walk(leo.av, t, 1.5); setFace(leo, 'determined');
  flashlight.intensity = 300; flashlight.position.set(301, 3.2, z - 1); flashlight.target.position.set(300, 0, z - 14);
} });
S(tBrave, { light: 'night', c: [300, 0, 30], cam: [[300.5, 5.1, 30.2], [300.4, 5.05, 30.8], [300, 4.8, 35.4]], fov: 40, dof: [4.8, 0.02], act(t) {
  put(leo, 300, 0, 35.4, Math.PI + 0.15); pose(leo, 'idle'); talkFace(leo, WORDS, t, 'determined_talk', 'determined');
  flashlight.intensity = 60; flashlight.position.set(301.5, 3, 32); flashlight.target.position.set(300, 4.6, 35.4);
} });
// "I snuck inside"
const tSnuck = W('i', 62.6);
S(tSnuck, { light: 'plant', c: [600, 0, 20], cam: [[606, 3.2, 31], [605.5, 3.1, 32], [600.2, 3, 41]], fov: 52, dof: [10.5, 0.008], act(t) {
  const u = clamp01((t - tSnuck) / 1.6);
  put(leo, 600, 0, lerp(47, 40.5, u), Math.PI); walk(leo.av, t, 1.2, 0.4); leo.body.rotation.x = 0.35; leo.body.position.y = 1.7; setFace(leo, 'scared');
  crowdCarry.visible = true;
} });
// "Thousands of shadows were stacking stolen money around a giant machine" / "wired to every power line"
const tThousands = W('thousands', 64), tWired = W('wired', 66);
S(tThousands, { light: 'plant', c: [600, 0, -10], cam: [[600, 34, 40], [600, 26, 30], [600, 6, -18]], fov: 55, act(t) { crowdCarry.visible = true; spin(t); } });
S(tWired, { light: 'plant', c: [600, 0, -10], cam: [[606, 4, 8], [609, 6, 5], [618, 14, -28], [634, 25, -40]], fov: 52, act(t) { crowdCarry.visible = true; spin(t); } });
// "A huge screen flashed" / "City blackout in 60 seconds"
const tScreen = W('a', 69.6), tBlackout = W('city', 71.3);
S(tScreen, { light: 'plant', c: [600, 0, -20], cam: [[620, 12, 4], [618, 13, 0], [600, 22, -44]], fov: 52, act(t) { crowdCarry.visible = true; PLI.screen.draw(60, Math.floor(t * 8) % 2 === 0); spin(t); } });
S(tBlackout, { light: 'plant', c: [600, 0, -30], cam: [[600, 27.5, -14], [600, 27.2, -16.5], [600, 25, -44]], fov: 46, act(t) { PLI.screen.draw(60, Math.floor(t * 4) % 2 === 0); } });
// "And that's when I understood"
const tUnder = W('and', 73.3);
S(tUnder, { light: 'plant', c: [600, 0, 20], cam: [[600.8, 5.0, 25.6], [600.7, 4.98, 26.2], [600, 4.75, 30]], fov: 40, dof: [4.2, 0.025], act() {
  put(leo, 600, 0, 30, Math.PI); pose(leo, 'idle'); setFace(leo, 'shock'); leo.headPivot.rotation.x = -0.2;
} });
// "In total darkness, shadows don't need us anymore" / "They're free forever"
const tDark = W('in', 74.9), tFree = W("they're", 77.5);
S(tDark, { light: 'plant', c: [600, 0, -10], cam: [[600, 3, 20], [600, 3.5, 17], [600, 8, -18]], fov: 60, act(t) { crowdCheer.visible = true; crowdCheer.position.y = hop(t, 2.2) * 0.8; spin(t); } });
S(tFree, { light: 'plant', c: [600, 0, 10], cam: [[600, 5.0, 13.6], [600, 4.95, 13.0], [600, 4.7, 9]], fov: 40, dof: [4.4, 0.03], act() {
  put(sh, 600, 0, 9, 0); pose(sh, 'crossArms'); setFace(sh, 'glow_evil'); crowdCheer.visible = true;
} });
// "20 seconds"
const t20 = W('20', 78.9);
S(t20, { light: 'plant', c: [600, 0, -30], cam: [[600, 27.5, -14], [600, 27.2, -16.5], [600, 25, -44]], fov: 46, act(t) { PLI.screen.draw(20, Math.floor(t * 4) % 2 === 0); } });
// "I ran for the big red button," / "but my own shadow stepped in front of it"
const tRan = W('i', 79.8), tStep = W('but', 81);
S(tRan, { light: 'plant', c: [600, 0, 10], cam: [[606, 3.2, 26], [604, 3.4, 16], [600, 3, 6]], fov: 52, act(t) {
  const u = clamp01((t - tRan) / 1.6);
  put(leo, 600 + Math.sin(u * 3) * 0.6, 0, lerp(28, 12, u), Math.PI); run(leo.av, t); setFace(leo, 'determined');
  crowdCheer.visible = true;
} });
S(tStep, { light: 'plant', c: [600, 0, 6], cam: [[609.5, 4.6, 11.5], [609, 4.5, 11.0], [600.1, 3.8, 8.4]], fov: 52, dof: [9.6, 0.007], act(t) {
  const u = clamp01((t - tStep) / 0.6);
  put(leo, 600.2, 0, 11, Math.PI); pose(leo, 'reach', 'flinch', u * 0.4); setFace(leo, u > 0.5 ? 'shock' : 'determined');
  put(sh, lerp(604, 600, smooth(u)), 0, 6.3, 0); pose(sh, 'idle', 'armsOut', smooth(u)); setFace(sh, 'glow_evil');
} });
// "10 seconds"
const t10 = W('10', 83.3);
S(t10, { light: 'plant', c: [600, 0, -30], cam: [[600, 27.5, -14], [600, 27.2, -16.5], [600, 25, -44]], fov: 46, act() { PLI.screen.draw(10, true); } });
// "For once, I wasn't scared"
const tOnce = W('for', 84.3);
S(tOnce, { light: 'plant', c: [600, 0, 10], cam: [[600.4, 5.2, 7.0], [600.4, 5.1, 7.8], [600.2, 4.8, 11]], fov: 40, dof: [3.4, 0.03], act(t) {
  put(leo, 600.2, 0, 11, Math.PI); pose(leo, 'idle'); talkFace(leo, WORDS, t, 'determined_talk', 'determined');
} });
// "I ran straight through him" / "and slammed the button"
const tThrough = W('i', 85.6), tSlam = W('slammed', 86.5);
S(tThrough, { light: 'plant', c: [600, 0, 6], cam: [[608, 3.6, 8], [607, 3.6, 7], [600, 3.4, 5]], fov: 52, act(t) {
  const u = clamp01((t - tThrough) / (tSlam - tThrough));
  put(leo, 600, 0, lerp(11, 4.2, u), Math.PI); run(leo.av, t, 3); setFace(leo, 'determined');
  if (u < 0.45) { put(sh, 600, 0, 6.3, 0); pose(sh, 'armsOut'); setFace(sh, 'glow_evil'); }
  else shards.forEach((s, i) => { s.visible = true; const k = (u - 0.45) * 2.2; s.position.set(600 + Math.sin(i * 2.4) * k * 6, 1 + (i % 6) * 0.8 + k * 3 * Math.cos(i), 6.3 + Math.cos(i * 1.7) * k * 6); s.rotation.set(i + k * 5, i * 2 + k * 4, 0); });
} });
S(tSlam, { light: 'plant', c: [600, 0, 2], cam: [[605.8, 4.9, 4.2], [605.3, 4.8, 3.9], [600, 3.8, 3.2]], fov: 50, act(t) {
  const u = clamp01((t - tSlam) / 0.35);
  put(leo, 600, 0, 4.6, Math.PI); pose(leo, 'reach', 'slam', u); setFace(leo, 'determined');
  PLI.btn.position.y = 3.7 - 0.35 * smooth(u); PLI.btn.material.emissiveIntensity = 0.6 + u * 4;
  grade.uniforms.flash.value = clamp01((t - tSlam - 0.5) / 0.5);
} });
// "Every light in the city blasted on at once," / "and every shadow snapped back to its owner"
const tCity = W('every', 88.3), tSnap = W('and', 90);
S(tCity, { light: 'night', c: [0, 0, -40], cam: [[0, 30, 30], [0, 27, 20], [0, 8, -110]], fov: 46, act(t) {
  const on = clamp01((t - tCity - 0.25) / 0.2);
  setWindows(on * 1.4); setLamps(0.2 + on * 2.5);
  grade.uniforms.flash.value = Math.max(0, 1 - (t - tCity) / 0.4) * 0.9;
} });
S(tSnap, { light: 'night', c: [0, 0, -20], cam: [[0, 4.6, -3], [0, 4.4, -5], [0, 2.4, -24]], fov: 56, act(t) {
  setWindows(1.4); setLamps(2.7);
  const spots = [[-7, -10], [7.2, -14], [-6.5, -20], [7.5, -26], [-7.5, -30], [6.8, -34]];
  folk.forEach((f, i) => { const [x, z] = spots[i]; put(f, x, SIDE, z, i % 2 ? -Math.PI / 2 : Math.PI / 2); pose(f, 'idle', 'flinch', 0.4); setFace(f, 'shock'); });
  folkSh.forEach((s, i) => {
    const [x, z] = spots[i]; const u = smooth((t - tSnap - i * 0.12) / 0.5);
    put(s, lerp(x + (i % 2 ? -4 : 4), x, u), SIDE + 0.01, lerp(z - 4, z - 0.6, u), Math.PI, 1 - u); pose(s, u < 1 ? 'flinch' : 'idle'); setFace(s, 'glow');
  });
} });
// "The town went crazy"
const tCrazy = W('the', 92.6);
S(tCrazy, { light: 'morning', c: [0, 0, -10], cam: [[0, 4.5, 8], [0, 5.5, 4], [0, 4, -12]], fov: 52, act(t) {
  const spots = [[-3, -8], [3, -9], [-1, -12], [2, -14], [-4, -14], [4.5, -12]];
  folk.forEach((f, i) => { const [x, z] = spots[i]; put(f, x, hop(t + i * 0.2, 2.4), z, 0.2 * (i - 2.5)); pose(f, 'cheer'); setFace(f, 'happy'); f.av.armL.rotation.z = -0.3 - 0.3 * Math.sin(t * 9 + i); });
  put(leo, 0.5, hop(t, 2.4), -5.5, 0); pose(leo, 'cheer'); setFace(leo, 'happy');
  lie(sh, 0.5, -6.1, Math.PI, 0); // his shadow is back on the ground
  confetti.visible = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 260; i++) { const a = (t * 0.25 + i * 0.0137) % 1; q.setFromEuler(new THREE.Euler(t * 3 + i, t * 2 + i * 0.5, i)); m.compose(new THREE.Vector3(-8 + (i * 7.31) % 16, 14 - a * 14, -16 + (i * 3.17) % 14), q, new THREE.Vector3(1, 1, 1)); confetti.setMatrixAt(i, m); }
  confetti.instanceMatrix.needsUpdate = true;
} });
// "The new girl even said yes again" / "To me this time"
const tAgain = W('the', 94), tMe = W('to', 95.6);
S(tAgain, { light: 'day', c: [-85, 0, 62], cam: [[-78.4, 4.8, 55.6], [-78.9, 4.7, 56.2], [-86.3, 4.0, 59]], fov: 48, dof: [8.4, 0.01], act(t) {
  put(mia, -88, 0, 58, Math.PI / 2 - 0.3); pose(mia, 'shy'); setFace(mia, 'love');
  put(leo, -84.6, 0, 60, -Math.PI / 2 - 0.6); pose(leo, 'offer'); setFace(leo, 'blush'); hold(ticket, leo.handR, [0, -0.2, 0.6], [-Math.PI / 2, 0, 0]);
  hearts.forEach((h, i) => { h.visible = true; const a = (t * 0.8 + i * 0.2) % 1; h.position.set(-86.3 + Math.sin(i * 2) * 2, 5.8 + a * 3, 59 + Math.cos(i * 2) * 0.6); h.lookAt(camera.position); h.scale.setScalar(0.6 + a * 0.5); });
} });
S(tMe, { light: 'day', c: [-85, 0, 62], cam: [[-87.8, 5.0, 62.2], [-87.4, 4.95, 62.0], [-84.6, 4.7, 60]], fov: 40, dof: [3.6, 0.025], act() {
  put(leo, -84.6, 0, 60, -Math.PI / 2 + 0.5); pose(leo, 'shy'); setFace(leo, 'blush');
} });
// "But that night, when I turned off my lamp," / "my shadow didn't follow me to bed"
const tLamp = W('but', 97), tFollow = W('my', 98.8);
S(tLamp, { light: 'indoorNight', c: [1000, 0, 0], cam: [[1002.8, 5.6, 1.6], [1002.3, 5.4, 1.0], [997.6, 2.9, -3.2]], fov: 52, dof: [7.4, 0.008], act(t) {
  BR.win.visible = false; BR.winNight.visible = true;
  const off = t > tLamp + 1.1;
  BR.lampLight.intensity = off ? 0 : 25; BR.shade.material.emissiveIntensity = off ? 0.02 : 0.8;
  put(leo, 996.5, 2.45, -0.3, 0, 0); leo.tilt.rotation.x = -Math.PI / 2 + 0.15; pose(leo, 'reach'); leo.av.armR.rotation.set(-1.2, 0, -0.9); setFace(leo, 'smile');
} });
S(tFollow, { light: 'indoorNight', c: [1000, 0, 0], cam: [[1006, 6, 6], [1005.4, 5.8, 5.2], [999, 3, -2]], fov: 52, act() {
  nightRoom();
  put(leo, 996.5, 2.45, -0.3, 0, 0); leo.tilt.rotation.x = -Math.PI / 2; pose(leo, 'idle'); setFace(leo, 'sleepy');
  put(sh, 1001, 0, -1, -Math.PI / 2 - 0.4); pose(sh, 'idle'); setFace(sh, 'glow');
} });
// "It walked to my door, stepped outside," / "and locked it" / "From the outside."
const tDoor = W('it', 101), tLock = W('and', 102.6), tOutside = W('from', 104);
S(tDoor, { light: 'indoorNight', c: [1000, 0, 0], cam: [[998, 5, 6.5], [998.6, 5, 6], [1006, 3.5, 1.5]], fov: 50, act(t) {
  nightRoom();
  const u = clamp01((t - tDoor) / (tLock - tDoor));
  BR.hinge.rotation.y = -1.6 * smooth(u / 0.4);
  put(sh, lerp(1001, 1009.5, u), 0, lerp(-1, 1.5, u), Math.PI / 2 - 0.4 * (1 - u)); walk(sh.av, t, 1.4); setFace(sh, 'glow');
} });
S(tLock, { light: 'indoorNight', c: [1000, 0, 0], cam: [[1004.2, 4.4, 3.2], [1004.6, 4.3, 3.0], [1007.6, 3.7, 0.4]], fov: 42, lookObj: () => BR.lock, dof: [3.8, 0.02], act(t) {
  nightRoom();
  const u = clamp01((t - tLock) / 0.6);
  BR.hinge.rotation.y = -1.2 * (1 - smooth(u / 0.5));
  BR.lock.rotation.z = (Math.PI / 2) * smooth((u - 0.6) / 0.3);
} });
S(tOutside, { light: 'indoorNight', c: [1000, 0, 0], cam: [[996.5, 7.8, -3.4], [996.5, 7.1, -3.8], [996.5, 2.9, -5.3]], fov: 40, dof: [4.2, 0.03], act() {
  nightRoom();
  put(leo, 996.5, 2.45, -0.3, 0, 0); leo.tilt.rotation.x = -Math.PI / 2 + 0.25; pose(leo, 'idle'); setFace(leo, 'shock');
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
  s.act(t, k);
  const [from, to, look, lookTo] = s.cam;
  camera.position.set(...from.map((v, j) => lerp(v, to[j], k)));
  camera.fov = s.fov || 45; camera.updateProjectionMatrix();
  if (s.lookObj) { s.lookObj().updateWorldMatrix(true, false); camera.lookAt(s.lookObj().getWorldPosition(new THREE.Vector3())); }
  else camera.lookAt(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  if (s.cctv) {
    grade.uniforms.cctv.value = 1; grade.uniforms.time.value = t; hudMesh.visible = true; hud.draw(t - s.t);
    const d = 0.5, hh = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    hudMesh.position.set(0, 0, -d); hudMesh.scale.set(hh * camera.aspect, hh, 1);
  }
  // lights at intensity 0 still cost a shader term on every surface: hide them entirely
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (s.dof) { bokeh.enabled = true; bokeh.uniforms.focus.value = s.dof[0]; bokeh.uniforms.aperture.value = s.dof[1]; bokeh.uniforms.maxblur.value = 0.02; }
  else bokeh.enabled = false;
  composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.READY = true;
const NAMES = ['leo', 'shadow', 'mia', 'cop', 'cop2', 'tapeGuy', 'tapeShadow', 'baker', 'bakerShadow', ...FOLK_LOOKS.map((_, i) => 'folk' + i), ...FOLK_LOOKS.map((_, i) => 'folkShadow' + i)];
window.QA = { scene, camera, THREE, actors: actors.map((a, i) => ({ name: NAMES[i] || 'actor' + i, wrap: a.wrap, head: a.head })) };
