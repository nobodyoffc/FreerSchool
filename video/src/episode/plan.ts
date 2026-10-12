import type {Line, Scene, Timeline} from './types';

// Frames for everything the episode shows, worked out from the narration timings.
// Lines are placed one by one rather than as one long track, so a scene can be held
// longer than its narration (a card needs time to be read).

export const INTRO = 3; // seconds of title card
export const OUTRO = 4;
const CARD_MIN = 6; // a card stays at least this long
const POINT_EVERY = 0.8; // seconds between card points appearing

export type PlannedLine = Line & {from: number; frames: number}; // from: relative to its scene
export type PlannedScene = Omit<Scene, 'lines'> & {from: number; frames: number; lines: PlannedLine[]};
export type Plan = {intro: number; scenes: PlannedScene[]; outroFrom: number; total: number};

export const pointDelay = (i: number, fps: number) => Math.round((0.6 + i * POINT_EVERY) * fps);

export const planEpisode = (timeline: Timeline, fps: number): Plan => {
  const f = (seconds: number) => Math.round(seconds * fps);
  const intro = f(INTRO);
  let cursor = intro;
  const scenes = timeline.scenes.map((scene, si): PlannedScene => {
    const last = si === timeline.scenes.length - 1;
    // Cards: points appear first, then the narration.
    let t = scene.type === '卡片' ? (pointDelay(scene.points.length, fps) / fps) : 0.4;
    const lines = scene.lines.map((line, li): PlannedLine => {
      if (li) t += timeline.gaps.line;
      const planned = {...line, from: f(t), frames: f(line.duration)};
      t += line.duration;
      return planned;
    });
    if (scene.type === '卡片') t = Math.max(t + 1, CARD_MIN);
    t += last ? 1 : timeline.gaps.scene;
    const planned = {...scene, from: cursor, frames: f(t), lines};
    cursor += planned.frames;
    return planned;
  });
  return {intro, scenes, outroFrom: cursor, total: cursor + f(OUTRO)};
};

// Index of the line being spoken (or last spoken) at a frame within its scene; -1 before the first.
export const lineAt = (lines: PlannedLine[], frame: number) => {
  let index = -1;
  lines.forEach((line, i) => {
    if (frame >= line.from) index = i;
  });
  return index;
};
