import type React from 'react';
import type {PlannedScene} from '../episode/plan';
import {CashChange} from './CashChange';
import {CidName} from './CidName';
import {CipherBackup} from './CipherBackup';
import {CmailChain} from './CmailChain';
import {CoinDays} from './CoinDays';
import {ContactBook} from './ContactBook';
import {DockDisk} from './DockDisk';
import {FirstCash} from './FirstCash';
import {GuideBond} from './GuideBond';
import {HelpBoard} from './HelpBoard';
import {KeyDerivation} from './KeyDerivation';
import {NobodyDeath} from './NobodyDeath';
import {P2pRoute} from './P2pRoute';
import {PasswordGroups} from './PasswordGroups';
import {PhraseKey} from './PhraseKey';
import {RandomKey} from './RandomKey';
import {SocialKey} from './SocialKey';
import {SplitKey} from './SplitKey';
import {SquarePlaza} from './SquarePlaza';
import {StrangerGate} from './StrangerGate';
import {TamperKey} from './TamperKey';

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
  'U1-12/S2': CashChange,
  'U1-13/S2': HelpBoard,
  'U1-13/S5': GuideBond,
  'U2-01/S2': RandomKey,
  'U2-01/S4': PhraseKey,
  'U2-02/S4': SplitKey,
  'U2-02/S5': TamperKey,
  'U2-02/S6': SocialKey,
  'U2-04/S2': PasswordGroups,
};
