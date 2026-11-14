// CC0 model library (Kenney Blocky Characters / Mini Characters / Car Kit / Food Kit, Quaternius), see
// assets/cc0/NOTICE.txt. Files are meshopt-compressed GLBs. Everything is normalised to METRES:
// characters ~1.75 m, cars by real length, props by a target size.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const CACHE = new Map();
const BASE = new URL('../assets/cc0/', import.meta.url);

// The phone page sets window.ASSET_PACK = 'b64': artifact hosting does not serve .glb, so each model ships as
// <name>.glb.txt (base64) and is decoded here. Everywhere else the .glb is loaded directly.
async function fetchModel(name) {
  if (globalThis.ASSET_PACK === 'b64') {
    const r = await fetch(new URL(name + '.glb.txt', BASE)); if (!r.ok) throw new Error(`model ${name}: HTTP ${r.status}`);
    const s = atob((await r.text()).trim()), bin = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) bin[i] = s.charCodeAt(i);
    return loader.parseAsync(bin.buffer, BASE.href);
  }
  return loader.loadAsync(new URL(name + '.glb', BASE).href);
}
export async function loadModel(name) {
  if (!CACHE.has(name)) CACHE.set(name, fetchModel(name));
  return CACHE.get(name);
}
export async function preload(names) { await Promise.all(names.map(loadModel)); }

function sizeOf(obj) { obj.updateMatrixWorld(true); return new THREE.Box3().setFromObject(obj, true); }
function shadows(obj) { obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }

/** static prop scaled so its largest horizontal size (or height with by:'height') = size metres; origin at its base centre */
export async function prop(parent, name, size, { by = 'length' } = {}) {
  const g = await loadModel(name);
  const inner = g.scene.clone(true); shadows(inner);
  const box = sizeOf(inner), s = box.getSize(new THREE.Vector3());
  const k = size / (by === 'height' ? s.y : Math.max(s.x, s.z));
  inner.scale.setScalar(k);
  const b2 = sizeOf(inner), c = b2.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -b2.min.y, -c.z);
  const outer = new THREE.Group(); outer.add(inner); parent.add(outer);
  return outer;
}

/**
 * Animated character. Deterministic: call pose(name, time) every frame (time = seconds into that animation),
 * optionally blending a second clip. height in metres.
 */
export async function character(parent, name, height = 1.75) {
  const g = await loadModel(name);
  const inner = skClone(g.scene); shadows(inner);
  const box = sizeOf(inner), k = height / box.getSize(new THREE.Vector3()).y;
  inner.scale.setScalar(k);
  const b2 = sizeOf(inner), c = b2.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -b2.min.y, -c.z);
  const root = new THREE.Group(); root.add(inner); parent.add(root);
  const mixer = new THREE.AnimationMixer(inner);
  const clips = Object.fromEntries(g.animations.map((a) => [a.name, a]));
  const actions = {};
  const act = (n) => { if (!clips[n]) throw new Error(`${name}: no animation "${n}" (has: ${Object.keys(clips).join(', ')})`); return (actions[n] ||= mixer.clipAction(clips[n])); };
  const node = (re) => { let n = null; inner.traverse((o) => { if (!n && re.test(o.name) && !o.isMesh) n = o; }); if (!n) inner.traverse((o) => { if (!n && re.test(o.name)) n = o; }); return n; };
  const head = node(/^head/i), armL = node(/arm-?left/i), armR = node(/arm-?right/i);
  // anchors in each part's own space: hand = bottom of the arm mesh, face = front centre of the head, top = top of the head
  inner.updateMatrixWorld(true);
  const localBox = (n) => { const bb = new THREE.Box3(), inv = new THREE.Matrix4().copy(n.matrixWorld).invert(); n.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))); } }); return bb; };
  const anchor = (n, f) => { const a = new THREE.Object3D(); if (n) { const bb = localBox(n); a.position.copy(f(bb)); n.add(a); } return a; };
  const handR = anchor(armR, (b) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2));
  const handL = anchor(armL, (b) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2));
  const face = anchor(head, (b) => new THREE.Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.max.z));
  const top = anchor(head, (b) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2));
  const arms = [armL, armR].filter(Boolean);
  return {
    root, inner, mixer, clips: Object.keys(clips), head, height, handR, handL, face, top, armL, armR,
    /** body clip a, with the ARMS taken from clip b (e.g. walk + holding-both = walking while carrying) */
    poseArms(a, ta, b, tb = 0) {
      this.pose(b, tb); const q = arms.map((n) => n.quaternion.clone()), p = arms.map((n) => n.position.clone());
      this.pose(a, ta); arms.forEach((n, i) => { n.quaternion.copy(q[i]); n.position.copy(p[i]); });
    },
    /** pose: clip a at time ta; optional clip b at time tb mixed by w (0..1). once: clamp instead of loop */
    pose(a, ta, b = null, tb = 0, w = 0, { once = false } = {}) {
      mixer.stopAllAction();
      const A = act(a); A.reset(); A.play(); A.setEffectiveWeight(1 - (b ? w : 0));
      const da = clips[a].duration; A.time = once ? Math.min(ta, da - 1e-3) : ((ta % da) + da) % da;
      if (b) { const B = act(b); B.reset(); B.play(); B.setEffectiveWeight(w); const db = clips[b].duration; B.time = once ? Math.min(tb, db - 1e-3) : ((tb % db) + db) % db; }
      mixer.update(0);
    },
  };
}
