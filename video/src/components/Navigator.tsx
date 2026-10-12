import React from 'react';
import {theme} from '../theme';
import {FidAvatar} from './FidAvatar';

// The lecturer: an on-chain FID shown by its own avatar and its CID (or FID, before it has one).
export const Navigator: React.FC<{fid: string; name: string; cid?: string; size?: number}> = ({fid, name, cid, size = 140}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.15, fontFamily: theme.font}}>
    <div style={{borderRadius: '50%', overflow: 'hidden', background: theme.panel, flexShrink: 0}}>
      <FidAvatar fid={fid} size={size} />
    </div>
    <div>
      <div style={{fontSize: size * 0.26, color: theme.text}}>{name}</div>
      <div style={{fontSize: cid ? size * 0.2 : size * 0.14, color: theme.muted, fontFamily: 'Menlo, monospace'}}>{cid ?? fid}</div>
    </div>
  </div>
);
