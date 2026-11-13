// Balloons: per-person "lie balloon" clusters, a big instanced swarm (hundreds), popping, string lines.
import * as THREE from 'three';

export const BALLOON_COLS = [0xff5d73, 0xffc83d, 0x5fb6ff, 0x8fdc6b, 0xb98cf0, 0xff9f43, 0xff7ac8, 0x4fd1c5];
const geo = new THREE.SphereGeometry(1, 18, 14); geo.scale(1, 1.18, 1);
const knot = new THREE.ConeGeometry(0.16, 0.28, 8); knot.rotateX(Math.PI); knot.translate(0, -1.25, 0);
const MATS = BALLOON_COLS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.05, emissive: c, emissiveIntensity: 0.12 }));
const stringMat = new THREE.LineBasicMaterial({ color: 0xf4f1ff, transparent: true, opacity: 0.85 });

let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** n balloons above an anchor; .update(t, {anchor, inflate, pop, popT}) each frame */
export function cluster(parent, n, { size = 0.8, spread = 1.2, height = 3.2, s = 1 } = {}) {
  seed = s * 977 + n;
  const g = new THREE.Group(); parent.add(g);
  const items = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Group();
    const b = new THREE.Mesh(geo, MATS[(i + s) % MATS.length]); b.castShadow = true; m.add(b);
    m.add(new THREE.Mesh(knot, b.material));
    const a = i * 2.399 + rnd(), r = spread * Math.sqrt((i + 0.5) / n) * (0.6 + n * 0.04);
    const sz = size * (0.8 + rnd() * 0.4);
    items.push({ m, off: new THREE.Vector3(Math.sin(a) * r, height + (1 - (i + 0.5) / n) * sz * 0.8 * Math.min(4, n / 6) + rnd() * 0.6, Math.cos(a) * r), sz, ph: rnd() * 6, popAt: rnd() });
    g.add(m);
  }
  const pos = new Float32Array(n * 6);
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), stringMat);
  lines.frustumCulled = false; g.add(lines);
  return {
    g, items,
    /** anchor: world point the strings meet (above the head); inflate 0..1; pop: 0..1 fraction popped (staggered) */
    update(t, anchor, { inflate = 1, pop = 0, sway = 1, squash = 1, lean = 0 } = {}) {
      g.visible = true; g.position.copy(anchor);
      items.forEach((it, i) => {
        const p = it.off.clone();
        p.x *= squash; p.z *= squash;
        p.x += Math.sin(t * 1.3 + it.ph) * 0.18 * sway + lean * p.y * 0.25; p.z += Math.cos(t * 1.1 + it.ph) * 0.18 * sway;
        const popped = pop > it.popAt * 0.98 + 0.01;
        const k = popped ? 0 : inflate;
        it.m.visible = k > 0.01;
        it.m.position.copy(p).multiplyScalar(0.35 + 0.65 * k);
        it.m.scale.setScalar(it.sz * k);
        it.m.rotation.z = Math.sin(t + it.ph) * 0.1;
        const j = i * 6;
        pos[j] = 0; pos[j + 1] = 0; pos[j + 2] = 0;
        pos[j + 3] = it.m.position.x; pos[j + 4] = it.m.position.y - 1.3 * it.sz * k; pos[j + 5] = it.m.position.z;
        if (!it.m.visible) { pos[j + 3] = 0; pos[j + 4] = 0; pos[j + 5] = 0; }
      });
      lines.geometry.attributes.position.needsUpdate = true;
    },
    hide() { g.visible = false; },
  };
}

/** hundreds of balloons tied to anchor points (e.g. a building roof); InstancedMesh + string lines */
export function swarm(parent, anchors, { per = 3, size = 1.6, height = 9, s = 5 } = {}) {
  seed = s;
  const n = anchors.length * per;
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.05 }), n);
  mesh.castShadow = true; mesh.frustumCulled = false;
  const data = [];
  for (let i = 0; i < n; i++) {
    mesh.setColorAt(i, new THREE.Color(BALLOON_COLS[i % BALLOON_COLS.length]));
    const a = anchors[Math.floor(i / per)];
    data.push({ a, off: new THREE.Vector3((rnd() - 0.5) * 5, height * (0.7 + rnd() * 0.6), (rnd() - 0.5) * 5), sz: size * (0.75 + rnd() * 0.5), ph: rnd() * 6, popAt: rnd(), tieAt: rnd() });
  }
  const pos = new Float32Array(n * 6);
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), stringMat);
  lines.frustumCulled = false;
  const g = new THREE.Group(); g.add(mesh, lines); parent.add(g);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  return {
    g, n,
    /** frame: Object3D whose matrixWorld the anchors live in; tied: 0..1 fraction tied on; pop: 0..1 fraction popped */
    update(t, frame, { tied = 1, pop = 0 } = {}) {
      g.visible = true; frame.updateWorldMatrix(true, false);
      data.forEach((d, i) => {
        const on = d.tieAt <= tied && !(pop > d.popAt * 0.98 + 0.01);
        const A = v.copy(d.a).applyMatrix4(frame.matrixWorld).clone();
        const P = A.clone().add(d.off).add(new THREE.Vector3(Math.sin(t * 1.2 + d.ph) * 0.4, Math.sin(t * 0.9 + d.ph) * 0.3, Math.cos(t + d.ph) * 0.4));
        sc.setScalar(on ? d.sz : 0);
        m4.compose(P, q, sc); mesh.setMatrixAt(i, m4);
        const j = i * 6;
        if (on) { pos[j] = A.x; pos[j + 1] = A.y; pos[j + 2] = A.z; pos[j + 3] = P.x; pos[j + 4] = P.y - 1.2 * d.sz; pos[j + 5] = P.z; }
        else for (let k = 0; k < 6; k++) pos[j + k] = A.x * 0 + (k % 3 === 1 ? -999 : 0);
      });
      mesh.instanceMatrix.needsUpdate = true; lines.geometry.attributes.position.needsUpdate = true;
    },
    /** world positions of balloons that pop in (pop0, pop1], for burst effects */
    popping(frame, pop0, pop1) { frame.updateWorldMatrix(true, false); return data.filter((d) => pop1 > d.popAt * 0.98 + 0.01 && !(pop0 > d.popAt * 0.98 + 0.01)).map((d) => d.a.clone().applyMatrix4(frame.matrixWorld).add(d.off)); },
    hide() { g.visible = false; },
  };
}

/** rubber shreds flying out of popped balloons */
export function shreds(parent, max = 400) {
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), max);
  for (let i = 0; i < max; i++) mesh.setColorAt(i, new THREE.Color(BALLOON_COLS[i % BALLOON_COLS.length]));
  mesh.frustumCulled = false; parent.add(mesh);
  const m4 = new THREE.Matrix4();
  return {
    mesh,
    /** bursts: [[x,y,z,t0], ...] */
    update(t, bursts) {
      mesh.visible = true; let n = 0;
      for (const [x, y, z, t0] of bursts) for (let k = 0; k < 8 && n < max; k++, n++) {
        const u = t - t0;
        if (u < 0 || u > 1.2) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(n, m4); continue; }
        const a = k * 0.785 + n, e = (k % 3 - 1) * 0.6, sp = 5;
        m4.makeRotationFromEuler(new THREE.Euler(u * 9 + k, u * 7, k));
        m4.setPosition(x + Math.cos(a) * Math.cos(e) * sp * u, y + Math.sin(e) * sp * u - 4 * u * u, z + Math.sin(a) * Math.cos(e) * sp * u);
        mesh.setMatrixAt(n, m4.multiply(new THREE.Matrix4().makeScale(1 - u / 1.2, 1 - u / 1.2, 1)));
      }
      for (; n < max; n++) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(n, m4); }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
