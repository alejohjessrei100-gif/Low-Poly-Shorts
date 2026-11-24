// Continuous camera TAKES v3 — full 30fps Style Bible camera grammar:
// >75% active motion, 53% push-in default, crane/arc travel, 0.18-0.28s word leads, 40%-peak ease, zero dead holds.
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';

export const PROPS: Props = {
  barGoal: [[-14.2, 1.1, 0], [1.6, 1.3, 2.3]],
  grnGoal: [[14.2, 1.1, 0], [1.6, 1.3, 2.3]],
  pitchMid: [[2.0, 1.2, -1.0], [9.5, 2.6, 4.0]],
  scoreboard: [[0, 7.1, -11.4], [3.0, 1.6, 0.5]],
  ruleboard: [[-4.4, 1.85, -1.2], [1.2, 1.0, 0.3]],
  ticket: [[4.4, 1.5, -1.2], [1.2, 0.8, 0.3]],
  punchBoard: [[0.0, 1.85, -1.2], [1.2, 1.0, 0.3]],
};

export const TAKES: Take[] = [
  // 1. HOOK: dynamic push-in + arc landing ON "blasted" with full Barbados net visible
  {
    name: 'hook',
    why: 'fast opening push-in, arc onto Sealy + full Barbados net on "blasted"',
    keys: [
      K(R.hook, ['sealy', 'stoute', 'prop:barGoal'], 'FS', 18, 11, 44, {push: 1.09, arc: -8, settle: [0.07, 0.3], ease: 'out'}),
      K(T('hook', 'blasted'), ['sealy', 'stoute', 'prop:barGoal'], 'FS', -10, 8, 40, {move: 'arc', lead: 0.24, dur: 0.72, push: 1.12, crane: -2, ease: 'io'}),
    ],
  },
  // 2. LAUGH: clean crowd shock -> push/dolly travel to Grenada staring -> arc to Sealy smirk
  {
    name: 'laugh',
    why: 'unobstructed crowd shock, continuous travel to Grenada laughing and Sealy smirk',
    keys: [
      K(R.laugh, ['woman', 'youngman', 'grandma'], 'MS', 8, 7, 40, {push: 1.09, settle: [0.05, 0.28], ease: 'out'}),
      K(T('laugh', 'stared'), ['gren1', 'gren2', 'gren3'], 'FS', -12, 9, 42, {move: 'dolly', lead: 0.22, dur: 0.7, push: 1.09, arc: 6, ease: 'io'}),
      K(T('laugh', 'laughing'), ['gren1', 'gren2', 'sealy'], 'FS', 14, 8, 40, {move: 'arc', lead: 0.22, dur: 0.65, push: 1.1, ease: 'out'}),
    ],
  },
  // 3. CHAOS: energetic sprint track -> pull-back crane reveal of both goals inside enclosed stadium
  {
    name: 'chaos',
    why: 'track Grenada sprint to their own keeper, pull-back crane reveal of enclosed pitch',
    keys: [
      K(R.chaos, ['gren1', 'gren2'], 'FS', 16, 10, 42, {push: 1.08, arc: -6, settle: [0.06, 0.3]}),
      K(T('chaos', 'goalkeeper'), ['gren2', 'grenGk', 'prop:grnGoal'], 'FS', -16, 9, 42, {move: 'dolly', lead: 0.28, dur: 0.85, push: 1.08, ease: 'io'}),
      K(T('chaos', 'both'), 'prop:pitchMid', 'WS', 0, 17, 44, {move: 'pullpush', lead: 0.26, dur: 0.9, push: 1.07, crane: 3, ease: 'out'}),
    ],
  },
  // 4. RULE SETUP: coach & worried squad -> push-in arc to Sealy eureka
  {
    name: 'rule',
    why: 'show 2-1 elimination pressure, travel into Sealy eureka',
    keys: [
      K(R.rule, ['coach', 'thorne', 'bajan1'], 'FS', 12, 9, 42, {push: 1.09, arc: -5, settle: [0.05, 0.28]}),
      K(T('rule', 'home'), ['thorne', 'sealy'], 'MS', -14, 7, 38, {move: 'arc', lead: 0.25, dur: 0.75, push: 1.11, ease: 'io'}),
    ],
  },
  // 5. BROKEN RULE: Rulebook easel -> punch-in on "double" -> arc to Sealy + Golden Jackpot Ticket
  {
    name: 'broken',
    why: 'rulebook reveal, punch-in on "double", continuous arc to Jackpot Ticket',
    keys: [
      K(R.broken, ['sealy', 'prop:ruleboard'], 'FS', 12, 8, 42, {push: 1.09, settle: [0.06, 0.28]}),
      K(T('broken', 'double'), 'prop:ruleboard', 'MCU', 6, 5, 38, {move: 'dolly', lead: 0.24, dur: 0.65, push: 1.11, ease: 'out'}),
      K(T('broken', 'ticket'), ['sealy', 'prop:ticket'], 'FS', -14, 8, 42, {move: 'arc', lead: 0.22, dur: 0.78, push: 1.1, ease: 'io'}),
    ],
  },
  // 6. OWN GOAL SEQUENCE: rule-of-three pass -> pass back -> buried into full Barbados net
  {
    name: 'owngoal',
    why: 'pass to keeper, snap dolly to Stoute on "back", arc onto full net on "buried"',
    keys: [
      K(R.owngoal, ['sealy', 'stoute'], 'FS', 16, 10, 42, {push: 1.08, settle: [0.05, 0.25]}),
      K(T('owngoal', 'back'), 'stoute', 'MS', 20, 7, 38, {move: 'dolly', lead: 0.18, dur: 0.48, push: 1.09, ease: 'out'}),
      K(T('owngoal', 'buried'), ['sealy', 'stoute', 'prop:barGoal'], 'FS', -12, 9, 41, {move: 'arc', lead: 0.22, dur: 0.6, push: 1.12, ease: 'io'}),
    ],
  },
  // 7. DEFEND BOTH: left goal defense -> whip-pan to right goal defense -> front-facing push-in
  {
    name: 'defend',
    why: 'left-net block, whip across pitch to right-net block, push-in on Barbados defenders',
    keys: [
      K(R.defend, ['stoute', 'sealy', 'gren1'], 'FS', 16, 10, 42, {push: 1.09, arc: -5, settle: [0.06, 0.28]}),
      K(T('defend', 'both'), ['thorne', 'bajan1', 'gren2', 'grenGk'], 'FS', -16, 10, 44, {move: 'whip', lead: 0.2, dur: 0.58, push: 1.09, ease: 'io'}),
      K(T('defend', 'blocked'), ['thorne', 'bajan1'], 'FS', -8, 8, 40, {move: 'arc', lead: 0.22, dur: 0.6, push: 1.11, ease: 'out'}),
    ],
  },
  // 8. GOLDEN GOAL: Full winning kick into Grenada's net -> dramatic dolly up to 4-2 scoreboard
  {
    name: 'winner',
    why: 'track Trevor Thorne rocket into full Grenada net, then dolly up to 4-2 scoreboard',
    keys: [
      K(R.winner, ['thorne', 'grenGk', 'prop:grnGoal'], 'FS', -16, 10, 44, {push: 1.1, settle: [0.06, 0.28]}),
      K(T('winner', 'scored'), ['thorne', 'grenGk', 'prop:grnGoal'], 'FS', 10, 8, 41, {move: 'arc', lead: 0.14, dur: 0.55, push: 1.12, ease: 'io'}),
      K(T('winner', 'four'), 'prop:scoreboard', 'MCU', 0, -4, 38, {move: 'dolly', lead: 0.18, dur: 0.48, push: 1.1, crane: 2, ease: 'out'}),
    ],
  },
  // 9. PUNCHLINE: clean 3-subject frame -> energetic push-in on SCRAPPED stamp + Sealy wink
  {
    name: 'punch',
    why: 'referee shrug, scrapped rulebook stamp, Sealy wink with crisp push-in',
    keys: [
      K(R.punch, ['referee', 'prop:punchBoard', 'sealy'], 'FS', 8, 8, 44, {push: 1.08, settle: [0.05, 0.25]}),
      K(T('punch', 'scrapped'), ['referee', 'prop:punchBoard', 'sealy'], 'FS', -8, 7, 42, {move: 'arc', lead: 0.18, dur: 0.5, push: 1.11, ease: 'out'}),
    ],
  },
];

export const KICKS: Kick[] = [
  {t: T('hook', 'blasted'), a: 0.1, z: 0.04},
  {t: T('owngoal', 'buried'), a: 0.11, z: 0.04},
  {t: T('winner', 'scored'), a: 0.12, z: 0.05},
  {t: T('punch', 'scrapped'), a: 0.1, z: 0.04},
];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [
  {t: T('hook', 'blasted') + 0.24, a: 0.48},
  {t: T('owngoal', 'buried') + 0.24, a: 0.52},
  {t: T('winner', 'scored') + 0.2, a: 0.58},
  {t: T('punch', 'scrapped'), a: 0.4},
];
