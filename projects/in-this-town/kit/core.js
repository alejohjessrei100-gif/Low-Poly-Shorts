// Renderer, sky, lights, post-processing (DoF + measured colour grade). 1080x1920.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const W = 1080, H = 1920;

export function createCore(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbfe2ff, 150, 460);

  // gradient sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x3d9bf0) }, bot: { value: new THREE.Color(0xc4e6ff) } },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vp; void main(){ float h = clamp(normalize(vp).y*1.6, 0., 1.); gl_FragColor = vec4(mix(bot, top, pow(h, .8)), 1.); }',
  }));
  scene.add(sky);

  // lights: warm sun key, sky-blue / purple ambient (measured shadow hue = purple, highlights warm)
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x9a86d0, 1.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.0);
  sun.position.set(-18, 40, -30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera;
  sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 140;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 900);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.0, maxblur: 0.0 });
  composer.addPass(bokeh);
  // grade from the style bible: lifted, purple-tinted blacks (black point ~0.16), pastel saturation
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, lift: { value: new THREE.Vector3(0.075, 0.06, 0.12) }, sat: { value: 1.3 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 lift; uniform float sat; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        float l = dot(c.rgb, vec3(.2126,.7152,.0722));
        vec3 s = mix(vec3(l), c.rgb, sat);
        gl_FragColor = vec4(lift + s*(1.-lift), c.a); }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  return { THREE, renderer, scene, camera, composer, bokeh, sun, hemi, sky };
}

// canvas texture helper
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
