// Solids for the logic & framing checkers (stadium bleachers, back wall, goal back frames).
type Box = [number, number, number, number, number, number, string];
export const SOLIDS: Box[] = [
  [-17.5, 17.5, 0, 4.4, -15.7, -11.1, 'bleachers'],
  [-16.0, -15.8, 0, 2.2, -2.4, 2.4, 'bar_goal_back'],
  [15.8, 16.0, 0, 2.2, -2.4, 2.4, 'grn_goal_back'],
];
export const LOGIC_SOLIDS: Box[] = [...SOLIDS];
export const GATE_WAIVERS: {key: string; kind: string; why: string}[] = [];
