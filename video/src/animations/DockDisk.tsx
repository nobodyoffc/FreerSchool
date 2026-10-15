import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-06 S2: DOCK and DISK. One stage per narration line:
//   0 several kinds of servers; this episode sets two, DOCK and DISK
//   1 a message goes into your DOCK while you are offline; you come online and take it
//   2 your DISK keeps your own files
//   3 the sender finds your DOCK in your record on the chain
//   4 without the record, the message has nowhere to go
//   5 the DOCK entry is public
//   6 the DISK entry is sealed: only you can read it
//   7 a file for you: locked to you, kept on a DISK the sender picks, a note via your DOCK says where
// Laid out for portrait (Android episodes). The record mirrors the demo carve (U1-06 S3).
const GREEN = '#5BC98C';
const RED = '#E5686A';
const BLUE = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const mono = 'Menlo, monospace';

// Positions of the diagram's nodes (centers).
const SENDER = {x: 170, y: 470};
const DOCK = {x: 540, y: 470};
const YOU = {x: 910, y: 470};
const MY_DISK = {x: 910, y: 800};
const THEIR_DISK = {x: 170, y: 800};

const Node: React.FC<{at: {x: number; y: number}; title: string; sub?: string; color: string; opacity: number; dim?: boolean; glow?: number}> =
  ({at, title, sub, color, opacity, dim, glow = 0}) => (
    <div style={{position: 'absolute', left: at.x - 140, top: at.y - 90, width: 280, height: 180, opacity,
      borderRadius: 22, background: theme.panel, border: `4px solid ${dim ? '#2A3854' : color}`,
      boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${color}` : 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontSize: title.length > 4 ? 44 : 56, fontWeight: 700, color: dim ? theme.muted : color, fontFamily: /^[A-Z]+$/.test(title) ? mono : theme.font}}>{title}</div>
      {sub && <div style={{marginTop: 6, fontSize: 28, color: theme.muted}}>{sub}</div>}
    </div>
  );

// A token moving from a to b over `len` frames, starting at t = 0.
const Fly: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; t: number; len?: number; children: React.ReactNode; hide?: number}> =
  ({a, b, t, len = 30, children, hide = 1}) => {
    if (t < 0) return null;
    const k = interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
    return (
      <div style={{position: 'absolute', left: a.x + (b.x - a.x) * k - 40, top: a.y + (b.y - a.y) * k - 40, width: 80, height: 80,
        fontSize: 60, textAlign: 'center', lineHeight: '80px', opacity: fade(t, 6) * hide}}>
        {children}
      </div>
    );
  };

const Row: React.FC<{k: string; v: string; lit: number; tag: string; tagColor: string; tagOn: number}> = ({k, v, lit, tag, tagColor, tagOn}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 18, padding: '10px 16px', borderRadius: 12,
    background: lit > 0 ? `rgba(242,180,65,${0.18 * lit})` : 'transparent'}}>
    <span style={{fontFamily: mono, fontSize: 38, fontWeight: 700, color: theme.text, width: 120}}>{k}</span>
    <span style={{fontFamily: mono, fontSize: 30, color: theme.muted, flex: 1}}>{v}</span>
    <span style={{fontSize: 30, color: tagColor, opacity: tagOn}}>{tag}</span>
  </div>
);

export const DockDisk: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);
  // Stage 4 alone: the record is gone.
  const gone = stage === 4 ? fade(since(4), 10) : 0;

  // You are offline until the message has landed in the DOCK (stage 1), then come online.
  const online = at(1) ? fade(since(1) - 75, 10) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* Stage 0: the kinds of servers. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center', gap: 30, opacity: fade(frame)}}>
        {['BASE', 'DOCK', 'DISK', 'CALL'].map((k, i) => {
          const lit = (k === 'DOCK' || k === 'DISK') && at(0) ? fade(since(0) - 60 - i * 5) : 0;
          return (
            <div key={k} style={{padding: '12px 26px', borderRadius: 14, fontFamily: mono, fontSize: 40, fontWeight: 700,
              opacity: fade(frame - i * 8), color: lit > 0 ? theme.accent : theme.muted,
              border: `3px solid ${lit > 0 ? theme.accent : '#2A3854'}`, background: theme.panel}}>{k}</div>
          );
        })}
      </div>

      {/* The diagram. */}
      <Node at={SENDER} title="发信人" color={BLUE} opacity={show(1)} />
      <Node at={DOCK} title="DOCK" sub="消息服务器" color={theme.accent} opacity={show(1, 10)} glow={stage === 3 ? fade(since(3) - 40) : 0} />
      <Node at={YOU} title="你" sub={online > 0.5 ? '上线' : '离线'} color={GREEN} opacity={show(1, 20)} dim={online < 0.5} />
      <Node at={MY_DISK} title="DISK" sub="你的文件服务器" color={theme.accent} opacity={show(2)} />
      <Node at={THEIR_DISK} title="DISK" sub="发送人指定的" color={theme.muted} opacity={show(7, 10)} />

      {/* Stage 1: in, wait, out. */}
      {stage >= 1 && stage <= 2 && (
        <>
          <Fly a={SENDER} b={DOCK} t={since(1) - 30} hide={since(1) < 95 ? 1 : 0}>✉️</Fly>
          <Fly a={DOCK} b={YOU} t={since(1) - 95} hide={stage === 1 ? 1 : 1 - fade(since(2), 10)}>✉️</Fly>
        </>
      )}

      {/* Stage 2: your own files go to your DISK. */}
      {stage === 2 && <Fly a={YOU} b={MY_DISK} t={since(2) - 20} len={30} hide={1 - fade(since(2) - 70, 10)}>📄</Fly>}

      {/* Stage 3: the sender asks the chain, then knows where to go. */}
      {stage === 3 && (
        <>
          <Fly a={SENDER} b={{x: 540, y: 1150}} t={since(3) - 10} len={25} hide={1 - fade(since(3) - 38, 6)}>🔍</Fly>
          <Fly a={SENDER} b={DOCK} t={since(3) - 60}>✉️</Fly>
        </>
      )}

      {/* Stage 4: no record, nowhere to send. */}
      {stage === 4 && (
        <div style={{position: 'absolute', left: SENDER.x + 90, top: SENDER.y - 50, fontSize: 70,
          transform: `translateX(${Math.sin(since(4) / 2.5) * 10}px)`, opacity: fade(since(4) - 15)}}>
          ✉️<span style={{color: RED, fontWeight: 700}}>？</span>
        </div>
      )}

      {/* Stage 7: a file for you. Locked to you, kept on the sender's DISK; a note through your DOCK. */}
      {stage === 7 && (
        <>
          <Fly a={SENDER} b={THEIR_DISK} t={since(7) - 25} len={25}>🔒</Fly>
          <Fly a={SENDER} b={DOCK} t={since(7) - 65} len={25} hide={since(7) < 95 ? 1 : 0}>🧾</Fly>
          <Fly a={DOCK} b={YOU} t={since(7) - 95} len={25} hide={since(7) < 135 ? 1 : 0}>🧾</Fly>
          <Fly a={THEIR_DISK} b={YOU} t={since(7) - 135} len={40}>🔒</Fly>
          <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', fontSize: 34, color: theme.muted, opacity: fade(since(7) - 135)}}>
            用你的公钥加密，只有你打得开
          </div>
        </>
      )}

      {/* Stages 3–6: your record on the chain. */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 1060, padding: '26px 30px', borderRadius: 18,
        background: theme.panel, border: `3px solid ${gone > 0 ? RED : '#3A4A66'}`,
        opacity: show(3) * (at(7) ? 1 - fade(since(7), 12) : 1)}}>
        <div style={{fontSize: 32, color: theme.muted}}>链上登记 · <span style={{fontFamily: mono, color: BLUE}}>Tom_9yw4</span></div>
        <div style={{opacity: 1 - 0.85 * gone}}>
          <Row k="DOCK" v="65c475ac…beec9b3" lit={stage === 3 ? fade(since(3) - 40) : stage === 5 ? fade(since(5)) : 0}
            tag="公开 · 谁都能查到" tagColor={GREEN} tagOn={at(5) ? show(5, 15) : 0} />
          <Row k="DISK" v="🔒 sGqAiqVdeNJf…" lit={stage === 6 ? fade(since(6)) : 0}
            tag="加密 · 只有你能读" tagColor={theme.accent} tagOn={at(6) ? show(6, 15) : 0} />
        </div>
        {gone > 0 && (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, fontWeight: 700, color: RED, opacity: gone}}>没有登记</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
