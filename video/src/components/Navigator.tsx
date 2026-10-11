import React from 'react';
import {theme} from '../theme';
import {FidAvatar} from './FidAvatar';

// The lecturer: an on-chain FID shown by its own avatar and name.
export const Navigator: React.FC<{fid: string; name: string}> = ({fid, name}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 20, fontFamily: theme.font}}>
    <div style={{borderRadius: '50%', overflow: 'hidden', background: theme.panel}}>
      <FidAvatar fid={fid} size={140} />
    </div>
    <div>
      <div style={{fontSize: 36, color: theme.text}}>{name}</div>
      <div style={{fontSize: 20, color: theme.muted, fontFamily: 'Menlo, monospace'}}>{fid}</div>
    </div>
  </div>
);
