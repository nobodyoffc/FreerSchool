import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-16 S2: the chain's clock. One stage per narration line:
//   0 about one block a minute; a block's number is its height
//   1 block 0, 2020-01-01 00:00
//   2 each miner writes its own computer's time into the block
//   3 the times disagree: a later block can carry an earlier time
//   4 so a block's time is only rough
//   5 height is strict: 101 always comes after 100
//   6 height is the same everywhere on the network
//   7 but a bare height says little: which day is 4,000,000?
//   8 so height is written as year . day . hour . minute
//   9 no months, leap years or time zones to care about
//  10 1 minute = 1 block, 60 minutes an hour, 24 hours a day, 400 days a year, from the chain's start
//  11 4,000,000 is 6 . 377 . 18 . 40, each counted from 0
const BLOCKS = [
  {h: 0, time: '00:00'},
  {h: 1, time: '00:01'},
  {h: 2, time: '00:03'},
  {h: 3, time: '00:05'},
  {h: 4, time: '00:02'},
  {h: 5, time: '00:06'},
];
const BX = (i: number) => 140 + i * 160;
const CHAIN_Y = 470; // centre of the blocks
const MID_Y = 900; // stages 5–6
const CELLS = [
  {name: '年', unit: '1 年 = 400 天', value: '6'},
  {name: '天', unit: '1 天 = 24 时', value: '377'},
  {name: '时', unit: '1 时 = 60 分', value: '18'},
  {name: '分', unit: '1 分 = 1 区块', value: '40'},
];
const CELL_Y = 640;
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

export const ChainClock: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const only = (i: number, j: number) => (at(i) ? fade(since(i)) : 0) * (at(j) ? 1 - fade(since(j), 10) : 1);
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  // Stages 0–6: the chain of blocks; it leaves at stage 7.
  const chain = show(0) * (1 - show(7, 0, 10));
  const minerTimes = only(2, 7);
  const blur = at(4) ? 6 * show(4) : 0;
  // The hand that sweeps once a minute.
  const sweep = at(0) && !at(2) ? (since(0) % 60) * 6 : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          链上的钟
        </div>

        {/* The chain. */}
        <div style={{opacity: chain}}>
          {BLOCKS.map((b, i) => {
            const lit0 = i === 0 ? show(1) : 0;
            const wrong = i === 3 || i === 4 ? only(3, 4) : 0;
            return (
              <React.Fragment key={b.h}>
                {i > 0 && <div style={{position: 'absolute', left: BX(i - 1) + 55, top: CHAIN_Y - 2, width: 50, height: 4, background: theme.muted,
                  opacity: fade(since(0) - i * 8)}} />}
                <div style={{position: 'absolute', left: BX(i) - 55, top: CHAIN_Y - 55, width: 110, height: 110, borderRadius: 16,
                  background: lit0 ? `rgba(242, 180, 65, ${0.25 * lit0})` : '#121E33',
                  border: `3px solid ${wrong ? RED : lit0 ? theme.accent : theme.muted}`, opacity: fade(since(0) - i * 8),
                  display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {/* Stage 2 on: the miner's time inside the block. */}
                  <div style={{fontSize: 28, color: wrong ? RED : theme.text, fontFamily: 'Menlo, monospace', opacity: show(2, 20 + i * 4),
                    filter: `blur(${blur}px)`}}>{b.time}</div>
                </div>
                <div style={{position: 'absolute', left: BX(i) - 60, width: 120, top: CHAIN_Y + 66, textAlign: 'center', fontSize: 30,
                  color: theme.accent, fontWeight: 700, opacity: fade(since(0) - i * 8)}}>{b.h}</div>
                {/* Stage 2: each block's miner and its own clock. */}
                <div style={{position: 'absolute', left: BX(i) - 50, width: 100, top: CHAIN_Y - 200, textAlign: 'center', opacity: minerTimes * fade(since(2) - i * 4)}}>
                  <div style={{fontSize: 52}}>🖥️</div>
                  <div style={{fontSize: 22, color: theme.muted}}>矿工</div>
                </div>
                {i === 4 && wrong > 0 && <div style={{position: 'absolute', left: BX(i) - 30, top: CHAIN_Y - 40, fontSize: 64, color: RED, fontWeight: 700,
                  opacity: wrong * show(3, 15)}}>✕</div>}
              </React.Fragment>
            );
          })}
          <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 120, textAlign: 'center', fontSize: 34, color: theme.muted, opacity: show(0, 40)}}>
            高度
          </div>
          {/* Stage 0: a stopwatch, about a minute a block. */}
          <div style={{position: 'absolute', left: 380, top: 230, display: 'flex', alignItems: 'center', gap: 20, opacity: only(0, 2)}}>
            <div style={{position: 'relative', width: 90, height: 90, borderRadius: 45, border: `5px solid ${theme.text}`}}>
              <div style={{position: 'absolute', left: 42, top: 8, width: 6, height: 37, background: theme.accent, transformOrigin: '3px 37px',
                transform: `rotate(${sweep}deg)`}} />
            </div>
            <div style={{fontSize: 40, color: theme.text}}>≈ 1 分钟一块</div>
          </div>
          {/* Stage 1: block 0. */}
          <div style={{position: 'absolute', left: BX(0) - 100, width: 400, top: CHAIN_Y + 170, fontSize: 32, color: theme.accent, opacity: show(1) * (1 - show(2, 0, 10))}}>
            ↑ 2020-01-01 00:00
          </div>
          {/* Stage 3: the later block shows an earlier time. */}
          <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 175, textAlign: 'center', fontSize: 36, color: RED, opacity: only(3, 4)}}>
            后一块的时间，反而比前一块早
          </div>
          {/* Stage 4: rough. */}
          <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 175, textAlign: 'center', fontSize: 36, color: theme.muted, opacity: only(4, 5)}}>
            区块时间 ≈ 大概时间
          </div>
        </div>

        {/* Stage 5: height is strict. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: MID_Y - 60, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, opacity: only(5, 6)}}>
          {[100, 101].map((h, i) => (
            <React.Fragment key={h}>
              {i === 1 && <div style={{fontSize: 70, color: GREEN, opacity: show(5, 15)}}>→</div>}
              <div style={{width: 170, height: 130, borderRadius: 18, border: `4px solid ${GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 52, fontWeight: 700, color: theme.text, opacity: show(5, i * 15)}}>{h}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: MID_Y + 100, textAlign: 'center', fontSize: 38, color: GREEN, opacity: only(5, 6) * show(5, 35)}}>
          101 一定在 100 之后
        </div>

        {/* Stage 6: the same height everywhere. */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return (
            <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * 300 - 90, top: MID_Y + Math.sin(a) * 170 - 32, width: 180, height: 64,
              borderRadius: 32, background: theme.panel, border: `3px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, color: theme.accent, fontFamily: 'Menlo, monospace', opacity: only(6, 7) * fade(since(6) - i * 5)}}>3,500,154</div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: MID_Y - 26, textAlign: 'center', fontSize: 40, color: theme.text, fontWeight: 700, opacity: only(6, 7) * show(6, 30)}}>
          全网统一
        </div>

        {/* Stages 7 and 11: the bare height. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontSize: 96, fontWeight: 700, color: theme.text,
          fontFamily: 'Menlo, monospace', opacity: only(7, 8) + show(11)}}>
          4,000,000
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontSize: 40, color: theme.muted, opacity: only(7, 8) * show(7, 20)}}>
          这是哪一天？
        </div>
        {at(11) && <div style={{position: 'absolute', left: 0, right: 0, top: 430, textAlign: 'center', fontSize: 60, color: theme.accent, opacity: show(11, 15)}}>↓</div>}

        {/* Stages 8–11: year . day . hour . minute. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: CELL_Y, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 18, opacity: show(8)}}>
          {CELLS.map((c, i) => (
            <React.Fragment key={c.name}>
              {i > 0 && <div style={{fontSize: 64, color: theme.text, lineHeight: '130px'}}>.</div>}
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: 200}}>
                <div style={{width: 190, height: 130, borderRadius: 18, border: `4px solid ${theme.accent}`, background: theme.panel, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 700, color: at(11) ? theme.accent : theme.text,
                  opacity: fade(since(8) - i * 6)}}>
                  {at(11) && show(11, 25 + i * 8) > 0.5 ? c.value : c.name}
                </div>
                <div style={{fontSize: 30, color: theme.text, opacity: show(10, i * 10) * (1 - show(11, 0, 8))}}>{c.unit}</div>
                <div style={{fontSize: 28, color: theme.muted, opacity: show(11, 60)}}>从 0 数起</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: CELL_Y + 240, textAlign: 'center', fontSize: 34, color: theme.muted, opacity: show(10, 50) * (1 - show(11, 0, 8))}}>
          起点：Freecash 启动，0.0.0.0
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: CELL_Y + 300, textAlign: 'center', fontSize: 40, color: theme.text, opacity: show(11, 70)}}>
          第 6 年 · 第 377 天 · 18 点 40 分
        </div>

        {/* Stage 9: no months, leap years or time zones. */}
        <div style={{position: 'absolute', left: 240, width: 600, top: 980, borderRadius: 20, background: '#F4F1E8', padding: '20px 0',
          opacity: only(9, 10), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <div style={{fontSize: 36, color: '#333', fontWeight: 700}}>📅 不需要</div>
          {['大小月', '闰年闰月', '时区'].map((t, i) => (
            <div key={t} style={{position: 'relative', fontSize: 40, color: '#555'}}>
              {t}
              <div style={{position: 'absolute', left: -10, right: -10, top: '50%', height: 5, background: RED,
                transform: `scaleX(${show(9, 20 + i * 15, 10)})`, transformOrigin: 'left'}} />
            </div>
          ))}
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
