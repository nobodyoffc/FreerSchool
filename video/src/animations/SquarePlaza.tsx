import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-08 S2: the square. One stage per narration line:
//   0 an open plaza: people walk in and out, nobody on the podium, nobody organizing
//   1 joining and leaving are declared on the chain; the member list is public there
//   2 messages are not encrypted: everyone sees them, so nothing private here
//   3 every message carries its speaker's signature: it cannot be altered or forged
// Only the navigator (cy_qqN8) and the demo identity (Tom_9yw4) are named; the rest of
// the crowd are made-up faces, never shown as text. Laid out for portrait.
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const CROWD = [
  'FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1',
  'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FDn2Rb6Tc9Yd3Ue7Vf4Wg8Xh5Yi2Zj6Ak9',
];
const LEAVER = 'FEp5Sd8Uf2Vg6Wh9Xi3Yj7Zk4Am8Bm2Cn5';
const GREEN = '#5BC98C';
const RED = '#FF6B6B';
const BLUE = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const mono = 'Menlo, monospace';

// A chat bubble with its speaker; `sig` shows the signature stamp, `bad` marks a forgery.
const Bubble: React.FC<{fid: string; name?: string; text: string; y: number; opacity: number; sig: number; bad?: number; drop?: number}> =
  ({fid, name, text, y, opacity, sig, bad = 0, drop = 0}) => (
    <div style={{position: 'absolute', left: 90, right: 90, top: y + 80 * drop, opacity: opacity * Math.max(0, 1 - 1.6 * drop), display: 'flex', alignItems: 'flex-start', gap: 20}}>
      <FidAvatar fid={fid} size={84} />
      <div>
        {name && <div style={{fontFamily: mono, fontSize: 26, color: BLUE, marginBottom: 6}}>{name}</div>}
        <div style={{display: 'inline-block', padding: '14px 24px', borderRadius: 20, fontSize: 34, color: theme.text,
          background: '#22324F', border: `3px solid ${bad > 0 ? RED : 'transparent'}`}}>{text}</div>
        <div style={{marginTop: 8, fontSize: 26, opacity: sig, color: bad > 0 ? RED : GREEN, whiteSpace: 'nowrap'}}>
          {bad > 0 ? '✕ 签名不符，丢弃' : `✍ 签名 ✓ ${name ?? ''}`}
        </div>
      </div>
    </div>
  );

export const SquarePlaza: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  // Stage 0: one walks in from the left, one walks out to the right.
  const enter = ease(frame - 40, 50);
  const leave = ease(frame - 110, 50);
  // Stage 1: the same two, as chain records.
  const joined = show(1, 30);
  const left = show(1, 75);
  // Stage 2: a private message, crossed out.
  const privateMsg = show(2, 70);
  const crossed = show(2, 100);
  // Stage 3: signatures stamp in; a forgery fails and falls.
  const sigs = show(3, 15);
  const forged = show(3, 60);
  const forgeFail = show(3, 95);
  const forgeDrop = at(3) ? ease(since(3) - 135, 30) : 0;

  const groundTop = 230;
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* The plaza: open on both sides. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 100, height: 470, borderRadius: 24,
        background: '#121E33', border: '3px dashed #2A3854', opacity: fade(frame)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 22, textAlign: 'center'}}>
          <span style={{padding: '8px 28px', borderRadius: 12, background: '#1D2C47', fontSize: 38, color: theme.text}}>🏛 飞人广场</span>
        </div>
        {/* The podium: empty. */}
        <div style={{position: 'absolute', right: 40, top: 110, width: 210, height: 110, borderRadius: 14,
          border: '3px dashed #3A4A66', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: fade(frame - 20)}}>
          <div style={{fontSize: 40, color: theme.muted}}>👑 ✕</div>
          <div style={{fontSize: 24, color: theme.muted}}>没有群主</div>
        </div>
        {/* The crowd, milling about. */}
        {CROWD.map((fid, i) => (
          <div key={fid} style={{position: 'absolute', left: 60 + i * 150, top: groundTop + (i % 2) * 60, opacity: fade(frame - 6 - i * 5)}}>
            <FidAvatar fid={fid} size={100} />
          </div>
        ))}
        <div style={{position: 'absolute', left: -60 + 690 * enter, top: groundTop + 120, opacity: fade(frame - 40)}}>
          <FidAvatar fid={YOU} size={100} />
        </div>
        <div style={{position: 'absolute', left: 700 + 330 * leave, top: groundTop + 10, opacity: 1 - leave}}>
          <FidAvatar fid={LEAVER} size={100} />
        </div>
        <div style={{position: 'absolute', left: 30, bottom: 18, fontSize: 30, color: GREEN, opacity: fade(frame - 40)}}>→ 自由进</div>
        <div style={{position: 'absolute', right: 30, bottom: 18, fontSize: 30, color: theme.muted, opacity: fade(frame - 110)}}>自由出 →</div>
      </div>

      {/* Stage 1: the member list, public on the chain. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 610, height: 330, borderRadius: 24,
        background: '#121E33', border: '3px solid #2A3854', opacity: show(1), padding: '20px 30px', boxSizing: 'border-box'}}>
        <div style={{fontSize: 34, color: theme.muted, marginBottom: 14}}>⛓ 链上 · 成员名单（公开）</div>
        <div style={{display: 'flex', gap: 18, alignItems: 'center', opacity: show(1, 10)}}>
          {CROWD.map((fid) => <FidAvatar key={fid} fid={fid} size={70} />)}
          <div style={{position: 'relative'}}>
            <FidAvatar fid={LEAVER} size={70} />
            <div style={{position: 'absolute', left: -6, right: -6, top: 31, height: 6, background: RED, opacity: left, transform: `scaleX(${left})`}} />
          </div>
          <div style={{opacity: joined, transform: `scale(${0.6 + 0.4 * joined})`}}>
            <FidAvatar fid={YOU} size={70} />
          </div>
        </div>
        <div style={{marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 30}}>
          <div style={{opacity: joined, color: GREEN}}>＋ 加入 · <span style={{fontFamily: mono}}>Tom_9yw4</span> · 记在链上</div>
          <div style={{opacity: left, color: theme.muted}}>－ 退出 · 记在链上</div>
        </div>
      </div>

      {/* Stage 2: messages in the open. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 970, height: 620, borderRadius: 24,
        background: '#121E33', border: '3px solid #2A3854', opacity: show(2)}}>
        <div style={{position: 'absolute', right: 30, top: 18, fontSize: 30, color: theme.muted, opacity: show(2, 20)}}>👀 不加密 · 谁都能看到</div>
      </div>
      <Bubble fid={GUIDE} name="cy_qqN8" text="我在做飞人学堂了" y={1010} opacity={show(2, 5)} sig={sigs} />
      <Bubble fid={YOU} name="Tom_9yw4" text="大家好，我是 Tom" y={1195} opacity={show(2, 25)} sig={show(3, 30)} />
      {/* Stage 2: something private does not belong here. */}
      <div style={{position: 'absolute', left: 194, top: 1415, opacity: privateMsg * (1 - (at(3) ? fade(since(3), 10) : 0)), display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{position: 'relative', padding: '12px 22px', borderRadius: 20, fontSize: 32, color: theme.muted, background: '#22324F'}}>
          我家地址是……
          <div style={{position: 'absolute', left: 10, right: 10, top: '50%', height: 5, background: RED, transform: `scaleX(${crossed})`}} />
        </div>
        <div style={{fontSize: 30, color: RED, opacity: crossed}}>✕ 私密的话别在这里说</div>
      </div>
      {/* Stage 3: a forgery in cy_qqN8's name, without its signature. */}
      {at(3) && (
        <Bubble fid={GUIDE} name="cy_qqN8" text="给我转 100 F" y={1395} opacity={forged} sig={forgeFail} bad={forgeFail} drop={forgeDrop} />
      )}
    </AbsoluteFill>
  );
};
