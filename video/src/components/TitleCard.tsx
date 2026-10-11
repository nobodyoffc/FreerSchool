import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';

const LINES: Record<string, string> = {U: '用', T: '懂', B: '建'};
const LEVELS: Record<string, string> = {'1': '入门', '2': '进阶', '3': '专业'};

// "U1-04" → "用·入门 04"
export const seriesLabel = (id: string): string => {
  const m = /^([UTB])([123])-(\d+)$/.exec(id);
  if (!m) throw new Error(`Bad episode id: ${id}`);
  return `${LINES[m[1]]}·${LEVELS[m[2]]} ${m[3]}`;
};

export const TitleCard: React.FC<{id: string; title: string}> = ({id, title}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.font,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <div style={{fontSize: 36, color: theme.muted, letterSpacing: 4}}>飞人学堂 · Freer School</div>
      <div style={{fontSize: 44, color: theme.accent, marginTop: 48}}>{seriesLabel(id)}</div>
      <div style={{fontSize: 96, fontWeight: 600, marginTop: 16}}>{title}</div>
    </AbsoluteFill>
  );
};
