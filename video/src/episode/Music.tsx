import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {Plan} from './plan';

// Theme music: the full theme, motif and all, on the title card and at the end; in between
// the same loop without the motif, quiet and steady under the narration. Both run in step
// from frame 0, so crossfading between them never breaks the beat.
//
// The loop is laid out as one Sequence per pass rather than <Audio loop>: with `loop`,
// the frame given to a volume callback restarts at every pass, which replayed the title
// level at the start of each one.
const TITLE = 0.75;
const BED = 0.07;
const OUTRO = 0.55;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Music: React.FC<{plan: Plan; loopSeconds: number}> = ({plan, loopSeconds}) => {
  const {fps} = useVideoConfig();
  const fade = Math.round(fps * 1.5);
  const end = plan.total - 1;
  const loop = Math.round(loopSeconds * fps);
  const theme = (f: number) =>
    f < plan.outroFrom
      ? interpolate(f, [0, 6, plan.intro, plan.intro + fade], [0, TITLE, TITLE, 0], clamp)
      : interpolate(f, [plan.outroFrom, plan.outroFrom + fps, end - fade, end], [0, OUTRO, OUTRO, 0], clamp);
  const bed = (f: number) =>
    interpolate(f, [plan.intro, plan.intro + fade, plan.outroFrom, plan.outroFrom + fps], [0, BED, BED, 0], clamp);
  const passes = Array.from({length: Math.ceil(plan.total / loop)}, (_, k) => k * loop);
  return (
    <>
      {passes.map((at) => (
        <Sequence key={at} from={at} durationInFrames={loop} layout="none">
          <Audio src={staticFile('music/theme.wav')} volume={(f) => theme(at + f)} />
          <Audio src={staticFile('music/bed.wav')} volume={(f) => bed(at + f)} />
        </Sequence>
      ))}
    </>
  );
};
