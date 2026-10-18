// Timings of the Falcon-512 S2morrow signature: starknet/falcon (public API) versus falcon-rs WASM (../pkg).
// launch with npx ts-node src/scripts/signature/falcon512/snjs/10.falcon512Benchmark.ts
// Coded with Starknet.js v11.4.0

import { randomBytes } from '@noble/hashes/utils.js';
import { constants, typedData, TypedDataRevision, type TypedData } from 'starknet';
import { Falcon512Signer, falcon512 } from 'starknet/falcon';
import { parseFalcon512PublicKey } from '../11.falcon512utils';
import * as falcon from '../pkg/falcon_rs.js';

const ADDRESS = '0x123';
const myTypedData: TypedData = {
  domain: { name: 'Gift', chainId: constants.StarknetChainId.SN_SEPOLIA, version: '1', revision: TypedDataRevision.ACTIVE },
  message: { date_start: 2345, gift_id: 101 },
  primaryType: 'Message',
  types: {
    StarknetDomain: [
      { name: 'name', type: 'shortstring' },
      { name: 'chainId', type: 'shortstring' },
      { name: 'version', type: 'shortstring' },
    ],
    Message: [
      { name: 'date_start', type: 'felt' },
      { name: 'gift_id', type: 'u128' },
    ],
  },
};

function bench<T>(label: string, runs: number, fn: () => T): T {
  let result!: T;
  const start = performance.now();
  for (let i = 0; i < runs; i++) result = fn();
  console.log(`${label.padEnd(30)} ${((performance.now() - start) / runs).toFixed(1).padStart(8)} ms (average of ${runs})`);
  return result;
}

async function benchAsync<T>(label: string, runs: number, fn: () => Promise<T>): Promise<T> {
  let result!: T;
  const start = performance.now();
  for (let i = 0; i < runs; i++) result = await fn();
  console.log(`${label.padEnd(30)} ${((performance.now() - start) / runs).toFixed(1).padStart(8)} ms (average of ${runs})`);
  return result;
}

async function main(): Promise<void> {
  // starknet/falcon has no public function that signs an arbitrary hash (no blind signing):
  // the signature is measured with signMessage, which also hashes the SNIP-12 message.
  const keyPair = bench('TS keygen', 5, () => falcon512.generateKeyPair());
  const falconSigner = new Falcon512Signer(keyPair.secretKey);
  const msgHash = bench('SNIP-12 message hash', 20, () => typedData.getMessageHash(myTypedData, ADDRESS));
  const signature = await benchAsync('TS signMessage (hash + sign)', 20, () => falconSigner.signMessage(myTypedData, ADDRESS));
  bench('TS verify', 20, () => falcon512.verify(signature, msgHash, keyPair.publicKey));

  const rsKeyPair = bench('WASM keygen', 2, () => falcon.keygen(randomBytes(48)) as { sk: Uint8Array; vk: Uint8Array });
  const rsPkNtt = new Int32Array(falcon.ntt_public_key(parseFalcon512PublicKey(rsKeyPair.vk)));
  bench('WASM sign_for_starknet', 20, () => falcon.sign_for_starknet(rsKeyPair.sk, msgHash, rsPkNtt));
  console.log('✅ Test completed.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
