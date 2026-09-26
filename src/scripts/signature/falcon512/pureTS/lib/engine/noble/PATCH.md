# Vendored `@noble/post-quantum` 0.7.1 — patch notes

## Origin

- Package: `@noble/post-quantum@0.7.1` (npm): `src/falcon.ts`, `src/_crystals.ts`, `src/utils.ts`, `LICENSE` (MIT, Paul Miller).
- npm integrity: `sha512-+P9981IiAnVh+rmcubozzVwrEy3XsN/tMhTnvsjV9VDaYpOnNCqWqKo2FLWxbu92YHfjGIlE5XnW175UK+ln+Q==`
- Upstream repository: https://github.com/paulmillr/noble-post-quantum

## Why a vendored copy

Falcon's `HashToPoint` (SHAKE256) is hard-coded inside `genFalcon`. The S2morrow account contract
verifies signatures of a **Poseidon** hash point, so the signer must sign a hash point computed
outside noble. Version 0.7.1 has no hook for that. The patch mirrors what noble already offers for
ML-DSA (`ml_dsa*.internal` with `externalMu`) and is meant to be proposed upstream later.

## Changes (nothing else is modified)

1. Relative import specifiers `'./x.ts'` → `'./x'` (ts-node CommonJS and Jest resolution of this workshop).
2. New exported types `FalconInternalSignOpts` and `FalconInternal`; field `internal` added to type `Falcon`.
3. New `internal` object inside `genFalcon`, added to the returned API:
   - `internal.sign(hashPoint, secretKey, opts?)`: sampling loop of `signRaw` without nonce, SHAKE256
     hash-to-point and compression; returns the raw signed `s2`; draws its own 48-byte sampler seed
     (`opts.random` for tests only); throws after 1000 attempts (`opts.maxIterations`) instead of
     looping forever; validates the hash point (512 coefficients < q) and works on a copy.
   - `internal.verify(s2, hashPoint, publicKey)`: `verifyRaw` without decoding and hashing.

## Diff against upstream

```diff
--- upstream/_crystals.ts
+++ vendored/_crystals.ts
@@ -13,7 +13,7 @@
   getMask,
   type TArg,
   type TRet,
-} from './utils.ts';
+} from './utils';
 
 /** Extendable-output reader used by the CRYSTALS implementations. */
 export type XOF = (
--- upstream/falcon.ts
+++ vendored/falcon.ts
@@ -22,7 +22,7 @@
   u32,
   u8,
 } from '@noble/hashes/utils.js';
-import { genCrystals, type TypedCons } from './_crystals.ts';
+import { genCrystals, type TypedCons } from './_crystals';
 import {
   baswap64If,
   type BytesCoderLen,
@@ -40,7 +40,7 @@
   validateVerOpts,
   SIG_OPT_KEYS,
   type VerOpts,
-} from './utils.ts';
+} from './utils';
 /*
 FIPS-206 would likely improve the situation with spec.
 
@@ -1290,9 +1290,25 @@
   open(sig: Uint8Array, publicKey: Uint8Array, opts?: VerOpts): Uint8Array;
 };
 /** Falcon detached-signature API with an attached-signature helper. */
+/** PATCH: options of `internal.sign` (tests only). */
+export type FalconInternalSignOpts = {
+  /** Sampler-seed source (48 bytes). Default: crypto.getRandomValues. */
+  random?: (bytesLength?: number) => Uint8Array;
+  /** Maximum sampling attempts before throwing. Default: 1000. */
+  maxIterations?: number;
+};
+/** PATCH: signing / verification of an externally computed hash point (like ml-dsa `internal`). */
+export type FalconInternal = {
+  /** Signs a hash point (N coefficients mod q); returns the raw signed s2 polynomial. */
+  sign(hashPoint: Uint16Array, secretKey: Uint8Array, opts?: FalconInternalSignOpts): Int16Array;
+  /** Checks that s2 is a valid signature of the hash point for the public key. */
+  verify(s2: Int16Array, hashPoint: Uint16Array, publicKey: Uint8Array): boolean;
+};
 export type Falcon = Signer & {
   /** Attached-signature helper for the same Falcon parameter set. */
   attached: FalconAttached;
+  /** PATCH: external hash-point API. */
+  internal: FalconInternal;
 };
 
 function genFalcon(opts: FalconOpts): TRet<Falcon> {
@@ -2471,6 +2487,89 @@
       }
     },
   });
+  // PATCH (starknet.js-workshop pureTS): signing / verification of an externally computed hash
+  // point, mirroring ml-dsa `internal` + `externalMu`. See PATCH.md.
+  const INTERNAL_MAX_ITERATIONS = 1000;
+  const checkHashPoint = (hashPoint: TArg<Uint16Array>): void => {
+    if (!(hashPoint instanceof Uint16Array) || hashPoint.length !== N)
+      throw new Error(`hashPoint: expected Uint16Array(${N})`);
+    for (let i = 0; i < N; i++)
+      if (hashPoint[i] >= Q) throw new Error('hashPoint: coefficient out of range');
+  };
+  const internal: TRet<FalconInternal> = Object.freeze({
+    sign(
+      hashPoint: TArg<Uint16Array>,
+      sk: TArg<Uint8Array>,
+      internalOpts: TArg<FalconInternalSignOpts> = {}
+    ): TRet<Int16Array> {
+      checkHashPoint(hashPoint);
+      abytes(sk, secretKeyCoder.bytesLen, 'secretKey');
+      const rnd = (internalOpts.random ?? randomBytes) as FalconRandom;
+      const maxIterations = internalOpts.maxIterations ?? INTERNAL_MAX_ITERATIONS;
+      const hm = Uint16Array.from(hashPoint) as IPoly;
+      const seed = rnd(48);
+      abytes(seed, 48, 'seed');
+      try {
+        const [f, g, F] = secretKeyCoder.decode(sk);
+        try {
+          const G = completePrivate(f, g, F);
+          const b00 = floatPoly.FFT(floatPoly.convSmall(g));
+          const b01 = floatPoly.FFT(floatPoly.neg(floatPoly.convSmall(f)));
+          const b10 = floatPoly.FFT(floatPoly.convSmall(G));
+          const b11 = floatPoly.FFT(floatPoly.neg(floatPoly.convSmall(F)));
+          const sampler = new FFSampler(logn, seed, b00, b01, b10, b11);
+          const s2 = new Int16Array(N);
+          try {
+            for (let iteration = 0; iteration < maxIterations; iteration++) {
+              const { t0, t1 } = sampler.sample(hm);
+              const t2 = floatPoly.add(floatPoly.mul(t0, b00), floatPoly.mul(t1, b10));
+              const t3 = floatPoly.mul(t0, b01);
+              const t4 = floatPoly.iFFT(t2);
+              const t5 = floatPoly.iFFT(floatPoly.add(floatPoly.mul(t1, b11), t3));
+              const hn = N >> 1;
+              let sqn = 0;
+              for (let i = 0; i < hn; i++) {
+                sqn += (hm[i] - (Math.round(t4[i].re) | 0)) ** 2;
+                sqn += (hm[hn + i] - (Math.round(t4[i].im) | 0)) ** 2;
+                const z = -Math.round(t5[i].re);
+                sqn += z * z;
+                s2[i] = z & 0xffff;
+                const z2 = -Math.round(t5[i].im);
+                sqn += z2 * z2;
+                s2[i + hn] = z2 & 0xffff;
+              }
+              cleanCPoly(t0, t1, t2, t3, t4, t5);
+              if (sqn <= L2BOUND[logn]) return s2.slice() as TRet<Int16Array>;
+            }
+            throw new Error('internal.sign: no short signature found within the iteration cap');
+          } finally {
+            cleanBytes(s2);
+            sampler.destroy();
+            cleanCPoly(b00, b01, b10, b11);
+            cleanBytes(G);
+          }
+        } finally {
+          cleanBytes(f, g, F);
+        }
+      } finally {
+        cleanBytes(seed);
+      }
+    },
+    verify(
+      s2: TArg<Int16Array>,
+      hashPoint: TArg<Uint16Array>,
+      pk: TArg<Uint8Array>
+    ): boolean {
+      checkHashPoint(hashPoint);
+      if (!(s2 instanceof Int16Array) || s2.length !== N)
+        throw new Error(`s2: expected Int16Array(${N})`);
+      abytes(pk, publicKeyCoder.bytesLen, 'publicKey');
+      const h = intPoly.toMontgomery(intPoly.ntt(publicKeyCoder.decode(pk)));
+      const s1 = intPoly.intt(intPoly.mul(intPoly.ntt(signedCoder.decode(s2 as Int16Array)), h));
+      intPoly.sub(s1, hashPoint as IPoly);
+      return intPoly.isShort(signedCoder.encode(s1), s2 as Int16Array);
+    },
+  });
   const res = {
     info,
     lengths,
@@ -2479,6 +2578,7 @@
     getPublicKey,
     sign,
     verify,
+    internal,
   };
   (res as any).__test = tests;
   return Object.freeze(res);
```

## SHA-256 of the upstream files

```
2af7f10e37bc0360503aab1a8b349759160cc22e2409e943542ac931905459a2  falcon.ts
6fd3e3340618c4da1d1bcde76893beed5ea642274f874e8b25dfea4af13660ec  _crystals.ts
4d257a3f99c8ac0d6e74116086021e125de7d012a827e68af1f0a91b57034a02  utils.ts
```

## SHA-256 of the vendored files

Checked by `test/vendor.test.ts`. Regenerate this section after any intended change of a vendored file.

```
0dea4b70b40ca57e3cfe30186e3dbd245147fe4d83ac566e92e70203aac59034  LICENSE
c8ea21838a85689ef4c4a266e06e57a09fa22004a87aa318d4711b7320791a14  _crystals.ts
a94716a96914fe5dafa71f53baa33b7c852f88eca48908b4d5a853f371463bdc  falcon.ts
4d257a3f99c8ac0d6e74116086021e125de7d012a827e68af1f0a91b57034a02  utils.ts
```
