// Solids v2 matching the 3-sided enclosed Caribbean stadium.
type Box = [number, number, number, number, number, number, string];
export const SOLIDS: Box[] = [
  [-18.0, 18.0, 0, 5.6, -16.0, -11.2, 'back_grandstand'],
  [-22.5, -17.8, 0, 4.7, -12.0, 10.0, 'left_stand'],
  [17.8, 22.5, 0, 4.7, -12.0, 10.0, 'right_stand'],
  [-16.0, -15.8, 0, 2.2, -2.4, 2.4, 'bar_goal_back'],
  [15.8, 16.0, 0, 2.2, -2.4, 2.4, 'grn_goal_back'],
];
export const LOGIC_SOLIDS: Box[] = [...SOLIDS];
export const GATE_WAIVERS: {key: string; kind: string; why: string}[] = [];
