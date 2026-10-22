import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';
import {COLORS, KEY, NAMES, Piece} from './SplitKey';

// U2-02 S6: a social backup. One stage per narration line:
//   0 you and your key; three people you trust
//   1 the whole key to one person: not advised, the key is the identity
//   2 with splitting or encryption: a piece each, or cipher to one and password to another
//   3 better: each piece in a Cmail, through the chain
//   4 on chain it is never lost, and only you and the recipient can open it
//   5 to recover, each gives back their piece: the whole key again
// "你" is the demo identity; the others are made-up faces, never named. The key is made up, marked 示意.
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const FRIENDS = ['FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1', 'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7'];
const FX = [200, 540, 880]; // centre x of each friend
const FY = 1250; // top of the friends' row
const YOU_Y = 330; // where things leave you from
const GREEN = '#5BC98C';
const RED = '#E5686A';
const ORANGE = '#E8590C';
const mono = 'Menlo, monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

// Something on its way, centred on (x, y).
const At: React.FC<{x: number; y: number; opacity: number; children: React.ReactNode}> = ({x, y, opacity, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity, whiteSpace: 'nowrap'}}>{children}</div>
);

const Tag: React.FC<{color: string; children: React.ReactNode}> = ({color, children}) => (
  <div style={{padding: '8px 16px', borderRadius: 12, background: '#1D2C47', border: `3px solid ${color}`, fontSize: 32, color: theme.text}}>{children}</div>
);

const Letter: React.FC<{i: number}> = ({i}) => (
  <div style={{padding: '8px 14px', borderRadius: 12, background: '#1D2C47', border: `3px solid ${ORANGE}`, fontSize: 32, color: theme.text}}>
    🔒✉️ <span style={{color: COLORS[i], fontWeight: 700}}>{NAMES[i]}</span>
  </div>
);

export const SocialKey: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const only = (i: number) => stage === i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (at(i) ? ease(since(i) - delay, len) : 0);

  // Stage 1: the whole key travels to the first friend.
  const whole = go(1, 15, 35);
  // Stage 2: a piece each; then cipher and password to two of them.
  const pieces = go(2, 10, 35);
  const pairAt = 120;
  const pair = go(2, pairAt, 35);
  // Stage 3: letters down into the chain, then out to each friend.
  const down = go(3, 20, 30);
  const out = go(3, 80, 35);
  // Stage 5: the pieces come back up to you.
  const back = go(5, 15, 40);
  const done = show(5, 70);

  const CHAIN_Y = 830;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        {/* You, with the key. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, opacity: fade(frame)}}>
          <FidAvatar fid={YOU} size={130} />
          <div>
            <div style={{fontSize: 38, color: GREEN}}>你</div>
            <div style={{fontFamily: mono, fontSize: 28, color: done > 0 ? GREEN : theme.muted}}>🔑 {KEY.slice(0, 10)}…</div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontSize: 40, color: GREEN, fontWeight: 700, opacity: done}}>
          ✓ 私钥恢复
        </div>

        {/* The people you trust. */}
        {FRIENDS.map((fid, k) => (
          <div key={fid} style={{position: 'absolute', left: FX[k] - 100, top: FY, width: 200, textAlign: 'center',
            opacity: fade(frame - 10 - 6 * k) * (only(1) && k ? 0.35 : 1)}}>
            <div style={{display: 'inline-block'}}><FidAvatar fid={fid} size={130} /></div>
            <div style={{fontSize: 30, color: theme.muted, marginTop: 4}}>亲友</div>
          </div>
        ))}

        {/* Stage 1: the whole key to one person. */}
        {only(1) && (
          <>
            <At x={lerp(whole, 540, FX[0])} y={lerp(whole, YOU_Y + 60, FY - 60)} opacity={show(1, 10)}>
              <Tag color={RED}>🔑 整把私钥</Tag>
            </At>
            <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: show(1, 80)}}>
              <div style={{fontSize: 110, color: theme.accent}}>?</div>
              <div style={{fontSize: 44, color: theme.text, fontWeight: 700, opacity: show(1, 130)}}>私钥就是身份</div>
              <div style={{fontSize: 36, color: RED, marginTop: 12, opacity: show(1, 160)}}>不建议</div>
            </div>
          </>
        )}

        {/* Stage 2: a piece each; or cipher and password apart. */}
        {only(2) && (
          <>
            {[0, 1, 2].map((i) => (
              <At key={i} x={lerp(pieces, 540 + (i - 1) * 200, FX[i])} y={lerp(pieces, YOU_Y + 80, FY - 60)} opacity={show(2) * (1 - pair)}>
                <Piece i={i} size={0.8} />
              </At>
            ))}
            <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontSize: 40, color: theme.text, opacity: show(2, 40) * (1 - pair)}}>
              分解：每人一段
            </div>
            <At x={lerp(pair, 440, FX[0])} y={lerp(pair, YOU_Y + 80, FY - 60)} opacity={show(2, pairAt)}>
              <Tag color={ORANGE}>🔒 密文</Tag>
            </At>
            <At x={lerp(pair, 640, FX[1])} y={lerp(pair, YOU_Y + 80, FY - 60)} opacity={show(2, pairAt)}>
              <Tag color={theme.accent}>🔑 密码</Tag>
            </At>
            <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontSize: 40, color: theme.text, opacity: show(2, pairAt + 40)}}>
              加密：密文和密码分给两个人
            </div>
          </>
        )}

        {/* Stages 3–5: the chain. */}
        <div style={{opacity: show(3)}}>
          <div style={{position: 'absolute', left: 60, right: 60, top: CHAIN_Y + 70, height: 6, background: '#2A3854'}} />
          {[60, 310, 560, 810].map((x, i) => (
            <div key={x} style={{position: 'absolute', left: x, top: CHAIN_Y, width: 210, height: 150, borderRadius: 18, background: '#121E33',
              border: `3px solid ${i === 1 && down > 0.95 ? ORANGE : '#2A3854'}`}}>
              <div style={{position: 'absolute', left: 14, top: 10, fontSize: 24, color: theme.muted}}>区块</div>
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontSize: 40, color: ORANGE, opacity: show(3, 5) * (1 - show(4))}}>
            飞人 · 密信
          </div>
        </div>
        {at(3) && !at(5) &&
          [0, 1, 2].map((i) => {
            // Into the chain (block 1), then out to friend i.
            const x = out > 0 ? lerp(out, 415 + (i - 1) * 60, FX[i]) : lerp(down, 540 + (i - 1) * 190, 415 + (i - 1) * 60);
            const y = out > 0 ? lerp(out, CHAIN_Y + 75, FY - 60) : lerp(down, YOU_Y + 80, CHAIN_Y + 75);
            return (
              <At key={i} x={x} y={y} opacity={show(3, 5 + i * 5)}>
                <Letter i={i} />
              </At>
            );
          })}

        {/* Stage 4: kept on chain; only the two ends open it. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', opacity: show(4) * (1 - show(5))}}>
          <div style={{fontSize: 40, color: theme.text}}>存在链上，不会丢</div>
          <div style={{fontSize: 36, color: theme.muted, marginTop: 14, opacity: show(4, 50)}}>🔓 只有你和收信人能解密</div>
        </div>

        {/* Stage 5: each gives their piece back. */}
        {at(5) &&
          [0, 1, 2].map((i) => (
            <At key={i} x={lerp(back, FX[i], 540 + (i - 1) * 200)} y={lerp(back, FY - 60, YOU_Y + 120)} opacity={1 - done}>
              <Piece i={i} size={0.8} />
            </At>
          ))}
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
