import { bytesToHex, randomBytes as cryptoRandomBytes } from '@noble/hashes/utils.js';
import { nobleEngine, type FalconEngine } from '../engine/engine';
import { N, PACKED_SLOTS, Q, SALT_FELTS, SIG_BOUND_512, SIGNATURE_FELTS } from './constants';
import { assertFelt, feltToHex, parseFelt } from './felt';
import { hashToPoint } from './hashToPoint';
import { intt, modQ, ntt } from './ntt';
import { packPoly, unpackPoly } from './packing';

/** Decoded S2morrow signature (Serde of PackedFalconSignatureWithHint). */
export type FalconStarknetSignature = { s1: Uint16Array; salt: bigint[]; mulHint: Uint16Array };
/** Injectable dependencies of signHash (tests only). */
export type SignDeps = { engine: FalconEngine; randomBytes: (length: number) => Uint8Array };

const defaultDeps: SignDeps = { engine: nobleEngine, randomBytes: cryptoRandomBytes };

/** mul_hint = INTT(NTT(s1) ⊙ pkNtt) = s1·h mod (x^512 + 1, q). */
export function computeMulHint(s1: ArrayLike<number>, pkNtt: ArrayLike<number>): number[] {
  const s1Ntt = ntt(s1);
  return intt(s1Ntt.map((v, i) => (v * pkNtt[i]) % Q));
}

const centeredSquare = (x: number): number => {
  const c = x <= (Q - 1) / 2 ? x : Q - x;
  return c * c;
};

/**
 * Mirror of falcon.cairo `verify_with_msg_point`: NTT(s1) ⊙ pkNtt = NTT(mulHint), and
 * ‖hashPoint − mulHint‖² + ‖s1‖² ≤ SIG_BOUND_512 (centered norms). Inputs in [0, q).
 */
export function checkSignatureEquation(
  hashPoint: ArrayLike<number>,
  s1: ArrayLike<number>,
  mulHint: ArrayLike<number>,
  pkNtt: ArrayLike<number>
): boolean {
  if (hashPoint.length !== N || s1.length !== N || mulHint.length !== N || pkNtt.length !== N) return false;
  const s1Ntt = ntt(s1);
  const hintNtt = ntt(mulHint);
  for (let i = 0; i < N; i++) {
    if ((s1Ntt[i] * pkNtt[i]) % Q !== hintNtt[i]) return false;
  }
  let norm = 0;
  for (let i = 0; i < N; i++) {
    norm += centeredSquare(modQ(hashPoint[i] - mulHint[i])) + centeredSquare(s1[i]);
  }
  return norm <= SIG_BOUND_512;
}

/** 61 felts: [s1 packed (29)] [salt length] [salt…] [mul_hint packed (29)]. */
export function formatSignature(sig: FalconStarknetSignature): string[] {
  return [...packPoly(sig.s1), BigInt(sig.salt.length), ...sig.salt, ...packPoly(sig.mulHint)].map(feltToHex);
}

/** Strict parsing of a 61-felt signature (hex or decimal strings, numbers, bigints). */
export function parseSignature(signature: readonly unknown[]): FalconStarknetSignature {
  if (!Array.isArray(signature) || signature.length !== SIGNATURE_FELTS) {
    throw new Error(`Falcon512: signature must have ${SIGNATURE_FELTS} felts`);
  }
  const felts = signature.map((x, i) => parseFelt(x, `signature[${i}]`));
  if (felts[PACKED_SLOTS] !== BigInt(SALT_FELTS)) throw new Error('Falcon512: unexpected salt length');
  const saltStart = PACKED_SLOTS + 1;
  return {
    s1: unpackPoly(felts.slice(0, PACKED_SLOTS)),
    salt: felts.slice(saltStart, saltStart + SALT_FELTS),
    mulHint: unpackPoly(felts.slice(saltStart + SALT_FELTS)),
  };
}

const randomSaltFelt = (randomBytes: SignDeps['randomBytes']): bigint =>
  BigInt('0x' + bytesToHex(randomBytes(31))); // 248 bits < P

/**
 * Signs a message hash for the S2morrow account (internal: never exported by lib/index.ts, to avoid
 * blind signing). The engine draws its own sampler seed, independent from the public salt. The
 * encoded signature is re-checked (reusing the hash point) before being returned.
 */
export function signHash(
  msgHash: bigint,
  secretKey: Uint8Array,
  pkNtt: Uint16Array,
  deps: SignDeps = defaultDeps
): string[] {
  assertFelt(msgHash, 'message hash');
  const salt = [randomSaltFelt(deps.randomBytes), randomSaltFelt(deps.randomBytes)];
  const hashPoint = hashToPoint([msgHash], salt);
  const s2 = deps.engine.signHashPoint(hashPoint, secretKey);
  const s1 = Uint16Array.from(s2, modQ);
  const mulHint = Uint16Array.from(computeMulHint(s1, pkNtt));
  const signature = formatSignature({ s1, salt, mulHint });
  const decoded = parseSignature(signature);
  if (!checkSignatureEquation(hashPoint, decoded.s1, decoded.mulHint, pkNtt)) {
    throw new Error('Falcon512: self-verification failed, signature discarded');
  }
  return signature;
}

/** Verifies a 61-felt signature of msgHash; false for any malformed input. */
export function verifyHash(msgHash: bigint, signature: readonly unknown[], pkNtt: ArrayLike<number>): boolean {
  let decoded: FalconStarknetSignature;
  try {
    assertFelt(msgHash, 'message hash');
    decoded = parseSignature(signature);
  } catch {
    return false;
  }
  return checkSignatureEquation(hashToPoint([msgHash], decoded.salt), decoded.s1, decoded.mulHint, pkNtt);
}
