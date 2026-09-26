import { poseidonHashMany, poseidonSmall } from '@scure/starknet';
import { MASK_128, N, QB } from './constants';
import { assertFelt } from './felt';

/**
 * S2morrow Poseidon hash-to-point (same as falcon-rs poseidon_hash.rs and the Cairo contract):
 * seed = poseidon_hash_span(message ‖ salt); state = [seed, 0, 0]; 21 Hades permutations each give
 * 12 base-Q digits from state[0] and 12 from state[1], a 22nd gives the last 8 from state[0].
 * Each felt yields 6 digits from its low u128, then 6 from its high u128.
 */
export function hashToPoint(message: readonly bigint[], salt: readonly bigint[]): Uint16Array {
  message.forEach((m) => assertFelt(m, 'message element'));
  salt.forEach((s) => assertFelt(s, 'salt element'));
  const out = new Uint16Array(N);
  let idx = 0;
  const extract6 = (value: bigint): void => {
    let v = value;
    for (let i = 0; i < 6 && idx < N; i++) {
      out[idx++] = Number(v % QB);
      v /= QB;
    }
  };
  const extract12 = (felt: bigint): void => {
    extract6(felt & MASK_128);
    extract6(felt >> 128n);
  };
  let state: bigint[] = [poseidonHashMany([...message, ...salt]), 0n, 0n];
  for (let round = 0; round < 21; round++) {
    state = poseidonSmall(state);
    extract12(state[0]);
    extract12(state[1]);
  }
  state = poseidonSmall(state);
  extract12(state[0]);
  return out;
}
