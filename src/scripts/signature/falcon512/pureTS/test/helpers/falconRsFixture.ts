import { readFileSync } from 'node:fs';
import path from 'node:path';

export type FalconRsFixture = {
  generator: string;
  falconRsCommit: string;
  seed: string;
  secretKey: string;
  publicKey: string;
  pkNtt: number[];
  packedPublicKey: string[];
  signatures: { msgHash: string; signature: string[] }[];
};

export const loadFalconRsFixture = (): FalconRsFixture =>
  JSON.parse(readFileSync(path.join(__dirname, '..', 'fixtures', 'falconRs.json'), 'utf8'));
