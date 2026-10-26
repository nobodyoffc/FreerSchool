import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-12 S2: a secret is encrypted with your own public key and carved on chain. One stage per narration line:
//   0 a secret card: title, type, content, memo
//   1 the four fields are sealed together with Tom's public key into one cipher
//   2 the cipher goes onto the chain; everyone sees it, only as gibberish
//   3 only Tom's private key opens it
//   4 the old phone is gone; a new phone with the same identity takes the cipher back from the chain
//   5 an off-chain secret lives only in the phone: it goes with the phone, a backup file saves it
//   6 the private key leaks: every cipher on chain opens, the deleted one too
// Tom and the two secrets are those the recordings show.
const TOM = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const CARD_Y = 330;
const CHAIN_Y = 1420;
const BLOCKS = [180, 360, 540, 720, 900];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const PAPER = '#F4F1E8';
const CIPHER = 'Qx7f9KcA2p+Lm0e8\nZr4V1sTj6uWb3nYd\nH5gR0aE7kPiO2wNc';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

const SecretCard: React.FC<{title: string; type: string; memo?: string; scale?: number}> = ({title, type, memo, scale = 1}) => (
  <div style={{width: 520, padding: '26px 34px', borderRadius: 22, background: PAPER, color: '#222', transform: `scale(${scale})`,
    display: 'flex', flexDirection: 'column', gap: 12, fontSize: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
    {[['标题', title], ['类型', type], ['内容', '••••••••'], ['备忘', memo ?? '']].map(([k, v]) => (
      <div key={k} style={{display: 'flex', gap: 24}}>
        <span style={{color: '#8A8F98', width: 70}}>{k}</span>
        <span style={{fontWeight: k === '标题' ? 700 : 400}}>{v}</span>
      </div>
    ))}
  </div>
);

const Cipher: React.FC<{width?: number; fontSize?: number}> = ({width = 420, fontSize = 30}) => (
  <div style={{width, padding: '18px 22px', borderRadius: 16, background: '#121E33', border: `3px solid ${theme.muted}`,
    color: theme.muted, fontFamily: 'Menlo, monospace', fontSize, lineHeight: 1.35, whiteSpace: 'pre', overflow: 'hidden', textAlign: 'center'}}>
    {CIPHER}
  </div>
);

const Phone: React.FC<{x: number; y: number; opacity: number; children?: React.ReactNode}> = ({x, y, opacity, children}) => (
  <div style={{position: 'absolute', left: x - 170, top: y, width: 340, height: 600, borderRadius: 40, background: theme.panel,
    border: `5px solid ${BLUE}`, opacity}}>
    {children}
  </div>
);

const Cross: React.FC<{x: number; y: number; size: number; opacity: number}> = ({x, y, size, opacity}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size, color: RED, fontWeight: 900, lineHeight: 1}}>✕</div>
);

export const SecretOnChain: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const only = (i: number, out = 10) => (stage === i ? fade(since(i)) : stage === i + 1 ? 1 - fade(since(i + 1), out) : 0);
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  // Stages 0–3: the card, sealed into a cipher, down to the chain, opened again by the key.
  const seal = at(1) ? ease((since(1) - 10) / 30) : 0;
  const drop = at(2) ? ease((since(2) - 5) / 35) : 0;
  const keyIn = at(3) ? ease((since(3) - 5) / 30) : 0;
  const reopen = at(3) ? ease((since(3) - 40) / 25) : 0;
  const upper = stage <= 3; // the card/cipher group leaves after stage 3
  const groupOut = stage === 4 ? 1 - fade(since(4), 10) : upper ? 1 : 0;
  const cipherY = CARD_Y + 120 + (CHAIN_Y - 230 - CARD_Y - 120) * drop;
  const chainOn = at(2) ? fade(since(2) - 25) : 0;
  const leak = at(6) ? ease((since(6) - 25) / 30) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          链上秘密
        </div>

        {/* Stage 0, back in stage 3: the secret card. */}
        <div style={{position: 'absolute', left: 540 - 260, top: CARD_Y, opacity: (fade(frame) * (1 - seal) + reopen) * groupOut,
          transform: `scale(${1 - 0.5 * seal + 0.5 * reopen * (at(3) ? 1 : 0)})`, transformOrigin: 'center'}}>
          <SecretCard title="邮箱密码" type="password" memo="演示用" />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: CARD_Y + 330, textAlign: 'center', fontSize: 34, color: GREEN, opacity: reopen * groupOut}}>
          🔑 Tom 的私钥解开
        </div>

        {/* Stage 1: sealed with Tom's public key into one cipher, which goes down in stage 2. */}
        <div style={{position: 'absolute', left: 540 - 210, top: cipherY, opacity: seal * (at(2) ? 1 - fade(since(2) - 38, 8) : 1) * groupOut}}>
          <Cipher />
          <div style={{position: 'absolute', left: -70, top: 40, fontSize: 56}}>🔒</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: CARD_Y + 30, textAlign: 'center', fontSize: 36, color: theme.accent,
          opacity: (at(1) ? fade(since(1) - 30) : 0) * (1 - drop) * groupOut}}>
          用 Tom 的公钥加密 → 密文
        </div>

        {/* The chain, from stage 2 on. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y - 120, textAlign: 'center', fontSize: 30, color: theme.muted, opacity: chainOn}}>链上</div>
        {BLOCKS.map((x, i) => {
          const mine = i === 2 || (at(4) && i === 4) || (at(6) && i === 1);
          return (
            <div key={x} style={{position: 'absolute', left: x - 70, top: CHAIN_Y - 70, width: 140, height: 140, borderRadius: 16,
              background: '#121E33', border: `3px solid ${mine ? theme.accent : theme.muted}`, opacity: chainOn,
              color: theme.muted, fontFamily: 'Menlo, monospace', fontSize: 20, lineHeight: 1.3, whiteSpace: 'pre', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {mine ? 'Qx7f9K\nZr4V1s\nH5gR0a' : ''}
            </div>
          );
        })}
        {BLOCKS.slice(1).map((x) => (
          <div key={x} style={{position: 'absolute', left: x - 90 - 13, top: CHAIN_Y - 2, width: 46, height: 4, background: theme.muted, opacity: chainOn}} />
        ))}

        {/* Stage 2: everyone sees it, only as gibberish. */}
        {[150, 330, 750, 930].map((x, i) => (
          <div key={x} style={{position: 'absolute', left: x - 40, top: CHAIN_Y - 330 + (i % 2) * 50, fontSize: 64, opacity: only(2, 8) * fade(since(2) - 40 - i * 5)}}>👀</div>
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 110, textAlign: 'center', fontSize: 36, color: theme.text, opacity: only(2) * fade(since(2) - 55)}}>
          所有人都看得到 · 只是一串乱码
        </div>

        {/* Stage 3: Tom's private key goes down to the chain and the secret comes back up. */}
        <div style={{position: 'absolute', left: 540 - 200 + 140 * keyIn, top: CHAIN_Y - 320 + 120 * keyIn, fontSize: 80,
          opacity: only(3) * (1 - fade(since(3) - 40, 10))}}>🔑</div>

        {/* Stage 4: the old phone is gone; the new phone, same identity, takes the cipher back. */}
        <Phone x={280} y={360} opacity={only(4)}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 60}}>
            <FidAvatar fid={TOM} size={120} />
            <div style={{fontSize: 30, color: theme.text}}>Tom_9yw4</div>
            <div style={{fontSize: 28, color: theme.muted}}>旧手机</div>
          </div>
        </Phone>
        <Cross x={280} y={660} size={300} opacity={only(4) * fade(since(4) - 15)} />
        <Phone x={800} y={360} opacity={only(4) * fade(since(4) - 25)}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 60}}>
            <FidAvatar fid={TOM} size={120} />
            <div style={{fontSize: 30, color: theme.text}}>Tom_9yw4</div>
            <div style={{fontSize: 28, color: theme.muted}}>新手机 · 同一私钥</div>
            <div style={{marginTop: 30, padding: '14px 24px', borderRadius: 14, background: PAPER, color: '#222', fontSize: 30, fontWeight: 700,
              opacity: fade(since(4) - 80)}}>邮箱密码 <span style={{color: GREEN}}>✓</span></div>
          </div>
        </Phone>
        {/* the cipher rises from its block to the new phone */}
        {stage === 4 && (() => {
          const p = ease((since(4) - 45) / 35);
          return (
            <div style={{position: 'absolute', left: 540 + (800 - 540) * p - 60, top: CHAIN_Y - 60 + (800 - CHAIN_Y) * p, width: 120, height: 120, borderRadius: 14,
              background: '#121E33', border: `3px solid ${theme.accent}`, opacity: p > 0 && p < 1 ? 1 : 0}} />
          );
        })()}

        {/* Stage 5: an off-chain secret stays in the phone; it goes with the phone, unless backed up. */}
        <Phone x={330} y={360} opacity={only(5)}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginTop: 70}}>
            <div style={{fontSize: 28, color: theme.muted}}>这部手机</div>
            <div style={{padding: '18px 26px', borderRadius: 14, background: PAPER, color: '#222', fontSize: 30, fontWeight: 700,
              opacity: 1 - (stage === 5 ? fade(since(5) - 120, 15) : 0)}}>门禁密码</div>
            <div style={{fontSize: 30, color: RED, opacity: 1 - (stage === 5 ? fade(since(5) - 120, 15) : 0)}}>链下</div>
          </div>
        </Phone>
        <Cross x={330} y={660} size={300} opacity={only(5) * fade(since(5) - 110)} />
        <div style={{position: 'absolute', left: 520, top: 600, fontSize: 60, color: theme.accent, opacity: only(5) * fade(since(5) - 40)}}>→</div>
        <div style={{position: 'absolute', left: 640, top: 500, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: only(5) * fade(since(5) - 50)}}>
          <div style={{fontSize: 120, filter: stage === 5 && since(5) > 125 ? `drop-shadow(0 0 ${16 + 8 * Math.sin(frame / 6)}px ${GREEN})` : 'none'}}>📄</div>
          <div style={{fontSize: 34, color: GREEN, fontWeight: 700}}>备份</div>
          <div style={{fontSize: 26, color: theme.muted}}>门禁密码（密文）</div>
        </div>

        {/* Stage 6: the key leaks; every cipher on chain opens, the deleted one too. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: show(6)}}>
          <div style={{fontSize: 110}}>🔑<span style={{fontSize: 80}}>🦹</span></div>
          <div style={{fontSize: 40, color: RED, fontWeight: 700, marginTop: 10}}>私钥泄露</div>
        </div>
        {[{x: 360, t: '旧密码', del: true}, {x: 540, t: '邮箱密码'}, {x: 900, t: '飞人学堂'}].map((c, i) => (
          <div key={c.x} style={{position: 'absolute', left: c.x - 84, top: CHAIN_Y - 200 - 260 * leak, width: 168, textAlign: 'center',
            opacity: show(6, 25 + i * 6), transform: `scale(${0.6 + 0.4 * leak})`}}>
            <div style={{padding: '14px 0', borderRadius: 14, background: PAPER, color: '#222', fontSize: 26, fontWeight: 700}}>{c.t} 🔓</div>
            {c.del && <div style={{marginTop: 10, marginLeft: -60, marginRight: -60, fontSize: 24, color: RED, whiteSpace: 'nowrap'}}>已删除（只是标记）</div>}
          </div>
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 110, textAlign: 'center', fontSize: 36, color: RED, opacity: show(6, 70)}}>
          链上的密文永远删不掉
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
