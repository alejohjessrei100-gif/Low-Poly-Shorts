// Applies kit/autofix.mjs corrections at render time. An episode:
//   await loadFixes(new URL('./autofix.json', import.meta.url));   // missing file = no fixes
//   in put():      offsetActor(a.name, a.wrap.position)            // nudges an actor for the current shot
//   in renderAt(): setShot(i); ...act...; applyCamera(i, camera, lookVec)
// window.AUTOFIX = { shots: { "<i>": { cam: [dx,dy,dz], look: [dx,dy,dz], fov: d, actors: { name: [dx,dy,dz] } } } }
let cur = -1;
const NONE = { shots: {} };

export async function loadFixes(url) {
  try { const r = await fetch(url); window.AUTOFIX = r.ok ? await r.json() : NONE; } catch { window.AUTOFIX = NONE; }
  if (!window.AUTOFIX.shots) window.AUTOFIX.shots = {};
}
export function setShot(i) { cur = i; }
const fix = (i = cur) => (window.AUTOFIX && window.AUTOFIX.shots[String(i)]) || null;

export function offsetActor(name, pos) {
  const f = fix(); const d = f && f.actors && f.actors[name];
  if (d) { pos.x += d[0]; pos.y += d[1]; pos.z += d[2]; }
}
/** camera already placed by the shot; look = THREE.Vector3 target. Calls camera.lookAt. */
export function applyCamera(i, camera, look) {
  const f = fix(i);
  if (f && f.cam) { camera.position.x += f.cam[0]; camera.position.y += f.cam[1]; camera.position.z += f.cam[2]; }
  if (f && f.look) { look.x += f.look[0]; look.y += f.look[1]; look.z += f.look[2]; }
  if (f && f.fov) { camera.fov += f.fov; camera.updateProjectionMatrix(); }
  camera.lookAt(look);
}
