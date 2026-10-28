import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-13 S2: files, DID, HAT and DISK. One stage per narration line:
//   0 a person has a FID; a file gets an ID too, its DID
//   1 the DID comes from the content: change one pixel and the whole DID changes
//   2 pick a DISK you trust (servers with on-chain credit stars); the file goes up
//   3 ask DISK for the DID and the file comes back; storing and fetching are both charged
//   4 inside DISK: slots by DID, no idea what anything is
//   5 a HAT (hat-shaped card) describes the file: name, type, note, size, DID
//   6 a file fetched from DISK finds its HAT by DID
//   7 the HATs are copied out as a backup
//   8 anyone holding the DID can fetch the file as it is
//   9 so 飞人 locks the file with a random key into a cipher file before upload
//  10 a public work goes up unencrypted and is shared freely
//  11 the cipher file has its own DID; the file's HAT records it
//  12 download: fetch the cipher file, unlock it, the picture is back
//  13 an important file kept on two DISKs
//  14 sharing in chat sends only the HAT; the other side fetches and unlocks
const LEFT = 280;
const RIGHT = 800;
const TOP = 300;
const PANEL_H = 1020;
const GREEN = '#5BC98C';
const BLUE = '#7FB2FF';
const RED = '#E5686A';
const PAPER = '#F4F1E8';
const DID = '3f9a…c21e';
const DID2 = '71c0…e94b';
const CDID = '8b07…4d5a';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

const Tag: React.FC<{text: string; color?: string; size?: number}> = ({text, color = theme.accent, size = 28}) => (
  <div style={{display: 'inline-block', padding: '6px 14px', borderRadius: 10, border: `3px solid ${color}`, color, fontSize: size,
    fontFamily: 'Menlo, monospace', whiteSpace: 'nowrap', background: theme.bg}}>{text}</div>
);

// The demo picture: the Freecash wallpaper, a dark-blue square with a constellation of dots.
const Picture: React.FC<{size: number; dot?: number}> = ({size, dot = 0}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', borderRadius: 10}}>
    <rect width="100" height="100" fill="#0B2A3F" />
    <path d="M10 70 L30 40 L52 58 L70 22 L90 48 M30 40 L70 22 M52 58 L90 48 M10 70 L52 58" stroke="#58B6D8" strokeWidth="1.5" fill="none" />
    {[[10, 70], [30, 40], [52, 58], [70, 22], [90, 48]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#BFE9F7" />)}
    <text x="50" y="88" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">FREECASH</text>
    {dot > 0 && <rect x="78" y="76" width="8" height="8" fill={RED} opacity={dot} />}
  </svg>
);

const Cipher: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: 10, background: '#2A2F3A', color: '#8A93A6', fontSize: size / 6, lineHeight: 1.05,
    fontFamily: 'Menlo, monospace', overflow: 'hidden', padding: 6, wordBreak: 'break-all', boxSizing: 'border-box'}}>
    ▓░▒#%▒░▓&▒▓░*▒#▓░▒%▓▒░#▒▓░▒&▓░
  </div>
);

const Hat: React.FC<{rows: [string, string][]; hi?: number; hiOn?: number; width?: number}> = ({rows, hi = -1, hiOn = 0, width = 380}) => (
  <div style={{width, borderRadius: 18, background: PAPER, color: '#222', padding: '14px 20px 18px', boxSizing: 'border-box'}}>
    <div style={{fontSize: 34, fontWeight: 700, textAlign: 'center'}}>🎩 HAT</div>
    {rows.map(([k, v], i) => (
      <div key={k} style={{display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 25, marginTop: 8, padding: '2px 6px', borderRadius: 6,
        background: i === hi ? `rgba(242,180,65,${0.45 * hiOn})` : 'transparent'}}>
        <span style={{color: '#8A8F98'}}>{k}</span><span style={{fontFamily: /DID/.test(k) ? 'Menlo, monospace' : undefined}}>{v}</span>
      </div>
    ))}
  </div>
);

const Panel: React.FC<{x: number; title: string; color?: string; opacity: number; top?: number; height?: number; width?: number}> =
  ({x, title, color = BLUE, opacity, top = TOP, height = PANEL_H, width = 420}) => (
    <div style={{position: 'absolute', left: x - width / 2, top, width, height, borderRadius: 36, background: theme.panel, border: `5px solid ${color}`, opacity}}>
      <div style={{position: 'absolute', top: 22, left: 0, right: 0, textAlign: 'center', fontSize: 38, color: theme.text, fontWeight: 700}}>{title}</div>
    </div>
  );

// Something moving between two points along a small arc.
const Fly: React.FC<{from: [number, number]; to: [number, number]; p: number; lift?: number; children: React.ReactNode}> = ({from, to, p, lift = 120, children}) => {
  if (p <= 0 || p >= 1) return null;
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p - Math.sin(Math.PI * p) * lift;
  return <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)'}}>{children}</div>;
};

const Text: React.FC<{top: number; color?: string; opacity: number; size?: number; children: React.ReactNode}> = ({top, color = theme.text, opacity, size = 38, children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontSize: size, color, fontWeight: 700, opacity}}>{children}</div>
);

// DISK slots, two columns: [DID label, content].
const SLOT_X = [RIGHT - 95, RIGHT + 95];
const slotPos = (i: number): [number, number] => [SLOT_X[i % 2], TOP + 200 + Math.floor(i / 2) * 190];
const Slot: React.FC<{i: number; label: string; children?: React.ReactNode; opacity?: number; hi?: number}> = ({i, label, children, opacity = 1, hi = 0}) => {
  const [x, y] = slotPos(i);
  return (
    <div style={{position: 'absolute', left: x - 85, top: y - 80, width: 170, height: 160, borderRadius: 14, background: '#121E33',
      border: `3px solid ${hi > 0 ? theme.accent : theme.muted}`, opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
      <div style={{height: 90, display: 'flex', alignItems: 'center'}}>{children}</div>
      <div style={{fontSize: 20, color: theme.muted, fontFamily: 'Menlo, monospace'}}>{label}</div>
    </div>
  );
};

export const DiskHat: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const only = (i: number, out = 10) => (stage === i ? fade(since(i)) : stage === i + 1 ? 1 - fade(since(i + 1), out) : 0);
  const during = (a: number, b: number) => (stage >= a && stage <= b ? (stage === a ? fade(since(a)) : 1) : stage === b + 1 ? 1 - fade(since(b + 1), 10) : 0);

  // The phone and DISK panels stay from stage 3 to 12; stage 2 picks the DISK.
  const panels = during(2, 12);
  const disk = during(3, 12);
  const phoneImg: [number, number] = [LEFT, TOP + 220];
  const hatRows = (cipher: boolean): [string, string][] => [
    ['名称', '壁纸.jpg'], ['类型', 'image/jpeg'], ['说明', 'Freecash 壁纸'], ['大小', '2.2 MB'], ['DID', DID],
    ...(cipher ? [['密文 DID', CDID] as [string, string]] : []),
  ];
  const hatOn = at(5) && stage <= 12;
  const cipherInDisk = at(9);

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          文件、DID、HAT 与 DISK
        </div>

        {/* Stage 0: a person has a FID, a file has a DID. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: TOP + 160, display: 'flex', justifyContent: 'center', gap: 120, opacity: only(0)}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24}}>
            <div style={{fontSize: 170}}>🧑</div>
            <Tag text="FID F…9yw4" color={BLUE} size={34} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, opacity: fade(since(0) - 30)}}>
            <Picture size={200} />
            <Tag text="DID" size={34} />
          </div>
        </div>
        <Text top={TOP + 620} opacity={only(0) * fade(since(0) - 50)}>人有 FID，文件有 DID</Text>

        {/* Stage 1: the DID comes from the content. */}
        {(() => {
          const changed = fade(since(1) - 70, 6);
          return (
            <div style={{opacity: only(1)}}>
              <div style={{position: 'absolute', left: 540 - 140, top: TOP + 120}}><Picture size={280} dot={fade(since(1) - 60, 6)} /></div>
              <div style={{position: 'absolute', left: 540, top: TOP + 440, fontSize: 44, color: theme.muted, transform: 'translateX(-50%)'}}>↓ 双重 SHA256</div>
              <div style={{position: 'absolute', left: 0, right: 0, top: TOP + 530, textAlign: 'center'}}>
                <Tag text={`DID ${changed > 0.5 ? DID2 : DID}`} color={changed > 0.5 ? RED : theme.accent} size={44} />
              </div>
              <Text top={TOP + 680} opacity={fade(since(1) - 60)} color={RED}>改一个像素，DID 全变</Text>
            </div>
          );
        })()}

        <Panel x={LEFT} title="📱 手机" opacity={panels} />
        {/* Stage 2: DISK servers with on-chain credit; pick one. */}
        {[['DISK A', '★★★★★'], ['DISK B', '★★★☆☆'], ['DISK C', '★★☆☆☆']].map(([name, stars], i) => (
          <div key={name} style={{position: 'absolute', left: RIGHT - 210, top: TOP + i * 220, width: 420, height: 180, borderRadius: 26, background: theme.panel,
            border: `5px solid ${i === 0 ? GREEN : theme.muted}`, opacity: only(2) * (i === 0 ? 1 : 1 - 0.6 * fade(since(2) - 50)),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8}}>
            <div style={{fontSize: 40, color: theme.text, fontWeight: 700}}>🗄️ {name}</div>
            <div style={{fontSize: 34, color: theme.accent}}>{stars}</div>
          </div>
        ))}
        <Text top={TOP + 700} opacity={only(2) * fade(since(2) - 20)} size={30} color={theme.muted}><span style={{marginLeft: 520}}>链上信用</span></Text>
        <Fly from={phoneImg} to={[RIGHT, TOP + 90]} p={stage === 2 ? ease((since(2) - 60) / 35) : 0}><Picture size={110} /></Fly>

        <Panel x={RIGHT} title="🗄️ DISK" color={GREEN} opacity={disk} />

        {/* The picture and its DID in the phone, until it is locked at stage 9. */}
        <div style={{position: 'absolute', left: LEFT - 75, top: TOP + 110, opacity: panels * (stage === 9 ? 1 - fade(since(9) - 30, 10) : 1)}}>
          {(stage < 9 || stage === 12) && <Picture size={150} />}
        </div>
        <div style={{position: 'absolute', left: 0, width: LEFT * 2, top: TOP + 280, textAlign: 'center', opacity: panels * (stage < 9 ? 1 : 0)}}>
          <Tag text={`DID ${DID}`} size={26} />
        </div>

        {/* DISK slots. */}
        <div style={{opacity: disk}}>
          <Slot i={0} label={DID} hi={stage === 3 || stage === 6 || stage === 8 ? 1 : 0}><Picture size={86} /></Slot>
          <Slot i={1} label="c5d2…07aa"><Cipher size={86} /></Slot>
          <Slot i={2} label="19ee…b310"><Cipher size={86} /></Slot>
          <Slot i={3} label={CDID} opacity={cipherInDisk ? (stage === 9 ? fade(since(9) - 95) : 1) : 0} hi={stage === 11 || stage === 12 ? 1 : 0}><Cipher size={86} /></Slot>
          <Slot i={4} label="a41c…5e02" opacity={at(10) ? (stage === 10 ? fade(since(10) - 55) : 1) : 0}><div style={{fontSize: 64}}>📜</div></Slot>
        </div>

        {/* Stage 3: ask by DID, the file comes back, both ways charged. */}
        <Fly from={[LEFT, TOP + 330]} to={slotPos(0)} p={stage === 3 ? ease((since(3) - 15) / 30) : 0} lift={60}><Tag text={`DID ${DID}`} size={24} /></Fly>
        <Fly from={slotPos(0)} to={phoneImg} p={stage === 3 ? ease((since(3) - 50) / 30) : 0} lift={-60}><Picture size={90} /></Fly>
        <div style={{position: 'absolute', left: RIGHT - 160, top: TOP + 860, width: 320, textAlign: 'center', fontSize: 34, color: theme.accent, fontWeight: 700,
          opacity: only(3) * fade(since(3) - 85)}}>💰 存、取都扣费</div>

        {/* Stage 4: DISK knows nothing about what it keeps. */}
        <div style={{position: 'absolute', left: RIGHT - 190, top: TOP + 790, width: 380, textAlign: 'center', opacity: only(4)}}>
          <div style={{fontSize: 90}}>🤷</div>
          <div style={{fontSize: 30, color: theme.text}}>不问是什么、干什么用</div>
        </div>

        {/* The HAT in the phone, from stage 5. */}
        <div style={{position: 'absolute', left: LEFT - 190, top: TOP + 360, opacity: hatOn ? (stage === 5 ? fade(since(5) - 10) : 1) * panels : 0}}>
          <Hat rows={hatRows(at(11))} hi={stage === 6 || stage === 3 ? 4 : stage === 11 ? 5 : -1}
            hiOn={stage === 6 ? fade(since(6) - 60) : stage === 11 ? fade(since(11) - 50) : 0} />
        </div>
        <Text top={TOP + PANEL_H + 30} opacity={only(5) * fade(since(5) - 40)} size={34}>HAT：哈希属性表，描述这个文件</Text>

        {/* Stage 6: a file from DISK finds its HAT by its DID. */}
        <Fly from={slotPos(0)} to={phoneImg} p={stage === 6 ? ease((since(6) - 15) / 35) : 0} lift={-60}><Picture size={90} /></Fly>
        <Text top={TOP + PANEL_H + 30} opacity={only(6) * fade(since(6) - 60)} size={34}>按 DID 找到它的 HAT</Text>

        {/* Stage 7: back the HATs up. */}
        {(() => {
          const p = ease((since(7) - 25) / 35);
          return (
            <div style={{position: 'absolute', left: LEFT - 100 + p * 0, top: TOP + PANEL_H + 20 - 0, opacity: only(7) * fade(since(7) - 25),
              transform: `translateY(${(1 - p) * -200}px)`, display: 'flex', alignItems: 'center', gap: 16}}>
              <span style={{fontSize: 70}}>📄</span><span style={{fontSize: 34, color: theme.accent, fontWeight: 700}}>HAT 备份</span>
            </div>
          );
        })()}

        {/* Stage 8: anyone with the DID can fetch the file as it is. */}
        {[0, 1, 2].map((k) => {
          const p = stage === 8 ? ease((since(8) - 20 - k * 12) / 35) : 0;
          return (
            <div key={k} style={{position: 'absolute', left: RIGHT - 200 + k * 140, top: TOP + PANEL_H + 20, opacity: only(8),
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
              <div style={{fontSize: 64}}>🧑</div>
              <div style={{opacity: p}}><Picture size={60} /></div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 60, top: TOP + PANEL_H + 50, width: 400, fontSize: 32, color: RED, fontWeight: 700, opacity: only(8) * fade(since(8) - 60)}}>
          有 DID 谁都能取原样
        </div>

        {/* Stage 9: lock it with a random key into a cipher file, then upload. */}
        {(() => {
          const lock = stage === 9 ? fade(since(9) - 25, 10) : 0;
          return (
            <div style={{opacity: stage === 9 ? fade(since(9)) : 0}}>
              <div style={{position: 'absolute', left: LEFT - 150, top: TOP + 150, fontSize: 70, transform: `translateX(${lock * 40}px)`}}>🔑</div>
              <div style={{position: 'absolute', left: LEFT - 30, top: TOP + 120, opacity: lock * (1 - fade(since(9) - 60, 8))}}><Cipher size={130} /></div>
              <div style={{position: 'absolute', left: LEFT - 150, top: TOP + 290, width: 300, textAlign: 'center', fontSize: 30, color: theme.accent, opacity: lock}}>随机密钥 → 密文文件</div>
            </div>
          );
        })()}
        <Fly from={[LEFT + 35, TOP + 185]} to={slotPos(3)} p={stage === 9 ? ease((since(9) - 60) / 35) : 0}><Cipher size={100} /></Fly>

        {/* Stage 10: a public work goes up as it is and is shared freely. */}
        <div style={{position: 'absolute', left: LEFT - 150, top: TOP + 120, width: 300, textAlign: 'center', opacity: only(10)}}>
          <div style={{fontSize: 90}}>📜</div>
          <div style={{fontSize: 28, color: theme.text}}>我的诗.txt · 公开作品</div>
        </div>
        <Fly from={[LEFT, TOP + 170]} to={slotPos(4)} p={stage === 10 ? ease((since(10) - 20) / 35) : 0}><div style={{fontSize: 70}}>📜</div></Fly>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{position: 'absolute', left: RIGHT - 200 + k * 140, top: TOP + PANEL_H + 20, opacity: only(10) * fade(since(10) - 70 - k * 10),
            display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{fontSize: 64}}>🧑</div><div style={{fontSize: 44}}>📜</div>
          </div>
        ))}
        <div style={{position: 'absolute', left: 60, top: TOP + PANEL_H + 50, width: 400, fontSize: 32, color: GREEN, fontWeight: 700, opacity: only(10) * fade(since(10) - 80)}}>
          不加密，自由共享
        </div>

        {/* Stage 11: the HAT records the cipher file's DID; an arrow to its slot. */}
        {stage === 11 && (
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: fade(since(11) - 60)}}>
            <defs><marker id="ah" markerUnits="userSpaceOnUse" markerWidth="30" markerHeight="26" refX="28" refY="13" orient="auto"><path d="M0 0 L30 13 L0 26 z" fill={theme.accent} /></marker></defs>
            {/* Below the slots, then straight up into the bottom of the cipher file's slot, so the shaft meets the head square on. */}
            <path d={`M ${LEFT + 190} ${TOP + 690} C ${LEFT + 440} ${TOP + 780}, ${slotPos(3)[0]} ${TOP + 760}, ${slotPos(3)[0]} ${slotPos(3)[1] + 82}`}
              stroke={theme.accent} strokeWidth={5} fill="none" markerEnd="url(#ah)" />
          </svg>
        )}

        {/* Stage 12: download the cipher file and unlock it. */}
        {(() => {
          const back = stage === 12 ? ease((since(12) - 15) / 35) : 0;
          const open = stage === 12 ? fade(since(12) - 55, 10) : 0;
          return (
            <>
              <Fly from={slotPos(3)} to={phoneImg} p={back} lift={-60}><Cipher size={100} /></Fly>
              <div style={{position: 'absolute', left: LEFT - 75, top: TOP + 110, opacity: stage === 12 && back >= 1 ? 1 - open : 0}}><Cipher size={150} /></div>
              <div style={{position: 'absolute', left: LEFT - 75, top: TOP + 110, opacity: open}}><Picture size={150} /></div>
              <div style={{position: 'absolute', left: LEFT + 90, top: TOP + 150, fontSize: 60, opacity: stage === 12 ? fade(since(12) - 45) * (1 - fade(since(12) - 75)) : 0}}>🔑</div>
            </>
          );
        })()}

        {/* Stage 13: an important file kept on two DISKs. */}
        <div style={{opacity: only(13)}}>
          <Panel x={LEFT} title="📱 手机" opacity={1} />
          <div style={{position: 'absolute', left: LEFT - 190, top: TOP + 200}}>
            <Hat rows={[['名称', '壁纸.jpg'], ['密文 DID', CDID], ['位置', 'DISK A'], ['', 'DISK B']]} hi={3} hiOn={fade(since(13) - 70)} />
          </div>
          {[['DISK A', '★★★★★'], ['DISK B', '★★★★☆']].map(([name, stars], i) => (
            <div key={name} style={{position: 'absolute', left: RIGHT - 210, top: TOP + 60 + i * 420, width: 420, height: 360, borderRadius: 30, background: theme.panel,
              border: `5px solid ${GREEN}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12}}>
              <div style={{fontSize: 38, color: theme.text, fontWeight: 700}}>🗄️ {name}</div>
              <div style={{fontSize: 30, color: theme.accent}}>{stars}</div>
              <div style={{opacity: fade(since(13) - 30 - i * 20)}}><Cipher size={110} /></div>
            </div>
          ))}
          <Text top={TOP + PANEL_H + 30} opacity={fade(since(13) - 80)} size={34}>重要文件，多存几份</Text>
        </div>

        {/* Stage 14: sharing in chat sends the HAT, not the file. */}
        {(() => {
          const send = ease((since(14) - 20) / 35);
          const fetch = ease((since(14) - 70) / 35);
          const open = fade(since(14) - 110, 10);
          return (
            <div style={{opacity: stage === 14 ? fade(since(14)) : 0}}>
              <Panel x={LEFT} title="📱 Tom" opacity={1} height={620} />
              <Panel x={RIGHT} title="📱 对方" opacity={1} height={620} />
              <div style={{position: 'absolute', left: 540 - 200, top: TOP + 760, width: 400, height: 220, borderRadius: 30, background: theme.panel,
                border: `5px solid ${GREEN}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
                <div style={{fontSize: 36, color: theme.text, fontWeight: 700}}>🗄️ DISK</div>
                <Cipher size={100} />
              </div>
              <div style={{position: 'absolute', left: LEFT - 60, top: TOP + 130, fontSize: 100, opacity: 1 - (send > 0 && send < 1 ? 1 : 0) * 0}}>🎩</div>
              <Fly from={[LEFT, TOP + 190]} to={[RIGHT, TOP + 190]} p={send}><div style={{fontSize: 100}}>🎩</div></Fly>
              <div style={{position: 'absolute', left: RIGHT - 60, top: TOP + 130, fontSize: 100, opacity: send >= 1 ? 1 : 0}}>🎩</div>
              <div style={{position: 'absolute', left: RIGHT - 200, top: TOP + 280, width: 400, textAlign: 'center', fontSize: 28, color: theme.muted, opacity: send >= 1 ? 1 : 0}}>
                HAT 里有 DISK 位置和密钥
              </div>
              <Fly from={[540, TOP + 860]} to={[RIGHT, TOP + 450]} p={fetch} lift={-40}><Cipher size={90} /></Fly>
              <div style={{position: 'absolute', left: RIGHT - 75, top: TOP + 380, opacity: open}}><Picture size={150} /></div>
              <Text top={TOP + PANEL_H + 30} opacity={fade(since(14) - 30)} size={34}>发的是 HAT，不是文件</Text>
            </div>
          );
        })()}

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
