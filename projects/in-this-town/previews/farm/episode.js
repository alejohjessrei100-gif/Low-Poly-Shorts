// lineup of the farm-town CC0 models (one per still)
import { createCore } from '../../kit/core.js';
import { prop, character } from '../../kit/assets.js';
const C = createCore(document.getElementById('c'), { look: 'blender' });
const { THREE, scene, camera, composer, setLight } = C;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x9a9ab0 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const M = [['tractor', 4], ['truck', 5.5], ['truck_flat', 6], ['garbage_truck', 7], ['tree_pine', 8], ['tree_pine_tall', 12], ['tree_autumn', 7], ['tree_fat', 7], ['bush_large', 2], ['pumpkin', 0.6], ['log', 2], ['stump', 0.8], ['rock_large', 3], ['flower_red', 0.4], ['satellite_dish', 2], ['generator', 1.5], ['carrot', 0.3], ['watermelon', 0.4], ['shiba', 0.9], ['blob_bird', 0.5], ['fluffy_flyer', 0.6], ['worker', 1.75]];
const objs = [];
for (const [m, s] of M) objs.push(await prop(scene, m, s, { by: ['tree_pine', 'tree_pine_tall', 'tree_autumn', 'tree_fat', 'worker'].includes(m) ? 'height' : 'length' }));
const ref = await character(scene, 'blocky_b', 1.75);
window.SHOT_TIMES = M.map((_, i) => i); window.END = M.length;
window.renderAt = (t) => { const i = Math.min(M.length - 1, Math.floor(t)); setLight('day', [0, 0, 0]); objs.forEach((o, j) => { o.visible = j === i; o.position.set(0, 0, 0); });
  ref.root.position.set(-M[i][1] * 0.6 - 0.6, 0, 0.5); ref.pose('idle', 0.3);
  const d = Math.max(3, M[i][1] * 1.6); camera.position.set(d * 0.5, d * 0.45, d); camera.lookAt(-M[i][1] * 0.2, M[i][1] * 0.25, 0); camera.fov = 45; camera.updateProjectionMatrix(); composer.render(); };
window.READY = true;
