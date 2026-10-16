import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-10 S4: the gate every P2P message passes. One stage per narration line:
//   0 anyone can send you a message, so there is a policy at the door
//   1 a contact's message goes straight in
//   2 a blacklisted sender's message is dropped
//   3 a stranger's first message waits under "消息请求" for you to accept or reject
// The contact is the demo identity's guide (领航员); the blacklisted sender and the stranger
// are made-up faces, never named.
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const BLOCKED = 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1';
const STRANGER = 'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7';
const GREEN = '#5BC98C';
const RED = '#FF6B6B';
const BLUE = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

// A sender at the left with a letter; `go` moves the letter right toward the gate.
const Sender: React.FC<{fid: string; y: number; opacity: number; tag: React.ReactNode}> = ({fid, y, opacity, tag}) => (
  <div style={{position: 'absolute', left: 70, top: y, opacity, display: 'flex', alignItems: 'center', gap: 16}}>
    <FidAvatar fid={fid} size={110} />
    <div style={{fontSize: 28, color: theme.muted, width: 150}}>{tag}</div>
  </div>
);

export const StrangerGate: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  const goIn = at(1) ? ease(since(1) - 15, 40) : 0;
  const dropped = at(2) ? ease(since(2) - 15, 35) : 0;
  const held = at(3) ? ease(since(3) - 15, 40) : 0;

  const GATE = 560; // x of the door
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* The door, and your inbox behind it. */}
      <div style={{position: 'absolute', left: GATE, top: 220, width: 14, height: 900, background: '#3A4A66', opacity: fade(frame)}} />
      <div style={{position: 'absolute', left: GATE - 120, top: 140, width: 260, textAlign: 'center', fontSize: 34, color: theme.text, opacity: fade(frame)}}>🚪 安全策略</div>
      <div style={{position: 'absolute', left: GATE + 60, top: 230, width: 400, height: 300, borderRadius: 24,
        background: '#121E33', border: '3px solid #2A3854', opacity: fade(frame - 6)}}>
        <div style={{position: 'absolute', left: 24, top: 18, fontSize: 32, color: theme.text}}>💬 你的会话</div>
      </div>
      <div style={{position: 'absolute', left: GATE + 60, top: 800, width: 400, height: 300, borderRadius: 24,
        background: '#121E33', border: `3px dashed ${BLUE}`, opacity: show(3)}}>
        <div style={{position: 'absolute', left: 24, top: 18, fontSize: 32, color: BLUE}}>📥 消息请求</div>
        <div style={{position: 'absolute', left: 24, bottom: 22, fontSize: 32, opacity: show(3, 60)}}>
          <span style={{color: GREEN}}>✓ 接受</span>　<span style={{color: RED}}>✕ 拒绝</span>
        </div>
      </div>

      {/* Stage 0: three senders, each with a letter. */}
      <Sender fid={GUIDE} y={300} opacity={fade(frame - 10)} tag={<span style={{color: GREEN}}>📒 联系人</span>} />
      <Sender fid={BLOCKED} y={560} opacity={fade(frame - 18)} tag={<span style={{color: RED, opacity: show(2)}}>🚫 黑名单</span>} />
      <Sender fid={STRANGER} y={860} opacity={fade(frame - 26)} tag={<span>❓ 陌生人</span>} />

      {/* The letters. */}
      <div style={{position: 'absolute', left: 340 + 420 * goIn, top: 320, fontSize: 64, opacity: fade(frame - 30)}}>✉️</div>
      <div style={{position: 'absolute', left: 340 + 180 * dropped, top: 580 + 260 * dropped, fontSize: 64,
        opacity: fade(frame - 36) * (1 - dropped), transform: `rotate(${60 * dropped}deg)`}}>✉️</div>
      <div style={{position: 'absolute', left: 340 + 420 * held, top: 880 + 40 * held, fontSize: 64, opacity: fade(frame - 42)}}>✉️</div>
      <div style={{position: 'absolute', left: 300, top: 690, fontSize: 30, color: RED, opacity: show(2, 40)}}>丢掉</div>
    </AbsoluteFill>
  );
};
