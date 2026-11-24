// Staging v2 for 02_barbados_own_goal — fixes all v1 framing/blocking/hero-goal issues!
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

function ballArc(a: [number, number], b: [number, number], t: number, h = 0.9, spin0 = 0): BallState {
  const u = cl(t);
  return {
    p: [a[0] + (b[0] - a[0]) * u, 0.25 + 4 * h * u * (1 - u), a[1] + (b[1] - a[1]) * u],
    spin: spin0 + u * 12,
  };
}

export function stage(f: number): Stage {
  const s = shotAt(f), lf = s.lf, len = Math.max(1, s.len);
  const P: PersonP[] = [];
  let score: ScoreState = {bar: 2, grn: 1, clock: "87'", banner: 'BARBADOS NEEDS +2'};
  let ball: BallState = {p: [0, 0.25, 0], spin: 0};
  const boards: StoryBoards = {};

  switch (s.name) {
    // 1. HOOK: Sealy closer to box so BOTH Sealy AND the full Barbados net are clearly in frame on the kick!
    case 'hook': {
      const kickF = W('hook', 'blasted');
      const tKick = cl((lf - kickF) / 24);
      const sx = lx(-9.6, -11.0, cl(lf / Math.max(1, kickF)));
      P.push({
        who: 'sealy',
        p: [sx, 0, 0.5],
        ...seq(lf, [
          [0, 'walk', 'smirk'],
          [kickF - 8, 'flex', 'angry'],
          [kickF + 4, 'proud', 'smug'],
        ]),
        gaze: [-14.5, 1.0, 0],
      });
      P.push({
        who: 'stoute',
        p: [-13.5, 0, -0.5],
        ...seq(lf, [
          [0, 'idle', 'worried'],
          [kickF + 5, 'shrug', 'shock'],
        ]),
        gaze: [sx, 1.0, 0.5],
      });
      P.push({who: 'gren1', p: [-7.2, 0, -1.8], ...seq(lf, [[0, 'idle', 'neutral'], [kickF + 8, 'point', 'surprised']]), gaze: [-14.5, 1.0, 0]});
      ball = lf < kickF
        ? {p: [sx - 0.55, 0.25, 0.4], spin: lf * 0.25}
        : ballArc([sx - 0.55, 0.4], [-15.2, 0.1], tKick, 1.0, lf * 0.25);
      score = lf < kickF + 14
        ? {bar: 2, grn: 1, clock: "87'", banner: '3 MINUTES LEFT'}
        : {bar: 2, grn: 2, clock: "87'", banner: 'OWN GOAL!!', highlight: true};
      break;
    }

    // 2. LAUGH: Crowd unobstructed on left (-4..-1.5, z=-7.2), Grenada players clearly separated on right (+1.5..+4.2, z=0.8)!
    case 'laugh': {
      const fStare = W('laugh', 'stared');
      const fLaugh = W('laugh', 'laughing');
      P.push({who: 'woman', p: [-4.6, 0, -7.2], act: 'shrug', expr: 'shock', gaze: 'cam'});
      P.push({who: 'youngman', p: [-3.2, 0, -7.2], act: 'point', expr: 'surprised', gaze: 'cam'});
      P.push({who: 'grandma', p: [-1.8, 0, -7.2], act: 'shrug', expr: 'worried', gaze: 'cam'});

      P.push({who: 'gren1', p: [1.0, 0, 0.8], ...seq(lf, [[0, 'idle', 'surprised'], [fStare, 'point', 'smirk'], [fLaugh, 'cheer', 'grin']]), gaze: [4.6, 1.0, 1.0]});
      P.push({who: 'gren2', p: [2.2, 0, 0.2], ...seq(lf, [[0, 'shrug', 'surprised'], [fStare, 'point', 'happy'], [fLaugh, 'bounce', 'grin']]), gaze: [4.6, 1.0, 1.0]});
      P.push({who: 'gren3', p: [3.3, 0, 1.0], ...seq(lf, [[0, 'idle', 'surprised'], [fStare, 'cross', 'smug'], [fLaugh, 'cheer', 'happy']]), gaze: [4.6, 1.0, 1.0]});
      P.push({who: 'sealy', p: [4.9, 0, 1.1], act: 'cross', expr: 'smug', gaze: 'cam'});
      ball = {p: [1.8, 0.25, 2.0], spin: 0};
      score = {bar: 2, grn: 2, clock: "87'", banner: 'TIED 2 - 2!'};
      break;
    }

    // 3. CHAOS: Tight energetic sprint toward Grenada's own goal + midfield reveal inside enclosed stadium!
    case 'chaos': {
      const fSprint = W('chaos', 'sprinted');
      const fBoth = W('chaos', 'both');
      const uRun = cl((lf - fSprint + 8) / 75);
      const g1x = lx(-1.2, 9.6, uRun);
      const g2x = lx(0.6, 10.8, uRun);
      P.push({who: 'gren1', p: [g1x, 0, 1.1], ...seq(lf, [[0, 'lookSide', 'surprised'], [fSprint - 8, 'walk', 'angry']]), pace: 1.8});
      P.push({who: 'gren2', p: [g2x, 0, -0.9], ...seq(lf, [[0, 'lookSide', 'shock'], [fSprint - 8, 'walk', 'angry']]), pace: 1.9});
      P.push({who: 'grenGk', p: [13.5, 0, 0.0], ...seq(lf, [[0, 'idle', 'neutral'], [fSprint + 12, 'shrug', 'shock']]), gaze: [g2x, 1, -0.9]});

      P.push({who: 'stoute', p: [-13.2, 0, 0.0], act: 'flex', expr: 'angry', gaze: [0, 1, 0]});
      P.push({who: 'sealy', p: [-9.8, 0, 0.8], act: 'flex', expr: 'proud', gaze: [0, 1, 0]});
      const tx = lx(1.4, 11.4, cl((lf - fSprint) / 75));
      const bx = lx(2.8, 11.8, cl((lf - fSprint) / 80));
      P.push({who: 'thorne', p: [tx, 0, 1.9], ...seq(lf, [[0, 'walk', 'worried'], [fBoth, 'flex', 'angry']]), pace: 1.8});
      P.push({who: 'bajan1', p: [bx, 0, -2.2], ...seq(lf, [[0, 'walk', 'worried'], [fBoth, 'flex', 'angry']]), pace: 1.8});
      ball = {p: [g1x + 0.6, 0.25, 1.0], spin: lf * 0.5};
      score = {bar: 2, grn: 2, clock: "88'", banner: 'DEFENDING BOTH NETS!', highlight: true};
      break;
    }

    // 4. RULE SETUP: Coach + worried Barbados squad + Sealy eureka
    case 'rule': {
      const fHome = W('rule', 'home');
      P.push({who: 'coach', p: [-2.1, 0, 0.4], ...seq(lf, [[0, 'talk', 'worried'], [fHome - 18, 'point', 'angry']]), pointUp: true, gaze: [0, 6.5, -11]});
      P.push({who: 'thorne', p: [-0.4, 0, 0.9], ...seq(lf, [[0, 'think', 'worried'], [fHome - 10, 'slump', 'sad']]), gaze: [-2.1, 1, 0.4]});
      P.push({who: 'bajan1', p: [1.1, 0, 0.7], ...seq(lf, [[0, 'idle', 'worried'], [fHome - 10, 'tired', 'sad']]), gaze: [-2.1, 1, 0.4]});
      P.push({who: 'sealy', p: [2.6, 0, 0.5], ...seq(lf, [[0, 'think', 'neutral'], [fHome - 5, 'eureka', 'smirk']]), gaze: 'cam'});
      ball = {p: [0.3, 0.25, 2.0], spin: 0};
      score = {bar: 2, grn: 1, clock: "84'", banner: '2-1 = ELIMINATED!'};
      break;
    }

    // 5. BROKEN RULE: Grounded Rulebook easel at x=-4.4 and Ticket stand at x=+4.4 (never overlaps scoreboard!)
    case 'broken': {
      const fDouble = W('broken', 'double');
      const fTicket = W('broken', 'ticket');
      const rScale = pop(cl(lf / 14));
      const tScale = lf >= fTicket - 10 ? pop(cl((lf - fTicket + 10) / 14)) : 0.001;
      boards.ruleboard = {p: [-4.4, 0, -1.2], ry: 0.14, scrapped: false, scale: rScale};
      if (lf >= fTicket - 10) boards.ticket = {p: [4.4, 0, -1.2], ry: -0.14, scale: tScale};
      const sx = lf < fTicket - 10 ? -2.6 : lx(-2.6, 2.6, cl((lf - fTicket + 10) / 22));
      P.push({
        who: 'sealy',
        p: [sx, 0, 1.1],
        ...seq(lf, [
          [0, 'point', 'smirk'],
          [fDouble - 8, 'eureka', 'grin'],
          [fTicket, 'present', 'proud'],
        ]),
        pointUp: true,
        gaze: 'cam',
      });
      P.push({who: 'referee', p: [-6.4, 0, 0.8], act: 'shrug', expr: 'neutral', gaze: [-4.4, 1.8, -1.2]});
      ball = {p: [sx, 0.25, 2.1], spin: 0};
      score = {bar: 2, grn: 1, clock: "86'", banner: 'ET GOLDEN GOAL = x2', highlight: true};
      break;
    }

    // 6. OWN GOAL SEQUENCE: Rule of three — Pass, Pass back, Buried in own net (full goal visible!)
    case 'owngoal': {
      const fPass1 = W('owngoal', 'passed');
      const fBack = W('owngoal', 'back');
      const fBuried = W('owngoal', 'buried');
      P.push({
        who: 'sealy',
        p: [-10.0, 0, 0.5],
        ...seq(lf, [
          [0, 'idle', 'smirk'],
          [fPass1, 'present', 'smirk'],
          [fBack, 'idle', 'smug'],
          [fBuried - 4, 'flex', 'grin'],
          [fBuried + 12, 'proud', 'smug'],
        ]),
        gaze: [-13.4, 1.0, -0.2],
      });
      P.push({
        who: 'stoute',
        p: [-13.3, 0, -0.3],
        ...seq(lf, [
          [0, 'idle', 'neutral'],
          [fBack - 6, 'present', 'smirk'],
          [fBuried + 6, 'shrug', 'surprised'],
        ]),
        gaze: [-10.0, 1.0, 0.5],
      });
      P.push({who: 'gren1', p: [-7.0, 0, -1.6], ...seq(lf, [[0, 'idle', 'neutral'], [fBuried + 8, 'point', 'shock']]), gaze: [-14.5, 1, 0]});

      if (lf < fPass1) ball = {p: [-10.5, 0.25, 0.45], spin: 0};
      else if (lf < fBack) ball = ballArc([-10.5, 0.45], [-12.7, -0.2], (lf - fPass1) / Math.max(1, fBack - fPass1), 0.14, 0);
      else if (lf < fBuried) ball = ballArc([-12.7, -0.2], [-10.5, 0.45], (lf - fBack) / Math.max(1, fBuried - fBack), 0.14, 8);
      else ball = ballArc([-10.5, 0.45], [-15.2, 0.05], (lf - fBuried) / 20, 1.0, 16);

      score = lf < fBuried + 14
        ? {bar: 2, grn: 1, clock: "87'", banner: 'PASS... PASS BACK...'}
        : {bar: 2, grn: 2, clock: "87'", banner: '2 - 2! EXTRA TIME!', highlight: true};
      break;
    }

    // 7. DEFEND BOTH GOALS: Clean facing (no player turning back to lens at 00:43.5!)
    case 'defend': {
      const fBlocked = W('defend', 'blocked');
      const u = cl(lf / Math.max(1, len));
      const wave = Math.sin(lf * 0.22);
      P.push({who: 'stoute', p: [-13.3, 0, wave * 0.7], act: 'flex', expr: 'angry', view: 'front', gaze: [-8.5, 1, 0]});
      P.push({who: 'sealy', p: [-10.8, 0, -0.8 + wave * 0.4], ...seq(lf, [[0, 'flex', 'angry'], [fBlocked, 'proud', 'grin']]), view: 'front', gaze: [-8.2, 1, 0]});
      P.push({who: 'gren1', p: [-8.2 + Math.sin(lf * 0.14) * 1.0, 0, 0.8], act: 'walk', expr: 'rage', pace: 1.9, gaze: [-14.0, 1, 0]});

      P.push({who: 'grenGk', p: [13.5, 0, 0.2], act: 'shrug', expr: 'shock', view: 'front', gaze: [10.0, 1, 0]});
      P.push({who: 'thorne', p: [11.2, 0, -0.7 - wave * 0.4], ...seq(lf, [[0, 'flex', 'angry'], [fBlocked, 'cheer', 'grin']]), view: 'front', gaze: 'cam'});
      P.push({who: 'bajan1', p: [11.6, 0, 1.2 + wave * 0.3], ...seq(lf, [[0, 'flex', 'angry'], [fBlocked, 'proud', 'happy']]), view: 'front', gaze: 'cam'});
      P.push({who: 'gren2', p: [8.4 - Math.sin(lf * 0.16) * 0.9, 0, -0.6], act: 'walk', expr: 'rage', pace: 1.9, gaze: [14.0, 1, 0]});
      P.push({who: 'gren3', p: [8.8 + Math.cos(lf * 0.16) * 0.8, 0, 1.5], act: 'walk', expr: 'angry', pace: 1.8, gaze: [14.0, 1, 0]});

      ball = u < 0.48
        ? ballArc([-8.4, 0.7], [-11.2, -0.4], u / 0.48, 0.75, lf * 0.5)
        : ballArc([8.6, -0.4], [11.2, 0.2], (u - 0.48) / 0.52, 0.85, lf * 0.6);
      score = {bar: 2, grn: 2, clock: "89'", banner: 'BLOCKED AT BOTH ENDS!', highlight: lf >= fBlocked};
      break;
    }

    // 8. GOLDEN GOAL: Full hero kick into Grenada's net BEFORE cutting to the 4-2 scoreboard!
    case 'winner': {
      const fScored = W('winner', 'scored');
      const tx = lx(8.2, 10.8, cl(lf / Math.max(1, fScored - 4)));
      const tShot = cl((lf - (fScored - 6)) / 18);
      P.push({
        who: 'thorne',
        p: [tx, 0, 0.3],
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
        p: [13.5, 0, -0.4],
        ...seq(lf, [
          [0, 'flex', 'worried'],
          [fScored + 4, 'slump', 'sad'],
        ]),
        gaze: [tx, 1, 0.3],
      });
      P.push({who: 'sealy', p: [8.6, 0, -2.1], ...seq(lf, [[0, 'walk', 'happy'], [fScored + 4, 'bounce', 'grin']]), gaze: [14.5, 1, 0]});
      P.push({who: 'bajan1', p: [9.0, 0, 2.2], ...seq(lf, [[0, 'walk', 'happy'], [fScored + 4, 'cheer', 'grin']]), gaze: [14.5, 1, 0]});

      ball = lf < fScored - 6
        ? {p: [tx + 0.55, 0.25, 0.3], spin: lf * 0.4}
        : ballArc([tx + 0.55, 0.3], [15.2, 0.15], tShot, 1.15, lf * 0.7);
      score = lf < fScored + 8
        ? {bar: 2, grn: 2, clock: "94'", banner: 'EXTRA TIME (x2)'}
        : {bar: 4, grn: 2, clock: "94'", banner: 'FINAL: BAR 4 - 2 GRN!', highlight: true};
      break;
    }

    // 9. PUNCHLINE: Tight group (Referee x=-1.45, Rulebook x=0, Sealy x=+1.45) — zero edge clipping!
    case 'punch': {
      const fScrapped = W('punch', 'scrapped');
      const scrapped = lf >= fScrapped - 4;
      boards.ruleboard = {p: [0.0, 0, -1.2], ry: 0, scrapped, scale: scrapped ? 1.0 + 0.08 * Math.exp(-Math.max(0, lf - fScrapped) * 0.25) : 1.0};
      P.push({who: 'referee', p: [-1.45, 0, 0.7], ...seq(lf, [[0, 'shrug', 'neutral'], [fScrapped, 'point', 'smirk']]), view: 'front', gaze: 'cam'});
      P.push({who: 'sealy', p: [1.45, 0, 0.7], ...seq(lf, [[0, 'proud', 'smug'], [fScrapped, 'wink', 'grin']]), view: 'front', gaze: 'cam'});
      ball = {p: [0.0, 0.25, 1.8], spin: 0};
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
