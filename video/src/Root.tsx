import React from 'react';
import {Composition} from 'remotion';
import {Sample} from './compositions/Sample';
import {Episode, type EpisodeProps} from './episode/Episode';
import {loadEpisode} from './episode/load';
import {VIDEO} from './theme';

// Episodes with a synced build in public/episodes/<id>/ (npm run sync).
const EPISODES = ['U1-02', 'U1-03', 'U1-04', 'U1-05', 'U1-06', 'U1-07', 'U1-08', 'U1-09', 'U1-10', 'U1-11', 'U1-12', 'U1-13', 'U2-01', 'U2-02', 'U2-03', 'U2-04', 'U2-05'];

export const Root: React.FC = () => (
  <>
    <Composition id="Sample" component={Sample} durationInFrames={240} {...VIDEO} />
    {EPISODES.map((id) => (
      <Composition
        key={id}
        id={id}
        component={Episode}
        calculateMetadata={loadEpisode}
        defaultProps={{episode: id, timeline: null, manifest: null, musicLoop: 1} satisfies EpisodeProps}
        durationInFrames={1}
        {...VIDEO}
      />
    ))}
  </>
);
