import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-06 S2: subsidiary identities are all watched ones. One stage per narration line:
//   0 the main identity: a key, connected to the services it bought
//   1 four subsidiary cards appear, each an eye, no key, the pen struck out
//   2 three of them get a relation to the main identity: master, servant, multisig; the fourth is the watch list
//   3 they reach the services through the main identity and see their balance, cash and records
// The main identity and the two named ones are those the recordings show.
const MAIN = {fid: 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4', name: 'Tom_9yw4'};
const SUBS = [
  {role: '主人', fid: 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8', x: 150, related: true},
  {role: '仆人', fid: '', x: 410, related: true},
  {role: '多签', fid: '', x: 670, related: true},
  {role: '观察名单', fid: 'FJYN3D7x4yiLF692WUAe7Vfo2nQpYDNrC7', x: 930, related: false},
];
const SUB_Y = 1170; // centre y of the row of subsidiary cards
const SUB_W = 236;
const SUB_H = 270;
const MAIN_X = 540;
const MAIN_Y = 680;
const SERVER_Y = 300;
const SERVERS = [240, 540, 840];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

// A straight line between two points.
const Line: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; opacity: number; dashed?: boolean; width?: number}> = ({x1, y1, x2, y2, color, opacity, dashed, width = 5}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <div style={{position: 'absolute', left: x1, top: y1 - width / 2, width: len, height: width, opacity, transformOrigin: '0 50%', transform: `rotate(${angle}deg)`,
      background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 18px, transparent 18px 32px)` : color}} />
  );
};

export const WatchIds: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          主身份与附属身份
        </div>

        {/* Stage 0: the services the main identity bought. */}
        {SERVERS.map((x, i) => (
          <React.Fragment key={x}>
            <Line x1={x} y1={SERVER_Y + 70} x2={MAIN_X} y2={MAIN_Y - 170} color={BLUE} opacity={show(0, 20 + i * 5)} />
            <div style={{position: 'absolute', left: x - 110, top: SERVER_Y - 70, width: 220, height: 140, borderRadius: 18, background: '#121E33',
              border: `3px solid ${BLUE}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: show(0, 10 + i * 5)}}>
              <div style={{fontSize: 50}}>🖥</div>
              <div style={{fontSize: 28, color: theme.muted}}>服务</div>
            </div>
          </React.Fragment>
        ))}

        {/* Stage 2: relations to the main identity; stage 3: the way to the services through it. */}
        {SUBS.map((s, i) => (
          <React.Fragment key={s.role}>
            {s.related && <Line x1={MAIN_X - 60 + i * 40} y1={MAIN_Y + 150} x2={s.x - 30} y2={SUB_Y - SUB_H / 2 - 26} color={GREEN} opacity={show(2, 10 + i * 12)} />}
            <Line x1={s.x + 30} y1={SUB_Y - SUB_H / 2 - 26} x2={MAIN_X - 50 + i * 40} y2={MAIN_Y + 150} color={theme.accent} opacity={show(3, 10 + i * 6) * 0.9} dashed width={4} />
          </React.Fragment>
        ))}

        {/* The main identity. */}
        <div style={{position: 'absolute', left: MAIN_X - 190, top: MAIN_Y - 170, width: 380, height: 300, borderRadius: 24, background: theme.panel,
          border: `4px solid ${BLUE}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: fade(frame)}}>
          <FidAvatar fid={MAIN.fid} size={120} />
          <div style={{fontSize: 32, color: theme.text}}>{MAIN.name}</div>
          <div style={{fontSize: 38, color: BLUE, fontWeight: 700}}>🔑 主身份</div>
        </div>

        {/* Stage 1: the subsidiary identities, all watched. */}
        {SUBS.map((s, i) => {
          const o = show(1, i * 8);
          return (
            <div key={s.role} style={{position: 'absolute', left: s.x - SUB_W / 2, top: SUB_Y - SUB_H / 2, width: SUB_W, height: SUB_H, borderRadius: 24, background: theme.panel,
              border: `3px solid ${at(2) && s.related ? GREEN : theme.muted}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: o}}>
              {s.fid ? <FidAvatar fid={s.fid} size={96} /> : <div style={{width: 96, height: 96, borderRadius: 48, background: '#2A3854', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54}}>{s.role === '多签' ? '👥' : '👤'}</div>}
              <div style={{fontSize: 34, color: theme.text}}>👁 观察</div>
              <div style={{fontSize: 30, color: RED, opacity: show(1, 30 + i * 8)}}><s>✍ 签名</s></div>
              {/* Stage 2: what each one is. */}
              <div style={{position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', padding: '6px 18px', borderRadius: 14, whiteSpace: 'nowrap',
                background: theme.bg, border: `3px solid ${s.related ? GREEN : theme.muted}`, fontSize: 32, color: s.related ? GREEN : theme.text, fontWeight: 700,
                opacity: show(2, 10 + i * 12)}}>
                {s.role}
              </div>
            </div>
          );
        })}

        {/* Stage 2: the three with a relation, the one without. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1360, textAlign: 'center', fontSize: 36, color: GREEN, opacity: show(2, 50) * (1 - show(3))}}>
          有特殊关系的观察身份
        </div>
        {/* Stage 3: what they see. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1360, textAlign: 'center', fontSize: 36, color: theme.accent, opacity: show(3, 40)}}>
          借用主身份的服务：余额 · 钞票 · 记录
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
