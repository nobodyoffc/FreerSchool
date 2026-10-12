import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {theme, usePortrait} from '../theme';
import {lineAt, type PlannedScene} from './plan';
import {SpeakingRing} from './Speaking';
import type {NavigatorInfo} from './types';

const EASE = 12; // frames for a line to settle in
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// The Navigator speaks: its badge sits top-left, and what it says rolls up the screen,
// the current line large and bright, earlier ones smaller and fading.
export const NavigatorScene: React.FC<{scene: PlannedScene; base: string; navigator: NavigatorInfo}> = ({
  scene,
  base,
  navigator,
}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const current = lineAt(scene.lines, frame);
  const avatar = portrait ? 150 : 140;
  const area = portrait ? {left: 80, right: 80, top: 320, bottom: 520} : {left: 200, right: 200, top: 240, bottom: 260};
  const areaWidth = (portrait ? 1080 : 1920) - area.left - area.right;
  const big = portrait ? 68 : 72;
  const small = portrait ? 44 : 46;
  const lineHeight = 1.4;
  const gap = portrait ? 36 : 32;

  // Height a line takes at the big size, to slide the column up by as it arrives.
  const rows = (text: string) => Math.ceil((text.length * big * 0.95) / areaWidth);
  const arriving = current >= 0 ? frame - scene.lines[current].from : EASE;
  const shift = current >= 0 ? interpolate(arriving, [0, EASE], [rows(scene.lines[current].text) * big * lineHeight + gap, 0], clamp) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: 60, top: 60, display: 'flex', alignItems: 'center', gap: 24}}>
        <div style={{position: 'relative', width: avatar, height: avatar}}>
          <div style={{borderRadius: '50%', overflow: 'hidden', background: theme.panel}}>
            <FidAvatar fid={navigator.fid} size={avatar} />
          </div>
          {scene.lines.map((line) => (
            <Sequence key={line.file} from={line.from} durationInFrames={line.frames} layout="none">
              <SpeakingRing src={`${base}/${line.file}`} size={avatar} />
            </Sequence>
          ))}
        </div>
        <div>
          <div style={{fontSize: navigator.cid ? 44 : 24, color: theme.text, fontFamily: navigator.cid ? theme.font : 'Menlo, monospace'}}>
            {navigator.cid ?? navigator.fid}
          </div>
          <div style={{fontSize: 28, color: theme.muted}}>{navigator.name}</div>
        </div>
      </div>

      <div style={{position: 'absolute', ...area, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
        <div style={{transform: `translateY(${shift}px)`}}>
          {scene.lines.slice(0, current + 1).map((line, i) => {
            const age = current - i;
            // A line shrinks and dims once the next one starts.
            const superseded = i < current ? frame - scene.lines[i + 1].from : -1;
            const t = interpolate(superseded, [0, EASE], [0, 1], clamp);
            const size = big + (small - big) * t;
            const opacity = i === current ? interpolate(frame - line.from, [0, EASE], [0, 1], clamp) : Math.max(0.25, 0.75 - 0.15 * (age - 1)) + 0.25 * (1 - t);
            return (
              <div
                key={line.file}
                style={{
                  fontSize: size,
                  lineHeight,
                  fontWeight: i === current ? 600 : 400,
                  color: i === current ? theme.text : theme.muted,
                  opacity,
                  marginBottom: gap,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
