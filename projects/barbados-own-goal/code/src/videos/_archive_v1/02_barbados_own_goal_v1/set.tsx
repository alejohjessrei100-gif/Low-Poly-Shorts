// Set wiring for 02_barbados_own_goal: mounts the 1.25x voiceover + Caribbean Cup 3D toon stadium.
import React from 'react';
import * as THREE from 'three';
import type {Tod} from '../../engine/look/look';
import {Stadium} from '../../engine/kits/stadium/pitch';
import type {Stage} from './stage';

export const AUDIO: {voice: string | null; bed: string | null} = {
  voice: '02_barbados_own_goal/voice.mp3',
  bed: null,
};

export const useSetData = () => null;

type P = {d: null; f: number; st: Stage; cam: THREE.Vector3; vel: (THREE.Vector3 | null)[]; tod: Tod};

export const SetBefore: React.FC<P> = ({st}) => (
  <Stadium score={st.score} ball={st.ball} boards={st.boards} />
);

export const SetAfter: React.FC<P> = () => null;
