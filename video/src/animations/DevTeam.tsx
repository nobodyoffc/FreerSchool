import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-08 S6: the developer, one master and a tree of servants. One stage per narration line:
//   0 three apps: a, b, c
//   1 master A made in 密库 on an offline device; three paper backups
//   2 app a (free): identity 1, contact, on the work computer → A
//   3 app b: identity 2, cashier, on the work computer; identity 3, support, on the everyday phone → A
//   4 app c: identities 4 cashier and 5 support lead → A; 6 and 7 support → 5
//   5 eight identities at work; some handed to AI
//   6 from outside a team; behind it one person
//   7 only A needs guarding: every line leads back to A
// Identities are made up; marked 示意.
const A = {fid: 'FDUj6uBMG4gLx5At28t9cScXMYrPJZqAwp', x: 540, y: 470};
const APPS = [
  {name: 'a', note: '免费', x: 170},
  {name: 'b', note: '', x: 470},
  {name: 'c', note: '用户多', x: 830},
];
const APP_Y = 760;
const ROW1 = 1020;
const ROW2 = 1290;
type Servant = {id: string; fid: string; job: string; device: string; x: number; y: number; master: string; stage: number; ai?: boolean};
const SERVANTS: Servant[] = [
  {id: '1', fid: 'FGYu2jVnhLdpFxmNomFmkMPn8K3BD9eHVa', job: '联系人', device: '💻', x: 170, y: ROW1, master: 'A', stage: 2},
  {id: '2', fid: 'F4TEiHD8TcqgdXzaB26PDyWVrqTbHpoqAV', job: '掌柜', device: '💻', x: 395, y: ROW1, master: 'A', stage: 3},
  {id: '3', fid: 'FGCa5mcpVhcSvNuu5NZJg3whfzCdyPAVJ1', job: '客服', device: '📱', x: 560, y: ROW1, master: 'A', stage: 3, ai: true},
  {id: '4', fid: 'Fu9cqHNzieMZKFGTwkrvQkcudkd14cXXzV', job: '掌柜', device: '💻', x: 740, y: ROW1, master: 'A', stage: 4},
  {id: '5', fid: 'FDoEyveR8Ja8ntu5KKjLvEFxBiaUBzpioX', job: '客服主管', device: '💻', x: 920, y: ROW1, master: 'A', stage: 4},
  {id: '6', fid: 'FLckSrM34hCdJkTJofEuGjj94vXvTSsRZE', job: '客服', device: '💻', x: 810, y: ROW2, master: '5', stage: 4, ai: true},
  {id: '7', fid: 'Fhoa63T4ianLT7DwM7xLQJJ3XAiU6WaSeV', job: '客服', device: '💻', x: 960, y: ROW2, master: '5', stage: 4, ai: true},
];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const At: React.FC<{x: number; y: number; opacity: number; scale?: number; children: React.ReactNode}> = ({x, y, opacity, scale = 1, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, whiteSpace: 'nowrap'}}>{children}</div>
);

const Caption: React.FC<{top: number; opacity: number; color?: string; children: React.ReactNode}> = ({top, opacity, color = theme.text, children}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontSize: 40, color, fontWeight: 600, opacity}}>{children}</div>
);

export const DevTeam: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (stage >= i ? ease(since(i) - delay, len) : 0);

  // Stage 4 has two steps: 4 and 5 first, then 6 and 7.
  const appear = (s: Servant) => (s.master === '5' ? show(4, 120) : show(s.stage, s.stage === 3 && s.id === '3' ? 60 : 20));
  const paper = go(1, 50, 35);
  // Stage 6: the team photo; one person behind it.
  const team = show(6, 10, 20);
  const one = show(6, 70, 20);
  // Stage 7: every line leads back to A.
  const pulse = at(7) ? (since(7) % 40) / 40 : -1;
  const pos = (id: string) => (id === 'A' ? A : SERVANTS.find((s) => s.id === id)!);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          💼 开发者
        </div>

        {/* Servant → master links; at stage 7 a light runs up each one to A. */}
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
          {SERVANTS.map((s) => {
            const m = pos(s.master);
            const o = appear(s) * (1 - 0.5 * team * (1 - show(7)));
            const x1 = s.x;
            const y1 = s.y - 80;
            const x2 = m.x;
            const y2 = m.y + (s.master === 'A' ? 110 : 80);
            return (
              <React.Fragment key={s.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={GREEN} strokeWidth={at(7) ? 6 : 4} opacity={o} />
                {pulse >= 0 && <circle cx={lerp(pulse, x1, x2)} cy={lerp(pulse, y1, y2)} r={10} fill={theme.accent} opacity={o} />}
              </React.Fragment>
            );
          })}
        </svg>

        {/* Stage 0: the apps. */}
        {APPS.map((a, k) => (
          <At key={a.name} x={a.x} y={APP_Y} opacity={fade(frame - k * 10) * (1 - 0.6 * team)}>
            <div style={{padding: '8px 22px', borderRadius: 18, background: '#1D2C47', border: `3px solid ${theme.accent}`, textAlign: 'center'}}>
              <div style={{fontSize: 34, color: theme.accent, fontWeight: 700}}>📦 应用 {a.name}</div>
              {a.note && <div style={{fontSize: 24, color: theme.muted}}>{a.note}</div>}
            </div>
          </At>
        ))}

        {/* Stage 1: master A. */}
        <At x={A.x} y={A.y} opacity={show(1)}>
          <div style={{position: 'relative', padding: '16px 26px', borderRadius: 22, background: theme.panel, border: `4px solid ${BLUE}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            boxShadow: at(7) ? `0 0 ${30 + 14 * Math.sin(frame / 6)}px ${BLUE}` : 'none'}}>
            <FidAvatar fid={A.fid} size={110} />
            <div style={{fontSize: 34, color: BLUE, fontWeight: 700}}>主人 A</div>
            <div style={{fontSize: 24, color: theme.muted}}>密库 · 断网设备</div>
          </div>
        </At>
        {[0, 1, 2].map((k) => (
          <At key={k} x={lerp(paper, A.x, [180, 330, 900][k])} y={lerp(paper, A.y, [330, 520, 400][k])} opacity={show(1, 50) * (1 - show(2))}>
            <div style={{fontSize: 50}}>📄</div>
          </At>
        ))}
        {/* Stage 7: the shield. */}
        <At x={A.x + 170} y={A.y - 60} opacity={show(7, 10)}><div style={{fontSize: 80}}>🛡️</div></At>

        {/* The servants. */}
        {SERVANTS.map((s) => (
          <At key={s.id} x={s.x} y={s.y} opacity={appear(s)}>
            <div style={{padding: '10px 12px', borderRadius: 18, background: theme.panel, border: `3px solid ${GREEN}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 140}}>
              <div style={{position: 'relative'}}>
                <FidAvatar fid={s.fid} size={76} />
                {s.ai && <div style={{position: 'absolute', right: -14, bottom: -6, fontSize: 36, opacity: show(5, 30)}}>🤖</div>}
              </div>
              <div style={{fontSize: 28, color: GREEN, fontWeight: 700}}>身份 {s.id}</div>
              <div style={{fontSize: 24, color: theme.text}}>{s.device} {s.job}</div>
            </div>
          </At>
        ))}

        {/* Stage 5. */}
        <Caption top={1440} opacity={show(5, 10) * (1 - team)} color={theme.accent}>八个身份 · 有的交给 AI</Caption>

        {/* Stage 6: a team from outside, one person behind it. */}
        <div style={{position: 'absolute', left: 60, top: ROW1 - 120, width: 980, height: ROW2 - ROW1 + 240, borderRadius: 30,
          border: `4px dashed ${theme.accent}`, opacity: team * (1 - show(7))}} />
        <Caption top={1440} opacity={team * (1 - show(7))} color={theme.accent}>外面看：一个团队</Caption>
        <At x={A.x - 290} y={A.y} opacity={one * (1 - show(7))}>
          <div style={{textAlign: 'center'}}><div style={{fontSize: 90}}>🧑‍💻</div><div style={{fontSize: 30, color: theme.text}}>背后：一个人</div></div>
        </At>

        {/* Stage 7. */}
        <Caption top={1440} opacity={show(7, 30)} color={BLUE}>只需守住 A，其他身份都由 A 全权控制</Caption>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
