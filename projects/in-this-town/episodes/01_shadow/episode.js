// Episode 01 "Your Shadow Is Free": 5.5 s look test (shots 1-4). Deterministic: window.renderAt(t).
import { createCore, smooth, lerp, clamp01 } from '../../kit/core.js';
import { makeAvatar, pose, setFace } from '../../kit/avatar.js';
import { buildTown } from '../../kit/town.js';

const C = createCore(document.getElementById('c'));
const { THREE, scene, camera, composer, bokeh } = C;
buildTown(scene);

const WORDS = await (await fetch('./words.json')).json();
const SIDE = 0.3; // sidewalk height

// Leo: our narrator (teal hoodie, messy brown hair, yellow backpack)
const leo = makeAvatar({ shirt: 0x3fb6a8, pants: 0x2f4a8a, hair: 0x5a3a22, backpack: 0xf4c542 });
leo.root.position.set(6.6, SIDE, 0);
leo.root.rotation.y = -Math.PI / 2; // faces the road (-x)
scene.add(leo.root);
leo.root.traverse((o) => { if (o.isMesh) o.castShadow = false; }); // his real shadow IS the shadow-person

// the shadow-person: lies flat from Leo's feet, peels up, faces +z when standing
const sh = makeAvatar({ shadowMode: true, backpack: 1 });
const shRoot = new THREE.Group();
shRoot.add(sh.root);
scene.add(shRoot);
const SH_FEET = new THREE.Vector3(6.6, SIDE + 0.01, 0.6);  // flat: starts at Leo's feet
const SH_STAND = new THREE.Vector3(6.6, SIDE, 3.4);        // where it stands up

// ---------------------------------------------------------------- shots (time ranges from words.json)
// measured style: every shot is one continuous, mostly linear (un-eased) camera move
const SHOTS = [
  { t: [0, 0.94], from: [0, 25, 36], to: [0, 21.5, 25], look: [0, 9, -110], fov: 46, dof: null },
  { t: [0.94, 2.0], from: [-1.6, 2.9, 9.4], to: [-0.6, 2.75, 8.6], look: [6.6, 2.4, 1.8], fov: 50, dof: [11.0, 0.006] },
  { t: [2.0, 3.6], from: [-3.6, 4.4, 1.3], to: [-2.7, 4.35, 1.7], look: [6.6, 4.6, 2.6], fov: 60, dof: [10.0, 0.006] },
  { t: [3.6, 5.6], from: [3.4, 5.2, -6.3], to: [3.7, 5.1, -5.6], look: [6.6, 4.5, 0.5], fov: 42, dof: [6.7, 0.018] },
];

function wordAt(t) { return WORDS.words.find(([s, e]) => t >= s && t < e); }

function animate(t) {
  // ---- Leo
  const breathe = Math.sin(t * 2.4) * 0.03;
  leo.body.position.y = 2 + breathe;
  leo.root.rotation.y = -Math.PI / 2;
  if (t < 1.55) { pose(leo, 'idle'); setFace(leo, 'smile'); }
  else if (t < 2.2) { pose(leo, 'idle', 'flinch', smooth((t - 1.55) / 0.5) * 0.35); setFace(leo, 'scared'); }
  else if (t < 3.6) { pose(leo, 'idle', 'flinch', 0.35 + 0.65 * smooth((t - 2.2) / 0.3)); setFace(leo, 'scared'); }
  else {
    pose(leo, 'flinch', 'idle', smooth((t - 3.6) / 0.35));
    leo.root.rotation.y = -2.5; // turns 3/4 to camera for the close-up
    leo.headPivot.rotation.y = 0.12 * Math.sin(t * 3);
    const w = wordAt(t);
    setFace(leo, w && Math.floor((t - w[0]) * 9) % 2 === 0 ? 'scared_talk' : 'scared');
  }

  // ---- shadow-person
  sh.body.rotation.set(0, 0, 0);
  sh.body.position.y = 2;
  if (t < 3.6) {
    const k = smooth((t - 1.5) / 0.5);              // peel off the ground
    shRoot.position.lerpVectors(SH_FEET, SH_STAND, k);
    shRoot.rotation.set(Math.PI / 2 * (1 - k), -Math.PI / 2 * smooth((t - 1.9) / 0.3), 0, 'YXZ');
    sh.root.scale.set(1, 1, 0.04 + 0.96 * k);
    if (t < 2.0) pose(sh, 'idle');
    else if (t < 2.25) pose(sh, 'idle', 'crouch', smooth((t - 2.0) / 0.25));
    else if (t < 3.05) {                              // backflip
      const u = (t - 2.25) / 0.8;
      sh.body.position.y = 2 + 4.2 * 4 * u * (1 - u);
      sh.body.rotation.z = 2 * Math.PI * smooth(u);
      pose(sh, 'crouch', 'tuck', Math.min(1, u * 3) * (u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25));
    } else if (t < 3.2) pose(sh, 'crouch');
    else pose(sh, 'crouch', 'tada', smooth((t - 3.2) / 0.2));
  } else {                                            // background: waving at the camera
    shRoot.position.set(7.6, SIDE, 6.0);
    shRoot.rotation.set(0, -2.82, 0);
    sh.root.scale.set(1, 1, 1);
    pose(sh, 'wave');
    sh.armR.rotation.z = 0.25 + 0.45 * Math.sin(t * 11);
  }
}

function shotAt(t) { return SHOTS.find((s) => t >= s.t[0] && t < s.t[1]) || SHOTS[SHOTS.length - 1]; }

window.renderAt = (t) => {
  animate(t);
  const s = shotAt(t);
  const k = clamp01((t - s.t[0]) / (s.t[1] - s.t[0]));
  camera.position.set(...s.from.map((v, i) => lerp(v, s.to[i], k)));
  camera.fov = s.fov; camera.updateProjectionMatrix();
  camera.lookAt(...s.look);
  if (s.dof) { bokeh.enabled = true; bokeh.uniforms.focus.value = s.dof[0]; bokeh.uniforms.aperture.value = s.dof[1]; bokeh.uniforms.maxblur.value = 0.012; }
  else bokeh.enabled = false;
  composer.render();
};
window.SHOTS = SHOTS;
window.READY = true;
