import React from 'react';
import {Freeze, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {PlannedLine} from './plan';
import {Callouts} from './Callouts';
import type {Callout, Recording} from './types';

// Status bar height as a share of the recording's height; covered so the real clock,
// battery and notification icons never show (HyperOS ignores Android demo mode).
const STATUS_BAR = 0.042;

// One stretch of the scene: from `at` for `frames`, showing the recording from `rec`,
// playing or held still.
export type Piece = {at: number; frames: number; rec: number; hold: boolean};

// How the recording fills the scene.
// - Lines with anchors: each anchored line starts with the recording at its anchor. Between
//   anchors the recording plays; if it runs short it holds, if it runs long the rest is skipped.
//   Clips, if any, are the parts kept: what lies between them is cut (e.g. a still menu between
//   two taps). Anchors and taps stay in the recording's own seconds.
// - Otherwise the clips play in order (or the whole recording).
// Either way the last frame holds to the end of the scene.
export const planScreen = (lines: PlannedLine[], clip: [number, number][], rec: Recording, sceneFrames: number, fps: number): Piece[] => {
  const end = Math.max(1, Math.floor(rec.duration * fps) - 1);
  const pieces: Piece[] = [];
  const kept = clip.length ? clip.map(([a, b]) => [Math.round(a * fps), Math.round(b * fps)]) : [[0, end]];
  const play = (at: number, from: number, to: number, until: number) => {
    // Play the kept parts of from..to starting at `at`, holding on the last one shown until `until`.
    let last = Math.max(from, to - 1);
    for (const [a, b] of kept) {
      const s = Math.max(a, from);
      const frames = Math.min(Math.min(b, to) - s, until - at);
      if (frames <= 0) continue;
      pieces.push({at, frames, rec: s, hold: false});
      at += frames;
      last = s + frames - 1;
    }
    if (until > at) pieces.push({at, frames: until - at, rec: last, hold: true});
  };
  const anchors = lines.filter((l) => l.anchor !== null).map((l) => ({at: l.from, rec: Math.round(l.anchor! * fps)}));
  if (anchors.length) {
    // Before the first anchor: the recording runs up to it, starting from its first frame,
    // held still first if the line starts before the recording does (a negative anchor).
    const first = anchors[0];
    const zero = first.at - first.rec; // scene frame at which the recording's frame 0 plays
    const next = anchors[1];
    if (zero > 0) {
      pieces.push({at: 0, frames: zero, rec: 0, hold: true});
      play(zero, 0, next ? next.rec : end, next ? next.at : sceneFrames);
    } else {
      play(0, -zero, next ? next.rec : end, next ? next.at : sceneFrames);
    }
    anchors.slice(1).forEach((a, i) => {
      const after = anchors[i + 2];
      play(a.at, a.rec, after ? after.rec : end, after ? after.at : sceneFrames);
    });
    return pieces;
  }
  let at = 0;
  kept.forEach(([a, b]) => {
    pieces.push({at, frames: b - a, rec: a, hold: false});
    at += b - a;
  });
  const last = kept[kept.length - 1][1] - 1;
  if (sceneFrames > at) pieces.push({at, frames: sceneFrames - at, rec: last, hold: true});
  return pieces;
};

export const Screen: React.FC<{
  base: string;
  recording: Recording;
  lines: PlannedLine[];
  clip: [number, number][];
  callouts: Callout[];
  sceneFrames: number;
}> = ({base, recording, lines, clip, callouts, sceneFrames}) => {
  const {fps} = useVideoConfig();
  const pieces = planScreen(lines, clip, recording, sceneFrames, fps);
  const src = staticFile(`${base}/${recording.file}`);
  const style = {width: '100%', height: '100%', objectFit: 'cover'} as const;
  return (
    <div style={{position: 'relative', width: '100%', height: '100%'}}>
      {pieces.map((p) => (
        // Premounted a second early: in the Studio each piece is its own <video>, black while it loads.
        <Sequence key={`${p.at}-${p.rec}`} from={p.at} durationInFrames={p.frames} premountFor={fps}>
          {p.hold ? (
            <Freeze frame={p.rec}>
              <OffthreadVideo src={src} muted style={style} />
            </Freeze>
          ) : (
            <OffthreadVideo src={src} muted startFrom={p.rec} style={style} />
          )}
        </Sequence>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: `${STATUS_BAR * 100}%`, background: '#FFFFFF'}} />
      <Callouts callouts={callouts} lines={lines} pieces={pieces} />
    </div>
  );
};
