// Staging for 02_barbados_own_goal (Barbados 4-2 Grenada, 1994 Caribbean Cup).
// Pure deterministic function of frame f: positions, actions, expressions, ball arc, scoreboard & story boards.
import {TOTAL, shotAt, W, cl, ease, pop, type V3} from '../../engine/core/clock';
import {autoGaze} from '../../engine/core/staging';
import {PersonP, seq} from '../../engine/chars/rig';
import type {CarP, MeterP, Things} from '../../engine/kits/downtown/street';
import type {CartP} from '../../engine/kits/grocery/store';
import type {BallState, ScoreState, StoryBoards} from '../../engine/kits/stadium/pitch';

export {TOTAL, shotAt};
export type Stage = {
  people: PersonP[];
  carts: CartP[];
  extra: string[];
  cars: CarP[];
  meters: MeterP[];
  things: Things;
  clock: number;
  nStoryCars: number;
  score: ScoreState;
  ball: BallState;
  boards: StoryBoards;
};

const lx = (a: number, b: number, t: number) => a + (b - a) * ease(t);

/** Parabolic soccer ball trajectory between two XZ points with bounce/arc height */
function ballArc(a: [number, number], b: [number, number], t: number, h = 0.9, spin0 = 0): BallState {
  const u = cl(t);
  const x = a[0] + (b[0] - a[0]) * u;
  const z = a[1] + (b[1] - a[1]) * u;
  const y = 0.24 + 4 * h * u * (1 - u);
  return {p: [x, y, z], spin: spin0 + u * 12};
}

export function stage(f: number): Stage {
  const s = shotAt(f), lf = s.lf, len = Math.max(1, s.len);
  const P: PersonP[] = [];
  let score: ScoreState = {bar: 2, grn: 1, clock: "87'", banner: 'BARBADOS NEEDS +2'};
  let ball: BallState = {p: [0, 0.24, 0], spin: 0};
  const boards: StoryBoards = {};

  switch (s.name) {
    // 1. HOOK (0.00 - 4.18 s): Sealy blasts the ball into his own net past Stoute
    case 'hook': {
      const kickF = W('hook', 'blasted'); // ~f65
      const tKick = cl((lf - kickF) / 26);
      const sx = lx(-8.5, -10.4, cl(lf / Math.max(1, kickF)));
      P.push({
        who: 'sealy',
        p: [sx, 0, 0.4],
        ...seq(lf, [
          [0, 'walk', 'smirk'],
          [kickF - 8, 'flex', 'angry'],
          [kickF + 4, 'proud', 'smirk'],
        ]),
        gaze: [-14.5, 1.0, 0],
      });
      P.push({
        who: 'stoute',
        p: [-13.4, 0, -0.4],
        ...seq(lf, [
          [0, 'idle', 'worried'],
          [kickF + 6, 'shrug', 'shock'],
        ]),
        gaze: [sx, 1.0, 0.4],
      });
      P.push({who: 'gren1', p: [-5.8, 0, -1.6], ...seq(lf, [[0, 'idle', 'neutral'], [kickF + 10, 'point', 'surprised']]), gaze: [-14.2, 1.0, 0]});
      P.push({who: 'referee', p: [-6.8, 0, -4.6], ...seq(lf, [[0, 'idle', 'neutral'], [kickF + 10, 'shrug', 'shock']]), gaze: [-14.2, 1.0, 0]});
      ball = lf < kickF
        ? {p: [sx - 0.55, 0.24, 0.35], spin: lf * 0.25}
        : ballArc([sx - 0.55, 0.35], [-15.1, 0.1], tKick, 1.05, lf * 0.25);
      score = lf < kickF + 16
        ? {bar: 2, grn: 1, clock: "87'", banner: '3 MINUTES LEFT'}
        : {bar: 2, grn: 2, clock: "87'", banner: 'OWN GOAL!!', highlight: true};
      break;
    }

    // 2. LAUGH (4.18 - 10.21 s): Crowd freezes, Grenada stares then laughs at Sealy
    case 'laugh': {
      const fStare = W('laugh', 'stared');
      const fLaugh = W('laugh', 'laughing');
      // Sideline crowd spectators (safe from bleachers z=-11.1)
      P.push({who: 'woman', p: [-3.2, 0, -8.8], act: 'shrug', expr: 'shock', gaze: [0, 1, 0]});
      P.push({who: 'youngman', p: [-1.4, 0, -8.8], act: 'point', expr: 'surprised', gaze: [0, 1, 0]});
      P.push({who: 'grandma', p: [0.6, 0, -8.8], act: 'shrug', expr: 'worried', gaze: [0, 1, 0]});
      P.push({who: 'oldman', p: [2.4, 0, -8.8], act: 'think', expr: 'shock', gaze: [0, 1, 0]});

      // Grenada trio staring then laughing
      P.push({who: 'gren1', p: [-1.6, 0, 1.0], ...seq(lf, [[0, 'idle', 'surprised'], [fStare, 'point', 'smirk'], [fLaugh, 'cheer', 'grin']]), gaze: [3.0, 1.0, 1.2]});
      P.push({who: 'gren2', p: [0.0, 0, 0.2], ...seq(lf, [[0, 'shrug', 'surprised'], [fStare, 'point', 'happy'], [fLaugh, 'bounce', 'grin']]), gaze: [3.0, 1.0, 1.2]});
      P.push({who: 'gren3', p: [1.5, 0, 1.2], ...seq(lf, [[0, 'idle', 'surprised'], [fStare, 'cross', 'smug'], [fLaugh, 'cheer', 'happy']]), gaze: [3.0, 1.0, 1.2]});
      P.push({who: 'sealy', p: [3.6, 0, 1.4], act: 'cross', expr: 'smug', gaze: 'cam'});
      ball = {p: [-0.8, 0.24, 2.2], spin: 0};
      score = {bar: 2, grn: 2, clock: "87'", banner: 'TIED 2 - 2!'};
      break;
    }

    // 3. CHAOS TEASE (10.21 - 17.62 s): Grenada sprints toward their own goal; Barbados defends both ends
    case 'chaos': {
      const fSprint = W('chaos', 'sprinted');
      const fBoth = W('chaos', 'both');
      const uRun = cl((lf - fSprint + 10) / 85);
      // Grenada players sprint RIGHT toward their own keeper (+x)
      const g1x = lx(-1.5, 9.5, uRun);
      const g2x = lx(0.5, 10.8, uRun);
      P.push({who: 'gren1', p: [g1x, 0, 1.2], ...seq(lf, [[0, 'lookSide', 'surprised'], [fSprint - 10, 'walk', 'angry']]), pace: 1.7});
      P.push({who: 'gren2', p: [g2x, 0, -1.0], ...seq(lf, [[0, 'lookSide', 'shock'], [fSprint - 10, 'walk', 'angry']]), pace: 1.8});
      P.push({who: 'grenGk', p: [13.4, 0, 0.0], ...seq(lf, [[0, 'idle', 'neutral'], [fSprint + 15, 'shrug', 'shock']]), gaze: [g2x, 1, -1]});

      // Barbados splits: Sealy & Stoute guard LEFT goal, Thorne & Bajan1 sprint RIGHT to guard Grenada's goal!
      P.push({who: 'stoute', p: [-13.2, 0, 0.0], act: 'flex', expr: 'angry', gaze: [0, 1, 0]});
      P.push({who: 'sealy', p: [-10.2, 0, 0.8], act: 'flex', expr: 'proud', gaze: [0, 1, 0]});
      const tx = lx(1.0, 11.4, cl((lf - fSprint) / 80));
      const bx = lx(2.5, 11.8, cl((lf - fSprint) / 85));
      P.push({who: 'thorne', p: [tx, 0, 2.0], ...seq(lf, [[0, 'walk', 'worried'], [fBoth, 'flex', 'angry']]), pace: 1.8});
      P.push({who: 'bajan1', p: [bx, 0, -2.4], ...seq(lf, [[0, 'walk', 'worried'], [fBoth, 'flex', 'angry']]), pace: 1.7});
      ball = {p: [g1x + 0.6, 0.24, 1.1], spin: lf * 0.5};
      score = {bar: 2, grn: 2, clock: "88'", banner: 'DEFENDING BOTH NETS!', highlight: true};
      break;
    }

    // 4. RULE SETUP (17.62 - 23.66 s): Barbados had to win by 2; leading 2-1 meant going home
    case 'rule': {
      const fHome = W('rule', 'home');
      P.push({who: 'coach', p: [-2.4, 0, 0.4], ...seq(lf, [[0, 'talk', 'worried'], [fHome - 20, 'point', 'angry']]), pointUp: true, gaze: [0, 4.2, -11]});
      P.push({who: 'thorne', p: [-0.4, 0, 1.0], ...seq(lf, [[0, 'think', 'worried'], [fHome - 10, 'slump', 'sad']]), gaze: [-2.4, 1, 0.4]});
      P.push({who: 'bajan1', p: [1.4, 0, 0.8], ...seq(lf, [[0, 'idle', 'worried'], [fHome - 10, 'tired', 'sad']]), gaze: [-2.4, 1, 0.4]});
      P.push({who: 'sealy', p: [3.2, 0, 0.6], ...seq(lf, [[0, 'think', 'neutral'], [fHome - 5, 'eureka', 'smirk']]), gaze: 'cam'});
      ball = {p: [0.4, 0.24, 2.3], spin: 0};
      score = {bar: 2, grn: 1, clock: "84'", banner: '2-1 = ELIMINATED!'};
      break;
    }

    // 5. BROKEN RULE (23.66 - 31.89 s): Rulebook sign + Golden Jackpot Ticket + Sealy eureka
    case 'broken': {
      const fDouble = W('broken', 'double');
      const fTicket = W('broken', 'ticket');
      const rScale = pop(cl(lf / 14));
      const tScale = lf >= fTicket - 10 ? pop(cl((lf - fTicket + 10) / 14)) : 0.001;
      boards.ruleboard = {p: [-1.4, 0, -1.6], ry: 0.12, scrapped: false, scale: rScale};
      if (lf >= fTicket - 10) boards.ticket = {p: [2.2, 0, -1.4], ry: -0.14, scale: tScale};
      P.push({
        who: 'sealy',
        p: [0.3, 0, 1.2],
        ...seq(lf, [
          [0, 'point', 'smirk'],
          [fDouble - 8, 'eureka', 'grin'],
          [fTicket, 'present', 'proud'],
        ]),
        pointUp: true,
        gaze: 'cam',
      });
      P.push({who: 'referee', p: [-3.4, 0, 0.8], act: 'shrug', expr: 'neutral', gaze: [-1.4, 1.8, -1.6]});
      ball = {p: [0.3, 0.24, 2.2], spin: 0};
      score = {bar: 2, grn: 1, clock: "86'", banner: 'ET GOLDEN GOAL = x2', highlight: true};
      break;
    }

    // 6. OWN GOAL SEQUENCE (31.89 - 37.87 s): Rule of three — Pass, Pass back, Buried in own net!
    case 'owngoal': {
      const fPass1 = W('owngoal', 'passed');
      const fBack = W('owngoal', 'back');
      const fBuried = W('owngoal', 'buried');
      P.push({
        who: 'sealy',
        p: [-9.2, 0, 0.5],
        ...seq(lf, [
          [0, 'idle', 'smirk'],
          [fPass1, 'present', 'smirk'],
          [fBack, 'idle', 'smug'],
          [fBuried - 4, 'flex', 'grin'],
          [fBuried + 12, 'proud', 'smug'],
        ]),
        gaze: [-13.0, 1.0, -0.2],
      });
      P.push({
        who: 'stoute',
        p: [-12.8, 0, -0.2],
        ...seq(lf, [
          [0, 'idle', 'neutral'],
          [fBack - 6, 'present', 'smirk'],
          [fBuried + 6, 'shrug', 'surprised'],
        ]),
        gaze: [-9.2, 1.0, 0.5],
      });
      P.push({who: 'gren1', p: [-6.0, 0, -1.4], ...seq(lf, [[0, 'idle', 'neutral'], [fBuried + 8, 'point', 'shock']]), gaze: [-14.5, 1, 0]});

      if (lf < fPass1) {
        ball = {p: [-9.7, 0.24, 0.45], spin: 0};
      } else if (lf < fBack) {
        ball = ballArc([-9.7, 0.45], [-12.2, -0.15], (lf - fPass1) / Math.max(1, fBack - fPass1), 0.12, 0);
      } else if (lf < fBuried) {
        ball = ballArc([-12.2, -0.15], [-9.7, 0.45], (lf - fBack) / Math.max(1, fBuried - fBack), 0.12, 8);
      } else {
        ball = ballArc([-9.7, 0.45], [-15.1, 0.05], (lf - fBuried) / 22, 1.0, 16);
      }
      score = lf < fBuried + 14
        ? {bar: 2, grn: 1, clock: "87'", banner: 'PASS... PASS BACK...'}
        : {bar: 2, grn: 2, clock: "87'", banner: '2 - 2! EXTRA TIME!', highlight: true};
      break;
    }

    // 7. DEFEND BOTH GOALS (37.87 - 45.05 s): Grenada attacks BOTH nets; Barbados blocks everything!
    case 'defend': {
      const fBlocked = W('defend', 'blocked');
      const u = cl(lf / Math.max(1, len));
      const wave = Math.sin(lf * 0.22);
      // Left goal (Barbados net): Gren1 attacks, Sealy & Stoute block!
      P.push({who: 'stoute', p: [-13.2, 0, wave * 0.9], act: 'flex', expr: 'angry', gaze: [-10.0, 1, 0]});
      P.push({who: 'sealy', p: [-10.6, 0, -0.9 + wave * 0.5], ...seq(lf, [[0, 'flex', 'angry'], [fBlocked, 'proud', 'grin']]), gaze: [-8.2, 1, 0]});
      P.push({who: 'gren1', p: [-8.0 + Math.sin(lf * 0.14) * 1.1, 0, 0.9], act: 'walk', expr: 'rage', pace: 1.9, gaze: [-14.0, 1, 0]});

      // Right goal (Grenada net!): Gren2 & Gren3 attack their OWN net, Thorne & Bajan1 defend Grenada's goal!
      P.push({who: 'grenGk', p: [13.5, 0, 0.2], act: 'shrug', expr: 'shock', gaze: [10.0, 1, 0]});
      P.push({who: 'thorne', p: [11.2, 0, -0.8 - wave * 0.5], ...seq(lf, [[0, 'flex', 'angry'], [fBlocked, 'cheer', 'grin']]), gaze: [8.4, 1, 0]});
      P.push({who: 'bajan1', p: [11.6, 0, 1.4 + wave * 0.4], ...seq(lf, [[0, 'flex', 'angry'], [fBlocked, 'proud', 'happy']]), gaze: [8.4, 1, 0]});
      P.push({who: 'gren2', p: [8.2 - Math.sin(lf * 0.16) * 1.0, 0, -0.6], act: 'walk', expr: 'rage', pace: 1.9, gaze: [14.0, 1, 0]});
      P.push({who: 'gren3', p: [8.6 + Math.cos(lf * 0.16) * 0.9, 0, 1.6], act: 'walk', expr: 'angry', pace: 1.8, gaze: [14.0, 1, 0]});

      // Ball ping-pongs from left shot blocked -> cleared across pitch -> right shot blocked!
      ball = u < 0.48
        ? ballArc([-8.2, 0.7], [-11.0, -0.4], u / 0.48, 0.75, lf * 0.5)
        : ballArc([8.5, -0.4], [11.2, 0.3], (u - 0.48) / 0.52, 0.85, lf * 0.6);
      score = {bar: 2, grn: 2, clock: "89'", banner: 'BLOCKED AT BOTH ENDS!', highlight: lf >= fBlocked};
      break;
    }

    // 8. GOLDEN GOAL (45.05 - 49.60 s): Trevor Thorne scores 4 min into extra time -> 4-2!
    case 'winner': {
      const fScored = W('winner', 'scored');
      const tx = lx(6.8, 10.2, cl(lf / Math.max(1, fScored)));
      const tShot = cl((lf - fScored + 6) / 18);
      P.push({
        who: 'thorne',
        p: [tx, 0, 0.2],
        ...seq(lf, [
          [0, 'walk', 'angry'],
          [fScored - 8, 'flex', 'grin'],
          [fScored + 6, 'cheer', 'grin'],
        ]),
        pace: 1.8,
        gaze: [14.5, 1, 0],
      });
      P.push({
        who: 'grenGk',
        p: [13.4, 0, -0.4],
        ...seq(lf, [
          [0, 'flex', 'worried'],
          [fScored + 4, 'slump', 'sad'],
        ]),
        gaze: [tx, 1, 0.2],
      });
      P.push({who: 'sealy', p: [7.6, 0, -2.2], ...seq(lf, [[0, 'walk', 'happy'], [fScored + 4, 'bounce', 'grin']]), gaze: [14.0, 1, 0]});
      P.push({who: 'bajan1', p: [8.0, 0, 2.4], ...seq(lf, [[0, 'walk', 'happy'], [fScored + 4, 'cheer', 'grin']]), gaze: [14.0, 1, 0]});
      P.push({who: 'gren1', p: [9.2, 0, -3.4], act: 'slump', expr: 'sad', gaze: [14.0, 1, 0]});

      ball = lf < fScored - 6
        ? {p: [tx + 0.55, 0.24, 0.2], spin: lf * 0.4}
        : ballArc([tx + 0.55, 0.2], [15.1, 0.15], tShot, 1.15, lf * 0.7);
      score = lf < fScored + 8
        ? {bar: 2, grn: 2, clock: "94'", banner: 'EXTRA TIME (x2)'}
        : {bar: 4, grn: 2, clock: "94'", banner: 'FINAL: BAR 4 - 2 GRN!', highlight: true};
      break;
    }

    // 9. PUNCHLINE (49.60 - 53.06 s): FIFA didn't punish them — organizers scrapped the rule forever!
    case 'punch': {
      const fScrapped = W('punch', 'scrapped');
      const scrapped = lf >= fScrapped - 4;
      boards.ruleboard = {p: [0.0, 0, -1.2], ry: 0, scrapped, scale: scrapped ? 1.0 + 0.08 * Math.exp(-Math.max(0, lf - fScrapped) * 0.25) : 1.0};
      P.push({who: 'referee', p: [-2.1, 0, 0.8], ...seq(lf, [[0, 'shrug', 'neutral'], [fScrapped, 'point', 'smirk']]), gaze: 'cam'});
      P.push({who: 'sealy', p: [2.1, 0, 0.8], ...seq(lf, [[0, 'proud', 'smug'], [fScrapped, 'wink', 'grin']]), gaze: 'cam'});
      ball = {p: [0.0, 0.24, 1.8], spin: 0};
      score = {bar: 4, grn: 2, clock: 'FT', banner: 'RULE SCRAPPED FOREVER', highlight: scrapped};
      break;
    }
  }

  autoGaze(P, []);
  return {
    people: P,
    carts: [],
    extra: [],
    cars: [],
    meters: [],
    things: {},
    clock: 15,
    nStoryCars: 0,
    score,
    ball,
    boards,
  };
}
