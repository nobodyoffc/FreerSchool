import {useVideoConfig} from 'remotion';

export const theme = {
  bg: '#0E1726',
  panel: '#16233A',
  text: '#F2F5FA',
  muted: '#9AA8BF',
  accent: '#F2B441',
  font: '"PingFang SC", "Noto Sans SC", "Helvetica Neue", sans-serif',
};

export const VIDEO = {width: 1920, height: 1080, fps: 30};
// Android episodes are portrait, like the phone they show; Mac episodes are landscape.
export const PORTRAIT = {width: 1080, height: 1920, fps: 30};

export const usePortrait = () => {
  const {width, height} = useVideoConfig();
  return height > width;
};
