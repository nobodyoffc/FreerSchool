import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-07 S2: an offline transaction goes back and forth; the private key stays put. One stage per narration line:
//   0 the online phone (飞人) watches the offline identity, no key, and makes an unsigned transaction
//   1 it goes as a QR code to the offline phone (密库), whose key signs it
//   2 the signed transaction goes back as a QR code, and 飞人 broadcasts it to the chain
//   3 both routes carry only the transaction: "没有私钥"; the key never leaves 密库
//   4 check the transaction in 密库 before signing
// The identity and the payee are those the recordings show.
const OFFLINE = {fid: 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8', name: 'cy_qqN8'};
const PAYEE = 'No1_NrC7';
const LEFT = 290;
const RIGHT = 790;
const PHONE_W = 380;
const PHONE_TOP = 330;
const PHONE_H = 720;
const SLIP_Y = 860; // centre y of the transaction slip inside a phone
const CHAIN_Y = 1560;
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

// A fixed pattern standing in for a QR code.
const BITS = '1110101110011001010111011010010110100111011011010001101101011011101011100110011010011010';
const Qr: React.FC<{size: number}> = ({size}) => {
  const n = 9;
  const cell = size / n;
  return (
    <div style={{position: 'relative', width: size, height: size, background: '#fff', borderRadius: 8}}>
      {Array.from({length: n * n}, (_, i) => BITS[i % BITS.length] === '1' && (
        <div key={i} style={{position: 'absolute', left: (i % n) * cell, top: Math.floor(i / n) * cell, width: cell, height: cell, background: '#111'}} />
      ))}
    </div>
  );
};

const Phone: React.FC<{x: number; title: string; online: boolean; opacity: number}> = ({x, title, online, opacity}) => (
  <div style={{position: 'absolute', left: x - PHONE_W / 2, top: PHONE_TOP, width: PHONE_W, height: PHONE_H, borderRadius: 44, background: theme.panel,
    border: `5px solid ${online ? BLUE : theme.muted}`, opacity}}>
    <div style={{position: 'absolute', top: 26, left: 0, right: 0, textAlign: 'center', fontSize: 40, color: theme.text, fontWeight: 700}}>{title}</div>
    <div style={{position: 'absolute', top: 84, left: 0, right: 0, textAlign: 'center', fontSize: 30, color: online ? BLUE : RED}}>
      {online ? '📶 联网' : <><s>📶</s> 断网</>}
    </div>
  </div>
);

export const OfflineTx: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  // Where the transaction slip is, and whether it is signed.
  const go = ease((since(1) - 10) / 40); // left → right, dipping through the upper route
  const back = ease((since(2) - 5) / 40); // right → left, through the lower route
  const down = ease((since(2) - 55) / 30); // left → the chain
  let sx = LEFT;
  let sy = SLIP_Y;
  let flying = 0;
  if (at(1) && !at(2)) {
    sx = LEFT + (RIGHT - LEFT) * go;
    sy = SLIP_Y + Math.sin(Math.PI * go) * 300;
    flying = Math.sin(Math.PI * go);
  }
  if (at(2)) {
    sx = RIGHT + (LEFT - RIGHT) * back;
    sy = SLIP_Y + Math.sin(Math.PI * back) * 420;
    flying = Math.sin(Math.PI * back);
    if (down > 0) {
      sx = LEFT + (540 - LEFT) * down;
      sy = SLIP_Y + (CHAIN_Y - SLIP_Y) * down;
      flying = 0;
    }
  }
  const signed = at(2) || (at(1) && since(1) > 62);
  const stamp = at(1) ? fade(since(1) - 52, 8) : 0; // the key presses on the slip in 密库
  const slipGone = at(2) ? fade(since(2) - 80, 8) : 0;
  const blockLit = at(2) ? fade(since(2) - 82, 10) : 0;
  const check = show(4, 10);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          离线交易
        </div>

        <Phone x={LEFT} title="飞人" online opacity={fade(frame)} />
        <Phone x={RIGHT} title="密库" online={false} opacity={fade(frame - 6)} />

        {/* The offline identity in each phone: watched in 飞人, with its key in 密库. */}
        {[LEFT, RIGHT].map((x) => (
          <div key={x} style={{position: 'absolute', left: x - 150, top: PHONE_TOP + 150, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            opacity: fade(frame - 10)}}>
            <FidAvatar fid={OFFLINE.fid} size={110} />
            <div style={{fontSize: 30, color: theme.text}}>{OFFLINE.name}</div>
            {x === LEFT
              ? <div style={{fontSize: 32, color: theme.muted}}>👁 观察 · 没有私钥</div>
              : <div style={{fontSize: 34, color: theme.accent, fontWeight: 700,
                  textShadow: at(3) ? `0 0 ${14 + 10 * Math.sin(frame / 6)}px ${theme.accent}` : 'none'}}>🔑 私钥</div>}
          </div>
        ))}

        {/* Stage 3: the two routes carry no private key. */}
        {[{y: SLIP_Y + 300, dir: '→', d: 0}, {y: SLIP_Y + 420, dir: '←', d: 14}].map((r) => (
          <React.Fragment key={r.y}>
            <div style={{position: 'absolute', left: LEFT + 60, width: RIGHT - LEFT - 120, top: r.y - 3, height: 6, opacity: show(3, r.d) * 0.8,
              background: `repeating-linear-gradient(90deg, ${theme.accent} 0 18px, transparent 18px 32px)`}} />
            <div style={{position: 'absolute', left: r.dir === '→' ? RIGHT - 80 : LEFT + 40, top: r.y - 30, fontSize: 44, color: theme.accent, opacity: show(3, r.d)}}>{r.dir}</div>
            <div style={{position: 'absolute', left: 0, right: 0, top: r.y - 66, textAlign: 'center', fontSize: 32, color: theme.accent, fontWeight: 700, opacity: show(3, r.d + 10)}}>
              只有交易 · 没有私钥
            </div>
          </React.Fragment>
        ))}

        {/* The chain. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y - 130, textAlign: 'center', fontSize: 30, color: theme.muted, opacity: fade(frame - 14)}}>链上</div>
        {[240, 390, 540, 690].map((x, i) => {
          const lit = i === 2 ? blockLit : 0;
          return (
            <div key={x} style={{position: 'absolute', left: x - 62, top: CHAIN_Y - 62, width: 124, height: 124, borderRadius: 16,
              background: lit ? `rgba(91, 201, 140, ${0.25 * lit})` : '#121E33', border: `3px solid ${lit ? GREEN : theme.muted}`, opacity: fade(frame - 14)}} />
          );
        })}
        {[315, 465, 615].map((x) => (
          <div key={x} style={{position: 'absolute', left: x - 13, top: CHAIN_Y - 2, width: 26, height: 4, background: theme.muted, opacity: fade(frame - 14)}} />
        ))}
        <div style={{position: 'absolute', left: 540 - 140, width: 280, top: CHAIN_Y + 76, textAlign: 'center', fontSize: 30, color: GREEN, opacity: blockLit}}>广播上链</div>

        {/* The transaction slip: a paper in a phone, a QR code on the way. */}
        <div style={{position: 'absolute', left: sx - 130, top: sy - 85, width: 260, height: 170, opacity: show(0, 20) * (1 - slipGone)}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: '#F4F1E8', border: `4px solid ${signed ? GREEN : theme.muted}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 1 - flying, transform: `scale(${1 - down * 0.4})`}}>
            <div style={{fontSize: 30, fontWeight: 700, color: signed ? '#2E8B57' : '#6B7280'}}>{signed ? '已签名交易' : '未签名交易'}</div>
            <div style={{fontSize: 24, color: '#333'}}>付给 {PAYEE} · 1 F</div>
          </div>
          <div style={{position: 'absolute', left: 130 - 60, top: 85 - 60, opacity: flying}}>
            <Qr size={120} />
          </div>
          {/* Stage 1: the key signs, in 密库. */}
          {at(1) && !at(2) && (
            <div style={{position: 'absolute', right: -30, top: -50, fontSize: 64, opacity: stamp * (1 - fade(since(1) - 80, 10)),
              transform: `translateY(${(1 - stamp) * -40}px) rotate(-20deg)`}}>🔑</div>
          )}
        </div>

        {/* Stage 4: check the transaction in 密库 before signing. */}
        <div style={{position: 'absolute', left: RIGHT - 170, top: PHONE_TOP + 470, width: 340, padding: '16px 0', borderRadius: 18, background: theme.bg,
          border: `4px solid ${GREEN}`, textAlign: 'center', opacity: check}}>
          <div style={{fontSize: 44}}>🔍</div>
          <div style={{fontSize: 28, color: theme.text}}>付给 {PAYEE}</div>
          <div style={{fontSize: 28, color: theme.text}}>金额 1 F <span style={{color: GREEN}}>✓</span></div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontSize: 36, color: GREEN, opacity: show(4, 30)}}>
          签名前，在密库里核对收款人和金额
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
