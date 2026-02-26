// Test functionalities of sharedSecret
// Launch with npx ts-node src/scripts/signature/17.sharedSecret.ts
// Coded with Starknet.js v8.3.0

import { encode, stark, constants, num, ec, type BigNumberish } from "starknet";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });

function getSharedSecret(privateKey: BigNumberish, fullPublicKey: BigNumberish): string {
  const privK = num.toHex(privateKey);
  console.log("fn privK=", privK);
  const fullPubK = num.toBigInt(fullPublicKey).toString(16).padStart(130, '0');
  console.log("fn fullPubK=", fullPubK);
  const sharedSecret = encode.buf2hex(ec.starkCurve.getSharedSecret(privK, fullPubK));
  return encode.addHexPrefix(sharedSecret);
}

const userAPrivK = stark.randomAddress();
//const userAPubK = ec.starkCurve.getStarkKey(userAPrivK);
const userAFullPubK = stark.getFullPublicKey(userAPrivK);
console.log("user A private key =", userAPrivK);
console.log("user A public key  =", userAFullPubK);
const userBPrivK = stark.randomAddress();
const userBFullPubK = stark.getFullPublicKey(userBPrivK);
console.log("user B public key =", userBFullPubK);
// User B is sending its pubK to user A.
// user A is calculating the secret
const sharedSecretA = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getSharedSecret(userAPrivK, encode.removeHexPrefix(userBFullPubK))));
console.log("shared secret calculated by A=", sharedSecretA);
// User A is sending its pubK to user B.
// user B is calculating the secret
const sharedSecretB = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getSharedSecret(userBPrivK, encode.removeHexPrefix(userAFullPubK))));
console.log("shared secret calculated by B=", sharedSecretB);
console.log(sharedSecretA == sharedSecretB ? "✅" : "❌ not", "identical!");
// Now A and B have shared a password without exposing it!

const sharedSecretA_2 = getSharedSecret(userAPrivK, userBFullPubK);
console.log("shared secret calculated by A_2=", sharedSecretA_2);


console.log("✅ Test performed.");
