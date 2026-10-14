import type React from 'react';
import type {PlannedScene} from '../episode/plan';
import {CipherBackup} from './CipherBackup';
import {FirstCash} from './FirstCash';
import {KeyDerivation} from './KeyDerivation';

// Concept animations, by "<episode>/<scene>".
export const ANIMATIONS: Record<string, React.FC<{scene: PlannedScene}>> = {
  'U1-02/S2': KeyDerivation,
  'U1-03/S3': CipherBackup,
  'U1-04/S2': FirstCash,
};
