import React from 'react';
import {interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import type {PlannedLine} from './plan';
import type {Piece} from './Screen';
import type {Callout} from './types';

// Recording size the callout coordinates are in.
const REC_W = 1280;
const REC_H = 2772;
const TAP_FRAMES = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Scene frame at which the recording shows `rec`, if it is played (not skipped).
const sceneFrameOf = (pieces: Piece[], rec: number) => {
  const p = pieces.find((x) => !x.hold && rec >= x.rec && rec < x.rec + x.frames);
  return p ? p.at + (rec - p.rec) : null;
};

// Recording frame shown at scene frame `f`.
const recFrameAt = (pieces: Piece[], f: number) => {
  const p = pieces.find((x) => f >= x.at && f < x.at + x.frames) ?? pieces[pieces.length - 1];
  return p ? (p.hold ? p.rec : p.rec + (f - p.at)) : 0;
};

// Opaque, never faded: a key must not show through for even a frame. A range is padded so
// a misjudged second leaves it covered rather than bare.
const MASK_PAD = 0.5;

const Mask: React.FC<{xy: number[]; range: [number, number] | null | undefined; pieces: Piece[]}> = ({xy, range, pieces}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (range) {
    const rec = recFrameAt(pieces, frame) / fps;
    if (rec < range[0] - MASK_PAD || rec > range[1] + MASK_PAD) return null;
  }
  const [x1, y1, x2, y2] = xy;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${(x1 / REC_W) * 100}%`,
        top: `${(y1 / REC_H) * 100}%`,
        width: `${((x2 - x1) / REC_W) * 100}%`,
        height: `${((y2 - y1) / REC_H) * 100}%`,
        borderRadius: 10,
        background: 'repeating-linear-gradient(45deg, #5B6170 0 14px, #6B7280 14px 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 4,
      }}
    >
      已打码
    </div>
  );
};

const Box: React.FC<{xy: number[]; frames: number}> = ({xy, frames}) => {
  const frame = useCurrentFrame();
  const [x1, y1, x2, y2] = xy;
  const show = interpolate(frame, [0, 8, frames - 8, frames], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${(x1 / REC_W) * 100}%`,
        top: `${(y1 / REC_H) * 100}%`,
        width: `${((x2 - x1) / REC_W) * 100}%`,
        height: `${((y2 - y1) / REC_H) * 100}%`,
        border: `5px solid ${theme.accent}`,
        borderRadius: 14,
        boxShadow: `0 0 24px rgba(242,180,65,0.7)`,
        opacity: show,
        transform: `scale(${interpolate(frame, [0, 8], [1.08, 1], clamp)})`,
      }}
    />
  );
};

const Tap: React.FC<{xy: number[]}> = ({xy}) => {
  const frame = useCurrentFrame();
  const [x, y] = xy;
  const ring = (delay: number) => {
    const t = interpolate(frame - delay, [0, 20], [0, 1], clamp);
    const size = 40 + 120 * t;
    return (
      <div
        key={delay}
        style={{
          position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: '50%',
          border: `5px solid ${theme.accent}`, opacity: frame >= delay ? 1 - t : 0,
        }}
      />
    );
  };
  return (
    <div style={{position: 'absolute', left: `${(x / REC_W) * 100}%`, top: `${(y / REC_H) * 100}%`}}>
      <div
        style={{
          position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: '50%',
          background: theme.accent, opacity: interpolate(frame, [0, 4, 14, 22], [0, 0.85, 0.85, 0], clamp),
        }}
      />
      {ring(0)}
      {ring(8)}
    </div>
  );
};

export const Callouts: React.FC<{callouts: Callout[]; lines: PlannedLine[]; pieces: Piece[]}> = ({callouts, lines, pieces}) => {
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {callouts.map((c) => {
        if (c.kind === 'mask') return <Mask key={c.label + c.xy.join()} xy={c.xy} range={c.range} pieces={pieces} />;
        if (c.kind === 'tap' && c.rec !== null) {
          const at = sceneFrameOf(pieces, Math.round(c.rec * fps));
          return at === null ? null : (
            <Sequence key={c.label} from={at} durationInFrames={TAP_FRAMES} layout="none">
              <Tap xy={c.xy} />
            </Sequence>
          );
        }
        if (c.kind === 'box' && c.line !== undefined) {
          const line = lines[c.line];
          const from = line.from + Math.round((c.offset ?? 0) * fps) - 3;
          const frames = line.from + line.frames + 12 - from;
          return (
            <Sequence key={c.label} from={from} durationInFrames={frames} layout="none">
              <Box xy={c.xy} frames={frames} />
            </Sequence>
          );
        }
        return null;
      })}
    </div>
  );
};
