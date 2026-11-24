// Light story for 02_barbados_own_goal: bright tropical stadium afternoon -> golden extra-time glow.
import type {Tod} from '../../engine/look/look';
export const TOD: [number, Tod][] = [[0, 'day'], [45.05, 'golden']];
export const INTERIOR = {
  shots: [] as string[],
  centre: [0, 0] as [number, number],
  pool: [0, 0, 0] as [number, number, number],
  lamp: [0, 2.3, 0] as [number, number, number],
  lampPt: [0, 2.25, 0] as [number, number, number],
  cool: [0, 2.2, 0] as [number, number, number],
  warm: [0, 2.7, 0] as [number, number, number],
};
export const MOOD = (_f: number) => 0;
