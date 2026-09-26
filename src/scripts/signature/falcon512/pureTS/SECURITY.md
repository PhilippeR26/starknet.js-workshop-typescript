# Security of the Falcon-512 pure-TypeScript signer

## What is covered

- **Valid signatures only.** Every signature is re-checked before being returned (hint equation and
  norm bound of `falcon.cairo`, on the encoded output). A faulty computation throws instead of
  producing a signature the contract would reject.
- **Randomness.** The salt (2 × 248-bit felts) and the 48-byte Gaussian sampler seed come from
  `crypto.getRandomValues` through two separate draws. The sampler seed never depends on the public
  salt (unlike falcon-rs, whose sampler seed is the first 40 bytes of the published salt).
- **Strict validation, never repair.**
  - NIST secret key: 1281 bytes, header `0x59`, coefficient bounds, forbidden values, f invertible,
    NTRU equation `f·G − g·F = q` checked.
  - falcon-rs secret key: 3584 bytes, coefficients < q, NIST bounds, provided G equal to the
    recomputed G.
  - NIST public key: 897 bytes, header `0x09`, coefficients < q.
  - Packed polynomials: canonical encoding only. Signatures: exactly 61 felts, salt length 2.
- **No secret in the API surface.** The secret key is copied at construction and kept in an ES
  private field (not shown by `console.log` / `JSON.stringify`); there is no getter. Errors carry
  lengths or codes only. Raw-hash signing (`signHash`) is not exported, to avoid blind signing.
- **Best-effort wiping** of secret intermediates (f, g, F, G, FFT basis) in `finally` blocks.
- **Bounded work.** Sampling is capped at 1000 attempts.
- **Traceable vendored code.** `lib/engine/noble/PATCH.md` records the upstream package, the exact
  diff and the SHA-256 of every vendored file, checked by `test/vendor.test.ts`.

## What is NOT covered

- **Side channels.** No constant-time guarantee: floating-point FFT and variable-time Gaussian
  sampling (noble states the same for its whole library).
- **Guaranteed memory wiping.** Impossible in JavaScript (garbage collector copies, immutable
  strings). A secret key passed as a hex string cannot be wiped at all: prefer `Uint8Array`.
- **Standardization.** This is Falcon Round 3, not FN-DSA (FIPS-206), which may be incompatible.
- **Independent audit of noble.** `@noble/post-quantum` is self-audited only.
- **The S2morrow contract design** (Poseidon hash-to-point, hint-based verification) and wallet key
  storage.

## Keys that already signed with the falcon-rs WASM

**[Not validated]** falcon-rs seeds its Gaussian sampler with the public salt, so every signature it
published may leak information about the secret key. `importFalconRsSecretKey` / `fromFalconRs` exist
for continuity only: for real funds, generate a new key. The S2morrow account has no key-rotation
entry point, so moving to a new key means deploying a new account and transferring the funds.
