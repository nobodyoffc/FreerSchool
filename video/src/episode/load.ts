import {staticFile} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import type {EpisodeProps} from './Episode';
import {planEpisode} from './plan';
import {PORTRAIT, VIDEO} from '../theme';

// Read the synced timeline and manifest, and size the composition to the planned episode.
export const loadEpisode: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const base = `episodes/${props.episode}`;
  const timeline = await fetch(staticFile(`${base}/timeline.json`)).then((r) => r.json());
  const manifest = await fetch(staticFile(`${base}/manifest.json`)).then((r) => r.json());
  const {width, height, fps} = /Android/i.test(timeline.app ?? '') ? PORTRAIT : VIDEO;
  return {width, height, fps, durationInFrames: planEpisode(timeline, fps).total, props: {...props, timeline, manifest}};
};
