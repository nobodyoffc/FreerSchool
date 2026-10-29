import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-18 S2: what a token is. One stage per narration line:
//   0 a proof is one of a kind; a token is a standard proof in many shares
//   1 the chain records the token and how much each holder has
//   2 its actions on the chain: five of them
//   3 deploy: description and rules on the chain; its ID is the deploy transaction
//   4 issue: some to someone, by the rules
//   5 transfer: from a holder to someone else
//   6 destroy: a holder's whole balance; circulation goes down
//   7 close: by the deployer; after that every action on it is void
// The token, its ID and the two people are those S6-S8 record.
const TOM = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const TOKEN_ID = 'be8b8aab…20c5531';
const PAPER = '#F4F1E8';
const INK = '#333';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

const OPS = ['部署', '发行', '转让', '销毁', '关闭'];
const TABLE_X = 90;
const TABLE_W = 900;
const TABLE_Y = 470;
const HOLDER_Y = TABLE_Y + 420;
const OPS_Y = 1500;

// A third holder: a plain silhouette, nobody in particular.
const Someone: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: '#55627A', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: size * 0.55, color: '#C9D2E0'}}>?</div>
);

export const TokenBasics: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const only = (i: number, j: number) => show(i) * (at(j) ? 1 - fade(since(j), 10) : 1);

  // Balances move as the actions play: issue 1 to Tom, a holder transfers, a holder destroys.
  const issued = at(4) ? ease((since(4) - 20) / 30) : 0;
  const moved = at(5) ? ease((since(5) - 30) / 35) : 0;
  const burnt = at(6) ? ease((since(6) - 30) / 25) : 0;
  const closed = show(7, 30);
  const holders = [
    {fid: NAVIGATOR, name: 'cy_qqN8', balance: 2 - moved},
    {fid: TOM, name: 'Tom_9yw4', balance: issued},
    {fid: null, name: '……', balance: 1 + moved - burnt * (1 + moved)},
  ];
  const circulating = 3 + issued - burnt * 2;
  const fmt = (n: number) => String(Math.round(n));
  // The table sits in a block once it is on the chain (stage 1); stage 0 is the comparison.
  const intro = only(0, 1);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          通证
        </div>

        {/* Stage 0: one proof, one of a kind; a stack of the same token. */}
        <div style={{opacity: intro}}>
          <div style={{position: 'absolute', left: 110, top: 420, width: 340, height: 440, borderRadius: 18, background: PAPER, padding: 30, boxSizing: 'border-box'}}>
            <div style={{fontSize: 44, fontWeight: 700, color: INK}}>借据</div>
            <div style={{fontSize: 26, color: '#555', marginTop: 20, lineHeight: 1.5}}>Tom_9yw4 向 cy_qqN8 借 10 F，2026 年 12 月 31 日前归还。</div>
          </div>
          <div style={{position: 'absolute', left: 110, width: 340, top: 890, textAlign: 'center', fontSize: 34, color: theme.muted}}>凭据：独一份</div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{position: 'absolute', left: 600 + i * 22, top: 440 + i * 22, width: 340, height: 220, borderRadius: 16, background: PAPER,
              border: '3px solid #DDD6C4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: INK,
              opacity: show(0, 40 + i * 10)}}>飞人学堂毕业证</div>
          ))}
          <div style={{position: 'absolute', left: 600, width: 430, top: 890, textAlign: 'center', fontSize: 34, color: theme.accent, opacity: show(0, 100)}}>
            通证：标准化，分成许多份
          </div>
        </div>

        {/* Stage 1 on: a block holding the token and its holders. */}
        <div style={{opacity: show(1)}}>
          <div style={{position: 'absolute', left: TABLE_X - 30, top: TABLE_Y - 90, width: TABLE_W + 60, height: 860, borderRadius: 24,
            border: `4px dashed ${theme.muted}`}} />
          <div style={{position: 'absolute', left: TABLE_X, top: TABLE_Y - 70, fontSize: 28, color: theme.muted}}>链上</div>

          {/* The token: name, rules, circulation. */}
          <div style={{position: 'absolute', left: TABLE_X, top: TABLE_Y, width: TABLE_W, height: 330, borderRadius: 18, background: PAPER,
            filter: `grayscale(${closed})`, opacity: 1 - closed * 0.35}}>
            <div style={{position: 'absolute', left: 36, top: 26, fontSize: 44, fontWeight: 700, color: INK}}>飞人学堂毕业证</div>
            <div style={{position: 'absolute', left: 36, top: 96, fontSize: 30, color: '#555'}}>完成飞人学堂入门与进阶课程</div>
            <div style={{position: 'absolute', left: 36, top: 160, fontSize: 28, color: '#777', lineHeight: 1.6}}>规则：容量 · 小数位 · 可转让 · 可关闭 · 开放发行</div>
            <div style={{position: 'absolute', left: 36, top: 250, fontSize: 32, color: INK}}>流通量 <b>{fmt(circulating)}</b></div>
            <div style={{position: 'absolute', right: 36, top: 252, fontSize: 26, color: '#B45309', fontFamily: 'Menlo, monospace', opacity: show(3, 40)}}>
              ID = 部署交易 {TOKEN_ID}
            </div>
            {/* Stage 3: the deployer. */}
            <div style={{position: 'absolute', right: 36, top: 26, display: 'flex', alignItems: 'center', gap: 12, opacity: show(3, 15)}}>
              <FidAvatar fid={NAVIGATOR} size={60} />
              <div style={{fontSize: 28, color: INK}}>部署者</div>
            </div>
          </div>
          {/* Stage 7: closed. */}
          <div style={{position: 'absolute', left: TABLE_X + TABLE_W - 330, top: TABLE_Y + 100, width: 280, height: 110, borderRadius: 14,
            border: `7px solid ${RED}`, color: RED, fontSize: 50, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-12deg)', opacity: closed}}>已关闭</div>

          {/* The holders and their balances. */}
          <div style={{position: 'absolute', left: TABLE_X, top: HOLDER_Y - 50, fontSize: 30, color: theme.muted}}>持有者 · 余额</div>
          {holders.map((h, i) => {
            const x = TABLE_X + 40 + i * 300;
            const focus = (stage === 4 && i === 1) || (stage === 5 && i !== 1) || (stage === 6 && i === 2);
            return (
              <div key={i} style={{position: 'absolute', left: x, top: HOLDER_Y, width: 240, height: 250, borderRadius: 16,
                background: focus ? 'rgba(242, 180, 65, 0.22)' : theme.panel, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, opacity: 1 - closed * 0.4}}>
                {h.fid ? <FidAvatar fid={h.fid} size={96} /> : <Someone size={96} />}
                <div style={{fontSize: 26, color: theme.muted}}>{h.name}</div>
                <div style={{fontSize: 52, color: theme.text, fontWeight: 700}}>{fmt(h.balance)}</div>
              </div>
            );
          })}
          {/* Stage 4: one flies from the token to Tom; stage 5: from the first holder to the third. */}
          {at(4) && issued < 1 && (
            <div style={{position: 'absolute', left: TABLE_X + 450 - 30 + (TABLE_X + 340 - TABLE_X - 450) * issued,
              top: TABLE_Y + 330 + (HOLDER_Y + 150 - TABLE_Y - 330) * issued, width: 60, height: 60, borderRadius: 30, background: theme.accent,
              fontSize: 34, fontWeight: 800, color: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: issued > 0 ? 1 : 0}}>1</div>
          )}
          {at(5) && moved > 0 && moved < 1 && (
            <div style={{position: 'absolute', left: TABLE_X + 160 - 30 + 600 * moved, top: HOLDER_Y + 260 - 60 * Math.sin(Math.PI * moved), width: 60, height: 60,
              borderRadius: 30, background: theme.accent, fontSize: 34, fontWeight: 800, color: '#222', display: 'flex', alignItems: 'center',
              justifyContent: 'center'}}>1</div>
          )}
          {/* Stage 6: the third holder's balance burns. */}
          <div style={{position: 'absolute', left: TABLE_X + 640, width: 240, top: HOLDER_Y + 260, textAlign: 'center', fontSize: 50, opacity: only(6, 7) * show(6, 20)}}>🔥</div>
        </div>

        {/* Stage 2 on: the five actions, each lit in its turn. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: OPS_Y - 70, textAlign: 'center', fontSize: 34, color: theme.muted, opacity: show(2)}}>链上行为</div>
        {OPS.map((op, i) => {
          const lit = stage === 3 + i;
          const done = at(3 + i);
          return (
            <div key={op} style={{position: 'absolute', left: 60 + i * 196, top: OPS_Y, width: 176, height: 130, borderRadius: 16,
              background: lit ? theme.accent : theme.panel, border: `4px solid ${done ? theme.accent : theme.muted}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 700,
              color: lit ? '#222' : theme.text, opacity: show(2, 10 + i * 12) * (i < 4 ? 1 - show(7, 50) * 0.6 : 1)}}>{op}</div>
          );
        })}
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
