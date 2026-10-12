import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Navigator} from '../components/Navigator';
import {PhoneFrame} from '../components/PhoneFrame';
import {theme, usePortrait} from '../theme';
import type {PlannedScene} from './plan';
import {Screen} from './Screen';
import type {NavigatorInfo, Recording} from './types';

// A screen recording in a phone frame. Until the recording exists, the phone shows the
// scene's steps so the cut can be reviewed for timing.
export const RecordingScene: React.FC<{scene: PlannedScene; base: string; recording?: Recording; navigator: NavigatorInfo}> = ({
  scene,
  base,
  recording,
  navigator,
}) => {
  const portrait = usePortrait();
  const screen = recording ? (
    <Screen base={base} recording={recording} lines={scene.lines} clip={scene.clip} sceneFrames={scene.frames} />
  ) : (
    <div style={{padding: 28, color: theme.muted, fontSize: 22, lineHeight: 1.6}}>
      <div style={{color: theme.accent, fontSize: 24, marginBottom: 16}}>录屏待补 · {scene.id}</div>
      {scene.ops.map((op, i) => (
        <div key={i}>
          {i + 1}. {op}
        </div>
      ))}
    </div>
  );

  if (portrait) {
    // The phone takes all the height between the header row and the caption.
    return (
      <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
        <div style={{position: 'absolute', left: 50, right: 50, top: 40, display: 'flex', alignItems: 'center', gap: 32}}>
          <Navigator {...navigator} size={84} />
          <div style={{fontSize: 46, color: theme.text, fontWeight: 600}}>{scene.title}</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 160, display: 'flex', justifyContent: 'center'}}>
          <PhoneFrame height={1490}>{screen}</PhoneFrame>
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center'}}>
        <PhoneFrame height={860}>{screen}</PhoneFrame>
      </div>
      <div style={{position: 'absolute', left: 80, top: 120, width: 520, fontSize: 52, color: theme.text, fontWeight: 600}}>
        {scene.title}
      </div>
      <div style={{position: 'absolute', left: 60, bottom: 160}}>
        <Navigator {...navigator} />
      </div>
    </AbsoluteFill>
  );
};
