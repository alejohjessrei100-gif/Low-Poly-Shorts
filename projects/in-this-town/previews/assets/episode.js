import { createCore } from '../../kit/core.js';
import { character, loadModel } from '../../kit/assets.js';
const C = createCore(document.getElementById('c'), { look: 'blender' });
const { THREE, scene, camera, composer, setLight } = C;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x9a9ab0 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const L = 'abcdefghijklmnopqr'.split(''); const chars = [];
for (let i = 0; i < L.length; i++) { const c = await character(scene, 'blocky_' + L[i], 1.75); c.root.position.set((i % 6) * 1.6 - 4, 0, -Math.floor(i / 6) * 3); chars.push(c); }
const g = await loadModel('blocky_a'); window.__info = () => ({ anims: g.animations.map((a) => a.name + ':' + a.duration.toFixed(2)) });
window.SHOT_TIMES = L.map((_, i) => i); window.END = L.length;
window.renderAt = (t) => { const i = Math.min(L.length - 1, Math.floor(t)); setLight('day', [0, 0, -3]); chars.forEach((c, j) => { c.pose('idle', 0.5); c.root.visible = j === i; c.root.position.set(0, 0, 0); }); camera.position.set(0.6, 1.2, 3.2); camera.lookAt(0, 0.9, 0); camera.fov = 40; camera.updateProjectionMatrix(); composer.render(); };
window.READY = true;
