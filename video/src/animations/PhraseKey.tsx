import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-01 S4: a key from a phrase. One stage per narration line:
//   0 密语 → 私钥
//   1 SHA256 once: the 32 bytes are the key
//   2 same phrase, anywhere, any time → the same key: remembering it is keeping the key (脑钱包)
//   3 whoever guesses the phrase owns the key: a dictionary of poems, 春花秋月何时了 hits
// The phrase is masked (no phrase on screen worth copying); the key is made-up digits, marked 示意.
const KEY = '9f3c07a1e85d42b6c1f0a7e3d95b2c48e6a1f70d3b9c25e84f1a6d0c7b3e92f5';
const GREEN = '#5BC98C';
const RED = '#E5686A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);

const Box: React.FC<{label: string; color?: string; opacity: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  label, color, opacity, children, style,
}) => (
  <div style={{background: theme.panel, borderRadius: 24, border: `4px solid ${color ?? '#2A3A55'}`, padding: '22px 30px', opacity, ...style}}>
    <div style={{fontSize: 40, color: theme.text, fontWeight: 600}}>{label}</div>
    {children}
  </div>
);

const Arrow: React.FC<{opacity: number; label?: string}> = ({opacity, label}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, height: 90, opacity, color: theme.accent, fontSize: 34}}>
    <div style={{fontSize: 60, lineHeight: 1}}>↓</div>
    {label && <div style={{fontFamily: 'Menlo, monospace', fontWeight: 700}}>{label}</div>}
  </div>
);

// The same stripes as the 遮挡 mask on recordings.
const Masked: React.FC<{shown: number}> = ({shown}) => (
  <div
    style={{
      marginTop: 14, height: 70, width: `${Math.round(100 * shown)}%`, borderRadius: 10,
      background: 'repeating-linear-gradient(45deg, #5B6170 0 14px, #6B7280 14px 28px)',
      color: '#FFFFFF', fontSize: 26, fontWeight: 700, letterSpacing: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}
  >
    一段长字符
  </div>
);

const Guess: React.FC<{text: string; hit: boolean; opacity: number}> = ({text, hit, opacity}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 40, opacity, marginTop: 12}}>
    <span style={{color: hit ? RED : theme.text}}>{text}</span>
    <span style={{color: hit ? RED : theme.muted}}>{hit ? '✓ 猜中' : '✕'}</span>
  </div>
);

export const PhraseKey: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;

  const tries = ['床前明月光', '白日依山尽', '海内存知己'];
  const hitAt = 20 + tries.length * 14;
  const lost = at(3) && since(3) > hitAt + 10;

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
          transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`,
        }}
      >
        <div style={{position: 'absolute', left: 90, right: 90, top: 170, display: 'flex', flexDirection: 'column'}}>
          <Box label="密语" opacity={fade(frame)}>
            <Masked shown={fade(frame - 10, 40)} />
          </Box>
          <Arrow opacity={at(0) ? fade(since(0) - 40) : 0} label={at(1) ? 'SHA256 · 哈希一次' : undefined} />
          <Box label="私钥（32 字节）" color={lost ? RED : at(2) ? GREEN : undefined} opacity={at(0) ? fade(since(0) - 55) : 0}>
            <div style={{fontFamily: 'Menlo, monospace', fontSize: 34, color: lost ? RED : theme.muted, wordBreak: 'break-all', lineHeight: 1.45, marginTop: 10, minHeight: 100}}>
              {at(1) ? KEY.slice(0, Math.round(KEY.length * fade(since(1) - 40, 50))) : ''}
            </div>
            {lost && <div style={{fontSize: 40, color: RED, fontWeight: 700, marginTop: 10}}>私钥归他了</div>}
          </Box>

          {/* Stage 2: computed again anywhere, any time: the same key. */}
          {at(2) && !at(3) && (
            <div style={{marginTop: 50, display: 'flex', flexDirection: 'column', gap: 18}}>
              {['换一部手机，再算一遍', '十年以后，再算一遍'].map((t, i) => (
                <div key={t} style={{display: 'flex', justifyContent: 'space-between', fontSize: 40, color: theme.text, opacity: fade(since(2) - 20 - i * 60)}}>
                  <span>{t}</span>
                  <span style={{color: GREEN}}>✓ 同一把私钥</span>
                </div>
              ))}
              <div style={{fontSize: 50, color: theme.accent, fontWeight: 700, textAlign: 'center', marginTop: 40, opacity: fade(since(2) - 190, 20)}}>
                记住密语 = 保存了私钥
              </div>
              <div style={{fontSize: 64, color: theme.accent, fontWeight: 700, textAlign: 'center', marginTop: 10, opacity: fade(since(2) - 260, 20)}}>
                脑钱包
              </div>
            </div>
          )}

          {/* Stage 3: someone else's dictionary of famous lines. */}
          {at(3) && (
            <div style={{marginTop: 50}}>
              <Box label="别人的字典：名句、诗句、歌词……" color={RED} opacity={fade(since(3))}>
                {tries.map((t, i) => (
                  <Guess key={t} text={t} hit={false} opacity={fade(since(3) - 20 - i * 14, 8)} />
                ))}
                <Guess text="春花秋月何时了" hit opacity={fade(since(3) - hitAt, 8)} />
              </Box>
            </div>
          )}
        </div>
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
