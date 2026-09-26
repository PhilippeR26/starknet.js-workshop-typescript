import { N, Q } from './constants';
import { NTT_ROOTS_ALL } from './nttRoots';

/** Inverse of 2 mod q. */
const I2 = 6145;
/** Square root of -1 mod q (NTT root for n = 2). */
const SQR1 = 1479;

/** Reduces an integer to [0, q). */
export const modQ = (a: number): number => ((a % Q) + Q) % Q;

function powMod(base: number, exponent: number): number {
  let result = 1;
  let b = modQ(base);
  for (let e = exponent; e > 0; e >>= 1) {
    if (e & 1) result = (result * b) % Q;
    b = (b * b) % Q;
  }
  return result;
}

/** Inverse mod q (Fermat); throws for 0. No cache: inputs may be derived from secret keys. */
export function invMod(x: number): number {
  const r = modQ(x);
  if (r === 0) throw new Error('Falcon512: 0 has no inverse mod q');
  return powMod(r, Q - 2);
}

/** Roots used at size n (falcon.py `roots_dict_Zq[n]`). */
export const nttRoots = (n: number): readonly number[] => NTT_ROOTS_ALL.slice(n - 2, 2 * n - 2);

function checkSize(n: number): void {
  if (n < 2 || n > N || (n & (n - 1)) !== 0) {
    throw new Error(`Falcon512: NTT size must be a power of 2 in [2, ${N}], got ${n}`);
  }
}

function nttRec(f: number[]): number[] {
  const n = f.length;
  if (n === 2) {
    const t = (SQR1 * f[1]) % Q;
    return [modQ(f[0] + t), modQ(f[0] - t)];
  }
  const half = n / 2;
  const even: number[] = new Array(half);
  const odd: number[] = new Array(half);
  for (let i = 0; i < half; i++) {
    even[i] = f[2 * i];
    odd[i] = f[2 * i + 1];
  }
  const a = nttRec(even);
  const b = nttRec(odd);
  const w = nttRoots(n);
  const out: number[] = new Array(n);
  for (let i = 0; i < half; i++) {
    const wb = (w[2 * i] * b[i]) % Q;
    out[2 * i] = modQ(a[i] + wb);
    out[2 * i + 1] = modQ(a[i] - wb);
  }
  return out;
}

function inttRec(fNtt: number[]): number[] {
  const n = fNtt.length;
  if (n === 2) {
    const s = modQ(fNtt[0] + fNtt[1]);
    const d = modQ(fNtt[0] - fNtt[1]);
    return [(I2 * s) % Q, (((I2 * invMod(SQR1)) % Q) * d) % Q];
  }
  const half = n / 2;
  const w = nttRoots(n);
  const f0: number[] = new Array(half);
  const f1: number[] = new Array(half);
  for (let i = 0; i < half; i++) {
    const s = modQ(fNtt[2 * i] + fNtt[2 * i + 1]);
    const d = modQ(fNtt[2 * i] - fNtt[2 * i + 1]);
    f0[i] = (I2 * s) % Q;
    f1[i] = (((I2 * d) % Q) * invMod(w[2 * i])) % Q;
  }
  const a = inttRec(f0);
  const b = inttRec(f1);
  const out: number[] = new Array(n);
  for (let i = 0; i < half; i++) {
    out[2 * i] = a[i];
    out[2 * i + 1] = b[i];
  }
  return out;
}

/** NTT in the falcon.py convention (same as falcon-rs and falcon.cairo). Coefficients may be negative. */
export function ntt(f: ArrayLike<number>): number[] {
  checkSize(f.length);
  return nttRec(Array.from(f, modQ));
}

/** Inverse NTT; output in [0, q). */
export function intt(fNtt: ArrayLike<number>): number[] {
  checkSize(fNtt.length);
  return inttRec(Array.from(fNtt, modQ));
}

/** Product in Zq[x]/(x^n + 1). */
export function mulZq(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
  if (a.length !== b.length) throw new Error('Falcon512: polynomial sizes differ');
  const an = ntt(a);
  const bn = ntt(b);
  return intt(an.map((v, i) => (v * bn[i]) % Q));
}

/** Quotient a / b in Zq[x]/(x^n + 1); throws if b is not invertible. */
export function divZq(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
  if (a.length !== b.length) throw new Error('Falcon512: polynomial sizes differ');
  const an = ntt(a);
  const bn = ntt(b);
  if (bn.some((v) => v === 0)) throw new Error('Falcon512: polynomial is not invertible mod q');
  return intt(an.map((v, i) => (v * invMod(bn[i])) % Q));
}

/**
 * Exact integer product in Z[x]/(x^n + 1). Only for small coefficients (NTRU equation check,
 * test reference): every partial sum must stay below 2^53.
 */
export function mulNegacyclicInt(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
  const n = a.length;
  if (b.length !== n) throw new Error('Falcon512: polynomial sizes differ');
  const r: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const ai = a[i];
    if (ai === 0) continue;
    for (let j = 0; j < n; j++) {
      const k = i + j;
      if (k < n) r[k] += ai * b[j];
      else r[k - n] -= ai * b[j];
    }
  }
  return r;
}
