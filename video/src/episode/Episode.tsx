import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {ANIMATIONS} from '../animations';
import {Caption} from '../components/Caption';
import {TitleCard} from '../components/TitleCard';
import {theme} from '../theme';
import {CardScene} from './CardScene';
import {NavigatorScene} from './NavigatorScene';
import {Outro} from './Outro';
import {type PlannedScene, planEpisode} from './plan';
import {RecordingScene} from './RecordingScene';
import type {Manifest, Timeline} from './types';

export type EpisodeProps = {episode: string; timeline: Timeline | null; manifest: Manifest | null};

const SceneVisual: React.FC<{scene: PlannedScene; props: EpisodeProps; base: string}> = ({scene, props, base}) => {
  const {timeline, manifest, episode} = props;
  const navigator = timeline!.navigator;
  switch (scene.type) {
    case '讲师':
      return <NavigatorScene scene={scene} base={base} navigator={navigator} />;
    case '录屏': {
      const recording = manifest?.recordings[scene.id];
      return <RecordingScene scene={scene} navigator={navigator} recording={recording && `${base}/${recording}`} />;
    }
    case '卡片':
      return <CardScene scene={scene} />;
    case '动画': {
      const Animation = ANIMATIONS[`${episode}/${scene.id}`];
      return Animation ? <Animation scene={scene} /> : <CardScene scene={{...scene, points: [scene.title, ...scene.notes]}} />;
    }
  }
};

export const Episode: React.FC<EpisodeProps> = (props) => {
  const {fps} = useVideoConfig();
  const {timeline, episode} = props;
  if (!timeline) return null;
  const base = `episodes/${episode}`;
  const plan = planEpisode(timeline, fps);
  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <Sequence durationInFrames={plan.intro}>
        <TitleCard id={timeline.id} title={timeline.title} />
      </Sequence>
      {plan.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.frames} name={`${scene.id} ${scene.type} ${scene.title}`}>
          <SceneVisual scene={scene} props={props} base={base} />
          {scene.lines.map((line) => (
            <Sequence key={line.file} from={line.from} durationInFrames={line.frames} name={line.text}>
              <Audio src={staticFile(`${base}/${line.file}`)} />
              {scene.type !== '讲师' && <Caption text={line.text} />}
            </Sequence>
          ))}
        </Sequence>
      ))}
      <Sequence from={plan.outroFrom}>
        <Outro navigator={timeline.navigator} />
      </Sequence>
    </AbsoluteFill>
  );
};
