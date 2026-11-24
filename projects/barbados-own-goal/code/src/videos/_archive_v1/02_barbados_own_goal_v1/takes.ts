// Continuous camera TAKES for 02_barbados_own_goal following 03_CAMERA_GRAMMAR.md:
// push-in default, word-landed moves, pulls for reveals, impact kicks & flashes on goals/stamps.
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';

export const PROPS: Props = {
  barGoal: [[-13.5, 1.1, 0], [1.8, 1.4, 2.4]],
  grnGoal: [[13.5, 1.1, 0], [1.8, 1.4, 2.4]],
  pitchWide: [[0, 1.2, -1.5], [14.0, 3.2, 5.0]],
  scoreboard: [[0, 4.4, -11.4], [3.0, 1.6, 0.5]],
  ruleboard: [[-1.4, 1.9, -1.6], [1.3, 1.1, 0.3]],
  ticket: [[2.2, 1.55, -1.4], [1.2, 0.8, 0.3]],
  punchBoard: [[0.0, 1.9, -1.2], [1.3, 1.1, 0.3]],
};

export const TAKES: Take[] = [
  // 1. HOOK: wide-ish setup on Sealy & Stoute -> fast push-in on "blasted" -> follow own goal
  {
    name: 'hook',
    why: 'establish Barbados box, punch in on the own-goal kick',
    keys: [
      K(R.hook, ['sealy', 'stoute'], 'FS', 18, 10, 42, {push: 1.08, settle: [0.06, 0.35]}),
      K(T('hook', 'blasted'), ['sealy', 'stoute'], 'MS', -14, 8, 38, {move: 'arc', lead: 0.25, dur: 0.7, push: 1.1}),
    ],
  },
  // 2. LAUGH: crowd reaction -> arc onto Grenada laughing -> Sealy smirk
  {
    name: 'laugh',
    why: 'crowd shock then Grenada players mocking Sealy',
    keys: [
      K(R.laugh, ['woman', 'youngman', 'grandma'], 'MS', 8, 8, 40, {push: 1.06}),
      K(T('laugh', 'stared'), ['gren1', 'gren2', 'gren3'], 'FS', -12, 9, 42, {move: 'dolly', lead: 0.2, dur: 0.65, push: 1.06}),
      K(T('laugh', 'laughing'), ['gren1', 'gren2', 'sealy'], 'FS', 16, 8, 40, {move: 'arc', lead: 0.2, dur: 0.6, push: 1.08}),
    ],
  },
  // 3. CHAOS TEASE: track Grenada sprinting right -> pull back wide to show BOTH goals defended
  {
    name: 'chaos',
    why: 'track Grenada sprinting at their own keeper, pull back to reveal both nets',
    keys: [
      K(R.chaos, ['gren1', 'gren2'], 'FS', 14, 10, 42, {push: 1.06}),
      K(T('chaos', 'goalkeeper'), ['gren2', 'grenGk'], 'FS', -18, 10, 42, {move: 'dolly', lead: 0.3, dur: 0.85, push: 1.05}),
      K(T('chaos', 'both'), 'prop:pitchWide', 'WS', 0, 18, 46, {move: 'pullpush', lead: 0.25, dur: 0.9, push: 1.04}),
    ],
  },
  // 4. RULE SETUP: scoreboard & worried Barbados squad
  {
    name: 'rule',
    why: 'show 2-1 elimination pressure on Barbados players',
    keys: [
      K(R.rule, ['coach', 'thorne', 'bajan1'], 'FS', 12, 9, 42, {push: 1.07}),
      K(T('rule', 'home'), ['thorne', 'sealy'], 'MS', -14, 7, 38, {move: 'arc', lead: 0.25, dur: 0.75, push: 1.08}),
    ],
  },
  // 5. BROKEN RULE: rulebook sign + Sealy eureka + Golden Jackpot Ticket
  {
    name: 'broken',
    why: 'reveal the double-golden-goal rulebook and jackpot ticket analogy',
    keys: [
      K(R.broken, ['sealy', 'prop:ruleboard'], 'FS', 10, 8, 42, {push: 1.07}),
      K(T('broken', 'double'), 'prop:ruleboard', 'MCU', 6, 5, 38, {move: 'dolly', lead: 0.25, dur: 0.65, push: 1.08}),
      K(T('broken', 'ticket'), ['sealy', 'prop:ticket'], 'FS', -14, 8, 42, {move: 'arc', lead: 0.2, dur: 0.75, push: 1.08}),
    ],
  },
  // 6. OWN GOAL SEQUENCE: rule-of-three pass, pass back, buried!
  {
    name: 'owngoal',
    why: 'pass to keeper, pass back, blast into own net',
    keys: [
      K(R.owngoal, ['sealy', 'stoute'], 'FS', 16, 10, 42, {push: 1.06}),
      K(T('owngoal', 'back'), 'stoute', 'MS', 20, 7, 38, {move: 'dolly', lead: 0.15, dur: 0.45, push: 1.06}),
      K(T('owngoal', 'buried'), ['sealy', 'stoute'], 'FS', -16, 9, 40, {move: 'arc', lead: 0.2, dur: 0.6, push: 1.1}),
    ],
  },
  // 7. DEFEND BOTH: ping-pong left goal defense -> right goal defense -> wide triumph
  {
    name: 'defend',
    why: 'show Grenada attacking both nets and Barbados blocking everything',
    keys: [
      K(R.defend, ['stoute', 'sealy', 'gren1'], 'FS', 16, 11, 42, {push: 1.06}),
      K(T('defend', 'both'), ['thorne', 'bajan1', 'gren2', 'grenGk'], 'FS', -16, 11, 44, {move: 'whip', lead: 0.18, dur: 0.55, push: 1.06}),
      K(T('defend', 'blocked'), ['thorne', 'bajan1'], 'MS', -12, 8, 40, {move: 'arc', lead: 0.2, dur: 0.6, push: 1.08}),
    ],
  },
  // 8. GOLDEN GOAL: Trevor Thorne bursts in and scores the 94th-min winner -> 4-2!
  {
    name: 'winner',
    why: 'Trevor Thorne rockets in the extra-time golden goal',
    keys: [
      K(R.winner, ['thorne', 'grenGk'], 'FS', -18, 10, 42, {push: 1.08}),
      K(T('winner', 'scored'), ['thorne', 'bajan1', 'sealy'], 'FS', 14, 9, 40, {move: 'arc', lead: 0.2, dur: 0.65, push: 1.1}),
      K(T('winner', 'four'), 'prop:scoreboard', 'MCU', 0, -4, 38, {move: 'dolly', lead: 0.15, dur: 0.5, push: 1.08}),
    ],
  },
  // 9. PUNCHLINE: Referee shrugs + SCRAPPED stamp + Sealy wink
  {
    name: 'punch',
    why: 'referee shrug, scrapped rulebook stamp, Sealy cheeky wink',
    keys: [
      K(R.punch, ['referee', 'prop:punchBoard', 'sealy'], 'FS', 8, 8, 42, {push: 1.07}),
      K(T('punch', 'scrapped'), ['prop:punchBoard', 'sealy'], 'MS', -10, 6, 38, {move: 'arc', lead: 0.18, dur: 0.5, push: 1.1}),
    ],
  },
];

// Camera kicks & white impact flashes on the big moments
export const KICKS: Kick[] = [
  {t: T('hook', 'blasted'), a: 0.09, z: 0.04},
  {t: T('owngoal', 'buried'), a: 0.1, z: 0.04},
  {t: T('winner', 'scored'), a: 0.11, z: 0.05},
  {t: T('punch', 'scrapped'), a: 0.08, z: 0.03},
];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [
  {t: T('hook', 'blasted') + 0.25, a: 0.45},
  {t: T('owngoal', 'buried') + 0.25, a: 0.5},
  {t: T('winner', 'scored') + 0.2, a: 0.55},
  {t: T('punch', 'scrapped'), a: 0.35},
];
