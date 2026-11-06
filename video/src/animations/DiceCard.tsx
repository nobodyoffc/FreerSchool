import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CardScene} from '../episode/CardScene';
import {type PlannedScene} from '../episode/plan';

// U2-01 S6: the card of the two uses of a passphrase; at "特别推荐" (the line that
// mentions the d20) the dice photo fades in above the points.
export const DICE_PHOTO = 'episodes/U2-01/images/d20.jpg';

export const DiceCard: React.FC<{scene: PlannedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const line = scene.lines.find((l) => l.text.includes('骰子'));
  const t = line ? frame - line.from : -1;
  const opacity = interpolate(t, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <CardScene scene={scene} />
      <AbsoluteFill style={{alignItems: 'center', opacity}}>
        <Img src={staticFile(DICE_PHOTO)} style={{marginTop: 70, width: 680, borderRadius: 20}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
