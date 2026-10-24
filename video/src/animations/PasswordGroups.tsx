import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme} from '../theme';

// U2-04 S2: identities are grouped by password. One stage per narration line:
//   0 password A holds a group of three identities
//   1 the app asks for a password, lists that group, and you log in as one of them
//   2 a second password, B, holds another group
//   3 whichever password you type, only its group opens; the other stays locked
// The identities are the demo ones the recordings show. Laid out for portrait (Android episodes).
const GROUP_A = [
  {fid: 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4', name: 'Tom_9yw4'},
  {fid: 'FNR4MJumYrBMBUs1pvMJWTmdRWof1igFuG'},
  {fid: 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8', name: 'cy_qqN8'},
];
const GROUP_B = [
  {fid: 'FHJ4Fi6ZNsgDgkzAecREzwJt22V1nv2Hx1'},
  {fid: 'F9LbEZhAAKWfKHuZRj8UN4DJnZCDnCvt7u'},
  {fid: 'F6CdujyGz6quUnX5iXQdJfdtgEhDae86BE'},
];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const short = (fid: string) => `${fid.slice(0, 4)}…${fid.slice(-4)}`;

// One password and its identities. `open` (0–1) unlocks it; `pick` lights one card.
const Group: React.FC<{
  label: string; color: string; ids: {fid: string; name?: string}[]; top: number;
  opacity: number; open: number; pick?: number; picked?: number;
}> = ({label, color, ids, top, opacity, open, pick = -1, picked = 0}) => (
  <div style={{position: 'absolute', left: 60, top, width: 960, height: 470, opacity}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 28, background: theme.panel, border: `3px solid ${open > 0.5 ? color : '#2A3854'}`}} />
    <div style={{position: 'absolute', left: 36, top: 26, fontSize: 44, color, fontWeight: 600}}>
      {open > 0.5 ? '🔓' : '🔒'} {label}
    </div>
    {ids.map((id, i) => {
      const lit = i === pick ? picked : 0;
      return (
        <div
          key={id.fid}
          style={{
            position: 'absolute', left: 36 + i * 300, top: 120, width: 270, height: 310, borderRadius: 20,
            background: '#1E2D49', border: `3px solid ${lit > 0 ? theme.accent : '#2A3854'}`,
            boxShadow: lit > 0 ? `0 0 ${36 * lit}px rgba(242,180,65,${0.6 * lit})` : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            opacity: open, filter: `blur(${(1 - open) * 14}px)`,
          }}
        >
          <FidAvatar fid={id.fid} size={130} />
          <div style={{fontSize: 30, color: theme.text, height: 36}}>{id.name ?? ''}</div>
          <div style={{fontSize: 26, color: theme.muted}}>{short(id.fid)}</div>
        </div>
      );
    })}
  </div>
);

export const PasswordGroups: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] && stage >= i ? frame - scene.lines[i].from : -1);

  // Stage 0: group A, already open, to show what a password holds.
  // Stage 1: it locks, the password is typed, it opens again and one identity logs in.
  const s1 = since(1);
  const typed = s1 >= 0 ? Math.min(4, Math.floor(Math.max(0, s1 - 20) / 8)) : 0;
  const reopen = s1 >= 0 ? fade(s1 - 60, 15) : 1;
  const pickA = s1 >= 0 ? fade(s1 - 100, 15) : 0;
  // Stage 2: group B appears below.
  const s2 = since(2);
  const showB = s2 >= 0 ? fade(s2, 15) : 0;
  // Stage 3: type A, only A opens; then type B, only B opens.
  const s3 = since(3);
  const useB = s3 >= 0 && s3 >= 90;
  const openA = s3 >= 0 ? (useB ? 1 - fade(s3 - 90, 12) : 1) : s1 >= 0 ? Math.max(1 - fade(s1, 12), reopen) : 1;
  const openB = s3 >= 0 ? (useB ? fade(s3 - 100, 12) : 1 - fade(s3, 12)) : showB;

  const field = s3 >= 0 ? (useB ? '密码 B' : '密码 A') : stage >= 1 ? '●'.repeat(typed) : '';
  const fieldOpacity = stage >= 1 ? 1 : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
        一个密码，一组身份
      </div>

      {/* The password field. */}
      <div style={{position: 'absolute', left: 240, top: 220, width: 600, height: 84, borderRadius: 16, background: '#1E2D49',
        border: `3px solid ${theme.muted}`, opacity: fieldOpacity, display: 'flex', alignItems: 'center', paddingLeft: 30, gap: 18}}>
        <span style={{fontSize: 30, color: theme.muted}}>输入密码</span>
        <span style={{fontSize: 36, color: theme.text, letterSpacing: 6}}>{field}</span>
      </div>

      <Group label="密码 A" color={GREEN} ids={GROUP_A} top={360} opacity={fade(frame)} open={openA}
        pick={0} picked={s3 >= 0 ? 0 : pickA} />
      {s1 >= 0 && s3 < 0 && (
        <div style={{position: 'absolute', left: 96, top: 845, width: 270, textAlign: 'center', fontSize: 32, color: theme.accent, opacity: pickA}}>
          登录 ↑
        </div>
      )}
      <Group label="密码 B" color={BLUE} ids={GROUP_B} top={900} opacity={showB} open={openB} />

      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
