import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {NobodyAvatar, NOBODY_MARK} from '../components/NobodyAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-13 S2: the first-FCH board is a 明人. One stage per narration line:
//   0 newcomers send their requests as messages to the 明人 f_ffff
//   1 its key is public: anyone reads its inbox, anyone can speak as it
//   2 a request has a set form; a helper reads one and sends the first bills to that FID
//   3 so nothing f_ffff sends you can be trusted ("pay 1 F first" gets a red cross)
//   4 on to the app
// The newcomers are the two of the recording; the helper is the demo identity, Tom.
// The board's key is never shown. Laid out for portrait (Android episodes).
const BOARD = 'FHG8DW2eHQ5wNAJQnLNKzYUSo2YKt7ffff';
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const NEW = ['FSR2HFQ9PRSaFGnm6jy3QRKZfAJRVPdBZS', 'FCbHA8UdzAJycGp3pLzGMwi7dy66bHpaeQ'];
const GREEN = '#5BC98C';
const RED = '#FF6B6B';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: (x) => x * x * (3 - 2 * x)});
const short = (fid: string) => `${fid.slice(0, 4)}…${fid.slice(-4)}`;

// Where things sit: the 明人 at the top, its inbox under it, newcomers bottom left, you bottom right.
const BOARD_X = 440;
const INBOX = {x: 90, y: 470, w: 900};
const NEW_POS = [{x: 90, y: 1250}, {x: 330, y: 1250}];
const YOU_POS = {x: 780, y: 1250};

const Slip: React.FC<{fid: string; opacity: number; glow: number; y: number}> = ({fid, opacity, glow, y}) => (
  <div style={{position: 'absolute', left: INBOX.x + 30, top: y, width: INBOX.w - 60, opacity, padding: '14px 22px', borderRadius: 14, boxSizing: 'border-box',
    background: '#22324F', border: `3px solid ${glow > 0 ? theme.accent : '#2E4166'}`, boxShadow: glow > 0 ? `0 0 ${30 * glow}px rgba(242,180,65,${0.5 * glow})` : 'none',
    fontSize: 30, color: theme.text, display: 'flex', gap: 18}}>
    <span style={{color: theme.accent}}>求助首币</span>
    <span style={{fontFamily: 'Menlo, monospace'}}>{short(fid)}</span>
    <span style={{color: theme.muted}}>留言（可选）</span>
  </div>
);

export const HelpBoard: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] && stage >= i ? frame - scene.lines[i].from : -1);
  const s0 = since(0), s1 = since(1), s2 = since(2), s3 = since(3);

  // Stage 0: each newcomer's message flies up into the inbox.
  const sent = (i: number) => (s0 >= 0 ? ease(s0, 20 + i * 25, 60 + i * 25) : 0);
  // Stage 1: the key goes public; readers and a pretender appear.
  const open = s1 >= 0 ? fade(s1, 15) : 0;
  const fake = s1 >= 0 ? fade(s1 - 120, 15) : 0;
  // Stage 2: you read the first slip and send it three bills.
  const read = s2 >= 0 ? fade(s2, 15) : 0;
  const pay = s2 >= 0 ? ease(s2, 90, 140) : 0;
  const lit = s2 >= 0 ? fade(s2 - 140, 15) : 0;
  // Stage 3: a message from f_ffff to you, crossed out.
  const scam = s3 >= 0 ? fade(s3, 15) : 0;
  const cross = s3 >= 0 ? fade(s3 - 50, 10) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* The 明人 f_ffff and its public key. */}
      <div style={{position: 'absolute', left: BOARD_X, top: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200}}>
        <NobodyAvatar fid={BOARD} size={200} />
        <div style={{marginTop: 14, fontSize: 36, color: theme.text, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap'}}>
          <span style={{padding: '2px 12px', borderRadius: 8, background: NOBODY_MARK, color: '#FFFFFF', fontSize: 30}}>明人</span>
          <span>f_ffff</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: BOARD_X + 260, top: 170, fontSize: 34, color: theme.accent, opacity: open}}>🔑 私钥公开</div>
      {['🧔', '👩', '👨‍💻'].map((face, i) => (
        <div key={i} style={{position: 'absolute', left: 90 + i * 110, top: 170, fontSize: 70, opacity: s1 >= 0 ? fade(s1 - 20 - i * 10) : 0}}>{face}<span style={{fontSize: 34}}>👀</span></div>
      ))}

      {/* Its inbox: the board. */}
      <div style={{position: 'absolute', left: INBOX.x, top: INBOX.y, width: INBOX.w, height: 380, borderRadius: 20, background: theme.panel}} />
      <div style={{position: 'absolute', left: INBOX.x + 30, top: INBOX.y + 20, fontSize: 30, color: theme.muted}}>f_ffff 的收件箱 · 求助板</div>
      {NEW.map((fid, i) => (
        <Slip key={fid} fid={fid} y={INBOX.y + 80 + i * 100} opacity={sent(i)} glow={i === 0 ? read * (1 - lit) : 0} />
      ))}
      {/* Stage 1: a post as f_ffff by someone else. */}
      <div style={{position: 'absolute', left: INBOX.x + 30, top: INBOX.y + 280, width: INBOX.w - 60, opacity: fake, padding: '14px 22px', borderRadius: 14, boxSizing: 'border-box',
        background: '#3A2430', border: `3px dashed ${RED}`, fontSize: 30, color: theme.text}}>
        🎭 有人冒名 f_ffff 发帖
      </div>
      {s2 >= 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: INBOX.y + 400, textAlign: 'center', fontSize: 32, color: theme.accent, opacity: read}}>
          特定格式：求助首币 · FID · 留言
        </div>
      )}

      {/* Newcomers and you. */}
      {NEW.map((fid, i) => (
        <div key={fid} style={{position: 'absolute', left: NEW_POS[i].x, top: NEW_POS[i].y, width: 200, textAlign: 'center', opacity: s0 >= 0 ? fade(s0 - i * 8) : 0}}>
          <div style={{width: 140, height: 140, margin: '0 auto', borderRadius: '50%', overflow: 'hidden',
            filter: i === 0 ? `grayscale(${1 - lit})` : 'grayscale(1)', boxShadow: i === 0 && lit > 0.5 ? `0 0 ${40 * lit}px rgba(91,201,140,0.6)` : 'none'}}>
            <FidAvatar fid={fid} size={140} />
          </div>
          <div style={{fontSize: 30, color: i === 0 && lit > 0.5 ? GREEN : theme.text, marginTop: 8}}>{i === 0 && lit > 0.5 ? '到账' : '新人'}</div>
          <div style={{fontFamily: 'Menlo, monospace', fontSize: 22, color: theme.muted}}>{short(fid)}</div>
        </div>
      ))}
      <div style={{position: 'absolute', left: YOU_POS.x, top: YOU_POS.y, width: 200, textAlign: 'center', opacity: read}}>
        <div style={{width: 140, height: 140, margin: '0 auto', borderRadius: '50%', overflow: 'hidden'}}>
          <FidAvatar fid={YOU} size={140} />
        </div>
        <div style={{fontSize: 30, color: theme.text, marginTop: 8}}>好心人 · 你</div>
      </div>
      {/* Stage 2: three bills from you to the first newcomer. */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: interpolate(pay, [0, 1], [YOU_POS.x + 20, NEW_POS[0].x + 20]) + i * 14, top: 1150 + i * 8,
          width: 160, height: 80, borderRadius: 10, background: 'linear-gradient(135deg, #2F6B4F, #3E8A64)', border: `2px solid ${GREEN}`,
          color: '#FFFFFF', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: s2 >= 0 ? fade(s2 - 70) * (1 - fade(s2 - 145, 10)) : 0}}>
          1.01 F
        </div>
      ))}
      {s2 >= 0 && (
        <div style={{position: 'absolute', left: NEW_POS[0].x + 100, top: 1520, width: (YOU_POS.x - NEW_POS[0].x) * fade(s2 - 160, 20), height: 6, background: theme.accent, borderRadius: 3}} />
      )}
      {s2 >= 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1540, textAlign: 'center', fontSize: 36, color: theme.accent, opacity: fade(s2 - 180, 15)}}>你成了引路人</div>
      )}

      {/* Stage 3: whatever f_ffff tells you, don't believe it. */}
      {s3 >= 0 && (
        <div style={{position: 'absolute', left: 190, top: 960, width: 700, opacity: scam, padding: '20px 28px', borderRadius: 20, boxSizing: 'border-box',
          background: '#22324F', border: `3px solid ${RED}`, fontSize: 34, color: theme.text}}>
          <div style={{fontSize: 26, color: theme.muted, marginBottom: 6}}>f_ffff 发给你：</div>
          先付 1 F 手续费，才能领首币
          <div style={{position: 'absolute', right: 24, top: 10, fontSize: 90, color: RED, fontWeight: 700, opacity: cross}}>✕</div>
        </div>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
