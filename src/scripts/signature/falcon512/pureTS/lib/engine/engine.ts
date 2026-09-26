import { falcon512 } from './noble/falcon';

/** Falcon-512 primitives used by the S2morrow layer (NIST key formats). */
export interface FalconEngine {
  keygen(seed?: Uint8Array): { secretKey: Uint8Array; publicKey: Uint8Array };
  getPublicKey(secretKey: Uint8Array): Uint8Array;
  signHashPoint(hashPoint: Uint16Array, secretKey: Uint8Array): Int16Array;
  verifyHashPoint(s2: Int16Array, hashPoint: Uint16Array, publicKey: Uint8Array): boolean;
}

/** Engine backed by the vendored @noble/post-quantum 0.7.1 (patched, see noble/PATCH.md). */
export const nobleEngine: FalconEngine = Object.freeze({
  keygen: (seed?: Uint8Array) => falcon512.keygen(seed),
  getPublicKey: (secretKey: Uint8Array) => falcon512.getPublicKey(secretKey),
  signHashPoint: (hashPoint: Uint16Array, secretKey: Uint8Array) => falcon512.internal.sign(hashPoint, secretKey),
  verifyHashPoint: (s2: Int16Array, hashPoint: Uint16Array, publicKey: Uint8Array) =>
    falcon512.internal.verify(s2, hashPoint, publicKey),
});
