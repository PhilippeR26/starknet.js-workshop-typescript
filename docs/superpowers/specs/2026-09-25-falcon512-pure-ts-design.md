# Design — Falcon-512 pure-TypeScript signer for the S2morrow account (`falcon512/pureTS/`)

Date: 2026-09-25

## Goal

Two objectives:

1. **Workshop**: a new sub-directory `src/scripts/signature/falcon512/pureTS/` containing everything
   needed to create and use an S2morrow Falcon-512 account on Starknet **without the falcon-rs WASM**
   (100% TypeScript), plus demo scripts equivalent to the existing scripts 1–12.
2. **Building blocks for an official starknet.js signer**: `pureTS/lib/` is written so it can later be
   copied as-is into a separate starknet.js fork (packaging option C below). Security must hold under
   a public audit.

Nothing is changed in the starknet.js repository. The fork integration is done later, separately.

### Success criteria

- Demo scripts 1–6 run on devnet with no WASM: declare, deploy (DEPLOY_ACCOUNT signed by Falcon),
  invoke, SNIP-12 message (off-chain and on-chain verification), declare from the Falcon account,
  reuse of an existing falcon-rs account.
- The deployed S2morrow contract accepts every signature produced in TypeScript.
- `npm test` passes, including the pre-existing tests of the repo.
- `lib/` has no import from the workshop (no `A1priv`, `utils`, `pkg/`).
- Performance in the order of the prototype on this machine: sign ≈ 14 ms, keygen ≈ 0.14 s
  (falcon-rs WASM: sign 8.2 ms, keygen 3.2 s).

## Context — findings of the feasibility prototype

Prototype (throwaway, session scratchpad): patched copy of noble `falcon.ts` 0.6.1 + S2morrow layer.
All checks passed against the falcon-rs WASM (`pkg/`):

- NTT of the public key and 29-felt packing identical to the WASM.
- A WASM signature is accepted by the TS mirror of `falcon.cairo`, and rejected for another hash
  (validates the Poseidon hash-to-point). `mul_hint` identical to the WASM.
- The falcon-rs key of `accountKeys.json` round-trips byte-exact through the NIST format; noble
  recomputes the same public key; TS signatures with this key are accepted.

Key facts:

- The Cairo verifier (`s2morrow/packages/falcon/src/falcon.cairo`, `verify_with_msg_point`) accepts
  **any** short `(s0, s1)` with `s0 + s1·h = c`: no bit-exactness with falcon-rs is needed.
  Its bound `SIG_BOUND_512 = 34034726` equals noble `L2BOUND[9]`.
- The heavy lattice part (NTRU keygen, ffSampling) already exists in `@noble/post-quantum`. The
  S2morrow-specific part (Poseidon hash-to-point, NTT falcon.py convention, base-Q packing, hint) is
  about 250 lines.
- **falcon-rs flaw**: the ChaCha20 seed feeding `samplerz` is the first 40 bytes of the *public* salt
  (`falcon-rs/src/wasm.rs:270-274`, and `falcon.rs:460-461` for `sign_with_salt`). The Gaussian
  sampler randomness is therefore reproducible by anyone. Impact not demonstrated; this design does
  not reproduce it.
- `@noble/post-quantum` 0.7.1 (deps `@noble/curves|hashes|ciphers` 2.4.0, same as starknet 11.0.2)
  still hard-codes the SHAKE256 `HashToPoint` inside a closure: no hook. ML-DSA in the same library
  exposes `ml_dsa*.internal.sign/verify` with `externalMu`: the precedent the patch mirrors.
- noble limits (own README): no side-channel protection, self-audited only, Falcon Round 3 (not
  FN-DSA / FIPS-206).

### Bundle size (esbuild IIFE, starknet 11.0.2 single-file build, not minified like the official one)

| | raw | gzip | brotli |
|---|---|---|---|
| starknet only (official `index.global.js`: 990.7 KB) | 987.9 KB | 184.0 KB | 145.6 KB |
| + vendored Falcon + S2morrow layer | +122.4 KB | +33.1 KB | +25.0 KB |

Minified contribution: noble `falcon.ts` 54.6 KB, `@noble/ciphers` 9.5 KB, NTT roots table 5.1 KB,
S2morrow layer 3.1 KB, `@noble/curves` `fft.js` 1.9 KB. Vendored or upstream noble: same size.

## Decisions

| Topic | Decision |
|---|---|
| starknet.js packaging (later, in a fork) | **Option C**: subpath `starknet/falcon`, own build entry, excluded from `index.global.js` |
| Falcon engine | Vendored `@noble/post-quantum` **0.7.1** `falcon.ts`, **minimal patch** mirroring ML-DSA `internal` |
| Upstream noble issue/PR | Later, once the patched version works |
| Canonical secret key | **NIST format** (1281 bytes: f, g, F); import/export of falcon-rs format (3584 bytes) |
| Signer constructor | Secret key **mandatory**, `Uint8Array \| string` (hex, with or without `0x`); public key derived |
| Self-verification | **Yes**, light version (reuses the hash point, ≈ 0.3 ms, ≈ +2%) |
| Public API | Signer, key functions, `verifyMessage` + `verify`. `signHash` stays internal |
| Test runner | **Jest** (same as starknet.js) |
| Randomized tests | Plain loops, no `fast-check` |
| Mainnet script variants | None |

## Layout

```
src/scripts/signature/falcon512/pureTS/
  lib/                          ← copied as-is into the fork (e.g. src/falcon/)
    engine/
      noble/                    ← vendored @noble/post-quantum 0.7.1: falcon.ts, _crystals.ts, utils.ts, LICENSE
        PATCH.md                ← upstream tag/commit, exact diff, rationale, SHA-256 of vendored files
      engine.ts                 ← FalconEngine interface + implementation backed by the vendored copy
    s2morrow/                   ← pure computation, no `starknet` import
      constants.ts
      nttRoots.ts
      ntt.ts
      hashToPoint.ts
      packing.ts
      keys.ts
      signature.ts
    Falcon512Signer.ts          ← implements SignerInterface
    verify.ts                   ← verifyMessage / verify
    index.ts                    ← public API, future `starknet/falcon`
  test/
    fixtures/                   ← frozen reference data + README.md stating their provenance
    *.test.ts
  tools/
    generateFixtures.ts         ← only lib-side file using the WASM (../pkg), dev-only
  1.declareFalcon512.ts … 6.importFalconRsAccount.ts, 10.falcon512Benchmark.ts
  README.md
  SECURITY.md
```

### Dependency rules

- `lib/` imports nothing from the workshop.
- `lib/s2morrow/` imports only `@scure/starknet` (Poseidon), `@noble/hashes` (random bytes) and the engine.
- Only `Falcon512Signer.ts` and `verify.ts` import `starknet`.
- The compiled contract is reused from the parent directory (`../falcon512Account.sierra.json`,
  `../falcon512Account.casm.json`), not duplicated.
- Fork integration later: copy `lib/` → e.g. `src/falcon/`, adjust the `starknet` imports of the two
  starknet-facing files, add the build entry and the `./falcon` export.

## Components and API

### Engine patch (vendored `falcon.ts`)

Only addition, inside `genFalcon` (so available on every parameter set):

```ts
internal: {
  sign(hashPoint: Uint16Array, secretKey: Uint8Array, opts?: { random?: (n: number) => Uint8Array }): Int16Array;
  verify(s2: Int16Array, hashPoint: Uint16Array, publicKey: Uint8Array): boolean;
}
```

- `sign`: same sampling loop as `signRaw`, without nonce, SHAKE256 hash-to-point and compression.
  Returns the raw signed `s2` whose norm passed `L2BOUND`. Draws its own 48-byte sampler seed
  (`opts.random` only for tests). **Iteration cap** (1000 loops) → throws instead of `while (true)`.
- `verify`: `s1 = hashPoint − s2·h mod q` then `isShort`, like `verifyRaw` without decoding. Used as an
  independent cross-check in tests.
- Import specifiers rewritten `.ts` → `.js` only if required by ts-node / Jest (to be verified; any
  such change is listed in `PATCH.md`).

`engine.ts`:

```ts
interface FalconEngine {
  keygen(seed?: Uint8Array): { secretKey: Uint8Array; publicKey: Uint8Array }; // NIST formats
  getPublicKey(secretKey: Uint8Array): Uint8Array;
  signHashPoint(hashPoint: Uint16Array, secretKey: Uint8Array): Int16Array;
  verifyHashPoint(s2: Int16Array, hashPoint: Uint16Array, publicKey: Uint8Array): boolean;
}
```

Switching later to an upstream noble `internal` API only replaces this implementation.

### S2morrow layer (`lib/s2morrow/`)

| Module | Content |
|---|---|
| `constants.ts` | `Q = 12289`, `N = 512`, `SIG_BOUND_512 = 34034726`, `PACKED_SLOTS = 29`, `SALT_FELTS = 2`, `SIGNATURE_FELTS = 61` |
| `nttRoots.ts` | 1022 roots, falcon.py convention, offset `n − 2` (from `falcon-rs/src/constants.rs`) |
| `ntt.ts` | `ntt`, `intt`, polynomial multiplication and division mod q |
| `hashToPoint.ts` | `hashToPoint(message: bigint[], salt: bigint[]): Uint16Array` — `poseidonHashMany(message ‖ salt)`, then 21 × 2 + 1 Hades permutations, 12 base-Q digits per felt (6 from the low u128, then 6 from the high u128) |
| `packing.ts` | `packPoly(Uint16Array) → bigint[29]` (Horner base Q, 9 values per u128 half, `lo + hi·2¹²⁸`), `unpackPoly` with canonical-only validation |
| `keys.ts` | NIST secret/public key codecs (own code, cross-checked with noble in tests), falcon-rs import/export, NTRU equation check, `getPackedPublicKey` |
| `signature.ts` | internal `signHash(msgHash, secretKey, pkNtt) → string[61]`, internal `verifyHash`, `parseSignature` |

Signature layout (Serde of `PackedFalconSignatureWithHint`):
`[s1 packed (29)] [salt length = 2] [salt0] [salt1] [mul_hint packed (29)]` = 61 felts.

### Public API (`lib/index.ts`)

```ts
// lib/index.ts exports only: Falcon512Signer, the `falcon512` namespace (lib/falcon512.ts), type Falcon512KeyPair

// falcon512 namespace — keys
falcon512.generateKeyPair(seed?: Uint8Array): { secretKey: Uint8Array; publicKey: Uint8Array } // NIST; seed exactly 48 bytes (noble), default CSPRNG
falcon512.getPublicKey(secretKey: Uint8Array | string): Uint8Array
falcon512.getPackedPublicKey(publicKey: Uint8Array | string): string[]   // 29 felts = constructor `pk_packed`
falcon512.importFalconRsSecretKey(secretKey: Uint8Array | string): Uint8Array   // 3584 → NIST 1281
falcon512.exportFalconRsSecretKey(secretKey: Uint8Array | string): Uint8Array   // NIST 1281 → 3584

// signer
class Falcon512Signer implements SignerInterface {
  constructor(secretKey: Uint8Array | string)          // NIST only, mandatory
  static fromFalconRs(secretKey: Uint8Array | string): Falcon512Signer
  getPubKey(): Promise<string>                         // hex of the NIST public key (897 bytes)
  getPackedPublicKey(): string[]                     // 29 felts
  signMessage(typedData, accountAddress): Promise<Signature>
  signTransaction(transactions, details): Promise<Signature>            // V3 only
  signDeployAccountTransaction(details): Promise<Signature>             // V3 only
  signDeclareTransaction(details): Promise<Signature>                   // V3 only
}

// falcon512 namespace — verifiers (same shapes as typedData.verifyMessage and ec.starkCurve.verify)
falcon512.verifyMessage(message: TypedData, signature: Signature, fullPublicKey: Uint8Array | string, accountAddress: BigNumberish): boolean
falcon512.verifyMessage(msgHash: BigNumberish, signature: Signature, fullPublicKey: Uint8Array | string): boolean
falcon512.verify(signature: Signature, msgHash: BigNumberish, fullPublicKey: Uint8Array | string): boolean
```

- Naming (maintainer decision): no generic name is exported flat; free functions live in the `falcon512`
  namespace, like `ec.starkCurve` or `typedData` in starknet.js. The packed on-chain form of the public key is
  `getPackedPublicKey` (not a "Starknet public key"). Enforced by `test/publicApi.test.ts`.

- `fullPublicKey` = NIST public key, as returned by `getPubKey()`.
- Verifiers: malformed or invalid signature → `false`; invalid public key → throws. The message hash
  is checked to be a felt (< P) since it is a public entry point.
- Transaction hashes are computed with the starknet.js hash functions, as in the current
  `12.falcon512Signer.ts`; the signer does not re-validate them.

### Signing data flow

1. Signer computes the hash with starknet.js (`calculateInvokeTransactionHash`, …, `getMessageHash`).
2. Salt: two random felts of 248 bits (`crypto.getRandomValues`).
3. `hm = hashToPoint([msgHash], salt)`.
4. `s2 = engine.signHashPoint(hm, secretKey)` — sampler seed drawn separately from the salt.
5. `s1 = s2 mod q`; `mulHint = intt(ntt(s1) ⊙ pkNtt)`.
6. Pack to 61 felts, then **light self-verification** on the unpacked output (reusing `hm`): hint
   check `ntt(s1) ⊙ pkNtt = ntt(mulHint)` and norm `‖hm − mulHint‖² + ‖s1‖² ≤ SIG_BOUND_512`.
   Failure → throws, the signature is never returned.

## Security

### Threat model (`pureTS/SECURITY.md`)

In scope: signatures always valid and well-formed; randomness quality and separation; strict input
validation; no secret in errors or logs; best-effort zeroization; traceability of vendored code.

Explicitly out of scope, stated in `SECURITY.md`: side-channel resistance (floating-point FFT,
variable-time sampling); guaranteed memory wiping (GC, immutable strings); FN-DSA compliance; noble
independent audit; the S2morrow contract design (hash-to-point, hint verification); wallet key storage.

### Randomness

- Salt: 2 × 248-bit felts from `crypto.getRandomValues`.
- Sampler seed: 48 bytes drawn **separately** from the salt (fixes the falcon-rs flaw).
- Deterministic `random` hook internal to the engine, used by tests only, not exported by `index.ts`.

### Strict validation (reject, never repair)

- NIST secret key: 1281 bytes, header `0x59`, coefficients within bounds, f invertible mod q,
  **NTRU equation `fG − gF = q` verified**.
- falcon-rs secret key: 3584 bytes, coefficients < q, centered values within NIST bounds
  (|f|, |g| ≤ 31, |F| ≤ 127), provided G equal to the recomputed G.
- NIST public key: 897 bytes, header `0x09`, coefficients < q.
- Packed polynomials: each felt < P, each u128 half < Q⁹, last slot consistent (8 values, high half 0).
- Signature to parse: exactly 61 felts, salt length 2.

### Secrets in memory

- Secret key copied at construction, stored in an ES private field `#secretKey` (absent from
  `console.log` / `JSON.stringify`). No `getPrivateKey()`.
- Hex-string secret keys accepted (same as `Signer` / `EthSigner`); documented that a string cannot
  be wiped.
- Secret intermediates (f, g, F, G, FFT basis) wiped in `finally` blocks, as noble does.
- Error messages contain lengths or codes only, never key material.

### Dependability

- Light self-verification of every signature (see data flow, step 6).
- Iteration cap in `internal.sign`.

### Supply chain

- `PATCH.md`: noble tag and commit, exact diff, SHA-256 of each vendored file; a test checks the hashes.
- In the fork: exact version pins.

### falcon-rs keys

README warning next to `importFalconRsSecretKey` / `fromFalconRs`: keys that already signed with the
falcon-rs WASM may have leaked information through the public-salt sampler seed. Import is provided
for continuity; for real funds, prefer a new key. The contract has no key-rotation entry point, so
moving to a new key means deploying a new account and transferring the funds.

## Testing

### Fixtures (`test/fixtures/`, frozen, provenance in `fixtures/README.md`)

| Source | Reference data (input → expected output) | Validates |
|---|---|---|
| `s2morrow/packages/falcon/tests/data/` (snforge Cairo tests, commit `4eff9ab`) | `ntt_input_512_int`, `intt_input_512_int`, `intt_expected_512_int`, `hash_to_point_test_int`, `packing_test_int`, `verify_test_int` | TS against the contract semantics |
| `tools/generateFixtures.ts` (falcon-rs WASM) | falcon-rs key pair from a fixed seed, its NTT and packed public key, WASM signatures for fixed hashes | cross-compatibility with falcon-rs keys and signatures |

The snforge JSON files use the Cairo Serde layout (`[length, v0, v1, …]`); `hash_to_point_test_int`,
`packing_test_int` and `verify_test_int` were produced by falcon-rs and are checked by the Cairo
tests (`test_cross_language.cairo`). Their meaning was confirmed with the prototype:
`ntt(ntt_input) = intt_input`, `intt(intt_input) = intt_expected`, `hashToPoint([42], [1, 2])`
matches, `pack`/`unpack` match, and the `verify_test` signature satisfies the contract equations.

`falcon-rs/test_vectors/hash_to_point_kat.json` and `sign_kat.json` are **not usable**: they only
contain a Python error trace (`No module named 'numpy'`).

### Jest tests (`test/*.test.ts`)

- `ntt`: round trip; product versus a naive negacyclic multiplication (independent reference);
  roots table self-consistency; Cairo reference data.
- `hashToPoint`, `packing`: Cairo reference data; rejection of non-canonical encodings.
- `keys`: NIST codecs versus noble; falcon-rs round trip; NTRU check; rejections (length, header,
  out-of-bound coefficient, tampered G).
- `signature`: sign → verify round trip; frozen WASM signatures accepted; each component tampered
  (one s1 coefficient, salt, hint, hash, public key) → rejected; randomized loops over keys/messages.
- `engine`: `internal.sign` checked by `internal.verify` and by the Cairo mirror; iteration cap throws;
  randomness separation with a spy `random` (sampler seed never taken from the salt bytes).
- `Falcon512Signer`: the four methods against hashes computed by starknet.js; self-verification
  catches an injected fault (mock engine returning a wrong `s2`); secret absent from
  `JSON.stringify` / `console.log`; constructor rejections; `fromFalconRs`.
- Verifiers: `verifyMessage` (TypedData and hash overloads) and `verify`.
- Vendored integrity: SHA-256 of vendored files equal to `PATCH.md`.

Jest tests need neither devnet nor snforge.

## Demo scripts (devnet)

| Script | Content | Signer method exercised |
|---|---|---|
| `1.declareFalcon512.ts` | declare the account class (devnet account 0) | — |
| `2.deployFalcon512.ts` | NIST keygen, fund the pre-computed address, **DEPLOY_ACCOUNT** signed by Falcon; keys saved to `pureTS/accountKeysTS.json` (versioned, pedagogical, like `accountKeys.json`) | `signDeployAccountTransaction` |
| `3.useFalcon512Account.ts` | STRK transfer | `signTransaction` |
| `4.signMessageFalcon512.ts` | SNIP-12 message; `verifyMessage` and `verify` off-chain; `verifyMessageInStarknet` on-chain | `signMessage` |
| `5.declareFromFalcon512.ts` | the Falcon account declares `compiledContracts/cairo260/hello` (external `set_name(felt252)`, view `get_name()`), deploys it through the UDC, calls `set_name`, reads `get_name` | `signDeclareTransaction`, `signTransaction` |
| `6.importFalconRsAccount.ts` | reuse `../accountKeys.json` (falcon-rs format), with the warning | continuity |
| `10.falcon512Benchmark.ts` | keygen / sign / verify timings, TS versus WASM | only script loading the WASM |

Scripts follow the repo conventions (header comment with launch command, commented provider lines
for Sepolia, `main().then(...)`). Fee estimation with `skipValidate: false`, as in the current README.

## Files touched outside `pureTS/`

- `package.json`: `@noble/ciphers`, `@noble/curves`, `@noble/hashes` 2.2.0 → **2.4.0** (required by
  noble 0.7.1, same as starknet 11.0.2). No dependency on `@noble/post-quantum` 0.7.1 (vendored).
  Check that the existing `10.falcon512Calculation.ts` (noble 0.6.1) still runs.
- `jest.config.ts`: `transformIgnorePatterns` so babel transforms the ESM-only `@noble/*` and
  `@scure/*`. Check that the 4 existing tests still pass.
- No `.gitignore` change. No `tsconfig.json` change planned.

## To verify during implementation

- Whether the vendored `.ts` import specifiers must become `.js` (ts-node CJS + `nodenext`, Jest babel).
- Jest + ESM-only packages with the chosen `transformIgnorePatterns`.
- `verifyMessageInStarknet` works with the Falcon contract `is_valid_signature`.
- `__validate_deploy__` / `__validate_declare__` accept TS signatures on devnet.
- The existing falcon-rs key fits the NIST bounds (true for `accountKeys.json` in the prototype).

## Out of scope

- Any change in the starknet.js repository; fork integration (build entry, `exports` map, CDN build).
- Issue / PR to noble (later).
- Side-channel resistance; FN-DSA.
- Changes to the S2morrow contract; key rotation.
- Mainnet / Sepolia script variants.
- Helper linking a public key to an account address.
- Performance work beyond the prototype level (NTT roots table compaction, faster NTT).
