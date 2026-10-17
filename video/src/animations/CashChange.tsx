import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-12 S2: the balance is the bills, and paying gives change. One stage per narration line:
//   0 three bills (1, 0.5, 0.2 F) appear in your wallet; their sum is the balance, 1.7 F
//   1 paying 0.3 F: the 1 F bill leaves whole and becomes two new bills, 0.3 F to the guide
//     and 0.69998 F back to you; a tiny fee (0.00002 F) drops out; the balance is 1.39998 F
// The fee is about what the recording shows (2.19 c). Laid out for portrait (Android episodes).
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const GREEN = '#5BC98C';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: (x) => x * x * (3 - 2 * x)});
const mix = (p: number, a: number, b: number) => a + (b - a) * p;

const W = 280;
const H = 150;
const SLOT_Y = 1230;
const slotX = (i: number) => 90 + i * 310;

const Bill: React.FC<{amount: string; x: number; y: number; opacity: number; glow?: number; scale?: number}> = ({amount, x, y, opacity, glow = 0, scale = 1}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: W, height: H, opacity, borderRadius: 16,
      transform: `scale(${scale})`,
      background: 'linear-gradient(135deg, #2F6B4F, #3E8A64)', border: `3px solid ${glow > 0 ? theme.accent : GREEN}`,
      boxShadow: glow > 0 ? `0 0 ${40 * glow}px rgba(242,180,65,${0.7 * glow})` : 'none',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF',
    }}
  >
    <div style={{fontSize: 26, opacity: 0.85}}>钞票</div>
    <div style={{fontSize: 44, fontWeight: 700}}>{amount}</div>
  </div>
);

export const CashChange: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] && stage >= i ? frame - scene.lines[i].from : -1);
  const s1 = since(1);

  // Stage 1 timeline (frames since the line starts).
  const pick = s1 >= 0 ? fade(s1, 15) : 0; // the 1 F bill lights up
  const lift = s1 >= 0 ? ease(s1, 20, 55) : 0; // ...and moves to the middle
  const split = s1 >= 0 ? ease(s1, 70, 90) : 0; // it is spent whole: two new bills
  const fly = s1 >= 0 ? ease(s1, 110, 150) : 0; // 0.3 F to the guide, the change home
  const drop = s1 >= 0 ? ease(s1, 110, 170) : 0; // the fee falls away
  const settled = s1 >= 0 ? fade(s1 - 160, 15) : 0;
  const cashLike = s1 >= 0 ? fade(s1 - 280, 20) : 0;

  const midX = 400;
  const midY = 760;
  const bill1X = mix(lift, slotX(0), midX);
  const bill1Y = mix(lift, SLOT_Y, midY);

  // The two new bills come out of the spent one, side by side, then go their ways.
  const payX = mix(fly, midX - 170, 700);
  const payY = mix(fly, midY, 420);
  const changeX = mix(fly, midX + 170, slotX(0));
  const changeY = mix(fly, midY, SLOT_Y);

  const sumOpacity = since(0) >= 0 ? fade(since(0) - 50, 15) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
        {stage >= 1 ? '付款：钞票整张花掉，找零' : '余额 = 所有钞票加起来'}
      </div>

      {/* The guide, who is paid in stage 1. */}
      <div style={{position: 'absolute', left: 120, top: 330, width: 400, display: 'flex', alignItems: 'center', gap: 24, opacity: s1 >= 0 ? fade(s1, 15) : 0}}>
        <div style={{width: 130, height: 130, borderRadius: '50%', overflow: 'hidden'}}>
          <FidAvatar fid={GUIDE} size={130} />
        </div>
        <div>
          <div style={{fontSize: 42, color: theme.text, fontWeight: 600}}>引路人</div>
          <div style={{fontSize: 30, color: theme.muted}}>收款 0.3 F</div>
        </div>
      </div>

      {/* Your wallet. */}
      <div style={{position: 'absolute', left: 60, top: SLOT_Y - 90, width: 960, height: H + 130, borderRadius: 24, background: theme.panel}} />
      <div style={{position: 'absolute', left: 90, top: SLOT_Y - 70, fontSize: 34, color: theme.muted}}>你的钞票</div>

      {/* The 0.5 and 0.2 F bills stay put. */}
      <Bill amount="0.5 F" x={slotX(1)} y={SLOT_Y} opacity={since(0) >= 0 ? fade(since(0) - 12) : 0} />
      <Bill amount="0.2 F" x={slotX(2)} y={SLOT_Y} opacity={since(0) >= 0 ? fade(since(0) - 24) : 0} />

      {/* The 1 F bill: spent whole in stage 1. */}
      <Bill amount="1 F" x={bill1X} y={bill1Y} glow={pick} opacity={(since(0) >= 0 ? fade(since(0)) : 0) * (1 - split)} scale={1 + 0.08 * pick * (1 - split)} />
      {s1 >= 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: midY - 90, textAlign: 'center', fontSize: 34, color: theme.accent, opacity: fade(s1 - 30) * (1 - fly)}}>
          整张花掉
        </div>
      )}

      {/* Stage 1: the new bills, and the fee. */}
      <Bill amount="0.3 F" x={payX} y={payY} opacity={split} />
      <Bill amount="0.69998 F" x={changeX} y={changeY} opacity={split} glow={settled * (1 - cashLike)} />
      {s1 >= 0 && (
        <div
          style={{
            position: 'absolute', left: midX + 60, top: mix(drop, midY + 190, midY + 330), opacity: split * (1 - fade(s1 - 200, 30)),
            display: 'flex', alignItems: 'center', gap: 12, fontSize: 30, color: theme.accent,
          }}
        >
          <span style={{width: 26, height: 26, borderRadius: '50%', background: theme.accent, display: 'inline-block'}} />
          交易费 0.00002 F
        </div>
      )}
      {s1 >= 0 && (
        <div style={{position: 'absolute', left: changeX, top: SLOT_Y + H + 14, width: W, textAlign: 'center', fontSize: 30, color: GREEN, opacity: settled}}>
          找零
        </div>
      )}

      {/* The balance: the bills added up. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: SLOT_Y + H + 90, textAlign: 'center', fontSize: 44, color: theme.text, opacity: sumOpacity}}>
        {settled > 0.5 ? (
          <>0.69998 + 0.5 + 0.2 = 余额 <span style={{color: theme.accent, fontWeight: 700}}>1.39998 F</span></>
        ) : (
          <>1 + 0.5 + 0.2 = 余额 <span style={{color: theme.accent, fontWeight: 700}}>1.7 F</span></>
        )}
      </div>
      {s1 >= 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', fontSize: 44, color: theme.accent, opacity: cashLike}}>
          和现金找零一样
        </div>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
