import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-18 S3: the parameters set when a token is deployed. One stage per narration line:
//   0 the parameters: five rows appear
//   1 capacity: the most that can be issued
//   2 decimal places: how fine it divides
//   3 transferable
//   4 closable
//   5 open issue: anyone may issue by the rules, else only the deployer (a 发行 button under each person, lit or not)
//   6 with open issue, three limits
//   7 anyone can design rules like these and deploy a token of their own
// The right column is the graduation certificate S6 deploys.
const NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
// Tom, and two made-up FIDs (as in other animations) that are nobody's.
const OTHERS = ['FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4', 'FCm9Pz4Qx7Wv2Ut5Sr8Qp3Pn6Mm1Lk4Jj7', 'FBr3Tq8wNz5Xc2Vb7Mn4Lk9Jh6Gf3Ds2A1'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

const FORM_X = 70;
const FORM_W = 940;
const ROW_Y = 300;
const ROW_H = 120;
const ROWS = [
  {name: '容量', note: '最大发行数量', value: '不设'},
  {name: '小数位', note: '精度', value: '0'},
  {name: '可转让', note: '能否转给他人', value: '✗'},
  {name: '可关闭', note: '能否关闭', value: '✓'},
  {name: '开放发行', note: '任何人可按规则发行', value: '✗'},
];
const LIMITS = ['每次发行最大数量', '每次发行最小币天销毁', '每个地址最大发行次数'];
const DEMO_Y = 1180;

export const TokenParams: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const only = (i: number, j: number) => show(i) * (at(j) ? 1 - fade(since(j), 10) : 1);

  // The row being talked about: row r at stage r + 1; the open-issue row stays lit for its limits.
  const lit = (r: number) => stage === r + 1 || (r === 4 && stage === 6);
  const limitsOpen = show(6);
  // Stage 2: 1 → 0.1 → 0.01.
  const decimals = ['1', '0.1', '0.01'];
  const decimalStep = at(2) ? Math.min(2, Math.floor(Math.max(since(2) - 20, 0) / 30)) : 0;
  // Stage 3/4: a switch flips on and off.
  const flip = (i: number) => (at(i) ? (Math.floor(Math.max(since(i) - 20, 0) / 35) % 2 === 0 ? 1 : 0) : 0);
  // Stage 5: the open-issue switch, on at "任何人" (1.7 s into the line), off at "否则" (4.2 s); on again for stage 6.
  const open = stage >= 6 || (stage === 5 && since(5) >= 50 && since(5) < 127);
  const fill = at(1) ? ease((since(1) - 15) / 50) : 0;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          部署参数
        </div>
        <div style={{position: 'absolute', left: FORM_X + 640, width: 300, top: ROW_Y - 60, textAlign: 'center', fontSize: 26, color: theme.muted, opacity: show(0, 70) * (1 - show(7))}}>
          飞人学堂毕业证
        </div>

        {/* The form: five rows, then three limits under open issue. */}
        <div style={{opacity: 1 - show(7)}}>
          {ROWS.map((r, i) => (
            <div key={r.name} style={{position: 'absolute', left: FORM_X, top: ROW_Y + i * ROW_H, width: FORM_W, height: ROW_H - 16, borderRadius: 14,
              background: lit(i) ? 'rgba(242, 180, 65, 0.25)' : theme.panel, display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box',
              opacity: show(0, i * 10)}}>
              <div style={{fontSize: 40, color: theme.text, fontWeight: 600, width: 220}}>{r.name}</div>
              <div style={{fontSize: 30, color: theme.muted, width: 400, opacity: at(i + 1) ? 1 : 0.0}}>{r.note}</div>
              <div style={{fontSize: 36, color: theme.accent, width: 260, textAlign: 'center', opacity: show(0, 70)}}>{r.value}</div>
            </div>
          ))}
          {LIMITS.map((l, i) => (
            <div key={l} style={{position: 'absolute', left: FORM_X + 80, top: ROW_Y + 5 * ROW_H + i * 80, width: FORM_W - 80, height: 66, borderRadius: 12,
              border: `3px solid ${theme.muted}`, display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box',
              fontSize: 30, color: theme.text, opacity: limitsOpen * fade(since(6) - i * 20)}}>{l}</div>
          ))}
        </div>

        {/* Below the form, a small picture for the row being talked about. */}
        {/* Stage 1: circulation fills up to the capacity. */}
        <div style={{position: 'absolute', left: 140, width: 800, top: DEMO_Y + 60, opacity: only(1, 2)}}>
          <div style={{height: 60, borderRadius: 30, background: theme.panel, border: `4px solid ${theme.muted}`, overflow: 'hidden'}}>
            <div style={{width: `${fill * 100}%`, height: '100%', background: theme.accent}} />
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, color: theme.muted, marginTop: 14}}>
            <span>流通量</span><span>容量（上限）</span>
          </div>
        </div>
        {/* Stage 2: finer and finer. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: DEMO_Y + 40, textAlign: 'center', fontSize: 110, fontWeight: 700, color: theme.accent,
          fontFamily: 'Menlo, monospace', opacity: only(2, 3)}}>{decimals[decimalStep]}</div>
        {/* Stage 3, 4: a switch. */}
        {[3, 4].map((s) => (
          <div key={s} style={{position: 'absolute', left: 0, right: 0, top: DEMO_Y + 60, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 40, opacity: only(s, s + 1)}}>
            <div style={{fontSize: 48, color: theme.text}}>{s === 3 ? '转让' : '关闭'}</div>
            <div style={{width: 160, height: 84, borderRadius: 42, background: flip(s) ? theme.accent : '#55627A', position: 'relative'}}>
              <div style={{position: 'absolute', top: 8, left: flip(s) ? 84 : 8, width: 68, height: 68, borderRadius: 34, background: '#fff'}} />
            </div>
            <div style={{fontSize: 40, color: flip(s) ? theme.accent : theme.muted, width: 120}}>{flip(s) ? '允许' : '不许'}</div>
          </div>
        ))}
        {/* Stage 5: who may issue. The switch turns on at "任何人" and every 发行 button lights; at "否则" it turns off and only the
            deployer's stays lit. Stage 6 (with open issue) turns it back on. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: DEMO_Y, height: 420, opacity: show(5) * (1 - show(7))}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30}}>
            <div style={{fontSize: 40, color: theme.text}}>开放发行</div>
            <div style={{width: 140, height: 74, borderRadius: 37, background: open ? theme.accent : '#55627A', position: 'relative'}}>
              <div style={{position: 'absolute', top: 7, left: open ? 73 : 7, width: 60, height: 60, borderRadius: 30, background: '#fff'}} />
            </div>
            <div style={{fontSize: 34, color: open ? theme.accent : theme.muted, width: 300}}>{open ? '任何人都能发行' : '只有部署者能发行'}</div>
          </div>
          {[NAVIGATOR, ...OTHERS].map((fid, i) => {
            const can = open || i === 0;
            return (
              <div key={fid} style={{position: 'absolute', left: 120 + i * 220, top: 120, width: 180, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 10}}>
                <FidAvatar fid={fid} size={100} />
                <div style={{fontSize: 24, color: theme.muted, height: 30}}>{i === 0 ? '部署者' : ''}</div>
                <div style={{width: 150, height: 64, borderRadius: 14, background: can ? theme.accent : theme.panel,
                  border: `3px solid ${can ? theme.accent : '#55627A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 700, color: can ? '#222' : '#55627A'}}>{can ? '发行' : '✗ 发行'}</div>
              </div>
            );
          })}
        </div>
        {/* Stage 7: many people, many tokens. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, padding: '0 60px',
          opacity: show(7)}}>
          {[NAVIGATOR, ...OTHERS].map((fid, i) => (
            <div key={fid} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: show(7, 15 + i * 15)}}>
              <FidAvatar fid={fid} size={110} />
              <div style={{width: 190, height: 120, borderRadius: 14, background: '#F4F1E8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 700, color: '#333'}}>{['毕业证', '积分', '会员卡', '门票'][i]}</div>
            </div>
          ))}
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
