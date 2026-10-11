import React from 'react';
import {AbsoluteFill} from 'remotion';
import {theme} from '../theme';
import {Caption} from './Caption';
import {Navigator} from './Navigator';
import {PhoneFrame} from './PhoneFrame';

// Standard 16:9 screen: phone in the middle, key points on the right,
// the Navigator bottom-left, caption along the bottom.
export const EpisodeLayout: React.FC<{
  navigator: {fid: string; name: string};
  points: string[];
  caption: string;
  screen?: React.ReactNode;
}> = ({navigator, points, caption, screen}) => (
  <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 60, display: 'flex', justifyContent: 'center'}}>
      <PhoneFrame height={820}>{screen ?? <span style={{fontSize: 28}}>App 录屏</span>}</PhoneFrame>
    </div>
    <div style={{position: 'absolute', right: 100, top: 200, width: 480}}>
      {points.map((point) => (
        <div
          key={point}
          style={{
            background: theme.panel,
            color: theme.text,
            fontSize: 34,
            padding: '20px 28px',
            borderRadius: 16,
            borderLeft: `6px solid ${theme.accent}`,
            marginBottom: 24,
          }}
        >
          {point}
        </div>
      ))}
    </div>
    <div style={{position: 'absolute', left: 60, bottom: 160}}>
      <Navigator {...navigator} />
    </div>
    <Caption text={caption} />
  </AbsoluteFill>
);
