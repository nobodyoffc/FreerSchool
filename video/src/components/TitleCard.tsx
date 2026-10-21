import React from 'react';
import {AbsoluteFill} from 'remotion';
import {theme} from '../theme';

const LINES: Record<string, string> = {U: '使用', T: '理解', B: '建造'};
const LEVELS: Record<string, string> = {'1': '入门', '2': '进阶', '3': '专业'};

// "U1-04" → "使用·入门 04"
export const seriesLabel = (id: string): string => {
  const m = /^([UTB])([123])-(\d+)$/.exec(id);
  if (!m) throw new Error(`Bad episode id: ${id}`);
  return `${LINES[m[1]]}·${LEVELS[m[2]]} ${m[3]}`;
};

// Shown in full from the first frame: players that take frame 0 as the cover get the title.
export const TitleCard: React.FC<{id: string; title: string}> = ({id, title}) => {
  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.font,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Readable on a thumbnail, a little smaller than the title. */}
      <div style={{position: 'absolute', left: 56, top: 56, fontSize: 80, fontWeight: 700, color: theme.accent, lineHeight: 1, letterSpacing: 2}}>
        {id}
      </div>
      <div style={{fontSize: 36, color: theme.muted, letterSpacing: 4}}>飞人学堂 · Freer School</div>
      <div style={{fontSize: 44, color: theme.accent, marginTop: 48}}>{seriesLabel(id)}</div>
      <div style={{fontSize: 96, fontWeight: 600, marginTop: 16}}>{title}</div>
    </AbsoluteFill>
  );
};
