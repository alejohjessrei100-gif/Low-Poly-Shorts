// Expressive 2D face rig for the classic avatars: separate eyes (white + pupil + highlight), upper/lower lids,
// brows, a parametric mouth (expressions + lip-sync visemes) and extras (blush, sweat, tears, anger vein, dread,
// sparkle eyes). Everything is a pure function of time t (deterministic for frame-by-frame rendering).
//   const F = faceRig(c, { ink: '#f6f6fa', skin: 0x2a2a34, style: 'dramatic' });
//   F.track([[0, 'shocked'], [1.6, 'suspicious', { look: [0.6, 0] }]]); F.lipsync(words, amp); F.update(t);
import * as THREE from 'three';

const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;

// ---------------------------------------------------------------- expression presets
// eye: open (1 = normal), squint (lower lid up, ^^ at 1), lid (upper lid down), pupil (size)
// brow [raise, angle]: angle > 0 = inner end up (worried), < 0 = inner end down (angry)
// mouth: w width, open, curve (+smile/-frown), round (O), teeth, skew (smirk), wobble (cry), tongue
const BASE = { open: 1, squint: 0, lid: 0.08, pupil: 1, look: [0, 0], browL: [0, 0], browR: [0, 0], mouth: { w: 1, open: 0, curve: 0.15, round: 0, teeth: 0, skew: 0, wobble: 0, tongue: 0 }, blush: 0, sweat: 0, tears: 0, vein: 0, dread: 0, sparkle: 0, dart: 0 };
export const PRESETS = {
  neutral: {},
  happy: { squint: 0.35, lid: 0, browL: [0.025, 0.08], browR: [0.025, 0.08], mouth: { w: 1.1, open: 0.28, curve: 1, teeth: 0.6 } },
  laughing: { squint: 0.9, lid: 0, browL: [0.05, 0.12], browR: [0.05, 0.12], mouth: { w: 1.25, open: 0.85, curve: 1, teeth: 0.7, tongue: 1 } },
  sad: { open: 0.95, lid: 0.35, pupil: 1.08, browL: [0.02, 0.45], browR: [0.02, 0.45], mouth: { w: 0.8, open: 0.04, curve: -0.85 }, look: [0, -0.4] },
  crying: { open: 0.9, lid: 0.45, pupil: 1.1, browL: [0.03, 0.6], browR: [0.03, 0.6], mouth: { w: 0.95, open: 0.4, curve: -0.9, wobble: 1 }, tears: 1 },
  angry: { open: 0.85, lid: 0.28, browL: [-0.03, -0.5], browR: [-0.03, -0.5], mouth: { w: 0.95, open: 0.16, curve: -0.5, teeth: 1 } },
  furious: { open: 0.82, lid: 0.32, pupil: 0.7, browL: [-0.05, -0.75], browR: [-0.05, -0.75], mouth: { w: 1.2, open: 0.6, curve: -0.75, teeth: 1 }, vein: 1 },
  scared: { open: 1.22, pupil: 0.62, browL: [0.06, 0.45], browR: [0.06, 0.45], mouth: { w: 0.9, open: 0.3, curve: -0.6, teeth: 0.5, wobble: 0.6 }, sweat: 1, dart: 1 },
  shocked: { open: 1.38, pupil: 0.55, lid: 0, browL: [0.1, 0.12], browR: [0.1, 0.12], mouth: { w: 0.95, open: 0.75, curve: 0, round: 1 } },
  smug: { lid: 0.55, squint: 0.15, browL: [0.05, -0.08], browR: [-0.01, -0.25], mouth: { w: 0.95, open: 0.02, curve: 0.6, skew: 0.9 }, look: [0.3, 0] },
  suspicious: { lid: 0.5, squint: 0.25, browL: [0.07, 0.15], browR: [-0.03, -0.38], mouth: { w: 0.7, open: 0, curve: -0.15, skew: -0.45 }, look: [0.7, 0] },
  embarrassed: { open: 0.9, lid: 0.25, browL: [0.03, 0.35], browR: [0.03, 0.35], mouth: { w: 0.75, open: 0.04, curve: 0.25, wobble: 0.5 }, blush: 1, sweat: 0.6, look: [-0.3, -0.5] },
  determined: { open: 0.95, lid: 0.2, browL: [-0.02, -0.3], browR: [-0.02, -0.3], mouth: { w: 0.9, open: 0, curve: 0.15, skew: 0.2 } },
  bored: { lid: 0.62, browL: [-0.01, 0.05], browR: [-0.01, 0.05], mouth: { w: 0.8, open: 0, curve: -0.1 }, look: [0.4, 0.5] },
  dread: { open: 1.1, pupil: 0.4, lid: 0.1, browL: [0.04, 0.5], browR: [0.04, 0.5], mouth: { w: 0.7, open: 0.12, curve: -0.5, wobble: 0.4 }, dread: 1, sweat: 0.8 },
  starstruck: { open: 1.2, browL: [0.06, 0.1], browR: [0.06, 0.1], mouth: { w: 1.1, open: 0.5, curve: 1, teeth: 0.7 }, sparkle: 1 },
};
const merge = (p) => { const o = JSON.parse(JSON.stringify(BASE)); for (const [k, v] of Object.entries(p || {})) if (k === 'mouth') Object.assign(o.mouth, v); else o[k] = v; return o; };
// personality styles scale how far the face goes
const STYLES = { dramatic: { amp: 1.25, lid: -0.04, blink: [1.8, 4.0] }, stern: { amp: 0.85, lid: 0.12, brow: -0.02, blink: [2.5, 5] }, deadpan: { amp: 0.45, lid: 0.18, blink: [3.5, 6] }, normal: { amp: 1, lid: 0, blink: [2, 5] } };

function mixState(a, b, k) {
  const o = {};
  for (const key of Object.keys(a)) {
    if (key === 'mouth') { o.mouth = {}; for (const m of Object.keys(a.mouth)) o.mouth[m] = lerp(a.mouth[m], b.mouth[m], k); }
    else if (Array.isArray(a[key])) o[key] = a[key].map((v, i) => lerp(v, b[key][i], k));
    else o[key] = lerp(a[key], b[key], k);
  }
  return o;
}
function styled(s, style) {
  const st = STYLES[style] || STYLES.normal, n = merge({}), A = st.amp;
  const o = mixState(n, s, A); // push away from neutral by the style amplitude
  o.lid = Math.max(0, Math.min(0.9, o.lid + st.lid)); if (st.brow) { o.browL[0] += st.brow; o.browR[0] += st.brow; }
  o.open = Math.max(0.5, o.open); return o;
}

// ---------------------------------------------------------------- lip-sync: letters -> visemes
const VIS = { rest: { open: 0, w: 1, round: 0, teeth: 0 }, A: { open: 0.62, w: 1.05, round: 0, teeth: 0.3 }, E: { open: 0.34, w: 1.15, round: 0, teeth: 0.7 }, O: { open: 0.55, w: 0.68, round: 1, teeth: 0 }, U: { open: 0.24, w: 0.5, round: 1, teeth: 0 }, M: { open: 0, w: 0.92, round: 0, teeth: 0 }, F: { open: 0.1, w: 1.0, round: 0, teeth: 1 } };
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const spell = (n) => (n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : '') : String(n).split('').map((d) => ONES[+d]).join(''));
function visemesOf(word) {
  let w = word.toLowerCase().replace(/[0-9]+/g, (d) => spell(+d)).replace(/[^a-z]/g, '');
  const out = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i], d = w.slice(i, i + 2);
    if (d === 'oo' || d === 'ou' || d === 'ew') { out.push(['U', 1.4]); i++; continue; }
    if (d === 'ee' || d === 'ea') { out.push(['E', 1.4]); i++; continue; }
    if (d === 'th') { out.push(['E', 0.7]); i++; continue; }
    if (d === 'ch' || d === 'sh') { out.push(['U', 0.8]); i++; continue; }
    if ('a'.includes(c)) out.push(['A', 1.3]); else if ('ei'.includes(c)) out.push(['E', 1.2]); else if (c === 'o') out.push(['O', 1.3]); else if ('uw'.includes(c)) out.push(['U', 1.1]);
    else if ('mbp'.includes(c)) out.push(['M', 0.8]); else if ('fv'.includes(c)) out.push(['F', 0.8]); else if (c === 'y') out.push(['E', 0.8]);
    else if (c === 'r') out.push(['O', 0.6]); else if (c === 'l') out.push(['E', 0.6]); else out.push(['E', 0.5]);
  }
  return out;
}

// ---------------------------------------------------------------- the rig
const Z = 0.64; // just in front of the head's front face (head units)
const circle = (r, seg = 24) => new THREE.CircleGeometry(r, seg);
function mat(color, order, opacity = 1) { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }); m.userData.order = order; return m; }
function mesh(geo, m, parent, x = 0, y = 0, z = Z) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.renderOrder = 10 + m.userData.order; o.userData.noAO = true; parent.add(o); return o; }

/** c: an avatar from kit/rig.js. opts: ink (features), skin (lid colour), style, eyeColor */
export function faceRig(c, { ink = '#1b1b24', skin = 0xf6c89a, style = 'normal', pupilColor = 0x14141c, whites = 0xffffff, mouthColor = 0x4a1424 } = {}) {
  const head = c.head; // head pivot; the head box is centred at y 0.68, front face at z ~0.625
  if (c.av.faceP) c.av.faceP.visible = false; // retire the painted face
  const g = new THREE.Group(); head.add(g);
  const INK = new THREE.Color(ink), light = INK.getHSL({}).l > 0.6;
  const EY = 0.775, EX = 0.18, MY = 0.47;
  const eyes = [-1, 1].map((s) => {
    const e = new THREE.Group(); e.position.set(s * EX, EY, 0); g.add(e);
    const outline = mesh(new THREE.BufferGeometry(), mat(light ? whites : INK, 0), e, 0, 0, Z - 0.001);
    const white = mesh(new THREE.BufferGeometry(), mat(whites, 1), e, 0, 0, Z);
    const pupil = mesh(new THREE.BufferGeometry(), mat(pupilColor, 2), e, 0, 0, Z + 0.002);
    const hi = mesh(circle(0.016, 12), mat(0xffffff, 3), e, 0.018, 0.022, Z + 0.004);
    const hi2 = mesh(circle(0.008, 10), mat(0xffffff, 3), e, -0.012, -0.015, Z + 0.004);
    const star = mesh(new THREE.ShapeGeometry(starShape(0.05)), mat(0xffffff, 3), e, 0, 0, Z + 0.005); star.visible = false;
    const lash = mesh(new THREE.PlaneGeometry(1, 0.018), mat(INK, 5), e, 0, 0, Z + 0.007); // closed / heavy-lid line
    const arc = mesh(new THREE.BufferGeometry(), mat(INK, 5), e, 0, 0, Z + 0.007); // ^ happy squint
    return { e, outline, white, pupil, hi, hi2, star, lash, arc, s };
  });
  const brows = [-1, 1].map((s) => { const b = mesh(new THREE.ShapeGeometry(roundRect(0.17, 0.034, 0.017)), mat(INK, 6), g, s * EX, EY + 0.15, Z + 0.008); return b; });
  // mouth layers: outline (behind), fill, teeth, tongue - rebuilt from parameters each frame
  const mOutline = mesh(new THREE.BufferGeometry(), mat(INK, 7), g, 0, MY, Z + 0.002);
  const mFill = mesh(new THREE.BufferGeometry(), mat(light ? 0x0c0a10 : mouthColor, 8), g, 0, MY, Z + 0.003);
  const mTeeth = mesh(new THREE.BufferGeometry(), mat(0xffffff, 9), g, 0, MY, Z + 0.004);
  const mTongue = mesh(circle(0.06, 18), mat(0xe8606d, 9), g, 0, MY, Z + 0.0045);
  // extras
  const blush = [-1, 1].map((s) => mesh(circle(0.07, 20), mat(0xff6e82, 10, 0), g, s * 0.3, 0.6, Z + 0.001)); blush.forEach((b) => b.scale.set(1.3, 0.6, 1));
  const sweat = mesh(new THREE.ShapeGeometry(dropShape(0.045)), mat(0x9ad8ff, 11), g, 0.4, 0.95, Z + 0.01);
  const tears = [-1, 1].map((s) => mesh(new THREE.PlaneGeometry(0.045, 1), mat(0x8ad0ff, 11, 0.85), g, s * EX, 0.6, Z + 0.009));
  const vein = mesh(new THREE.ShapeGeometry(veinShape(0.06)), mat(0xd8203a, 11), g, -0.3, 1.02, Z + 0.01);
  const dread = mesh(new THREE.PlaneGeometry(0.82, 0.36), new THREE.MeshBasicMaterial({ map: dreadTex(), transparent: true, depthWrite: false }), g, 0, 0.92, Z + 0.0005); dread.renderOrder = 10;
  let cur = merge({}), keys = [[0, 'neutral', {}]], words = null, amp = null, ampHz = 60, talkOn = () => true, blinks = [];
  const st = STYLES[style] || STYLES.normal;
  // deterministic blink schedule (with occasional double blinks)
  { let s = (style.length * 7919 + 13) % 2147483647; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); let tt = 0.6 + r(); while (tt < 600) { blinks.push(tt); if (r() < 0.22) blinks.push(tt + 0.24); tt += st.blink[0] + r() * (st.blink[1] - st.blink[0]); } }
  const blinkAt = (t, slow) => { const d = slow ? 0.24 : 0.13; let k = 0; for (const b of blinks) { if (b > t) break; const u = (t - b) / d; if (u < 1) k = Math.max(k, u < 0.4 ? u / 0.4 : 1 - (u - 0.4) / 0.6); } return k; };
  function stateAt(t) {
    let i = 0; for (let j = 0; j < keys.length; j++) if (keys[j][0] <= t) i = j;
    const [t0, name, o] = keys[i], prev = i > 0 ? keys[i - 1] : keys[i];
    const A = styled(merge({ ...PRESETS[prev[1]], ...prev[2] }), style), B = styled(merge({ ...PRESETS[name], ...o }), style);
    return mixState(A, B, ease((t - t0) / (o.blend || 0.09)));
  }
  function visemeAt(t) {
    if (!words) return null;
    for (const [s, e, w] of words) {
      if (t < s - 0.04 || t > e + 0.06) continue;
      const vs = visemesOf(w), tot = vs.reduce((a, v) => a + v[1], 0); let acc = s; const dur = Math.max(0.05, e - s);
      for (let k = 0; k < vs.length; k++) { const len = vs[k][1] / tot * dur; if (t <= acc + len || k === vs.length - 1) { const a = VIS[vs[k][0]], nx = VIS[(vs[k + 1] || ['rest'])[0]], u = ease((t - acc) / len); const m = {}; for (const p in a) m[p] = lerp(a[p], nx[p], Math.max(0, u - 0.5) * 2 * 0.6); return m; } acc += len; }
    }
    return VIS.rest;
  }
  return {
    group: g,
    /** expression keys [[time, preset, {look:[x,y], blend, ...overrides}], ...]; times a few frames before the beat */
    track(list) { keys = list.map(([t, n, o]) => [t, n, o || {}]).sort((a, b) => a[0] - b[0]); },
    /** words [[start,end,word]...] and an optional amplitude envelope (array at hz) for lip-sync; on(t): is this character speaking */
    lipsync(w, a = null, hz = 60, on = () => true) { words = w; amp = a; ampHz = hz; talkOn = on; },
    update(t) {
      const s = stateAt(t); cur = s;
      // pupils: look direction + nervous darting (quick saccades)
      let lx = s.look[0], ly = s.look[1];
      if (s.dart > 0.2) { const i = Math.floor(t / 0.32), h = Math.sin(i * 91.7) * 43758.5; const r = h - Math.floor(h); lx += (r - 0.5) * 1.4 * s.dart; ly += (Math.sin(i * 13.1) * 0.3) * s.dart; }
      const blink = blinkAt(t, s.lid > 0.3 && s.browL[1] > 0.3);
      const lid = Math.min(1, s.lid + blink * (1 - s.lid));
      eyes.forEach(({ e, outline, white, pupil, hi, hi2, star, lash, arc }) => {
        const rx = 0.085 * (1 + (s.open - 1) * 0.35), ry = 0.085 * s.open;
        const top = ry - lid * 2 * ry, bot = -ry + Math.min(s.squint, 0.55) * 1.2 * ry; // lid line, lower lid line
        const happy = Math.max(0, (s.squint - 0.55) / 0.3); // past ~0.6 the eye becomes a ^ arc
        const poly = clipY(ellipsePts(rx, ry, 36), Math.max(bot, -ry), Math.min(top, ry));
        const open = poly.length > 2 && top - bot > 0.012 && happy < 0.5;
        setPoly(white, open ? poly : null); setPoly(outline, open && !light ? scalePts(poly, 1.13, 0.012) : null);
        const pr = 0.047 * s.pupil, px = Math.max(-1, Math.min(1, lx)) * (rx - pr - 0.006), py = Math.max(-1, Math.min(1, ly)) * (ry - pr - 0.006);
        setPoly(pupil, open ? clipConvex(ellipsePts(pr, pr, 20, px, py), poly) : null);
        const hx = px + 0.018 * s.pupil, hy = py + 0.022 * s.pupil; hi.visible = open && hy < top - 0.01 && hy > bot + 0.01; hi.position.set(hx, hy, Z + 0.004); hi2.visible = hi.visible; hi2.position.set(px - 0.012, py - 0.015, Z + 0.004);
        star.visible = open && s.sparkle > 0.4; star.position.set(px, py, Z + 0.005); star.rotation.z = t * 2; star.scale.setScalar(0.8 + 0.2 * Math.sin(t * 8));
        lash.visible = !open || lid > 0.2; lash.scale.x = (open ? 2 * Math.sqrt(Math.max(0, 1 - (top / ry) ** 2)) * rx : 2 * rx) + 0.02; lash.position.set(0, open ? top : (top + bot) / 2, Z + 0.007);
        if (happy > 0.5) { lash.visible = false; setPoly(arc, arcPts(rx * 1.05, ry * 0.7, 0.022)); } else setPoly(arc, null);
      });
      brows.forEach((b, i) => { const [r, a] = i ? s.browR : s.browL, side = i ? 1 : -1; b.position.set(side * EX, EY + 0.15 + r + Math.max(0, s.open - 1) * 0.06, Z + 0.008); b.rotation.z = -side * a; });
      // mouth: expression + lip-sync viseme scaled by the voice amplitude
      const m = { ...s.mouth };
      if (words && talkOn(t)) { const v = visemeAt(t); if (v) { const a = amp ? amp[Math.min(amp.length - 1, Math.max(0, Math.round(t * ampHz)))] : 0.7; const k = 0.45 + 0.75 * a; m.open = Math.max(m.open * 0.35, v.open * k); m.w = lerp(m.w, m.w * v.w, 0.8); m.round = Math.max(m.round * 0.5, v.round); m.teeth = Math.max(m.teeth * 0.6, v.teeth); } }
      buildMouth(m, mOutline, mFill, mTeeth, mTongue, light, t);
      blush.forEach((b) => (b.material.opacity = s.blush * 0.55));
      sweat.visible = s.sweat > 0.2; sweat.position.y = 0.95 - ((t * 0.25) % 0.25); sweat.material.opacity = Math.min(1, s.sweat);
      tears.forEach((tr, i) => { tr.visible = s.tears > 0.2; const len = 0.2 + 0.25 * s.tears + 0.03 * Math.sin(t * 6 + i); tr.scale.y = len; tr.position.y = EY - 0.07 - len / 2; });
      vein.visible = s.vein > 0.3; vein.scale.setScalar(1 + 0.15 * Math.max(0, Math.sin(t * 9)));
      dread.visible = s.dread > 0.05; dread.material.opacity = s.dread * 0.85;
    },
    state: () => cur,
  };
}

// ---------------------------------------------------------------- mouth geometry from parameters
function buildMouth(m, outline, fill, teeth, tongue, light, t) {
  const hw = 0.125 * m.w * (1 - 0.35 * m.round), open = Math.max(0, m.open), c = m.curve;
  const cL = c * 0.055 + m.skew * 0.035, cR = c * 0.055 - m.skew * 0.035;
  const thick = 0.016 + open * 0.17 + m.round * open * 0.04;
  const upY = 0.004 - Math.min(c, 0) * 0.035 + m.round * open * 0.03 - Math.max(c, 0) * 0.012;
  const loY = upY - thick - Math.max(c, 0) * 0.06 * (0.4 + open);
  const shape = (grow) => {
    const s = new THREE.Shape(), g = grow, n = 14;
    s.moveTo(-hw - g, cL);
    s.quadraticCurveTo(0, upY + g * 1.2, hw + g, cR);
    for (let i = n; i >= 0; i--) { const u = i / n, x = lerp(-hw - g, hw + g, u), mid = 1 - Math.pow(2 * u - 1, 2), y = lerp(cL, cR, u) * (1 - mid) + (loY - g * 1.2) * mid + (m.wobble ? Math.sin(u * Math.PI * 6 + t * 10) * 0.012 * m.wobble * mid : 0); s.lineTo(x, y); }
    return s;
  };
  const set = (o, geo) => { o.geometry.dispose(); o.geometry = geo; };
  set(outline, new THREE.ShapeGeometry(shape(light ? 0.014 : 0.006), 6)); set(fill, new THREE.ShapeGeometry(shape(0), 6));
  fill.visible = open > 0.03 || !light; outline.visible = true;
  if (!light && open <= 0.03) fill.visible = false; // closed mouth = just the ink line
  const tH = Math.min(thick * 0.45, 0.05) * m.teeth;
  if (tH > 0.004 && open > 0.05) { const s = new THREE.Shape(); s.moveTo(-hw * 0.8, lerp(cL, upY, 0.35) - 0.002); s.quadraticCurveTo(0, upY - 0.004, hw * 0.8, lerp(cR, upY, 0.35) - 0.002); s.lineTo(hw * 0.7, lerp(cR, upY, 0.35) - tH); s.quadraticCurveTo(0, upY - tH - 0.006, -hw * 0.7, lerp(cL, upY, 0.35) - tH); s.closePath(); set(teeth, new THREE.ShapeGeometry(s, 6)); teeth.visible = true; } else teeth.visible = false;
  tongue.visible = open > 0.3 && (m.tongue > 0.2 || open > 0.5); tongue.position.set(0, 0.47 + loY + 0.035, tongue.position.z); tongue.scale.set(hw / 0.06 * 0.55, 0.45, 1);
}


// ---------------------------------------------------------------- polygon helpers for eyes (convex clipping)
function ellipsePts(rx, ry, n, cx = 0, cy = 0) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
function clipHalf(pts, inside, inter) { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(inter(a, b)); } return out; }
function clipY(pts, lo, hi) { const ix = (y) => (a, b) => { const u = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * u, y]; }; let p = clipHalf(pts, (q) => q[1] <= hi, ix(hi)); p = clipHalf(p, (q) => q[1] >= lo, ix(lo)); return p; }
function clipConvex(pts, clip) { let out = pts; for (let i = 0; i < clip.length && out.length; i++) { const a = clip[i], b = clip[(i + 1) % clip.length]; const side = (q) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) >= 0; const inter = (p, q) => { const x1 = p[0], y1 = p[1], x2 = q[0], y2 = q[1], x3 = a[0], y3 = a[1], x4 = b[0], y4 = b[1]; const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4) || 1e-9; const u = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d; return [x1 + u * (x2 - x1), y1 + u * (y2 - y1)]; }; out = clipHalf(out, side, inter); } return out; }
function scalePts(pts, k, pad) { return pts.map(([x, y]) => { const l = Math.hypot(x, y) || 1; return [x * k + x / l * pad * 0, y * k + y / l * pad * 0]; }); }
function arcPts(rx, ry, th) { const p = [], n = 16; for (let i = 0; i <= n; i++) { const a = Math.PI * (i / n); p.push([Math.cos(a) * rx, Math.sin(a) * ry - ry * 0.3]); } for (let i = n; i >= 0; i--) { const a = Math.PI * (i / n); p.push([Math.cos(a) * (rx - th), Math.sin(a) * (ry - th) - ry * 0.3]); } return p; }
function setPoly(m, pts) { if (!pts || pts.length < 3) { m.visible = false; return; } m.visible = true; const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath(); m.geometry.dispose(); m.geometry = new THREE.ShapeGeometry(sh); }

// ---------------------------------------------------------------- shapes and textures
function roundRect(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, 0, h / 2, -Math.PI / 2, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, 0, h / 2, Math.PI / 2, Math.PI * 1.5); return s; }
function starShape(r) { const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * 0.35 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath(); return s; }
function dropShape(r) { const s = new THREE.Shape(); s.moveTo(0, r * 1.6); s.quadraticCurveTo(r, 0, 0, -r); s.quadraticCurveTo(-r, 0, 0, r * 1.6); return s; }
function veinShape(r) { const s = new THREE.Shape(); const arm = (a) => { const c = Math.cos(a), sn = Math.sin(a); return [[c * r * 0.25 - sn * r * 0.12, sn * r * 0.25 + c * r * 0.12], [c * r - sn * r * 0.25, sn * r + c * r * 0.25], [c * r * 1.05, sn * r * 1.05], [c * r + sn * r * 0.25, sn * r - c * r * 0.25], [c * r * 0.25 + sn * r * 0.12, sn * r * 0.25 - c * r * 0.12]]; }; const pts = [0, 1, 2, 3].flatMap((k) => arm(k * Math.PI / 2 + Math.PI / 4)); s.moveTo(...pts[0]); pts.slice(1).forEach((p) => s.lineTo(...p)); s.closePath(); return s; }
function dreadTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(40,20,70,.95)'); gr.addColorStop(1, 'rgba(40,20,70,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(20,10,40,.8)'; g.lineWidth = 3; for (let x = 6; x < 64; x += 9) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 26 + (x % 3) * 6); g.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
