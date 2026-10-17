import React from 'react';
import {FidAvatar} from './FidAvatar';

// A 明人's avatar as the app marks it (NobodyUi.markAvatar): grey, with a skull badge
// of radius 0.2 × size, centred down-right inside the inscribed circle, in a white ring
// 1.12 × the radius, the skull 1.44 × the radius across.
export const SKULL = 'M12,2C6.48,2 2,6.03 2,11c0,3.05 1.64,5.64 4,7.19V21c0,0.55 0.45,1 1,1h10c0.55,0 1,-0.45 1,-1v-2.81c2.36,-1.55 4,-4.14 4,-7.19C22,6.03 17.52,2 12,2Z M6.3,11.3a2.2,2.2 0,1 0,4.4 0a2.2,2.2 0,1 0,-4.4 0Z M13.3,11.3a2.2,2.2 0,1 0,4.4 0a2.2,2.2 0,1 0,-4.4 0Z M12,14.2L10.7,16.6H13.3Z M9.9,19.2h0.9v2.1h-0.9Z M13.2,19.2h0.9v2.1h-0.9Z';
export const NOBODY_MARK = '#E65100';

export const NobodyAvatar: React.FC<{fid: string; size: number}> = ({fid, size}) => {
  const r = size * 0.2;
  const c = size / 2 + (size / 2 - r) * 0.7071;
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div style={{filter: 'grayscale(1)'}}>
        <FidAvatar fid={fid} size={size} />
      </div>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0}}>
        <circle cx={c} cy={c} r={r * 1.12} fill="#FFFFFF" />
        <circle cx={c} cy={c} r={r} fill={NOBODY_MARK} />
        <g transform={`translate(${c - r * 0.72} ${c - r * 0.72}) scale(${(r * 1.44) / 24})`}>
          <path d={SKULL} fill="#FFFFFF" fillRule="evenodd" />
        </g>
      </svg>
    </div>
  );
};
