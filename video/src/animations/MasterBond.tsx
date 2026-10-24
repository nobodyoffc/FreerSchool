import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-05 S5: what a master means. One stage per narration line:
//   0 the declaration is public on the chain: everyone sees it, the servant cannot deny it
//   1 the servant's key is stolen; the master stands in front of the servant
//   2 a service ignores the servant's signature and moves the service to a new identity
//   3 the guide is like the mother, the master like the father who declared himself
//   4 the master is the more important relation
//   5 the declaration goes one way: the master never signed it and is not bound by it
// Servant and master are the demo identities the recordings show; the guide is made up, marked 示意.
const SERVANT = {fid: 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4', name: 'Tom_9yw4'};
const MASTER = {fid: 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8', name: 'cy_qqN8'};
const GUIDE = 'FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8';
const NEW_ID = 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1';
const WATCHERS = ['FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FDk2Lm7Nq4Rs9Tu3Vw8Xy5Za1Bc6De2Fg4', 'FEh5Ij8Kl3Mn7Op2Qr6St9Uv4Wx1Yz5Ab8',
  'FFg3Hi6Jk9Lm2No5Pq8Rs1Tu4Vw7Xy3Za6', 'FGf8Gh1Ij4Kl7Mn3Op6Qr9St2Uv5Wx8Yz2', 'FHe4Fg7Hi2Jk5Lm8No1Pq4Rs7Tu3Vw6Xy9'];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const PINK = '#F08DB4';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const At: React.FC<{x: number; y: number; opacity: number; scale?: number; children: React.ReactNode}> = ({x, y, opacity, scale = 1, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, whiteSpace: 'nowrap'}}>{children}</div>
);

const Card: React.FC<{fid: string; name?: string; role: string; color: string; size?: number}> = ({fid, name, role, color, size = 120}) => (
  <div style={{padding: '18px 26px', borderRadius: 22, background: theme.panel, border: `3px solid ${color}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
    <FidAvatar fid={fid} size={size} />
    {name && <div style={{fontSize: 30, color: theme.text}}>{name}</div>}
    <div style={{fontSize: 34, color, fontWeight: 700}}>{role}</div>
  </div>
);

const Caption: React.FC<{top: number; opacity: number; color?: string; children: React.ReactNode}> = ({top, opacity, color = theme.text, children}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontSize: 42, color, fontWeight: 600, opacity}}>{children}</div>
);

export const MasterBond: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const only = (i: number) => stage === i;
  const show = (i: number, delay = 0, len = 12) => (stage >= i ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (stage >= i ? ease(since(i) - delay, len) : 0);

  // Stage 1: the thief takes the key; the master steps in front.
  const steal = go(1, 20, 30);
  const guard = go(1, 70, 30);
  // Stage 2: the request is refused, the service moves to the new identity.
  const moved = go(2, 90, 35);
  // Stage 4: the master grows.
  const grow = only(4) ? 1 + 0.25 * go(4, 10, 30) : 1;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          主人的意义
        </div>

        {/* Stage 0: the declaration on the chain, watched from all round. */}
        {only(0) && (
          <>
            <At x={540} y={820} opacity={fade(frame)}>
              <div style={{padding: '30px 40px', borderRadius: 22, background: '#121E33', border: `4px solid ${theme.accent}`,
                boxShadow: `0 0 40px rgba(242,180,65,${0.5 * fade(frame - 10, 20)})`, textAlign: 'center'}}>
                <div style={{fontSize: 26, color: theme.muted, marginBottom: 12}}>区块 · 主人声明</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
                  <FidAvatar fid={SERVANT.fid} size={90} />
                  <span style={{fontSize: 56, color: theme.accent}}>→</span>
                  <FidAvatar fid={MASTER.fid} size={90} />
                </div>
                <div style={{fontSize: 28, color: theme.text, marginTop: 10}}>{SERVANT.name} 的主人是 {MASTER.name}</div>
              </div>
            </At>
            {WATCHERS.map((fid, k) => {
              const a = (k / WATCHERS.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <At key={fid} x={540 + Math.cos(a) * 400} y={820 + Math.sin(a) * 400} opacity={fade(frame - 20 - 5 * k)}>
                  <div style={{textAlign: 'center'}}>
                    <FidAvatar fid={fid} size={80} />
                    <div style={{fontSize: 34}}>👁</div>
                  </div>
                </At>
              );
            })}
            <Caption top={1360} opacity={fade(frame - 60)} color={theme.accent}>公开 · 仆人无法抵赖</Caption>
          </>
        )}

        {/* Stage 1: the key is stolen; the master stands guard. */}
        {only(1) && (
          <>
            <At x={540} y={820} opacity={1}>
              <Card fid={SERVANT.fid} name={SERVANT.name} role="仆人" color={GREEN} />
            </At>
            <At x={lerp(steal, 640, 920)} y={lerp(steal, 640, 520)} opacity={show(1, 10)}>
              <div style={{fontSize: 40, color: RED}}>🔑</div>
            </At>
            <At x={920} y={560} opacity={show(1, 10)}>
              <div style={{fontSize: 90}}>🥷</div>
            </At>
            <Caption top={380} opacity={show(1, 40)} color={RED}>私钥泄露</Caption>
            <At x={lerp(guard, 160, 540)} y={1180} opacity={show(1, 60)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <span style={{fontSize: 70}}>🛡</span>
                <Card fid={MASTER.fid} name={MASTER.name} role="主人" color={BLUE} size={100} />
              </div>
            </At>
            <Caption top={1440} opacity={show(1, 110)}>主人保护仆人的链下权益</Caption>
          </>
        )}

        {/* Stage 2: the service ignores the servant's signature. */}
        {only(2) && (
          <>
            <At x={540} y={420} opacity={show(2)}>
              <div style={{padding: '22px 34px', borderRadius: 20, background: theme.panel, border: `3px solid ${theme.muted}`, fontSize: 40, color: theme.text}}>
                🏪 服务商
              </div>
            </At>
            <At x={540} y={640} opacity={show(2, 20)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <FidAvatar fid={MASTER.fid} size={80} />
                <div style={{fontSize: 34, color: BLUE}}>主人：请无视仆人的签名</div>
              </div>
            </At>
            <At x={300} y={950} opacity={show(2, 40)}>
              <div style={{textAlign: 'center'}}>
                <FidAvatar fid={SERVANT.fid} size={110} />
                <div style={{fontSize: 30, color: theme.muted}}>仆人签名</div>
                <div style={{fontSize: 60, color: RED, opacity: show(2, 60)}}>✗</div>
              </div>
            </At>
            <At x={780} y={950} opacity={show(2, 80)}>
              <div style={{textAlign: 'center'}}>
                <FidAvatar fid={NEW_ID} size={110} />
                <div style={{fontSize: 30, color: GREEN}}>新身份</div>
              </div>
            </At>
            <At x={lerp(moved, 300, 780)} y={1160} opacity={show(2, 90)}>
              <div style={{padding: '10px 20px', borderRadius: 14, background: '#1D2C47', border: `3px solid ${GREEN}`, fontSize: 32, color: theme.text}}>
                📄 已购买的服务
              </div>
            </At>
          </>
        )}

        {/* Stages 3–4: mother and father. */}
        {(only(3) || only(4)) && (
          <>
            <At x={540} y={1250} opacity={1}>
              <Card fid={SERVANT.fid} name={SERVANT.name} role="仆人" color={GREEN} size={100} />
            </At>
            <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
              <line x1={270} y1={760} x2={500} y2={1120} stroke={PINK} strokeWidth={5} opacity={show(3, 10)} />
              <line x1={810} y1={760} x2={580} y2={1120} stroke={BLUE} strokeWidth={only(4) ? 9 : 5} opacity={show(3, 40)} />
            </svg>
            <At x={270} y={600} opacity={show(3) * (only(4) ? 0.55 : 1)} scale={only(4) ? 0.85 : 1}>
              <Card fid={GUIDE} role="引路人" color={PINK} />
            </At>
            <At x={270} y={430} opacity={show(3, 15) * (only(4) ? 0.55 : 1)}>
              <div style={{fontSize: 40, color: PINK}}>母亲：带来生命</div>
            </At>
            <At x={810} y={600} opacity={show(3, 35)} scale={grow}>
              <Card fid={MASTER.fid} name={MASTER.name} role="主人" color={BLUE} />
            </At>
            <At x={810} y={430} opacity={show(3, 50)}>
              <div style={{fontSize: 40, color: BLUE}}>父亲：亲自声明</div>
            </At>
            <Caption top={1520} opacity={show(4, 30)} color={theme.accent}>比引路人更重要的社会关系</Caption>
          </>
        )}

        {/* Stage 5: one way only. */}
        {only(5) && (
          <>
            <At x={270} y={760} opacity={show(5)}>
              <Card fid={SERVANT.fid} name={SERVANT.name} role="仆人" color={GREEN} />
            </At>
            <At x={810} y={760} opacity={show(5)}>
              <Card fid={MASTER.fid} name={MASTER.name} role="主人" color={BLUE} />
            </At>
            <At x={540} y={720} opacity={show(5, 15)}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 28, color: theme.muted}}>仆人签名的声明</div>
                <div style={{fontSize: 70, color: theme.accent, lineHeight: '70px'}}>→</div>
              </div>
            </At>
            <At x={810} y={1010} opacity={show(5, 60)}>
              <div style={{fontSize: 34, color: theme.muted}}>✍️̸ 主人未签名</div>
            </At>
            <Caption top={1200} opacity={show(5, 100)} color={RED}>声明对主人没有约束力</Caption>
          </>
        )}

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
