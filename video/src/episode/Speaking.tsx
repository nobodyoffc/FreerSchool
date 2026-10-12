import React from 'react';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Loudness (0–1) of the audio file at the current frame, for a speaking indicator.
export const useLoudness = (src: string): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(staticFile(src));
  if (!audioData) return 0;
  const bins = visualizeAudio({fps, frame, audioData, numberOfSamples: 16});
  return Math.min(1, (bins.reduce((a, b) => a + b, 0) / bins.length) * 6);
};

export const SpeakingRing: React.FC<{src: string; size: number}> = ({src, size}) => {
  const loudness = useLoudness(src);
  return (
    <div
      style={{
        position: 'absolute',
        inset: -size * 0.06,
        borderRadius: '50%',
        border: `${Math.max(2, size * 0.02)}px solid rgba(242,180,65,${0.25 + 0.6 * loudness})`,
        transform: `scale(${1 + 0.06 * loudness})`,
      }}
    />
  );
};
