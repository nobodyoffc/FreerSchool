import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FidAvatar} from '../components/FidAvatar';
import {lineAt, type PlannedScene} from '../episode/plan';
import {theme, usePortrait} from '../theme';

// U2-17 S2: a proof on the chain. One stage per narration line:
//   0 a title, a content and three parameters
//   1 cosigners: whose signatures, i.e. their approval
//   2 often the stakeholders: a witness, a guarantor
//   3 all signs required: inactive until everyone has signed
//   4 transferable: the rights go with it
//   5 the issuer signs and sends; the ID is the issuing transaction
//   6 at first the issuer is the owner
//   7 the owner can destroy it
//   8 the whole life is on the chain, for anyone to look up
//   9 issue, sign, transfer, destroy: a transaction each
//  10 public and unencrypted: mind your privacy
// The proof, its ID and the two people are those S3-S7 record.
const TOM = 'FLZSnb5uRFzz9jSiaNyWnpLfHjuMNy9yw4';
const NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8';
const PROOF_ID = 'def81bfa…f58ee5';
const CARD_X = 90;
const CARD_W = 900;
const CARD_Y = 230;
const ROW_H = 96;
const CHAIN_Y = 1100;
const GREEN = '#5BC98C';
const RED = '#E5686A';
const PAPER = '#F4F1E8';
const INK = '#333';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (t: number, len = 12) => interpolate(t, [0, len], [0, 1], clamp);
const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(Math.max(p, 0), 1))) / 2;

const Check: React.FC<{on: number}> = ({on}) => (
  <div style={{width: 46, height: 46, borderRadius: 8, border: `4px solid ${on ? theme.accent : '#999'}`, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 36, color: theme.accent, fontWeight: 900}}>
    <span style={{opacity: on}}>✓</span>
  </div>
);

export const ProofOnChain: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const stage = lineAt(scene.lines, frame);
  const since = (i: number) => (scene.lines[i] ? frame - scene.lines[i].from : -1);
  const at = (i: number) => stage >= i;
  const show = (i: number, delay = 0, len = 12) => (at(i) ? fade(since(i) - delay, len) : 0);
  const only = (i: number, j: number) => show(i) * (at(j) ? 1 - fade(since(j), 10) : 1);

  // The row being talked about: the three parameters in turn at stage 0, then each its own stage.
  const focus = (row: number) => {
    if (stage === 0) return since(0) > 60 + row * 40 && since(0) < 100 + row * 40 ? 1 : 0;
    if (row === 0) return at(1) && !at(3) ? 1 : 0;
    if (row === 1) return stage === 3 ? 1 : 0;
    return stage === 4 ? 1 : 0;
  };
  // Stage 3: the cosigner signs halfway through; the stamp turns from inactive to active.
  const signed = at(3) ? fade(since(3) - 70, 10) : 0;
  const destroyed = show(7, 10);
  const rows = [
    {label: '联合签名者', y: CARD_Y + 330},
    {label: '需要全部签名', y: CARD_Y + 330 + ROW_H},
    {label: '可转让', y: CARD_Y + 330 + ROW_H * 2},
  ];
  // Stage 5: a small copy of the card flies into the first block.
  const fly = at(5) ? ease((since(5) - 10) / 35) : 0;
  const blocks = [{op: '发行', x: 170}, {op: '签名', x: 420}, {op: '转让', x: 670}, {op: '销毁', x: 920}];

  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 1080, height: 1920,
        transform: `translate(-50%, -50%) scale(${portrait ? 1 : 0.5625})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontSize: 50, color: theme.text, fontWeight: 600}}>
          链上凭据
        </div>

        {/* The card. */}
        <div style={{position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W, height: 760, borderRadius: 20, background: PAPER,
          opacity: show(0) * (1 - destroyed * 0.45), filter: `grayscale(${destroyed})`}}>
          <div style={{position: 'absolute', left: 40, top: 34, fontSize: 30, color: '#777'}}>标题</div>
          <div style={{position: 'absolute', left: 170, top: 26, fontSize: 44, fontWeight: 700, color: INK, opacity: show(0, 10)}}>借据</div>
          <div style={{position: 'absolute', left: 40, top: 120, fontSize: 30, color: '#777'}}>内容</div>
          <div style={{position: 'absolute', left: 170, top: 114, width: 680, fontSize: 34, lineHeight: 1.45, color: INK, opacity: show(0, 25),
            background: at(10) ? `rgba(242, 180, 65, ${0.35 * show(10)})` : 'transparent', borderRadius: 8}}>
            Tom_9yw4 向 cy_qqN8 借 10 F，2026 年 12 月 31 日前归还。
          </div>
          <div style={{position: 'absolute', left: 30, right: 30, top: 300, height: 3, background: '#DDD6C4'}} />
        </div>

        {/* The three parameters. */}
        {rows.map((r, i) => (
          <div key={r.label} style={{position: 'absolute', left: CARD_X + 20, width: CARD_W - 40, top: r.y, height: ROW_H - 12, borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 24, padding: '0 20px', boxSizing: 'border-box',
            background: focus(i) ? 'rgba(242, 180, 65, 0.28)' : 'transparent', opacity: show(0, 40 + i * 15) * (1 - destroyed * 0.45)}}>
            <div style={{fontSize: 34, color: INK, width: 260}}>{r.label}</div>
            {i === 0 && (
              <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: show(1, 10)}}>
                <FidAvatar fid={NAVIGATOR} size={64} />
                <div style={{fontSize: 30, color: INK}}>cy_qqN8</div>
                <div style={{fontSize: 30, color: GREEN, opacity: Math.max(show(1, 40), signed)}}>✍ {signed ? '已签名' : '认可 · 背书'}</div>
              </div>
            )}
            {i === 1 && <Check on={show(3, 10)} />}
            {i === 2 && <Check on={show(4, 10)} />}
          </div>
        ))}

        {/* Stage 2: who the cosigners usually are. */}
        <div style={{position: 'absolute', left: CARD_X + 300, top: rows[0].y - 70, display: 'flex', gap: 20, opacity: only(2, 3)}}>
          {['见证人', '担保人'].map((t, i) => (
            <div key={t} style={{padding: '8px 24px', borderRadius: 30, background: theme.accent, color: '#222', fontSize: 30, fontWeight: 600,
              opacity: show(2, 15 + i * 30)}}>{t}</div>
          ))}
        </div>

        {/* Stage 3: the stamp. */}
        <div style={{position: 'absolute', left: CARD_X + CARD_W - 300, top: CARD_Y + 180, width: 240, height: 100, borderRadius: 14,
          border: `6px solid ${signed ? GREEN : '#999'}`, color: signed ? GREEN : '#999', fontSize: 44, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)', opacity: show(3, 10) * (1 - destroyed)}}>
          {signed ? '已生效' : '未生效'}
        </div>
        {/* Stage 7: destroyed. */}
        <div style={{position: 'absolute', left: CARD_X + CARD_W - 320, top: CARD_Y + 170, width: 280, height: 116, borderRadius: 14,
          border: `7px solid ${RED}`, color: RED, fontSize: 52, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: 'rotate(-12deg)', opacity: destroyed}}>
          已销毁
        </div>

        {/* Stage 4: transferred, the rights go with it. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1040, height: 300, opacity: only(4, 5)}}>
          {[{fid: TOM, label: '转出人', x: 250}, {fid: NAVIGATOR, label: '受让人', x: 830}].map((p) => (
            <div key={p.fid} style={{position: 'absolute', left: p.x - 100, width: 200, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
              <FidAvatar fid={p.fid} size={110} />
              <div style={{fontSize: 30, color: theme.muted}}>{p.label}</div>
            </div>
          ))}
          <div style={{position: 'absolute', left: 250 + 580 * (at(4) ? ease((since(4) - 30) / 40) : 0) - 80, top: 170, width: 160, height: 90, borderRadius: 12,
            background: PAPER, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{fontSize: 28, color: INK, fontWeight: 700}}>借据</div>
            <div style={{fontSize: 22, color: '#B45309'}}>权益</div>
          </div>
        </div>

        {/* Stage 6: issuer and owner. */}
        <div style={{position: 'absolute', left: CARD_X + 40, top: CARD_Y + 650, display: 'flex', gap: 60, opacity: show(6) * (1 - destroyed * 0.45)}}>
          {['发行者', '所有者'].map((role, i) => (
            <div key={role} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: show(6, i * 30)}}>
              <FidAvatar fid={TOM} size={64} />
              <div style={{fontSize: 30, color: INK}}>{role} Tom_9yw4</div>
            </div>
          ))}
        </div>

        {/* The chain: the card flies into the first block at stage 5; the record fills it from stage 8. */}
        <div style={{opacity: show(5)}}>
          <div style={{position: 'absolute', left: 60, right: 60, top: CHAIN_Y + 78, height: 6, background: theme.muted, borderRadius: 3}} />
          {blocks.map((b, i) => {
            const lit = i === 0 ? fly : show(9, 10 + i * 25);
            return (
              <div key={b.op} style={{position: 'absolute', left: b.x - 100, top: CHAIN_Y, width: 200, height: 160, borderRadius: 16, background: theme.panel,
                border: `4px solid ${lit ? theme.accent : theme.muted}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
                <div style={{fontSize: 40, color: theme.text, fontWeight: 700, opacity: i === 0 ? fly : show(9, 10 + i * 25)}}>{b.op}</div>
                <div style={{fontSize: 22, color: theme.muted, opacity: i === 0 ? fly : show(9, 10 + i * 25)}}>交易</div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: CARD_X + CARD_W / 2 + (blocks[0].x - CARD_X - CARD_W / 2) * fly - 70, top: CARD_Y + 400 + (CHAIN_Y + 30 - CARD_Y - 400) * fly,
            width: 140, height: 90, borderRadius: 10, background: PAPER, opacity: at(5) && fly < 1 ? 1 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: INK, fontWeight: 700}}>借据</div>
          <div style={{position: 'absolute', left: 70, top: CHAIN_Y + 190, fontSize: 30, color: theme.accent, fontFamily: 'Menlo, monospace', opacity: only(5, 8) * show(5, 45)}}>
            ID = 发行交易 {PROOF_ID}
          </div>
        </div>

        {/* Stage 8: anyone can look it up. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 200, textAlign: 'center', fontSize: 36, color: theme.text, opacity: only(8, 10)}}>
          🔍 整个生命周期都在链上，谁都能查到
        </div>
        {/* Stage 10: public, unencrypted. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: CHAIN_Y + 200, textAlign: 'center', fontSize: 40, color: theme.accent, opacity: show(10, 10)}}>
          👁 公开，未加密：注意保护隐私
        </div>

        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 24, color: theme.muted}}>示意</div>
      </div>
    </AbsoluteFill>
  );
};
