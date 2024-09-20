// to reproduce in Typescript the Cairo compute_keccak_byte_array()
// coded with Starknet.js v6.13.0 

import { keccak_256 } from "@noble/hashes/sha3";
import { encode, type Uint256, cairo } from "starknet";

function swapU128Endians(val: string): string {
  let res: string = "";
  for (let i: number = 0; i < 16; i++) {
    res += val.slice(30 - i * 2, 32 - i * 2);
  }
  return res
}

const str0 = "get_balance";

const buf = encode.utf8ToArray(str0);
const h256: string = encode.addHexPrefix(encode.buf2hex(keccak_256(buf)));
const hU256: Uint256 = cairo.uint256(h256);
const swappedEndianLow: string = swapU128Endians(BigInt(hU256.low).toString(16).padStart(32, "0"));
const swappedEndianHigh: string = swapU128Endians(BigInt(hU256.high).toString(16).padStart(32, "0"));
const result = encode.addHexPrefix(swappedEndianLow + swappedEndianHigh);
console.log({ result });
console.log(BigInt(result));
