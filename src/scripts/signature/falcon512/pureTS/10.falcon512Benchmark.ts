// Timings of the Falcon-512 S2morrow signature: pure TypeScript (this lib) versus falcon-rs WASM (../pkg).
// launch with npx ts-node src/scripts/signature/falcon512/pureTS/10.falcon512Benchmark.ts
// Coded with Starknet.js v11.0.2

import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';
import { parseFalcon512PublicKey } from '../11.falcon512utils';
import * as falcon from '../pkg/falcon_rs.js';
import { falcon512 } from './lib';
import { publicKeyToNtt } from './lib/s2morrow/keys';
import { signHash } from './lib/s2morrow/signature';

function bench<T>(label: string, runs: number, fn: () => T): T {
  let result!: T;
  const start = performance.now();
  for (let i = 0; i < runs; i++) result = fn();
  console.log(`${label.padEnd(26)} ${((performance.now() - start) / runs).toFixed(1).padStart(8)} ms (average of ${runs})`);
  return result;
}

function main(): void {
  const msgHash = '0x' + bytesToHex(randomBytes(31));

  const keyPair = bench('TS keygen', 5, () => falcon512.generateKeyPair());
  const pkNtt = publicKeyToNtt(keyPair.publicKey);
  const signature = bench('TS sign', 20, () => signHash(BigInt(msgHash), keyPair.secretKey, pkNtt));
  bench('TS verify', 20, () => falcon512.verify(signature, msgHash, keyPair.publicKey));

  const rsKeyPair = bench('WASM keygen', 2, () => falcon.keygen(randomBytes(48)) as { sk: Uint8Array; vk: Uint8Array });
  const rsPkNtt = new Int32Array(falcon.ntt_public_key(parseFalcon512PublicKey(rsKeyPair.vk)));
  bench('WASM sign_for_starknet', 20, () => falcon.sign_for_starknet(rsKeyPair.sk, msgHash, rsPkNtt));
  console.log('✅ Test completed.');
}
main();
