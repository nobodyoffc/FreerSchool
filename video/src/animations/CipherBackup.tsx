import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U1-03 S3: what a cipher is. One stage per narration line:
//   0 私钥 + 应用密码 → 锁 → 密文
//   1 密文 goes to 网盘 and 邮箱; without the password nobody opens it
//   2 someone else gets a copy and keeps guessing
//   3 a simple password is guessed: the key is out
//   4 a password too complex to remember: you cannot open it either
// The key is never shown, only masked; the cipher is made-up text, marked 示意.
const CIPHER = 'q8Zr0mVt3KfY7wLc1eHs9pXa2NdG6uBj4TiQ5oRk8yWz0cFv3hMn7gPe1sAl6xJd9bUq2CtK5rEo';
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const LAYOUTS = {
  portrait: {
    key: {x: 90, y: 200, w: 420, h: 200},
    pass: {x: 570, y: 200, w: 420, h: 200},
    lock: {x: 540, y: 520},
    cipher: {x: 90, y: 690, w: 900, h: 230},
    places: [{x: 90, y: 1010, w: 420, h: 150}, {x: 570, y: 1010, w: 420, h: 150}],
    guess: {x: 90, y: 1220, w: 900},
  },
  landscape: {
    key: {x: 160, y: 140, w: 420, h: 180},
    pass: {x: 160, y: 380, w: 420, h: 180},
    lock: {x: 760, y: 350},
    cipher: {x: 940, y: 140, w: 820, h: 200},
    places: [{x: 940, y: 400, w: 390, h: 140}, {x: 1370, y: 400, w: 390, h: 140}],
    guess: {x: 940, y: 600, w: 820},
  },
};

type Rect = {x: number; y: number; w: number; h: number};

const Panel: React.FC<{at: Rect; label: string; opacity: number; border?: string; children?: React.ReactNode}> = ({at, label, opacity, border, children}) => (
  <div
    style={{
      position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, opacity,
      background: theme.panel, borderRadius: 24, padding: 28, boxSizing: 'border-box',
      border: `4px solid ${border ?? '#2A3A55'}`,
    }}
  >
    <div style={{fontSize: 40, color: theme.text, fontWeight: 600, marginBottom: 16}}>{label}</div>
    {children}
  </div>
);

// The same stripes as the 遮挡 mask on recordings: a key is never shown.
const Masked: React.FC = () => (
  <div
    style={{
      height: 70, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'repeating-linear-gradient(45deg, #5B6170 0 14px, #6B7280 14px 28px)',
      color: '#FFFFFF', fontSize: 26, fontWeight: 700, letterSpacing: 4,
    }}
  >
    已打码
  </div>
);

// A padlock: shackle (raised when open) over a body.
const Lock: React.FC<{x: number; y: number; open: number; color: string; opacity: number}> = ({x, y, open, color, opacity}) => (
  <div style={{position: 'absolute', left: x - 60, top: y - 80, width: 120, height: 150, opacity}}>
    <div
      style={{
        position: 'absolute', left: 22, top: 0 - 26 * open, width: 76, height: 80,
        border: `12px solid ${color}`, borderBottom: 'none', borderRadius: '40px 40px 0 0', boxSizing: 'border-box',
      }}
    />
    <div style={{position: 'absolute', left: 0, top: 64, width: 120, height: 86, borderRadius: 16, background: color}} />
  </div>
);

const Guess: React.FC<{text: string; ok: boolean; opacity: number}> = ({text, ok, opacity}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 34, opacity, marginBottom: 10}}>
    <span style={{fontFamily: 'Menlo, monospace', color: theme.text}}>{text}</span>
    <span style={{color: ok ? RED : theme.muted}}>{ok ? '✓ 猜中' : '✕'}</span>
  </div>
);

export const CipherBackup: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const L = usePortrait() ? LAYOUTS.portrait : LAYOUTS.landscape;
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;

  // Stage 3 cracks it open (red); stage 4 is you, locked out (grey).
  const cracked = at(3) && !at(4);
  const lockColor = at(4) ? theme.muted : cracked ? RED : theme.accent;
  const lockOpen = cracked ? fade(since(3) - 50, 10) : 0;
  const cipherShown = at(0) ? fade(since(0) - 40, 40) : 0;

  const tries = ['000000', 'abc123', 'password', '19900101'];
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <Panel at={L.key} label="私钥" opacity={fade(frame)} border={cracked && lockOpen > 0.5 ? RED : undefined}>
        <Masked />
      </Panel>
      <Panel at={L.pass} label="应用密码" opacity={fade(frame)}>
        <div style={{fontSize: 44, color: theme.accent, letterSpacing: 6}}>••••••••</div>
      </Panel>

      <Lock {...L.lock} open={lockOpen} color={lockColor} opacity={at(0) ? fade(since(0) - 15) : 0} />

      <Panel at={L.cipher} label="密文" opacity={at(0) ? fade(since(0) - 30) : 0}>
        <div style={{fontFamily: 'Menlo, monospace', fontSize: 26, color: theme.muted, wordBreak: 'break-all', lineHeight: 1.45}}>
          {CIPHER.slice(0, Math.round(CIPHER.length * cipherShown))}
        </div>
      </Panel>

      {/* Stage 1: copies kept anywhere. */}
      {['网盘', '邮箱'].map((name, i) => (
        <Panel key={name} at={L.places[i]} label={name} opacity={at(1) ? fade(since(1) - 10 - i * 15) : 0}>
          <div style={{fontSize: 28, color: GREEN}}>密文一份 · 没有密码打不开</div>
        </Panel>
      ))}

      {/* Stages 2–4: guessing, below the places. */}
      {at(2) && !at(4) && (
        <div style={{position: 'absolute', left: L.guess.x, top: L.guess.y, width: L.guess.w}}>
          <div style={{fontSize: 34, color: RED, marginBottom: 18, opacity: fade(since(2))}}>别人拿到密文，一遍遍猜密码</div>
          {tries.map((t, i) => (
            <Guess key={t} text={t} ok={false} opacity={fade(since(2) - 20 - i * 18)} />
          ))}
          {at(3) && <Guess text="123456" ok opacity={fade(since(3) - 20)} />}
          {at(3) && (
            <div style={{fontSize: 44, color: RED, fontWeight: 700, marginTop: 20, opacity: fade(since(3) - 60)}}>
              密码太简单 → 私钥被破解
            </div>
          )}
        </div>
      )}
      {at(4) && (
        <div style={{position: 'absolute', left: L.guess.x, top: L.guess.y, width: L.guess.w}}>
          <div style={{fontSize: 34, color: theme.text, marginBottom: 18, opacity: fade(since(4))}}>你自己来解密：</div>
          <Guess text="Xq#9…（记错了）" ok={false} opacity={fade(since(4) - 20)} />
          <div style={{fontSize: 44, color: theme.accent, fontWeight: 700, marginTop: 20, opacity: fade(since(4) - 50)}}>
            太复杂记不住 → 自己也打不开
          </div>
        </div>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
