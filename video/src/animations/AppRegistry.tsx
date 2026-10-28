import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U2-14 S2: apps and services are directories registered on the chain. One picture per
// narration line above, and below a registration card whose rows fill in as they are named:
//   0 an app store with a gatekeeper, beside a chain anyone carves entries onto
//   1 a service: a server others run (BASE, DOCK, DISK), metered
//   2 an app: software on your device, wired to services
//   3 owner, name, type; the ID is the publishing transaction: AID for apps, SID for services
//   4 a service's dealer handles the money, waiters answer customers; else ask the owner
//   5 ratings weighted by coin days destroyed: one 100 cd 5-star beats three 1 cd 0-stars
//   6 the owner is a Freer too: its weight and reputation are public
// The faces are made-up FIDs, never shown as text. Laid out for portrait.
const OWNER = 'FKq3Wn8Rt5Yb2Xc7Vd4Ze9Af6Bg3Ch8Dj2';
const DEALER = 'FLs6Tp9Uq2Vr5Ws8Xt3Yu7Zv4Aw9Bx6Cy1';
const WAITER = 'FMu8Vr3Wt6Xu9Yv2Zw5Ax8By3Cz6Da9Eb4';
const RATERS = ['FNw2Xs5Yt8Zu3Av6Bw9Cx2Dy5Ez8Fa3Gb7', 'FPy4Zt7Au2Bv5Cw8Dx3Ey6Fz9Ga4Hb7Jc2',
  'FQa6Bu9Cv4Dw7Ex2Fy5Gz8Ha3Jb6Kc9Ld4', 'FRc8Dw3Ex6Fy9Gz4Ha7Jb2Kc5Ld8Me3Nf6'];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const ASH = '#B9B2A6';
const RED = '#E5686A';
const STAR = '#F2C14E';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

const TOP = 70;
const PIC_H = 840;
const CARD_Y = 960;

const Caption: React.FC<{y: number; text: string; color?: string; opacity?: number; size?: number}> = ({y, text, color = theme.text, opacity = 1, size = 44}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontSize: size, color, opacity, fontWeight: 600}}>{text}</div>
);

const Tag: React.FC<{text: string; color?: string; style?: React.CSSProperties}> = ({text, color = BLUE, style}) => (
  <div style={{padding: '8px 22px', borderRadius: 40, fontSize: 36, fontWeight: 700, whiteSpace: 'nowrap', color,
    border: `3px solid ${color}`, background: '#121E33', ...style}}>{text}</div>
);

// A small registration card dropping onto the chain.
const Entry: React.FC<{x: number; y: number; icon: string; opacity?: number}> = ({x, y, icon, opacity = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 120, height: 90, borderRadius: 14, background: theme.panel,
    border: `3px solid ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, opacity}}>{icon}</div>
);

export const AppRegistry: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const pic = (i: number) => (stage === i ? fade(since(i)) : 0);
  const after = (i: number, delay: number, len = 12) => (stage === i ? fade(since(i) - delay, len) : 0);

  // The card's rows: when each appears, and which lines light it up.
  const rows: {label: string; from: number; lit: number[]; color: string; value: React.ReactNode}[] = [
    {label: '所有者', from: 3, lit: [3, 6], color: BLUE, value: <span style={{display: 'flex', alignItems: 'center', gap: 12}}><FidAvatar fid={OWNER} size={56} />Bob_8Dj2</span>},
    {label: '名称 · 类型', from: 3, lit: [3], color: theme.text, value: 'Fast DISK · DISK'},
    {label: 'ID', from: 3, lit: [3], color: theme.accent, value: 'SID 3f9a…c21e'},
    {label: '掌柜 · 服务员', from: 4, lit: [4], color: GREEN, value: <span style={{display: 'flex', alignItems: 'center', gap: 10}}><FidAvatar fid={DEALER} size={56} /><FidAvatar fid={WAITER} size={56} /></span>},
    {label: '总评分', from: 5, lit: [5], color: STAR, value: '★ 4.9'},
    {label: '总币天销毁', from: 5, lit: [5], color: ASH, value: '103 cd'},
  ];

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: TOP, height: PIC_H}}>
        {/* 0 a store with a gatekeeper, and a chain without one */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(0)}}>
          <div style={{position: 'absolute', left: 60, top: 80, width: 420, height: 380, borderRadius: 24, border: `4px solid ${theme.muted}`, background: theme.panel}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 24, textAlign: 'center', fontSize: 44, color: theme.text, fontWeight: 600}}>应用商店</div>
            <span style={{position: 'absolute', left: 150, top: 120, fontSize: 120}}>💂</span>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{position: 'absolute', left: 30 + k * 130, top: 290, fontSize: 60, opacity: after(0, 15 + k * 8)}}>📦<span style={{fontSize: 44, color: RED}}>✕</span></span>
            ))}
          </div>
          <div style={{position: 'absolute', left: 600, top: 80, width: 420, height: 380}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 24, textAlign: 'center', fontSize: 44, color: theme.text, fontWeight: 600}}>链上</div>
            <div style={{position: 'absolute', left: 30, right: 30, top: 300, height: 12, borderRadius: 6, background: '#2A3854'}} />
            {[0, 1, 2].map((k) => (
              <Entry key={k} x={20 + k * 135} y={100 + 100 * ease(since(0) - 20 - k * 15, 20)} icon={['📦', '🖥️', '📦'][k]} opacity={after(0, 20 + k * 15)} />
            ))}
          </div>
          <Caption y={560} text="谁都能发布 · 没有谁审批上架" color={theme.accent} opacity={after(0, 70)} />
        </div>

        {/* 1 a service: a server someone runs, metered */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(1)}}>
          <span style={{position: 'absolute', left: 200, top: 90, fontSize: 200}}>🖥️</span>
          <div style={{position: 'absolute', left: 520, top: 110, display: 'flex', flexDirection: 'column', gap: 24}}>
            {['BASE 链上数据', 'DOCK 消息', 'DISK 文件'].map((t, k) => <Tag key={t} text={t} style={{opacity: after(1, 15 + k * 20)}} />)}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: after(1, 85)}}>
            <span style={{fontSize: 80}}>🧾</span>
            <span style={{fontSize: 52, color: GREEN, fontWeight: 700}}>{`${(0.0001 * Math.floor(ease(since(1) - 85, 60) * 37)).toFixed(4)} F`}</span>
          </div>
          <Caption y={590} text="服务：别人运行的服务器，按用量收费" opacity={after(1, 30)} />
        </div>

        {/* 2 an app on your device, wired to services */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(2)}}>
          <span style={{position: 'absolute', left: 120, top: 150, fontSize: 220}}>📱</span>
          {['BASE', 'DOCK', 'DISK'].map((t, k) => {
            const y = 110 + k * 150;
            const grow = ease(since(2) - 20 - k * 12, 20);
            return (
              <React.Fragment key={t}>
                <div style={{position: 'absolute', left: 380, top: 270 + (y - 230) * 0.5, width: 300 * grow, height: 6, background: BLUE, opacity: 0.7,
                  transformOrigin: 'left center', transform: `rotate(${(k - 1) * 18}deg)`}} />
                <div style={{position: 'absolute', left: 700, top: y, display: 'flex', alignItems: 'center', gap: 16, opacity: after(2, 30 + k * 12)}}>
                  <span style={{fontSize: 70}}>🖥️</span><Tag text={t} />
                </div>
              </React.Fragment>
            );
          })}
          <Caption y={590} text="应用：你设备上的软件，连接服务才能工作" opacity={after(2, 60)} />
        </div>

        {/* 3 the ID is the publishing transaction */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(3)}}>
          <div style={{position: 'absolute', left: 140, top: 110, width: 800, height: 140, borderRadius: 20, background: theme.panel, border: `3px solid ${theme.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24}}>
            <span style={{fontSize: 40, color: theme.muted}}>发布交易</span>
            <span style={{fontSize: 46, color: theme.accent, fontWeight: 700, fontFamily: 'monospace'}}>txid 3f9a…c21e</span>
          </div>
          <span style={{position: 'absolute', left: 515, top: 270, fontSize: 70, color: theme.muted, opacity: after(3, 40)}}>↓</span>
          <div style={{position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', justifyContent: 'center', gap: 60}}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: after(3, 60)}}>
              <span style={{fontSize: 90}}>📦</span><Tag text="应用 ID · AID" color={theme.accent} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: after(3, 90)}}>
              <span style={{fontSize: 90}}>🖥️</span><Tag text="服务 ID · SID" color={theme.accent} />
            </div>
          </div>
        </div>

        {/* 4 dealer and waiters, else the owner */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(4)}}>
          <div style={{position: 'absolute', left: 440, top: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <FidAvatar fid={OWNER} size={140} />
            <span style={{fontSize: 36, color: theme.muted}}>所有者</span>
          </div>
          {[[DEALER, '掌柜', '💰 业务收支', 170, 10], [WAITER, '服务员', '💬 客户消息', 690, 50]].map(([fid, role, job, x, d]) => (
            <div key={role as string} style={{position: 'absolute', left: x as number, top: 300, width: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: after(4, d as number)}}>
              <FidAvatar fid={fid as string} size={120} />
              <span style={{fontSize: 42, color: GREEN, fontWeight: 700}}>{role}</span>
              <span style={{fontSize: 36, color: theme.text}}>{job}</span>
            </div>
          ))}
          <svg width={1080} height={300} style={{position: 'absolute', left: 0, top: 160}}>
            <line x1={480} y1={60} x2={300} y2={140} stroke="#2A3854" strokeWidth={5} strokeDasharray="12 10" opacity={after(4, 10)} />
            <line x1={600} y1={60} x2={820} y2={140} stroke="#2A3854" strokeWidth={5} strokeDasharray="12 10" opacity={after(4, 50)} />
          </svg>
          <Caption y={620} text="都没有？直接联系所有者" color={theme.muted} size={38} opacity={after(4, 120)} />
        </div>

        {/* 5 ratings weighted by coin days destroyed */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(5)}}>
          <div style={{position: 'absolute', left: 90, top: 70, width: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: after(5, 10)}}>
            <FidAvatar fid={RATERS[0]} size={110} />
            <span style={{fontSize: 56, color: STAR}}>★★★★★</span>
            <Tag text="烧掉 100 cd" color={ASH} />
          </div>
          <div style={{position: 'absolute', left: 600, top: 70, width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
            <div style={{display: 'flex', gap: 14}}>
              {RATERS.slice(1).map((f, k) => <span key={f} style={{opacity: after(5, 35 + k * 8)}}><FidAvatar fid={f} size={90} /></span>)}
            </div>
            <span style={{fontSize: 56, color: theme.muted, opacity: after(5, 60)}}>☆ 0 分</span>
            <Tag text="各烧 1 cd" color={ASH} style={{opacity: after(5, 60)}} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center', gap: 60, opacity: after(5, 100)}}>
            <span style={{fontSize: 52, color: STAR, fontWeight: 700}}>总评分 ★ 4.9</span>
            <span style={{fontSize: 52, color: ASH, fontWeight: 700}}>总币天销毁 103 cd</span>
          </div>
          <Caption y={580} text="按评分交易销毁的币天加权" color={theme.accent} opacity={after(5, 120)} />
        </div>

        {/* 6 the owner's own credit */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(6)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 60, display: 'flex', justifyContent: 'center'}}>
            <FidAvatar fid={OWNER} size={220} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 340, display: 'flex', justifyContent: 'center', gap: 40}}>
            <Tag text="重量 9820" color={BLUE} style={{opacity: after(6, 25)}} />
            <Tag text="声誉 +860 cd" color={GREEN} style={{opacity: after(6, 45)}} />
          </div>
          <Caption y={520} text="所有者的链上信用，公开可查" opacity={after(6, 70)} />
        </div>
      </div>

      {/* The registration card, filling in row by row. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: CARD_Y, height: 560, borderRadius: 26, background: theme.panel, border: '3px solid #2A3854', opacity: fade(frame)}}>
        <div style={{position: 'absolute', left: 34, top: 34, fontSize: 44, color: theme.text, fontWeight: 600}}>🖥️ 链上登记</div>
        {rows.map((r, k) => {
          const shown = stage >= r.from ? fade(since(r.from) - (k % 2) * 20) : 0;
          const lit = r.lit.includes(stage);
          const col = k % 2, row = Math.floor(k / 2);
          return (
            <div key={r.label} style={{position: 'absolute', left: 34 + col * 462, top: 130 + row * 136, width: 430, height: 116, borderRadius: 18,
              background: lit ? '#1F3150' : '#121E33', border: `3px solid ${lit ? r.color : '#2A3854'}`, opacity: Math.max(shown, 0.18),
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '0 24px', boxSizing: 'border-box'}}>
              <span style={{fontSize: 30, color: theme.muted}}>{r.label}</span>
              <span style={{fontSize: 38, color: shown > 0 ? r.color : theme.muted, fontWeight: 700}}>{shown > 0 ? r.value : '—'}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
