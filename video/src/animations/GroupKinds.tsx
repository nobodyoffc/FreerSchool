import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U2-09 S2: three ways people organize, side by side. One stage per narration line:
//   0 the three column heads: square, team, room
//   1 the square: people walk in and out, messages open, nobody in charge
//   2 the team: members recorded on the chain, a consensus every member signs,
//     an owner and managers, messages locked, and with them credit and business
//   3 the room: phones linked to each other, not to the chain; the key in the owner's hand
//   4 under all three: not only chat
// The faces are made-up FIDs, never shown as text. Laid out for portrait.
const FACES = [
  'FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1',
  'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FDn2Rb6Tc9Yd3Ue7Vf4Wg8Xh5Yi2Zj6Ak9',
  'FEp5Sd8Uf2Vg6Wh9Xi3Yj7Zk4Am8Bm2Cn5', 'FFq8Ue3Wg7Xh2Yi6Zj9Ak4Bm7Cn3Dp8Eq2',
];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

const COL_W = 320;
const COL_X = [40, 380, 720];
const HEAD_Y = 110;
const BODY_Y = 270;
const BODY_H = 1110;

// One row of a column: a big symbol over a short label.
const Row: React.FC<{y: number; opacity: number; label: string; color?: string; children: React.ReactNode}> =
  ({y, opacity, label, color = theme.text, children}) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
      <div style={{height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>{children}</div>
      <div style={{fontSize: 32, color, textAlign: 'center'}}>{label}</div>
    </div>
  );

const Envelope: React.FC<{locked: boolean}> = ({locked}) => (
  <div style={{position: 'relative', fontSize: 76, lineHeight: 1}}>
    {locked ? '✉️' : '📨'}
    {locked && <div style={{position: 'absolute', right: -22, bottom: -10, fontSize: 44}}>🔒</div>}
  </div>
);

export const GroupKinds: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);
  // Each column lights up in its stage and stays, a little dimmer, after.
  const lit = (i: number) => (at(i) ? (stage === i ? 1 : 0.75) : 0.35);

  const heads = [
    {name: '广场', icon: '🏛', color: theme.muted},
    {name: '团队', icon: '🛡', color: BLUE},
    {name: '房间', icon: '🚪', color: GREEN},
  ];

  // Stage 1: one walks in from the left, one walks out to the right.
  const walkIn = at(1) ? ease(since(1) - 10, 40) : 0;
  const walkOut = at(1) ? ease(since(1) - 30, 40) : 0;
  // Stage 2: signatures stamp onto the consensus one by one.
  const signed = (k: number) => show(2, 40 + k * 12);
  // Stage 3: the links between phones draw in.
  const link = at(3) ? ease(since(3) - 10, 30) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {heads.map((h, i) => (
        <React.Fragment key={h.name}>
          <div style={{position: 'absolute', left: COL_X[i], top: HEAD_Y, width: COL_W, height: 130, borderRadius: 20,
            background: '#16233A', border: `3px solid ${h.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            opacity: fade(frame - i * 8) * (at(i + 1) || stage < 1 ? 1 : 0.6)}}>
            <span style={{fontSize: 60}}>{h.icon}</span>
            <span style={{fontSize: 52, color: theme.text, fontWeight: 600}}>{h.name}</span>
          </div>
          <div style={{position: 'absolute', left: COL_X[i], top: BODY_Y, width: COL_W, height: BODY_H, borderRadius: 20,
            background: '#121E33', border: `3px ${i === 0 ? 'dashed' : 'solid'} #2A3854`, opacity: fade(frame - 10 - i * 8) * lit(i + 1)}} />
        </React.Fragment>
      ))}

      {/* The square: open, free to come and go, nobody in charge. */}
      <div style={{position: 'absolute', left: COL_X[0], top: BODY_Y, width: COL_W, height: BODY_H, opacity: lit(1) === 0.35 ? 0 : lit(1)}}>
        <Row y={40} opacity={show(1)} label="自由进出" color={GREEN}>
          <div style={{position: 'relative', width: 280, height: 96}}>
            <div style={{position: 'absolute', left: -40 + 140 * walkIn, top: 6, opacity: fade(since(1) - 10)}}><FidAvatar fid={FACES[0]} size={84} /></div>
            <div style={{position: 'absolute', left: 100, top: 6}}><FidAvatar fid={FACES[1]} size={84} /></div>
            <div style={{position: 'absolute', left: 190 + 120 * walkOut, top: 6, opacity: 1 - walkOut}}><FidAvatar fid={FACES[2]} size={84} /></div>
          </div>
        </Row>
        <Row y={330} opacity={show(1, 25)} label="消息公开" color={theme.muted}><Envelope locked={false} /></Row>
        <Row y={620} opacity={show(1, 50)} label="无人管理" color={theme.muted}>
          <span style={{fontSize: 70}}>👑</span><span style={{fontSize: 60, color: RED}}>✕</span>
        </Row>
      </div>

      {/* The team: on the chain, members public, a signed consensus, owner and managers. */}
      <div style={{position: 'absolute', left: COL_X[1], top: BODY_Y, width: COL_W, height: BODY_H, opacity: at(2) ? lit(2) : 0}}>
        <Row y={40} opacity={show(2)} label="链上注册 · 成员公开" color={BLUE}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{width: 84, height: 84, borderRadius: 12, border: `3px solid ${BLUE}`, background: '#1D2C47',
              display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: show(2, 6 + k * 6)}}>
              <FidAvatar fid={FACES[3 + k]} size={62} />
            </div>
          ))}
        </Row>
        <Row y={250} opacity={show(2, 30)} label="签署共识才能加入">
          <span style={{fontSize: 70}}>📜</span>
          {[0, 1, 2].map((k) => <span key={k} style={{fontSize: 40, color: GREEN, opacity: signed(k)}}>✍</span>)}
        </Row>
        <Row y={460} opacity={show(2, 60)} label="所有者 · 管理员">
          <span style={{fontSize: 70}}>👑</span><span style={{fontSize: 52}}>🎖</span><span style={{fontSize: 52}}>🎖</span>
        </Row>
        <Row y={670} opacity={show(2, 80)} label="消息加密"><Envelope locked /></Row>
        <Row y={880} opacity={show(2, 110)} label="积累信用 · 开展商业" color={theme.accent}>
          <span style={{fontSize: 46, color: theme.accent}}>★★★</span><span style={{fontSize: 64}}>🤝</span>
        </Row>
      </div>

      {/* The room: off the chain, phones linked only to each other; the owner holds the key. */}
      <div style={{position: 'absolute', left: COL_X[2], top: BODY_Y, width: COL_W, height: BODY_H, opacity: at(3) ? lit(3) : 0}}>
        <Row y={40} opacity={show(3)} label="链下 · 只有成员互知" color={GREEN}>
          <svg width={280} height={96} style={{position: 'absolute'}}>
            <line x1={50} y1={48} x2={50 + 90 * link} y2={48} stroke={GREEN} strokeWidth={4} />
            <line x1={140} y1={48} x2={140 + 90 * link} y2={48} stroke={GREEN} strokeWidth={4} />
          </svg>
          {[0, 1, 2].map((k) => <span key={k} style={{fontSize: 64, position: 'relative', margin: '0 8px'}}>📱</span>)}
        </Row>
        <Row y={250} opacity={show(3, 30)} label="不上链" color={theme.muted}>
          <span style={{fontSize: 64}}>⛓</span><span style={{fontSize: 56, color: RED}}>✕</span>
        </Row>
        <Row y={460} opacity={show(3, 55)} label="谁建房间谁负责">
          <span style={{fontSize: 70}}>🔑</span>
        </Row>
        <Row y={670} opacity={show(3, 80)} label="消息加密"><Envelope locked /></Row>
        <Row y={880} opacity={show(3, 105)} label="私下社交" color={GREEN}>
          <span style={{fontSize: 70}}>🤫</span>
        </Row>
      </div>

      {/* Stage 4: not only chat. */}
      {COL_X.map((x, i) => (
        <div key={i} style={{position: 'absolute', left: x, top: BODY_Y + BODY_H + 30, width: COL_W, display: 'flex', justifyContent: 'center', gap: 18,
          fontSize: 56, opacity: show(4, i * 8)}}>
          <span>💬</span><span style={{color: theme.muted}}>＋</span><span>…</span>
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: BODY_Y + BODY_H + 130, textAlign: 'center', fontSize: 40, color: theme.text, opacity: show(4, 30)}}>
        不只是聊天
      </div>
    </AbsoluteFill>
  );
};
