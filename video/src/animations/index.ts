import type React from 'react';
import type {PlannedScene} from '../episode/plan';
import {CidName} from './CidName';
import {CipherBackup} from './CipherBackup';
import {CmailChain} from './CmailChain';
import {CoinDays} from './CoinDays';
import {ContactBook} from './ContactBook';
import {DockDisk} from './DockDisk';
import {FirstCash} from './FirstCash';
import {KeyDerivation} from './KeyDerivation';
import {NobodyDeath} from './NobodyDeath';
import {P2pRoute} from './P2pRoute';
import {SquarePlaza} from './SquarePlaza';
import {StrangerGate} from './StrangerGate';

// Concept animations, by "<episode>/<scene>".
export const ANIMATIONS: Record<string, React.FC<{scene: PlannedScene}>> = {
  'U1-02/S2': KeyDerivation,
  'U1-03/S3': CipherBackup,
  'U1-04/S2': FirstCash,
  'U1-05/S2': CidName,
  'U1-05/S3': CoinDays,
  'U1-06/S2': DockDisk,
  'U1-07/S2': ContactBook,
  'U1-08/S2': SquarePlaza,
  'U1-09/S2': NobodyDeath,
  'U1-10/S2': P2pRoute,
  'U1-10/S4': StrangerGate,
  'U1-11/S2': CmailChain,
};
