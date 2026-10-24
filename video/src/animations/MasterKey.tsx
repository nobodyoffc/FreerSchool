import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-05 S2: what setting a master does. One stage per narration line:
//   0 a servant names another identity as its master
//   1 its private key is locked with the master's public key
//   2 the box and the promise are carved into a block
//   3 only the master's private key opens it: the key goes to the master
//   4 once only, never revoked
// The identities are the demo ones the recordings show (Tom_9yw4 names cy_qqN8).
const SERVANT = {fid: 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4', name: 'Tom_9yw4'};
const MASTER = {fid: 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8', name: 'cy_qqN8'};
const SX = 270; // centre x of the servant
const MX = 810; // centre x of the master
const CARD_Y = 260;
const BOX_Y = 760;
const CHAIN_Y = 1180;
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const ORANGE = '#E8590C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const At: React.FC<{x: number; y: number; opacity: number; children: React.ReactNode}> = ({x, y, opacity, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity, whiteSpace: 'nowrap'}}>{children}</div>
);

const Tag: React.FC<{color: string; children: React.ReactNode}> = ({color, children}) => (
  <div style={{padding: '10px 18px', borderRadius: 14, background: '#1D2C47', border: `3px solid ${color}`, fontSize: 34, color: theme.text}}>{children}</div>
);

const Person: React.FC<{who: {fid: string; name: string}; role: string; color: string; x: number; opacity: number}> = ({who, role, color, x, opacity}) => (
  <div style={{position: 'absolute', left: x - 170, top: CARD_Y, width: 340, height: 330, borderRadius: 24, background: theme.panel,
    border: `3px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity}}>
    <FidAvatar fid={who.fid} size={140} />
    <div style={{fontSize: 34, color: theme.text}}>{who.name}</div>
    <div style={{fontSize: 36, color, fontWeight: 700}}>{role}</div>
  </div>
);

export const MasterKey: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (at(i) ? ease(since(i) - delay, len) : 0);

  // Stage 1: the servant's key and the master's public key meet in the middle; the box closes.
  const keyIn = go(1, 10, 35);
  const lockIn = go(1, 30, 35);
  const sealed = show(1, 75);
  // Stage 2: the box and the promise go down into a block.
  const down = go(2, 60, 35);
  // Stage 3: the master's private key comes down, opens the box, the key goes up to the master.
  const masterKey = go(3, 10, 35);
  const opened = show(3, 50);
  const keyUp = go(3, 70, 40);
  // Stage 4: the stamp.
  const stamp = show(4, 15, 8);
  const stampScale = at(4) ? interpolate(since(4) - 15, [0, 8], [1.6, 1], clamp) : 1;

  const boxX = 540;
  const boxY = lerp(down, BOX_Y, CHAIN_Y + 75);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          设置主人
        </div>

        <Person who={SERVANT} role="仆人" color={GREEN} x={SX} opacity={fade(frame)} />
        <Person who={MASTER} role="主人" color={BLUE} x={MX} opacity={fade(frame - 10)} />
        {/* The declaration: an arrow from the servant to the master. */}
        <div style={{position: 'absolute', left: SX + 175, top: CARD_Y + 130, width: MX - SX - 350, textAlign: 'center', opacity: fade(frame - 25)}}>
          <div style={{fontSize: 26, color: theme.muted}}>我的主人是</div>
          <div style={{fontSize: 60, color: theme.accent, lineHeight: '60px'}}>→</div>
        </div>

        {/* Stage 1: the servant's private key, the master's public key. */}
        {at(1) && sealed < 1 && (
          <>
            <At x={lerp(keyIn, SX, boxX - 90)} y={lerp(keyIn, CARD_Y + 380, BOX_Y)} opacity={show(1, 5) * (1 - sealed)}>
              <Tag color={GREEN}>🔑 仆人私钥</Tag>
            </At>
            <At x={lerp(lockIn, MX, boxX + 110)} y={lerp(lockIn, CARD_Y + 380, BOX_Y)} opacity={show(1, 25) * (1 - sealed)}>
              <Tag color={BLUE}>🔒 主人公钥</Tag>
            </At>
          </>
        )}
        {/* The box: the cipher of the key. Open again at stage 3. */}
        {at(1) && (
          <At x={boxX} y={boxY} opacity={sealed}>
            <div style={{padding: '18px 30px', borderRadius: 18, background: '#1D2C47', border: `4px solid ${ORANGE}`, fontSize: 40, color: theme.text, textAlign: 'center'}}>
              {opened > 0.5 ? '📭' : '📦'} 私钥密文
            </div>
          </At>
        )}
        {/* Stage 2: the promise rides along. */}
        <At x={540} y={lerp(down, BOX_Y + 120, CHAIN_Y + 150)} opacity={show(2, 15) * (1 - show(3, 0))}>
          <div style={{fontSize: 36, color: theme.accent}}>“主人拥有我的一切权利”</div>
        </At>

        {/* The chain. */}
        <div style={{opacity: show(2)}}>
          <div style={{position: 'absolute', left: 60, right: 60, top: CHAIN_Y + 75, height: 6, background: '#2A3854'}} />
          {[60, 310, 560, 810].map((x, i) => (
            <div key={x} style={{position: 'absolute', left: x, top: CHAIN_Y, width: 210, height: 150, borderRadius: 18, background: '#121E33',
              border: `3px solid ${i === 1 || i === 2 ? (down > 0.95 ? ORANGE : '#2A3854') : '#2A3854'}`}}>
              <div style={{position: 'absolute', left: 14, top: 10, fontSize: 24, color: theme.muted}}>区块</div>
            </div>
          ))}
        </div>

        {/* Stage 3: only the master's private key opens it. */}
        {at(3) && (
          <>
            <At x={lerp(masterKey, MX, boxX + 200)} y={lerp(masterKey, CARD_Y + 380, boxY - 10)} opacity={show(3, 5) * (1 - show(3, 60))}>
              <Tag color={BLUE}>🗝 主人私钥</Tag>
            </At>
            <At x={lerp(keyUp, boxX, MX)} y={lerp(keyUp, boxY - 90, CARD_Y + 380)} opacity={show(3, 60)}>
              <Tag color={GREEN}>🔑 仆人私钥</Tag>
            </At>
            <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', opacity: show(3, 110)}}>
              <div style={{fontSize: 40, color: theme.text}}>只有主人能解开</div>
              <div style={{fontSize: 38, color: theme.accent, marginTop: 14}}>基于完全信任的社交备份</div>
            </div>
          </>
        )}

        {/* Stage 4: once only. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center', opacity: stamp}}>
          <div style={{transform: `rotate(-8deg) scale(${stampScale})`, padding: '14px 36px', border: `6px solid ${RED}`, borderRadius: 16,
            fontSize: 52, color: RED, fontWeight: 800, letterSpacing: 4}}>
            仅此一次 · 永不撤销
          </div>
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
