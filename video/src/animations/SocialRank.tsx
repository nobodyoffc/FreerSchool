import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U2-10 S2: what social standing is made of. One picture per narration line above, and below
// an identity card whose rows fill in as they are named:
//   0 money: the old measure of standing
//   1 a balance moves to another identity in a moment, so it can be faked
//   2 coin days: money × time, can't be faked, the basic unit of credit
//   3 face value × days held: a 1 F bill held one day is 1 cd
//   4 spending a bill burns its coin days to ash: coin days destroyed, both in cd
//   5 from block height 4,000,000 (about Aug 2027) actions on the chain destroy coin days
//   6 total coin days: what you can still do
//   7 total coin days destroyed: what you have done
//   8 ratings weighed by coin days destroyed: one 100 cd like outweighs a hundred 1 cd dislikes
//   9 reputation is the net, heat the sum of absolute values
//  10 weight (the app's weight icon, not a balance): 40% coin days, 10% destroyed, 50% reputation
//  11 every Freer ranked by weight
//  12 but anyone may measure standing their own way
// The faces are made-up FIDs, never shown as text. Laid out for portrait.
const FACES = [
  'FAx7Kp2mQvR9sTn3WbYc4dEf5gHi6jKkL8', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1',
  'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FDn2Rb6Tc9Yd3Ue7Vf4Wg8Xh5Yi2Zj6Ak9',
  'FEp5Sd8Uf2Vg6Wh9Xi3Yj7Zk4Am8Bm2Cn5', 'FFq8Ue3Wg7Xh2Yi6Zj9Ak4Bm7Cn3Dp8Eq2',
];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const ASH = '#B9B2A6'; // coin days destroyed: burnt to ash
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

const TOP = 70; // the picture area: TOP..TOP+PIC_H
const PIC_H = 840;
const CARD_Y = 960; // the identity card

// `burnt` 0..1: the bill chars from the bottom up and is gone.
const Bill: React.FC<{x: number; y: number; amount: string; opacity?: number; burnt?: number}> = ({x, y, amount, opacity = 1, burnt = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 220, height: 116, opacity: opacity * (1 - burnt), borderRadius: 14,
    background: 'linear-gradient(135deg, #2F6B4F, #3E8A64)', border: `3px solid ${GREEN}`, filter: `grayscale(${burnt}) brightness(${1 - 0.6 * burnt})`,
    clipPath: `inset(0 0 ${burnt * 100}% 0)`, transform: `translateY(${burnt * 20}px)`,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF'}}>
    <div style={{fontSize: 24, opacity: 0.85}}>钞票</div>
    <div style={{fontSize: 40, fontWeight: 700}}>{amount}</div>
  </div>
);

// A small heap of ash: lumpy, with a few flakes above and dying embers.
const Ash: React.FC<{size: number; embers?: number; style?: React.CSSProperties}> = ({size, embers = 1, style}) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 200 120" style={style}>
    <path d="M6,116 L20,104 Q30,92 42,95 Q50,80 64,84 Q74,66 90,72 Q100,58 114,68 Q128,62 136,78 Q150,76 156,90 Q170,90 176,102 L194,116 Z" fill="#5E5A54" />
    <path d="M34,116 Q46,100 60,102 Q70,88 86,92 Q98,80 112,90 Q126,86 134,100 Q148,100 160,116 Z" fill="#7E7970" />
    <path d="M70,116 Q80,104 94,106 Q104,96 116,104 Q128,104 134,116 Z" fill="#A39D91" />
    {[[52, 52, 6, 4], [96, 34, 5, 3], [142, 46, 6, 4], [118, 18, 4, 3], [76, 24, 4, 2]].map(([x, y, w, h], k) => (
      <rect key={k} x={x} y={y} width={w} height={h} rx={1} fill="#8F8A80" opacity={0.7} transform={`rotate(${k * 37} ${x} ${y})`} />
    ))}
    {[[66, 100], [118, 94], [98, 110], [146, 106]].map(([cx, cy], k) => (
      <circle key={k} cx={cx} cy={cy} r={3.5} fill="#F28C38" opacity={embers * (k % 2 ? 0.6 : 1)} />
    ))}
  </svg>
);

// A coin-day chip; burnt ones are ash grey.
const Chip: React.FC<{text: string; burnt?: boolean; style?: React.CSSProperties}> = ({text, burnt, style}) => (
  <div style={{padding: '8px 22px', borderRadius: 40, fontSize: 38, fontWeight: 700, whiteSpace: 'nowrap',
    background: burnt ? '#2E2B27' : '#3A2E14', color: burnt ? ASH : theme.accent, border: `3px solid ${burnt ? ASH : theme.accent}`, ...style}}>
    {text}
  </div>
);

// The weight icon from the app's identity card (Freer res/drawable/ic_weight.xml).
const WEIGHT_PATH = 'M240,760h480l-57,-400L297,360l-57,400ZM480,280q17,0 28.5,-11.5T520,240q0,-17 -11.5,-28.5T480,200q-17,0 -28.5,11.5T440,240q0,17 11.5,28.5T480,280ZM593,280h70q30,0 52,20t27,49l57,400q5,36 -18.5,63.5T720,840L240,840q-37,0 -60.5,-27.5T161,749l57,-400q5,-29 27,-49t52,-20h70q-3,-10 -5,-19.5t-2,-20.5q0,-50 35,-85t85,-35q50,0 85,35t35,85q0,11 -2,20.5t-5,19.5ZM240,760h480,-480Z';
const WeightIcon: React.FC<{size: number; color?: string}> = ({size, color = BLUE}) => (
  <svg width={size} height={size} viewBox="0 0 960 960" style={{display: 'inline-block', verticalAlign: 'middle'}}><path d={WEIGHT_PATH} fill={color} /></svg>
);

const Caption: React.FC<{y: number; text: string; color?: string; opacity?: number; size?: number}> = ({y, text, color = theme.text, opacity = 1, size = 44}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontSize: size, color, opacity, fontWeight: 600}}>{text}</div>
);

const MiniCard: React.FC<{x: number; y: number; fid: string; w?: number; children?: React.ReactNode; opacity?: number; border?: string}> =
  ({x, y, fid, w = 380, children, opacity = 1, border = '#2A3854'}) => (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: 150, borderRadius: 20, background: theme.panel, border: `3px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: 20, padding: '0 22px', boxSizing: 'border-box', opacity}}>
      <FidAvatar fid={fid} size={100} />
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 6}}>{children}</div>
    </div>
  );

export const SocialRank: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  // The picture for line i shows only during that line.
  const pic = (i: number) => (stage === i ? fade(since(i)) : 0);
  const after = (i: number, delay: number, len = 12) => (stage === i ? fade(since(i) - delay, len) : 0);

  // The card's rows: when each appears, and which lines light it up.
  const rows: {label: string; value: string; from: number; lit: number[]; color: string; note?: [number, string]}[] = [
    {label: '余额', value: '100 F', from: 0, lit: [0, 1], color: GREEN},
    {label: '币天', value: '3650 cd', from: 2, lit: [2, 3, 6], color: theme.accent, note: [6, '潜在能力']},
    {label: '币天销毁', value: '1200 cd', from: 4, lit: [4, 5, 7], color: ASH, note: [7, '曾经的影响力']},
    {label: '声誉', value: '90 cd', from: 9, lit: [8, 9], color: GREEN},
    {label: '热度', value: '150 cd', from: 9, lit: [9], color: RED},
    {label: '重量', value: '1625', from: 10, lit: [10, 11], color: BLUE},
  ];

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: TOP, height: PIC_H}}>
        {/* 0 money as standing */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(0)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', gap: 30}}>
            {[0, 1, 2].map((k) => <span key={k} style={{fontSize: 150, opacity: after(0, 10 + k * 10)}}>💰</span>)}
          </div>
          <Caption y={380} text="传统社会：钱 = 社会地位" opacity={after(0, 40)} />
          <Caption y={470} text="最重要的可量化指标" color={theme.muted} size={38} opacity={after(0, 55)} />
        </div>

        {/* 1 a balance moves in a moment */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(1)}}>
          <MiniCard x={40} y={160} w={440} fid={FACES[0]}>
            <div style={{fontSize: 36, color: GREEN}}>{`${Math.round(100 * (1 - ease(since(1) - 20, 40)))} F`}</div>
          </MiniCard>
          <MiniCard x={600} y={160} w={440} fid={FACES[1]} border={stage === 1 && since(1) > 60 ? RED : '#2A3854'}>
            <div style={{fontSize: 36, color: GREEN}}>{`${Math.round(100 * ease(since(1) - 20, 40))} F`}</div>
          </MiniCard>
          <div style={{position: 'absolute', left: 300 + 380 * ease(since(1) - 20, 40), top: 360, fontSize: 90, opacity: since(1) > 18 && since(1) < 64 ? 1 : 0}}>💸</div>
          <div style={{position: 'absolute', left: 900, top: 100, fontSize: 80, color: RED, fontWeight: 800, opacity: after(1, 65)}}>?</div>
          <Caption y={540} text="余额转到另一个身份，只要一瞬间" opacity={after(1, 30)} />
          <Caption y={630} text="地位可以伪造" color={RED} opacity={after(1, 70)} />
        </div>

        {/* 2 coin days: money × time */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(2)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30}}>
            <span style={{fontSize: 140, opacity: after(2, 0)}}>💰</span>
            <span style={{fontSize: 80, color: theme.muted, opacity: after(2, 15)}}>×</span>
            <span style={{fontSize: 140, opacity: after(2, 25)}}>⏳</span>
            <span style={{fontSize: 80, color: theme.muted, opacity: after(2, 40)}}>=</span>
            <Chip text="币天" style={{fontSize: 64, opacity: after(2, 50)}} />
          </div>
          <Caption y={400} text="钱 × 不可逆的时间" opacity={after(2, 60)} />
          <Caption y={500} text="无法伪造 · 基本信用单位" color={theme.accent} opacity={after(2, 90)} />
        </div>

        {/* 3 face value × days: 1 F for one day is 1 cd */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(3)}}>
          <Caption y={60} text="面额 × 存在天数" />
          <Bill x={140} y={220} amount="1 F" />
          {(() => {
            const day = ease(since(3) - 30, 60);
            return (
              <>
                <div style={{position: 'absolute', left: 420, top: 270, width: 360, height: 10, borderRadius: 5, background: '#2A3854'}} />
                <div style={{position: 'absolute', left: 420, top: 270, width: 360 * day, height: 10, borderRadius: 5, background: theme.accent}} />
                <div style={{position: 'absolute', left: 400, top: 300, fontSize: 30, color: theme.muted}}>收到</div>
                <div style={{position: 'absolute', left: 740, top: 300, fontSize: 30, color: day >= 1 ? theme.text : theme.muted}}>1 天</div>
                <span style={{position: 'absolute', left: 560, top: 170, fontSize: 70}}>⏳</span>
                <Chip text="1 cd" style={{position: 'absolute', left: 830, top: 236, opacity: day >= 1 ? fade(since(3) - 90) : 0}} />
              </>
            );
          })()}
          <Caption y={470} text="1 F 放满 1 天 = 1 个币天" color={theme.accent} opacity={after(3, 100)} />
        </div>

        {/* 4 spent: coin days destroyed */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(4)}}>
          <Bill x={140} y={180} amount="3 F" burnt={ease(since(4) - 25, 30)} />
          {[0, 1, 2].map((k) => (
            <span key={k} style={{position: 'absolute', left: 120 + k * 70, top: 150 - 30 * ease(since(4) - 15, 40), fontSize: 100,
              opacity: stage === 4 ? interpolate(since(4), [15 + k * 4, 25 + k * 4, 52, 68], [0, 1, 1, 0], clamp) : 0}}>🔥</span>
          ))}
          <Ash size={260} embers={1 - ease(since(4) - 60, 60)} style={{position: 'absolute', left: 120, top: 150, opacity: after(4, 45)}} />
          <Chip text="12 cd" burnt={since(4) > 45} style={{position: 'absolute', left: 430, top: 214}} />
          <span style={{position: 'absolute', left: 660, top: 216, fontSize: 60, color: ASH, opacity: after(4, 50)}}>→ 灰烬</span>
          <Caption y={420} text="币天随钞票作废：币天销毁" color={ASH} opacity={after(4, 40)} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center', gap: 40, opacity: after(4, 80)}}>
            <Chip text="币天 · cd" />
            <Chip text="币天销毁 · cd" burnt />
          </div>
        </div>

        {/* 5 from height 4,000,000, actions destroy coin days */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(5)}}>
          <Caption y={50} text={`区块高度 ${Math.round(3_900_000 + 100_000 * ease(since(5), 50)).toLocaleString('en-US')}`} size={52} color={theme.accent} />
          <Caption y={130} text="约 2027 年 8 月起" color={theme.muted} size={36} opacity={after(5, 40)} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 240, display: 'flex', justifyContent: 'center', gap: 60}}>
            {['💬', '📜', '👍'].map((icon, k) => (
              <div key={icon} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: after(5, 60 + k * 15)}}>
                <span style={{fontSize: 110}}>{icon}</span>
                <Chip text="−cd" burnt />
              </div>
            ))}
          </div>
          <Caption y={560} text="重要的链上行为：销毁币天，证明可信" opacity={after(5, 110)} />
        </div>

        {/* 6 total coin days: potential */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(6)}}>
          <div style={{position: 'absolute', left: 390, top: 120, width: 300, height: 140, borderRadius: 18, border: `6px solid ${theme.accent}`}}>
            <div style={{position: 'absolute', left: 8, top: 8, bottom: 8, width: 276 * ease(since(6) - 10, 50), borderRadius: 10, background: theme.accent}} />
            <div style={{position: 'absolute', right: -26, top: 44, width: 18, height: 40, borderRadius: 4, background: theme.accent}} />
          </div>
          <Caption y={330} text="当前积累的总币天" opacity={after(6, 20)} />
          <Caption y={420} text="链上行动的潜在能力" color={theme.accent} opacity={after(6, 45)} />
        </div>

        {/* 7 total destroyed: influence exerted */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(7)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', justifyContent: 'center', gap: 10}}>
            {[0, 1, 2, 3].map((k) => <Ash key={k} size={190} embers={0.4} style={{opacity: after(7, 10 + k * 10)}} />)}
          </div>
          <Caption y={330} text="以往销毁过的总币天" opacity={after(7, 30)} />
          <Caption y={420} text="曾经实施的影响力" color={ASH} opacity={after(7, 55)} />
        </div>

        {/* 8 one 100 cd like against a hundred 1 cd dislikes */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(8)}}>
          <div style={{position: 'absolute', left: 140, top: 120, width: 800, height: 8, background: theme.muted, borderRadius: 4}} />
          <div style={{position: 'absolute', left: 528, top: 128, width: 0, height: 0, borderLeft: '24px solid transparent', borderRight: '24px solid transparent', borderBottom: `60px solid ${theme.muted}`}} />
          <div style={{position: 'absolute', left: 120, top: 150, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: after(8, 10)}}>
            <span style={{fontSize: 120}}>👍</span>
            <Chip text="100 cd" burnt />
            <div style={{fontSize: 34, color: GREEN}}>好评 +100</div>
          </div>
          <div style={{position: 'absolute', left: 660, top: 160, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: after(8, 40)}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(10, 26px)', gap: 2}}>
              {Array.from({length: 100}, (_, k) => <span key={k} style={{fontSize: 20, lineHeight: '24px', opacity: after(8, 40 + k * 0.6, 4)}}>👎</span>)}
            </div>
            <Chip text="1 cd × 100" burnt />
            <div style={{fontSize: 34, color: RED}}>差评 −100</div>
          </div>
          <Caption y={600} text="分量看销毁的币天" color={theme.accent} opacity={after(8, 110)} />
        </div>

        {/* 9 reputation is the net, heat the sum */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(9)}}>
          {[['👍', '+100', GREEN], ['👎', '−30', RED], ['👍', '+20', GREEN]].map(([icon, v, c], k) => (
            <div key={k} style={{position: 'absolute', left: 300, top: 40 + k * 110, display: 'flex', alignItems: 'center', gap: 30, opacity: after(9, k * 12)}}>
              <span style={{fontSize: 80}}>{icon}</span>
              <span style={{fontSize: 56, color: c, fontWeight: 700}}>{v} cd</span>
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center', gap: 50}}>
            <div style={{textAlign: 'center', opacity: after(9, 50)}}>
              <div style={{fontSize: 40, color: theme.muted}}>声誉 = 净值</div>
              <div style={{fontSize: 64, color: GREEN, fontWeight: 700}}>+90</div>
            </div>
            <div style={{textAlign: 'center', opacity: after(9, 90)}}>
              <div style={{fontSize: 40, color: theme.muted}}>热度 = 绝对值之和</div>
              <div style={{fontSize: 64, color: RED, fontWeight: 700}}>150</div>
            </div>
          </div>
        </div>

        {/* 10 weight */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(10)}}>
          {[['总币天', 40, theme.accent], ['总币天销毁', 10, ASH], ['声誉', 50, GREEN]].map(([name, pct, c], k) => (
            <div key={k} style={{position: 'absolute', left: 120, top: 40 + k * 120, display: 'flex', alignItems: 'center', gap: 24, opacity: after(10, 30 + k * 25)}}>
              <div style={{width: 230, fontSize: 40, color: theme.text, textAlign: 'right'}}>{name}</div>
              <div style={{width: 10 * (pct as number) * ease(since(10) - 30 - k * 25, 30), height: 60, borderRadius: 10, background: c as string}} />
              <div style={{fontSize: 44, color: c as string, fontWeight: 700}}>{pct}%</div>
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, opacity: after(10, 130)}}>
            <WeightIcon size={150} />
            <span style={{fontSize: 80, color: BLUE, fontWeight: 800}}>重量</span>
          </div>
        </div>

        {/* 11 ranked by weight */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(11)}}>
          {[0, 1, 2, 3].map((k) => {
            const w = [9820, 4210, 1625, 380][k];
            return (
              <div key={k} style={{position: 'absolute', left: 180, top: 20 + k * 150 + (1 - ease(since(11) - 10 - k * 8, 20)) * 40, width: 720, height: 130,
                borderRadius: 18, background: theme.panel, border: `3px solid ${k === 2 ? BLUE : '#2A3854'}`, display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', boxSizing: 'border-box',
                opacity: after(11, 10 + k * 8)}}>
                <span style={{fontSize: 44, color: theme.muted, width: 40}}>{k + 1}</span>
                <FidAvatar fid={FACES[k + 2]} size={90} />
                <span style={{flex: 1}} />
                <WeightIcon size={52} />
                <span style={{fontSize: 48, color: BLUE, fontWeight: 700}}>{w}</span>
              </div>
            );
          })}
          <Caption y={640} text="所有飞人，按重量严格排序" opacity={after(11, 60)} />
        </div>

        {/* 12 other measures */}
        <div style={{position: 'absolute', inset: 0, opacity: pic(12)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 60, display: 'flex', justifyContent: 'center', gap: 26, flexWrap: 'wrap', padding: '0 80px'}}>
            {['重量', '👍 声誉', '🛡 团队', '📦 应用', '🔧 服务', '✍️ 作品'].map((t, k) => (
              <div key={t} style={{fontSize: 44, padding: '14px 28px', borderRadius: 20, background: theme.panel, display: 'flex', alignItems: 'center', gap: 10,
                border: `3px solid ${k === 0 ? BLUE : '#2A3854'}`, color: theme.text, opacity: after(12, k * 12)}}>{k === 0 && <WeightIcon size={46} />}{t}</div>
            ))}
          </div>
          <span style={{position: 'absolute', left: 470, top: 330, fontSize: 120, opacity: after(12, 70)}}>📏</span>
          <Caption y={510} text="从不同维度，构建自己的评价体系" opacity={after(12, 85)} />
        </div>
      </div>

      {/* The identity card, filling in row by row. */}
      <div style={{position: 'absolute', left: 60, right: 60, top: CARD_Y, height: 560, borderRadius: 26, background: theme.panel, border: '3px solid #2A3854', opacity: fade(frame)}}>
        <div style={{position: 'absolute', left: 34, top: 28, display: 'flex', alignItems: 'center', gap: 22}}>
          <FidAvatar fid={FACES[4]} size={96} />
          <span style={{fontSize: 44, color: theme.text, fontWeight: 600}}>社会地位</span>
        </div>
        {rows.map((r, k) => {
          const shown = at(r.from) ? fade(since(r.from) - (k === 4 ? 90 : k === 3 ? 50 : 0)) : 0;
          const lit = r.lit.includes(stage);
          const col = k % 2, row = Math.floor(k / 2);
          return (
            <div key={r.label} style={{position: 'absolute', left: 34 + col * 462, top: 160 + row * 128, width: 430, height: 108, borderRadius: 18,
              background: lit ? '#1F3150' : '#121E33', border: `3px solid ${lit ? r.color : '#2A3854'}`, opacity: Math.max(shown, 0.18),
              display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', boxSizing: 'border-box'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                <span style={{fontSize: 34, color: theme.muted, display: 'flex', alignItems: 'center', gap: 6}}>{r.label === '重量' && <WeightIcon size={34} color={theme.muted} />}{r.label}</span>
                <span style={{fontSize: 42, color: shown > 0 ? r.color : theme.muted, fontWeight: 700}}>{shown > 0 ? r.value : '—'}</span>
              </div>
              {r.note && stage === r.note[0] && <div style={{fontSize: 28, color: r.color, opacity: fade(since(r.note[0]) - 30)}}>{r.note[1]}</div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
