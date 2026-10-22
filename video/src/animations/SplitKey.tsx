import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-02 S4: a split backup. One stage per narration line:
//   0 the key
//   1 cut into pieces, kept apart
//   2 three pieces A, B, C; three places keep AB, BC, CA
//   3 whoever finds one place is a piece short: useless
//   4 any two places make the whole key; losing one is no loss
// The key is made-up digits, marked 示意.
export const KEY = '3a7f19c2e04b86d5f1a2c93e7b05d48a6c2e91f03b7d58a4e6c19f2d07b3a85e';
export const PIECES = [KEY.slice(0, 22), KEY.slice(22, 43), KEY.slice(43)];
export const NAMES = ['A', 'B', 'C'];
export const COLORS = ['#7FB2FF', '#F2B441', '#C58BFF'];
const GREEN = '#5BC98C';
const RED = '#E5686A';
const mono = 'Menlo, monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

const PLACES = [
  {icon: '🏠', name: '家里', has: [0, 1]},
  {icon: '🏢', name: '单位', has: [1, 2]},
  {icon: '🏡', name: '亲戚家', has: [2, 0]},
];

// One piece of the key: its letter and the first few digits.
export const Piece: React.FC<{i: number; size?: number; style?: React.CSSProperties}> = ({i, size = 1, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 10 * size, padding: `${8 * size}px ${14 * size}px`, borderRadius: 12 * size,
    background: '#1D2C47', border: `${3 * size}px solid ${COLORS[i]}`, ...style}}>
    <span style={{fontSize: 40 * size, fontWeight: 700, color: COLORS[i]}}>{NAMES[i]}</span>
    <span style={{fontFamily: mono, fontSize: 24 * size, color: theme.muted}}>{PIECES[i].slice(0, 6)}…</span>
  </div>
);

export const SplitKey: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  const cut = at(1) ? ease(since(1) - 10, 30) : 0; // the key splits into its three colours
  const apart = at(1) ? ease(since(1) - 40, 30) : 0; // and the pieces move apart
  const lost = show(4, 10, 15); // stage 4: the third place is gone
  const joined = at(4) ? ease(since(4) - 50, 30) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        {/* The key, its three pieces coloured once it is cut. */}
        <div style={{position: 'absolute', left: 90, right: 90, top: 170, background: theme.panel, borderRadius: 24, padding: '22px 30px',
          border: '4px solid #2A3A55', opacity: fade(frame) * (1 - 0.5 * apart)}}>
          <div style={{fontSize: 40, color: theme.text, fontWeight: 600}}>私钥</div>
          <div style={{fontFamily: mono, fontSize: 36, lineHeight: 1.5, marginTop: 10, wordBreak: 'break-all'}}>
            {PIECES.map((p, i) => (
              <span key={i} style={{color: cut > 0 ? COLORS[i] : theme.muted, opacity: cut > 0 ? 0.5 + 0.5 * cut : 1,
                borderBottom: cut > 0.5 ? `4px solid ${COLORS[i]}` : 'none', marginRight: cut > 0.5 ? 8 : 0}}>{p}</span>
            ))}
          </div>
        </div>

        {/* Stage 1: the three pieces, apart. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 470 + 20 * (1 - apart), display: 'flex', justifyContent: 'center', gap: 40 + 30 * apart,
          opacity: apart * (1 - show(2, 40))}}>
          {[0, 1, 2].map((i) => <Piece key={i} i={i} />)}
        </div>

        {/* Stage 2: three places, two pieces each. */}
        {PLACES.map((place, k) => {
          const isLost = k === 2 && lost > 0;
          const missing = [0, 1, 2].find((i) => !place.has.includes(i))!;
          const x = 30 + k * 350;
          // Stage 3: each place in turn is found and comes up a piece short.
          const short = show(3, 15 + k * 22, 8);
          const whole = k < 2 && joined > 0.95;
          return (
            <div key={place.name} style={{position: 'absolute', left: x, top: 640, width: 320, height: 380, borderRadius: 24,
              background: theme.panel, border: `4px solid ${whole ? GREEN : isLost ? '#3A4A66' : '#2A3A55'}`,
              opacity: show(2, k * 15) * (isLost ? 1 - 0.65 * lost : 1), display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24}}>
              <div style={{fontSize: 64}}>{place.icon}</div>
              <div style={{fontSize: 36, color: theme.text, marginTop: 4}}>{place.name}</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22}}>
                {place.has.map((i, j) => (
                  <Piece key={i} i={i} size={0.85} style={{opacity: show(2, 30 + k * 15 + j * 10)}} />
                ))}
              </div>
              {/* Stage 3: a piece short. */}
              <div style={{position: 'absolute', left: 0, right: 0, bottom: -70, textAlign: 'center', fontSize: 34, color: RED, fontWeight: 700,
                opacity: short * (1 - show(4))}}>
                缺 {NAMES[missing]} ✕
              </div>
              {isLost && (
                <div style={{position: 'absolute', left: 30, right: 30, top: 150, transform: 'rotate(-12deg)', border: `5px solid ${RED}`, borderRadius: 12,
                  textAlign: 'center', fontSize: 52, fontWeight: 700, color: RED, opacity: lost, background: 'rgba(14,23,38,0.7)'}}>
                  丢了
                </div>
              )}
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1130, textAlign: 'center', fontSize: 40, color: theme.text,
          opacity: show(3, 90) * (1 - show(4))}}>
          任何一处，都只有两段：用不了
        </div>

        {/* Stage 4: two places together make the whole key. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1130, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 + 20 * (1 - joined),
          opacity: show(4, 40)}}>
          {[0, 1, 2].map((i) => <Piece key={i} i={i} />)}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontSize: 44, color: GREEN, fontWeight: 700,
          opacity: at(4) ? fade(since(4) - 80) : 0}}>
          家里 ＋ 单位 = 完整私钥 ✓
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1320, textAlign: 'center', fontSize: 38, color: theme.text,
          opacity: at(4) ? fade(since(4) - 110) : 0}}>
          丢了一处也不怕
        </div>
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
