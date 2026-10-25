import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {NobodyAvatar} from '../components/NobodyAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-08 S5: the netizen, an offline master and a servant on the everyday phone. One stage per narration line:
//   0 one role, several identities
//   1 identity A made in 密库 on an offline device; two paper backups, home and office
//   2 identity 1 made in 飞人 on the everyday phone, declares A its master: its key goes to the chain locked to A
//   3 identity 1 chats and joins squares
//   4 1's key is stolen: publish it, 1 becomes a 明人
//   5 identity 2 declares A its master; A tells the platforms and services: 1 is now 2
// Identities are made up; marked 示意.
const A = 'FKetw3EpHaXhPQbxGhbSiCUX2R36b6rm9G';
const ONE = 'FnAXacPRCJpbV3LW2CDos3VGQv79vGVWkr';
const TWO = 'Fh9tULwHrAmM7M1CDXrvCYHyFFUX4UBZEP';
const A_X = 540;
const A_Y = 560;
const ONE_X = 340;
const TWO_X = 740;
const LOW_Y = 1180;
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const At: React.FC<{x: number; y: number; opacity: number; scale?: number; children: React.ReactNode}> = ({x, y, opacity, scale = 1, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, whiteSpace: 'nowrap'}}>{children}</div>
);

const Card: React.FC<{name: string; place: string; color: string; children: React.ReactNode}> = ({name, place, color, children}) => (
  <div style={{padding: '18px 26px', borderRadius: 22, background: theme.panel, border: `3px solid ${color}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
    {children}
    <div style={{fontSize: 36, color, fontWeight: 700}}>身份 {name}</div>
    <div style={{fontSize: 26, color: theme.muted}}>{place}</div>
  </div>
);

const Caption: React.FC<{top: number; opacity: number; color?: string; children: React.ReactNode}> = ({top, opacity, color = theme.text, children}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontSize: 40, color, fontWeight: 600, opacity}}>{children}</div>
);

export const Netizen: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (stage >= i ? ease(since(i) - delay, len) : 0);

  // Stage 1: two paper copies fly off.
  const paper = go(1, 50, 35);
  // Stage 2: 1's key goes up into a box locked to A, onto the chain.
  const lockUp = go(2, 60, 35);
  // Stage 4: the thief takes the key; 1 turns into a 明人.
  const steal = go(4, 10, 30);
  const dead = show(4, 60, 15);
  // Stage 5: the declaration goes out.
  const declare = go(5, 80, 40);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          💬 网民
        </div>

        {/* Stage 0: one role, several identities. */}
        {stage <= 0 && [0, 1, 2].map((k) => (
          <At key={k} x={300 + k * 240} y={820} opacity={fade(frame - 10 - k * 10)}>
            <FidAvatar fid={[A, ONE, TWO][k]} size={150} />
          </At>
        ))}
        {stage <= 0 && <Caption top={1020} opacity={fade(frame - 40)} color={theme.muted}>一个角色，多个身份</Caption>}

        {/* Levels on the left: master high, servants low. */}
        <div style={{position: 'absolute', left: 30, top: A_Y - 20, fontSize: 28, color: BLUE, opacity: show(1, 20)}}>高</div>
        <div style={{position: 'absolute', left: 30, top: LOW_Y - 20, fontSize: 28, color: GREEN, opacity: show(2, 20)}}>低</div>

        {/* Stage 1: A in 密库 on an offline device; two paper backups. */}
        <At x={A_X} y={A_Y} opacity={show(1)}>
          <Card name="A" place="密库 · 断网设备" color={BLUE}>
            <div style={{position: 'relative'}}>
              <FidAvatar fid={A} size={120} />
              <div style={{position: 'absolute', inset: -14, borderRadius: '50%', border: `4px solid ${theme.accent}`, opacity: show(5, 40) * (0.5 + 0.5 * Math.sin(frame / 5))}} />
            </div>
          </Card>
        </At>
        {[{icon: '🏠', name: '家', x: 170}, {icon: '🏢', name: '办公室', x: 910}].map((p, k) => (
          <React.Fragment key={p.name}>
            <At x={lerp(paper, A_X, p.x)} y={lerp(paper, A_Y, A_Y - 120)} opacity={show(1, 50) * (1 - show(2, 0, 20) * 0.5)}><div style={{fontSize: 56}}>📄</div></At>
            <At x={p.x} y={A_Y + 20} opacity={show(1, 70 + k * 10) * (1 - show(2, 0, 20) * 0.5)}>
              <div style={{textAlign: 'center'}}><div style={{fontSize: 64}}>{p.icon}</div><div style={{fontSize: 28, color: theme.muted}}>{p.name}</div></div>
            </At>
          </React.Fragment>
        ))}

        {/* Servant → master links. */}
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
          <defs>
            <marker id="nz-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill={GREEN} />
            </marker>
          </defs>
          <line x1={ONE_X} y1={LOW_Y - 150} x2={A_X - 60} y2={A_Y + 150} stroke={dead ? theme.muted : GREEN} strokeWidth={5} markerEnd="url(#nz-arrow)" opacity={show(2, 15) * (1 - 0.6 * dead)} />
          <line x1={TWO_X} y1={LOW_Y - 150} x2={A_X + 60} y2={A_Y + 150} stroke={GREEN} strokeWidth={5} markerEnd="url(#nz-arrow)" opacity={show(5, 30)} />
        </svg>
        <At x={(ONE_X + A_X) / 2 - 70} y={(LOW_Y + A_Y) / 2} opacity={show(2, 25) * (1 - 0.6 * dead)}><div style={{fontSize: 30, color: GREEN}}>主人</div></At>

        {/* Stage 2: identity 1 on the everyday phone; its key locked to A goes onto the chain. */}
        <At x={ONE_X} y={LOW_Y} opacity={show(2)}>
          <Card name="1" place="飞人 · 日常手机" color={dead ? theme.muted : GREEN}>
            {dead ? <NobodyAvatar fid={ONE} size={120} /> : <FidAvatar fid={ONE} size={120} />}
          </Card>
        </At>
        {at(2) && !at(3) && (
          <At x={lerp(lockUp, ONE_X + 150, 860)} y={lerp(lockUp, LOW_Y - 60, 860)} opacity={show(2, 50) * (1 - go(2, 90, 10))}>
            <div style={{padding: '10px 18px', borderRadius: 14, background: '#121E33', border: `3px solid ${BLUE}`, fontSize: 34}}>
              🔑→📦🔒<span style={{fontSize: 26, color: BLUE}}> A</span>
            </div>
          </At>
        )}
        <At x={860} y={900} opacity={show(2, 90) * (1 - show(3, 0, 20) * 0.6)}>
          <div style={{padding: '10px 20px', borderRadius: 12, border: `3px solid ${theme.accent}`, fontSize: 28, color: theme.accent}}>⛓ 链上：已备份</div>
        </At>

        {/* Stage 3: everyday social life. */}
        {['💬', '🏛️', '❤️', '💬'].map((e, k) => {
          const a = Math.PI * (0.55 + k * 0.17); // round the lower left of the card
          return (
            <At key={k} x={ONE_X + Math.cos(a) * 250} y={LOW_Y + Math.sin(a) * 230} opacity={show(3, k * 10) * (1 - dead)}>
              <div style={{fontSize: 54}}>{e}</div>
            </At>
          );
        })}

        {/* Stage 4: stolen; published; a 明人. */}
        <At x={lerp(steal, ONE_X + 60, 120)} y={lerp(steal, LOW_Y, LOW_Y + 230)} opacity={show(4) * (1 - show(5))}><div style={{fontSize: 44}}>🔑</div></At>
        <At x={120} y={LOW_Y + 300} opacity={show(4) * (1 - show(5))}><div style={{fontSize: 80}}>🥷</div></At>
        <At x={ONE_X} y={LOW_Y + 220} opacity={dead}>
          <div style={{fontSize: 34, color: RED, fontWeight: 700}}>公开私钥 → 明人</div>
        </At>

        {/* Stage 5: identity 2, and A's declaration to the platforms and services. */}
        <At x={TWO_X} y={LOW_Y} opacity={show(5)}>
          <Card name="2" place="飞人 · 日常手机" color={GREEN}><FidAvatar fid={TWO} size={120} /></Card>
        </At>
        {['🏛️ 平台', '🏪 服务商', '📱 应用'].map((s, k) => (
          <At key={s} x={180 + k * 360} y={300} opacity={show(5, 60 + k * 8)}>
            <div style={{padding: '8px 18px', borderRadius: 14, background: theme.panel, border: `2px solid ${theme.muted}`, fontSize: 30, color: theme.text}}>{s}</div>
          </At>
        ))}
        {['1 → 2', '1 → 2', '1 → 2'].map((s, k) => (
          <At key={k} x={lerp(declare, A_X, 180 + k * 360)} y={lerp(declare, A_Y - 120, 380)} opacity={show(5, 80) * (declare < 1 ? 1 : 0.9)}>
            <div style={{padding: '6px 14px', borderRadius: 12, background: '#121E33', border: `2px solid ${BLUE}`, fontSize: 28, color: BLUE, fontWeight: 700}}>📜 {s}</div>
          </At>
        ))}

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
