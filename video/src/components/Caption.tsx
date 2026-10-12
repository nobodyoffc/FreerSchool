import React from 'react';
import {theme, usePortrait} from '../theme';

export const Caption: React.FC<{text: string}> = ({text}) => {
  const portrait = usePortrait();
  return (
    <div style={{position: 'absolute', bottom: portrait ? 90 : 40, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: portrait ? 960 : 1500,
          padding: '10px 28px',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.45)',
          fontFamily: theme.font,
          fontSize: portrait ? 46 : 44,
          lineHeight: 1.4,
          color: theme.text,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  );
};
