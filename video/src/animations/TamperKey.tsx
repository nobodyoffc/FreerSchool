import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-02 S5: a tampered backup. One stage per narration line:
//   0 the key
//   1 change a few digits (yellow), move a stretch to the end (blue)
//   2 a key with a checksum no longer imports; a hex key does, as another, empty identity
//   3 the fake key and the tampering kept apart: lose either and the key is gone
//   4 too simple a change is cracked: one digit is 960 tries
// Keys and identities are made up, marked 示意.
const KEY = '3a7f19c2e04b86d5f1a2c93e7b05d48a6c2e91f03b7d58a4e6c19f2d07b3a85e';
const CHANGED = [5, 19, 40]; // 0-based; the note says 第6、20、41位
const MOVED: [number, number] = [8, 16]; // 第9–16位, moved to the end
const WIF = 'L3xKq8Vb2nTz7RcW5mHd9FpJ4sYg6EaU1kNr8CtXo2Lv6QhM9BjD';
const WIF_CHANGED = 17;
const EMPTY = 'FDn2Rb6Tc9Yd3Ue7Vf4Wg8Xh5Yi2Zj6Ak9'; // the made-up identity a tampered key turns out to be
const GREEN = '#5BC98C';
const RED = '#E5686A';
const YELLOW = '#F2B441';
const BLUE = '#7FB2FF';
const mono = 'Menlo, monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

type Ch = {c: string; kind: 'plain' | 'changed' | 'moved'};
const bump = (c: string) => ((parseInt(c, 16) + 5) % 16).toString(16);

// The key after `changed` (digits replaced) and `moved` (the stretch at the end).
const tampered = (changed: boolean, moved: boolean): Ch[] => {
  const chars: Ch[] = KEY.split('').map((c, i) => (changed && CHANGED.includes(i) ? {c: bump(c), kind: 'changed'} : {c, kind: 'plain'}));
  if (!moved) return chars;
  const [a, b] = MOVED;
  return [...chars.slice(0, a), ...chars.slice(b), ...chars.slice(a, b).map((ch) => ({...ch, kind: 'moved' as const}))];
};

const Digits: React.FC<{chars: Ch[]; size?: number}> = ({chars, size = 36}) => (
  <div style={{fontFamily: mono, fontSize: size, lineHeight: 1.5, wordBreak: 'break-all', color: theme.muted}}>
    {chars.map((ch, i) => (
      <span key={i} style={ch.kind === 'changed' ? {background: YELLOW, color: '#1A1A1A', borderRadius: 4}
        : ch.kind === 'moved' ? {color: BLUE, textDecoration: 'underline'} : undefined}>{ch.c}</span>
    ))}
  </div>
);

const Box: React.FC<{label: string; color?: string; opacity: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({label, color, opacity, style, children}) => (
  <div style={{position: 'absolute', left: 90, right: 90, background: theme.panel, borderRadius: 24, border: `4px solid ${color ?? '#2A3A55'}`,
    padding: '20px 30px', opacity, ...style}}>
    <div style={{fontSize: 36, color: theme.text, fontWeight: 600, marginBottom: 8}}>{label}</div>
    {children}
  </div>
);

export const TamperKey: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  const changed = at(1) && since(1) > 25;
  const moved = at(1) && since(1) > 70;
  // Stage 2 is long: the checksum key first, the hex key from about halfway.
  const hexAt = 135;
  // Stage 4: the one-digit counter runs to 960 in a second.
  const count = at(4) ? Math.round(interpolate(since(4), [15, 45], [0, 960], clamp)) : 0;
  const big = at(4) ? Math.floor(interpolate(since(4), [15, 100], [0, 9.99e6], clamp)) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <Box label="原私钥" opacity={fade(frame)} style={{top: 150}}>
          <Digits chars={tampered(false, false)} />
        </Box>
        <Box label="篡改后" color={at(1) ? YELLOW : undefined} opacity={show(1)} style={{top: 420}}>
          <Digits chars={tampered(changed, moved)} />
          <div style={{display: 'flex', gap: 30, fontSize: 28, marginTop: 8}}>
            <span style={{color: YELLOW, opacity: changed ? 1 : 0}}>■ 改了几位</span>
            <span style={{color: BLUE, opacity: moved ? 1 : 0}}>▁ 一段挪到末尾</span>
          </div>
        </Box>

        {/* Stage 2: importing it. */}
        {at(2) && !at(3) && (
          <>
            <Box label="带校验码的私钥" opacity={show(2)} style={{top: 760}}>
              <div style={{fontFamily: mono, fontSize: 30, color: theme.muted, wordBreak: 'break-all'}}>
                {WIF.split('').map((c, i) => (
                  <span key={i} style={i === WIF_CHANGED ? {background: YELLOW, color: '#1A1A1A', borderRadius: 4} : undefined}>{i === WIF_CHANGED ? 'z' : c}</span>
                ))}
              </div>
              <div style={{fontSize: 36, color: RED, fontWeight: 700, marginTop: 12, opacity: show(2, 50)}}>导入 → ✕ 校验失败</div>
            </Box>
            <Box label="十六进制私钥" opacity={show(2, hexAt)} style={{top: 1050}}>
              <div style={{fontSize: 36, color: GREEN, fontWeight: 700, opacity: show(2, hexAt + 25)}}>导入 → ✓ 成功</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 14, opacity: show(2, hexAt + 55)}}>
                <FidAvatar fid={EMPTY} size={110} />
                <div>
                  <div style={{fontSize: 34, color: theme.text}}>另一个身份</div>
                  <div style={{fontSize: 30, color: theme.muted, marginTop: 4}}>余额 0 · 空的</div>
                </div>
              </div>
            </Box>
          </>
        )}

        {/* Stage 3: the fake key and the tampering, apart. */}
        {at(3) && (
          <div style={{position: 'absolute', left: 60, right: 60, top: 760, display: 'flex', justifyContent: 'space-between', opacity: show(3) * (1 - 0.5 * show(4))}}>
            {[
              {icon: '🏠', place: '一处', title: '假私钥', body: '3a7f19c2e0…', mono: true},
              {icon: '🏢', place: '另一处', title: '篡改策略', body: '第6、20、41位改了\n第9–16位挪到末尾', mono: false},
            ].map((it, k) => (
              <div key={it.title} style={{width: 440, borderRadius: 24, background: theme.panel, border: `4px solid ${k ? YELLOW : '#2A3A55'}`,
                padding: '20px 26px', opacity: show(3, k * 25)}}>
                <div style={{fontSize: 30, color: theme.muted}}>{it.icon} {it.place}</div>
                <div style={{fontSize: 38, color: theme.text, fontWeight: 600, marginTop: 8}}>{it.title}</div>
                <div style={{fontSize: 30, color: theme.muted, marginTop: 8, whiteSpace: 'pre-line', fontFamily: it.mono ? mono : undefined}}>{it.body}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1080, textAlign: 'center', fontSize: 40, color: RED, fontWeight: 700,
          opacity: show(3, 100) * (1 - show(4))}}>
          丢了任何一样 → 无法恢复
        </div>

        {/* Stage 4: too simple is cracked. */}
        <div style={{position: 'absolute', left: 60, right: 60, top: 1080, display: 'flex', justifyContent: 'space-between', opacity: show(4)}}>
          <div style={{width: 440, borderRadius: 24, background: theme.panel, border: `4px solid ${count >= 960 ? RED : '#2A3A55'}`, padding: '20px 26px'}}>
            <div style={{fontSize: 34, color: theme.text}}>只改 1 位：960 种</div>
            <div style={{fontFamily: mono, fontSize: 44, color: count >= 960 ? RED : theme.muted, marginTop: 8}}>已试 {count}</div>
            <div style={{fontSize: 34, color: RED, fontWeight: 700, opacity: count >= 960 ? 1 : 0}}>✓ 破解</div>
          </div>
          <div style={{width: 440, borderRadius: 24, background: theme.panel, border: `4px solid ${GREEN}`, padding: '20px 26px', opacity: show(4, 10)}}>
            <div style={{fontSize: 34, color: theme.text}}>改多处：10¹⁹ 种以上</div>
            <div style={{fontFamily: mono, fontSize: 44, color: theme.muted, marginTop: 8}}>已试 {big.toLocaleString('en-US')}</div>
            <div style={{fontSize: 34, color: GREEN, fontWeight: 700, opacity: show(4, 60)}}>试不完</div>
          </div>
        </div>
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
