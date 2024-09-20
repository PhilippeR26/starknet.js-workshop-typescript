// to reproduce in Typescript the Cairo keccak_u256s_le_inputs()
// Coded with Starknet.js v6.13.0 

import { keccak_256 } from "@noble/hashes/sha3";
import { encode, type Uint256, cairo, uint256, num } from "starknet";

function swapU128Endians(val: string): string {
  let res: string = "";
  for (let i: number = 0; i < 16; i++) {
    res += val.slice(30 - i * 2, 32 - i * 2);
  }
  return res
}
function swapU256Endians(val: string): string {
  let res: string = "";
  for (let i: number = 0; i < 32; i++) {
    res += val.slice(62 - i * 2, 64 - i * 2);
  }
  return res
}

const u256array: Uint256[] = [
  cairo.uint256("0x0000000000000000000000000000000000000000000000000000000000030201"),
  cairo.uint256("0x0000000000000000000000000000000000000000000000000000000000060504")
];
const hexConcat: string = encode.addHexPrefix(u256array.reduce((res: string, u256: Uint256) => { return res + swapU256Endians (uint256.uint256ToBN(u256).toString(16).padStart(64, "0")) }, ""))
const buf: Uint8Array = num.hexToBytes(hexConcat);
const h256: string = encode.addHexPrefix(encode.buf2hex(keccak_256(buf)));
const hU256: Uint256 = cairo.uint256(h256);
const swappedEndianLow: string = swapU128Endians(BigInt(hU256.low).toString(16).padStart(32, "0"));
const swappedEndianHigh: string = swapU128Endians(BigInt(hU256.high).toString(16).padStart(32, "0"));
const result = encode.addHexPrefix(swappedEndianLow + swappedEndianHigh);
console.log({ result });
console.log(BigInt(result));

