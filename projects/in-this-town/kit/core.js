// Renderer, sky, lights, post-processing (DoF + measured colour grade). 1080x1920.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// RENDER_SCALE (set before import) renders smaller, e.g. 2/3 = 720x1280 for phones
const SCALE = globalThis.RENDER_SCALE || 1;
export const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);

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
  sun.shadow.mapSize.set(2048, 2048);
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
  // in-focus zone: nothing within +-range of the focus distance blurs (the stock shader blurs everything
  // in proportion to its distance from the focus plane, which softened the subject's own face)
  bokeh.uniforms.range = { value: 1.6 };
  bokeh.materialBokeh.fragmentShader = bokeh.materialBokeh.fragmentShader
    .replace('uniform float focus;', 'uniform float focus;\nuniform float range;')
    .replace('float factor = ( focus + viewZ );', 'float d0 = focus + viewZ; float factor = sign(d0) * max(0.0, abs(d0) - range);');
  bokeh.materialBokeh.needsUpdate = true;
  composer.addPass(bokeh);
  // grade from the style bible: lifted, purple-tinted blacks (black point ~0.16), pastel saturation
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, lift: { value: new THREE.Vector3(0.075, 0.06, 0.12) }, sat: { value: 1.3 },
      cctv: { value: 0 }, flash: { value: 0 }, time: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 lift; uniform float sat; uniform float cctv; uniform float flash; uniform float time; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*43.1) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        float l = dot(c.rgb, vec3(.2126,.7152,.0722));
        vec3 s = mix(vec3(l), c.rgb, sat);
        vec3 o = lift + s*(1.-lift);
        // security-camera look: green-grey, noise, scanlines, vignette
        float g = l*1.15 + (h(floor(vUv*vec2(360.,640.)))-.5)*.16;
        g *= .82 + .18*step(.5, fract(vUv.y*320.));
        vec2 q = vUv-.5; g *= 1. - dot(q,q)*1.6;
        o = mix(o, vec3(g*.82, g*.95, g*.82), cctv);
        o = mix(o, vec3(1.), flash);
        gl_FragColor = vec4(o, c.a); }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // lighting presets: the reference goes bright pastel by day and navy-blue at night
  const P = {
    day: { top: 0x3d9bf0, bot: 0xc4e6ff, hemiS: 0xcfe6ff, hemiG: 0x9a86d0, hemi: 1.0, sun: 3.0, sunC: 0xfff0d8, fog: 0xbfe2ff, exp: 1.0 },
    morning: { top: 0x5aa8f0, bot: 0xffe2c8, hemiS: 0xffe6d0, hemiG: 0x9a86d0, hemi: 1.0, sun: 2.8, sunC: 0xffd9a8, fog: 0xffe2c8, exp: 1.0 },
    dusk: { top: 0x3b4fa0, bot: 0xffa071, hemiS: 0xffb08a, hemiG: 0x5a4a90, hemi: 0.8, sun: 2.4, sunC: 0xff9a5c, fog: 0xd88a80, exp: 0.95 },
    night: { top: 0x070d2a, bot: 0x1d3270, hemiS: 0x4a68c0, hemiG: 0x221a50, hemi: 0.95, sun: 0.55, sunC: 0x9fb8ff, fog: 0x15245a, exp: 1.05 },
    indoor: { top: 0x3d9bf0, bot: 0xc4e6ff, hemiS: 0xfff1de, hemiG: 0xa08fd0, hemi: 1.2, sun: 1.6, sunC: 0xfff0d8, fog: 0xbfe2ff, exp: 1.0 },
    indoorNight: { top: 0x070d2a, bot: 0x1d3270, hemiS: 0x5a7ad0, hemiG: 0x2a2060, hemi: 1.15, sun: 0.35, sunC: 0x9fb8ff, fog: 0x101a40, exp: 1.2 },
    plant: { top: 0x070d2a, bot: 0x1d3270, hemiS: 0x7a9ae8, hemiG: 0x3a2a6a, hemi: 1.5, sun: 0.4, sunC: 0x9fb8ff, fog: 0x0e1638, exp: 1.25 },
  };
  function setLight(name, center = [0, 0, 0], sunDir = [-18, 40, -30]) {
    const p = P[name];
    sky.material.uniforms.top.value.set(p.top); sky.material.uniforms.bot.value.set(p.bot);
    hemi.color.set(p.hemiS); hemi.groundColor.set(p.hemiG); hemi.intensity = p.hemi;
    sun.color.set(p.sunC); sun.intensity = p.sun;
    sun.target.position.set(...center);
    sun.position.set(center[0] + sunDir[0], center[1] + sunDir[1], center[2] + sunDir[2]);
    scene.fog.color.set(p.fog);
    renderer.toneMappingExposure = p.exp;
    sky.position.set(center[0], 0, center[2]);
  }

  return { THREE, renderer, scene, camera, composer, bokeh, sun, hemi, sky, grade, setLight };
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
