import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-01 S6: one password guards every private key on the phone. One stage per narration line:
//   0 the first thing: set a password
//   1 every private key on this phone is encrypted with it and kept here
//   2 the phone keeps no password, only what it encrypted; the password lives in your head
//   3 nothing leaks out, and nothing can be recovered: back up
// Keys are never shown, only masked; the cipher is made-up text, marked 示意. Laid out for portrait.
const CIPHERS = ['q8Zr0mVt3KfY7wLc', 'H5sp9XaN2dG6uBj4', 'Ti0Q5oRk8yWz3cFv'];
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const PHONE = {x: 240, y: 560, w: 600, h: 900};

export const PasswordVault: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] && stage >= i ? frame - scene.lines[i].from : -1);
  const on = (i: number, delay = 0, len = 12) => (since(i) >= 0 ? fade(since(i) - delay, len) : 0);

  const s0 = since(0);
  const typed = s0 >= 0 ? Math.min(6, Math.floor(Math.max(0, s0 - 15) / 6)) : 0;
  // Stage 1: the keys appear, then the lock closes and each turns into cipher text.
  const locked = on(1, 60, 15);
  // Stage 2: the password leaves the phone for your head.
  const away = on(2, 20, 20);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 52, color: theme.text, fontWeight: 600}}>
        一个密码，保护所有私钥
      </div>

      {/* The password: typed in the phone, then kept only in your head. */}
      <div style={{position: 'absolute', left: 240, top: interpolate(away, [0, 1], [380, 260]), width: 600, height: 110, borderRadius: 20,
        background: '#1E2D49', border: `4px solid ${theme.accent}`, display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 34,
        boxSizing: 'border-box', opacity: fade(frame)}}>
        <span style={{fontSize: 46}}>{away > 0.5 ? '🧠' : '🔑'}</span>
        <span style={{fontSize: 34, color: theme.muted, whiteSpace: 'nowrap'}}>{away > 0.5 ? '只在你的脑子里' : '密码'}</span>
        <span style={{fontSize: 44, color: theme.text, letterSpacing: 8}}>{away > 0.5 ? '' : '●'.repeat(typed)}</span>
      </div>

      {/* The phone. */}
      <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: 60,
        background: theme.panel, border: '6px solid #3A4A66', opacity: fade(frame)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center', fontSize: 36, color: theme.muted}}>这部手机</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 80, opacity: on(1, 40)}}>
          {locked > 0.5 ? '🔒' : '🔓'}
        </div>
        {CIPHERS.map((cipher, i) => (
          <div key={cipher} style={{position: 'absolute', left: 50, top: 260 + i * 150, width: 500, height: 110, borderRadius: 18,
            background: '#1E2D49', border: `3px solid ${locked > 0.5 ? GREEN : '#2A3854'}`, opacity: on(1, i * 10),
            display: 'flex', alignItems: 'center', paddingLeft: 26, gap: 18, boxSizing: 'border-box'}}>
            <span style={{fontSize: 30, color: theme.muted, width: 110}}>{locked > 0.5 ? '密文' : '私钥'}</span>
            {locked > 0.5 ? (
              <span style={{fontSize: 30, color: GREEN, fontFamily: 'Menlo, monospace'}}>{cipher}…</span>
            ) : (
              <span style={{flex: 1, height: 56, marginRight: 26, borderRadius: 10,
                background: 'repeating-linear-gradient(45deg, #5B6170 0 14px, #6B7280 14px 28px)'}} />
            )}
          </div>
        ))}
        {/* Stage 2: what the phone keeps and what it does not. */}
        <div style={{position: 'absolute', left: 50, top: 730, width: 500, fontSize: 34, lineHeight: 1.6, opacity: on(2, 50)}}>
          <div style={{color: GREEN}}>✓ 保存：加密过的数据</div>
          <div style={{color: RED}}>✗ 不保存：密码</div>
        </div>
      </div>

      {/* Stage 3: nothing leaks, nothing comes back; back up. */}
      <div style={{position: 'absolute', left: 90, top: 1520, width: 900, display: 'flex', justifyContent: 'space-between'}}>
        {[['不会外泄', GREEN], ['无法找回', RED], ['做好备份', theme.accent]].map(([text, color], i) => (
          <div key={text} style={{width: 280, padding: '24px 0', textAlign: 'center', borderRadius: 20, background: theme.panel,
            border: `4px solid ${color}`, fontSize: 42, color, fontWeight: 600, opacity: on(3, i * 30)}}>
            {text}
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
