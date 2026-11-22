// The original "In This Town" avatars (kit/avatar.js: rounded-box R6 bodies, drawn faces, hair, hats) at REAL-WORLD
// size (metres), animated procedurally with the same clip names and API as kit/assets.js character():
//   const c = avatar(scene, { shirt: 0x3fb6a8, hairStyle: 'messy' }, 1.75);
//   c.pose('walk', t)  c.poseArms('walk', t, 'holding-both', 0)  c.tiltHead(0.3)  c.setFace('happy')
//   anchors: c.handR c.handL c.face c.top, c.root is what the episode moves.
// Grown-ups 1.7-1.85 m, kids 1.3-1.45 m. Feet stay on the ground in every clip (hips drop as the legs swing).
import * as THREE from 'three';
import { makeAvatar, setFace, POSES, BASE_HEIGHT } from './avatar.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const R = (o, x, y, z) => o.rotation.set(x, y, z);
const HIP = 2; // hip height in avatar units (legs are 2 long)

function still(av, P) { R(av.armL, ...P.armL); R(av.armR, ...P.armR); R(av.legL, ...P.legL); R(av.legR, ...P.legR); R(av.headPivot, ...P.head); }
const breathe = (av, t, k = 1) => { const b = Math.sin(t * 2.2); av.body.position.y = HIP + b * 0.02 * k; av.armL.rotation.z += b * 0.025 * k; av.armR.rotation.z -= b * 0.025 * k; };

function gait(av, t, hz, amp, lean = 0, armK = 0.85) {
  const p = t * hz * TAU, s = Math.sin(p);
  R(av.legL, s * amp, 0, 0); R(av.legR, -s * amp, 0, 0);
  R(av.armL, -s * amp * armK, 0, 0.08); R(av.armR, s * amp * armK, 0, -0.08);
  av.body.rotation.set(lean, s * 0.07, 0); av.headPivot.rotation.set(-lean * 0.6, -s * 0.05, 0);
  av.body.position.y = HIP * Math.cos(s * amp) + Math.abs(Math.cos(p)) * 0.04; // feet on the ground, small spring
}

/** clip library: (av, t, scale, once) - t in seconds; clips loop unless they are reach-type with once */
const CLIPS = {
  static: (av) => still(av, POSES.idle),
  idle: (av, t) => { still(av, POSES.idle); av.armL.rotation.x = Math.sin(t * 1.1) * 0.04; av.armR.rotation.x = -Math.sin(t * 1.1 + 0.4) * 0.04; breathe(av, t); },
  walk: (av, t) => gait(av, t, 1.5, 0.6),
  stroll: (av, t) => gait(av, t, 1.2, 0.45, 0, 0.6),
  sprint: (av, t) => { gait(av, t, 2.1, 1.0, 0.22, 1.15); av.armL.rotation.x -= 0.35; av.armR.rotation.x -= 0.35; },
  sneak: (av, t) => { gait(av, t, 1.1, 0.4, 0.3, 0.3); av.armL.rotation.x = -0.9; av.armR.rotation.x = -0.9; av.body.position.y -= 0.25; },
  // celebrate: fist pump + small hop
  'emote-yes': (av, t) => { const p = t * 2.6 * TAU, u = Math.max(0, Math.sin(p)); still(av, POSES.idle); R(av.armR, -2.5 - u * 0.35, 0, 0.25); R(av.armL, -0.5, 0, 0.3); av.body.position.y = HIP + u * 0.22; R(av.headPivot, -0.15, 0, 0); },
  cheer: (av, t) => { const p = t * 2.4 * TAU, u = Math.max(0, Math.sin(p)); R(av.armL, -2.8 - Math.sin(p) * 0.2, 0, -0.35); R(av.armR, -2.8 + Math.sin(p) * 0.2, 0, 0.35); R(av.legL, 0, 0, -0.08); R(av.legR, 0, 0, 0.08); R(av.headPivot, -0.2, 0, 0); av.body.position.y = HIP + u * 0.35; },
  // refuse: arms crossed, head shake
  'emote-no': (av, t) => { still(av, POSES.crossArms); av.headPivot.rotation.y = Math.sin(t * 9) * 0.35 * Math.max(0, 1 - (t % 2) * 0.6); breathe(av, t); },
  shrug: (av, t) => { const u = 0.5 + 0.5 * Math.sin(t * 3); R(av.armL, -0.25, 0, -0.5 - u * 0.25); R(av.armR, -0.25, 0, 0.5 + u * 0.25); R(av.legL, 0, 0, 0); R(av.legR, 0, 0, 0); R(av.headPivot, 0, 0, 0.12); av.body.position.y = HIP + u * 0.05; },
  'interact-right': (av, t, s, once) => { still(av, POSES.idle); const u = once ? ease(t / 0.4) : 1; R(av.armR, -1.5 * u + (once ? 0 : Math.sin(t * 4) * 0.12), 0, -0.06); breathe(av, t, 0.5); },
  'interact-left': (av, t, s, once) => { still(av, POSES.idle); const u = once ? ease(t / 0.4) : 1; R(av.armL, -1.5 * u + (once ? 0 : Math.sin(t * 4) * 0.12), 0, 0.06); breathe(av, t, 0.5); },
  point: (av, t) => { still(av, POSES.point); av.armR.rotation.x += Math.sin(t * 5) * 0.05; breathe(av, t); },
  'holding-right': (av, t) => { still(av, POSES.idle); R(av.armR, -1.15, 0.25, -0.12); breathe(av, t); },
  'holding-left': (av, t) => { still(av, POSES.idle); R(av.armL, -1.15, -0.25, 0.12); breathe(av, t); },
  'holding-both': (av, t) => { still(av, POSES.carry); R(av.armL, -1.25, 0, 0.18); R(av.armR, -1.25, 0, -0.18); breathe(av, t); },
  phone: (av, t) => { still(av, POSES.phone); breathe(av, t); },
  wave: (av, t) => { still(av, POSES.wave); av.armR.rotation.z = 2.5 + Math.sin(t * 9) * 0.35; breathe(av, t); },
  clap: (av, t) => { still(av, POSES.idle); const c = Math.abs(Math.sin(t * 7)); R(av.armL, -1.3, 0, -0.1 - c * 0.35); R(av.armR, -1.3, 0, 0.1 + c * 0.35); breathe(av, t); },
  facepalm: (av, t) => { still(av, POSES.idle); R(av.armR, -2.5, 0.2, 0.75); R(av.headPivot, 0.3, 0, 0); breathe(av, t); },
  // bend at the waist to pick something up (legs stay planted)
  'pick-up': (av, t, s, once) => { still(av, POSES.idle); const u = once ? ease(t / 0.33) : 0.5 + 0.5 * Math.sin(t * 3); av.body.rotation.x = 0.75 * u; R(av.legL, -0.75 * u, 0, 0); R(av.legR, -0.75 * u, 0, 0); R(av.armL, -0.9 * u, 0, 0.1); R(av.armR, -0.9 * u, 0, -0.1); av.body.position.y = HIP; },
  crouch: (av, t) => { still(av, POSES.idle); av.body.rotation.x = 0.35; R(av.legL, -1.2, 0, 0); R(av.legR, -1.2, 0, 0); R(av.armL, -0.9, 0, 0.2); R(av.armR, -0.9, 0, -0.2); av.body.position.y = HIP * 0.55; },
  // seated: hips at a 0.45 m seat (set by pose from the avatar's scale), legs forward
  sit: (av, t, s) => { still(av, POSES.sit); av.body.position.y = 0.45 / s + Math.sin(t * 2.2) * 0.01; },
  drive: (av, t, s) => { still(av, POSES.sit); R(av.armL, -1.25, 0, 0.12); R(av.armR, -1.25, 0, -0.12); av.body.position.y = 0.45 / s; },
  jump: (av, t) => { const p = (t * 1.6) % 1, u = Math.sin(p * Math.PI); still(av, POSES.tada); av.body.position.y = HIP + u * 1.2; },
  'attack-kick-right': (av, t) => { const u = 0.5 + 0.5 * Math.sin(t * 6); still(av, POSES.kick); av.legR.rotation.x = -1.4 * u; av.body.position.y = HIP; },
  'attack-melee-right': (av, t) => { const u = 0.5 + 0.5 * Math.sin(t * 7); still(av, POSES.idle); R(av.armR, -1.6 * u, 0, 0); R(av.armL, -0.6, 0, 0.3); },
  yell: (av, t) => { still(av, POSES.yell); av.body.position.y = HIP + Math.abs(Math.sin(t * 6)) * 0.04; },
  flail: (av, t) => { still(av, POSES.flail); av.armL.rotation.z += Math.sin(t * 11) * 0.4; av.armR.rotation.z -= Math.sin(t * 13) * 0.4; },
  die: (av) => { still(av, POSES.idle); av.body.rotation.x = -1.5; av.body.position.y = 0.55; },
};

export const CLIP_NAMES = [...Object.keys(CLIPS), ...Object.keys(POSES)];

/** a classic avatar at `height` metres. opts go to makeAvatar (skin, shirt, pants, shoes, hair, hairStyle, hat, ...). */
export function avatar(parent, opts = {}, height = 1.75, { face = 'smile' } = {}) {
  const av = makeAvatar(opts);
  const s = height / BASE_HEIGHT;
  av.root.scale.setScalar(s);
  const root = new THREE.Group(); root.add(av.root); parent.add(root);
  const faceA = new THREE.Object3D(); faceA.position.set(0, 0.66, 0.66); av.headPivot.add(faceA);
  const hairUp = { messy: 0.5, ponytail: 0.35, short: 0.25, bun: 0.8, spiky: 0.5, none: 0 }[opts.hairStyle || 'messy'] ?? 0.3;
  const top = new THREE.Object3D(); top.position.set(0, 1.31 + hairUp, 0); av.headPivot.add(top);
  setFace(av, face);
  const joints = [av.armL, av.armR, av.legL, av.legR, av.headPivot, av.body];
  const snap = () => joints.map((j) => [j.rotation.x, j.rotation.y, j.rotation.z]).concat([[av.body.position.y, 0, 0]]);
  const apply = (S) => { joints.forEach((j, i) => j.rotation.set(...S[i])); av.body.position.y = S[joints.length][0]; };
  const run = (name, t, once) => {
    av.body.rotation.set(0, 0, 0); av.body.position.set(0, HIP, 0); av.headPivot.rotation.set(0, 0, 0);
    if (av.r15) { av.chest.rotation.set(0, 0, 0); av.chest.scale.set(1, 1, 1); for (const j of [av.elbowL, av.elbowR, av.kneeL, av.kneeR]) j.rotation.set(0, 0, 0); }
    const f = CLIPS[name]; if (f) f(av, t, s, once);
    else if (POSES[name]) { still(av, POSES[name]); breathe(av, t); }
    else throw new Error(`avatar: no clip "${name}" (has: ${CLIP_NAMES.join(', ')})`);
  };
  return {
    root, inner: av.root, av, head: av.headPivot, height, scale: s, handR: av.handR, handL: av.handL, face: faceA, top, armL: av.armL, armR: av.armR, legL: av.legL, legR: av.legR, chest: av.chest, elbowL: av.elbowL, elbowR: av.elbowR, kneeL: av.kneeL, kneeR: av.kneeR,
    clips: CLIP_NAMES,
    /** clip a at time ta; optional clip b at tb mixed by w (0..1). once: reach-type clips play once and hold */
    pose(a, ta, b = null, tb = 0, w = 0, { once = false } = {}) {
      run(a, ta, once); if (!b || w <= 0) return;
      const A = snap(); run(b, tb, once); const B = snap();
      apply(A.map((v, i) => v.map((x, k) => x + (B[i][k] - x) * w)));
    },
    /** body from clip a, arms from clip b (walk while carrying, walk while holding hands) */
    poseArms(a, ta, b, tb = 0) {
      run(b, tb, true); const qa = [av.armL.rotation.clone(), av.armR.rotation.clone()];
      run(a, ta, false); av.armL.rotation.copy(qa[0]); av.armR.rotation.copy(qa[1]);
    },
    /** tilt the head on top of the current pose (pitch > 0 looks down) */
    tiltHead(pitch = 0, yaw = 0) { av.headPivot.rotation.x += pitch; av.headPivot.rotation.y += yaw; },
    /** steady facial expression for the line (no talking mouth, house rule 8) */
    setFace(name) { setFace(av, name); },
  };
}
