// Acting layer for R15 classic avatars (kit/rig.js with r15: true). Key poses with easing, anticipation and
// overshoot, follow-through (springs on head/arms), idle life (breathing, weight shift, glances), walk/run cycles
// with contact/down/passing/up and grounded feet, squash & stretch. Pure function of time (deterministic).
//   const A = actor(c); A.keys([[0, 'idle'], [0.5, 'shockRecoil', { antic: 0.12 }], ...]); A.update(t);
import * as THREE from 'three';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeIO = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const TAU = Math.PI * 2;

// joints: chest/head/arm*/leg* [x,y,z]; elbow*/knee* bend (x); hip = body height offset (units); lean = body [x,y,z]
const J0 = { chest: [0, 0, 0], head: [0, 0, 0], armL: [0.04, 0, -0.07], armR: [0.04, 0, 0.07], elbowL: -0.15, elbowR: -0.15, legL: [0, 0, -0.03], legR: [0, 0, 0.03], kneeL: 0.04, kneeR: 0.04, hip: 0, lean: [0, 0, 0] };
export const POSE15 = {
  idle: {},
  handsOnHips: { armL: [0.25, 0, -0.75], armR: [0.25, 0, 0.75], elbowL: -1.75, elbowR: -1.75, chest: [-0.05, 0, 0] },
  crossArms: { armL: [-0.75, -0.35, -0.15], armR: [-0.75, 0.35, 0.15], elbowL: -1.75, elbowR: -1.75, chest: [-0.06, 0, 0], head: [-0.05, 0, 0] },
  point: { armR: [-1.5, 0.1, 0.05], elbowR: -0.05, chest: [0.04, -0.12, 0], head: [0, -0.1, 0], armL: [0.1, 0, -0.1] },
  shrug: { armL: [-0.35, 0, -0.55], armR: [-0.35, 0, 0.55], elbowL: -1.35, elbowR: -1.35, chest: [-0.04, 0, 0], head: [0.05, 0, 0.16] },
  shockRecoil: { chest: [-0.28, 0, 0], head: [-0.18, 0, 0], armL: [-1.95, 0, -0.55], armR: [-1.95, 0, 0.55], elbowL: -1.15, elbowR: -1.15, legL: [0.12, 0, -0.08], legR: [-0.22, 0, 0.08], kneeL: 0.18, kneeR: 0.3, hip: -0.15, lean: [-0.05, 0, 0] },
  crouch: { chest: [0.3, 0, 0], head: [-0.2, 0, 0], armL: [0.35, 0, -0.3], armR: [0.35, 0, 0.3], elbowL: -0.35, elbowR: -0.35, legL: [-0.55, 0, -0.05], legR: [-0.55, 0, 0.05], kneeL: 1.05, kneeR: 1.05 },
  airStretch: { chest: [-0.12, 0, 0], head: [-0.15, 0, 0], armL: [-2.7, 0, -0.45], armR: [-2.7, 0, 0.45], elbowL: -0.15, elbowR: -0.15, legL: [0.15, 0, -0.06], legR: [0.1, 0, 0.06], kneeL: 0.35, kneeR: 0.2 },
  flailUp: { chest: [-0.15, 0, 0], head: [-0.2, 0, 0], armL: [-2.6, 0, -0.9], armR: [-2.4, 0, 1.0], elbowL: -0.6, elbowR: -0.4, legL: [0.1, 0, -0.1], legR: [-0.15, 0, 0.1], kneeL: 0.15, kneeR: 0.25 },
  pickup: { chest: [0.85, 0, 0], head: [-0.35, 0, 0], armL: [-0.75, 0, -0.08], armR: [-0.85, 0, 0.08], elbowL: -0.25, elbowR: -0.2, legL: [-0.55, 0, -0.06], legR: [-0.45, 0, 0.06], kneeL: 1.05, kneeR: 0.9 },
  presentPalm: { armR: [-0.9, 0.1, 0.35], elbowR: -1.0, armL: [0.1, 0, -0.1], chest: [0, -0.15, 0], head: [0, 0.12, 0.1] },
  facepalm: { armR: [-2.3, 0.4, 0.3], elbowR: -2.2, chest: [0.15, 0, 0], head: [0.3, 0, 0] },
  yell: { chest: [-0.15, 0, 0], head: [-0.2, 0, 0], armL: [-0.4, 0, -0.5], armR: [-0.4, 0, 0.5], elbowL: -1.2, elbowR: -1.2, legL: [-0.15, 0, -0.1], legR: [0.15, 0, 0.1] },
  slump: { chest: [0.3, 0, 0], head: [0.35, 0, 0], armL: [0.1, 0, -0.04], armR: [0.1, 0, 0.04], elbowL: -0.05, elbowR: -0.05, kneeL: 0.1, kneeR: 0.1, hip: -0.05 },
};
const pose = (name, o = {}) => { const p = JSON.parse(JSON.stringify(J0)); for (const [k, v] of Object.entries({ ...POSE15[name], ...o })) p[k] = v; return p; };
const mix = (a, b, k) => { const o = {}; for (const key of Object.keys(a)) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k); return o; };
const add = (a, b, k = 1) => { const o = {}; for (const key of Object.keys(a)) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => v + (b[key][i] - J0[key][i]) * k) : a[key] + (b[key] - J0[key]) * k; return o; };

/** walk/run pose at cycle phase p (0..1 = two steps). run = 0..1 */
export function gaitPose(p, run = 0) {
  const A = lerp(0.42, 0.85, run), s = Math.sin(TAU * p), c = Math.cos(TAU * p);
  const hipL = A * s, hipR = -A * s;
  const swingL = Math.max(0, c), swingR = Math.max(0, -c); // knee lifts while the leg swings forward (peak at passing)
  const kneeL = 0.12 + lerp(0.85, 1.6, run) * swingL * swingL, kneeR = 0.12 + lerp(0.85, 1.6, run) * swingR * swingR;
  const armA = lerp(0.75, 1.15, run);
  return {
    chest: [lerp(0.04, 0.22, run), -0.14 * s, 0], head: [lerp(-0.02, -0.15, run), 0.12 * s, 0],
    armL: [-hipL * armA, 0, -0.1], armR: [-hipR * armA, 0, 0.1], elbowL: -0.3 - lerp(0.35, 1.1, run) * Math.max(0, hipL / A), elbowR: -0.3 - lerp(0.35, 1.1, run) * Math.max(0, hipR / A),
    legL: [hipL, 0, -0.03], legR: [hipR, 0, 0.03], kneeL, kneeR,
    hip: -0.04 * Math.sin(2 * TAU * (p - 0.175)) + (run ? 0.18 * run * Math.max(0, Math.sin(2 * TAU * (p - 0.1))) : 0), lean: [lerp(0.02, 0.15, run), 0.08 * s, 0.03 * c],
  };
}

/** damped spring integrated from 0 to t (deterministic); target(t) gives the goal value */
function springTrack(target, t, { w = 16, z = 0.5, dt = 1 / 240, t0 = 0 } = {}) {
  let x = target(t0), v = 0;
  for (let tt = t0; tt < t; tt += dt) { const g = target(tt); const a = w * w * (g - x) - 2 * z * w * v; v += a * dt; x += v * dt; }
  return x;
}

export function actor(c, { breathe = 1, sway = 1, glance = 1, seed = 1 } = {}) {
  const av = c.av; if (!av.r15) throw new Error('actor() needs an r15 avatar');
  let keys = [[0, 'idle', {}]], walk = null, squash = [], glances = [];
  { let s = (seed * 7919 + 17) % 2147483647; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); let tt = 1 + r(); while (tt < 300) { glances.push([tt, (r() - 0.5) * 0.7, (r() - 0.5) * 0.2]); tt += 2 + r() * 2.5; } }
  /** target pose at time t from the key list, with anticipation (a small opposite move) before flagged keys */
  function keyed(t) {
    let i = 0; for (let j = 0; j < keys.length; j++) if (keys[j][0] <= t) i = j;
    const [t0, name, o] = keys[i], prev = i ? keys[i - 1] : keys[i];
    const A = pose(prev[1], prev[2]), B = pose(name, o), dur = o.dur ?? 0.22;
    let P = mix(A, B, easeIO((t - t0) / dur));
    const nx = keys[i + 1];
    if (nx && nx[2].antic && t > nx[0] - nx[2].antic) { const k = Math.sin(Math.PI * 0.5 * clamp01((t - (nx[0] - nx[2].antic)) / nx[2].antic)); const N = pose(nx[1], nx[2]); P = mix(P, mix(B, N, -0.3), k); } // wind up the other way first
    return P;
  }
  return {
    av, c,
    /** key poses: [[time, poseName, {dur, antic, ...joint overrides}], ...] */
    keys(list) { keys = list.map(([t, n, o]) => [t, n, o || {}]).sort((a, b) => a[0] - b[0]); return this; },
    /** walking: [t0, t1, from(Vector3), to(Vector3), run 0..1]; the feet never slide (stride drives the phase) */
    walk(w) { walk = w; return this; },
    /** squash & stretch hits: [[time, amount(+stretch/-squash), dur]] */
    squash(list) { squash = list; return this; },
    /** world position along the walk at time t (or null) */
    walkPos(t) { if (!walk) return null; const [t0, t1, a, b] = walk; return a.clone().lerp(b, clamp01((t - t0) / (t1 - t0))); },
    update(t) {
      let P = keyed(t);
      // walking: phase from distance travelled / stride, so feet stay planted
      if (walk && t >= walk[0] - 0.15 && t <= walk[1] + 0.2) {
        const [t0, t1, a, b, run = 0] = walk; const dist = a.distanceTo(b) * clamp01((t - t0) / (t1 - t0)), stride = c.scale * lerp(3.4, 5.2, run);
        const inW = easeIO((t - t0 + 0.15) / 0.3) * (1 - easeIO((t - t1) / 0.2));
        P = mix(P, gaitPose(dist / stride, run), inW);
      }
      // follow-through: head and arms lag behind the body through springs
      if (!walk || t < walk[0] - 0.15 || t > walk[1] + 0.2) {
        const KS = ['armL', 'armR', 'head', 'chest'], flat = (q) => KS.flatMap((k) => q[k]);
        const w = 15, z = 0.45, dt = 1 / 240; let tt = Math.max(0, t - 1.2); const x = flat(keyed(tt)), v = x.map(() => 0);
        for (; tt < t; tt += dt) { const g = flat(keyed(tt)); for (let i = 0; i < x.length; i++) { const a = w * w * (g[i] - x[i]) - 2 * z * w * v[i]; v[i] += a * dt; x[i] += v[i] * dt; } }
        KS.forEach((k, j) => { P[k] = P[k].map((val, i) => lerp(val, x[j * 3 + i], 0.65)); });
      }
      // idle life: breathing, weight shift, glances
      const br = Math.sin(TAU * t / 3.3), sh = Math.sin(TAU * t / 5.2 + seed);
      let gy = 0, gx = 0; for (const [gt, y, x] of glances) { if (gt > t) break; const u = t - gt; if (u < 1.6) { const k = Math.sin(Math.PI * clamp01(u / 1.6)) ** 0.6; gy = y * k * glance; gx = x * k * glance; } }
      // apply
      const R = (o, a) => o.rotation.set(a[0], a[1], a[2]);
      R(av.chest, [P.chest[0] + br * 0.012 * breathe, P.chest[1], P.chest[2]]); av.chest.scale.set(1 + br * 0.006 * breathe, 1 + br * 0.014 * breathe, 1 + br * 0.01 * breathe);
      R(av.headPivot, [P.head[0] + gx, P.head[1] + gy, P.head[2]]);
      R(av.armL, [P.armL[0] - br * 0.02, P.armL[1], P.armL[2] - br * 0.015]); R(av.armR, [P.armR[0] - br * 0.02, P.armR[1], P.armR[2] + br * 0.015]);
      av.elbowL.rotation.set(P.elbowL, 0, 0); av.elbowR.rotation.set(P.elbowR, 0, 0);
      R(av.legL, P.legL); R(av.legR, P.legR); av.kneeL.rotation.set(P.kneeL, 0, 0); av.kneeR.rotation.set(P.kneeR, 0, 0);
      // grounding: the longer leg touches the floor (legs are 1 + 1 units)
      const ext = (h, k) => Math.cos(h) + Math.cos(h + k);
      const ground = Math.max(ext(P.legL[0], P.kneeL), ext(P.legR[0], P.kneeR));
      av.body.position.set(sh * 0.035 * sway, ground + P.hip, 0); av.body.rotation.set(P.lean[0], P.lean[1], P.lean[2] + sh * 0.012 * sway);
      // squash & stretch around the feet (volume kept)
      let q = 0; for (const [st, amt, d] of squash) { const u = (t - st) / d; if (u >= 0 && u < 1) q += amt * Math.sin(Math.PI * u) * (1 - u * 0.3); }
      const sy = 1 + q, sxz = 1 / Math.sqrt(sy); c.inner.scale.set(c.scale * sxz, c.scale * sy, c.scale * sxz);
    },
  };
}

// ---------------------------------------------------------------- camera: eased keys, punch-ins, shake
export const camEase = easeIO;
/** cam keys [[t, pos[], look[], fov], ...]; shakes [[t, amp, dur]]; punch [[t, fovDelta, dur]] */
export function cameraRig(camera) {
  return {
    at(t, keys, { shakes = [], punch = [] } = {}) {
      let i = 0; for (let j = 0; j < keys.length; j++) if (keys[j][0] <= t) i = j;
      const a = keys[i], b = keys[Math.min(keys.length - 1, i + 1)], k = b === a ? 0 : easeIO((t - a[0]) / (b[0] - a[0]));
      const P = a[1].map((v, j) => lerp(v, b[1][j], k)), L = a[2].map((v, j) => lerp(v, b[2][j], k));
      let fov = lerp(a[3] || 50, b[3] || 50, k);
      for (const [pt, d, dur] of punch) { const u = (t - pt) / dur; if (u >= 0 && u < 1) fov -= d * (u < 0.15 ? easeIO(u / 0.15) : 1 - easeIO((u - 0.15) / 0.85) * 0.6); else if (u >= 1) fov -= d * 0.4; }
      let sx = 0, sy = 0; for (const [st, amp, dur] of shakes) { const u = (t - st) / dur; if (u >= 0 && u < 1) { const e = amp * Math.pow(1 - u, 2); sx += Math.sin(t * 71) * e + Math.sin(t * 37) * e * 0.5; sy += Math.sin(t * 53 + 1) * e; } }
      camera.position.set(P[0] + sx, P[1] + sy, P[2]); camera.fov = fov; camera.updateProjectionMatrix();
      return new THREE.Vector3(L[0] + sx * 0.6, L[1] + sy * 0.6, L[2]);
    },
  };
}
