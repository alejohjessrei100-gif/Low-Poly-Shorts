// Episode 05 "No Phones Till 18" (36.8 s). Farm town Pigeon Creek, built in METRES with CC0 Kenney blocky characters
// (kids 1.3-1.4 m, grown-ups 1.7-1.8 m) and CC0 vehicles/trees. House rules: 30-45 s, debate-bait hook, Blender look,
// no blur, steady faces, mostly wide shots, detailed set with ambient life, clip-checked + autofixed.
import { createCore, smooth, lerp, clamp01, canvasTex } from '../../kit/core.js';
import { buildFarm, plantTrees, storm, pigeon, walkie, paperMap, TIME, WIND, FRONT, SWY } from '../../kit/farm.js';
import { character, prop, preload, skinTools as ST } from '../../kit/assets.js';
import { smoke, flags, rings } from '../../kit/life.js';
import * as P from '../../kit/props.js';
import { loadFixes, setShot, offsetActor, applyCamera } from '../../kit/autofix-runtime.js';

await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: window.LOOK || 'blender' });
const { THREE, scene, camera, composer, grade, setLight } = C;
scene.add(camera);
camera.near = 0.1; camera.far = 900;

const WORDS = (await (await fetch(new URL('./words.json', import.meta.url))).json()).words;
const END = WORDS[WORDS.length - 1][1] + 0.45;
await loadFixes(new URL('./autofix.json', import.meta.url));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (word, after = 0) => { const w = WORDS.find(([s, , x]) => s >= after - 0.01 && norm(x) === word); if (!w) throw new Error('word ' + word + ' after ' + after); return w[0]; };
const CUT = (t) => Math.max(0, t - 2 / 60);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- world + life
const F = buildFarm(scene);
await preload(['tree_oak', 'tree_autumn', 'tree_fat', 'tree_pine', 'truck', 'truck_flat', 'tractor', 'sedan', 'suv', 'van', 'apple', 'watermelon', 'pumpkin', 'carrot', 'crate', 'barrel']);
await plantTrees(scene, prop);
const SMOKE = smoke(scene, F.chimneys, 4);
const FLAG = flags(scene, [[9.4, 0, -18.2, 11]], [0x2f6a3a]);
const STORM = storm(scene);
const RINGS = rings(scene, 4, 0x3eff8b);
// parked vehicles and a pickup that drives through town
for (const [m, x, z, ry, len] of [['tractor', 3.5, 8.5, Math.PI, 3.8], ['sedan', 3.9, -3.5, Math.PI, 4.6], ['suv', 3.9, -45.5, Math.PI, 4.8], ['van', 3.9, -63, Math.PI, 5], ['truck_flat', -3.9, -60, 0, 6], ['sedan', 3.9, -69.5, Math.PI, 4.6]]) { const c = await prop(scene, m, len); c.position.set(x, 0, z); c.rotation.y = ry; }
const pickup = await prop(scene, 'truck', 5.4); pickup.position.set(-3.7, 0, -17.5); // the kids' map table (hood toward +z)
const mover = await prop(scene, 'truck', 5.4); // drives through town
// produce stand in front of the grocery
{ const st = new THREE.Group(); scene.add(st); st.position.set(-6.9, SWY, -19.5);
  for (const [k, m, n] of [[0, 'apple', 0.11], [1, 'watermelon', 0.32], [2, 'pumpkin', 0.36]]) { P.box(0.9, 0.5, 0.7, P.std(0x9a6a3a), 0, 0.55, -k * 1.0, st); P.box(0.9, 0.05, 0.75, P.std(0x6a4a2a), 0, 0.82, -k * 1.0, st); for (let i = 0; i < (m === 'apple' ? 8 : 3); i++) { const o = await prop(st, m, n); o.position.set(-0.25 + (i % 4) * 0.17 + (m === 'apple' ? 0 : (i % 3) * 0.08), 0.85, -k * 1.0 - 0.2 + Math.floor(i / 4) * 0.3 + (m === 'apple' ? 0 : (i % 3) * 0.12)); } }
  for (const [x, z] of [[0.2, -3.0], [0.5, -3.6]]) { const o = await prop(st, 'crate', 0.6); o.position.set(x, 0, z); }
  const sb = P.sign(st, ['FRESH', 'PRODUCE'], 0.48, 1.3, -1.0, Math.PI / 2, 1.2, 0.5, { bg: '#fbf6e8', fg: '#2f7a3a' }); }
for (const [x, z] of [[7.2, 5.5], [7.0, 4.6], [6.9, 6.4]]) { const o = await prop(scene, 'barrel', 0.7, { by: 'height' }); o.position.set(x, SWY, z); }

// entrance sign faces: before / after
const signTex = (after) => canvasTex(1024, 416, (g, w, h) => {
  g.fillStyle = '#f4ead2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a4a2a'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#6a4a2a'; g.textAlign = 'center'; g.font = '800 44px Poppins'; g.fillText('WELCOME TO', w / 2, 70);
  g.font = '800 104px Poppins'; g.fillStyle = '#2f5a3a'; g.fillText('PIGEON CREEK', w / 2, 168); g.font = '800 34px Poppins'; g.fillStyle = '#6a4a2a'; g.fillText('POP. 812', w / 2, 214);
  g.fillStyle = after ? '#2f8a4a' : '#c8343f'; g.fillRect(24, 246, w - 48, 146);
  // phone icon
  g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(64, 262, 64, 114, 12); g.fill(); g.fillStyle = after ? '#2f8a4a' : '#c8343f'; g.fillRect(72, 276, 48, 80);
  g.lineWidth = 12; g.strokeStyle = '#ffffff';
  if (after) { g.beginPath(); g.moveTo(150, 320); g.lineTo(170, 342); g.lineTo(206, 296); g.stroke(); }
  else { g.beginPath(); g.arc(96, 319, 60, 0, 7); g.moveTo(54, 277); g.lineTo(138, 361); g.stroke(); }
  g.fillStyle = '#ffffff'; const msg = after ? 'PHONES AT 13' : 'NO PHONES UNDER 18'; let fs = 80; do { g.font = `800 ${fs}px Poppins`; fs -= 2; } while (g.measureText(msg).width > w - 260); g.fillText(msg, w / 2 + 80, 346);
});
const SIGN_BEFORE = signTex(false), SIGN_AFTER = signTex(true);
F.sign.face.material.map = SIGN_BEFORE;

// town-hall extras: anti-phone poster, banners, day counter, pigeon-test table
const poster = new THREE.Group(); scene.add(poster); poster.position.set(9.1, SWY, -20.6); poster.rotation.y = -Math.PI / 2 - 0.5;
{ for (const s of [-1, 1]) { const l = P.box(0.05, 1.9, 0.05, P.std(0x6a4a2a), s * 0.55, 0.95, -0.12, poster); l.rotation.x = 0.12; } P.box(0.05, 1.6, 0.05, P.std(0x6a4a2a), 0, 0.8, -0.35, poster).rotation.x = -0.3;
  const t = canvasTex(512, 384, (g, w, h) => { g.fillStyle = '#fbf6e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8343f'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#f2a0b0'; g.beginPath(); g.ellipse(170, 180, 105, 78, 0, 0, 7); g.fill(); g.strokeStyle = '#c8607a'; g.lineWidth = 6; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(110 + i * 30, 170 + (i % 2) * 20, 26, 0.5, 2.6); g.stroke(); }
    g.fillStyle = '#2a2a30'; g.beginPath(); g.roundRect(310, 100, 90, 160, 14); g.fill(); g.fillStyle = '#7ab0d8'; g.fillRect(320, 115, 70, 120); g.strokeStyle = '#c8343f'; g.lineWidth = 8; g.beginPath(); g.moveTo(280, 180); g.lineTo(240, 180); g.stroke();
    g.fillStyle = '#c8343f'; g.font = '800 54px Poppins'; g.textAlign = 'center'; g.fillText('PHONES ROT BRAINS!', w / 2, 340); });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.975), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); b.position.set(0, 1.45, 0); b.rotation.x = -0.12; poster.add(b); }
const bannerTex = (txt, bg, fg) => P.textTex([txt], { w: 1024, h: 200, bg, fg, radius: 8 });
const BAN_KIDS = bannerTex('KIDS IN CHARGE', '#f2c14e', '#2a3a5a'), BAN_TEST = bannerTex('PIGEON TEST TODAY', '#2a3a5a', '#f2c14e');
const banner = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.1), new THREE.MeshStandardMaterial({ map: BAN_KIDS, roughness: 0.8, side: THREE.DoubleSide })); banner.position.set(10.75, 5.4, -25); banner.rotation.y = -Math.PI / 2; scene.add(banner);
let dayN = 1;
const dayScr = P.liveScreen(512, 300, (g, w, h) => { g.fillStyle = '#1e2a24'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a4a'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#ffffff'; g.font = '800 130px Poppins'; g.textAlign = 'center'; g.fillText('DAY ' + dayN, w / 2, 200); });
const dayBoard = new THREE.Group(); scene.add(dayBoard); dayBoard.position.set(7.2, SWY, -20.6); dayBoard.rotation.y = -0.75;
{ for (const s of [-1, 1]) P.box(0.05, 1.7, 0.05, P.std(0x6a4a2a), s * 0.5, 0.85, -0.1, dayBoard).rotation.x = 0.12; const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ map: dayScr.tex })); b.position.set(0, 1.35, 0); b.rotation.x = -0.12; dayBoard.add(b); }
const testSet = new THREE.Group(); scene.add(testSet);
{ P.box(0.7, 0.05, 1.3, P.std(0x8a5a3a), 9.25, SWY + 0.75, -25.2, testSet); for (const [a, b] of [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]]) P.box(0.05, 0.75, 0.05, P.std(0x5a3a2a), 9.25 + a, SWY + 0.375, -25.2 + b, testSet);
  P.box(0.45, 0.04, 0.45, P.std(0x8a5a3a), 8.45, SWY + 0.45, -25.0, testSet); for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) P.box(0.04, 0.45, 0.04, P.std(0x5a3a2a), 8.45 + a, SWY + 0.225, -25.0 + b, testSet); P.box(0.04, 0.5, 0.45, P.std(0x8a5a3a), 8.24, SWY + 0.72, -25.0, testSet);
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.3), new THREE.MeshStandardMaterial({ map: P.textTex(['PIGEON TEST'], { w: 1024, h: 450, bg: '#fbf6e8', fg: '#2a3a5a', border: '#2a3a5a' }) })); tp.position.set(9.25, SWY + 0.58, -24.53); testSet.add(tp);
  P.box(0.21, 0.005, 0.3, P.std(0xffffff), 9.05, SWY + 0.78, -24.95, testSet); P.box(0.21, 0.005, 0.3, P.std(0xf4f0e6), 9.08, SWY + 0.785, -25.3, testSet); }
// cones for the kid traffic cop
const cones = new THREE.Group(); scene.add(cones);
for (const [x, z] of [[0.6, -23.2], [3.4, -23.2], [0.6, -19.8], [3.4, -19.8]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.55, 12), P.std(0xf2783a)); c.position.set(x, 0.28, z); c.castShadow = true; cones.add(c); P.box(0.4, 0.04, 0.4, P.std(0x2a2a30), x, 0.02, z, cones); }

// ---------------------------------------------------------------- cast (Kenney Blocky Characters, CC0; repainted skins)
const actors = [];
async function cast(name, model, h, skin = null) { const c = await character(scene, model, h, { skin }); const a = { name, c, root: c.root, seated: false }; actors.push(a); return a; }
const theoSkin = (g) => { // blocky_c without the mustache: a 12-year-old with a ginger mop and a grin
  const skin = ST.sample(g, 140, 170), hair = ST.sample(g, 20, 200);
  ST.rect(g, 158, 210, 70, 28, skin); ST.rect(g, 166, 138, 54, 18, skin);
  g.strokeStyle = '#6a2a1a'; g.lineWidth = 5; g.beginPath(); g.arc(192, 214, 13, 0.2, Math.PI - 0.2); g.stroke();
  ST.rect(g, 128, 0, 128, 128, hair); ST.rect(g, 128, 128, 128, 16, hair); ST.rect(g, 0, 128, 128, 22, hair); ST.rect(g, 256, 128, 256, 22, hair);
  g.fillStyle = hair; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(128 + k * 22, 143); g.lineTo(139 + k * 22, 160); g.lineTo(150 + k * 22, 143); g.fill(); }
};
const shirt = (to) => (g) => { const from = ST.sample(g, 160, 860); ST.recolor(g, 0, 688, 450, 336, from, to, 45); ST.recolor(g, 480, 534, 544, 132, from, to, 45); };
const theo = await cast('theo', 'blocky_c', 1.4, theoSkin);
const maya = await cast('maya', 'blocky_e', 1.32);
const leo = await cast('leo', 'blocky_b', 1.36, shirt('#2a9d8f'));
const zoe = await cast('zoe', 'blocky_f', 1.3);
const mayor = await cast('mayor', 'blocky_q', 1.82);
const dad = await cast('dad', 'blocky_k', 1.78);
const grandpa = await cast('grandpa', 'blocky_i', 1.72);
const grocer = await cast('grocer', 'blocky_a', 1.78);
const farmer = await cast('farmer', 'blocky_m', 1.8);
const mom = await cast('mom', 'blocky_n', 1.7);
const lady = await cast('lady', 'blocky_f', 1.7, shirt('#e8843a'));
const sheriff = await cast('sheriff', 'blocky_j', 1.8);
const KIDS = [theo, maya, leo, zoe], ADULTS = [mayor, dad, grandpa, grocer, farmer, mom, lady, sheriff];
// hats: farmer straw hat, sheriff hat, mayor top hat
function hat(a, build) { const g = new THREE.Group(); build(g); a.c.top.add(g); a.c.top.updateWorldMatrix(true, false); const ws = a.c.top.getWorldScale(new THREE.Vector3()); g.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z); return g; }
hat(farmer, (g) => { P.cyl(0.42, 0.42, 0.03, P.std(0xe8c870), 0, 0.02, 0, g, 20); P.cyl(0.24, 0.27, 0.2, P.std(0xe8c870), 0, 0.13, 0, g, 16); P.cyl(0.275, 0.275, 0.05, P.std(0xc8343f), 0, 0.07, 0, g, 16); });
hat(sheriff, (g) => { P.cyl(0.44, 0.44, 0.03, P.std(0x8a5a3a), 0, 0.02, 0, g, 20); P.box(0.46, 0.22, 0.4, P.std(0x8a5a3a), 0, 0.13, 0, g, 0.06); P.box(0.1, 0.1, 0.02, P.std(0xf2c14e, { metalness: 0.8, roughness: 0.3 }), 0, 0.13, 0.21, g); });
hat(mayor, (g) => { P.cyl(0.36, 0.36, 0.03, P.std(0x1b1b24), 0, 0.02, 0, g, 20); P.cyl(0.24, 0.24, 0.42, P.std(0x1b1b24), 0, 0.23, 0, g, 18); P.cyl(0.245, 0.245, 0.06, P.std(0xc8343f), 0, 0.08, 0, g, 18); });

// props
const props = [];
const keep = (o) => { props.push(o); return o; };
const KEV = pigeon(scene); keep(KEV.g);
const cap = new THREE.Group(); KEV.head.add(cap); P.box(0.15, 0.012, 0.15, P.std(0x1b1b24), 0, 0.075, 0, cap); P.box(0.08, 0.04, 0.08, P.std(0x1b1b24), 0, 0.055, 0, cap); P.box(0.006, 0.05, 0.006, P.std(0xf2c14e), 0.06, 0.05, 0.06, cap);
const walkies = [0, 1, 2].map(() => keep(walkie(scene)));
const zTex = P.textTex(['z'], { w: 128, h: 128, bg: 'rgba(0,0,0,0)', fg: '#ffffff', radius: 0 });
const ZZZ = [0, 1, 2].map(() => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false })); sp.scale.setScalar(0.08); scene.add(sp); return keep(sp); });
function zzz(p, t) { ZZZ.forEach((sp, i) => { const u = ((t * 0.5 + i / 3) % 1); sp.visible = true; sp.position.set(p.x + u * 0.12 + Math.sin(u * 6) * 0.03, p.y + u * 0.35, p.z); sp.material.opacity = Math.sin(u * Math.PI); sp.scale.setScalar(0.05 + u * 0.06); }); }
const MAP = keep(paperMap(scene, 1.0, 0.75)), MAP2 = keep(paperMap(scene, 0.5, 0.38));
const PHONE = (screen) => { const g = new THREE.Group(); scene.add(g); P.box(0.075, 0.15, 0.01, P.std(0x1b1b24), 0, 0, 0, g, 0.006); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.135), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false })); s.position.z = 0.006; g.add(s); return keep(g); };
const appScreen = canvasTex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a7ae8'); gr.addColorStop(1, '#b85ae8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = ['#ffd23e', '#3eff8b', '#ff6a3e', '#ffffff'][i % 4]; g.beginPath(); g.roundRect(12 + (i % 4) * 28, 40 + Math.floor(i / 4) * 34, 20, 20, 5); g.fill(); } });
let spin = 0;
const noSig = P.liveScreen(256, 512, (g, w, h) => {
  g.fillStyle = '#16181f'; g.fillRect(0, 0, w, h); g.textAlign = 'center';
  g.strokeStyle = '#555a66'; g.lineWidth = 8; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(30 + i * 22, 48); g.lineTo(30 + i * 22, 48 - 10 - i * 8); g.stroke(); } g.strokeStyle = '#ff3a3a'; g.lineWidth = 7; g.beginPath(); g.moveTo(22, 20); g.lineTo(104, 54); g.stroke();
  g.fillStyle = '#ff3a3a'; g.font = '800 40px Poppins'; g.fillText('NO SIGNAL', w / 2, 150);
  g.fillStyle = '#2a2e3a'; g.beginPath(); g.roundRect(20, 190, w - 40, 120, 18); g.fill(); g.fillStyle = '#c8ccd8'; g.font = '800 26px Poppins'; g.fillText('MAPS', w / 2, 228); g.strokeStyle = '#7ab0d8'; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, 270, 22, spin, spin + 4.4); g.stroke();
  g.fillStyle = '#2a2e3a'; g.beginPath(); g.roundRect(20, 330, w - 40, 120, 18); g.fill(); g.fillStyle = '#c8ccd8'; g.font = '800 26px Poppins'; g.fillText('MESSAGES', w / 2, 370); g.fillStyle = '#ff3a3a'; g.font = '800 24px Poppins'; g.fillText('NOT DELIVERED', w / 2, 415);
});
const phones = ADULTS.map(() => PHONE(appScreen));
const bigPhone = PHONE(noSig.tex);
{ const hand = new THREE.Group(); bigPhone.add(hand); const sk = P.std(0x8a5a3a), suit = P.std(0x1b1b24); // a blocky hand + suit sleeve for the insert shot
  P.box(0.1, 0.1, 0.03, sk, 0.0, -0.05, -0.022, hand); P.box(0.03, 0.05, 0.03, sk, 0.05, -0.02, 0.008, hand); P.box(0.125, 0.3, 0.125, suit, 0.02, -0.24, -0.07, hand).rotation.x = 0.5; P.box(0.13, 0.04, 0.13, P.std(0xf4f4f4), 0.02, -0.1, -0.035, hand).rotation.x = 0.5; }
const megaphone = keep(new THREE.Group()); scene.add(megaphone);
{ const m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.04, 0.32, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2f2f4, side: THREE.DoubleSide })); m.rotation.x = Math.PI / 2; m.position.z = 0.16; megaphone.add(m); P.box(0.04, 0.12, 0.05, P.std(0xc8343f), 0, -0.07, 0.05, megaphone); }
const mailbag = keep(new THREE.Group()); scene.add(mailbag); P.box(0.36, 0.28, 0.14, P.std(0x6a4a2a), 0, 0, 0, mailbag, 0.03); { for (let k = 0; k < 4; k++) P.box(0.2, 0.005, 0.12, P.std(0xfbf6e8), -0.05 + k * 0.03, 0.15, 0, mailbag); }
const pencil = keep(P.box(0.012, 0.012, 0.15, P.std(0xf2c14e), 0, 0, 0, scene));
const flashlight = keep(new THREE.Group()); scene.add(flashlight);
{ P.cyl(0.025, 0.03, 0.2, P.std(0x2a2a30), 0, 0, 0, flashlight, 10).rotation.x = Math.PI / 2; const beam = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.2, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.12, depthWrite: false })); beam.rotation.x = -Math.PI / 2; beam.position.z = 1.7; flashlight.add(beam); }
const fill = new THREE.PointLight(0xfff4e8, 0, 24, 1.2); fill.position.set(0, 0.4, 0); camera.add(fill);

// ---------------------------------------------------------------- helpers
function hideAll() {
  for (const a of actors) { a.root.visible = false; a.root.position.set(0, -80, 0); a.seated = false; }
  for (const p of props) p.visible = false;
  KEV.note.visible = false; cap.visible = false; mover.visible = false; pickup.visible = true;
  STORM.hide(); grade.uniforms.flash.value = 0; RINGS.hide();
  banner.visible = false; dayBoard.visible = false; testSet.visible = false; cones.visible = false; poster.visible = true;
  F.sign.face.material.map = SIGN_BEFORE;
}
function put(a, x, y, z, yaw = 0) { a.root.visible = true; a.root.position.set(x, y, z); offsetActor(a.name, a.root.position); a.root.rotation.set(0, yaw, 0); a.seated = false; }
const anim = (a, clip, t, o) => a.c.pose(clip, t, null, 0, 0, o);
const toward = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const v3 = (a) => new THREE.Vector3(...a);
function hold(obj, anchor, pos = [0, 0, 0], rot = [0, 0, 0]) {
  obj.visible = true; anchor.updateWorldMatrix(true, false);
  const q = anchor.getWorldQuaternion(new THREE.Quaternion());
  obj.position.copy(anchor.getWorldPosition(new THREE.Vector3())).add(v3(pos).applyQuaternion(q));
  obj.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
}
const place = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.visible = true; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };
/** phone held up in front of the face, screen toward the eyes; head tilted down to stare at it */
function staring(a, t, k, i = 0) { anim(a, 'holding-right', t + i * 0.3); a.c.tiltHead(0.38); hold(phones[k], a.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]); }
// background townsfolk who walk the sidewalks on sunny shots
function strollers(t, who = [grocer, mom, grandpa, farmer]) {
  [[6.4, 1], [-6.5, -1], [7.1, -1], [-7.0, 1]].slice(0, who.length).forEach(([x, d], i) => {
    const a = who[i], z = 6 - ((t * 1.2 * (0.85 + i * 0.08) + i * 17) % 76);
    put(a, x, SWY, d > 0 ? z : -70 - z, d > 0 ? Math.PI : 0); anim(a, 'walk', t * (0.9 + i * 0.07) + i * 0.3);
  });
}
function drive(t, z0, speed = 7) { mover.visible = true; const z = z0 - t * speed; mover.position.set(2.3, 0, z); mover.rotation.y = Math.PI; }
function kevinPerch(x, y, z, yaw, t, tired = 0.75) { KEV.g.visible = true; KEV.g.position.set(x, y, z); KEV.g.rotation.set(0, yaw, 0); KEV.set(tired); KEV.fold(); KEV.head.rotation.x = Math.max(0, Math.sin(t * 1.3)) * 0.35; KEV.body.rotation.x = 0; }
function life(t, s) {
  TIME.value = t; WIND.value = s.storm ? 1.6 : 0.35;
  F.fan.rotation.z = t * (s.storm ? 7 : 2.2);
  const down = t > T_STRIKE ? 1 : 0; F.towers.forEach((tw, i) => tw.update(t, down, t > T_STRIKE && t < T_STRIKE + 1.6 ? t - T_STRIKE : 0));
  SMOKE.update(t); FLAG.update(t * (s.storm ? 2 : 1));
  if (s.storm) { STORM.clouds.visible = true; STORM.rain(t, camera.position, s.rain ?? 1); }
}

// ---------------------------------------------------------------- shots
const SHOTS = [];
const S = (t, o) => SHOTS.push({ t: CUT(t), ...o });
const SUN = { light: 'morning' }, DAY = { light: 'day' }, STM = { light: 'storm', storm: true };
const T_STRIKE = W('knocked', 16.5) + 0.05;

// 0 "In this town," aerial over the fields into Pigeon Creek
S(0, { ...SUN, c: [0, 0, -20], cam: [[20, 30, 64], [15, 26, 52], [-2, 3, -30]], fov: 55, act(t) { drive(t, 40); strollers(t); kevinPerch(0, -50, 0, 0, t); KEV.g.visible = false; } });
// 1 "nobody gets a phone until they turn 18." the welcome sign; two kids walk past it into town
S(W('nobody', 0.9), { ...SUN, c: [6, 0, 24], cam: [[3.2, 1.75, 34.5], [3.6, 1.85, 33.2], [7.4, 1.9, 24.4]], fov: 55, act(t) {
  const u = clamp01((t - 0.9) / 2.4);
  put(theo, lerp(5.4, 5.6, u), 0, lerp(30.5, 27.2, u), Math.PI); anim(theo, 'walk', t * 0.75); hold(walkies[0], theo.c.handR, [0, -0.06, 0.04], [0, 0, 0]);
  put(maya, lerp(6.3, 6.5, u), 0, lerp(31.2, 27.9, u), Math.PI); anim(maya, 'walk', t * 0.75 + 0.3);
} });
// 2 "You see, the grownups say phones rot kids' brains." the mayor lectures from the town hall porch
S(W('you', 3.1), { ...SUN, c: [9, 0, -24], cam: [[2.6, 2.6, -15.5], [2.9, 2.5, -16.6], [10, 1.8, -24.6]], fov: 55, act(t) {
  put(mayor, 11.3, 0.75, -25, -Math.PI / 2); anim(mayor, 'interact-right', t * 0.9);
  [[8.3, -22.8, maya], [8.0, -24.2, theo], [8.4, -25.8, leo], [8.1, -27.2, zoe]].forEach(([x, z, a], i) => { put(a, x, SWY, z, toward(x, z, 11.3, -25)); anim(a, i % 2 ? 'emote-no' : 'idle', t + i * 0.4); });
  [[6.6, -22.2, dad], [6.4, -26.4, mom], [6.9, -28.4, grandpa]].forEach(([x, z, a], i) => { put(a, x, SWY, z, toward(x, z, 11.3, -25)); anim(a, 'emote-yes', t * 0.8 + i * 0.3); });
} });
// 3 "My name is Theo, and I'm 12." medium: Theo outside the diner, walkie on his hand, a proud nod
const t12 = W('12', 7.4);
S(W('my', 6.3), { ...SUN, c: [-6, 0, 0], cam: [[-2.2, 1.35, -0.4], [-2.5, 1.35, -1.0], [-6.4, 0.95, -4.6]], fov: 50, act(t) {
  put(theo, -6.4, SWY, -4.6, toward(-6.4, -4.6, -2.3, -0.7)); anim(theo, t > t12 - 0.15 ? 'emote-yes' : 'holding-right', t); hold(walkies[0], theo.c.handR, [0, -0.06, 0.04], [0, 0, 0]);
  strollers(t, [grocer, mom]);
} });
// 4 "So we use walkie-talkies," Theo and Maya talk across the street (signal rings)
const tWalk = W('walkietalkies', 8.5);
S(W('so', 8.2), { ...SUN, c: [-6, 0, -18], cam: [[-3.95, 1.45, -4.4], [-4.05, 1.5, -5.1], [-6.3, 1.1, -22]], fov: 52, act(t) {
  put(theo, -5.6, SWY, -9.4, toward(-5.6, -9.4, -4.0, -4.6) - 0.6); anim(theo, 'interact-right', 0.25, { once: true }); hold(walkies[0], theo.c.handR, [0, -0.04, 0.05], [-0.4, 0, 0]);
  put(maya, -6.7, SWY, -24.5, toward(-6.7, -24.5, -4.0, -4.6)); anim(maya, 'interact-right', 0.25, { once: true }); hold(walkies[1], maya.c.handR, [0, -0.04, 0.05], [-0.4, 0, 0]);
  RINGS.update(t - tWalk, V3(-5.7, 1.2, -10.2), V3(-6.7, 1.2, -23.8), { size: 0.9, dur: 1.2, gap: 0.25, opacity: 0.75 });
} });
// 5 "paper maps," kids spread a map on the pickup's hood
S(W('paper', 9.5), { ...SUN, c: [-4, 0, -16], cam: [[0.3, 3.4, -9.6], [0.0, 3.3, -10.4], [-3.7, 1.0, -15.6]], fov: 52, act(t) {
  place(MAP, -3.7, 1.5, -15.2, -Math.PI / 2 + 0.12, 0, 0.15);
  [[-2.2, -15.5, theo, 'interact-right'], [-3.5, -13.7, leo, 'interact-left'], [-5.35, -15.2, zoe, 'interact-right']].forEach(([x, z, a, cl], i) => { put(a, x, x < -5 ? SWY : 0, z, toward(x, z, -3.7, -15.3)); anim(a, cl, 0.3 + Math.sin(t * 2 + i) * 0.1, { once: true }); a.c.tiltHead(0.35); });
} });
// 6 "and one very tired pigeon named Kevin." close-up 1 of 2: Kevin dozing on the fire hydrant
const tKevin = W('kevin', 11.5);
S(W('and', 10.4), { ...SUN, c: [-5.5, 0, -12.5], cam: [[-6.45, 1.22, -11.7], [-6.4, 1.2, -11.8], [-5.48, 0.98, -12.5]], fov: 42, act(t) {
  kevinPerch(-5.5, SWY + 0.69, -12.5, toward(-5.5, -12.5, -6.45, -11.7) - 0.35, t, t > tKevin ? 0.95 : 0.75);
  KEV.head.rotation.x = 0.25 + Math.sin(t * 0.9) * 0.15; KEV.head.updateWorldMatrix(true, false); zzz(KEV.head.getWorldPosition(new THREE.Vector3()).add(V3(0, 0.1, 0)), t);
} });
// 7 "Meanwhile, the grownups stare at their phones all day." the whole street, heads down
const tBonk = W('phones', 14.2) + 0.1;
S(W('meanwhile', 12.6), { ...SUN, c: [0, 0, -46], cam: [[0.5, 2.5, -30.6], [0.5, 2.6, -32.2], [0, 1.0, -48]], fov: 55, act(t) {
  // two grown-ups walk into each other, eyes on their phones; everyone else just stares
  const u = clamp01((t - 12.9) / (tBonk - 12.9)), bonk = t > tBonk ? Math.exp(-(t - tBonk) * 4) : 0;
  put(dad, -0.55, 0, lerp(-39.6, -42.75, u) + bonk * 0.3, Math.PI); put(grocer, -0.45, 0, lerp(-46.6, -43.45, u) - bonk * 0.3, 0);
  for (const [a, k] of [[dad, 1], [grocer, 3]]) { if (t < tBonk) { anim(a, 'walk', t * 0.7 + k); a.c.tiltHead(0.38); } else anim(a, 'emote-no', t - tBonk + k * 0.1); hold(phones[k], a.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]); }
  put(mom, 2.6, 0, -40.8, -0.6); staring(mom, t, 5, 1);
  put(lady, 3.2, 0, -48.6, 0.4); staring(lady, t, 6, 2);
  put(grandpa, -2.9, 0, -47.2, 2.4); staring(grandpa, t, 2, 3);
  put(mayor, -3.1, 0, -39.4, 0.9); staring(mayor, t, 0, 4);
  put(sheriff, 1.4, 0, -53.0, Math.PI + 0.3); staring(sheriff, t, 7, 5);
  put(farmer, -7.45, SWY + 0.02, -54, Math.PI / 2); farmer.seated = true; farmer.c.poseArms('sit', 0, 'holding-right', 0); farmer.c.tiltHead(0.38); hold(phones[4], farmer.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]);
} });
// 8 "Then a giant storm" clouds roll over the fields, the corn bends, a far flash
S(W('then', 15.5), { ...STM, c: [30, 0, -60], cam: [[40, 4.6, -127], [39, 5.4, -123], [34, 13, -40]], fov: 58, act(t) {
  const f = t > 16.25 && t < 16.4 ? 0.7 : 0; grade.uniforms.flash.value = f; STORM.bolt(V3(-40, 75, -10), V3(-34, 0, -30), f > 0, 3);
} });
// 9 "knocked out every phone tower in town." lightning hits the cell tower
S(W('knocked', 16.6) - 0.35, { ...STM, c: [40, 0, -30], cam: [[27, 2.2, -12], [27.6, 2.6, -13.4], [44, 17, -36]], fov: 58, act(t) {
  const d = t - T_STRIKE, on = (d > 0 && d < 0.22) || (d > 0.32 && d < 0.42);
  grade.uniforms.flash.value = on ? 0.85 * (1 - (d % 0.32) / 0.32) : 0;
  STORM.bolt(V3(54, 95, -52), F.towers[0].top, on, 7);
} });
// 10 "No maps, no messages." close-up 2 of 2: over the mayor's shoulder, his phone
S(W('no', 18.9), { ...STM, rain: 0.8, c: [6.5, 0, -40], cam: [[6.5, 1.55, -40.0], [6.5, 1.55, -40.0], [6.5, 1.12, -40.36]], fov: 46, act(t) {
  spin = t * 6; noSig.draw();
  // insert: the mayor's view of his own dead phone (his body is hidden; his hand and sleeve hold it)
  const cam = V3(6.5, 1.55 + Math.sin(t * 1.3) * 0.004, -40.0); bigPhone.visible = true; bigPhone.position.set(6.5 + Math.sin(t * 2.1) * 0.006, 1.2, -40.32); bigPhone.lookAt(cam); bigPhone.rotateZ(0.08);
}, pov() { return [V3(6.5, 1.55, -40.0), bigPhone.position.clone()]; } });
// 11 "The grownups couldn't even find the grocery store." lost in the rain right in front of it
S(W('the', 20.6), { ...STM, rain: 0.9, c: [-5, 0, -22], cam: [[3.8, 2.5, -11.8], [3.5, 2.6, -12.8], [-7, 1.7, -23.5]], fov: 55, act(t) {
  pickup.visible = false;
  const a1 = t * 1.4; put(dad, -3.6 + Math.cos(a1) * 1.4, 0, -21 + Math.sin(a1) * 1.4, -a1); anim(dad, 'walk', t * 0.8); dad.c.tiltHead(0.38); hold(phones[1], dad.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]);
  const u = clamp01((t - 20.8) / 1.0); put(grandpa, lerp(-5.4, -7.35, u), u > 0.2 ? SWY : 0, -26.2, -Math.PI / 2); anim(grandpa, u < 1 ? 'walk' : 'emote-no', t * 0.8); hold(phones[2], grandpa.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]);
  put(grocer, -6.6, SWY, -21.6, Math.sin(t * 2) * 1.2 + Math.PI / 2); anim(grocer, 'holding-right', t); grocer.c.tiltHead(0.1, Math.sin(t * 3) * 0.5); hold(phones[3], grocer.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]);
  put(farmer, -1.6, 0, -18.5 - (t - 20.6) * 1.1, Math.PI); anim(farmer, 'walk', t * 0.8); farmer.c.tiltHead(0.38); hold(phones[4], farmer.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]);
  put(lady, -2.0, 0, -25.4, t * 2.2); staring(lady, t, 6);
} });
// 12 "That's when I noticed something strange." Theo, dry under the diner awning, watching
S(W("that's", 22.8), { ...STM, rain: 0.9, c: [-6, 0, 2], cam: [[-2.6, 1.5, 8.2], [-2.9, 1.48, 7.4], [-6.6, 1.05, 2.4]], fov: 52, act(t) {
  put(theo, -6.7, SWY, 2.2, toward(-6.7, 2.2, 0, -14)); anim(theo, 'holding-right', t); hold(walkies[0], theo.c.handR, [0, -0.06, 0.04], [0, 0, 0]);
  kevinPerch(-5.55, SWY + 0.92, 0.0, 0.8, t, 0.6);
} });
// 13 "The kids were the only ones who knew how to get anywhere." kids march through the rain with map, walkie, flashlight
const tKids = W('the', 24.8);
S(tKids, { ...STM, rain: 1, c: [-6, 0, -36], cam: [[0.6, 2.0, -28.4], [0.6, 2.0, -29.8], [-6.4, 1.0, -37.5]], fov: 55, act(t) {
  const z0 = -40.0 + (t - tKids) * 1.2;
  put(maya, -6.3, SWY, z0, 0); maya.c.poseArms('walk', t * 0.9, 'holding-both', 0); hold(MAP2, maya.c.handR, [0.16, -0.02, 0.12], [-1.0, 0, 0]);
  put(leo, -7.1, SWY, z0 - 1.3, 0); leo.c.poseArms('walk', t * 0.9 + 0.2, 'holding-right', 0); hold(walkies[2], leo.c.handR, [0, -0.06, 0.04], [0, 0, 0]);
  put(zoe, -6.2, SWY, z0 - 2.6, 0); zoe.c.poseArms('walk', t * 0.9 + 0.4, 'holding-right', 0); hold(flashlight, zoe.c.handR, [0, -0.04, 0.06], [0.2, 0, 0]);
  put(theo, -7.0, SWY, z0 - 3.9, 0); theo.c.poseArms('walk', t * 0.9 + 0.1, 'holding-right', 0); hold(walkies[0], theo.c.handR, [0, -0.06, 0.04], [0, 0, 0]);
  const a1 = t * 1.4; put(dad, -1.8 + Math.cos(a1) * 1.4, 0, -40 + Math.sin(a1) * 1.4, -a1); anim(dad, 'walk', t * 0.8); dad.c.tiltHead(0.38); hold(phones[1], dad.c.handR, [0, -0.03, 0.07], [-1.15, Math.PI, 0]);
} });
// 14 "So we sent Kevin with notes," Theo launches Kevin with a note on his leg
const tSend = W('sent', 27.9);
S(W('so', 27.3), { ...STM, rain: 0.5, c: [-5, 0, -53], cam: [[-3.4, 1.65, -44.4], [-3.5, 1.8, -44.9], [-6.0, 1.4, -52.6], [-5.2, 2.6, -56]], fov: 55, act(t) {
  put(theo, -6.3, SWY, -52.6, Math.PI / 2 + 0.3);
  const u = clamp01((t - tSend) / 1.1);
  if (u <= 0) { anim(theo, 'holding-both', t); } else { anim(theo, 'interact-right', 0.2 + u * 0.4, { once: true }); }
  theo.c.handR.updateWorldMatrix(true, false); const h = theo.c.handR.getWorldPosition(new THREE.Vector3());
  const p = u <= 0 ? h.clone().add(V3(0.08, 0.02, 0)) : V3(lerp(h.x + 0.1, -3.5, u), h.y + Math.sin(u * 1.4) * 5, lerp(h.z, -64, u));
  KEV.g.visible = true; KEV.g.position.copy(p); KEV.g.rotation.set(-u * 0.3, toward(h.x, h.z, -3.5, -64), 0); KEV.set(0.4); KEV.note.visible = true;
  if (u > 0) KEV.flap(t, 1); else KEV.fold();
} });
// 15 "walked the grownups home," kids lead the grown-ups by the hand down the street
S(W('walked', 28.8), { ...STM, rain: 0.3, c: [0, 0, -55], cam: [[2.2, 2.4, -65.5], [2.1, 2.4, -64.6], [0, 1.0, -53]], fov: 55, act(t) {
  const z0 = -52.5 - (t - 28.8) * 1.0;
  [[theo, mayor, -2.0, 0], [maya, dad, 1.0, 1.7], [leo, grandpa, -1.4, 3.4], [zoe, lady, 1.6, 5.1]].forEach(([k, a, x, dz], i) => {
    put(k, x, 0, z0 + dz, Math.PI); k.c.poseArms('walk', t * 0.9 + i * 0.2, 'interact-left', 0.35);
    put(a, x - 0.78, 0, z0 + dz, Math.PI); a.c.poseArms('walk', t * 0.9 + i * 0.2 + 0.1, 'interact-right', 0.35); a.c.tiltHead(0.15);
  });
} });
// 16 "and ran the town for three whole days." kids in charge; the day board flips, the light goes round the clock
const tThree = W('three', 31), tWhole = W('whole', 31.3), tDays = W('days', 31.6);
S(W('and', 30.2), { light: 'morning', c: [6, 0, -22], cam: [[4.4, 2.3, -15.4], [4.7, 2.4, -16.2], [10.2, 2.1, -25.2]], fov: 55, act(t, k, s) {
  s.light = t < tThree ? 'morning' : t < tWhole ? 'day' : t < tDays ? 'dusk' : 'morning'; setLight(s.light, s.c);
  dayN = t < tThree ? 1 : t < tWhole ? 2 : 3; dayScr.draw(); dayBoard.visible = true; banner.visible = true; banner.material.map = BAN_KIDS; poster.visible = false;
  put(theo, 11.2, 0.75, -25.3, -Math.PI / 2); anim(theo, 'interact-right', t * 0.8); hold(megaphone, theo.c.handR, [0, -0.04, 0.08], [0, 0, 0]);
  const lz = -29.4 + ((t - 30.2) * 0.9); put(leo, 8.7, SWY, lz, 0); leo.c.poseArms('walk', t * 0.9, 'holding-right', 0); hold(mailbag, leo.c.handR, [0, -0.12, 0.05], [0, 0, 0]);
  put(mayor, 8.7, SWY, -23.0, toward(8.7, -23.0, 11.2, -25.3)); anim(mayor, 'emote-yes', t * 0.8);
  put(grandpa, 8.5, SWY, -28.0, toward(8.5, -28.0, 11.2, -25.3)); anim(grandpa, 'emote-yes', t * 0.8 + 0.3);
} });
// 17 "Now kids get phones at 13," the new sign; the kids cheer
S(W('now', 32.6), { ...DAY, c: [7, 0, 25], cam: [[2.6, 1.75, 35.6], [3.0, 1.85, 34.0], [7.4, 1.7, 25.2]], fov: 55, act(t) {
  F.sign.face.material.map = SIGN_AFTER;
  [[theo, 5.6, 27.6], [maya, 6.6, 27.0], [leo, 7.6, 27.2], [zoe, 8.6, 27.6]].forEach(([a, x, z], i) => { put(a, x, Math.abs(Math.sin(t * 6 + i)) * 0.18, z, toward(x, z, 2.8, 34.8)); anim(a, i % 2 ? 'emote-yes' : 'interact-right', t * 1.2 + i * 0.2); hold(phones[i], a.c.handL, [0, -0.03, 0.06], [-0.6, 0, 0]); });
  kevinPerch(7.6, 3.42, 24.0, -0.35, t, 0.3);
} });
// 18 "but grownups have to pass a pigeon test first." Kevin examines the mayor
S(W('but', 34.4), { ...DAY, c: [9, 0, -25], cam: [[9.7, 1.8, -20.6], [9.65, 1.75, -21.1], [8.95, 1.0, -25.3]], fov: 50, act(t) {
  testSet.visible = true; banner.visible = true; banner.material.map = BAN_TEST; poster.visible = false;
  put(mayor, 8.45, SWY + 0.02, -25.0, Math.PI / 2); mayor.seated = true; mayor.c.poseArms('sit', 0, 'interact-right', 0.3 + Math.sin(t * 9) * 0.05); hold(pencil, mayor.c.handR, [0, -0.04, 0.04], [0.4, 0, 0]);
  kevinPerch(9.3, SWY + 0.775, -25.2, -Math.PI / 2, t, 0.25); cap.visible = true; KEV.head.rotation.x = Math.sin(t * 7) > 0.6 ? 0.25 : 0;
  put(theo, 10.1, SWY, -26.4, toward(10.1, -26.4, 8.45, -25)); anim(theo, 'idle', t);
  [[dad, 7.0, -27.4], [grocer, 6.9, -28.8], [lady, 7.0, -30.2], [farmer, 6.9, -31.6]].forEach(([a, x, z], i) => { put(a, x, SWY, z, toward(x, z, 8.6, -25)); anim(a, i % 2 ? 'idle' : 'emote-no', t + i * 0.5); });
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
  setLight(s.light, s.c || [0, 0, 0]);
  const [from, to, look, lookTo] = s.cam;
  camera.position.set(...from.map((v, j) => lerp(v, to[j], k)));
  camera.fov = s.fov || 55; camera.updateProjectionMatrix();
  const L = new THREE.Vector3(...(lookTo ? look.map((v, j) => lerp(v, lookTo[j], k)) : look));
  setShot(i);
  s.act(t, k, s);
  if (s.pov) { const [pp, ll] = s.pov(); camera.position.copy(pp); L.copy(ll); }
  applyCamera(i, camera, L);
  life(t, s);
  fill.intensity = s.storm ? 5 : 0;
  for (const l of LIGHTS) l.visible = l.intensity > 0;
  if (!window.__NO_RENDER) composer.render();
};
window.SHOT_TIMES = SHOTS.map((s) => s.t);
window.END = END;
window.HOUSE_RULES = { framing: true, close: [6, 10] };
window.QA = { scene, camera, THREE, scale: 1 / 3, actors: actors.map((a) => ({ name: a.name, wrap: a.root, head: a.c.face, legL: { get rotation() { return { x: a.seated ? 2 : 0 }; } } })) };
window.READY = true;
