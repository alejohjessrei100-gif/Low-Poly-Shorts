// BASIC look for the free kit: flat toon materials + one simple light rig + plain sky.
// (The premium light/colour/grade layer is NOT included — this file only makes the engine run and look clean.)
import * as THREE from 'three';

/** experiment switch kept for compatibility (always off in the kit) */
export const X = (_k: string) => false;
export const V5 = false;
export type Tod = 'day' | 'golden' | 'workshop' | 'indoor';

/** 3-step hard toon ramp: shadow / mid / lit */
export const LOOK_RAMP = (() => {
  const d = new Uint8Array([110, 110, 130, 255, 190, 190, 200, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();

/** one simple rig: warm key sun from the front-side (~40° up), cool sky fill, a little ambient */
export const LOOK_LIGHT = {sun: '#ffe6c2', sunI: 3.85, sunOff: [9, 10, 8] as [number, number, number], skyFill: '#7ca8e0', groundFill: '#b58d63', hemiI: 0.78, amb: '#fff8ee', ambI: 0.18};

type Sky = {stops: [number, string][]; cap: string; skyline: [string, string]; cloud: string; cloudShade: string; glow?: [number, string]};
const SKY: Sky = {stops: [[0, '#4a86d8'], [0.6, '#9cc4ee'], [1, '#e8eff4']], cap: '#4a86d8', skyline: ['rgba(160,184,220,.7)', 'rgba(140,164,206,.75)'], cloud: 'rgba(255,255,255,.95)', cloudShade: 'rgba(170,182,220,.45)'};
export const LOOK_SKY: Record<Tod, Sky> = {day: SKY, golden: SKY, workshop: SKY, indoor: SKY};

/** colours are used as given (no harmonising) */
export const lookPal = (c: string) => c;
export const lookColor = (c: THREE.ColorRepresentation) => new THREE.Color(c);
export const lookHex = (c: string) => '#' + new THREE.Color(c).getHexString();
export const lookToon = (o: THREE.MeshToonMaterialParameters, _gloss = 0) => new THREE.MeshToonMaterial({...o, gradientMap: LOOK_RAMP});

/** ground colours + shadow-map size used by the kits */
export const LOOK_PREM = {shadow: {extent: 20, mapSize: 2048, dist: 40, far: 90}, asphalt: '#5c5e6c', sidewalk: '#b9b3a8'};
export const todAt = (_f: number): Tod => 'day';
