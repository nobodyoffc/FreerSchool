// The shape of episodes/<...>/build/timeline.json, written by voice/narrate.py.
export type Line = {text: string; file: string; duration: number; start: number; end: number; anchor: number | null};

export type SceneType = '讲师' | '动画' | '录屏' | '卡片';

export type Scene = {
  id: string;
  type: SceneType;
  title: string;
  points: string[];
  ops: string[];
  notes: string[];
  clip: [number, number][]; // seconds of the recording to use, in order; [] = from the start
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
