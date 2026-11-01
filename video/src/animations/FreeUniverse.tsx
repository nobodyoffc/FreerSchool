import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-01 S2: what the free universe is. One stage per narration line:
//   0 飞人: identities living in the free universe
//   1 consensus protocols built on the Freecash chain
//   2 an identity is a key pair: no one to apply to, no one to take it back
//   3 money, footprints and relations belong to the identity, recorded on chain; the platform is crossed out
//   4 anyone can live here, anyone can build
//   5 the Freer app is a way in
//   6 try it, remake it, or build your own world
// Laid out for portrait (Android episodes).
const NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const OTHERS = [
  'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4',
  'FNR4MJumYrBMBUs1pvMJWTmdRWof1igFuG',
  'FHJ4Fi6ZNsgDgkzAecREzwJt22V1nv2Hx1',
  'F9LbEZhAAKWfKHuZRj8UN4DJnZCDnCvt7u',
  'F6CdujyGz6quUnX5iXQdJfdtgEhDae86BE',
];
// Where the others float around the navigator, who stands at the centre.
const SPOTS = [[170, 560], [910, 520], [130, 1000], [950, 1020], [540, 330]];
const PROTOCOLS = ['FEIP', 'FVEP', 'FAPI', 'FUDP'];
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const CX = 540;
const CY = 780;

const Tag: React.FC<{x: number; y: number; text: string; opacity: number; color?: string}> = ({x, y, text, opacity, color = theme.text}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', opacity, whiteSpace: 'nowrap',
    padding: '10px 24px', borderRadius: 40, background: theme.panel, border: `3px solid ${color}`, fontSize: 34, color}}>
    {text}
  </div>
);

export const FreeUniverse: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] && stage >= i ? frame - scene.lines[i].from : -1);
  const s = [0, 1, 2, 3, 4, 5, 6].map(since);
  const on = (i: number, delay = 0, len = 12) => (s[i] >= 0 ? fade(s[i] - delay, len) : 0);

  // The chain grows one block every 20 frames once stage 1 starts.
  const blocks = s[1] >= 0 ? Math.min(9, 3 + Math.floor(Math.max(0, frame - scene.lines[1].from) / 20)) : 0;
  // Stage 6 clears the middle for three steps.
  const middle = 1 - on(5, 0, 15);
  const pair = on(2) * (1 - on(3, 0, 10));
  const owned = on(3) * (1 - on(4, 0, 10));
  const crowd = s[4] >= 0 ? 1 : on(0, 20);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 56, color: theme.text, fontWeight: 600}}>
        自由宇宙
      </div>

      <div style={{opacity: middle}}>
        {/* The other identities: a few at first, holding tools in stage 4. */}
        {OTHERS.map((fid, i) => {
          const [x, y] = SPOTS[i];
          const show = s[4] >= 0 ? 1 : i < 2 ? crowd : 0;
          return (
            <div key={fid} style={{position: 'absolute', left: x - 70, top: y - 70, opacity: show * (1 - pair * 0.7) * (1 - owned * 0.7)}}>
              <FidAvatar fid={fid} size={140} />
              {i % 2 === 1 && <div style={{position: 'absolute', right: -16, bottom: -10, fontSize: 52, opacity: on(4, 30)}}>🔧</div>}
            </div>
          );
        })}

        {/* The navigator, as one identity. */}
        <div style={{position: 'absolute', left: CX - 110, top: CY - 110, opacity: on(0)}}>
          <FidAvatar fid={NAVIGATOR} size={220} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: CY + 130, textAlign: 'center', fontSize: 40, color: theme.accent,
          opacity: on(0) * (1 - on(1))}}>
          飞人 = 一个身份
        </div>

        {/* Stage 2: a key pair makes the identity. */}
        <Tag x={CX - 230} y={CY + 140} text="🔑 私钥" opacity={pair} color={theme.accent} />
        <Tag x={CX + 230} y={CY + 140} text="公钥" opacity={pair} color={theme.accent} />
        <Tag x={CX} y={CY + 240} text="不用申请 · 没人能收回" opacity={on(2, 40) * (1 - on(3, 0, 10))} color={GREEN} />

        {/* Stage 3: what belongs to it, written into the chain; the platform is out. */}
        {[['💰 钱', -300], ['👣 足迹', 0], ['🤝 关系', 300]].map(([text, dx], i) => (
          <Tag key={text as string} x={CX + (dx as number)} y={CY + 170} text={text as string} opacity={owned * on(3, i * 15)} color={GREEN} />
        ))}
        {[-300, 0, 300].map((dx, i) => (
          <div key={dx} style={{position: 'absolute', left: CX + dx - 2, top: CY + 250, width: 4, height: 140,
            background: GREEN, opacity: owned * on(3, 50 + i * 8)}} />
        ))}
        <div style={{position: 'absolute', left: 410, top: 330, width: 260, height: 130, borderRadius: 20, background: '#2A3448',
          border: '3px solid #4A5468', opacity: owned * on(3, 70), display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, color: theme.muted}}>
          平台
          <div style={{position: 'absolute', inset: 0, opacity: on(3, 100)}}>
            <svg width={260} height={130}><line x1={20} y1={20} x2={240} y2={110} stroke={RED} strokeWidth={10} strokeLinecap="round" /><line x1={240} y1={20} x2={20} y2={110} stroke={RED} strokeWidth={10} strokeLinecap="round" /></svg>
          </div>
        </div>
        <Tag x={CX} y={CY + 170} text="谁都能生活 · 谁都能建造" opacity={on(4, 40)} color={GREEN} />
      </div>

      {/* The chain at the bottom, with the protocols laid on it. */}
      <div style={{position: 'absolute', left: 60, top: 1290, width: 960, display: 'flex', gap: 14, opacity: on(1)}}>
        {Array.from({length: blocks}).map((_, i) => (
          <div key={i} style={{width: 92, height: 92, borderRadius: 14, background: '#1F4F8F', border: '3px solid #7FB2FF',
            opacity: fade(frame - scene.lines[1].from - Math.max(0, i - 2) * 20, 8)}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center', fontSize: 34, color: theme.muted, opacity: on(1)}}>
        Freecash 公链
      </div>
      <div style={{position: 'absolute', left: 60, top: 1170, width: 960, display: 'flex', justifyContent: 'space-between', opacity: on(1, 30)}}>
        {PROTOCOLS.map((p, i) => (
          <div key={p} style={{width: 210, padding: '14px 0', textAlign: 'center', borderRadius: 14, background: theme.panel,
            border: `3px solid ${theme.accent}`, fontSize: 32, color: theme.accent, opacity: on(1, 30 + i * 10)}}>
            {p}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1115, textAlign: 'center', fontSize: 30, color: theme.muted, opacity: on(1, 70)}}>
        共识协议
      </div>

      {/* Stage 5: the Freer app is a way in. */}
      <div style={{position: 'absolute', left: CX - 150, top: 480, width: 300, height: 300, borderRadius: 64, background: '#2196F3',
        opacity: on(5) * (1 - on(6, 0, 10)), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 130, color: '#fff', fontWeight: 700}}>
        Fr
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontSize: 44, color: theme.text,
        opacity: on(5, 15) * (1 - on(6, 0, 10))}}>
        飞人应用 → 进入自由宇宙
      </div>

      {/* Stage 6: three steps. */}
      {['体验', '改造', '建立自己的世界'].map((text, i) => (
        <div key={text} style={{position: 'absolute', left: 140, top: 470 + i * 230, width: 800, height: 170, borderRadius: 24,
          background: theme.panel, border: `4px solid ${i === 2 ? theme.accent : '#7FB2FF'}`, opacity: on(6, i * 40),
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: i === 2 ? theme.accent : theme.text, fontWeight: 600}}>
          {text}
        </div>
      ))}

      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
