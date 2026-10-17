import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U1-13 S5: you are the newcomer's guide. One stage per narration line:
//   0 the first bills land; a line between you, "引路人", locked "永久"
//   1 the newcomer adds you as a contact and says hello
//   2 the guide is a freer's first social tie, like the mother who brings a child into the world
//   3 trust passes along the chain: 领航员 → you → the newcomer → the next one
// You are the demo identity, Tom; your own guide is 领航员; the newcomer is from the recording.
// Laid out for portrait (Android episodes).
const NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const YOU = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const NEW = 'FSR2HFQ9PRSaFGnm6jy3QRKZfAJRVPdBZS';
const GREEN = '#5BC98C';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const Person: React.FC<{fid: string; label: string; x: number; y: number; size: number; opacity: number; dim?: boolean}> = ({fid, label, x, y, size, opacity, dim}) => (
  <div style={{position: 'absolute', left: x - 110, top: y, width: 220, textAlign: 'center', opacity}}>
    <div style={{width: size, height: size, margin: '0 auto', borderRadius: '50%', overflow: 'hidden', filter: dim ? 'grayscale(1) brightness(0.6)' : undefined}}>
      <FidAvatar fid={fid} size={size} />
    </div>
    <div style={{fontSize: size > 120 ? 40 : 30, color: theme.text, fontWeight: 600, marginTop: 10}}>{label}</div>
  </div>
);

export const GuideBond: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] && stage >= i ? frame - scene.lines[i].from : -1);
  const s0 = since(0), s1 = since(1), s2 = since(2), s3 = since(3);

  const landed = s0 >= 0 ? fade(s0 - 40, 15) : 0;
  const bond = s0 >= 0 ? fade(s0 - 60, 25) : 0;
  const lock = s0 >= 0 ? fade(s0 - 120, 15) : 0;
  const hello = s1 >= 0 ? fade(s1, 15) : 0;
  const tie = s2 >= 0 ? fade(s2, 15) : 0;
  const chain = s3 >= 0 ? fade(s3, 20) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      {/* You and the newcomer. */}
      <Person fid={YOU} label="你" x={260} y={300} size={180} opacity={fade(frame)} />
      <Person fid={NEW} label="新人" x={820} y={300} size={180} opacity={fade(frame - 8)} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: interpolate(s0 >= 0 ? fade(s0, 40) : 0, [0, 1], [300, 760]) + i * 14, top: 220 + i * 8,
          width: 130, height: 66, borderRadius: 10, background: 'linear-gradient(135deg, #2F6B4F, #3E8A64)', border: `2px solid ${GREEN}`,
          color: '#FFFFFF', fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: s0 >= 0 ? fade(s0) * (1 - landed) : 0}}>
          1.01 F
        </div>
      ))}
      <div style={{position: 'absolute', left: 370, top: 385, width: 340 * bond, height: 8, background: theme.accent, borderRadius: 4}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', fontSize: 40, color: theme.accent, opacity: bond}}>引路人</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontSize: 32, color: theme.muted, opacity: lock}}>🔒 记在链上 · 永久</div>

      {/* Stage 1: hello. */}
      <div style={{position: 'absolute', left: 700, top: 560, opacity: hello, padding: '16px 26px', borderRadius: 22, background: '#22324F', fontSize: 34, color: theme.text}}>
        你好！谢谢你 🙏
      </div>
      <div style={{position: 'absolute', left: 640, top: 660, opacity: s1 >= 0 ? fade(s1 - 30) : 0, fontSize: 28, color: GREEN}}>已把你加为联系人</div>

      {/* Stage 2: the first social tie. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', opacity: tie}}>
        <div style={{fontSize: 46, color: theme.text, fontWeight: 600}}>飞人的第一个社会关系</div>
        <div style={{fontSize: 34, color: theme.muted, marginTop: 14}}>像带来生命的母亲</div>
      </div>

      {/* Stage 3: the chain of guides. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', fontSize: 34, color: theme.accent, opacity: chain}}>信任沿着引路不断传递</div>
      {[
        {fid: NAVIGATOR, label: '领航员'},
        {fid: YOU, label: '你'},
        {fid: NEW, label: '新人'},
      ].map((p, i) => (
        <React.Fragment key={i}>
          <Person fid={p.fid} label={p.label} x={150 + i * 260} y={1150} size={110} opacity={s3 >= 0 ? fade(s3 - 10 - i * 20) : 0} />
          <div style={{position: 'absolute', left: 225 + i * 260, top: 1185, fontSize: 48, color: theme.accent, opacity: s3 >= 0 ? fade(s3 - 20 - i * 20) : 0}}>→</div>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: 870, top: 1150, width: 110, height: 110, borderRadius: '50%', border: `3px dashed ${theme.muted}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, color: theme.muted, opacity: s3 >= 0 ? fade(s3 - 80) : 0}}>?</div>
      <div style={{position: 'absolute', left: 820, top: 1272, width: 210, textAlign: 'center', fontSize: 30, color: theme.muted, opacity: s3 >= 0 ? fade(s3 - 80) : 0}}>下一位</div>
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
