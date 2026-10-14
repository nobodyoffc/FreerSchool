import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-04 S2: fees, cash, and the guide. One stage per narration line:
//   0 every record in the shared on-chain space pays a fee; junk without one stays out
//   1 the fee is tiny, but not zero
//   2 each FCH received is a 钞票 (three of 1.01, as in the recording)
//   3 the first cash puts the new identity on the chain
//   4 whoever sent it is the guide, for good
// "你" is the demo identity of the recordings; its guide there is 领航员.
// Laid out for portrait (Android episodes).
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const short = (fid: string) => `${fid.slice(0, 4)}…${fid.slice(-4)}`;

const Coin: React.FC<{label: string}> = ({label}) => (
  <span style={{display: 'inline-flex', alignItems: 'center', gap: 10, color: theme.accent, fontSize: 28}}>
    <span style={{width: 30, height: 30, borderRadius: '50%', background: theme.accent, display: 'inline-block'}} />
    {label}
  </span>
);

const Row: React.FC<{text: string; right: React.ReactNode; opacity: number; color?: string; strike?: boolean}> = ({text, right, opacity, color, strike}) => (
  <div
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity,
      padding: '14px 24px', marginBottom: 12, borderRadius: 14, background: '#1D2C47',
      fontSize: 34, color: color ?? theme.text, textDecoration: strike ? 'line-through' : undefined,
    }}
  >
    <span>{text}</span>
    {right}
  </div>
);

const Bill: React.FC<{x: number; y: number; opacity: number}> = ({x, y, opacity}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: 230, height: 120, opacity, borderRadius: 14,
      background: 'linear-gradient(135deg, #2F6B4F, #3E8A64)', border: `3px solid ${GREEN}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF',
    }}
  >
    <div style={{fontSize: 24, opacity: 0.85}}>钞票</div>
    <div style={{fontSize: 38, fontWeight: 700}}>1.01 FCH</div>
  </div>
);

const Person: React.FC<{fid: string; label: string; x: number; y: number; lit: number; opacity: number}> = ({fid, label, x, y, lit, opacity}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 300, textAlign: 'center', opacity}}>
    <div
      style={{
        width: 150, height: 150, margin: '0 auto', borderRadius: '50%', overflow: 'hidden',
        filter: `grayscale(${1 - lit}) brightness(${0.5 + 0.5 * lit})`,
        boxShadow: lit > 0.5 ? `0 0 ${50 * lit}px rgba(91,201,140,${0.6 * lit})` : 'none',
      }}
    >
      <FidAvatar fid={fid} size={150} />
    </div>
    <div style={{fontSize: 40, color: theme.text, fontWeight: 600, marginTop: 14}}>{label}</div>
    <div style={{fontFamily: 'Menlo, monospace', fontSize: 26, color: theme.muted}}>{short(fid)}</div>
  </div>
);

export const FirstCash: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;

  // Bills travel from the guide down to you during stage 3.
  const travel = at(3) ? fade(since(3) - 10, 40) : 0;
  const lit = at(3) ? fade(since(3) - 50, 20) : 0;
  const billY = (i: number) => interpolate(travel, [0, 1], [880, 1330]) + i * 8;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* The shared ledger. */}
      <div style={{position: 'absolute', left: 90, top: 150, width: 900}}>
        <div style={{fontSize: 44, color: theme.text, fontWeight: 600, marginBottom: 20}}>链上空间 · 大家共用</div>
        <Row text="注册名字" right={<Coin label="手续费" />} opacity={fade(frame)} />
        <Row text="发一封信" right={<Coin label="手续费" />} opacity={fade(frame - 10)} />
        <Row text="登记服务器" right={<Coin label="手续费" />} opacity={fade(frame - 20)} />
        <Row text="垃圾信息 × 10000" right={<span style={{color: RED, fontSize: 30}}>没付费，进不来</span>}
          opacity={at(0) ? fade(since(0) - 60) : 0} color={RED} strike />
        <Row text={`${short(YOU)} 收到 3 张钞票`} right={<span style={{color: GREEN, fontSize: 30}}>出现在链上</span>}
          opacity={lit} color={GREEN} />
      </div>
      {at(1) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', fontSize: 40, color: theme.accent, opacity: fade(since(1))}}>
          手续费很少，但不能是零
        </div>
      )}

      {/* Stage 2 on: the guide, the bills, and you. */}
      <Person fid={GUIDE} label={at(4) ? '引路人' : '帮你的人'} x={90} y={860} lit={1} opacity={at(2) ? fade(since(2)) : 0} />
      {[0, 1, 2].map((i) => (
        <Bill key={i} x={400 + i * 18} y={billY(i)} opacity={at(2) ? fade(since(2) - 10 - i * 8) * (1 - (at(3) ? fade(since(3) - 55, 10) : 0)) : 0} />
      ))}
      <Person fid={YOU} label={lit > 0.5 ? '你 · 链上可见' : '你 · 链上没有'} x={690} y={1240} lit={lit} opacity={at(2) ? fade(since(2) - 20) : 0} />

      {/* Stage 4: the guide relation, fixed. */}
      {at(4) && (
        <>
          <div style={{position: 'absolute', left: 236, top: 1110, width: 8, height: 205 * fade(since(4), 15), background: theme.accent, borderRadius: 4}} />
          <div style={{position: 'absolute', left: 236, top: 1311, width: 530 * fade(since(4) - 15, 20), height: 8, background: theme.accent, borderRadius: 4}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 1560, textAlign: 'center', fontSize: 44, color: theme.accent, opacity: fade(since(4) - 50, 20)}}>
            记在链上，永远不会改变
          </div>
        </>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
