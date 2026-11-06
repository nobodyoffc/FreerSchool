import type React from 'react';
import type {PlannedScene} from '../episode/plan';
import {CashChange} from './CashChange';
import {ChainClock} from './ChainClock';
import {CidName} from './CidName';
import {CipherBackup} from './CipherBackup';
import {CmailChain} from './CmailChain';
import {CoinDays} from './CoinDays';
import {ContactBook} from './ContactBook';
import {DevTeam} from './DevTeam';
import {DiceCard} from './DiceCard';
import {DockDisk} from './DockDisk';
import {FirstCash} from './FirstCash';
import {GroupKinds} from './GroupKinds';
import {GuideBond} from './GuideBond';
import {HelpBoard} from './HelpBoard';
import {IdMatrix, MatrixFilled} from './IdMatrix';
import {KeyDerivation} from './KeyDerivation';
import {MasterBond} from './MasterBond';
import {MasterKey} from './MasterKey';
import {Miser} from './Miser';
import {Netizen} from './Netizen';
import {OfflineTx} from './OfflineTx';
import {NobodyDeath} from './NobodyDeath';
import {P2pRoute} from './P2pRoute';
import {PasswordGroups} from './PasswordGroups';
import {ProofOnChain} from './ProofOnChain';
import {PhraseKey} from './PhraseKey';
import {SecretOnChain} from './SecretOnChain';
import {RandomKey} from './RandomKey';
import {SocialKey} from './SocialKey';
import {SocialRank} from './SocialRank';
import {SplitKey} from './SplitKey';
import {SquarePlaza} from './SquarePlaza';
import {StrangerGate} from './StrangerGate';
import {TamperKey} from './TamperKey';
import {Totp} from './Totp';
import {DiskHat} from './DiskHat';
import {AppRegistry} from './AppRegistry';
import {Multisig} from './Multisig';
import {WatchIds} from './WatchIds';
import {TimeLock} from './TimeLock';
import {TokenBasics} from './TokenBasics';
import {TokenParams} from './TokenParams';
import {FreeUniverse} from './FreeUniverse';
import {PasswordVault} from './PasswordVault';

// Concept animations, by "<episode>/<scene>".
export const ANIMATIONS: Record<string, React.FC<{scene: PlannedScene}>> = {
  'U1-01/S2': FreeUniverse,
  'U1-01/S6': PasswordVault,
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
  'U2-01/S6': DiceCard,
  'U2-02/S4': SplitKey,
  'U2-02/S5': TamperKey,
  'U2-02/S6': SocialKey,
  'U2-04/S2': PasswordGroups,
  'U2-05/S2': MasterKey,
  'U2-05/S5': MasterBond,
  'U2-06/S2': WatchIds,
  'U2-07/S2': OfflineTx,
  'U2-08/S2': IdMatrix,
  'U2-08/S4': Miser,
  'U2-08/S5': Netizen,
  'U2-08/S6': DevTeam,
  'U2-08/S7': MatrixFilled,
  'U2-09/S2': GroupKinds,
  'U2-10/S2': SocialRank,
  'U2-12/S2': SecretOnChain,
  'U2-12/S5': Totp,
  'U2-13/S2': DiskHat,
  'U2-14/S2': AppRegistry,
  'U2-15/S2': Multisig,
  'U2-16/S2': ChainClock,
  'U2-16/S4': TimeLock,
  'U2-17/S2': ProofOnChain,
  'U2-18/S2': TokenBasics,
  'U2-18/S3': TokenParams,
};
