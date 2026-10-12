import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U1-02 S2: private key → public key → FID, one way only. One stage per narration line.
// The FID is a test FID derived from a fixed string (nobody holds its key); the keys
// shown are made-up digits, marked 示意.
const FID = 'FMXQSxcSJZu3ykm8mgucZT7d29mKQb3ZNL';
const PRIKEY = '7c1f9a04e2d85b36c0a1f7e94d2b6038a5c9e1f20d47b8a36e5f9c02b1d7a48e';
const PUBKEY = '03a9e4c71b058f2d63e7a1c94b0d82f5e3a6c9170b4d2e8f51a3c6e9d07b2f4a18';
const GREEN = '#5BC98C';
const RED = '#E5686A';

type Rect = {x: number; y: number; w: number; h: number};

// Where everything goes: three boxes in a row (landscape) or a column (portrait).
const LAYOUTS = {
  landscape: {
    boxes: [{x: 100, y: 300, w: 480, h: 300}, {x: 720, y: 300, w: 480, h: 300}, {x: 1340, y: 300, w: 480, h: 300}],
    arrows: [{x: 605, y: 400, down: false}, {x: 1225, y: 400, down: false}],
    // Way back, one per gap: FID → 公钥, 公钥 → 私钥.
    backs: [{x: 1225, y: 500, down: false}, {x: 605, y: 500, down: false}],
    backLabel: {x: 0, y: 700},
    conclusion: 150,
  },
  portrait: {
    boxes: [{x: 90, y: 250, w: 760, h: 300}, {x: 90, y: 700, w: 760, h: 300}, {x: 90, y: 1150, w: 760, h: 300}],
    arrows: [{x: 380, y: 575, down: true}, {x: 380, y: 1025, down: true}],
    backs: [{x: 600, y: 1025, down: true}, {x: 600, y: 575, down: true}],
    backLabel: {x: 0, y: 1500},
    conclusion: 110,
  },
};

const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Box: React.FC<{label: string; at: Rect; opacity: number; glow?: number; children?: React.ReactNode}> = ({
  label, at, opacity, glow = 0, children,
}) => (
  <div
    style={{
      position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, opacity,
      background: theme.panel, borderRadius: 24, padding: 32, boxSizing: 'border-box',
      border: `4px solid ${glow ? theme.accent : '#2A3A55'}`,
      boxShadow: glow ? `0 0 ${60 * glow}px rgba(242,180,65,${0.5 * glow})` : 'none',
    }}
  >
    <div style={{fontSize: 44, color: theme.text, fontWeight: 600, marginBottom: 20}}>{label}</div>
    {children}
  </div>
);

// A triangular arrowhead drawn with borders, so its tip sits exactly on the shaft's centre line.
// (cx, cy) is the middle of the head's base; it points in `dir`.
const Head: React.FC<{cx: number; cy: number; dir: 'right' | 'left' | 'up'; color: string; size?: number}> = ({cx, cy, dir, color, size = 16}) => {
  const long = size * 1.6;
  const t = 'transparent';
  const style: React.CSSProperties =
    dir === 'right'
      ? {left: cx, top: cy - size, borderTop: `${size}px solid ${t}`, borderBottom: `${size}px solid ${t}`, borderLeft: `${long}px solid ${color}`}
      : dir === 'left'
        ? {left: cx - long, top: cy - size, borderTop: `${size}px solid ${t}`, borderBottom: `${size}px solid ${t}`, borderRight: `${long}px solid ${color}`}
        : {left: cx - size, top: cy - long, borderLeft: `${size}px solid ${t}`, borderRight: `${size}px solid ${t}`, borderBottom: `${long}px solid ${color}`};
  return <div style={{position: 'absolute', width: 0, height: 0, ...style}} />;
};

const Arrow: React.FC<{x: number; y: number; down: boolean; progress: number; color: string; label?: string}> = ({
  x, y, down, progress, color, label,
}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity: progress > 0 ? 1 : 0, transform: down ? 'rotate(90deg)' : undefined, transformOrigin: '0 0'}}>
    <div style={{height: 8, width: 90 * progress, background: color, borderRadius: 4}} />
    <Head cx={86 * progress} cy={4} dir="right" color={color} />
    {label && (
      <div style={{position: 'absolute', top: down ? -84 : 24, left: down ? 10 : -10, width: 140, fontSize: 26, color, textAlign: 'center', transform: down ? 'rotate(-90deg)' : undefined}}>
        {label}
      </div>
    )}
  </div>
);

// A dashed red arrow against the forward one, struck out: this way cannot be computed.
const BackArrow: React.FC<{x: number; y: number; down: boolean; opacity: number}> = ({x, y, down, opacity}) => (
  <div style={{position: 'absolute', left: x, top: y, width: down ? 8 : 100, height: down ? 100 : 8, opacity}}>
    <div style={{position: 'absolute', inset: 0, ...(down ? {borderLeft: `6px dashed ${RED}`} : {borderTop: `6px dashed ${RED}`})}} />
    {down ? <Head cx={3} cy={2} dir="up" color={RED} size={14} /> : <Head cx={2} cy={3} dir="left" color={RED} size={14} />}
    <div
      style={{
        position: 'absolute', fontSize: 52, color: RED, lineHeight: 1, background: theme.bg,
        ...(down ? {left: -21, top: 22, padding: '2px 0'} : {left: 28, top: -27, padding: '0 4px'}),
      }}
    >
      ✕
    </div>
    <div style={{position: 'absolute', fontSize: 26, color: RED, whiteSpace: 'nowrap', ...(down ? {left: 30, top: 32} : {left: 5, top: 28})}}>
      算不出
    </div>
  </div>
);

const Hex: React.FC<{text: string; shown: number}> = ({text, shown}) => (
  <div style={{fontFamily: 'Menlo, monospace', fontSize: 24, color: theme.muted, wordBreak: 'break-all', lineHeight: 1.5}}>
    {text.slice(0, Math.round(text.length * shown))}
  </div>
);

export const KeyDerivation: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const L = usePortrait() ? LAYOUTS.portrait : LAYOUTS.landscape;
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const arrowColor = at(3) ? GREEN : theme.accent;
  const arrowLabel = at(3) ? '能算出' : undefined;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <Box label="私钥" at={L.boxes[0]} opacity={fade(frame)} glow={at(4) ? fade(since(4), 20) : 0}>
        {at(1) && <Hex text={PRIKEY} shown={fade(since(1), 40)} />}
        {at(1) && <div style={{position: 'absolute', bottom: 20, right: 28, fontSize: 26, color: theme.accent}}>只有你知道</div>}
      </Box>
      <Arrow {...L.arrows[0]} progress={at(2) ? fade(since(2), 15) : 0} color={arrowColor} label={arrowLabel} />
      <Box label="公钥" at={L.boxes[1]} opacity={fade(frame)}>
        {at(2) && <Hex text={PUBKEY} shown={fade(since(2) - 10, 30)} />}
      </Box>
      <Arrow {...L.arrows[1]} progress={at(2) ? fade(since(2) - 40, 15) : 0} color={arrowColor} label={arrowLabel} />
      <Box label="FID" at={L.boxes[2]} opacity={at(2) ? fade(since(2) - 55) : 0}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{borderRadius: '50%', overflow: 'hidden', flexShrink: 0}}>
            <FidAvatar fid={FID} size={110} />
          </div>
          <div style={{fontFamily: 'Menlo, monospace', fontSize: 26, color: theme.text, wordBreak: 'break-all'}}>{FID}</div>
        </div>
      </Box>

      {/* The way back does not exist: FID ✕→ 公钥, then 公钥 ✕→ 私钥. */}
      {at(3) && (
        <>
          <BackArrow {...L.backs[0]} opacity={fade(since(3) - 45)} />
          <BackArrow {...L.backs[1]} opacity={fade(since(3) - 75)} />
          <div style={{position: 'absolute', left: 0, right: 0, top: L.backLabel.y, fontSize: 34, color: RED, textAlign: 'center', opacity: fade(since(3) - 95)}}>
            从 FID 算不出私钥
          </div>
        </>
      )}

      {at(4) && (
        <div style={{position: 'absolute', top: L.conclusion, left: 0, right: 0, textAlign: 'center', fontSize: 56, color: theme.accent, opacity: fade(since(4), 20)}}>
          私钥在谁手里，身份就属于谁
        </div>
      )}
      <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
    </AbsoluteFill>
  );
};
