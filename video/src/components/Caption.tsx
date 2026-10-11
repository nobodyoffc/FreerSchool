import React from 'react';
import {theme} from '../theme';

export const Caption: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 48,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: theme.font,
      fontSize: 44,
      color: theme.text,
      textShadow: '0 2px 8px rgba(0,0,0,0.8)',
    }}
  >
    {text}
  </div>
);
