// BASIC render composition for the free kit: simple light rig + characters + set + captions.
// (The premium version adds ink outlines, grading, AO, bloom, depth of field — not included.)
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {LOOK_LIGHT, LOOK_SKY} from '../look/look';
import {TOTAL, warp} from '../core/clock';
import {stage, velocities} from '../core/staging';
import {camAt, applyCam, flashAt, Cam} from '../camera/camera';
import {Character} from '../chars/rig';
import {WORDS, CAPS} from '@story/timeline';
import {AUDIO, SetBefore, SetAfter, useSetData} from '@story/set';
export {TOTAL};

const Rig: React.FC<{c: Cam}> = ({c}) => { const {camera} = useThree(); camera.layers.enableAll(); applyCam(camera as THREE.PerspectiveCamera, c); return null; };   // characters live on a separate layer (NOINK)

/** one warm key sun (casts shadows) + cool sky fill + a little ambient — see references/07_BASIC_LIGHT.md */
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

/** captions: 1-3 words, Montserrat Black uppercase + heavy outline + 3-frame pop-in, centred at 70 % height */
const Caption: React.FC<{f: number; width: number; height: number}> = ({f, width, height}) => {
  const t = f / 30; let ci = -1;
  for (let i = 0; i < CAPS.length; i++) if (WORDS[CAPS[i][0]][1] <= t) ci = i;
  if (ci < 0) return null;
  const [a, b] = CAPS[ci], start = WORDS[a][1], end = WORDS[b][2] + 0.6, next = CAPS[ci + 1] ? WORDS[CAPS[ci + 1][0]][1] : 1e9;
  if (t > Math.min(end, next)) return null;
  const age = Math.max(0, (t - start) * 30);
  const sc = age < 3 ? 0.88 + 0.16 * (age / 3) : age < 6 ? 1.04 - 0.04 * ((age - 3) / 3) : 1.0;
  const PUNCH = new Set(['OWN', 'NET', 'BLASTED', 'LAUGHING', 'BOTH', 'BROKEN', 'DOUBLE', 'JACKPOT', 'BURIED', 'BLOCKED', 'SCORED', 'FOUR', 'TWO', 'SCRAPPED', 'FOREVER']);
  const tokens = WORDS.slice(a, b + 1).map((w) => w[0].toUpperCase()), k = width / 1080;
  return (<>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');`}</style>
    <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.7, transform: `translateY(-50%) scale(${sc.toFixed(3)})`, textAlign: 'center',
      fontFamily: '"Montserrat", "Arial Black", Impact, sans-serif', fontWeight: 900, letterSpacing: `${1.5 * k}px`, lineHeight: 1.08,
      fontSize: 78 * k, WebkitTextStroke: `${14 * k}px #140c18`, paintOrder: 'stroke fill',
      textShadow: `0 ${6 * k}px ${14 * k}px rgba(0,0,0,0.55)`, padding: `0 ${56 * k}px`}}>
      {tokens.map((w, i) => {
        const clean = w.replace(/[^A-Z0-9]/g, '');
        return <span key={i} style={{color: PUNCH.has(clean) ? '#f2b234' : '#ffffff'}}>{w}{i < tokens.length - 1 ? ' ' : ''}</span>;
      })}
    </div>
  </>);
};

export const Video: React.FC = () => {
  const fr = useCurrentFrame(), {width, height} = useVideoConfig(), rt = fr / 30, f = warp(rt) * 30;
  const d = useSetData(), st = stage(f), cc = camAt(rt), cam = cc.p, vel = velocities(f, st), fl = flashAt(rt);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {AUDIO.voice && <Audio src={staticFile(AUDIO.voice)} />}
      {AUDIO.bed && <Audio src={staticFile(AUDIO.bed)} />}
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 38, near: 0.05, far: 450}}>
        <color attach="background" args={[LOOK_SKY.day.cap]} />
        <Rig c={cc} />
        <Lights at={cc.anchor} />
        <SetBefore d={d} f={f} st={st} cam={cam} vel={vel} tod="day" />
        {st.people.map((p, i) => <Character key={i} c={p} f={f} cam={cam} vel={vel[i]} />)}
        <SetAfter d={d} f={f} st={st} cam={cam} vel={vel} tod="day" />
      </ThreeCanvas>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(16,10,22,0.32) 100%)'}} />
      {fl > 0 && <AbsoluteFill style={{backgroundColor: '#fff', opacity: fl}} />}
      <Caption f={fr} width={width} height={height} />
    </AbsoluteFill>
  );
};
