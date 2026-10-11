import React from 'react';
import {Composition} from 'remotion';
import {Sample} from './compositions/Sample';
import {VIDEO} from './theme';

export const Root: React.FC = () => (
  <>
    <Composition id="Sample" component={Sample} durationInFrames={240} {...VIDEO} />
  </>
);
