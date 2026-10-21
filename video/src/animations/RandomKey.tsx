import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-01 S2: a private key is a random number. One stage per narration line:
//   0 256 bits = 32 bytes; 2²⁵⁶ ≈ 10⁷⁷, about the atoms in the universe
//   1 truly random: nobody can guess it
//   2 256 coin flips, heads 0 tails 1
//   3 a d20: 1–16 → 0–F, 17–20 thrown away; 64 hex digits
//   4 software: a formula from a seed; guess the seed and the whole stream follows
//   5 2013: Android's random numbers had a flaw, Bitcoin wallets were robbed
//   6 today: hardware noise seeds the formula; safe if the code is sound
// Every digit shown comes from a fixed seed below: made up, marked 示意.
const GREEN = '#5BC98C';
const RED = '#E5686A';
const HEX = '0123456789ABCDEF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

// mulberry32: a tiny seeded generator, so every render shows the same digits.
const generator = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const bitsRng = generator(256);
const BITS = Array.from({length: 256}, () => (bitsRng() < 0.5 ? 0 : 1));
// d20 rolls until 64 of them land on 1–16.
const ROLLS: number[] = [];
const rollRng = generator(20);
while (ROLLS.filter((r) => r <= 16).length < 64) ROLLS.push(1 + Math.floor(rollRng() * 20));
const streamRng = generator(7);
const STREAM = Array.from({length: 40}, () => Math.floor(streamRng() * 10)).join('');

// Stage 2 and 3 pacing: the first few slowly enough to follow, then the rest in a rush.
const paced = (t: number, slow: number, each: number, fastPerFrame: number, total: number) =>
  t < slow * each ? Math.floor(t / each) : Math.min(total, slow + Math.floor((t - slow * each) * fastPerFrame));

const Grid: React.FC<{cells: string[]; cols: number; size: number; shown: number; color: string; font: number; border: string}> = ({
  cells, cols, size, shown, color, font, border,
}) => (
  <div
    style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: 4, padding: 16,
      background: theme.panel, borderRadius: 20, border: `4px solid ${border}`,
    }}
  >
    {cells.map((c, i) => (
      <div
        key={i}
        style={{
          width: size, height: size, borderRadius: 6, background: i < shown ? '#22324F' : '#1B2840',
          color, fontSize: font, fontFamily: 'Menlo, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {i < shown ? c : ''}
      </div>
    ))}
  </div>
);

// A coin seen edge-on as it turns: its width follows |cos|.
const Coin: React.FC<{t: number; face: number}> = ({t, face}) => (
  <div
    style={{
      width: 200, height: 200, borderRadius: '50%', background: '#D9A63A', border: '10px solid #F2C75C', boxSizing: 'border-box',
      transform: `scaleX(${Math.max(0.08, Math.abs(Math.cos(t * 0.5)))})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#5A3B00', fontWeight: 700,
    }}
  >
    {face === 0 ? '正' : '反'}
  </div>
);

// A d20 as it is usually drawn: a hexagon outline around a centre triangle.
const D20: React.FC<{value: number; spin: number; bad: boolean}> = ({value, spin, bad}) => {
  const c = bad ? RED : theme.accent;
  const hex = Array.from({length: 6}, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [110 + 100 * Math.cos(a), 110 + 100 * Math.sin(a)];
  });
  const inner = [[110, 48], [164, 141], [56, 141]];
  return (
    <svg width={220} height={220} style={{transform: `rotate(${spin}deg)`}}>
      <polygon points={hex.map((p) => p.join(',')).join(' ')} fill="#1B2840" stroke={c} strokeWidth={6} />
      <polygon points={inner.map((p) => p.join(',')).join(' ')} fill="#22324F" stroke={c} strokeWidth={4} />
      {inner.map((p, i) => (
        <line key={i} x1={p[0]} y1={p[1]} x2={hex[[0, 2, 4][i]][0]} y2={hex[[0, 2, 4][i]][1]} stroke={c} strokeWidth={3} />
      ))}
      {[[inner[0], inner[1], hex[1]], [inner[1], inner[2], hex[3]], [inner[2], inner[0], hex[5]]].map((t, i) => (
        <polyline key={i} points={[t[0], t[2], t[1]].map((p) => p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={3} />
      ))}
      <text x={110} y={122} textAnchor="middle" fontSize={44} fontWeight={700} fill={c} transform={`rotate(${-spin} 110 110)`} dominantBaseline="middle">
        {value}
      </text>
    </svg>
  );
};

const Box: React.FC<{label: string; color?: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({label, color, children, style}) => (
  <div style={{background: theme.panel, borderRadius: 20, border: `4px solid ${color ?? '#2A3A55'}`, padding: '18px 26px', ...style}}>
    <div style={{fontSize: 34, color: color ?? theme.text, fontWeight: 600}}>{label}</div>
    {children}
  </div>
);

const Stream: React.FC<{text: string; shown: number; color: string}> = ({text, shown, color}) => (
  <div style={{fontFamily: 'Menlo, monospace', fontSize: 34, color, letterSpacing: 2, wordBreak: 'break-all', marginTop: 8}}>
    {text.slice(0, Math.round(text.length * shown))}
  </div>
);

// Hardware noise: a jagged line that keeps moving.
const Noise: React.FC<{t: number}> = ({t}) => {
  const pts = Array.from({length: 60}, (_, i) => {
    const x = i * 12;
    const y = 60 + 28 * Math.sin(i * 1.7 + t * 0.4) * Math.cos(i * 0.63 - t * 0.27) + 18 * Math.sin(i * 3.1 + t);
    return `${x},${y}`;
  });
  return (
    <svg width={710} height={120}>
      <polyline points={pts.join(' ')} fill="none" stroke={GREEN} strokeWidth={4} />
    </svg>
  );
};

const Arrow: React.FC<{opacity: number; label?: string; color?: string}> = ({opacity, label, color = theme.accent}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, height: 70, opacity, color, fontSize: 30}}>
    <div style={{fontSize: 52, lineHeight: 1}}>↓</div>
    {label}
  </div>
);

export const RandomKey: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;

  // Stages 0–2: the 256-bit grid; stage 3: the 64-digit grid; from stage 4 the software side.
  const coinFlips = at(2) ? paced(since(2), 8, 12, 3.5, 256) : 0;
  const bitsShown = at(2) ? coinFlips : Math.round(256 * fade(frame, 60));
  const rollIndex = at(3) ? paced(since(3), 8, 26, 0.34, ROLLS.length - 1) : 0;
  const hexDone = ROLLS.slice(0, at(3) ? rollIndex + 1 : 0).filter((r) => r <= 16);
  const roll = ROLLS[rollIndex];

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
          transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`,
        }}
      >
        {!at(4) && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
            <div style={{fontSize: 44, color: theme.text, fontWeight: 600}}>
              私钥 {at(3) ? '= 64 个十六进制数' : '= 256 位 = 32 字节'}
            </div>
            {at(3) ? (
              <Grid cells={hexDone.map((r) => HEX[r - 1]).concat(Array(64).fill('')).slice(0, 64)} cols={8} size={84} shown={hexDone.length} color={theme.accent} font={46} border="#2A3A55" />
            ) : (
              <Grid
                cells={BITS.map(String)} cols={16} size={44} shown={bitsShown} color={theme.text} font={26}
                border={at(1) && !at(2) ? GREEN : '#2A3A55'}
              />
            )}
          </div>
        )}

        {/* Stage 0–1: how many there are; nobody can guess. */}
        {!at(2) && (
          <div style={{position: 'absolute', left: 90, right: 90, top: 1120, display: 'flex', flexDirection: 'column', gap: 24, opacity: fade(since(0) - 90, 20)}}>
            <Box label="可能的数量">
              <div style={{fontSize: 56, color: theme.accent, marginTop: 6}}>2²⁵⁶ ≈ 1.16 × 10⁷⁷</div>
            </Box>
            <Box label="宇宙里的原子">
              <div style={{fontSize: 56, color: theme.muted, marginTop: 6}}>≈ 10⁸⁰</div>
            </Box>
            {at(1) && <div style={{fontSize: 48, color: GREEN, textAlign: 'center', fontWeight: 700, opacity: fade(since(1))}}>真随机：谁也猜不中</div>}
          </div>
        )}

        {/* Stage 2: coin flips fill the bits. */}
        {at(2) && !at(3) && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, opacity: fade(since(2))}}>
            <Coin t={since(2)} face={BITS[Math.min(255, coinFlips)]} />
            <div style={{fontSize: 44, color: theme.text}}>正面 → 0　　反面 → 1</div>
            <div style={{fontSize: 36, color: theme.muted}}>第 {Math.max(1, coinFlips)} / 256 次</div>
          </div>
        )}

        {/* Stage 3: d20, 1–16 → 0–F, 17–20 thrown away. */}
        {at(3) && !at(4) && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity: fade(since(3))}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 40}}>
              <D20 value={roll} spin={(rollIndex * 47) % 360} bad={roll > 16} />
              <div style={{fontSize: 56, fontWeight: 700, color: roll > 16 ? RED : theme.accent, width: 340}}>
                {roll > 16 ? `${roll} → 作废` : `${roll} → ${HEX[roll - 1]}`}
              </div>
            </div>
            <div style={{fontSize: 38, color: theme.text}}>1–16 → 0–F　　17–20 → 作废重掷</div>
            <div style={{fontSize: 32, color: theme.muted}}>已有 {hexDone.length} / 64 个</div>
          </div>
        )}

        {/* Stages 4–6: random numbers from software. */}
        {at(4) && (
          <div style={{position: 'absolute', left: 90, right: 90, top: 170, display: 'flex', flexDirection: 'column', gap: 6}}>
            <div style={{fontSize: 44, color: theme.text, fontWeight: 600, textAlign: 'center', marginBottom: 20}}>软件里的随机数</div>
            {at(6) ? (
              <Box label="硬件噪声" color={GREEN} style={{opacity: fade(since(6))}}>
                <Noise t={since(6)} />
              </Box>
            ) : (
              <Box label="种子" style={{opacity: fade(since(4))}}>
                <div style={{fontFamily: 'Menlo, monospace', fontSize: 40, color: theme.muted, marginTop: 6}}>{at(5) ? '可预测的种子' : '●●●●'}</div>
              </Box>
            )}
            <Arrow opacity={fade(since(4) - 10)} />
            <Box label="公式（伪随机数）" style={{opacity: fade(since(4) - 20)}} />
            <Arrow opacity={fade(since(4) - 30)} />
            <Box label="随机数" color={at(6) ? GREEN : undefined} style={{opacity: fade(since(4) - 40)}}>
              <Stream text={STREAM} shown={fade(since(at(6) ? 6 : 4) - 50, 60)} color={at(6) ? GREEN : theme.text} />
            </Box>
            {at(4) && !at(5) && (
              <div style={{marginTop: 40, opacity: fade(since(4) - 140)}}>
                <Box label="别人猜到同一个种子" color={RED}>
                  <Stream text={STREAM} shown={fade(since(4) - 170, 60)} color={RED} />
                </Box>
                <div style={{fontSize: 44, color: RED, fontWeight: 700, textAlign: 'center', marginTop: 24, opacity: fade(since(4) - 230)}}>
                  种子被猜到 → 后面全能算出来
                </div>
              </div>
            )}
            {at(5) && !at(6) && (
              <div style={{marginTop: 40, opacity: fade(since(5))}}>
                <Box label="2013 年 · 安卓随机数漏洞" color={RED}>
                  <div style={{fontSize: 44, color: RED, fontWeight: 700, marginTop: 10}}>比特币钱包被盗</div>
                </Box>
              </div>
            )}
            {at(6) && (
              <div style={{fontSize: 44, color: GREEN, fontWeight: 700, textAlign: 'center', marginTop: 40, opacity: fade(since(6) - 90)}}>
                代码没问题 → 随机数安全
              </div>
            )}
          </div>
        )}
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
