// Ambient life, all instanced and deterministic in t: falling snow around the camera, chimney smoke,
// bird flocks, waving flags, echo rings. Each has update(t, camera?) and hide().
import * as THREE from 'three';

let seed = 51;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();

/** snowflakes filling a box that travels with the camera (so every shot has snow, at no extra cost) */
export function snowfall(scene, n = 1400, { box = [70, 40, 70], speed = 2.2, size = 0.12 } = {}) {
  seed = 51;
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(size, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true }), n);
  mesh.frustumCulled = false; scene.add(mesh);
  const P = Array.from({ length: n }, () => [rnd(), rnd(), rnd(), 0.6 + rnd() * 0.8, rnd() * 6.283]);
  const wrap = (v, L) => ((v % L) + L) % L - L / 2;
  return {
    mesh,
    update(t, camera, k = 1) {
      mesh.visible = k > 0; const c = camera.position;
      P.forEach(([a, b, d, sp, ph], i) => {
        V.set(c.x + wrap(a * box[0] - c.x + Math.sin(t * 0.7 + ph) * 0.8, box[0]), c.y + wrap(b * box[1] - t * speed * sp - c.y, box[1]), c.z + wrap(d * box[2] - c.z + t * 0.6, box[2]));
        S.setScalar(i / n < k ? 1 : 0); m4.compose(V, q, S); mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    hide() { mesh.visible = false; },
  };
}

/** soft smoke puffs rising from points (chimneys) */
export function smoke(scene, points, per = 5) {
  const n = points.length * per;
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshStandardMaterial({ color: 0xd8dde8, transparent: true, opacity: 0.55, roughness: 1 }), n);
  mesh.frustumCulled = false; scene.add(mesh);
  return {
    update(t) {
      mesh.visible = true;
      points.forEach((p, i) => { for (let k = 0; k < per; k++) { const u = ((t * 0.35 + k / per + i * 0.13) % 1); V.set(p.x + Math.sin(u * 4 + i) * 0.8 + u * 2.5, p.y + u * 7, p.z + u * 1.2); S.setScalar(0.6 + u * 2.2); m4.compose(V, q, S); mesh.setMatrixAt(i * per + k, m4); } });
      mesh.instanceMatrix.needsUpdate = true;
    },
    hide() { mesh.visible = false; },
  };
}

/** a flock of V-shaped birds circling a centre */
export function birds(scene, center, n = 14, r = 30) {
  const g = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-0.9, 0.25, 0, 0, 0, 0.15, 0, 0, -0.15, 0.9, 0.25, 0, 0, 0, -0.15, 0, 0, 0.15], 3));
  g.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0x2b2f45, side: THREE.DoubleSide }), n);
  mesh.frustumCulled = false; scene.add(mesh);
  return {
    update(t) {
      mesh.visible = true;
      for (let i = 0; i < n; i++) {
        const a = t * 0.25 + i * 0.45, rr = r + (i % 4) * 3;
        V.set(center[0] + Math.cos(a) * rr, center[1] + Math.sin(t * 0.8 + i) * 2 + (i % 3) * 2, center[2] + Math.sin(a) * rr);
        q.setFromEuler(new THREE.Euler(0, -a, 0)); const f = 1 + Math.sin(t * 9 + i) * 0.5; S.set(1.6, f * 1.6, 1.6);
        m4.compose(V, q, S); mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    hide() { mesh.visible = false; },
  };
}

/** flags on poles that wave */
export function flags(scene, spots, colors = [0xe8434f, 0x2f6b9a, 0xf2c14e]) {
  const list = spots.map(([x, y, z, h = 8], i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, h, 8), new THREE.MeshStandardMaterial({ color: 0xdfe3ec, metalness: 0.5 })); pole.position.set(x, y + h / 2, z); pole.castShadow = true; scene.add(pole);
    const geo = new THREE.PlaneGeometry(3, 1.8, 10, 1); const base = geo.attributes.position.array.slice();
    const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide })); flag.position.set(x + 1.5, y + h - 1, z); scene.add(flag);
    return { flag, geo, base };
  });
  return {
    update(t) {
      list.forEach(({ geo, base }, i) => { const a = geo.attributes.position.array; for (let k = 0; k < a.length; k += 3) { const u = (base[k] + 1.5) / 3; a[k + 2] = Math.sin(t * 6 + base[k] * 2 + i) * 0.35 * u; } geo.attributes.position.needsUpdate = true; });
    },
  };
}

/** expanding rings travelling from a to b (echoes, shouts, whispers) */
export function rings(scene, n = 6, color = 0xffffff) {
  const list = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 8, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false })); m.visible = false; scene.add(m); return m; });
  return {
    /** u0: time since start; a, b: Vector3; size: final radius; dur: seconds per ring; gap between rings */
    update(u0, a, b, { size = 6, dur = 1.6, gap = 0.3, opacity = 0.85, color: col } = {}) {
      list.forEach((m, i) => {
        const u = (u0 - i * gap) / dur; m.visible = u > 0 && u < 1; if (!m.visible) return;
        m.position.lerpVectors(a, b, u); m.scale.setScalar(0.5 + size * u); m.lookAt(b); m.material.opacity = opacity * (1 - u);
        if (col !== undefined) m.material.color.set(col);
      });
    },
    hide() { list.forEach((m) => (m.visible = false)); },
  };
}
