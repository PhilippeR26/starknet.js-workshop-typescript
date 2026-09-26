// Generates test/fixtures/falconRs.json with the falcon-rs WASM (development tool, run once).
// launch with npx ts-node src/scripts/signature/falcon512/pureTS/tools/generateFixtures.ts
// Coded with Starknet.js v11.0.2

import fs from 'fs';
import path from 'path';
import { parseFalcon512PublicKey } from '../../11.falcon512utils';
import * as falcon from '../../pkg/falcon_rs.js';

const toHex = (bytes: Uint8Array): string => '0x' + Buffer.from(bytes).toString('hex');

function main(): void {
  // Fixed public seed: reproducible reference data, never to be used for a real account.
  const seed = Uint8Array.from({ length: 48 }, (_, i) => i);
  const keyPair = falcon.keygen(seed) as { sk: Uint8Array; vk: Uint8Array };
  const pkNtt = Array.from(falcon.ntt_public_key(parseFalcon512PublicKey(keyPair.vk)));
  const packedPublicKey: string[] = falcon.pack_public_key_wasm(new Uint16Array(pkNtt));
  const msgHashes = ['0x1', '0x2a', '0x' + 'ab'.repeat(31)];
  const signatures = msgHashes.map((msgHash) => ({
    msgHash,
    signature: falcon.sign_for_starknet(keyPair.sk, msgHash, Int32Array.from(pkNtt)),
  }));
  const fixture = {
    generator: 'pureTS/tools/generateFixtures.ts (falcon-rs WASM ../pkg)',
    falconRsCommit: 'fbf38fe',
    seed: toHex(seed),
    secretKey: toHex(keyPair.sk),
    publicKey: toHex(keyPair.vk),
    pkNtt,
    packedPublicKey,
    signatures,
  };
  const out = path.join(__dirname, '..', 'test', 'fixtures', 'falconRs.json');
  fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
  console.log('written', out);
}

main();
