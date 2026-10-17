import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-09 S2: a leaked key, and the identity's death. One stage per narration line:
//   0 the private key is you: it is in your hand only
//   1 a thief copies it: two identical signatures, nobody can tell which is real
//   2 the best move: publish the key on the chain
//   3 now everyone holds it: people crowd behind the one avatar; it stands for no one, and the thief can no longer pose as you
//   4 that identity is a 明人: grey, a skull badge, the "明人" chip
//   5 Nobody: no one, and anyone
//   6 the moment of publishing is on the chain: signatures before it hold, after it anyone could have signed
//   7 you may also publish a key that never leaked, giving the identity up; it cannot be undone
// The identity is 春花_cjWK, the 明人 the recording shows next: its normal avatar comes from its FID,
// and once the key is public it takes the app's 明人 mark (NobodyUi.markAvatar). No key is shown here.
const SELF = 'FEk41Kqjar45fLDriztUDTUkdki7mmcjWK';
const SELF_NAME = '春花_cjWK';
const AVATAR = 220;
// NobodyUi.markAvatar: badge radius 0.2 × size, centred down-right inside the inscribed circle,
// a white ring 1.12 × the radius, a white skull 1.44 × the radius across.
const BADGE_R = AVATAR * 0.2;
const BADGE_C = AVATAR / 2 + (AVATAR / 2 - BADGE_R) * 0.7071;
const SKULL = 'M12,2C6.48,2 2,6.03 2,11c0,3.05 1.64,5.64 4,7.19V21c0,0.55 0.45,1 1,1h10c0.55,0 1,-0.45 1,-1v-2.81c2.36,-1.55 4,-4.14 4,-7.19C22,6.03 17.52,2 12,2Z M6.3,11.3a2.2,2.2 0,1 0,4.4 0a2.2,2.2 0,1 0,-4.4 0Z M13.3,11.3a2.2,2.2 0,1 0,4.4 0a2.2,2.2 0,1 0,-4.4 0Z M12,14.2L10.7,16.6H13.3Z M9.9,19.2h0.9v2.1h-0.9Z M13.2,19.2h0.9v2.1h-0.9Z';
const NOBODY_MARK = '#E65100';
// Stage 3: the people who now hold the key. Not FIDs: one key means one avatar, so they are
// drawn as people hiding behind the same identity, never as avatars of their own.
const PEOPLE = [
  {face: '🧔', x: 30, y: 330}, {face: '👩', x: 360, y: 320}, {face: '👨‍💻', x: 0, y: 500},
  {face: '👵', x: 395, y: 490}, {face: '🧑', x: 195, y: 300},
];
const GREEN = '#5BC98C';
const RED = '#FF6B6B';
const ORANGE = '#E8590C';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

// A signed statement; `doubt` greys it and swaps the tick for a question mark.
const Signed: React.FC<{x: number; y: number; opacity: number; doubt: number; text?: string}> = ({x, y, opacity, doubt, text = '我同意转账'}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity, width: 300, padding: '14px 18px', borderRadius: 16,
    background: '#22324F', boxSizing: 'border-box', filter: `grayscale(${doubt})`}}>
    <div style={{fontSize: 32, color: theme.text}}>{text}</div>
    <div style={{marginTop: 6, fontSize: 26, color: doubt > 0.5 ? theme.muted : GREEN}}>✍ 签名 {doubt > 0.5 ? '？' : '✓'}</div>
  </div>
);

export const NobodyDeath: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);
  const until = (i: number) => (at(i) ? 1 - fade(since(i), 10) : 1);

  // Stage 1: the thief and his copy.
  const thief = show(1);
  const copied = show(1, 25);
  // Stage 2: the key flies up onto the chain.
  const fly = at(2) ? ease(since(2) - 15, 35) : 0;
  const posted = at(2) ? fade(since(2) - 45) : 0;
  // Stage 3: everyone gets it; the signatures stop meaning anything.
  const shared = show(3, 10);
  const doubt = show(3, 50);
  // Stage 4: the identity turns grey and takes the mark.
  const marked = show(4, 5);
  // Stages 6 and 7 replace the signatures with a timeline, then the giving-up note.
  const timeline = show(6);
  const sigsGone = at(6) ? fade(since(6), 10) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* The chain, up top: the notice board the key is posted to. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 100, height: 200, borderRadius: 24,
        background: '#121E33', border: '3px solid #2A3854', opacity: fade(frame)}}>
        <div style={{position: 'absolute', left: 30, top: 18, fontSize: 32, color: theme.muted}}>链上 · 谁都看得见</div>
        <div style={{position: 'absolute', left: 30, right: 30, top: 80, padding: '16px 22px', borderRadius: 14,
          background: '#1D2C47', border: `3px solid ${ORANGE}`, opacity: posted, fontSize: 32, color: theme.text}}>
          📌 公开私钥 🔑 · 记下这一刻
        </div>
      </div>

      {/* Stage 3: the people behind the identity, drawn first so the avatar stays in front. */}
      {PEOPLE.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: 60 + p.x, top: p.y, fontSize: 92, opacity: at(3) ? fade(since(3) - 10 - i * 6) : 0}}>
          {p.face}<span style={{fontSize: 40, marginLeft: -18}}>🔑</span>
        </div>
      ))}
      {/* The identity. */}
      <div style={{position: 'absolute', left: 60, top: 360, width: 420, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{position: 'relative', width: AVATAR, height: AVATAR}}>
          <div style={{filter: `grayscale(${marked})`}}>
            <FidAvatar fid={SELF} size={AVATAR} />
          </div>
          <svg width={AVATAR} height={AVATAR} style={{position: 'absolute', inset: 0, opacity: marked}}>
            <circle cx={BADGE_C} cy={BADGE_C} r={BADGE_R * 1.12} fill="#FFFFFF" />
            <circle cx={BADGE_C} cy={BADGE_C} r={BADGE_R} fill={NOBODY_MARK} />
            <g transform={`translate(${BADGE_C - BADGE_R * 0.72} ${BADGE_C - BADGE_R * 0.72}) scale(${(BADGE_R * 1.44) / 24})`}>
              <path d={SKULL} fill="#FFFFFF" fillRule="evenodd" />
            </g>
          </svg>
        </div>
        <div style={{marginTop: 18, fontSize: 36, color: theme.text, display: 'flex', alignItems: 'center', gap: 12}}>
          {marked > 0 && <span style={{opacity: marked, padding: '2px 12px', borderRadius: 8, background: NOBODY_MARK, color: '#FFFFFF', fontSize: 30}}>明人</span>}
          <span>{SELF_NAME}</span>
        </div>
      </div>
      {/* Stage 0: the key in your hand; stage 2 sends it up. */}
      <div style={{position: 'absolute', left: 380 + 120 * fly, top: 430 - 290 * fly, fontSize: 96, opacity: show(0, 10) * (1 - posted)}}>🔑</div>
      <div style={{position: 'absolute', left: 340, top: 560, fontSize: 30, color: GREEN, opacity: show(0, 20) * until(1)}}>只在你手里</div>

      {/* Stage 1: the thief, with a copy. */}
      <div style={{position: 'absolute', right: 80, top: 380, width: 360, textAlign: 'center', opacity: thief * (1 - shared)}}>
        <div style={{fontSize: 130}}>🦹</div>
        <div style={{fontSize: 70, opacity: copied}}>🔑</div>
        <div style={{fontSize: 30, color: RED, opacity: copied}}>偷来的副本</div>
      </div>
      {/* Stage 3: one identity, and anyone at all behind it, each with the same private key. */}
      <div style={{position: 'absolute', right: 70, top: 420, width: 440, opacity: shared}}>
        <div style={{fontSize: 38, color: theme.text}}>人人都有同一把私钥</div>
        <div style={{marginTop: 12, fontSize: 30, color: theme.muted}}>谁都能躲在这个身份后面</div>
      </div>
      {/* Stages 1–3: two identical signatures. */}
      <div style={{opacity: 1 - sigsGone}}>
        <Signed x={90} y={800} opacity={show(1, 40)} doubt={doubt} />
        <Signed x={450} y={800} opacity={show(1, 55)} doubt={doubt} />
        <div style={{position: 'absolute', left: 790, top: 800, width: 220, fontSize: 30, color: doubt > 0.5 ? theme.muted : RED, opacity: show(1, 70)}}>
          {doubt > 0.5 ? '谁都能签，证明不了什么' : '哪个是你签的？'}
        </div>
      </div>

      {/* Stage 5: Nobody. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', opacity: show(5) * (1 - sigsGone)}}>
        <div style={{fontSize: 96, color: theme.text, fontWeight: 600, letterSpacing: 4}}>Nobody</div>
        <div style={{marginTop: 6, fontSize: 38, color: theme.muted}}>谁都不是，也可以是任何人</div>
      </div>

      {/* Stage 6: the timeline. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 820, height: 420, opacity: timeline}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 200, height: 6, background: '#3A4A66'}} />
        <div style={{position: 'absolute', left: 470, top: 40, width: 8, height: 330, background: ORANGE}} />
        <div style={{position: 'absolute', left: 224, top: 0, width: 500, textAlign: 'center', fontSize: 30, color: ORANGE, whiteSpace: 'nowrap'}}>公开的时刻 · 记在链上</div>
        {[0, 1, 2].map((i) => (
          <div key={`b${i}`} style={{position: 'absolute', left: 30 + i * 140, top: 230, fontSize: 30, color: GREEN, opacity: fade(since(6) - 20 - i * 6)}}>✍✓</div>
        ))}
        {[0, 1, 2].map((i) => (
          <div key={`a${i}`} style={{position: 'absolute', left: 540 + i * 140, top: 230, fontSize: 30, color: theme.muted, opacity: fade(since(6) - 50 - i * 6)}}>✍？</div>
        ))}
        <div style={{position: 'absolute', left: 0, width: 440, top: 300, textAlign: 'center', fontSize: 30, color: GREEN, opacity: fade(since(6) - 35)}}>之前的签名：依然有效</div>
        <div style={{position: 'absolute', left: 500, right: 0, top: 300, textAlign: 'center', fontSize: 30, color: theme.muted, opacity: fade(since(6) - 65)}}>之后的：谁都可能签</div>
      </div>

      {/* Stage 7: giving an identity up on purpose. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1280, textAlign: 'center', opacity: show(7)}}>
        <div style={{fontSize: 38, color: theme.text}}>没泄露，也可以主动公开，放弃这个身份</div>
        <div style={{marginTop: 12, fontSize: 36, color: RED, opacity: show(7, 40)}}>🔒 公开之后，不可撤销</div>
      </div>
    </AbsoluteFill>
  );
};
