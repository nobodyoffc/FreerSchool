import React from 'react';
import {theme} from '../theme';

// A phone outline that holds a screen recording (or a placeholder) at 9:19.5.
export const PhoneFrame: React.FC<{height: number; children?: React.ReactNode}> = ({
  height,
  children,
}) => {
  const width = Math.round((height * 9) / 19.5);
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height * 0.06,
        border: `${Math.round(height * 0.012)}px solid #2A3A55`,
        background: '#000',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        color: theme.muted,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
};
