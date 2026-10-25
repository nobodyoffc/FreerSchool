import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-08 S4: the miser, one identity that only receives. One stage per narration line:
//   0 one identity holding a pile of cash, keeping quiet
//   1 dice make the key, the FID is worked out, the key is cut into A, B, C
//   2 steel plates AB, BC, CA kept in three places; lose one and the other two still make the key
//   3 cash flows in, nothing flows out; only the FID is on the chain, the public key locked away
//   4 even if the key algorithm breaks (public key → private key), the hash still guards it (FID ↛ public key)
//   5 a payment signed offline goes out; the rest moves to a new identity
// Identities are made up; marked 示意.
const MISER = 'FJarD4dtdHwdgvWHukphWPTC9FLjxcASLR';
const NEXT = 'FHgEFgbAcSG4veYQuFzboiomjAuoEj2j2u';
const PLACES = [
  {icon: '🏠', name: '自家', x: 185},
  {icon: '🏦', name: '银行保险柜', x: 540},
  {icon: '🏚️', name: '老宅地下', x: 895},
];
const SEGMENTS = [
  {name: 'A', color: '#F2B441'},
  {name: 'B', color: '#7FB2FF'},
  {name: 'C', color: '#F08DB4'},
];
const PLATES = [['A', 'B'], ['B', 'C'], ['C', 'A']];
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const STEEL = 'linear-gradient(135deg, #C9D1DC, #7D8896 60%, #B5BDC8)';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (t: number, len: number) => interpolate(t, [0, len], [0, 1], {...clamp, easing: (x) => 1 - (1 - x) * (1 - x)});
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const At: React.FC<{x: number; y: number; opacity: number; scale?: number; children: React.ReactNode}> = ({x, y, opacity, scale = 1, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, whiteSpace: 'nowrap'}}>{children}</div>
);

const Caption: React.FC<{top: number; opacity: number; color?: string; children: React.ReactNode}> = ({top, opacity, color = theme.text, children}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontSize: 42, color, fontWeight: 600, opacity}}>{children}</div>
);

// One segment of the split key.
const Segment: React.FC<{name: string; color: string; small?: boolean}> = ({name, color, small}) => (
  <div style={{padding: small ? '6px 12px' : '14px 26px', borderRadius: 12, background: '#1B2433', border: `3px solid ${color}`,
    fontSize: small ? 30 : 42, color, fontWeight: 800, letterSpacing: 2}}>
    {name} {small ? '██' : '███'}
  </div>
);

// A box in the key → public key → FID chain.
const Link: React.FC<{label: string; color: string}> = ({label, color}) => (
  <div style={{padding: '18px 26px', borderRadius: 18, background: theme.panel, border: `3px solid ${color}`, fontSize: 36, color, fontWeight: 700}}>{label}</div>
);

export const Miser: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const only = (i: number) => stage === i;
  const show = (i: number, delay = 0, len = 12) => (stage >= i ? fade(since(i) - delay, len) : 0);
  const go = (i: number, delay: number, len = 30) => (stage >= i ? ease(since(i) - delay, len) : 0);

  // Stage 1: dice, key, FID, then the key splits into A, B, C.
  const t1 = (p: number) => p * (scene.lines[1]?.frames ?? 200);
  const split = go(1, t1(0.65), 20);
  // Stage 2: plates AB, BC, CA fly to three places; one is lost, the other two still make the key.
  const t2 = (p: number) => p * (scene.lines[2]?.frames ?? 300);
  const fly = go(2, 10, 40);
  const lost = show(2, t2(0.55), 12);
  const join = go(2, t2(0.65), 25);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          💰 守财奴
        </div>

        {/* Stage 0: one identity, a pile of cash, quiet. */}
        {only(0) && (
          <>
            <At x={540} y={760} opacity={fade(frame)}>
              <div style={{padding: '30px 50px', borderRadius: 26, background: theme.panel, border: `4px solid ${theme.accent}`, textAlign: 'center'}}>
                <FidAvatar fid={MISER} size={160} />
                <div style={{fontSize: 34, color: theme.accent, fontWeight: 700, marginTop: 10}}>一个身份</div>
              </div>
            </At>
            <At x={800} y={620} opacity={fade(frame - 20)}><div style={{fontSize: 90}}>🤫</div></At>
            <At x={540} y={1110} opacity={fade(frame - 35)}><div style={{fontSize: 110}}>💰💰💰</div></At>
            <Caption top={1260} opacity={fade(frame - 55)} color={theme.muted}>不让别人知道钱是谁的</Caption>
          </>
        )}

        {/* Stage 1: dice → key → FID; the key splits into three segments. */}
        {only(1) && (
          <>
            <At x={110} y={460} opacity={show(1)} scale={1 + 0.1 * Math.sin(Math.min(since(1), 40) / 3)}>
              <div style={{fontSize: 100, transform: `rotate(${Math.min(since(1), 40) * 12}deg)`}}>🎲</div>
            </At>
            <At x={540} y={460} opacity={show(1, 30)}>
              <div style={{padding: '16px 26px', borderRadius: 14, background: '#2A1F10', border: `3px solid ${theme.accent}`, fontSize: 34, color: theme.accent, letterSpacing: 4}}>
                🔑 ████████
              </div>
            </At>
            <At x={900} y={460} opacity={show(1, t1(0.35))}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <span style={{fontSize: 40, color: theme.muted}}>→</span>
                <FidAvatar fid={MISER} size={90} />
                <span style={{fontSize: 30, color: theme.text}}>FID</span>
              </div>
            </At>
            {SEGMENTS.map((g, k) => (
              <At key={g.name} x={540 + (k - 1) * 230 * split} y={lerp(split, 460, 820)} opacity={split}>
                <Segment name={g.name} color={g.color} />
              </At>
            ))}
            <Caption top={1000} opacity={show(1, t1(0.8))} color={theme.accent}>切成三段</Caption>
          </>
        )}

        {/* Stage 2: plates AB, BC, CA in three places; any two make the key. */}
        {only(2) && (
          <>
            {PLACES.map((p, k) => {
              const gone = k === 2 ? lost : 0;
              const x0 = 540 + (k - 1) * 355;
              return (
                <React.Fragment key={p.name}>
                  <At x={lerp(fly, x0, p.x)} y={lerp(fly, 420, 640)} opacity={show(2) * (1 - 0.7 * gone)}>
                    <div style={{width: 320, height: 130, borderRadius: 10, background: STEEL, border: '2px solid #E6EBF2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                      {PLATES[k].map((n) => <Segment key={n} name={n} color={SEGMENTS.find((g) => g.name === n)!.color} small />)}
                    </div>
                  </At>
                  <At x={p.x} y={830} opacity={show(2, 20 + k * 10) * (1 - 0.7 * gone)}>
                    <div style={{textAlign: 'center'}}>
                      <div style={{fontSize: 90}}>{p.icon}</div>
                      <div style={{fontSize: 32, color: theme.text}}>{p.name}</div>
                    </div>
                  </At>
                  {k === 2 && <At x={p.x} y={720} opacity={lost}><div style={{fontSize: 160, color: RED}}>✗</div></At>}
                </React.Fragment>
              );
            })}
            {/* The two plates left make all three segments. */}
            <At x={540} y={1120} opacity={show(2, t2(0.65))}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                {SEGMENTS.map((g, k) => (
                  <div key={g.name} style={{transform: `translateX(${(1 - join) * (k - 1) * 60}px)`}}><Segment name={g.name} color={g.color} /></div>
                ))}
                <span style={{fontSize: 70, color: GREEN, marginLeft: 20, opacity: show(2, t2(0.65) + 25)}}>✓</span>
              </div>
            </At>
            <Caption top={1260} opacity={show(2, t2(0.7))} color={GREEN}>任意两处，拼出完整私钥</Caption>
          </>
        )}

        {/* Stage 3: cash only flows in; only the FID is on the chain. */}
        {only(3) && (
          <>
            {[0, 1, 2, 3].map((k) => {
              const p = ((since(3) - k * 18) % 70) / 70;
              return since(3) > k * 18 && (
                <At key={k} x={lerp(p, 120, 440)} y={760} opacity={Math.sin(Math.PI * p)}><div style={{fontSize: 56}}>💵</div></At>
              );
            })}
            <At x={180} y={640} opacity={show(3)}><div style={{fontSize: 32, color: GREEN}}>只收</div></At>
            <At x={540} y={760} opacity={1}>
              <div style={{padding: '26px 40px', borderRadius: 26, background: theme.panel, border: `4px solid ${theme.accent}`, textAlign: 'center'}}>
                <FidAvatar fid={MISER} size={130} />
                <div style={{fontSize: 30, color: theme.text, marginTop: 8}}>FID ✓ 在链上</div>
                <div style={{fontSize: 30, color: BLUE, marginTop: 6, opacity: show(3, 40)}}>公钥 🔒 未暴露</div>
              </div>
            </At>
            <At x={860} y={760} opacity={show(3, 20)}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 70, color: RED}}><s>→ 💵</s></div>
                <div style={{fontSize: 32, color: RED}}>从不付款</div>
              </div>
            </At>
          </>
        )}

        {/* Stage 4: break the key algorithm — still no way from the FID back to the public key. */}
        {only(4) && (
          <>
            <At x={540} y={480} opacity={show(4)}><Link label="🔑 私钥" color={theme.accent} /></At>
            <At x={540} y={800} opacity={show(4, 5)}><Link label="公钥" color={BLUE} /></At>
            <At x={540} y={1120} opacity={show(4, 10)}><Link label="FID（链上）" color={GREEN} /></At>
            {/* public key → private key: broken. */}
            <At x={540} y={640} opacity={show(4, 30)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <span style={{fontSize: 60, color: RED}}>↑</span>
                <span style={{fontSize: 30, color: RED}}>算法被破解</span>
                <span style={{fontSize: 60, transform: `rotate(${-30 + 40 * go(4, 30, 15)}deg)`, display: 'inline-block'}}>🔨</span>
              </div>
            </At>
            {/* FID → public key: the hash still holds. */}
            <At x={540} y={960} opacity={show(4, 70)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <span style={{fontSize: 60, color: GREEN}}>⤒</span>
                <span style={{fontSize: 30, color: GREEN}}>哈希推不回去，没有公钥 🛡️</span>
              </div>
            </At>
            <Caption top={1290} opacity={show(4, 100)} color={GREEN}>从 FID 推不出私钥</Caption>
          </>
        )}

        {/* Stage 5: pay once, signed offline; move the rest to a new identity. */}
        {only(5) && (
          <>
            <At x={250} y={620} opacity={show(5)}>
              <div style={{padding: '22px 30px', borderRadius: 30, background: theme.panel, border: `4px solid ${theme.muted}`, textAlign: 'center'}}>
                <div style={{fontSize: 30, color: RED}}><s>📶</s> 断网</div>
                <div style={{fontSize: 70}}>✍️</div>
                <div style={{fontSize: 30, color: theme.text}}>离线签名</div>
              </div>
            </At>
            <At x={540} y={940} opacity={1}>
              <div style={{padding: 20, borderRadius: 22, background: theme.panel, border: `3px solid ${theme.muted}`, opacity: 1 - 0.5 * go(5, 90, 20)}}>
                <FidAvatar fid={MISER} size={110} />
              </div>
            </At>
            <At x={lerp(go(5, 40, 30), 540, 200)} y={lerp(go(5, 40, 30), 940, 1220)} opacity={show(5, 40) * (1 - show(5, 70))}>
              <div style={{fontSize: 56}}>💵</div>
            </At>
            <At x={200} y={1260} opacity={show(5, 60)}><div style={{fontSize: 32, color: theme.muted}}>付款</div></At>
            <At x={lerp(go(5, 90, 40), 540, 860)} y={940} opacity={show(5, 90) * (1 - go(5, 130, 10))}><div style={{fontSize: 70}}>💰</div></At>
            <At x={860} y={940} opacity={show(5, 100)}>
              <div style={{padding: 20, borderRadius: 22, background: theme.panel, border: `4px solid ${theme.accent}`, textAlign: 'center'}}>
                <FidAvatar fid={NEXT} size={110} />
                <div style={{fontSize: 28, color: theme.accent, fontWeight: 700}}>新身份 🔒</div>
              </div>
            </At>
            <Caption top={1350} opacity={show(5, 140)} color={theme.accent}>余额转入新身份冷存</Caption>
          </>
        )}

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
