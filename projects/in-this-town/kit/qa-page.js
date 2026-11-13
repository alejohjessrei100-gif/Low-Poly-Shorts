// Browser-side QA checks shared by kit/clipcheck.mjs and kit/autofix.mjs (injected as a classic script).
// Needs window.QA = { scene, camera, THREE, actors: [{ name, wrap, head }] } and window.renderAt(t).
(() => {
  const { scene, camera, THREE, actors } = window.QA;
  const rc = new THREE.Raycaster();
  const isActorMesh = new Set();
  actors.forEach((a) => a.wrap.traverse((o) => { if (o.isMesh) isActorMesh.add(o); }));
  const mats = new Map();
  scene.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (!mats.has(m)) mats.set(m, m.side); }); });
  const bigCache = new Map();
  const big = (o) => {
    if (bigCache.has(o)) return bigCache.get(o);
    o.geometry.computeBoundingBox(); const s = o.geometry.boundingBox.getSize(new THREE.Vector3());
    const r = Math.max(s.x * o.scale.x, s.y * o.scale.y, s.z * o.scale.z) > 300; bigCache.set(o, r); return r;
  };
  const visibleDeep = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
  const targets = () => { const l = []; scene.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && visibleDeep(o) && !(o.material && o.material.transparent && o.material.opacity < 0.5) && o.material?.depthTest !== false && (!big(o) || o.isInstancedMesh)) l.push(o); }); return l; };
  const solids = () => { const l = []; scene.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && visibleDeep(o) && !isActorMesh.has(o) && o.geometry?.type?.includes('Box') && !big(o)) { const bb = new THREE.Box3().setFromObject(o); const s = bb.getSize(new THREE.Vector3()); if (Math.min(s.x, s.y, s.z) > 0.08 && Math.max(s.x, s.y, s.z) < 60) l.push([o, bb]); } }); return l; };
  const actorBox = (a) => { const bb = new THREE.Box3(); a.wrap.updateMatrixWorld(true); a.wrap.traverse((o) => { if (o.isMesh && o.geometry.type !== 'PlaneGeometry') bb.expandByObject(o, true); }); return bb.isEmpty() ? new THREE.Box3().setFromObject(a.wrap) : bb; };
  // horizontal push that separates box A from box B, plus a small margin
  const mtv = (A, B) => {
    const ov = A.clone().intersect(B).getSize(new THREE.Vector3());
    const ca = A.getCenter(new THREE.Vector3()), cb = B.getCenter(new THREE.Vector3());
    return ov.x < ov.z ? [(ov.x + 0.25) * (ca.x >= cb.x ? 1 : -1), 0, 0] : [0, 0, (ov.z + 0.25) * (ca.z >= cb.z ? 1 : -1)];
  };

  /** geometry checks at time t; returns { issues, cam, centroid } (no rendering when window.__NO_RENDER) */
  window.QA_CHECK = (t) => {
    window.renderAt(t);
    scene.updateMatrixWorld(true); // renderAt may skip rendering, which is what normally updates world matrices
    mats.forEach((_, m) => (m.side = THREE.DoubleSide));
    camera.updateMatrixWorld(true);
    const T = targets(), issues = [];
    let near = 0, total = 0, inside = 1e9;
    for (let y = -1; y <= 1.001; y += 0.25) for (let x = -1; x <= 1.001; x += 0.25) {
      rc.setFromCamera(new THREE.Vector2(x * 0.98, y * 0.98), camera); rc.near = camera.near; rc.far = 40;
      const h = rc.intersectObjects(T, false)[0]; total++;
      if (h) { inside = Math.min(inside, h.distance); if (h.distance < 2.5 && !isActorMesh.has(h.object)) near++; }
    }
    for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      rc.set(camera.position, new THREE.Vector3(...d)); rc.near = 0; rc.far = 0.35;
      const h = rc.intersectObjects(T, false)[0]; if (h) inside = Math.min(inside, h.distance);
    }
    if (inside < 0.35) issues.push({ type: 'CAM_INSIDE', text: `CAM_INSIDE (geometry ${inside.toFixed(2)} from lens)` });
    if (near / total > 0.22) issues.push({ type: 'BLOCKED', text: `BLOCKED (${Math.round(near / total * 100)}% of frame within 2.5u)` });
    const S = solids();
    const vis = actors.filter((a) => visibleDeep(a.wrap) && a.wrap.position.y > -40);
    const boxes = vis.map(actorBox);
    let onCount = 0; const cen = new THREE.Vector3();
    vis.forEach((a, k) => {
      const hp = a.head.getWorldPosition(new THREE.Vector3());
      const ndc = hp.clone().project(camera);
      const c = boxes[k].getCenter(new THREE.Vector3()); cen.add(c);
      const cp = c.clone().project(camera);
      const on = Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z < 1;
      const anyOn = on || (Math.abs(cp.x) <= 1.1 && Math.abs(cp.y) <= 1.1 && cp.z < 1);
      if (anyOn) onCount++; else issues.push({ type: 'OFFSCREEN', actor: a.name, text: `OFFSCREEN ${a.name}` });
      if (on) {
        const dir = hp.clone().sub(camera.position); const dist = dir.length(); dir.normalize();
        rc.set(camera.position, dir); rc.near = 0.1; rc.far = dist - 0.9;
        const h = rc.intersectObjects(T.filter((o) => !isActorMesh.has(o)), false)[0];
        if (h) issues.push({ type: 'HIDDEN', actor: a.name, text: `HIDDEN ${a.name} (behind ${h.object.name || h.object.geometry.type} at ${h.distance.toFixed(1)})` });
      }
      if (!anyOn) return; // clipping nobody can see is not a problem
      const seated = Math.abs(a.legL?.rotation.x || 0) > 1.2; // sitting or kneeling: never slide them off the seat
      const shrink = boxes[k].clone().expandByScalar(-0.25);
      // resting contact (sitting, lying, standing on something): the character is on top and the overlap is thin
      const resting = (sb, ov) => ov.y <= 0.6 && shrink.min.y >= sb.max.y - 0.65;
      // a held prop sits entirely inside the character's own outline: not clipping
      const held = (sb) => boxes[k].clone().expandByScalar(0.3).containsBox(sb);
      for (const [o, sb] of S) if (shrink.intersectsBox(sb)) { const ov = shrink.clone().intersect(sb).getSize(new THREE.Vector3()); if (Math.min(ov.x, ov.y, ov.z) > 0.15 && !resting(sb, ov) && !held(sb)) { issues.push({ type: 'CLIP', actor: a.name, other: 'box', mtv: seated ? null : mtv(shrink, sb), text: `CLIP ${a.name} into ${o.name || 'box'} (${ov.toArray().map((v) => v.toFixed(1)).join('x')})` }); break; } }
      for (let j = k + 1; j < vis.length; j++) { const B = boxes[j].clone().expandByScalar(-0.25); const ov = shrink.clone().intersect(B); if (!ov.isEmpty()) { const s = ov.getSize(new THREE.Vector3()); if (Math.min(s.x, s.y, s.z) > 0.35) issues.push({ type: 'CLIP', actor: vis[j].name, other: a.name, mtv: mtv(B, shrink), text: `CLIP ${a.name} into ${vis[j].name}` }); } }
    });
    if (vis.length && !onCount) issues.push({ type: 'ALL_OFFSCREEN', text: 'ALL_OFFSCREEN (no character in frame)' });
    mats.forEach((side, m) => (m.side = side));
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    return { issues, cam: { pos: camera.position.toArray(), fwd: fwd.toArray(), right: right.toArray() }, centroid: vis.length ? cen.divideScalar(vis.length).toArray() : null, look: camera.position.clone().add(fwd.clone().multiplyScalar(10)).toArray() };
  };

  /** rendered-frame checks at t: mean luma, contrast, and jump to the next frame */
  const small = document.createElement('canvas'); small.width = 54; small.height = 96;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  const grab = (t) => { const keep = window.__NO_RENDER; window.__NO_RENDER = false; window.renderAt(t); window.__NO_RENDER = keep; sctx.drawImage(document.getElementById('c'), 0, 0, 54, 96); const d = sctx.getImageData(0, 0, 54, 96).data; const l = new Float32Array(54 * 96); for (let i = 0; i < l.length; i++) l[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255; return l; };
  window.QA_FRAME = (t, fps = 60) => {
    const a = grab(t), b = grab(t + 1 / fps);
    let m = 0, v = 0, diff = 0;
    for (let i = 0; i < a.length; i++) { m += a[i]; diff += Math.abs(a[i] - b[i]); }
    m /= a.length; diff /= a.length;
    for (let i = 0; i < a.length; i++) v += (a[i] - m) ** 2;
    const sd = Math.sqrt(v / a.length), issues = [];
    if (m < 0.05) issues.push({ type: 'BLACK', text: `BLACK frame (mean luma ${m.toFixed(3)})` });
    else if (sd < 0.025) issues.push({ type: 'FLAT', text: `FLAT frame (one colour, contrast ${sd.toFixed(3)})` });
    if (diff > 0.16) issues.push({ type: 'POP', text: `POP (frame jumps ${(diff * 100).toFixed(0)}% in 1/${fps} s)` });
    return { issues, mean: m, sd, diff };
  };
})();
