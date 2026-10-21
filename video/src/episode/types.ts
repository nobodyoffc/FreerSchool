// The shape of episodes/<...>/build/timeline.json, written by voice/narrate.py.
export type Line = {text: string; file: string; duration: number; start: number; end: number; anchor: number | null};

// A highlight on a recording, in recording pixels: a box shown while a word is spoken
// (line, offset seconds into it), a tap ring at a second of the recording, or an opaque
// mask over a box while the recording shows `range` (seconds; null = the whole scene), or a ring
// round the Navigator's avatar beside the phone while a word is spoken (xy unused).
export type Callout = {
  label: string;
  kind: 'box' | 'tap' | 'mask' | 'navigator';
  xy: number[];
  word: string | null;
  rec: number | null;
  line?: number;
  offset?: number;
  range?: [number, number] | null;
};

export type SceneType = '讲师' | '动画' | '录屏' | '卡片';

export type Scene = {
  id: string;
  type: SceneType;
  title: string;
  points: string[];
  ops: string[];
  notes: string[];
  clip: [number, number][]; // seconds of the recording to use, in order; [] = from the start
  callouts: Callout[];
  lines: Line[];
};

export type NavigatorInfo = {name: string; fid: string; cid?: string};

export type Timeline = {
  id: string;
  title: string;
  app: string;
  navigator: NavigatorInfo;
  voice: string;
  gaps: {line: number; scene: number};
  scenes: Scene[];
};

export type Recording = {file: string; duration: number};
export type Manifest = {recordings: Record<string, Recording>};
