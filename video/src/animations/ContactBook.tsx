import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-07 S2: contacts. One stage per narration line:
//   0 everyone who has appeared on the chain can be seen there
//   1 a contact is your own private mark on one of them: a title and a memo
//   2 your phone's address book, encrypted, goes onto the chain
//   3 with the private key, another device downloads and decrypts the same book
//   4 others see only the cipher: who you saved, and what you wrote, stays yours
// "你" is the demo identity of the recordings; its guide there is 领航员. The cipher
// is the start of the one in the demo carve (U1-07 S3). Laid out for portrait.
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
// Faces for the crowd only; never shown as text.
const CROWD = [
  'FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1',
  'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FDn2Rb6Tc9Yd3Ue7Vf4Wg8Xh5Yi2Zj6Ak9',
  GUIDE,
  'FEp5Sd8Uf2Vg6Wh9Xi3Yj7Zk4Am8Bm2Cn5', 'FFq8Tg3Vh7Wi2Xj6Yk9Zm4An8Bo3Cp7Dq2',
  'FGr4Uh9Wj3Xk7Ym2Zn6Ao9Bp4Cq8Dr3Es6',
];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const mono = 'Menlo, monospace';
const CIPHER = 'Zwfxi4thehgZd5vDffNN6qYvXvxUwrCeQXOSuEVa6GABnmfu';

// The address book: one entry, the guide.
const Book: React.FC<{x: number; y: number; opacity: number; entry: number; locked?: number; title?: string}> =
  ({x, y, opacity, entry, locked = 0, title = '通讯录'}) => (
    <div style={{position: 'absolute', left: x, top: y, width: 440, height: 360, opacity, borderRadius: 24,
      background: theme.panel, border: `4px solid ${locked > 0.5 ? theme.accent : '#3A4A66'}`, padding: '24px 28px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 34, color: theme.muted, marginBottom: 18}}>📒 {title}</div>
      <div style={{opacity: entry * (1 - locked), display: 'flex', alignItems: 'center', gap: 18}}>
        <FidAvatar fid={GUIDE} size={96} />
        <div>
          <div style={{fontFamily: mono, fontSize: 32, color: BLUE}}>cy_qqN8</div>
          <div style={{marginTop: 8, display: 'inline-block', padding: '4px 14px', borderRadius: 10, fontSize: 28,
            color: theme.bg, background: theme.accent}}>引路人</div>
        </div>
      </div>
      <div style={{opacity: entry * (1 - locked), marginTop: 20, fontSize: 28, color: theme.text, whiteSpace: 'nowrap'}}>备忘：给我第一张钞票的人</div>
      {locked > 0 && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: locked}}>
          <div style={{fontSize: 110}}>🔒</div>
          <div style={{fontFamily: mono, fontSize: 24, color: theme.muted, width: 340, wordBreak: 'break-all', textAlign: 'center'}}>{CIPHER.slice(0, 36)}…</div>
        </div>
      )}
    </div>
  );

export const ContactBook: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  // Stage 1 marks the guide; it stays marked.
  const marked = show(1, 10);
  // Stage 2: the book locks, then a sealed record flies up into the chain.
  const locked = at(2) ? fade(since(2) - 30, 15) : 0;
  const rise = at(2) ? ease(since(2) - 60, 35) : 0;
  const stored = at(2) ? fade(since(2) - 90) : 0;
  // Stage 3: the record comes down to the other device, which unlocks it.
  const down = at(3) ? ease(since(3) - 40, 35) : 0;
  const opened = at(3) ? fade(since(3) - 85, 15) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* The chain: everyone who has appeared on it, in the open. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 120, height: 530, borderRadius: 24,
        background: '#121E33', border: '3px solid #2A3854', opacity: fade(frame)}}>
        <div style={{position: 'absolute', left: 30, top: 20, fontSize: 34, color: theme.muted}}>链上 · 谁都看得见</div>
        <div style={{position: 'absolute', left: 40, right: 40, top: 90, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 26}}>
          {CROWD.map((fid, i) => {
            const isGuide = fid === GUIDE;
            return (
              <div key={fid} style={{width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: fade(frame - 6 - i * 5)}}>
                <div style={{borderRadius: '50%', boxShadow: isGuide && marked > 0 ? `0 0 ${36 * marked}px ${theme.accent}` : 'none',
                  border: `4px solid ${isGuide && marked > 0 ? theme.accent : 'transparent'}`}}>
                  <FidAvatar fid={fid} size={110} />
                </div>
                {isGuide && <div style={{fontFamily: mono, fontSize: 26, color: BLUE, marginTop: 6}}>cy_qqN8</div>}
              </div>
            );
          })}
        </div>
        {/* Stage 2 on: your contact record, sealed. */}
        <div style={{position: 'absolute', left: 30, right: 30, bottom: 24, padding: '14px 22px', borderRadius: 14,
          background: '#1D2C47', border: `3px solid ${theme.accent}`, opacity: stored,
          display: 'flex', alignItems: 'center', gap: 16}}>
          <span style={{fontSize: 30, color: theme.text, whiteSpace: 'nowrap'}}>联系人 · <span style={{fontFamily: mono, color: BLUE}}>Tom_9yw4</span></span>
          <span style={{fontSize: 34}}>🔒</span>
          <span style={{fontFamily: mono, fontSize: 24, color: theme.muted, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{CIPHER}</span>
        </div>
      </div>

      {/* Your phone and its address book. */}
      <div style={{position: 'absolute', left: 60, top: 730, width: 440, textAlign: 'center', fontSize: 34, color: GREEN, opacity: show(1)}}>
        📱 你的手机
      </div>
      <Book x={60} y={790} opacity={show(1)} entry={show(1, 25)} locked={locked * (1 - rise)} />

      {/* Stage 2: the sealed book rises into the chain. */}
      {at(2) && rise > 0 && rise < 1 && (
        <div style={{position: 'absolute', left: 280 - 50, top: 960 - 600 * rise, fontSize: 90, opacity: 1 - fade(since(2) - 88, 6)}}>🔒</div>
      )}

      {/* Stage 3: another device, with the private key. */}
      <div style={{position: 'absolute', left: 580, top: 730, width: 440, textAlign: 'center', fontSize: 34, color: GREEN, opacity: show(3)}}>
        💻 另一台设备 · 🔑 私钥
      </div>
      <Book x={580} y={790} opacity={show(3)} entry={opened} locked={down >= 1 ? 1 - opened : 0} title="通讯录" />
      {at(3) && down > 0 && down < 1 && (
        <div style={{position: 'absolute', left: 800 - 50, top: 560 + 340 * down, fontSize: 90}}>🔒</div>
      )}

      {/* Stage 4: someone else looks: only the cipher. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1220, textAlign: 'center', opacity: show(4)}}>
        <div style={{fontSize: 84}}>👀 <span style={{color: theme.muted}}>🔒 ？</span></div>
        <div style={{marginTop: 12, fontSize: 40, color: theme.text}}>别人只看到密文</div>
        <div style={{marginTop: 10, fontSize: 32, color: theme.muted, opacity: show(4, 30)}}>存了谁、写了什么，只有你知道</div>
      </div>
    </AbsoluteFill>
  );
};
