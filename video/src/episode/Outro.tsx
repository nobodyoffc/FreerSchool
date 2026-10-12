import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Navigator} from '../components/Navigator';
import {theme} from '../theme';

export const Outro: React.FC<{navigator: {name: string; fid: string}}> = ({navigator}) => (
  <AbsoluteFill style={{background: theme.bg, alignItems: 'center', justifyContent: 'center', fontFamily: theme.font}}>
    <div style={{fontSize: 40, color: theme.muted, letterSpacing: 4, marginBottom: 60}}>飞人学堂 · Freer School</div>
    <Navigator {...navigator} />
  </AbsoluteFill>
);
