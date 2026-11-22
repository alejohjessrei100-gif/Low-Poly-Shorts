// Polish for upgraded episodes: rim light that follows the subject, soft contact shadows under feet, depth of field
// focused on the subject, and dust puffs for landings. Use with createCore(..., { look: 'blender' }) + C.allowBlur(true).
import * as THREE from 'three';

const BLOB = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(10,8,20,.75)'); gr.addColorStop(0.55, 'rgba(10,8,20,.35)'); gr.addColorStop(1, 'rgba(10,8,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

export function polish(C) {
  const { scene, camera, bokeh } = C;
  const rim = new THREE.DirectionalLight(0xdfe8ff, 2.4); scene.add(rim, rim.target);
  const blobs = new Map();
  return {
    rim,
    /** rim light from behind the subject (relative to the camera), a little above */
    rimAt(subject, k = 1, color = 0xdfe8ff) { const d = subject.clone().sub(camera.position).setY(0).normalize(); rim.position.copy(subject).addScaledVector(d, 4).add(new THREE.Vector3(0, 2.6, 0)); rim.target.position.copy(subject); rim.intensity = 2.4 * k; rim.color.set(color); },
    /** soft blob shadow under a character (root = their root group); fades as they leave the ground */
    contact(key, root, floorY = 0, size = 0.9) {
      let m = blobs.get(key); if (!m) { m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; m.userData.noAO = true; scene.add(m); blobs.set(key, m); }
      m.visible = root.visible; const h = Math.max(0, root.position.y - floorY); m.position.set(root.position.x, floorY + 0.012, root.position.z); m.scale.setScalar(size * (1 - Math.min(0.5, h * 0.8))); m.material.opacity = 1 - Math.min(0.7, h * 1.5);
    },
    hideContacts() { blobs.forEach((m) => (m.visible = false)); },
    /** depth of field focused on a point: range = in-focus depth (m), aperture/maxblur = how soft the rest gets */
    dof(point, { range = 0.8, aperture = 0.012, maxblur = 0.006, on = true } = {}) { bokeh.enabled = on; if (!on) return; bokeh.uniforms.focus.value = camera.position.distanceTo(point); bokeh.uniforms.range.value = range; bokeh.uniforms.aperture.value = aperture; bokeh.uniforms.maxblur.value = maxblur; },
  };
}

/** dust puff ring for landings and impacts: set(pos, u) with u 0..1 over its life */
export function dust(scene, n = 10, color = 0xd8d0c0) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.8 });
  const balls = Array.from({ length: n }, () => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), m); b.visible = false; b.userData.noAO = true; scene.add(b); return b; });
  return {
    set(p, u, size = 0.12) { balls.forEach((b, i) => { b.visible = u > 0 && u < 1; const a = i / n * Math.PI * 2; const r = size * (1.2 + u * 5); b.position.set(p.x + Math.cos(a) * r, p.y + 0.04 + u * size * 1.5 * (0.5 + (i % 3) * 0.3), p.z + Math.sin(a) * r); b.scale.setScalar(size * (0.5 + u * 1.2) * (1 - u * 0.6)); }); m.opacity = 0.8 * (1 - u); },
    hide() { balls.forEach((b) => (b.visible = false)); },
  };
}
