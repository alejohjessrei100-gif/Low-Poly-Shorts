// Street kit for the parking-meter short: 1930s cars, Park-O-Meters, horse (2D card), card table, newspaper, ticket, placards.
// Reusable for any 1930s street story.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {LOOK_RAMP as ramp, lookToon} from '../../look/look';   // LOOK

export type V3 = [number, number, number];
export type CarP = {p: V3; ry?: number; col?: string; spin?: number; door?: number; driver?: string};
export type MeterP = {p: V3; flag?: number; coin?: number; rise?: number};
export type Things = {table?: {p: V3; k?: number; chairs?: number[]; lift?: number}; bulb?: {p: V3; k: number}; rope?: [V3, V3]; horse?: {p: V3; dir?: 1 | -1; bob?: number; rope?: V3}; paper?: {p: V3; t: number; ry?: number};
  ticket?: {p: V3; ry?: number; s?: number; hand?: string}; placards?: {p: V3; text: string; tilt?: number}[]; coins?: {p: V3; n: number; t: number; hand?: string}[]};

const toon = lookToon;   // LOOK
const INK = '#241726';
const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const FONT = '"Archivo Black", Impact, sans-serif';

// ---------- painted textures ----------
const meterFace = () => { const c = cv(256, 320), g = c.getContext('2d')!;
  g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, 256, 320);
  g.fillStyle = '#e9e2cc'; g.beginPath(); g.arc(128, 120, 92, Math.PI, 0); g.lineTo(220, 200); g.lineTo(36, 200); g.closePath(); g.fill();
  g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.fillStyle = INK; g.font = `900 30px ${FONT}`; g.textAlign = 'center'; g.fillText('PARK-O-METER', 128, 245); g.font = `900 40px ${FONT}`; g.fillStyle = '#f2c23a'; g.fillText('5¢  1 HR', 128, 295);
  g.strokeStyle = INK; g.lineWidth = 4; for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(128 + Math.cos(a) * 70, 150 + Math.sin(a) * 70); g.lineTo(128 + Math.cos(a) * 84, 150 + Math.sin(a) * 84); g.stroke(); }
  return tex(c); };
const paperTex = () => { const c = cv(512, 640), g = c.getContext('2d')!;
  g.fillStyle = '#efe6d0'; g.fillRect(0, 0, 512, 640); g.fillStyle = INK; g.textAlign = 'center';
  g.font = `900 46px ${FONT}`; g.fillText('THE DAILY NEWS', 256, 62); g.fillRect(24, 78, 464, 6);
  g.font = `900 92px ${FONT}`; ['METER', 'WAR', 'IN COURT!'].forEach((t, i) => { let fs = 92; while (g.measureText(t).width > 470) { fs -= 4; g.font = `900 ${fs}px ${FONT}`; } g.fillText(t, 256, 180 + i * 100); g.font = `900 92px ${FONT}`; });
  g.fillStyle = '#9a917c'; for (let r = 0; r < 9; r++) for (const x0 of [24, 264]) g.fillRect(x0, 470 + r * 18, 224, 8);
  return tex(c); };
const ticketTex = () => { const c = cv(256, 384), g = c.getContext('2d')!;
  g.fillStyle = '#f6efd8'; g.fillRect(0, 0, 256, 384); g.fillStyle = '#b2391f'; g.fillRect(0, 0, 256, 70);
  g.fillStyle = '#fff'; g.font = `900 34px ${FONT}`; g.textAlign = 'center'; g.fillText('TICKET', 128, 48);
  g.fillStyle = INK; g.font = `900 30px ${FONT}`; g.fillText('No. 1', 128, 118); g.fillStyle = '#9a917c'; for (let r = 0; r < 8; r++) g.fillRect(28, 150 + r * 26, 200 - (r % 3) * 30, 10);
  g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(4, 4, 248, 376); return tex(c); };
const placardTex = (t: string) => { const c = cv(512, 256), g = c.getContext('2d')!;
  g.fillStyle = '#f4ecd6'; g.fillRect(0, 0, 512, 256); g.lineWidth = 14; g.strokeStyle = INK; g.strokeRect(7, 7, 498, 242);
  g.fillStyle = '#b2391f'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 110; g.font = `900 ${fs}px ${FONT}`; while (g.measureText(t).width > 460) { fs -= 4; g.font = `900 ${fs}px ${FONT}`; }
  g.fillText(t, 256, 132); return tex(c); };
const cardTex = () => { const c = cv(64, 96), g = c.getContext('2d')!; g.fillStyle = '#fbf7ee'; g.fillRect(0, 0, 64, 96); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(2, 2, 60, 92);
  g.fillStyle = '#b2391f'; g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.fillText('♥', 32, 62); return tex(c); };
const coinTex = () => { const c = cv(128, 128), g = c.getContext('2d')!; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fillStyle = '#d8d8d0'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.fillStyle = '#8a8a82'; g.font = `900 64px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('5', 64, 68); return tex(c); };
/** flat 2D side-view horse (matches the cut-out characters), 512x420, hooves at the bottom */
const horseTex = () => { const c = cv(512, 420), g = c.getContext('2d')!; g.lineJoin = g.lineCap = 'round';
  const f = (col: string, lw = 9) => { g.fillStyle = col; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); };
  const body = '#8a5530', dark = '#5a3420';
  for (const [x, back] of [[150, 1], [190, 0], [345, 1], [385, 0]] as [number, number][]) { g.beginPath(); g.roundRect(x - 13, 230, 26, 170, 12); f(back ? dark : body); g.beginPath(); g.roundRect(x - 16, 388, 32, 24, 6); f('#2a1d18', 6); }
  g.beginPath(); g.moveTo(108, 200); g.bezierCurveTo(120, 280, 120, 330, 80, 360); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 16; g.strokeStyle = dark; g.stroke();   // tail
  g.beginPath(); g.ellipse(265, 205, 160, 72, 0, 0, 7); f(body);
  g.beginPath(); g.moveTo(360, 175); g.lineTo(420, 60); g.lineTo(470, 70); g.lineTo(420, 210); g.closePath(); f(body);   // neck
  g.beginPath(); g.ellipse(455, 85, 50, 30, 0.5, 0, 7); f(body);   // head
  g.beginPath(); g.moveTo(425, 45); g.lineTo(432, 18); g.lineTo(445, 46); g.closePath(); f(body, 6);   // ear
  g.beginPath(); g.moveTo(405, 55); g.bezierCurveTo(380, 110, 370, 150, 360, 185); g.lineWidth = 22; g.strokeStyle = dark; g.stroke();   // mane
  g.beginPath(); g.arc(452, 72, 7, 0, 7); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(495, 100, 4, 0, 7); g.fill();
  g.beginPath(); g.ellipse(250, 170, 60, 22, 0, 0, 7); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill();
  g.beginPath(); g.moveTo(255, 140); g.lineTo(255, 270); g.lineWidth = 8; g.strokeStyle = '#3a2a22'; g.stroke(); g.beginPath(); g.roundRect(215, 125, 90, 40, 10); f('#a8743a', 6);   // saddle
  return tex(c); };

const bulbTex = () => { const c = cv(256, 256), g = c.getContext('2d')!; g.lineJoin = 'round';
  g.fillStyle = 'rgba(255,236,150,.35)'; g.beginPath(); g.arc(128, 104, 112, 0, 7); g.fill();
  g.strokeStyle = '#ffe28a'; g.lineWidth = 10; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(128 + Math.cos(a) * 82, 104 + Math.sin(a) * 82); g.lineTo(128 + Math.cos(a) * 112, 104 + Math.sin(a) * 112); g.stroke(); }
  g.beginPath(); g.arc(128, 100, 58, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(150, 170); g.lineTo(106, 170); g.closePath(); g.fillStyle = '#fff3a8'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.fillStyle = '#9a917c'; g.fillRect(104, 172, 48, 34); g.strokeRect(104, 172, 48, 34); g.beginPath(); g.moveTo(112, 130); g.lineTo(122, 112); g.lineTo(134, 130); g.lineTo(144, 112); g.lineWidth = 5; g.stroke(); return tex(c); };
// ---------- materials (built once) ----------
const MAT = (() => { if (typeof document === 'undefined') return null as any; return {
  body: (c: string) => toon({color: c}, 1), chrome: toon({color: '#d8dde4', emissive: '#30343c'}, 1.5), tire: toon({color: '#26222a'}), white: toon({color: '#efe9dc'}),
  glass: new THREE.MeshBasicMaterial({color: '#9fc4e0', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide}), lamp: new THREE.MeshBasicMaterial({color: new THREE.Color(1.6, 1.45, 1.1)}),
  iron: toon({color: '#2c3a30'}), meterHead: toon({color: '#3a6a48'}, 0.7), face: new THREE.MeshToonMaterial({gradientMap: ramp, map: meterFace()}), flag: toon({color: '#d8342a'}, 0.6),
  wood: toon({color: '#9a6a3a'}), cloth: toon({color: '#2f6f53'}), card: new THREE.MeshBasicMaterial({map: cardTex(), side: THREE.DoubleSide}),
  paper: new THREE.MeshToonMaterial({gradientMap: ramp, map: paperTex(), side: THREE.DoubleSide}), ticket: new THREE.MeshBasicMaterial({map: ticketTex(), side: THREE.DoubleSide}),
  horse: new THREE.MeshBasicMaterial({map: horseTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide}), coin: new THREE.MeshBasicMaterial({map: coinTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide}),
  blob: new THREE.MeshBasicMaterial({color: '#000', transparent: true, opacity: 0.3, depthWrite: false}), stick: toon({color: '#b08a5a'}), skin: toon({color: '#f3d9c0'}), rope: toon({color: '#c9a068'}),
  bulb: new THREE.MeshBasicMaterial({map: bulbTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}),
  placard: new Map<string, THREE.Material>(),
}; })();
const placardMat = (t: string) => { if (!MAT.placard.has(t)) MAT.placard.set(t, new THREE.MeshToonMaterial({gradientMap: ramp, map: placardTex(t), side: THREE.DoubleSide})); return MAT.placard.get(t)!; };
const bodyMats = new Map<string, THREE.Material>(); const bodyMat = (c: string) => { if (!bodyMats.has(c)) bodyMats.set(c, MAT.body(c)); return bodyMats.get(c)!; };

// ---------- geometry ----------
const taper = new THREE.CylinderGeometry(0.6, 1, 1, 20), flare = new THREE.CylinderGeometry(0.45, 1, 1, 20);   // SHAPE: tapered post + flared foot
const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 20), sph = new THREE.SphereGeometry(1, 16, 12), plane = new THREE.PlaneGeometry(1, 1), circ = new THREE.CircleGeometry(1, 24);
/** 1930s sedan side silhouette (x = length, y = up), extruded across the width */
const WIN: [number, number][] = [[-0.9, 1.14], [-0.8, 1.5], [0.22, 1.5], [0.58, 1.14]];
const carGeo = (() => {
  const sh = new THREE.Shape(); // SHAPE: forward attitude - raked windshield, roof crowned toward the back, hood dipping to the grille, rounded tail (was level)
  const P: [number, number][] = [[-2.0, 0.42], [-2.08, 0.64], [-1.98, 0.9], [-1.66, 1.05], [-1.14, 1.1], [-1.0, 1.54], [-0.8, 1.68], [-0.2, 1.69], [0.26, 1.65], [0.42, 1.58], [0.8, 1.1], [1.7, 1.0], [2.04, 0.86], [2.1, 0.62], [2.02, 0.42]];
  sh.moveTo(...P[0]); for (const q of P.slice(1)) sh.lineTo(...q); sh.closePath();
  const hole = new THREE.Path(); hole.moveTo(...WIN[0]); for (const q of WIN.slice(1)) hole.lineTo(...q); hole.closePath(); sh.holes.push(hole);   /* see-through cabin */
  const g = new THREE.ExtrudeGeometry(sh, {depth: 1.42, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 6}); g.translate(0, 0, -0.71); return g; })();
const winGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(...WIN[0]); for (const q of WIN.slice(1)) sh.lineTo(...q); sh.closePath(); return new THREE.ShapeGeometry(sh); })();
const fenderGeo = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);

export const Car: React.FC<{c: CarP}> = ({c}) => {
  const col = bodyMat(c.col ?? '#7a2f2a'), sp = c.spin ?? 0;
  return (
    <group position={c.p} rotation={[0, c.ry ?? 0, 0]}>
      <mesh geometry={circ} material={MAT.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[2.3, 0.95, 1]} />
      <mesh geometry={carGeo} material={col} castShadow receiveShadow />
      {[-0.8, 0.8].map((z) => <mesh key={'w' + z} geometry={winGeo} material={MAT.glass} position={[0, 0, z]} />)}
      {[-1.3, 1.32].map((x) => [-0.78, 0.78].map((z) => <group key={x + '_' + z}>
        <mesh geometry={fenderGeo} material={col} position={[x, 0.5, z * 1.03]} scale={[0.62, 0.42, 0.26]} castShadow />
        <group position={[x, 0.36, z * 1.06]} rotation={[Math.PI / 2, sp, 0]}>
          <mesh geometry={cyl} material={MAT.tire} scale={[0.36, 0.22, 0.36]} castShadow /><mesh geometry={cyl} material={MAT.white} scale={[0.25, 0.23, 0.25]} />
          <mesh geometry={cyl} material={MAT.chrome} scale={[0.13, 0.24, 0.13]} /><mesh geometry={box} material={MAT.tire} scale={[0.04, 0.245, 0.2]} />
        </group></group>))}
      {[-0.8, 0.8].map((z) => <mesh key={z} geometry={box} material={MAT.tire} position={[0, 0.34, z * 1.02]} scale={[2.2, 0.05, 0.22]} />)}
      {[-2.16, 2.16].map((x) => <mesh key={x} geometry={box} material={MAT.chrome} position={[x, 0.46, 0]} scale={[0.08, 0.1, 1.7]} castShadow />)}
      <mesh geometry={box} material={MAT.chrome} position={[2.1, 0.76, 0]} scale={[0.06, 0.32, 0.62]} />
      {[-0.5, 0.5].map((z) => <group key={z}><mesh geometry={sph} material={MAT.chrome} position={[2.0, 1.02, z]} scale={0.13} /><mesh geometry={circ} material={MAT.lamp} position={[2.12, 1.02, z]} rotation={[0, Math.PI / 2, 0]} scale={0.1} /></group>)}
      <mesh geometry={sph} material={MAT.chrome} position={[2.06, 1.1, 0]} scale={[0.05, 0.08, 0.05]} />
      {c.driver && <group position={[-0.25, 0, -0.3]}>
        <mesh geometry={sph} material={MAT.skin} position={[0, 1.3, 0]} scale={[0.15, 0.17, 0.15]} />
        <mesh geometry={cyl} material={bodyMat(c.driver)} position={[0, 1.44, 0]} scale={[0.13, 0.1, 0.13]} /><mesh geometry={cyl} material={bodyMat(c.driver)} position={[0, 1.4, 0]} scale={[0.22, 0.02, 0.22]} />
        <mesh geometry={box} material={bodyMat(c.driver)} position={[0, 1.02, 0]} scale={[0.3, 0.36, 0.4]} /></group>}
    </group>
  );
};

/** Park-O-Meter on a post: flag 0..1 = red "expired" flag up; coin 0..1 = nickel dropping into the slot; rise 0..1 = pop-in */
export const Meter: React.FC<{c: MeterP}> = ({c}) => {
  const fl = c.flag ?? 0, r = c.rise ?? 1;
  return (
    <group position={c.p} scale={[1, r, 1]}>
      <mesh geometry={circ} material={MAT.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={0.22} />
      <mesh geometry={taper} material={MAT.iron} position={[0, 0.55, 0]} scale={[0.042, 1.1, 0.042]} castShadow />
      <mesh geometry={flare} material={MAT.iron} position={[0, 0.05, 0]} scale={[0.085, 0.1, 0.085]} castShadow />
      <group position={[0, 1.22, 0]}>
        <mesh geometry={box} material={MAT.meterHead} scale={[0.22, 0.28, 0.16]} castShadow />
        <mesh geometry={cyl} material={MAT.meterHead} position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.11, 0.16, 0.11]} castShadow />
        <mesh geometry={plane} material={MAT.face} position={[0, 0.02, 0.0805]} scale={[0.2, 0.26, 1]} />
        <mesh geometry={plane} material={MAT.face} position={[0, 0.02, -0.0805]} rotation={[0, Math.PI, 0]} scale={[0.2, 0.26, 1]} />
        <mesh geometry={box} material={MAT.iron} position={[0.0, 0.0, 0.083]} rotation={[0, 0, -1.2 + 2.0 * (1 - fl) * (c.coin !== undefined ? Math.min(1, c.coin * 1.4) : 1) * (fl > 0 ? 0 : 1)]} scale={[0.006, 0.07, 0.004]} />
        <mesh geometry={box} material={MAT.iron} position={[0.07, 0.1, 0.0]} scale={[0.04, 0.012, 0.03]} />
        {fl > 0.01 && <group position={[0.0, -0.02, 0]} rotation={[0, 0, -Math.PI / 2 * (1 - fl)]} scale={0.3 + 0.7 * Math.min(1, fl * 1.6)}>
          <mesh geometry={box} material={MAT.flag} position={[0, 0.17, 0.09]} scale={[0.012, 0.18, 0.012]} />
          <mesh geometry={box} material={MAT.flag} position={[0.05, 0.24, 0.09]} scale={[0.1, 0.07, 0.006]} />
        </group>}
        {c.coin !== undefined && c.coin > 0 && c.coin < 1 && <mesh geometry={plane} material={MAT.coin} position={[0.07, 0.34 - c.coin * 0.24, 0.02]} rotation={[0, Math.PI / 2 - 0.3, 0]} scale={0.06} />}
      </group>
    </group>
  );
};

export const ThingsView: React.FC<{t: Things; f: number; cam: THREE.Vector3}> = ({t, f, cam}) => {
  const face = (p: V3) => Math.atan2(cam.x - p[0], cam.z - p[2]);
  return (<>
    {t.table && <group position={t.table.p} scale={t.table.k ?? 1}>
      <mesh geometry={circ} material={MAT.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={0.8} /><group position={[0, t.table.lift ?? 0, 0]}>
      <mesh geometry={box} material={MAT.cloth} position={[0, 0.74, 0]} scale={[0.9, 0.04, 0.9]} castShadow />
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => <mesh key={i} geometry={box} material={MAT.wood} position={[x, 0.37, z]} scale={[0.04, 0.74, 0.04]} />)}
      </group>{[[0, 0.75], [0.75, 0], [0, -0.75], [-0.75, 0]].map(([x, z], i) => (t.table!.chairs ?? [0, 1, 2, 3]).includes(i) && <group key={'c' + i} position={[x, 0, z]} rotation={[0, Math.atan2(-x, -z), 0]}>
        <mesh geometry={box} material={MAT.wood} position={[0, 0.45, 0]} scale={[0.42, 0.04, 0.4]} castShadow />
        <mesh geometry={box} material={MAT.wood} position={[0, 0.72, -0.19]} scale={[0.42, 0.5, 0.04]} castShadow />
        {[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([a, b], j) => <mesh key={j} geometry={box} material={MAT.wood} position={[a, 0.22, b]} scale={[0.03, 0.45, 0.03]} />)}
      </group>)}
      {(t.table.lift ?? 0) === 0 && Array.from({length: 7}, (_, i) => <mesh key={'k' + i} geometry={plane} material={MAT.card} position={[Math.cos(i * 1.7) * 0.22, 0.765 + i * 0.001, Math.sin(i * 2.3) * 0.22]} rotation={[-Math.PI / 2, 0, i * 0.9]} scale={[0.09, 0.13, 1]} />)}
    </group>}
    {t.horse && <group position={t.horse.p}>
      <mesh geometry={circ} material={MAT.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[1.2, 0.45, 1]} />
      <mesh geometry={plane} material={MAT.horse} position={[0, 0.98 + (t.horse.bob ?? 0), 0]} rotation={[0, face(t.horse.p), 0]} scale={[2.4 * (t.horse.dir ?? 1), 1.97, 1]} />
    </group>}
    {t.horse?.rope && (() => { const h = t.horse!, th = face(h.p), d = h.dir ?? 1; const end: V3 = [h.p[0] + Math.cos(th) * 0.86 * d, 1.42 + (h.bob ?? 0), h.p[2] - Math.sin(th) * 0.86 * d];
      return <ThingsView t={{rope: [h.rope!, end]}} f={f} cam={cam} />; })()}
    {t.paper && (() => { const u = Math.min(1, t.paper.t), s = 0.15 + 0.85 * (1 - Math.pow(1 - u, 3));
      return <mesh geometry={plane} material={MAT.paper} position={t.paper.p} rotation={[0, (t.paper.ry ?? 0) + (1 - u) * 9.4, (1 - u) * 1.2]} scale={[0.8 * s, 1.0 * s, 1]} />; })()}
    {t.bulb && t.bulb.k > 0 && <mesh geometry={plane} material={MAT.bulb} position={t.bulb.p} rotation={[0, face(t.bulb.p), 0]} scale={0.5 * t.bulb.k} />}
    {t.rope && (() => { const a = new THREE.Vector3(...t.rope[0]), b = new THREE.Vector3(...t.rope[1]), m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.12, 0));
      return [[a, m], [m, b]].map(([p, q], i) => { const d = q.clone().sub(p), L = d.length(); return <mesh key={'r' + i} geometry={cyl} material={MAT.rope} position={p.clone().lerp(q, 0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())} scale={[0.012, L, 0.012]} />; }); })()}
    {t.ticket && <mesh geometry={plane} material={MAT.ticket} position={t.ticket.p} rotation={[0, t.ticket.ry ?? face(t.ticket.p), 0]} scale={[0.14 * (t.ticket.s ?? 1), 0.21 * (t.ticket.s ?? 1), 1]} />}
    {t.placards?.map((q, i) => <group key={'pl' + i} position={q.p} rotation={[0, face(q.p), q.tilt ?? Math.sin(f * 0.25 + i) * 0.12]}>
      <mesh geometry={box} material={MAT.stick} position={[0, -0.45, -0.01]} scale={[0.04, 0.9, 0.02]} />
      <mesh geometry={plane} material={placardMat(q.text)} scale={[0.7, 0.35, 1]} />
    </group>)}
    {t.coins?.map((c, i) => Array.from({length: c.n}, (_, j) => <mesh key={i + '_' + j} geometry={plane} material={MAT.coin} position={[c.p[0] + (j - (c.n - 1) / 2) * 0.05, c.p[1] + Math.sin(c.t * 6 + j) * 0.01, c.p[2]]} rotation={[0, face(c.p), 0]} scale={0.05} />))}
  </>);
};
