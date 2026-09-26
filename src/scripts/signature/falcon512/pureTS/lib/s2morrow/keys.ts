import { hexToBytes } from '@noble/hashes/utils.js';
import { nobleEngine } from '../engine/engine';
import { N, Q } from './constants';
import { feltToHex } from './felt';
import { divZq, modQ, mulNegacyclicInt, mulZq, ntt } from './ntt';
import { packPoly } from './packing';

export const SECRET_KEY_LENGTH = 1281;
export const PUBLIC_KEY_LENGTH = 897;
export const SEED_LENGTH = 48;
export const FALCON_RS_SECRET_KEY_LENGTH = 3584;
const FALCON_RS_POLY_LENGTH = 896;
const SECRET_KEY_HEADER = 0x59; // 0x50 + log2(512)
const PUBLIC_KEY_HEADER = 0x09; // 0x00 + log2(512)
const FG_BITS = 6;
const CAPITAL_FG_BITS = 8;
const FG_MAX = 31; // 2^(6-1) - 1
const CAPITAL_FG_MAX = 127; // 2^(8-1) - 1
const FG_BYTES = (N * FG_BITS) / 8; // 384

export type Falcon512KeyPair = { secretKey: Uint8Array; publicKey: Uint8Array };
/** NTRU secret polynomials, with f·G − g·F = q. */
export type SecretPolys = { f: Int8Array; g: Int8Array; F: Int8Array; G: Int8Array };

/** Copies a Uint8Array, or parses a hex string (with or without 0x), and checks its length. */
export function toBytes(input: Uint8Array | string, expectedLength: number, label: string): Uint8Array {
  let bytes: Uint8Array;
  if (input instanceof Uint8Array) {
    bytes = Uint8Array.from(input);
  } else if (typeof input === 'string') {
    const hex = input.startsWith('0x') || input.startsWith('0X') ? input.slice(2) : input;
    if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
      throw new Error(`Falcon512: ${label} is not a valid hex string`);
    }
    bytes = hexToBytes(hex);
  } else {
    throw new Error(`Falcon512: ${label} must be a Uint8Array or a hex string`);
  }
  if (bytes.length !== expectedLength) {
    throw new Error(`Falcon512: ${label} must be ${expectedLength} bytes, got ${bytes.length}`);
  }
  return bytes;
}

const wipe = (...arrays: { fill(value: number): unknown }[]): void => {
  for (const a of arrays) a.fill(0);
};
const center = (x: number): number => (x > Q >> 1 ? x - Q : x);
const toSigned = (raw: number, bits: number): number => (raw << (32 - bits)) >> (32 - bits);

// NIST encodings: MSB-first bit packing.
function encodeBitsMSB(values: ArrayLike<number>, bits: number): Uint8Array {
  const out = new Uint8Array((values.length * bits) / 8);
  const mask = (1 << bits) - 1;
  let acc = 0;
  let accBits = 0;
  let pos = 0;
  for (let i = 0; i < values.length; i++) {
    acc = (acc << bits) | (values[i] & mask);
    accBits += bits;
    while (accBits >= 8) {
      accBits -= 8;
      out[pos++] = (acc >>> accBits) & 0xff;
    }
    acc &= (1 << accBits) - 1;
  }
  return out;
}

function decodeBitsMSB(bytes: Uint8Array, count: number, bits: number): number[] {
  if (bytes.length * 8 !== count * bits) throw new Error('Falcon512: invalid encoding length');
  const out: number[] = [];
  const mask = (1 << bits) - 1;
  let acc = 0;
  let accBits = 0;
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc << 8) | bytes[i];
    accBits += 8;
    while (accBits >= bits) {
      accBits -= bits;
      out.push((acc >>> accBits) & mask);
    }
    acc &= (1 << accBits) - 1;
  }
  return out;
}

// falcon-rs encoding: 14-bit LSB-first packing of values mod q.
function encode14LSB(values: ArrayLike<number>): Uint8Array {
  const out = new Uint8Array(FALCON_RS_POLY_LENGTH);
  let acc = 0;
  let accBits = 0;
  let pos = 0;
  for (let i = 0; i < values.length; i++) {
    acc |= values[i] << accBits;
    accBits += 14;
    while (accBits >= 8) {
      out[pos++] = acc & 0xff;
      acc >>>= 8;
      accBits -= 8;
    }
  }
  return out;
}

function decode14LSB(bytes: Uint8Array): number[] {
  const out: number[] = [];
  let acc = 0;
  let accBits = 0;
  let pos = 0;
  for (let i = 0; i < N; i++) {
    while (accBits < 14) {
      acc |= bytes[pos++] << accBits;
      accBits += 8;
    }
    const v = acc & 0x3fff;
    acc >>>= 14;
    accBits -= 14;
    if (v >= Q) throw new Error('Falcon512: invalid falcon-rs secret key (coefficient out of range)');
    out.push(v);
  }
  return out;
}

function checkRange(poly: ArrayLike<number>, max: number, label: string): void {
  for (let i = 0; i < poly.length; i++) {
    if (poly[i] < -max || poly[i] > max) {
      throw new Error(`Falcon512: invalid secret key (${label} coefficient out of range)`);
    }
  }
}

/** G = g·F / f mod q, centered; throws if f is not invertible or G is not small. */
function completeG(f: Int8Array, g: Int8Array, F: Int8Array): Int8Array {
  const G = divZq(mulZq(g, F), f).map(center);
  checkRange(G, CAPITAL_FG_MAX, 'G');
  return Int8Array.from(G);
}

/** Checks the NTRU equation f·G − g·F = q over Z[x]/(x^512 + 1). */
function checkNtruEquation({ f, g, F, G }: SecretPolys): void {
  const fG = mulNegacyclicInt(f, G);
  const gF = mulNegacyclicInt(g, F);
  for (let i = 0; i < N; i++) {
    if (fG[i] - gF[i] !== (i === 0 ? Q : 0)) {
      throw new Error('Falcon512: invalid secret key (NTRU equation not satisfied)');
    }
  }
}

function decodeSigned(bytes: Uint8Array, bits: number, label: string): Int8Array {
  const min = -(1 << (bits - 1));
  return Int8Array.from(decodeBitsMSB(bytes, N, bits), (raw) => {
    const v = toSigned(raw, bits);
    if (v === min) throw new Error(`Falcon512: invalid secret key (forbidden ${label} coefficient)`);
    return v;
  });
}

/** Decodes and fully validates a NIST Falcon-512 secret key. The caller must wipe the result. */
export function decodeSecretKey(secretKey: Uint8Array | string): SecretPolys {
  const bytes = toBytes(secretKey, SECRET_KEY_LENGTH, 'secret key');
  const parts: Int8Array[] = [];
  try {
    if (bytes[0] !== SECRET_KEY_HEADER) throw new Error('Falcon512: invalid secret key header');
    const f = decodeSigned(bytes.subarray(1, 1 + FG_BYTES), FG_BITS, 'f');
    parts.push(f);
    const g = decodeSigned(bytes.subarray(1 + FG_BYTES, 1 + 2 * FG_BYTES), FG_BITS, 'g');
    parts.push(g);
    const F = decodeSigned(bytes.subarray(1 + 2 * FG_BYTES), CAPITAL_FG_BITS, 'F');
    parts.push(F);
    const G = completeG(f, g, F);
    parts.push(G);
    const polys = { f, g, F, G };
    checkNtruEquation(polys);
    return polys;
  } catch (error) {
    wipe(...parts);
    throw error;
  } finally {
    wipe(bytes);
  }
}

/** Encodes f, g, F into a NIST Falcon-512 secret key. */
export function encodeSecretKey({ f, g, F }: Pick<SecretPolys, 'f' | 'g' | 'F'>): Uint8Array {
  checkRange(f, FG_MAX, 'f');
  checkRange(g, FG_MAX, 'g');
  checkRange(F, CAPITAL_FG_MAX, 'F');
  const out = new Uint8Array(SECRET_KEY_LENGTH);
  out[0] = SECRET_KEY_HEADER;
  out.set(encodeBitsMSB(Array.from(f, (v) => v & 0x3f), FG_BITS), 1);
  out.set(encodeBitsMSB(Array.from(g, (v) => v & 0x3f), FG_BITS), 1 + FG_BYTES);
  out.set(encodeBitsMSB(Array.from(F, (v) => v & 0xff), CAPITAL_FG_BITS), 1 + 2 * FG_BYTES);
  return out;
}

/** Decodes a NIST Falcon-512 public key into h (coefficients in [0, q)). */
export function decodePublicKey(publicKey: Uint8Array | string): Uint16Array {
  const bytes = toBytes(publicKey, PUBLIC_KEY_LENGTH, 'public key');
  if (bytes[0] !== PUBLIC_KEY_HEADER) throw new Error('Falcon512: invalid public key header');
  const h = decodeBitsMSB(bytes.subarray(1), N, 14);
  if (h.some((v) => v >= Q)) throw new Error('Falcon512: invalid public key (coefficient out of range)');
  return Uint16Array.from(h);
}

/** Encodes h into a NIST Falcon-512 public key. */
export function encodePublicKey(h: ArrayLike<number>): Uint8Array {
  if (h.length !== N) throw new Error(`Falcon512: public key polynomial must have ${N} coefficients`);
  for (let i = 0; i < N; i++) {
    if (!Number.isInteger(h[i]) || h[i] < 0 || h[i] >= Q) {
      throw new Error('Falcon512: invalid public key (coefficient out of range)');
    }
  }
  const out = new Uint8Array(PUBLIC_KEY_LENGTH);
  out[0] = PUBLIC_KEY_HEADER;
  out.set(encodeBitsMSB(h, 14), 1);
  return out;
}

/** New key pair (NIST formats). The optional seed must be 48 bytes from a CSPRNG. */
export function generateKeyPair(seed?: Uint8Array): Falcon512KeyPair {
  if (seed !== undefined && (!(seed instanceof Uint8Array) || seed.length !== SEED_LENGTH)) {
    throw new Error(`Falcon512: seed must be a Uint8Array of ${SEED_LENGTH} bytes`);
  }
  return nobleEngine.keygen(seed);
}

/** Public key h = g / f mod q of a validated secret key (NIST format). */
export function getPublicKey(secretKey: Uint8Array | string): Uint8Array {
  const polys = decodeSecretKey(secretKey);
  try {
    return encodePublicKey(divZq(polys.g, polys.f));
  } finally {
    wipe(polys.f, polys.g, polys.F, polys.G);
  }
}

/** NTT of h, as stored by the S2morrow account. */
export function publicKeyToNtt(publicKey: Uint8Array | string): Uint16Array {
  return Uint16Array.from(ntt(decodePublicKey(publicKey)));
}

/** The 29 felts of the account constructor argument `pk_packed`. */
export function getStarknetPublicKey(publicKey: Uint8Array | string): string[] {
  return packPoly(publicKeyToNtt(publicKey)).map(feltToHex);
}

/** Converts a falcon-rs secret key (f‖g‖F‖G, 4 × 896 bytes) into a NIST secret key. */
export function importFalconRsSecretKey(secretKey: Uint8Array | string): Uint8Array {
  const bytes = toBytes(secretKey, FALCON_RS_SECRET_KEY_LENGTH, 'falcon-rs secret key');
  const parts: Int8Array[] = [];
  try {
    const names = ['f', 'g', 'F', 'G'];
    const [f, g, F, G] = names.map((name, k) => {
      const chunk = bytes.subarray(k * FALCON_RS_POLY_LENGTH, (k + 1) * FALCON_RS_POLY_LENGTH);
      const poly = decode14LSB(chunk).map(center);
      checkRange(poly, k < 2 ? FG_MAX : CAPITAL_FG_MAX, name);
      const p = Int8Array.from(poly);
      parts.push(p);
      return p;
    });
    const recomputed = completeG(f, g, F);
    parts.push(recomputed);
    if (recomputed.some((v, i) => v !== G[i])) {
      throw new Error('Falcon512: invalid falcon-rs secret key (G does not match f, g, F)');
    }
    checkNtruEquation({ f, g, F, G });
    return encodeSecretKey({ f, g, F });
  } finally {
    wipe(bytes, ...parts);
  }
}

/** Converts a NIST secret key into the falcon-rs format (f‖g‖F‖G, 4 × 896 bytes). */
export function exportFalconRsSecretKey(secretKey: Uint8Array | string): Uint8Array {
  const polys = decodeSecretKey(secretKey);
  try {
    const out = new Uint8Array(FALCON_RS_SECRET_KEY_LENGTH);
    [polys.f, polys.g, polys.F, polys.G].forEach((p, k) => {
      out.set(encode14LSB(Array.from(p, modQ)), k * FALCON_RS_POLY_LENGTH);
    });
    return out;
  } finally {
    wipe(polys.f, polys.g, polys.F, polys.G);
  }
}
