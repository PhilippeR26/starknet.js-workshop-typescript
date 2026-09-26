import { STARK_PRIME } from './constants';

/** Throws if x is not a felt252 (0 <= x < P). */
export function assertFelt(x: bigint, label: string): void {
  if (typeof x !== 'bigint' || x < 0n || x >= STARK_PRIME) {
    throw new Error(`Falcon512: ${label} is not a felt252`);
  }
}

/** Parses a felt252 given as a bigint, a safe integer, a hex string ("0x…") or a decimal string. */
export function parseFelt(value: unknown, label: string): bigint {
  let x: bigint;
  if (typeof value === 'bigint') {
    x = value;
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    x = BigInt(value);
  } else if (typeof value === 'string' && /^(0[xX][0-9a-fA-F]+|[0-9]+)$/.test(value)) {
    x = BigInt(value);
  } else {
    throw new Error(`Falcon512: ${label} is not a felt252`);
  }
  assertFelt(x, label);
  return x;
}

/** Felt representation used in calldata and signatures: "0x" + lowercase hex, no padding. */
export const feltToHex = (x: bigint): string => '0x' + x.toString(16);
