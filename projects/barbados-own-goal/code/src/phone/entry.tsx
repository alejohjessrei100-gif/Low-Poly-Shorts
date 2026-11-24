// Browser (phone) entry for the Barbados episode: the same engine, no Remotion. window.renderAt(t) draws one frame into #c.
import React from 'react';
import * as THREE from 'three';
import {createRoot, flushSync, _roots, extend} from '@react-three/fiber';
import {LOOK_LIGHT, LOOK_SKY} from '../engine/look/look';
import {TOTAL, warp} from '../engine/core/clock';
import {stage, velocities} from '../engine/core/staging';
import {camAt, applyCam, flashAt, Cam} from '../engine/camera/camera';
import {Character} from '../engine/chars/rig';
import {WORDS, CAPS, VOICE_END} from '@story/timeline';
import {SetBefore, SetAfter, useSetData} from '@story/set';


extend({...THREE} as any);
const Rig: React.FC<{c: Cam}> = ({c}) => { const {camera} = (window as any).__useThree(); camera.layers.enableAll(); applyCam(camera as THREE.PerspectiveCamera, c); return null; };
import {useThree} from '@react-three/fiber';
(window as any).__useThree = useThree;

const Lights: React.FC<{at: THREE.Vector3}> = ({at}) => {
  const L = LOOK_LIGHT, target = React.useMemo(() => new THREE.Object3D(), []);
  target.position.set(at.x, 0, at.z);
  return (<>
    <primitive object={target} />
    <ambientLight intensity={L.ambI} color={L.amb} />
    <hemisphereLight args={[L.skyFill, L.groundFill, L.hemiI]} />
    <directionalLight position={[at.x + L.sunOff[0], L.sunOff[1], at.z + L.sunOff[2]]} target={target} intensity={L.sunI} color={L.sun} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-0.0004} />
  </>);
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const f = warp(t) * 30, d = useSetData(), st = stage(f), cc = camAt(t), cam = cc.p, vel = velocities(f, st);
  return (<>
    <color attach="background" args={[LOOK_SKY.day.cap]} />
    <Rig c={cc} />
    <Lights at={cc.anchor} />
    <SetBefore d={d} f={f} st={st} cam={cam} vel={vel} tod="day" />
    {st.people.map((p, i) => <Character key={i} c={p} f={f} cam={cam} vel={vel[i]} />)}
    <SetAfter d={d} f={f} st={st} cam={cam} vel={vel} tod="day" />
  </>);
};

// ---- captions + vignette + flash, drawn on the page's 2D canvas (same look as engine/render/Video.tsx)
const PUNCH = new Set(['OWN', 'NET', 'BLASTED', 'LAUGHING', 'BOTH', 'BROKEN', 'DOUBLE', 'JACKPOT', 'BURIED', 'BLOCKED', 'SCORED', 'FOUR', 'TWO', 'SCRAPPED', 'FOREVER']);
(window as any).drawOverlay = (ctx: CanvasRenderingContext2D, rt: number, W: number, H: number) => {
  // vignette: transparent to 58 %, then rgba(16,10,22,.32) at the corners
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(W / 2 * Math.SQRT2, H / 2 * Math.SQRT2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.58, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(16,10,22,0.32)');
  ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  const fl = flashAt(rt); if (fl > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, fl); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const t = rt; let ci = -1;
  for (let i = 0; i < CAPS.length; i++) if (WORDS[CAPS[i][0]][1] <= t) ci = i;
  if (ci < 0) return;
  const [a, b] = CAPS[ci], start = WORDS[a][1], end = WORDS[b][2] + 0.6, next = CAPS[ci + 1] ? WORDS[CAPS[ci + 1][0]][1] : 1e9;
  if (t > Math.min(end, next)) return;
  const age = Math.max(0, (t - start) * 30);
  const sc = age < 3 ? 0.88 + 0.16 * (age / 3) : age < 6 ? 1.04 - 0.04 * ((age - 3) / 3) : 1.0;
  const k = W / 1080, size = 78 * k, tokens = WORDS.slice(a, b + 1).map((w: any) => String(w[0]).toUpperCase());
  ctx.save(); ctx.font = `900 ${size}px Montserrat, "Arial Black", Impact, sans-serif`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  (ctx as any).letterSpacing = `${1.5 * k}px`;
  const space = ctx.measureText(' ').width, widths = tokens.map((w: string) => ctx.measureText(w).width), maxW = W - 112 * k;
  let lines: number[][] = [tokens.map((_: any, i: number) => i)];
  const lineW = (ix: number[]) => ix.reduce((s, i) => s + widths[i], 0) + space * (ix.length - 1);
  if (lineW(lines[0]) > maxW && tokens.length > 1) { const m = Math.ceil(tokens.length / 2); lines = [lines[0].slice(0, m), lines[0].slice(m)]; }
  const lh = size * 1.08; ctx.translate(W / 2, H * 0.7); ctx.scale(sc, sc);
  lines.forEach((ix, li) => {
    const y = (li - (lines.length - 1) / 2) * lh; let x = -lineW(ix) / 2;
    for (const i of ix) {
      ctx.textAlign = 'left'; ctx.lineWidth = 14 * k; ctx.strokeStyle = '#140c18'; ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14 * k; ctx.shadowOffsetY = 6 * k;
      ctx.strokeText(tokens[i], x, y); ctx.shadowColor = 'transparent';
      ctx.fillStyle = PUNCH.has(tokens[i].replace(/[^A-Z0-9]/g, '')) ? '#f2b234' : '#ffffff'; ctx.fillText(tokens[i], x, y);
      x += widths[i] + space;
    }
  });
  ctx.restore();
};

// ---- boot
const canvas = document.getElementById('c') as HTMLCanvasElement;
const scale = (globalThis as any).RENDER_SCALE || 1, W = Math.round(1080 * scale), H = Math.round(1920 * scale);
canvas.width = W; canvas.height = H;
const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=block'; document.head.appendChild(link);
try { await Promise.race([document.fonts.load('900 40px Montserrat'), new Promise((r) => setTimeout(r, 4000))]); } catch {}
const root = createRoot(canvas);
root.configure({frameloop: 'never', dpr: 1, shadows: true, camera: {fov: 38, near: 0.05, far: 450}, size: {width: W, height: H, top: 0, left: 0, updateStyle: false} as any, gl: {preserveDrawingBuffer: true, antialias: true} as any});
const draw = (t: number) => {
  flushSync(() => { root.render(<Scene t={t} />); });
  const s = (_roots as any).get(canvas).store.getState(); s.advance(performance.now() / 1000, true);
};
(window as any).renderAt = (t: number) => draw(Math.min(t, VOICE_END - 1 / 30));
(window as any).END = VOICE_END;
draw(0); draw(0);
(window as any).READY = true;
