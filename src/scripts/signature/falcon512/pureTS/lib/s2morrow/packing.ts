import { MASK_128, N, PACKED_SLOTS, Q, QB, VALUES_PER_HALF } from './constants';
import { assertFelt } from './felt';

const horner = (values: ArrayLike<number>, start: number, end: number): bigint => {
  let acc = 0n;
  for (let i = end - 1; i >= start; i--) acc = acc * QB + BigInt(values[i]);
  return acc;
};

/**
 * Packs 512 Zq values into 29 felt252 (falcon-rs packing.rs / Cairo packing.cairo):
 * felt = horner(v0..v8) + horner(v9..v17) * 2^128; the last felt holds 8 values in its low half.
 */
export function packPoly(poly: ArrayLike<number>): bigint[] {
  if (poly.length !== N) throw new Error(`Falcon512: polynomial must have ${N} coefficients`);
  for (let i = 0; i < N; i++) {
    const v = poly[i];
    if (!Number.isInteger(v) || v < 0 || v >= Q) {
      throw new Error('Falcon512: polynomial coefficient out of range');
    }
  }
  const out: bigint[] = [];
  for (let start = 0; start < N; start += 2 * VALUES_PER_HALF) {
    const mid = Math.min(start + VALUES_PER_HALF, N);
    const end = Math.min(start + 2 * VALUES_PER_HALF, N);
    out.push(horner(poly, start, mid) + (horner(poly, mid, end) << 128n));
  }
  return out;
}

/** Unpacks 29 felt252 into 512 Zq values; only the canonical encoding is accepted. */
export function unpackPoly(felts: readonly bigint[]): Uint16Array {
  if (felts.length !== PACKED_SLOTS) {
    throw new Error(`Falcon512: packed polynomial must have ${PACKED_SLOTS} felts`);
  }
  const out = new Uint16Array(N);
  let idx = 0;
  for (const felt of felts) {
    assertFelt(felt, 'packed polynomial slot');
    for (const half of [felt & MASK_128, felt >> 128n]) {
      const count = Math.min(VALUES_PER_HALF, N - idx);
      if (half >= QB ** BigInt(count)) throw new Error('Falcon512: non-canonical packed polynomial');
      let v = half;
      for (let i = 0; i < count; i++) {
        out[idx++] = Number(v % QB);
        v /= QB;
      }
    }
  }
  return out;
}
