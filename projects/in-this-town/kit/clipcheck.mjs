// Automatic rendering-bug check, run before every video render (house rule 3).
//   node kit/clipcheck.mjs episodes/<ep> [--samples 0.08,0.5,0.92]
// The episode must expose window.QA = { scene, camera, actors: [{ name, wrap, head }] } (head = Object3D).
// For each shot it samples a few moments and reports:
//   CAM_INSIDE   camera inside or touching geometry (double-sided rays hit within 0.35 units)
//   BLOCKED      a near object covers more than 22% of the frame (within 2.5 units of the lens)
//   HIDDEN       a visible actor's head is behind something (ray from camera hits another mesh first)
//   OFFSCREEN    a visible actor is entirely outside the frame (listed so you can confirm it is intended)
//   CLIP         an actor's body box overlaps a solid prop/wall box or another actor's body box
// Exit code 1 when anything except OFFSCREEN is found.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';

const args = process.argv.slice(2);
const ep = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const samples = opt('samples', '0.08,0.5,0.92').split(',').map(Number);
const root = path.resolve('.');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto(`http://localhost:${srv.address().port}/${ep}/index.html`);
await p.waitForFunction(() => window.READY === true && window.QA, null, { timeout: 120000 });

const report = await p.evaluate(async (samples) => {
  const { scene, camera, actors, THREE } = window.QA;
  const rc = new THREE.Raycaster();
  const out = [];
  const st = window.SHOT_TIMES, end = window.END;
  const isActorMesh = new Set();
  actors.forEach((a) => a.wrap.traverse((o) => { if (o.isMesh) isActorMesh.add(o); }));
  // every material double-sided while checking, so rays from inside a box hit its back faces
  const mats = new Map();
  scene.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (!mats.has(m)) mats.set(m, m.side); }); });
  const big = (o) => { o.geometry.computeBoundingBox(); const s = o.geometry.boundingBox.getSize(new THREE.Vector3()); return Math.max(s.x * o.scale.x, s.y * o.scale.y, s.z * o.scale.z) > 300; };
  const visibleDeep = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
  const targets = () => { const l = []; scene.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && visibleDeep(o) && !(o.material && o.material.transparent && o.material.opacity < 0.5) && !o.material?.depthTest === false) l.push(o); }); return l; };
  const solids = () => { const l = []; scene.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && visibleDeep(o) && !isActorMesh.has(o) && o.geometry?.type?.includes('Box') && !big(o)) { const bb = new THREE.Box3().setFromObject(o); const s = bb.getSize(new THREE.Vector3()); if (Math.min(s.x, s.y, s.z) > 0.08 && Math.max(s.x, s.y, s.z) < 60) l.push([o, bb]); } }); return l; };
  for (let i = 0; i < st.length; i++) {
    const t0 = st[i], t1 = i + 1 < st.length ? st[i + 1] : end;
    for (const u of samples) {
      const t = t0 + (t1 - t0) * u;
      window.renderAt(t);
      mats.forEach((_, m) => (m.side = THREE.DoubleSide));
      camera.updateMatrixWorld(true);
      const T = targets().filter((o) => !big(o) || o.isInstancedMesh);
      const issues = [];
      // 1) camera inside / blocked
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
      if (inside < 0.35) issues.push(`CAM_INSIDE (geometry ${inside.toFixed(2)} from lens)`);
      if (near / total > 0.22) issues.push(`BLOCKED (${Math.round(near / total * 100)}% of frame within 2.5u)`);
      // 2) actors: on screen, hidden, clipping
      const S = solids();
      const vis = actors.filter((a) => visibleDeep(a.wrap) && a.wrap.position.y > -40);
      const boxes = vis.map((a) => { const bb = new THREE.Box3(); a.wrap.updateMatrixWorld(true); a.wrap.traverse((o) => { if (o.isMesh && o.material?.map?.isTexture !== true) bb.expandByObject(o, true); }); return bb.isEmpty() ? new THREE.Box3().setFromObject(a.wrap) : bb; });
      vis.forEach((a, k) => {
        const hp = a.head.getWorldPosition(new THREE.Vector3());
        const ndc = hp.clone().project(camera);
        const bb = boxes[k], c = bb.getCenter(new THREE.Vector3()).project(camera);
        const on = Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z < 1;
        const anyOn = on || (Math.abs(c.x) <= 1.1 && Math.abs(c.y) <= 1.1 && c.z < 1);
        if (!anyOn) issues.push(`OFFSCREEN ${a.name}`);
        if (on) {
          const dir = hp.clone().sub(camera.position); const dist = dir.length(); dir.normalize();
          rc.set(camera.position, dir); rc.near = 0.1; rc.far = dist - 0.9;
          const h = rc.intersectObjects(T.filter((o) => !isActorMesh.has(o)), false)[0];
          if (h) issues.push(`HIDDEN ${a.name} (behind ${h.object.name || h.object.geometry.type} at ${h.distance.toFixed(1)})`);
        }
        const shrink = bb.clone().expandByScalar(-0.25);
        for (const [o, sb] of S) if (shrink.intersectsBox(sb)) { const ov = shrink.clone().intersect(sb).getSize(new THREE.Vector3()); if (Math.min(ov.x, ov.y, ov.z) > 0.15) { issues.push(`CLIP ${a.name} into ${o.name || 'box'} (${ov.toArray().map((v) => v.toFixed(1)).join('x')})`); break; } }
        for (let j = k + 1; j < vis.length; j++) { const ov = shrink.clone().intersect(boxes[j].clone().expandByScalar(-0.25)); if (!ov.isEmpty()) { const s = ov.getSize(new THREE.Vector3()); if (Math.min(s.x, s.y, s.z) > 0.35) issues.push(`CLIP ${a.name} into ${vis[j].name}`); } }
      });
      mats.forEach((side, m) => (m.side = side));
      if (issues.length) out.push({ shot: i, t: +t.toFixed(2), issues: [...new Set(issues)] });
    }
  }
  return out;
}, samples);

let bad = 0;
for (const r of report) { console.log(`shot ${String(r.shot).padStart(2)} @${r.t.toFixed(2)}s  ${r.issues.join(' | ')}`); if (r.issues.some((x) => !x.startsWith('OFFSCREEN'))) bad++; }
console.log(bad ? `\n${bad} sample(s) with problems` : '\nclean: no clipping or blocking found');
await b.close(); srv.close();
process.exit(bad ? 1 : 0);
