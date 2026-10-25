import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-08 S2 and S7: the identity matrix, social roles across, security levels up.
// S2 (IdMatrix), one stage per narration line:
//   0 two empty axes
//   1 the horizontal axis: social roles
//   2 three roles: developer, netizen, miser
//   3 the vertical axis: security level, pointing up
//   4 the levels, low to high, one by one
//   5 the grid: the identity matrix
//   6 the level names fade; a pen: your own matrix
// S7 (MatrixFilled), one stage per narration line:
//   0 the three examples put back in their cells
//   1 masters high and cold, servants low and at work: the links light up
//   2 roles walled off from each other, no transfers across
//   3 the top is safe, the bottom convenient
//   4 the netizen column fails and is given up
//   5 a new column, a new role, starting from a new master
//   6 the whole matrix lights up
// Identities are the episode's made-up A, 1, 2…; marked 示意.
const LEVELS = ['日常手机', '工作电脑', '资产专用手机', '断网手机', '纸备份', '钢备份', '分解备份', '篡改备份', '社交备份'];
const ROLES = [
  {name: '开发者', icon: '💼'},
  {name: '网民', icon: '💬'},
  {name: '守财奴', icon: '💰'},
];
const LEFT = 60; // the level labels
const LABEL_W = 250;
const GRID_X = LEFT + LABEL_W;
const GRID_W = 690;
const HEAD_Y = 300; // column heads
const TOP = 400; // top of the highest row
const ROW_H = 100;
const BOTTOM = TOP + LEVELS.length * ROW_H;
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});

// Centre y of a level's row (0 = 日常手机, at the bottom).
const rowY = (level: number) => TOP + (LEVELS.length - 1 - level) * ROW_H + ROW_H / 2;
const L = (name: string) => LEVELS.indexOf(name);

// A small round identity token: a master is blue, a servant green, a lone identity gold; a backup is a dashed copy.
type Token = {id: string; level: number; kind: 'master' | 'servant' | 'lone'; backup?: boolean; master?: string};
const COLOR = {master: BLUE, servant: GREEN, lone: theme.accent};
const FILLED: Token[][] = [
  [
    {id: 'A', level: L('断网手机'), kind: 'master'},
    {id: 'A', level: L('纸备份'), kind: 'master', backup: true},
    {id: '1', level: L('工作电脑'), kind: 'servant', master: 'A'},
    {id: '2', level: L('工作电脑'), kind: 'servant', master: 'A'},
    {id: '4', level: L('工作电脑'), kind: 'servant', master: 'A'},
    {id: '5', level: L('工作电脑'), kind: 'servant', master: 'A'},
    {id: '6', level: L('工作电脑'), kind: 'servant', master: '5'},
    {id: '7', level: L('工作电脑'), kind: 'servant', master: '5'},
    {id: '3', level: L('日常手机'), kind: 'servant', master: 'A'},
  ],
  [
    {id: 'A', level: L('断网手机'), kind: 'master'},
    {id: 'A', level: L('纸备份'), kind: 'master', backup: true},
    {id: '1', level: L('日常手机'), kind: 'servant', master: 'A'},
    {id: '2', level: L('日常手机'), kind: 'servant', master: 'A'},
  ],
  [
    {id: '💰', level: L('钢备份'), kind: 'lone', backup: true},
    {id: '💰', level: L('分解备份'), kind: 'lone', backup: true},
  ],
];
const TOKEN = 40;

// Where each token of a column sits: tokens sharing a row are laid out three to a line.
const place = (tokens: Token[], cx: number) => {
  const byRow: Record<number, number> = {};
  const count: Record<number, number> = {};
  tokens.forEach((t) => (count[t.level] = (count[t.level] ?? 0) + 1));
  return tokens.map((t) => {
    const k = (byRow[t.level] = (byRow[t.level] ?? -1) + 1);
    const n = count[t.level];
    const lines = Math.ceil(n / 3);
    const line = Math.floor(k / 3);
    const inLine = Math.min(3, n - line * 3);
    const col = k % 3;
    return {
      ...t,
      x: cx + (col - (inLine - 1) / 2) * (TOKEN + 10),
      y: rowY(t.level) + (line - (lines - 1) / 2) * (TOKEN + 6),
    };
  });
};

const TokenDot: React.FC<{t: Token & {x: number; y: number}; opacity: number; glow?: number}> = ({t, opacity, glow = 0}) => (
  <div style={{position: 'absolute', left: t.x - TOKEN / 2, top: t.y - TOKEN / 2, width: TOKEN, height: TOKEN, borderRadius: TOKEN / 2,
    background: t.backup ? 'transparent' : COLOR[t.kind], border: `3px ${t.backup ? 'dashed' : 'solid'} ${COLOR[t.kind]}`, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700,
    color: t.backup ? COLOR[t.kind] : theme.bg, opacity, boxShadow: glow ? `0 0 ${18 * glow}px ${COLOR[t.kind]}` : 'none'}}>
    {t.id}
  </div>
);

// The matrix frame shared by both scenes: level labels, column heads and the grid.
const Grid: React.FC<{
  columns: {name: string; icon: string; head: number; grey?: number}[];
  colW: number;
  axes: number; roleAxis: number; levelAxis: number; levels: (i: number) => number; grid: number; labelFade?: number;
}> = ({columns, colW, axes, roleAxis, levelAxis, levels, grid, labelFade = 0}) => (
  <>
    {/* Axes. */}
    <div style={{position: 'absolute', left: GRID_X, top: BOTTOM + 4, width: GRID_W + 40, height: 5, background: theme.text, opacity: axes}} />
    <div style={{position: 'absolute', left: GRID_X - 5, top: HEAD_Y - 60, width: 5, height: BOTTOM - HEAD_Y + 69, background: theme.text, opacity: axes}} />
    <div style={{position: 'absolute', left: GRID_X + GRID_W + 30, top: BOTTOM - 14, fontSize: 36, color: theme.text, opacity: axes}}>▶</div>
    <div style={{position: 'absolute', left: GRID_X - 21, top: HEAD_Y - 92, fontSize: 36, color: theme.text, opacity: axes}}>▲</div>
    <div style={{position: 'absolute', left: GRID_X, width: GRID_W, top: BOTTOM + 26, textAlign: 'center', fontSize: 40, color: theme.accent, fontWeight: 700, opacity: roleAxis}}>
      社会角色 →
    </div>
    <div style={{position: 'absolute', left: LEFT - 30, top: HEAD_Y - 100, fontSize: 40, color: theme.accent, fontWeight: 700, opacity: levelAxis}}>
      安全等级 ↑
    </div>

    {/* Rows: label and cells. */}
    {LEVELS.map((name, i) => (
      <React.Fragment key={name}>
        <div style={{position: 'absolute', left: LEFT, width: LABEL_W - 20, top: rowY(i) - 22, textAlign: 'right', fontSize: 32, color: theme.text,
          opacity: levels(i) * (1 - labelFade)}}>
          {name}
        </div>
        {columns.map((c, j) => (
          <div key={c.name} style={{position: 'absolute', left: GRID_X + j * colW + 4, top: rowY(i) - ROW_H / 2 + 4, width: colW - 8, height: ROW_H - 8,
            borderRadius: 10, background: theme.panel, opacity: grid * c.head * (1 - 0.6 * (c.grey ?? 0))}} />
        ))}
      </React.Fragment>
    ))}

    {/* Column heads. */}
    {columns.map((c, j) => (
      <div key={c.name} style={{position: 'absolute', left: GRID_X + j * colW, width: colW, top: HEAD_Y - 40, textAlign: 'center', opacity: c.head * (1 - 0.6 * (c.grey ?? 0))}}>
        <div style={{fontSize: 40, lineHeight: '46px'}}>{c.icon}</div>
        <div style={{fontSize: 32, color: theme.text, fontWeight: 700, whiteSpace: 'nowrap'}}>{c.name}</div>
      </div>
    ))}
  </>
);

const useStages = (scene: PlannedScene) => {
  const frame = useCurrentFrame();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const show = (i: number, delay = 0, len = 12) => (stage >= i ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (stage >= i ? ease(since(i) - delay, len) : 0);
  return {frame, stage, since, show, go};
};

const Stage: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => {
  const portrait = usePortrait();
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 90, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>{title}</div>
        {children}
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};

export const IdMatrix: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const {frame, since, show} = useStages(scene);
  // Stage 4: the levels appear bottom to top across the line.
  const levelsLine = scene.lines[4];
  const levelAt = (i: number) => (levelsLine ? fade(since(4) - 10 - (i * (levelsLine.frames - 30)) / LEVELS.length, 10) : 0);
  const colW = GRID_W / ROLES.length;

  return (
    <Stage title={show(5) > 0 ? '身份矩阵' : '规划身份'}>
      <Grid
        columns={ROLES.map((r, j) => ({...r, head: show(2, 15 + j * 25)}))}
        colW={colW}
        axes={fade(frame)}
        roleAxis={show(1)}
        levelAxis={show(3)}
        levels={levelAt}
        grid={show(5)}
        labelFade={show(6, 30, 20) * 0.85}
      />
      {/* Stage 6: a pen — your own matrix. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: BOTTOM + 110, textAlign: 'center', fontSize: 44, color: theme.accent, fontWeight: 700, opacity: show(6, 40)}}>
        ✏️ 你的身份矩阵
      </div>
    </Stage>
  );
};

export const MatrixFilled: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const {frame, since, show, go} = useStages(scene);
  // Stage 5: a fourth column grows in; the others narrow to make room.
  const grow = go(5, 10, 30);
  const colW = GRID_W / (3 + grow);
  const dropped = show(4, 20, 20);
  const columns = [
    ...ROLES.map((r, j) => ({...r, head: 1, grey: j === 1 ? dropped : 0})),
    {name: '新角色', icon: '❓', head: grow},
  ];
  const glow = show(6, 10, 20) * (0.6 + 0.4 * Math.sin(frame / 7));

  return (
    <Stage title="身份矩阵">
      <Grid columns={columns} colW={colW} axes={1} roleAxis={1} levelAxis={1} levels={() => 1} grid={1} />

      {FILLED.map((tokens, j) => {
        const placed = place(tokens, GRID_X + j * colW + colW / 2);
        const where = (id: string) => placed.find((p) => p.id === id && !p.backup);
        const colFade = show(0, 10 + j * 30) * (1 - 0.7 * (j === 1 ? dropped : 0));
        return (
          <React.Fragment key={j}>
            {/* Stage 1: servant → master links light up. */}
            <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
              {placed.filter((t) => t.master).map((t) => {
                const m = where(t.master!);
                return m && (
                  <line key={`${t.id}-${t.master}`} x1={t.x} y1={t.y} x2={m.x} y2={m.y} stroke={GREEN} strokeWidth={3}
                    opacity={colFade * (0.15 + 0.75 * show(1, 10, 20))} />
                );
              })}
            </svg>
            {placed.map((t, k) => <TokenDot key={k} t={t} opacity={colFade} glow={glow} />)}
          </React.Fragment>
        );
      })}

      {/* Stage 2: walls between the roles; no transfers across. */}
      {[1, 2, 3].filter((j) => j < 3 + grow - 0.01).map((j) => (
        <div key={j} style={{position: 'absolute', left: GRID_X + j * colW - 4, top: HEAD_Y - 40, width: 8, height: BOTTOM - HEAD_Y + 40,
          background: RED, borderRadius: 4, opacity: show(2, 10 + j * 8) * (j === 3 ? grow : 1)}} />
      ))}
      <div style={{position: 'absolute', left: GRID_X + colW - 60, top: rowY(4) - 30, width: 120, textAlign: 'center', fontSize: 40, color: RED,
        opacity: show(2, 40) * (1 - show(3))}}>
        <s>⇄ 💸</s>
      </div>

      {/* Stage 3: safe at the top, convenient at the bottom. */}
      <div style={{position: 'absolute', right: 6, top: TOP, fontSize: 32, color: BLUE, fontWeight: 700, writingMode: 'vertical-rl', opacity: show(3, 10)}}>
        安全 ▲
      </div>
      <div style={{position: 'absolute', right: 6, top: BOTTOM - 150, fontSize: 32, color: GREEN, fontWeight: 700, writingMode: 'vertical-rl', opacity: show(3, 30)}}>
        ▼ 便利
      </div>

      {/* Stage 4: the netizen series given up. */}
      <div style={{position: 'absolute', left: GRID_X + colW, width: colW, top: rowY(2) - 30, textAlign: 'center', fontSize: 36, color: RED, fontWeight: 700,
        transform: 'rotate(-20deg)', opacity: dropped}}>
        放弃
      </div>

      {/* Stage 5: the new role starts from a new master. */}
      <TokenDot t={{id: 'A', level: L('断网手机'), kind: 'master', x: GRID_X + 3 * colW + colW / 2, y: rowY(L('断网手机'))}} opacity={show(5, 40)} glow={glow} />

      {/* Stage 6. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: BOTTOM + 110, textAlign: 'center', fontSize: 48, color: theme.accent, fontWeight: 700, opacity: show(6, 20)}}>
        身份自由
      </div>
    </Stage>
  );
};
