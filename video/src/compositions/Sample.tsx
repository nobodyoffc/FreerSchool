import React from 'react';
import {Sequence} from 'remotion';
import {EpisodeLayout} from '../components/EpisodeLayout';
import {TitleCard} from '../components/TitleCard';

// Not a real FID: a placeholder until the Navigator's own FID is chosen.
const NAVIGATOR = {fid: 'FNavigatorDemoFidPaceho1derFreerXY', name: '领航员'};

export const Sample: React.FC = () => (
  <>
    <Sequence durationInFrames={90}>
      <TitleCard id="U1-02" title="你的第一个身份" />
    </Sequence>
    <Sequence from={90}>
      <EpisodeLayout
        navigator={NAVIGATOR}
        points={['FID 就是你', '头像由 FID 决定', '私钥只在你手里']}
        caption="FID 是你在自由宇宙里的身份。"
      />
    </Sequence>
  </>
);
