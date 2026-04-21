// Calculations related to falcon512 signature
// launch with npx src/scripts/signature/falcon512/10.falcon512Calculation.ts
// Coded with Starknet.js v10.0.0 + devnet 0.8.0

import * as falcon from './pkg/falcon_rs.js';
import { falcon512 as falcon512Noble } from '@noble/post-quantum/falcon.js';
import { randomBytes } from '@noble/post-quantum/utils.js';
import { encode } from 'starknet';
import { parseFalcon512PublicKey } from './11.falcon512utils.js';


async function main() {
  // ====================
  // With Noble lib
  // ====================
  // 1. Generate keys
  const seed = randomBytes(48);
  console.time("NobleKeysGeneration");
  const keys: {
    secretKey: Uint8Array;
    publicKey: Uint8Array;
  } = falcon512Noble.keygen(seed);
  console.timeEnd("NobleKeysGeneration"); // 0.16s
  console.log({ keys });
  console.time("NoblePubKeyGeneration");
  const calculatedPubKey = falcon512Noble.getPublicKey(keys.secretKey);
  console.timeEnd("NoblePubKeyGeneration");
  console.log({ calculatedPubKey });
  // 2. Sign a message
  // const message = new TextEncoder().encode("Hello Starknet with Falcon-512");
  const txH0 = encode.hexStringToUint8Array("0x123456789abcd");
  console.time("NobleSign");
  const signature: Uint8Array = falcon512Noble.sign(txH0, keys.secretKey); // Uint8Array
  console.timeEnd("NobleSign");
  // 3. Verify the signature
  console.time("NobleVerify");
  const isValid = falcon512Noble.verify(signature, txH0, keys.publicKey);
  console.timeEnd("NobleVerify");
  console.log("Valid Signature ?", isValid);
  // process.exit(5);
  // No S2morrow compressed pubKey/signature in Noble lib.

  // =============================
  // With falcon-rs WASM lib,
  // for S2morrow Starknet account
  // =============================
  // 1. Generate keys
  console.time("Falcon-rs keygen");
  const keyPair = falcon.keygen(seed) as { sk: Uint8Array, vk: Uint8Array };
  console.timeEnd("Falcon-rs keygen"); // 1-3s
  console.log('Falcon-rs keys:', keyPair);
  // Using the same seed, keyPair from falcon-rs is different from Noble!!
  // falcon-rs lib is not able to calculate PubKey from privKey.
  // 2. Sign a message
  console.time("Falcon-rs starknet sign");
  const pkTime = parseFalcon512PublicKey(keyPair.vk);
  const pkNtt = new Int32Array(falcon.ntt_public_key(pkTime));
  const txH = "0x123456789abcd";
  const message = encode.stringToUint8Array(txH);
  const signSN = falcon.sign_for_starknet(keyPair.sk, txH, pkNtt);
  console.timeEnd("Falcon-rs starknet sign");
  console.log({ signSN });
  console.time("Falcon-rs sign");
  const salt = encode.stringToUint8Array("0x12345345634563456345645634563456345634123453456345634563456456345634563454567123"); // 40 bytes mandatory
  const sign = falcon.sign(keyPair.sk, message, salt);
  console.log({ sign });
  console.timeEnd("Falcon-rs sign");
  // 3. Verify the signature
  console.time("Falcon-rs verify");
  const verif = falcon.verify(keyPair.vk, message, sign.signature);
  console.log({ verif });
  console.timeEnd("Falcon-rs verify");
  const packedPubK: string[] = falcon.pack_public_key_wasm(new Uint16Array(pkNtt)); // for deployment of Starknet account
  console.log({ packedPubK }, "size =", packedPubK.length);
  const pubKLen = falcon.public_key_length(); // qty of bytes
  console.log({ len: pubKLen });
  const saltLen = falcon.salt_length(); // qty of bytes
  console.log({ saltLen });

  // =============================
  // With falcon512 Starknet.js signer
  // for S2morrow Starknet account
  // =============================

  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

