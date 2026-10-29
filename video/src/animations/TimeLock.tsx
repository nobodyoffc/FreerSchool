import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-16 S4: a lock on a note. One stage per narration line:
//   0 a time lock counts in block heights
//   1 the new note gets a lock with the height it opens at
//   2 locked: the payee holds it but cannot spend it; the payer cannot take it back
//   3 at that height the lock opens; an ordinary note again
//   4 lock it to yourself (savings, a pension) or to someone else (a set date)
//   5 Freer locks by days: one day is 1440 blocks
// Heights are those S5 records: sent near 3,500,158, unlocking at 3,501,598.
const TOM = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const NOW = 3500158;
const UNLOCK = 3501598;
const LINE_Y = 330;
const PEOPLE_Y = 620;
const NOTE_Y = 900;
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;
const fmt = (n: number) => n.toLocaleString('en-US');

export const TimeLock: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const only = (i: number, j: number) => show(i) * (at(j) ? 1 - fade(since(j), 10) : 1);

  // The height marker: crawls during stage 2, runs to the lock height at stage 3.
  const crawl = at(2) ? Math.min(since(2) / 600, 1) * 0.35 : 0;
  const run = at(3) ? ease(since(3) / 30) : 0;
  const progress = crawl + (1 - crawl) * run;
  const height = Math.round(NOW + (UNLOCK - NOW) * progress);
  const open = at(3) ? fade(since(3) - 30, 8) : 0;
  // Stage 1: the note travels from Tom to 领航员.
  const travel = at(1) ? ease((since(1) - 10) / 40) : 0;
  const noteX = 240 + (840 - 240) * travel;
  const x0 = 140;
  const x1 = 940;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          时间锁
        </div>

        {/* The height line. */}
        <div style={{opacity: show(0)}}>
          <div style={{position: 'absolute', left: x0, width: x1 - x0, top: LINE_Y - 3, height: 6, background: theme.muted, borderRadius: 3}} />
          <div style={{position: 'absolute', left: x0, width: (x1 - x0) * progress, top: LINE_Y - 3, height: 6, background: open ? GREEN : theme.accent, borderRadius: 3}} />
          <div style={{position: 'absolute', left: x1 - 4, top: LINE_Y - 30, width: 8, height: 60, background: open ? GREEN : theme.accent}} />
          <div style={{position: 'absolute', left: x1 - 260, width: 300, top: LINE_Y + 40, textAlign: 'right', fontSize: 30, color: open ? GREEN : theme.accent}}>
            {open ? '🔓' : '🔒'} 锁定高度 {fmt(UNLOCK)}
          </div>
          <div style={{position: 'absolute', left: x0 + (x1 - x0) * progress - 12, top: LINE_Y - 12, width: 24, height: 24, borderRadius: 12, background: theme.text}} />
          <div style={{position: 'absolute', left: x0 + (x1 - x0) * progress - 150, width: 300, top: LINE_Y - 80, textAlign: 'center', fontSize: 30, color: theme.text,
            fontFamily: 'Menlo, monospace'}}>
            高度 {fmt(height)}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: LINE_Y + 100, textAlign: 'center', fontSize: 34, color: theme.muted, opacity: only(0, 2)}}>
            时间锁按区块高度计时
          </div>
          {at(2) && !at(3) && (
            <div style={{position: 'absolute', left: 0, right: 0, top: LINE_Y + 100, textAlign: 'center', fontSize: 34, color: theme.accent, opacity: show(2)}}>
              还差 {fmt(UNLOCK - height)} 块
            </div>
          )}
        </div>

        {/* Payer and payee. */}
        {[{fid: TOM, name: 'Tom_9yw4', role: '付款人', x: 240}, {fid: NAVIGATOR, name: 'cy_qqN8', role: '收款人', x: 840}].map((p) => (
          <div key={p.fid} style={{position: 'absolute', left: p.x - 120, width: 240, top: PEOPLE_Y - 80, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 6, opacity: show(1) * (1 - show(4, 0, 10))}}>
            <FidAvatar fid={p.fid} size={120} />
            <div style={{fontSize: 30, color: theme.text}}>{p.name}</div>
            <div style={{fontSize: 26, color: theme.muted}}>{p.role}</div>
          </div>
        ))}

        {/* The note and its lock. */}
        <div style={{position: 'absolute', left: noteX - 150, top: NOTE_Y - 80, width: 300, height: 160, borderRadius: 16, background: '#F4F1E8',
          border: `5px solid ${open ? GREEN : theme.accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          opacity: show(1) * (1 - show(4, 0, 10))}}>
          <div style={{fontSize: 44, fontWeight: 700, color: '#333'}}>1 F</div>
          <div style={{fontSize: 26, color: open ? '#2E8B57' : '#B45309'}}>{open ? '🔓 已解锁' : `🔒 ${fmt(UNLOCK)} 后可花`}</div>
        </div>

        {/* Stage 2: neither side can move it. */}
        {[{label: '收款人：花不了', x: 840, dx: 1}, {label: '付款人：收不回', x: 240, dx: -1}].map((b, i) => (
          <div key={b.label} style={{position: 'absolute', left: b.x - 160, width: 320, top: NOTE_Y + 110 + i * 0, textAlign: 'center',
            opacity: only(2, 3) * show(2, 20 + i * 40)}}>
            <div style={{fontSize: 56, color: RED}}>{i === 0 ? '💸 ✕' : '↩ ✕'}</div>
            <div style={{fontSize: 32, color: RED}}>{b.label}</div>
          </div>
        ))}
        {/* Stage 3: an ordinary note. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: NOTE_Y + 130, textAlign: 'center', fontSize: 38, color: GREEN, opacity: only(3, 4) * show(3, 40)}}>
          锁打开了，和普通钞票一样
        </div>

        {/* Stage 4: uses. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: PEOPLE_Y - 40, display: 'flex', justifyContent: 'center', gap: 60, opacity: only(4, 5) + show(5) * 0.35}}>
          {[{icon: '🐷', title: '锁给自己', note: '存定期 · 养老金'}, {icon: '📅', title: '锁给别人', note: '约好日期才能用'}].map((u, i) => (
            <div key={u.title} style={{width: 380, padding: '30px 0', borderRadius: 24, background: theme.panel, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, opacity: show(4, i * 30)}}>
              <div style={{fontSize: 96}}>{u.icon}</div>
              <div style={{fontSize: 40, color: theme.text, fontWeight: 700}}>{u.title}</div>
              <div style={{fontSize: 32, color: theme.muted}}>{u.note}</div>
            </div>
          ))}
        </div>

        {/* Stage 5: days to blocks. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, opacity: show(5)}}>
          <div style={{fontSize: 56, color: theme.text, fontWeight: 700}}>锁定 1 天</div>
          <div style={{fontSize: 56, color: theme.accent}}>=</div>
          <div style={{fontSize: 56, color: theme.accent, fontWeight: 700, opacity: show(5, 20)}}>1440 个区块</div>
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
