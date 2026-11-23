// Sets and props for the shadow story (episode 9): Dim Wood, House of Names hall, flat wall-shadow characters,
// mirror, name tags, jars/fireflies, sunrise beam. All in metres.
import * as THREE from 'three';
import { canvasTex } from './core.js';
import { std, box } from './town.js';
import { avatar } from './rig.js';

let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const cyl = (rt, rb, h, m, x, y, z, p, seg = 10) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; p.add(c); return c; };
const glow = (c, k = 1.5) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.5 });

// ---------------------------------------------------------------- Dim Wood (colourless forest, hanging shoes, name cards)
export function dimWood(scene, X = 600) {
  const g = new THREE.Group(); scene.add(g);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#6b6a74'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2200; i++) { const v = 70 + rnd() * 60; c.fillStyle = `rgba(${v},${v},${v + 10},.5)`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2); } }, [30, 30]), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(X, 0, -20); ground.receiveShadow = true; g.add(ground);
  const bark = std(0x3c3a44, { roughness: 1 });
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.3, 9, 7), bark, 140), limbs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.12, 3.2, 5), bark, 420);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1); let li = 0;
  const path = (z) => Math.sin(z * 0.18) * 1.6; // the winding path Eli walks along
  for (let i = 0; i < 140; i++) { const z = 10 - rnd() * 90, side = rnd() < 0.5 ? -1 : 1, x = X + path(z) + side * (2.6 + rnd() * 18); V.set(x, 4.5, z); q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08)); S.set(1, 0.8 + rnd() * 0.5, 1); m4.compose(V, q, S); trunks.setMatrixAt(i, m4);
    for (let k = 0; k < 3 && li < 420; k++) { const a = rnd() * 6.28, y = 3 + rnd() * 5; V.set(x + Math.cos(a) * 0.9, y, z + Math.sin(a) * 0.9); q.setFromEuler(new THREE.Euler(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9)); S.set(1, 1, 1); m4.compose(V, q, S); limbs.setMatrixAt(li++, m4); } }
  limbs.count = li; trunks.castShadow = true; g.add(trunks, limbs);
  // shoes hanging from branches on strings, white name cards on the ground
  const shoeM = [std(0x8a8a96), std(0xb8b0a0), std(0x6a6a76)];
  const shoes = [];
  for (let i = 0; i < 120; i++) { const near = i < 40, z = near ? -4 - rnd() * 8 : 8 - rnd() * 80, x = X + path(z) + (rnd() < 0.5 ? -1 : 1) * (near ? 0.5 + rnd() * 2.0 : 1.6 + rnd() * 9), y = near ? 3.0 + rnd() * 1.4 : 3.4 + rnd() * 2.6; const sg = new THREE.Group(); sg.position.set(x, y, z); g.add(sg); cyl(0.006, 0.006, 1.0, std(0x222228), 0, 0.5, 0, sg, 4); const b = box(0.12, 0.08, 0.28, shoeM[i % 3], 0, -0.06, 0, sg, 0.03); b.rotation.x = 0.2; sg.userData.ph = rnd() * 6; shoes.push(sg); }
  const cardM = std(0xf4f4f4, { roughness: 0.8 });
  for (let i = 0; i < 160; i++) { const z = 10 - rnd() * 88, x = X + path(z) + (rnd() - 0.5) * 14; const c = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.09), cardM); c.rotation.set(-Math.PI / 2, 0, rnd() * 6); c.position.set(x, 0.01 + rnd() * 0.01, z); g.add(c); }
  // footprints that all lead one way
  for (let i = 0; i < 60; i++) { const z = 8 - i * 1.3; for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.22), new THREE.MeshBasicMaterial({ color: 0x4a4a54 })); f.rotation.x = -Math.PI / 2; f.position.set(X + path(z) + s * 0.25, 0.012, z); g.add(f); } }
  // the stone door in a dead tree
  const door = new THREE.Group(); door.position.set(X + path(-72), 0, -72); g.add(door);
  const stone = std(0x5a5a64, { roughness: 1 });
  cyl(1.8, 2.3, 9, bark, 0, 4.5, -1.2, door, 10); box(2.6, 3.6, 0.6, stone, 0, 1.8, 0.4, door); for (const s of [-1, 1]) box(0.5, 3.8, 0.7, stone, s * 1.5, 1.9, 0.4, door); box(3.6, 0.5, 0.7, stone, 0, 3.9, 0.4, door);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), new THREE.MeshStandardMaterial({ map: canvasTex(1024, 160, (c, w, h) => { c.fillStyle = '#4a4a54'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e4f0'; c.font = '800 80px Poppins'; c.textAlign = 'center'; c.fillText('THE HOUSE OF NAMES', w / 2, 112); }), roughness: 0.9, emissive: 0x2a2a44, emissiveIntensity: 0.5 })); sign.position.set(0, 4.35, 1.5); door.add(sign);
  const leaf = new THREE.Group(); leaf.position.set(0, 1.55, 0.32); door.add(leaf); box(1.2, 3.0, 0.12, std(0x2a2a30), 0, 0, 0, leaf);
  return { g, path, shoes, doorPos: new THREE.Vector3(X + path(-72), 0, -72), leaf, X, sway(t) { shoes.forEach((s) => (s.rotation.z = Math.sin(t * 1.3 + s.userData.ph) * 0.12)); } };
}

// ---------------------------------------------------------------- House of Names (long hall of shelves with glowing jars)
export function nameHall(scene, X = 800) {
  const g = new THREE.Group(); scene.add(g);
  const W = 14, L = 44, H = 7;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#2a2836' : '#34323f'; c.fillRect(i * 32, j * 32, 32, 32); } }, [6, 22]), roughness: 0.35, metalness: 0.2 })); floor.rotation.x = -Math.PI / 2; floor.position.set(X, 0, 0); floor.receiveShadow = true; g.add(floor);
  const wall = std(0x2a2836);
  box(0.4, H, L, wall, X - W / 2, H / 2, 0, g); box(0.4, H, L, wall, X + W / 2, H / 2, 0, g); box(W, H, 0.4, wall, X, H / 2, L / 2, g); box(W, 0.4, L, std(0x1c1a26), X, H, 0, g);
  // back wall (the door side, z = -L/2) with an opening 3 m wide, 3.4 m tall
  box((W - 3) / 2, H, 0.4, wall, X - (W / 4 + 0.75), H / 2, -L / 2, g); box((W - 3) / 2, H, 0.4, wall, X + (W / 4 + 0.75), H / 2, -L / 2, g); box(3, H - 3.4, 0.4, wall, X, (H + 3.4) / 2, -L / 2, g);
  const wood = std(0x4a3a34);
  const jarGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), flameGeo = new THREE.SphereGeometry(0.05, 6, 5);
  const N = 760, jars = new THREE.InstancedMesh(jarGeo, new THREE.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.45, roughness: 0.1 }), N), flames = new THREE.InstancedMesh(flameGeo, glow(0xffb84a, 2.6), N);
  const m4 = new THREE.Matrix4(); let n = 0;
  for (const side of [-1, 1]) for (let z = -L / 2 + 2; z < L / 2 - 1.5 && n < N - 40; z += 0.42) for (let y = 0; y < 5; y++) { if (n >= N) break; m4.makeTranslation(X + side * (W / 2 - 0.55), 0.55 + y * 0.95, z); jars.setMatrixAt(n, m4); flames.setMatrixAt(n, m4); n++; }
  jars.count = n; flames.count = n; g.add(jars, flames);
  for (const side of [-1, 1]) { for (let y = 0; y < 5; y++) box(0.7, 0.06, L - 3, wood, X + side * (W / 2 - 0.55), 0.38 + y * 0.95, 0, g); for (let z = -L / 2 + 1.7; z < L / 2 - 1; z += 4.2) box(0.7, 5.2, 0.1, wood, X + side * (W / 2 - 0.55), 2.6, z, g); }
  // the two named jars: big, bright, on a stand in the middle
  const label = (txt) => new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b1b24'; c.font = '800 70px Poppins'; c.textAlign = 'center'; c.fillText(txt, w / 2, 90); }) });
  const bigJar = (x, txt) => { const j = new THREE.Group(); j.position.set(X + x, 0, 9.5); g.add(j); box(0.8, 1.0, 0.8, wood, 0, 0.5, 0, j); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.4, roughness: 0.05 })); gl.position.y = 1.28; j.add(gl); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), glow(0xffd070, 3)); fl.position.y = 1.28; j.add(fl); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.07, 16), std(0x888894, { metalness: 0.6 })); lid.position.y = 1.56; j.add(lid); const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), label(txt)); lb.position.set(0, 1.0, 0.41); j.add(lb); const pl = new THREE.PointLight(0xffc870, 2, 6, 1.6); pl.position.set(0, 1.4, 0.3); j.add(pl); return { j, gl, fl, pl }; };
  const jEli = bigJar(-0.8, 'ELI'), jMax = bigJar(0.8, 'MAX');
  const lamps = []; for (let z = -16; z < 18; z += 8) { const l = new THREE.PointLight(0x8a82ff, 6, 12, 1.6); l.position.set(X, 5.2, z); g.add(l); lamps.push(l); }
  // sunrise: a bright wedge of light through the door
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 18), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.rotation.x = -Math.PI / 2; beam.position.set(X, 0.05, -L / 2 + 9); g.add(beam);
  const sun = new THREE.PointLight(0xffe0a0, 0, 30, 1.2); sun.position.set(X, 2.4, -L / 2 - 1.5); g.add(sun);
  return { g, X, L, W, jEli, jMax, beam, sun, lamps, doorZ: -L / 2, jars, flames };
}

// ---------------------------------------------------------------- fireflies (names flying out), mirror, tags, flat shadows
export function fireflies(scene, n = 160) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 5), glow(0xfff0a0, 3), n); m.frustumCulled = false; m.visible = false; scene.add(m);
  const m4 = new THREE.Matrix4(), V = new THREE.Vector3(), S = new THREE.Vector3(), q = new THREE.Quaternion(); const seeds = Array.from({ length: n }, () => [rnd(), rnd(), rnd()]);
  return { m, set(t, u, from, to) { m.visible = u > 0 && u < 1.2; seeds.forEach(([a, b, c], i) => { const k = Math.min(1, Math.max(0, (u - c * 0.4) / 0.6)); V.set(from.x + (to.x - from.x) * k + Math.sin(i + u * 6) * 0.6 * (1 - k * 0.3), from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * (2 + a * 3), from.z + (to.z - from.z) * k + (b - 0.5) * 3); S.setScalar(k > 0 && k < 1 ? 0.6 + 0.6 * Math.sin(i * 3 + t * 9) ** 2 : 0.001); m4.compose(V, q, S); m.setMatrixAt(i, m4); }); m.instanceMatrix.needsUpdate = true; } };
}
const mirrorTex = (kind) => canvasTex(256, 256, (c, w, h) => {
  const gr = c.createRadialGradient(128, 110, 10, 128, 128, 140); gr.addColorStop(0, '#dfe8f4'); gr.addColorStop(1, '#8a98b0'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = '#16141f';
  if (kind === 'eli') { c.beginPath(); c.arc(128, 96, 36, 0, 7); c.fill(); c.fillRect(92, 130, 72, 90); }
  else { // a small hunched shape with no face
    c.beginPath(); c.ellipse(128, 168, 46, 54, 0, 0, 7); c.fill(); c.beginPath(); c.arc(128, 112, 30, 0, 7); c.fill(); c.strokeStyle = '#16141f'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(94, 150); c.lineTo(78, 196); c.moveTo(162, 150); c.lineTo(178, 196); c.stroke();
    if (kind === 'card') { c.fillStyle = '#f4f4f4'; c.fillRect(90, 170, 76, 44); c.fillStyle = '#1b1b24'; c.font = '800 28px Poppins'; c.textAlign = 'center'; c.fillText('Ash', 128, 202); } // centred so it stays inside the frame when the insert pushes in
  }
});
export function mirror(parent) {
  const g = new THREE.Group(); parent.add(g);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 10, 28), std(0xb8bcc8, { metalness: 0.9, roughness: 0.25 })); g.add(frame);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.1, 28), new THREE.MeshStandardMaterial({ map: mirrorTex('eli'), metalness: 0.6, roughness: 0.15, emissive: 0x334455, emissiveIntensity: 0.4 })); face.position.z = 0.002; g.add(face);
  box(0.02, 0.1, 0.02, std(0xb8bcc8, { metalness: 0.9 }), 0, -0.15, 0, g);
  return { g, show(kind) { face.material.map = mirrorTex(kind); } };
}
export function bigMirror(scene) { // full-screen "mirror POV" insert
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.1, 28), new THREE.MeshBasicMaterial({ map: mirrorTex('small') })); m.visible = false; scene.add(m);
  return { m, show(kind) { m.material.map = mirrorTex(kind); } };
}
export function nameTag(parent, txt, h = 0.4) {
  const t = canvasTex(256, 96, (c, w, hh) => { c.fillStyle = 'rgba(20,20,30,.78)'; c.beginPath(); c.roundRect(4, 4, w - 8, hh - 8, 22); c.fill(); c.fillStyle = '#fff'; c.font = '800 54px Poppins'; c.textAlign = 'center'; c.fillText(txt, w / 2, 66); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(0.8, 0.3, 1); s.position.set(0, h, 0); parent.add(s); return s;
}
/** a flat dark person pressed against a wall (the stuck shadow): flatten(true) squashes it into the wall plane */
export function flatPerson(scene, height = 1.6, opts = {}) {
  const c = avatar(scene, { shadowMode: true, r15: true, ...opts }, height); c.root.scale.z = 0.06;
  const lim = (j, x, z) => j.rotation.set(x, 0, z);
  return { c, root: c.root, pose(kind, t = 0) { const a = c.armL, b = c.armR; if (kind === 'stuck') { lim(a, -0.3, -2.6 + Math.sin(t * 3) * 0.1); lim(b, -0.3, 2.6 - Math.sin(t * 3) * 0.1); c.legL.rotation.set(0, 0, -0.25); c.legR.rotation.set(0, 0, 0.25); } else if (kind === 'stand') { lim(a, 0, -0.1); lim(b, 0, 0.1); c.legL.rotation.set(0, 0, 0); c.legR.rotation.set(0, 0, 0); } else if (kind === 'walk') { const s = Math.sin(t * 8); a.rotation.set(s * 0.7, 0, -0.1); b.rotation.set(-s * 0.7, 0, 0.1); c.legL.rotation.set(-s * 0.6, 0, 0); c.legR.rotation.set(s * 0.6, 0, 0); } } };
}
