// The shape of episodes/<...>/build/timeline.json, written by voice/narrate.py.
export type Line = {text: string; file: string; duration: number; start: number; end: number};

export type SceneType = '讲师' | '动画' | '录屏' | '卡片';

export type Scene = {
  id: string;
  type: SceneType;
  title: string;
  points: string[];
  ops: string[];
  notes: string[];
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

export type Manifest = {recordings: Record<string, string>};
