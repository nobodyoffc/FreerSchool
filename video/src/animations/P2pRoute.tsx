import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-10 S2: how a P2P message travels. One stage per narration line:
//   0 it is sealed with the other side's public key: only they can read it
//   1 the cipher is stored on the DOCK they registered
//   2 they fetch it whenever they like and open it with their private key
//   3 the DOCK only keeps the cipher: it cannot read it
//   4 a DOCK usually keeps it for 7 days; some keep it longer
// "你" is the demo identity, the other side is its guide (领航员), as in the recording.
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const ORANGE = '#E8590C';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const mono = 'Menlo, monospace';
const CIPHER = 'Qm9x7KfT2vLp8RaZ';

const Bubble: React.FC<{sealed: number}> = ({sealed}) => (
  <div style={{padding: '12px 20px', borderRadius: 18, background: sealed > 0.5 ? '#1D2C47' : '#2D6CDF',
    border: `3px solid ${sealed > 0.5 ? ORANGE : 'transparent'}`, fontSize: 32, color: theme.text, whiteSpace: 'nowrap'}}>
    {sealed > 0.5 ? <span>🔒 <span style={{fontFamily: mono, fontSize: 26, color: theme.muted}}>{CIPHER}…</span></span> : '谢谢老板！'}
  </div>
);

export const P2pRoute: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  // Stage 0: the message appears, then the guide's public key seals it.
  const sealed = show(0, 40);
  // Stage 1: the sealed message flies from you to the DOCK.
  const toDock = at(1) ? ease(since(1) - 15, 40) : 0;
  // Stage 2: the guide fetches it and opens it.
  const toGuide = at(2) ? ease(since(2) - 15, 40) : 0;
  const opened = at(2) ? fade(since(2) - 60) : 0;

  // The message travels: your side (y 600) → DOCK (y 1000) → the guide's side (y 600, right).
  const x = interpolate(toDock, [0, 1], [100, 330]) + interpolate(toGuide, [0, 1], [0, 300]);
  const y = interpolate(toDock, [0, 1], [640, 1030]) + interpolate(toGuide, [0, 1], [0, -390]);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* You, on the left; the guide, on the right. */}
      <div style={{position: 'absolute', left: 80, top: 200, width: 360, textAlign: 'center', opacity: fade(frame)}}>
        <div style={{display: 'inline-block'}}><FidAvatar fid={YOU} size={170} /></div>
        <div style={{fontSize: 34, color: GREEN, marginTop: 10}}>你</div>
      </div>
      <div style={{position: 'absolute', right: 80, top: 200, width: 360, textAlign: 'center', opacity: fade(frame - 6)}}>
        <div style={{display: 'inline-block'}}><FidAvatar fid={GUIDE} size={170} /></div>
        <div style={{fontSize: 34, color: BLUE, marginTop: 10, fontFamily: mono}}>cy_qqN8</div>
        <div style={{fontSize: 28, color: theme.muted, marginTop: 6, opacity: show(2, 50)}}>🔑 用自己的私钥解开</div>
      </div>
      {/* Stage 0: sealed with the guide's public key. */}
      <div style={{position: 'absolute', left: 80, top: 520, fontSize: 28, color: ORANGE, opacity: show(0, 30) * (1 - toDock)}}>
        🔒 用引路人的公钥加密
      </div>

      {/* The DOCK the guide registered on the chain. */}
      <div style={{position: 'absolute', left: 200, top: 900, width: 680, height: 300, borderRadius: 24,
        background: '#121E33', border: '3px solid #2A3854', opacity: show(1)}}>
        <div style={{position: 'absolute', left: 24, top: 18, fontSize: 32, color: theme.text}}>📦 引路人的 DOCK</div>
        <div style={{position: 'absolute', right: 24, top: 18, fontSize: 30, color: theme.muted, opacity: show(3)}}>👀 只见密文</div>
        <div style={{position: 'absolute', left: 24, bottom: 18, fontSize: 30, color: theme.muted, opacity: show(4)}}>⏳ 一般保存 7 天，有的更久</div>
      </div>
      {/* Stage 3: the DOCK cannot read it. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1250, textAlign: 'center', fontSize: 36, color: theme.text, opacity: show(3, 20)}}>
        DOCK 只保管密文，读不到内容
      </div>

      {/* The message itself. */}
      <div style={{position: 'absolute', left: x, top: y, opacity: show(0, 10) * (at(2) ? 1 - opened : 1)}}>
        <Bubble sealed={sealed} />
      </div>
      {/* Stage 2: opened on the guide's side. */}
      <div style={{position: 'absolute', right: 120, top: 660, opacity: opened}}>
        <Bubble sealed={0} />
      </div>
    </AbsoluteFill>
  );
};
