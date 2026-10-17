import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-11 S2: a Cmail goes onto the chain. One stage per narration line:
//   0 no mail server: the letter goes straight into a block on the chain
//   1 it is locked with both sides' keys before it goes on chain
//   2 everyone on the chain sees it, but only as cipher; you and the guide each open it
//   3 against spam: besides the transaction fee, a notice fee goes to the recipient
//   4 everyone can set their own notice fee on chain; unset, the app pays 0.0001 F
// "你" is the demo identity, the recipient is its guide (领航员), as in the recording;
// the onlookers are made-up faces, never named. Laid out for portrait.
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const GUIDE = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const CROWD = [
  'FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1',
  'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FDn2Rb6Tc9Yd3Ue7Vf4Wg8Xh5Yi2Zj6Ak9',
];
const GREEN = '#5BC98C';
const RED = '#FF6B6B';
const BLUE = '#7FB2FF';
const ORANGE = '#E8590C';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const mono = 'Menlo, monospace';
const CIPHER = 'Qm9x7K';

const BLOCK_Y = 900;
const BLOCKS = [60, 310, 560, 810]; // x of each block; the letter lands in the third
const MAIL_BLOCK = 2;

export const CmailChain: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  // Stage 0: the mail server is crossed out; the letter flies from you into a block.
  const crossed = show(0, 25);
  const fly = at(0) ? ease(since(0) - 45, 40) : 0;
  // Stage 1: locked.
  const locked = show(1, 20);
  // Stage 2: onlookers see cipher; both ends open it.
  const opened = show(2, 70);
  // Stage 3: the notice fee coin travels from the block to the guide.
  const coin = at(3) ? ease(since(3) - 50, 45) : 0;

  const mailX = interpolate(fly, [0, 1], [130, BLOCKS[MAIL_BLOCK] + 18]);
  const mailY = interpolate(fly, [0, 1], [430, BLOCK_Y + 60]);
  const coinX = interpolate(coin, [0, 1], [BLOCKS[MAIL_BLOCK] + 80, 820]);
  const coinY = interpolate(coin, [0, 1], [BLOCK_Y - 20, 420]);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* You, on the left; the guide, on the right. */}
      <div style={{position: 'absolute', left: 60, top: 150, width: 300, textAlign: 'center', opacity: fade(frame)}}>
        <div style={{display: 'inline-block'}}><FidAvatar fid={YOU} size={150} /></div>
        <div style={{fontSize: 34, color: GREEN, marginTop: 8}}>你</div>
      </div>
      <div style={{position: 'absolute', right: 60, top: 150, width: 300, textAlign: 'center', opacity: fade(frame - 6)}}>
        <div style={{display: 'inline-block'}}><FidAvatar fid={GUIDE} size={150} /></div>
        <div style={{fontSize: 34, color: BLUE, marginTop: 8, fontFamily: mono}}>cy_qqN8</div>
      </div>

      {/* Stage 0: no mail server. */}
      <div style={{position: 'absolute', left: 390, top: 220, width: 300, height: 130, borderRadius: 20, border: '3px dashed #3A4A66',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: theme.muted, opacity: show(0) * (1 - 0.6 * locked)}}>
        🖥 邮件服务器
        <div style={{position: 'absolute', left: 20, right: 20, top: 62, height: 6, background: RED, borderRadius: 3,
          transform: `scaleX(${crossed})`, transformOrigin: 'left'}} />
      </div>

      {/* The chain. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: BLOCK_Y + 78, height: 6, background: '#2A3854', opacity: fade(frame - 10)}} />
      {BLOCKS.map((x, i) => (
        <div key={x} style={{position: 'absolute', left: x, top: BLOCK_Y, width: 210, height: 160, borderRadius: 18,
          background: '#121E33', border: `3px solid ${i === MAIL_BLOCK && fly > 0.95 ? theme.accent : '#2A3854'}`, opacity: fade(frame - 10 - 4 * i)}}>
          <div style={{position: 'absolute', left: 14, top: 10, fontSize: 24, color: theme.muted}}>区块</div>
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: BLOCK_Y + 180, textAlign: 'center', fontSize: 30, color: theme.muted, opacity: show(0, 90)}}>
        直接刻在链上
      </div>

      {/* The letter: plain at first, cipher once locked. */}
      <div style={{position: 'absolute', left: mailX, top: mailY, opacity: show(0, 10), padding: '8px 14px', borderRadius: 14,
        background: locked > 0.5 ? '#1D2C47' : '#2D6CDF', border: `3px solid ${locked > 0.5 ? ORANGE : 'transparent'}`,
        fontSize: 30, color: theme.text, whiteSpace: 'nowrap'}}>
        {locked > 0.5 ? <span>🔒 <span style={{fontFamily: mono, fontSize: 22, color: theme.muted}}>{CIPHER}…</span></span> : '✉️ 你好…'}
      </div>
      {/* Stage 1: both sides' keys. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontSize: 32, color: ORANGE, opacity: show(1, 5) * (1 - show(3))}}>
        🔑 你的私钥 ＋ 引路人的公钥 → 🔒 密文
      </div>

      {/* Stage 2: onlookers see only cipher; both ends read the original. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1170, display: 'flex', justifyContent: 'center', gap: 50, opacity: show(2) * (1 - 0.6 * show(3))}}>
        {CROWD.map((fid) => (
          <div key={fid} style={{textAlign: 'center'}}>
            <FidAvatar fid={fid} size={100} />
            <div style={{fontSize: 26, color: theme.muted, marginTop: 6}}>👀</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1350, textAlign: 'center', fontSize: 34, color: theme.text, opacity: show(2, 20) * (1 - 0.6 * show(3))}}>
        谁都看得见，但只见密文
      </div>
      {[60, 720].map((left) => (
        <div key={left} style={{position: 'absolute', left, top: 400, width: 300, textAlign: 'center', opacity: opened * (1 - show(3))}}>
          <span style={{display: 'inline-block', padding: '8px 14px', borderRadius: 14, background: '#2D6CDF', fontSize: 28, color: theme.text}}>🔓 你好…</span>
        </div>
      ))}

      {/* Stage 3: transaction fee to put it on chain, notice fee to the recipient. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontSize: 32, color: theme.muted, opacity: show(3, 10)}}>
        ＋ 上链手续费
      </div>
      <div style={{position: 'absolute', left: coinX, top: coinY, opacity: at(3) ? fade(since(3) - 40) * (1 - fade(since(3) - 110)) : 0, fontSize: 30, color: theme.accent, whiteSpace: 'nowrap'}}>
        🪙 通知费
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1480, textAlign: 'center', fontSize: 34, color: theme.text, opacity: show(3, 60)}}>
        发信要付钱，垃圾信就少了
      </div>

      {/* Stage 4: the guide's own notice fee, or the default. */}
      <div style={{position: 'absolute', right: 40, top: 420, width: 340, textAlign: 'center', opacity: show(4, 10)}}>
        <div style={{display: 'inline-block', padding: '10px 18px', borderRadius: 14, border: `3px solid ${theme.accent}`, fontSize: 30, color: theme.accent}}>
          通知费 0.0001 F
        </div>
        <div style={{fontSize: 26, color: theme.muted, marginTop: 8}}>没设置时的默认值</div>
        <div style={{fontSize: 26, color: theme.muted, marginTop: 4, opacity: show(4, 60)}}>✎ 可以自己在链上设</div>
      </div>
    </AbsoluteFill>
  );
};
