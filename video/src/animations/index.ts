import type React from 'react';
import type {PlannedScene} from '../episode/plan';
import {CidName} from './CidName';
import {CipherBackup} from './CipherBackup';
import {CoinDays} from './CoinDays';
import {DockDisk} from './DockDisk';
import {FirstCash} from './FirstCash';
import {KeyDerivation} from './KeyDerivation';

// Concept animations, by "<episode>/<scene>".
export const ANIMATIONS: Record<string, React.FC<{scene: PlannedScene}>> = {
  'U1-02/S2': KeyDerivation,
  'U1-03/S3': CipherBackup,
  'U1-04/S2': FirstCash,
  'U1-05/S2': CidName,
  'U1-05/S3': CoinDays,
  'U1-06/S2': DockDisk,
};
