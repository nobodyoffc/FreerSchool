import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {Qr, QR_TX} from '../components/Qr';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-15 S2: a few keys, one identity. One stage per narration line:
//   0 at most 15 members, and at most 15 signatures required
//   1 the members' public keys, and how many must sign: at least 2
//   2 m/n: 2/3 is 3 members, 2 signatures
//   3 the public keys and 2/3 make the redeem script, which gives the FID
//   4 a multisig FID starts with 3; the identity has no key of its own
//   5 it receives money like any identity
//   6 Tom makes the transaction and signs; it goes as a QR code to 领航员, who signs: none left to sign.
//     A signature goes down to the slip; the keys stay where they are
//   7 enough signatures: assembled and broadcast to the chain
//   8 only the transaction and signatures travel; each key stays with its member
// Members, public keys and the multisig FID are those the recordings show.
const MEMBERS = [
  {fid: 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4', name: 'Tom_9yw4', pub: '03e77a…a044'},
  {fid: 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8', name: 'cy_qqN8', pub: '02ec02…fc16'},
  {fid: 'FJYN3D7x4yiLF692WUAe7Vfo2nQpYDNrC7', name: 'No1_NrC7', pub: '03c731…d101'},
];
const MULTISIG = '3DxGrZXuDpjrZ9GSAiPSupDQ69mWVhG1BB';
const XS = [240, 540, 840];
const MEMBER_Y = 270; // top of the member column
const KEY_Y = 480; // centre of each member's key
const BADGE_Y = 650;
const SCRIPT_Y = 810;
const CARD_Y = 960;
const SLIP_Y = 1265;
const CHAIN_Y = 1410; // everything stays above the captions
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

export const Multisig: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  // Stage 0: fifteen slots, gone once the three members come in.
  const slots = show(0) * (1 - show(1, 0, 10));
  const members = show(1);

  // Stage 6: Tom's signature, then 领航员's, lands on the slip; between them it flies as a QR code.
  const t6 = since(6);
  const stamp1 = at(6) ? fade(t6 - 50, 6) : 0;
  const hop = at(6) ? ease((t6 - 70) / 40) : 0;
  const stamp2 = at(6) ? fade(t6 - 145, 6) : 0;
  const keyFly = (start: number) => (at(6) ? ease((t6 - start) / 30) : 0);
  const fly1 = keyFly(20) * (1 - fade(t6 - 60, 8));
  const fly2 = keyFly(115) * (1 - fade(t6 - 155, 8));
  const flying = at(6) && !at(7) ? Math.sin(Math.PI * hop) : 0;
  const rest = !at(6) ? 2 : stamp2 > 0.5 ? 0 : stamp1 > 0.5 ? 1 : 2;
  // Stage 7: the slip goes down to the chain.
  const down = at(7) ? ease((since(7) - 10) / 30) : 0;
  const slipX = at(6) ? XS[0] + (XS[1] - XS[0]) * hop : XS[0];
  const sx = slipX + (540 - slipX) * down;
  const sy = SLIP_Y + (CHAIN_Y - SLIP_Y) * down - flying * 120;
  const slipGone = at(7) ? fade(since(7) - 42, 8) : 0;
  const blockLit = at(7) ? fade(since(7) - 40, 10) : 0;
  const glow = at(8) ? 14 + 10 * Math.sin(frame / 6) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          多签身份
        </div>

        {/* Stage 0: up to 15 members, up to 15 signatures. */}
        <div style={{position: 'absolute', left: 140, top: 400, width: 800, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 22, opacity: slots}}>
          {Array.from({length: 15}, (_, i) => (
            <div key={i} style={{height: 84, borderRadius: 16, border: `3px solid ${theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, opacity: fade(since(0) - i * 3, 6)}}>🔑</div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontSize: 40, color: theme.text, opacity: slots * fade(since(0) - 50)}}>
          成员最多 15 个 · 签名数最多 15 个
        </div>

        {/* The members: avatar, name, key, public key. */}
        {MEMBERS.map((m, i) => {
          const used = i < 2 ? (i === 0 ? stamp1 : stamp2) : 0;
          return (
            <div key={m.fid} style={{position: 'absolute', left: XS[i] - 150, top: MEMBER_Y, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: members * fade(since(1) - i * 6)}}>
              <FidAvatar fid={m.fid} size={110} />
              <div style={{fontSize: 30, color: theme.text}}>{m.name}</div>
              <div style={{fontSize: 52, height: 64, textShadow: glow ? `0 0 ${glow}px ${theme.accent}` : 'none'}}>🔑</div>
              <div style={{fontSize: 26, color: theme.accent, fontFamily: 'Menlo, monospace', opacity: show(1, 20)}}>公钥 {m.pub}</div>
              {at(6) && i < 2 && <div style={{fontSize: 26, color: GREEN, opacity: used}}>✓ 已签名</div>}
              {at(8) && i === 2 && <div style={{fontSize: 26, color: theme.muted, opacity: show(8, 20)}}>没有参与</div>}
            </div>
          );
        })}

        {/* Stages 1–2: how many must sign, then written m/n. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: BADGE_Y, textAlign: 'center', fontSize: 40, color: theme.text,
          opacity: show(1, 30) * (1 - show(2, 0, 8))}}>
          至少 <span style={{color: theme.accent, fontWeight: 700}}>2</span> 人签名才能付款
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: BADGE_Y - 30, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, opacity: show(2, 4)}}>
          <div style={{fontSize: 34, color: theme.muted, textAlign: 'right', width: 220, opacity: show(2, 30)}}>需要签名 →<br />成员 →</div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{fontSize: 64, fontWeight: 700, color: theme.accent, lineHeight: 1}}>2</div>
            <div style={{width: 80, height: 5, background: theme.text, margin: '6px 0'}} />
            <div style={{fontSize: 64, fontWeight: 700, color: theme.text, lineHeight: 1}}>3</div>
          </div>
          <div style={{fontSize: 34, color: theme.muted, width: 220, opacity: show(2, 50)}}>m/n = 2/3</div>
        </div>

        {/* Stage 3: public keys and 2/3 make the redeem script. */}
        {XS.map((x, i) => (
          <div key={x} style={{position: 'absolute', left: x - 2, top: KEY_Y + 120, width: 4, height: SCRIPT_Y - KEY_Y - 130,
            background: theme.accent, opacity: show(3, i * 4) * 0.6, transform: `scaleY(${show(3, i * 4, 20)})`, transformOrigin: 'top'}} />
        ))}
        <div style={{position: 'absolute', left: 120, width: 840, top: SCRIPT_Y - 10, padding: '14px 0', borderRadius: 18, border: `4px solid ${theme.accent}`,
          background: theme.panel, textAlign: 'center', opacity: show(3, 16)}}>
          <div style={{fontSize: 30, color: theme.muted}}>赎回脚本</div>
          <div style={{fontSize: 28, color: theme.text, fontFamily: 'Menlo, monospace', marginTop: 6}}>
            <span style={{color: theme.accent}}>52</span> 03e7… 02ec… 03c7… <span style={{color: theme.accent}}>53</span> ae
          </div>
        </div>
        <div style={{position: 'absolute', left: 540 - 2, top: SCRIPT_Y + 112, width: 4, height: CARD_Y - SCRIPT_Y - 120, background: theme.accent,
          opacity: show(3, 40) * 0.6}} />

        {/* Stages 3–5: the multisig identity. */}
        <div style={{position: 'absolute', left: 140, width: 800, top: CARD_Y, height: 200, borderRadius: 24, background: theme.panel,
          border: `4px solid ${at(5) ? GREEN : theme.muted}`, display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px', boxSizing: 'border-box',
          opacity: show(3, 50)}}>
          <FidAvatar fid={MULTISIG} size={130} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{fontSize: 31, color: theme.text, fontFamily: 'Menlo, monospace'}}>
              <span style={{color: at(4) ? theme.accent : theme.text, fontSize: at(4) ? 31 + 18 * show(4) : 31, fontWeight: 700,
                textShadow: at(4) ? `0 0 ${16 * show(4)}px ${theme.accent}` : 'none'}}>3</span>{MULTISIG.slice(1, 18)}…
            </div>
            <div style={{fontSize: 30, color: theme.muted, opacity: show(4, 20)}}>
              多签身份 · <span style={{color: RED}}>没有私钥</span>
            </div>
          </div>
          <div style={{marginLeft: 'auto', fontSize: 36, color: GREEN, fontWeight: 700, opacity: show(5, 30)}}>3 F</div>
        </div>
        {/* Stage 5: a note of money flies in. */}
        {at(5) && !at(6) && (
          <div style={{position: 'absolute', left: 1000 - 260 * ease(since(5) / 30) - 60, top: CARD_Y - 120 + 180 * ease(since(5) / 30), fontSize: 64,
            opacity: 1 - fade(since(5) - 28, 6)}}>💵</div>
        )}
        <div style={{position: 'absolute', left: 0, right: 0, top: CARD_Y + 215, textAlign: 'center', fontSize: 34, color: GREEN, opacity: show(5, 10) * (1 - show(6))}}>
          和普通身份一样收款
        </div>

        {/* Stage 8: the route between the two signers carries only the transaction and signatures. */}
        <div style={{position: 'absolute', left: XS[0] - 60, width: XS[1] - XS[0] + 120, top: SLIP_Y - 3, height: 6, opacity: show(8) * 0.8,
          background: `repeating-linear-gradient(90deg, ${theme.accent} 0 18px, transparent 18px 32px)`}} />
        <div style={{position: 'absolute', left: XS[0] - 100, width: XS[1] - XS[0] + 200, top: SLIP_Y - 60, textAlign: 'center', fontSize: 32, color: theme.accent,
          fontWeight: 700, opacity: show(8, 10)}}>只有交易和签名</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontSize: 36, color: theme.accent, opacity: show(8, 30)}}>
          私钥都留在各自手里
        </div>

        {/* The chain. */}
        <div style={{position: 'absolute', left: 60, top: CHAIN_Y - 20, fontSize: 28, color: theme.muted, opacity: show(6)}}>链上</div>
        {[240, 390, 540, 690, 840].map((x, i) => {
          const lit = i === 2 ? blockLit : 0;
          return (
            <div key={x} style={{position: 'absolute', left: x - 55, top: CHAIN_Y - 55, width: 110, height: 110, borderRadius: 16,
              background: lit ? `rgba(91, 201, 140, ${0.25 * lit})` : '#121E33', border: `3px solid ${lit ? GREEN : theme.muted}`, opacity: show(6)}} />
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y - 110, textAlign: 'center', fontSize: 32, color: GREEN, opacity: blockLit}}>组装好，广播上链</div>

        {/* Stage 6: the transaction slip. */}
        <div style={{position: 'absolute', left: sx - 150, top: sy - 90, width: 300, height: 180, opacity: show(6) * (1 - slipGone)}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: '#F4F1E8', border: `4px solid ${rest === 0 ? GREEN : theme.muted}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 1 - flying, transform: `scale(${1 - down * 0.4})`}}>
            <div style={{fontSize: 28, fontWeight: 700, color: '#333'}}>付给 Tom_9yw4 · 1 F</div>
            <div style={{fontSize: 26, color: rest === 0 ? '#2E8B57' : '#B45309'}}>还需签名 {rest}</div>
            <div style={{fontSize: 30}}>{stamp1 > 0.5 ? '✍️' : ''}{stamp2 > 0.5 ? ' ✍️' : ''}</div>
          </div>
          <div style={{position: 'absolute', left: 150 - 60, top: 90 - 60, opacity: flying}}>
            <Qr rows={QR_TX} size={120} />
          </div>
        </div>
        {/* A signature, not the key, goes down from Tom, then from 领航员. */}
        {[{fly: fly1, x: XS[0]}, {fly: fly2, x: XS[1]}].map((k) => k.fly > 0 && (
          <div key={k.x} style={{position: 'absolute', left: k.x - 30, top: KEY_Y - 30 + (SLIP_Y - 80 - KEY_Y) * k.fly, fontSize: 56, opacity: 0.6 + 0.4 * k.fly}}>✍️</div>
        ))}

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
