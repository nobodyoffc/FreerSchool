import React from 'react';
import {Img, staticFile} from 'remotion';

// Same layering as FC-JDK feature.avatar.AvatarMaker: layer i is chosen by the
// FID character at index 29 - i, mapped through the Base58 alphabet.
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const avatarLayers = (fid: string): string[] => {
  if (fid.length !== 34) throw new Error(`Not an FID: ${fid}`);
  return Array.from({length: 10}, (_, i) => {
    const index = BASE58.indexOf(fid[29 - i]);
    if (index < 0) throw new Error(`Not an FID: ${fid}`);
    return `avatar/elements/${i}/${index}.png`;
  });
};

export const FidAvatar: React.FC<{fid: string; size: number}> = ({fid, size}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    {avatarLayers(fid).map((layer) => (
      <Img
        key={layer}
        src={staticFile(layer)}
        style={{position: 'absolute', inset: 0, width: size, height: size}}
      />
    ))}
  </div>
);
