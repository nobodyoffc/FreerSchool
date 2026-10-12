import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, usePortrait} from '../theme';
import {type PlannedScene, pointDelay} from './plan';

export const CardScene: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const portrait = usePortrait();
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: portrait ? 940 : 1200, marginTop: -80}}>
        {scene.points.map((point, i) => {
          const t = frame - pointDelay(i, fps);
          return (
            <div
              key={point}
              style={{
                opacity: interpolate(t, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                transform: `translateY(${interpolate(t, [0, 10], [20, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
                background: theme.panel,
                borderLeft: `8px solid ${theme.accent}`,
                borderRadius: 16,
                padding: '24px 36px',
                marginBottom: 28,
                fontSize: portrait ? 50 : 48,
                color: theme.text,
              }}
            >
              {point}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
