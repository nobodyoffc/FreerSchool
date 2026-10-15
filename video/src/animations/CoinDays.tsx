import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-05 S3: coin days. One stage per narration line:
//   0 a measure against junk on the chain: 币天
//   1 F is the unit of FCH
//   2 a 1 F bill held one day: 1 cd
//   3 a 3.1 F bill held four days: 12.4, floored to 12 cd
//   4 spending it on a carve destroys those coin days: 币天销毁 12 cd
//   5 both are counted in cd
//   6 from block height 4,000,000 (about Aug 2027) every carve must destroy at least 1 cd
//   7 for now, registering a CID needs none
// Formula as FVEP6: whole days only, the product floored. Laid out for portrait.
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const Bill: React.FC<{x: number; y: number; amount: string; opacity: number; scale?: number}> = ({x, y, amount, opacity, scale = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 230, height: 120, opacity, borderRadius: 14,
    transform: `scale(${scale})`, transformOrigin: 'center',
    background: 'linear-gradient(135deg, #2F6B4F, #3E8A64)', border: `3px solid ${GREEN}`,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF'}}>
    <div style={{fontSize: 24, opacity: 0.85}}>钞票</div>
    <div style={{fontSize: 42, fontWeight: 700}}>{amount}</div>
  </div>
);

// Day ticks along a track; `days` may be fractional while it grows.
const Track: React.FC<{x: number; y: number; w: number; total: number; days: number; opacity: number}> = ({x, y, w, total, days, opacity}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, opacity}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 20, height: 6, background: '#2A3854', borderRadius: 3}} />
    <div style={{position: 'absolute', left: 0, width: (w * Math.min(days, total)) / total, top: 20, height: 6, background: theme.accent, borderRadius: 3}} />
    {Array.from({length: total + 1}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: (w * i) / total - 30, width: 60, top: 0, textAlign: 'center'}}>
        <div style={{width: 6, height: 46, margin: '0 auto', borderRadius: 3, background: days >= i ? theme.accent : '#3A4A66'}} />
        <div style={{fontSize: 26, color: days >= i ? theme.text : theme.muted, marginTop: 6}}>{i === 0 ? '收到' : `${i} 天`}</div>
      </div>
    ))}
  </div>
);

export const CoinDays: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  // Stage 2: one day passes. Stage 3: four days, a bigger bill.
  const days2 = at(2) ? interpolate(since(2), [20, 70], [0, 1], clamp) : 0;
  const days3 = at(3) ? interpolate(since(3), [15, 105], [0, 4], clamp) : 0;
  const second = at(3);
  const days = second ? days3 : days2;
  const cd = second ? Math.floor(3.1 * Math.floor(days3)) : Math.floor(days2);
  // Stage 4: the bill is spent and flies into the carve; its coin days freeze as CDD.
  const fly = at(4) ? fade(since(4) - 10, 30) : 0;
  const spent = fly >= 1;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* Stages 0–1: the name and the unit. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', opacity: fade(frame)}}>
        <div style={{fontSize: 96, fontWeight: 700, color: theme.accent}}>币天</div>
        <div style={{fontSize: 36, color: theme.muted, marginTop: 6, opacity: show(0, 20)}}>防止链上垃圾信息的度量</div>
        <div style={{fontSize: 40, color: theme.text, marginTop: 24, opacity: show(1)}}>
          <b style={{fontSize: 52}}>F</b> = FCH 的单位
        </div>
      </div>

      {/* Stages 2–5: a bill ageing, then spent. */}
      {at(2) && (
        <>
          <Bill x={interpolate(fly, [0, 1], [90, 700])} y={interpolate(fly, [0, 1], [500, 960])}
            amount={second ? '3.1 F' : '1 F'} opacity={show(2) * (1 - (at(4) ? fade(since(4) - 35, 10) : 0))}
            scale={interpolate(fly, [0, 1], [1, 0.6])} />
          <Track x={400} y={520} w={second ? 560 : 300} total={second ? 4 : 1} days={days}
            opacity={show(2, 10) * (1 - (at(4) ? fade(since(4), 12) : 0))} />
          {/* The bill's coin days. */}
          <div style={{position: 'absolute', left: 90, right: 90, top: 680, textAlign: 'center', opacity: show(2, 15) * (1 - (at(4) ? fade(since(4) - 45, 15) : 0))}}>
            <div style={{fontSize: 40, color: theme.muted}}>
              {second ? '3.1 F × 4 天 = 12.4 → 取整' : '1 F × 1 天'}
            </div>
            <div style={{fontSize: 72, fontWeight: 700, color: theme.accent, marginTop: 8}}>
              币天 {cd} <span style={{fontSize: 48}}>cd</span>
            </div>
          </div>
          {/* The carve that spends it. */}
          <div style={{position: 'absolute', left: 560, top: 900, width: 440, height: 210, opacity: show(4),
            borderRadius: 18, background: theme.panel, border: `3px solid ${spent ? theme.accent : '#3A4A66'}`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{fontSize: 44, color: theme.text}}>注册 CID</div>
            <div style={{fontSize: 40, color: theme.accent, opacity: spent ? fade(since(4) - 45) : 0, marginTop: 8}}>币天销毁 12 cd</div>
          </div>
          <div style={{position: 'absolute', left: 90, top: 930, width: 450, fontSize: 38, color: theme.muted, opacity: show(4, 50), lineHeight: 1.5}}>
            花掉钞票，<br />它积累的币天就被销毁
          </div>
          {/* Stage 5: one unit for both. */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontSize: 40, color: theme.text, opacity: show(5) * (at(6) ? 1 - fade(since(6), 12) : 1)}}>
            币天、币天销毁，单位都是 <b style={{color: theme.accent}}>cd</b>
          </div>
        </>
      )}

      {/* Stages 6–7: the height the rule starts at. */}
      {at(6) && (
        <div style={{opacity: fade(since(6) - 5, 15)}}>
          <div style={{position: 'absolute', left: 120, right: 120, top: 1240, height: 8, background: '#2A3854', borderRadius: 4}} />
          <div style={{position: 'absolute', left: 120, width: 260, top: 1240, height: 8, background: GREEN, borderRadius: 4}} />
          {/* Now. */}
          <div style={{position: 'absolute', left: 120 + 260 - 60, width: 120, top: 1190, textAlign: 'center'}}>
            <div style={{fontSize: 30, color: at(7) ? GREEN : theme.muted, fontWeight: at(7) ? 700 : 400}}>现在</div>
          </div>
          <div style={{position: 'absolute', left: 120 + 260 - 8, top: 1228, width: 16, height: 32, borderRadius: 8, background: GREEN}} />
          {/* 4,000,000. */}
          <div style={{position: 'absolute', left: 700 - 4, top: 1210, width: 8, height: 70, background: theme.accent, borderRadius: 4}} />
          <div style={{position: 'absolute', left: 520, width: 360, top: 1295, textAlign: 'center'}}>
            <div style={{fontSize: 36, color: theme.accent, fontWeight: 700}}>区块高度 4,000,000</div>
            <div style={{fontSize: 30, color: theme.muted}}>约 2027 年 8 月</div>
          </div>
          <div style={{position: 'absolute', left: 120, top: 1295, width: 380, fontSize: 36, color: GREEN, opacity: show(7), lineHeight: 1.5}}>
            目前：注册 CID<br />不需要币天
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', fontSize: 40, color: theme.text, opacity: show(6, 30)}}>
            此后，每次信息上链至少销毁 <b style={{color: theme.accent}}>1 cd</b>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1490, textAlign: 'center', fontSize: 32, color: RED, opacity: show(6, 60) * (at(7) ? 0.5 : 1)}}>
            短时间刷出大量垃圾信息，做不到
          </div>
        </div>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
