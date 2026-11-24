// ENGINE kit v2: Packed 3-sided Caribbean Cup '94 toon stadium with ink edge outlines, sky dome + clouds,
// animated crowd tiers, painted ad boards, corner flags, floodlights, hero soccer ball, and grounded story easels.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {INK} from '../../chars/charparts';
import {LOOK_RAMP} from '../../look/look';

export type ScoreState = {
  bar: number;
  grn: number;
  clock: string;
  banner: string;
  highlight?: boolean;
};

export type BallState = {
  p: [number, number, number];
  spin?: number;
  scale?: number;
};

export type StoryBoards = {
  ruleboard?: {p: [number, number, number]; ry?: number; scrapped?: boolean; scale?: number};
  ticket?: {p: [number, number, number]; ry?: number; scale?: number};
};

function makeCanvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Box with crisp dark ink wireframe edges so 3D stadium matches hand-inked 2D characters */
const InkBox: React.FC<{args: [number, number, number]; position?: [number, number, number]; rotation?: [number, number, number]; color?: string; map?: THREE.Texture; castShadow?: boolean; receiveShadow?: boolean}> = ({
  args, position = [0, 0, 0], rotation = [0, 0, 0], color = '#ffffff', map, castShadow, receiveShadow,
}) => {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...args)), [args[0], args[1], args[2]]);
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={args} />
        {map ? <meshToonMaterial map={map} gradientMap={LOOK_RAMP} /> : <meshToonMaterial color={color} gradientMap={LOOK_RAMP} />}
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={INK} />
      </lineSegments>
    </group>
  );
};

/** Warm Caribbean sky gradient dome + stylized clouds */
function useSkyTex() {
  return useMemo(
    () =>
      makeCanvasTex(1024, 512, (g, w, h) => {
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0.0, '#2a6bc4');
        grad.addColorStop(0.42, '#6ca8e8');
        grad.addColorStop(0.68, '#d9e8f5');
        grad.addColorStop(1.0, '#f4e3c1');
        g.fillStyle = grad;
        g.fillRect(0, 0, w, h);
        // Stylized soft toon clouds
        const clouds: [number, number, number][] = [
          [140, 145, 52], [390, 120, 64], [670, 155, 58], [910, 130, 48],
          [260, 210, 44], [540, 195, 42], [810, 205, 50],
        ];
        for (const [cx, cy, r] of clouds) {
          g.fillStyle = 'rgba(255, 252, 245, 0.92)';
          g.beginPath();
          g.arc(cx, cy, r, 0, Math.PI * 2);
          g.arc(cx - r * 0.75, cy + r * 0.2, r * 0.72, 0, Math.PI * 2);
          g.arc(cx + r * 0.8, cy + r * 0.18, r * 0.75, 0, Math.PI * 2);
          g.fill();
        }
      }),
    []
  );
}

/** Packed colorful cartoon crowd texture for stadium stands */
function useCrowdTex() {
  return useMemo(
    () =>
      makeCanvasTex(1024, 256, (g, w, h) => {
        g.fillStyle = '#3d4a66';
        g.fillRect(0, 0, w, h);
        const palette = ['#1e4ea8', '#f2b234', '#c8432a', '#2f6f73', '#d0532f', '#fbf3e0', '#3f9a8c', '#8f6aa8'];
        let seed = 1337;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        for (let row = 0; row < 5; row++) {
          const y = 32 + row * 46;
          // Bench strip
          g.fillStyle = row % 2 === 0 ? '#505e7a' : '#46546e';
          g.fillRect(0, y + 10, w, 18);
          for (let x = 14; x < w - 10; x += 26) {
            const jx = x + (rnd() - 0.5) * 6;
            const jy = y + (rnd() - 0.5) * 5;
            const col = palette[Math.floor(rnd() * palette.length)];
            // Shirt
            g.fillStyle = col;
            g.strokeStyle = INK;
            g.lineWidth = 2.5;
            g.beginPath();
            g.roundRect(jx - 9, jy - 2, 18, 20, 5);
            g.fill();
            g.stroke();
            // White ball head
            g.fillStyle = '#fdf9f6';
            g.beginPath();
            g.arc(jx, jy - 10, 7.5, 0, Math.PI * 2);
            g.fill();
            g.stroke();
          }
        }
      }),
    []
  );
}

/** Painted Caribbean Cup '94 perimeter ad board texture */
function useAdBoardTex() {
  return useMemo(
    () =>
      makeCanvasTex(1024, 96, (g, w, h) => {
        const panels = [
          {bg: '#1e4ea8', fg: '#f2b234', txt: "CARIBBEAN CUP '94"},
          {bg: '#d0532f', fg: '#fbf3e0', txt: 'BARBADOS NATIONAL STADIUM'},
          {bg: '#2f6f73', fg: '#f2b234', txt: 'GOLDEN GOAL = x2'},
          {bg: '#c8432a', fg: '#fbf3e0', txt: 'GROUP 1 QUALIFIER'},
        ];
        const pw = w / panels.length;
        panels.forEach((p, i) => {
          g.fillStyle = p.bg;
          g.fillRect(i * pw, 0, pw, h);
          g.strokeStyle = INK;
          g.lineWidth = 6;
          g.strokeRect(i * pw + 3, 3, pw - 6, h - 6);
          g.fillStyle = p.fg;
          g.font = 'bold 20px "Arial Black", sans-serif';
          g.textAlign = 'center';
          g.fillText(p.txt, i * pw + pw / 2, h / 2 + 7);
        });
      }),
    []
  );
}

/** Striped toon grass + crisp white football pitch markings */
function usePitchTex() {
  return useMemo(
    () =>
      makeCanvasTex(1024, 576, (g, w, h) => {
        const stripes = 14;
        for (let i = 0; i < stripes; i++) {
          g.fillStyle = i % 2 === 0 ? '#36874b' : '#429a58';
          g.fillRect((i * w) / stripes, 0, w / stripes + 1, h);
        }
        g.strokeStyle = '#fbf3e0';
        g.lineWidth = 6;
        const m = 34;
        g.strokeRect(m, m, w - m * 2, h - m * 2);
        g.beginPath();
        g.moveTo(w / 2, m);
        g.lineTo(w / 2, h - m);
        g.stroke();
        g.beginPath();
        g.arc(w / 2, h / 2, 74, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = '#fbf3e0';
        g.beginPath();
        g.arc(w / 2, h / 2, 7, 0, Math.PI * 2);
        g.fill();
        const pbW = 148, pbH = 260, gbW = 54, gbH = 132;
        g.strokeRect(m, (h - pbH) / 2, pbW, pbH);
        g.strokeRect(m, (h - gbH) / 2, gbW, gbH);
        g.strokeRect(w - m - pbW, (h - pbH) / 2, pbW, pbH);
        g.strokeRect(w - m - gbW, (h - gbH) / 2, gbW, gbH);
        g.beginPath();
        g.arc(m + 102, h / 2, 6, 0, Math.PI * 2);
        g.arc(w - m - 102, h / 2, 6, 0, Math.PI * 2);
        g.fill();
      }),
    []
  );
}

/** Classic black-and-white soccer ball texture */
function useBallTex() {
  return useMemo(
    () =>
      makeCanvasTex(256, 128, (g, w, h) => {
        g.fillStyle = '#fdf9f6';
        g.fillRect(0, 0, w, h);
        g.fillStyle = INK;
        const pts: [number, number][] = [
          [32, 34], [96, 26], [160, 34], [224, 26],
          [64, 72], [128, 70], [192, 72],
          [32, 108], [112, 108], [192, 108],
        ];
        for (const [cx, cy] of pts) {
          g.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = cx + Math.cos(a) * 14;
            const y = cy + Math.sin(a) * 14;
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.closePath();
          g.fill();
        }
      }),
    []
  );
}

/** Dynamic scoreboard texture */
function useScoreTex(score: ScoreState) {
  return useMemo(
    () =>
      makeCanvasTex(512, 256, (g, w, h) => {
        g.fillStyle = '#241726';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#263044';
        g.fillRect(10, 10, w - 20, h - 20);
        g.fillStyle = score.highlight ? '#d0532f' : '#2f6f73';
        g.fillRect(10, 10, w - 20, 48);
        g.fillStyle = '#fbf3e0';
        g.font = 'bold 26px "Arial Black", Impact, sans-serif';
        g.textAlign = 'center';
        g.fillText(score.banner, w / 2, 43);
        g.fillStyle = '#1e4ea8';
        g.fillRect(26, 76, 155, 118);
        g.fillStyle = '#c8432a';
        g.fillRect(w - 181, 76, 155, 118);
        g.fillStyle = '#f2b234';
        g.font = 'bold 30px "Arial Black", sans-serif';
        g.fillText('BAR', 103, 114);
        g.fillText('GRN', w - 103, 114);
        g.fillStyle = '#fdf9f6';
        g.font = 'bold 64px "Arial Black", sans-serif';
        g.fillText(String(score.bar), 103, 178);
        g.fillText(String(score.grn), w - 103, 178);
        g.fillStyle = '#f2b234';
        g.font = 'bold 42px "Arial Black", sans-serif';
        g.fillText(score.clock, w / 2, 148);
        g.fillStyle = '#e8d8b0';
        g.font = 'bold 18px sans-serif';
        g.fillText("CARIBBEAN CUP '94", w / 2, 224);
      }),
    [score.bar, score.grn, score.clock, score.banner, score.highlight]
  );
}

/** In-world Tournament Rulebook Sign */
function useRuleTex(scrapped: boolean) {
  return useMemo(
    () =>
      makeCanvasTex(512, 384, (g, w, h) => {
        g.fillStyle = '#241726';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#fbf3e0';
        g.fillRect(14, 14, w - 28, h - 28);
        g.fillStyle = '#2f6f73';
        g.fillRect(14, 14, w - 28, 68);
        g.fillStyle = '#fbf3e0';
        g.font = 'bold 32px "Arial Black", sans-serif';
        g.textAlign = 'center';
        g.fillText('OFFICIAL RULEBOOK', w / 2, 60);
        g.fillStyle = '#241726';
        g.font = 'bold 30px "Arial Black", sans-serif';
        g.fillText('TIED AFTER 90 MIN?', w / 2, 142);
        g.fillStyle = '#d0532f';
        g.font = 'bold 46px "Arial Black", sans-serif';
        g.fillText('GOLDEN GOAL', w / 2, 212);
        g.fillStyle = '#1e4ea8';
        g.font = 'bold 58px "Arial Black", sans-serif';
        g.fillText('= 2 GOALS!', w / 2, 286);
        g.fillStyle = '#6b5240';
        g.font = 'bold 22px sans-serif';
        g.fillText('+30 MIN EXTRA TIME', w / 2, 336);
        if (scrapped) {
          g.save();
          g.translate(w / 2, h / 2 + 12);
          g.rotate(-0.22);
          g.fillStyle = 'rgba(255, 240, 236, 0.94)';
          g.fillRect(-210, -56, 420, 112);
          g.strokeStyle = '#c8231a';
          g.lineWidth = 14;
          g.strokeRect(-210, -56, 420, 112);
          g.fillStyle = '#c8231a';
          g.font = 'bold 64px "Arial Black", sans-serif';
          g.fillText('SCRAPPED!', 0, 22);
          g.restore();
        }
      }),
    [scrapped]
  );
}

/** In-world Golden Jackpot Ticket Prop */
function useTicketTex() {
  return useMemo(
    () =>
      makeCanvasTex(512, 256, (g, w, h) => {
        g.fillStyle = '#241726';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#f2b234';
        g.fillRect(12, 12, w - 24, h - 24);
        g.strokeStyle = '#7a3b22';
        g.lineWidth = 6;
        g.strokeRect(26, 26, w - 52, h - 52);
        g.fillStyle = '#241726';
        g.textAlign = 'center';
        g.font = 'bold 34px "Arial Black", sans-serif';
        g.fillText('JACKPOT TICKET', w / 2, 92);
        g.fillStyle = '#c8432a';
        g.font = 'bold 50px "Arial Black", sans-serif';
        g.fillText('+30 MIN = x2', w / 2, 168);
        g.fillStyle = '#241726';
        g.font = 'bold 22px sans-serif';
        g.fillText('ONE GOAL WINS BY TWO', w / 2, 212);
      }),
    []
  );
}

function useBannerTex(label: string, bg: string, fg: string) {
  return useMemo(
    () =>
      makeCanvasTex(256, 64, (g, w, h) => {
        g.fillStyle = '#241726';
        g.fillRect(0, 0, w, h);
        g.fillStyle = bg;
        g.fillRect(4, 4, w - 8, h - 8);
        g.fillStyle = fg;
        g.font = 'bold 32px "Arial Black", sans-serif';
        g.textAlign = 'center';
        g.fillText(label, w / 2, 44);
      }),
    [label, bg, fg]
  );
}

const Goal: React.FC<{x: number; side: 1 | -1; label: string; col: string; textCol: string}> = ({x, side, label, col, textCol}) => {
  const banner = useBannerTex(label, col, textCol);
  const w = 4.6, h = 2.15, d = 1.4;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, h / 2, -w / 2]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, h, 10]} />
        <meshToonMaterial color="#fdf9f6" gradientMap={LOOK_RAMP} />
      </mesh>
      <mesh position={[0, h / 2, w / 2]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, h, 10]} />
        <meshToonMaterial color="#fdf9f6" gradientMap={LOOK_RAMP} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, w + 0.16, 10]} />
        <meshToonMaterial color="#fdf9f6" gradientMap={LOOK_RAMP} />
      </mesh>
      <mesh position={[side * d, h / 2, -w / 2]}>
        <cylinderGeometry args={[0.055, 0.055, h, 8]} />
        <meshToonMaterial color="#e8d8b0" gradientMap={LOOK_RAMP} />
      </mesh>
      <mesh position={[side * d, h / 2, w / 2]}>
        <cylinderGeometry args={[0.055, 0.055, h, 8]} />
        <meshToonMaterial color="#e8d8b0" gradientMap={LOOK_RAMP} />
      </mesh>
      <mesh position={[side * d, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#fbf3e0" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[side * (d / 2), h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[d, w]} />
        <meshBasicMaterial color="#fbf3e0" transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[side * (d / 2), h / 2, -w / 2]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial color="#fbf3e0" transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[side * (d / 2), h / 2, w / 2]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial color="#fbf3e0" transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[side * 0.2, h + 0.52, 0]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <boxGeometry args={[2.6, 0.62, 0.08]} />
        <meshBasicMaterial map={banner} />
      </mesh>
    </group>
  );
};

const CornerFlag: React.FC<{p: [number, number, number]}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.65, 0]}>
      <cylinderGeometry args={[0.03, 0.035, 1.3, 6]} />
      <meshToonMaterial color="#fdf9f6" gradientMap={LOOK_RAMP} />
    </mesh>
    <mesh position={[0.22, 1.15, 0]}>
      <boxGeometry args={[0.42, 0.26, 0.03]} />
      <meshToonMaterial color="#f2b234" gradientMap={LOOK_RAMP} />
    </mesh>
  </group>
);

const Palm: React.FC<{p: [number, number, number]}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 2.6, 0]} rotation={[0, 0, 0.08]} castShadow>
      <cylinderGeometry args={[0.16, 0.28, 5.2, 8]} />
      <meshToonMaterial color="#8a5a32" gradientMap={LOOK_RAMP} />
    </mesh>
    {[0, 1.05, 2.1, 3.15, 4.2, 5.25].map((a, i) => (
      <mesh key={i} position={[Math.cos(a) * 1.05, 5.1, Math.sin(a) * 1.05]} rotation={[0.45 * Math.sin(a), a, -0.45 * Math.cos(a)]}>
        <boxGeometry args={[2.2, 0.14, 0.5]} />
        <meshToonMaterial color={i % 2 === 0 ? '#2f8a52' : '#3fa062'} gradientMap={LOOK_RAMP} />
      </mesh>
    ))}
  </group>
);

export const Stadium: React.FC<{score: ScoreState; ball: BallState; boards?: StoryBoards}> = ({score, ball, boards}) => {
  const skyTex = useSkyTex();
  const crowdTex = useCrowdTex();
  const adTex = useAdBoardTex();
  const pitchTex = usePitchTex();
  const ballTex = useBallTex();
  const scoreTex = useScoreTex(score);
  const ruleTex = useRuleTex(Boolean(boards?.ruleboard?.scrapped));
  const ticketTex = useTicketTex();

  return (
    <group>
      {/* Sky gradient + clouds dome */}
      <mesh>
        <sphereGeometry args={[95, 24, 16]} />
        <meshBasicMaterial map={skyTex} side={THREE.BackSide} />
      </mesh>

      {/* Lush stadium apron (deep green turf skirt instead of beige desert!) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshToonMaterial color="#2c6e3d" gradientMap={LOOK_RAMP} />
      </mesh>
      {/* Main football pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 18]} />
        <meshToonMaterial map={pitchTex} gradientMap={LOOK_RAMP} />
      </mesh>

      {/* 4 Corner flags */}
      <CornerFlag p={[-15.0, 0, -8.0]} />
      <CornerFlag p={[-15.0, 0, 8.0]} />
      <CornerFlag p={[15.0, 0, -8.0]} />
      <CornerFlag p={[15.0, 0, 8.0]} />

      {/* Goals */}
      <Goal x={-14.5} side={-1} label="BARBADOS" col="#1e4ea8" textCol="#f2b234" />
      <Goal x={14.5} side={1} label="GRENADA" col="#c8432a" textCol="#f2b234" />

      {/* Painted Perimeter Ad Boards (back + left + right) */}
      <InkBox args={[34, 0.95, 0.22]} position={[0, 0.48, -10.3]} map={adTex} />
      <InkBox args={[0.22, 0.95, 20]} position={[-17.4, 0.48, 0]} map={adTex} />
      <InkBox args={[0.22, 0.95, 20]} position={[17.4, 0.48, 0]} map={adTex} />

      {/* BACK GRANDSTAND: packed colorful crowd + roof canopy + ink outlines */}
      <InkBox args={[36, 4.2, 4.6]} position={[0, 2.1, -13.6]} color="#3d4a66" receiveShadow />
      <mesh position={[0, 2.5, -11.25]} rotation={[-0.45, 0, 0]}>
        <planeGeometry args={[35.5, 4.6]} />
        <meshBasicMaterial map={crowdTex} />
      </mesh>
      {/* Back canopy roof */}
      <InkBox args={[36.8, 0.35, 5.2]} position={[0, 5.4, -13.2]} color="#2f6f73" castShadow />

      {/* LEFT END STAND (behind Barbados goal) */}
      <InkBox args={[4.4, 3.6, 22]} position={[-20.2, 1.8, -1]} color="#3d4a66" />
      <mesh position={[-17.95, 2.1, -1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[21.5, 3.8]} />
        <meshBasicMaterial map={crowdTex} />
      </mesh>
      <InkBox args={[5.0, 0.3, 22.8]} position={[-19.9, 4.5, -1]} color="#1e4ea8" />

      {/* RIGHT END STAND (behind Grenada goal) */}
      <InkBox args={[4.4, 3.6, 22]} position={[20.2, 1.8, -1]} color="#3d4a66" />
      <mesh position={[17.95, 2.1, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[21.5, 3.8]} />
        <meshBasicMaterial map={crowdTex} />
      </mesh>
      <InkBox args={[5.0, 0.3, 22.8]} position={[19.9, 4.5, -1]} color="#c8432a" />

      {/* Dynamic elevated scoreboard mounted above the back canopy */}
      <group position={[0, 7.1, -11.4]}>
        <InkBox args={[0.26, 2.4, 0.26]} position={[-2.1, -1.6, 0]} color="#3d4a66" />
        <InkBox args={[0.26, 2.4, 0.26]} position={[2.1, -1.6, 0]} color="#3d4a66" />
        <mesh castShadow>
          <boxGeometry args={[5.4, 2.7, 0.28]} />
          <meshBasicMaterial map={scoreTex} />
        </mesh>
      </group>

      {/* Floodlight towers & tropical palms */}
      {[-17.2, 17.2].map((x, i) => (
        <group key={i} position={[x, 0, -11.5]}>
          <mesh position={[0, 5.6, 0]}>
            <cylinderGeometry args={[0.16, 0.26, 11.2, 8]} />
            <meshToonMaterial color="#3d4a66" gradientMap={LOOK_RAMP} />
          </mesh>
          <InkBox args={[2.4, 1.0, 0.4]} position={[0, 11.2, 0.3]} color="#fbf3e0" />
        </group>
      ))}
      <Palm p={[-19.5, 0, -14.5]} />
      <Palm p={[-10.5, 0, -17.2]} />
      <Palm p={[10.5, 0, -17.2]} />
      <Palm p={[19.5, 0, -14.5]} />

      {/* Hero Soccer Ball */}
      <mesh position={ball.p} rotation={[0, (ball.spin ?? 0) * 0.7, -(ball.spin ?? 0)]} scale={ball.scale ?? 1} castShadow>
        <sphereGeometry args={[0.25, 18, 14]} />
        <meshToonMaterial map={ballTex} gradientMap={LOOK_RAMP} />
      </mesh>

      {/* Grounded Rulebook Easel (never stacks over scoreboard!) */}
      {boards?.ruleboard && (
        <group position={boards.ruleboard.p} rotation={[0, boards.ruleboard.ry ?? 0, 0]} scale={boards.ruleboard.scale ?? 1}>
          <InkBox args={[0.14, 1.15, 0.14]} position={[-0.7, 0.58, 0]} color="#7a3b22" />
          <InkBox args={[0.14, 1.15, 0.14]} position={[0.7, 0.58, 0]} color="#7a3b22" />
          <mesh position={[0, 1.85, 0]} castShadow>
            <boxGeometry args={[2.2, 1.65, 0.14]} />
            <meshBasicMaterial map={ruleTex} />
          </mesh>
        </group>
      )}

      {/* Grounded Golden Jackpot Ticket Stand (no longer floating in midair!) */}
      {boards?.ticket && (
        <group position={boards.ticket.p} rotation={[0, boards.ticket.ry ?? 0, 0]} scale={boards.ticket.scale ?? 1}>
          <InkBox args={[0.12, 1.0, 0.12]} position={[-0.65, 0.5, 0]} color="#7a3b22" />
          <InkBox args={[0.12, 1.0, 0.12]} position={[0.65, 0.5, 0]} color="#7a3b22" />
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[2.2, 1.1, 0.12]} />
            <meshBasicMaterial map={ticketTex} />
          </mesh>
        </group>
      )}
    </group>
  );
};
