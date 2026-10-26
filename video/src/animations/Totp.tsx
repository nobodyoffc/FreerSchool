import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';
import {Qr, QR_TOTP} from '../components/Qr';

// U2-12 S5: where the codes of two-step verification come from. One stage per narration line:
//   0 a login box: password, and below it a code
//   1 turning it on, the site shows a QR code with a key; the phone scans it; site and phone each keep the key
//   2 each side computes key + time → the same six digits; a 30-second ring; the digits change once
//   3 a thief with the password only has no key: no entry
//   4 the phone holding the key is lost: you are locked out too
//   5 飞人 keeps the key as a secret on chain; a new phone takes it back and the door opens
const LEFT = 280;
const RIGHT = 800;
const BOX_TOP = 330;
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const PAPER = '#F4F1E8';
const CODES = ['502917', '184630'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

const Field: React.FC<{label: string; value: string; color?: string}> = ({label, value, color = '#222'}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
    <div style={{fontSize: 26, color: '#8A8F98'}}>{label}</div>
    <div style={{height: 64, borderRadius: 10, border: '2px solid #C9CCD2', background: '#fff', fontSize: 34, color,
      display: 'flex', alignItems: 'center', paddingLeft: 18, letterSpacing: 4}}>{value}</div>
  </div>
);

const Ring: React.FC<{left: number; size: number; color: string}> = ({left, size, color}) => {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#2A3A55" strokeWidth={8} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={8} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - left)} />
    </svg>
  );
};

const Side: React.FC<{x: number; title: string; icon: string; opacity: number; children?: React.ReactNode}> = ({x, title, icon, opacity, children}) => (
  <div style={{position: 'absolute', left: x - 210, top: BOX_TOP, width: 420, height: 760, borderRadius: 36, background: theme.panel,
    border: `5px solid ${BLUE}`, opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 30}}>
    <div style={{fontSize: 70}}>{icon}</div>
    <div style={{fontSize: 36, color: theme.text, fontWeight: 700}}>{title}</div>
    {children}
  </div>
);

export const Totp: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const only = (i: number, out = 10) => (stage === i ? fade(since(i)) : stage === i + 1 ? 1 - fade(since(i + 1), out) : 0);
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);

  // Stages 1–2 share the two sides: the site and the phone.
  const sides = stage === 1 || stage === 2 ? fade(since(1)) : stage === 3 ? 1 - fade(since(3), 10) : 0;
  const scan = at(1) ? ease((since(1) - 40) / 30) : 0; // the key copies from the site to the phone
  // Stage 2: a 30-second ring, sped up, turning over once.
  const TURN = 75; // frames for one shown cycle
  const t2 = stage === 2 ? Math.max(since(2) - 20, 0) : 0;
  const left = 1 - (t2 % TURN) / TURN;
  const code = CODES[Math.floor(t2 / TURN) % 2];
  const codeOn = stage === 2 ? fade(since(2) - 20) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          两步验证
        </div>

        {/* Stage 0: the login box, with the code below the password. */}
        <div style={{position: 'absolute', left: 540 - 300, top: BOX_TOP + 40, width: 600, padding: 40, borderRadius: 24, background: PAPER,
          display: 'flex', flexDirection: 'column', gap: 26, opacity: only(0)}}>
          <div style={{fontSize: 40, fontWeight: 700, color: '#222', textAlign: 'center'}}>登录</div>
          <Field label="账号" value="tom@example.com" />
          <Field label="密码" value="••••••••" />
          <div style={{outline: `5px solid ${theme.accent}`, outlineOffset: 10, borderRadius: 10, opacity: fade(since(0) - 30)}}>
            <Field label="验证码" value="_ _ _ _ _ _" color="#8A8F98" />
          </div>
        </div>

        {/* Stages 1–2: the site and the phone each keep the key. */}
        <Side x={LEFT} title="网站" icon="🌐" opacity={sides}>
          <div style={{opacity: stage === 1 ? 1 : 0, height: stage === 1 ? 'auto' : 0}}><Qr rows={QR_TOTP} size={220} /></div>
          <div style={{fontSize: 34, color: theme.accent, fontWeight: 700}}>🔑 密钥</div>
        </Side>
        <Side x={RIGHT} title="手机" icon="📱" opacity={sides}>
          <div style={{fontSize: 34, color: theme.accent, fontWeight: 700, opacity: at(1) ? fade(since(1) - 70) : 0}}>🔑 密钥</div>
        </Side>
        {stage === 1 && scan > 0 && scan < 1 && (
          <div style={{position: 'absolute', left: LEFT + (RIGHT - LEFT) * scan - 40, top: BOX_TOP + 380 - Math.sin(Math.PI * scan) * 120, fontSize: 60}}>🔑</div>
        )}
        <div style={{position: 'absolute', left: 0, right: 0, top: BOX_TOP + 800, textAlign: 'center', fontSize: 36, color: theme.text, opacity: only(1) * fade(since(1) - 80)}}>
          扫一下，网站和手机各存一份
        </div>

        {/* Stage 2: key + time → the same six digits on both sides. */}
        {[LEFT, RIGHT].map((x) => (
          <div key={x} style={{position: 'absolute', left: x - 200, top: BOX_TOP + 300, width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            opacity: codeOn * sides}}>
            <div style={{fontSize: 30, color: theme.muted}}>🔑 密钥 + 🕒 时间</div>
            <div style={{fontSize: 40, color: theme.muted}}>↓</div>
            <div style={{fontSize: 68, fontWeight: 700, color: theme.text, letterSpacing: 6, fontFamily: 'Menlo, monospace'}}>{code}</div>
            <div style={{position: 'relative', width: 120, height: 120}}>
              <Ring left={left} size={120} color={GREEN} />
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: theme.text}}>
                {Math.max(1, Math.ceil(left * 30))}
              </div>
            </div>
          </div>
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: BOX_TOP + 800, textAlign: 'center', fontSize: 40, color: GREEN, fontWeight: 700, opacity: codeOn * sides * fade(since(2) - 40)}}>
          两边一样 ✓ · 三十秒一换
        </div>

        {/* Stage 3: the thief has the password only. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: BOX_TOP + 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, opacity: only(3)}}>
          <div style={{fontSize: 150}}>🦹</div>
          <div style={{display: 'flex', gap: 30, fontSize: 40}}>
            <span style={{color: GREEN}}>密码 ✓</span>
            <span style={{color: RED}}>密钥 ✕</span>
          </div>
          <div style={{fontSize: 150, opacity: fade(since(3) - 30)}}>🚫</div>
          <div style={{fontSize: 40, color: RED, fontWeight: 700, opacity: fade(since(3) - 30)}}>登录不了</div>
        </div>

        {/* Stage 4: the phone with the key is lost; you are locked out too. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: BOX_TOP + 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, opacity: only(4)}}>
          <div style={{position: 'relative', fontSize: 150}}>
            📱
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 220, color: RED, fontWeight: 900,
              opacity: fade(since(4) - 15)}}>✕</div>
          </div>
          <div style={{fontSize: 40, color: theme.muted}}>🔑 密钥跟着手机没了</div>
          <div style={{fontSize: 150, opacity: fade(since(4) - 40)}}>🙁</div>
          <div style={{fontSize: 40, color: RED, fontWeight: 700, opacity: fade(since(4) - 40)}}>你自己也登录不了</div>
        </div>

        {/* Stage 5: 飞人 keeps the key as a secret on chain; a new phone takes it back. */}
        {(() => {
          const up = ease((since(5) - 20) / 30);
          const down = ease((since(5) - 60) / 30);
          return (
            <div style={{opacity: show(5)}}>
              <div style={{position: 'absolute', left: 540 - 200, top: BOX_TOP + 20, width: 400, padding: '20px 0', borderRadius: 18, background: PAPER, color: '#222',
                textAlign: 'center', fontSize: 32, opacity: 1 - fade(since(5) - 48, 8), transform: `translateY(${up * 520}px) scale(${1 - 0.3 * up})`}}>
                <div style={{fontWeight: 700}}>🔑 飞人学堂: Tom</div>
                <div style={{fontSize: 26, color: '#8A8F98', marginTop: 6}}>类型 TOTP · 加密</div>
              </div>
              <div style={{position: 'absolute', left: 0, right: 0, top: BOX_TOP + 470, textAlign: 'center', fontSize: 30, color: theme.muted}}>链上</div>
              {[240, 390, 540, 690, 840].map((x, i) => (
                <div key={x} style={{position: 'absolute', left: x - 60, top: BOX_TOP + 520, width: 120, height: 120, borderRadius: 14,
                  background: '#121E33', border: `3px solid ${i === 2 && up >= 1 ? theme.accent : theme.muted}`}} />
              ))}
              <div style={{position: 'absolute', left: 540 - 60, top: BOX_TOP + 700 + down * 0, fontSize: 60, opacity: down > 0 && down < 1 ? 1 : 0,
                transform: `translateY(${down * 200}px)`}}>🔑</div>
              <div style={{position: 'absolute', left: 0, right: 0, top: BOX_TOP + 880, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40,
                opacity: fade(since(5) - 70)}}>
                <span style={{fontSize: 110}}>📱</span>
                <span style={{fontSize: 40, color: theme.text}}>新手机</span>
                <span style={{fontSize: 110, opacity: fade(since(5) - 95)}}>🚪</span>
                <span style={{fontSize: 40, color: GREEN, fontWeight: 700, opacity: fade(since(5) - 95)}}>又能登录 ✓</span>
              </div>
            </div>
          );
        })()}

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
