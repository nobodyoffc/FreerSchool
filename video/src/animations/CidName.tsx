import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-05 S2: what a CID is made of. One stage per narration line:
//   0 Alice + _ + VkUV: name, underscore, suffix
//   1 the name is yours; the suffix is the FID's last four characters
//   2 another Alice whose FID ends the same way: Alice_VkUV is taken, the suffix grows by one
//   3 both are Alice, the two CIDs differ
//   4 the CID can be changed on chain; the old one stays yours, nobody else gets it
//   5 at most four CIDs per FID
// The FIDs are made up to end in VkUV, like the app's example; marked 示意.
// Laid out for portrait (Android episodes).
const FID_A = 'Fq3Lm8RtWc2Zp9XkNd6Hs4Jy7BvEa5VkUV';
const FID_B = 'F7gTb2Kx9QwRn4Pz8Mc3Yh6Ds5Lf98VkUV';
const GREEN = '#5BC98C';
const RED = '#E5686A';
const NAME = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const mono = 'Menlo, monospace';

// A FID with its last `tail` characters lit.
const Fid: React.FC<{fid: string; tail: number; lit: number}> = ({fid, tail, lit}) => (
  <span style={{fontFamily: mono, fontSize: 36, letterSpacing: 1, color: theme.muted}}>
    {fid.slice(0, -tail)}
    <span style={{color: lit > 0 ? theme.accent : theme.muted, fontWeight: lit > 0 ? 700 : 400,
      textShadow: lit > 0 ? `0 0 ${18 * lit}px rgba(242,180,65,${0.7 * lit})` : 'none'}}>
      {fid.slice(-tail)}
    </span>
  </span>
);

const Cid: React.FC<{name: string; suffix: string; size?: number; color?: string; strike?: boolean}> = ({name, suffix, size = 64, color, strike}) => (
  <span style={{fontFamily: mono, fontSize: size, fontWeight: 700, textDecoration: strike ? 'line-through' : undefined}}>
    <span style={{color: color ?? NAME}}>{name}</span>
    <span style={{color: color ?? theme.text}}>_</span>
    <span style={{color: color ?? theme.accent}}>{suffix}</span>
  </span>
);

const Panel: React.FC<{y: number; opacity: number; children: React.ReactNode; border?: string}> = ({y, opacity, children, border}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top: y, opacity, padding: '26px 30px', borderRadius: 18,
    background: theme.panel, border: `3px solid ${border ?? 'transparent'}`}}>
    {children}
  </div>
);

const Tag: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <span style={{fontSize: 34, color: color ?? theme.muted}}>{children}</span>
);

export const CidName: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0) => (at(i) ? fade(since(i) - delay) : 0);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* Stage 0: the parts. Stages 0–3 share the top half; 4–5 replace it. */}
      <div style={{opacity: at(4) ? 1 - fade(since(4), 15) : 1}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 220, textAlign: 'center', opacity: fade(frame)}}>
          <Cid name="Alice" suffix="VkUV" size={120} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 390, display: 'flex', justifyContent: 'center', gap: 70, opacity: show(0, 20)}}>
          <Tag color={NAME}>名字{at(1) ? ' · 自己起的' : ''}</Tag>
          <Tag>下划线</Tag>
          <Tag color={theme.accent}>后缀{at(1) ? ' · 取自 FID' : ''}</Tag>
        </div>

        {/* Stage 1: where the suffix comes from. */}
        <Panel y={540} opacity={show(1)}>
          <Tag>你的 FID</Tag>
          <div style={{marginTop: 10}}><Fid fid={FID_A} tail={4} lit={show(1, 25)} /></div>
          <div style={{marginTop: 10, fontSize: 30, color: theme.accent, opacity: show(1, 40)}}>最后四位 → 后缀 VkUV</div>
        </Panel>

        {/* Stage 2: another Alice, same four last characters. */}
        <Panel y={860} opacity={show(2)}>
          <Tag>另一个人也起名 Alice，他的 FID</Tag>
          <div style={{marginTop: 10}}><Fid fid={FID_B} tail={at(2) && since(2) > 70 ? 5 : 4} lit={show(2, 20)} /></div>
          <div style={{marginTop: 14, display: 'flex', alignItems: 'center', gap: 24}}>
            <span style={{opacity: show(2, 35)}}><Cid name="Alice" suffix="VkUV" size={44} color={RED} strike /></span>
            <Tag color={RED}><span style={{opacity: show(2, 35)}}>已被用过</span></Tag>
            <span style={{fontSize: 40, color: theme.muted, opacity: show(2, 70)}}>→</span>
            <span style={{opacity: show(2, 80)}}><Cid name="Alice" suffix="8VkUV" size={44} /></span>
          </div>
          <div style={{marginTop: 8, fontSize: 30, color: theme.accent, opacity: show(2, 80)}}>后缀多取一位</div>
        </Panel>

        {/* Stage 3: two Alices, two CIDs. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', opacity: show(3)}}>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40}}>
            <Cid name="Alice" suffix="VkUV" size={56} />
            <span style={{fontSize: 64, color: GREEN, fontWeight: 700}}>≠</span>
            <Cid name="Alice" suffix="8VkUV" size={56} />
          </div>
          <div style={{marginTop: 30, fontSize: 44, color: GREEN, opacity: show(3, 25)}}>名字相同，CID 不会重复</div>
        </div>
      </div>

      {/* Stages 4–5: one FID, its CIDs. */}
      {at(4) && (
        <div style={{opacity: fade(since(4) - 10, 15)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 220, textAlign: 'center'}}>
            <Tag>你的 FID</Tag>
            <div style={{marginTop: 10}}><Fid fid={FID_A} tail={4} lit={0} /></div>
          </div>
          {[
            {name: 'Alice', note: '旧的 · 仍归你', lit: false, from: 0},
            {name: 'Ally', note: '当前', lit: true, from: 30},
            {name: '', note: '空', lit: false, from: -1},
            {name: '', note: '空', lit: false, from: -1},
          ].map((slot, i) => {
            const y = 440 + i * 175;
            const opacity = slot.from >= 0 ? fade(since(4) - 20 - slot.from) : show(5, 10 + (i - 2) * 10);
            return (
              <div key={i} style={{position: 'absolute', left: 140, right: 140, top: y, height: 140, opacity,
                borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px',
                background: slot.lit ? '#1E3A2E' : theme.panel,
                border: slot.lit ? `3px solid ${GREEN}` : `3px dashed ${slot.name ? '#3A4A66' : '#2A3854'}`}}>
                {slot.name
                  ? <Cid name={slot.name} suffix="VkUV" size={56} color={slot.lit ? undefined : theme.muted} />
                  : <span style={{fontSize: 40, color: '#4A5A76'}}>—</span>}
                <span style={{fontSize: 30, color: slot.lit ? GREEN : theme.muted}}>
                  {slot.name && !slot.lit ? '🔒 ' : ''}{slot.note}
                </span>
              </div>
            );
          })}
          {/* Somebody else reaches for the old one. */}
          <div style={{position: 'absolute', left: 140, right: 140, top: 1180, opacity: fade(since(4) - 90) * (at(5) ? 1 - fade(since(5), 12) : 1),
            fontSize: 42, color: RED, textAlign: 'center'}}>
            别人想用 <Cid name="Alice" suffix="VkUV" size={42} color={RED} />？不会释放给他
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', fontSize: 56, color: theme.accent, opacity: show(5, 25)}}>
            每个 FID 最多 4 个 CID
          </div>
        </div>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
