# Prompt — integrate the Falcon-512 S2morrow signer into starknet.js, and prepare the request to noble

> Paste this whole file as the first message of a Claude Code session opened in the **starknet.js fork**.
> Everything referenced below lives on the same machine; absolute paths are given.

## 0. Who you work with, and how

- The user is the **maintainer of starknet.js**. Packaging, dependency and API decisions are theirs: present
  options with trade-offs and a recommendation, then wait for their decision.
- Follow the global `~/.claude/CLAUDE.md` and the repo `CLAUDE.md` (conversation in French, one edit per message
  with its *why* and *how* written on screen first, no `git add` / `git commit`, no attribution to Claude or
  Anthropic anywhere, `[Not validated]` prefix on unverified claims, tool-call descriptions in French, never the
  word "vecteur" / "test vector" / "KAT" — say "reference data" / "expected values").
- Start with read-only exploration, then propose a plan (use your brainstorming / planning skills). Do not edit
  anything before the user approves the plan.

## 1. What already exists (source of truth — read these first)

Workshop repo: `/home/edmond/Documents/starknet/starknet.js-workshop-typescript`, folder
`src/scripts/signature/falcon512/pureTS/` (below: `pureTS/`).

| What | Path |
|---|---|
| Design spec (decisions and reasons) | `docs/superpowers/specs/2026-09-25-falcon512-pure-ts-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-09-25-falcon512-pure-ts.md` |
| The library to port | `pureTS/lib/` (`index.ts`, `Falcon512Signer.ts`, `verify.ts`, `s2morrow/*`, `engine/*`) |
| Vendored noble 0.7.1 + patch notes | `pureTS/lib/engine/noble/` and its `PATCH.md` (exact diff against upstream, SHA-256) |
| Jest tests (11 suites, 85 tests, all green) | `pureTS/test/*.test.ts`, helpers in `pureTS/test/helpers/` |
| Reference data (provenance in README) | `pureTS/test/fixtures/` (`cairo/*.json` from s2morrow, `falconRs.json` from the falcon-rs WASM) |
| Threat model | `pureTS/SECURITY.md` |
| Usage, demo scripts, benchmark | `pureTS/README.md`, `pureTS/1…6.*.ts`, `pureTS/10.falcon512Benchmark.ts` |
| Execution ledger (every ruling, final review, deferred minors) | `.superpowers/sdd/2026-09-25-falcon512-pure-ts/progress.md` (may have been deleted after commit; git history then holds the record) |

External references (read-only): falcon-rs `/home/edmond/Documents/starknet/falcon-rs/src` (`poseidon_hash.rs`,
`packing.rs`, `ntt.rs`, `hints.rs`, `wasm.rs`), Cairo verifier
`/home/edmond/Documents/starknet/s2morrow/packages/falcon/src/falcon.cairo`, compiled account class
`src/scripts/signature/falcon512/falcon512Account.{sierra,casm}.json` (class hash
`0x37c7626b50ba517835c9556b53bce57cb6633704bb702f8c2f13a44cf151d5`).

### Key facts established (all measured or checked in the workshop)

- **Architecture.** Vendored `@noble/post-quantum` 0.7.1 with a minimal patch adding
  `falcon512.internal.sign(hashPoint, secretKey, opts?) → Int16Array` and
  `internal.verify(s2, hashPoint, publicKey) → boolean`, behind a `FalconEngine` interface
  (`lib/engine/engine.ts`). The S2morrow layer (Poseidon hash-to-point, NTT in the falcon.py convention,
  base-Q packing in 29 felts, `mul_hint`, NIST key codecs, falcon-rs import/export) is pure and has no
  `starknet` import. Only `Falcon512Signer.ts` and `verify.ts` import `starknet`.
- **Public API** (`lib/index.ts`): `Falcon512Signer` (secret key mandatory, NIST 1281 bytes, `Uint8Array` or
  hex; `fromFalconRs`; `getPubKey()` = NIST public key 897 bytes hex; `getStarknetPublicKey()` = 29 felts),
  `verifyMessage` (same overloads as `typedData.verifyMessage`), `verify` (same shape as
  `ec.starkCurve.verify`), `generateKeyPair`, `getPublicKey`, `getStarknetPublicKey`,
  `importFalconRsSecretKey`, `exportFalconRsSecretKey`. `signHash` is internal (no blind signing).
- **Security properties** (see `SECURITY.md`): light self-verification of every signature (mirror of
  `falcon.cairo`); salt and 48-byte sampler seed drawn separately (falcon-rs derives its sampler seed from the
  public salt: `falcon-rs/src/wasm.rs:270-274`, `falcon.rs:460-461`); strict validation (NTRU equation
  checked, canonical packing only, 61 felts, strict felt parsing like starknet.js Cairo types: `""`, `" "`,
  `"0x"`, booleans rejected); secret key in an ES private field; iteration cap 1000; no module-level cache of
  secret-derived values; vendored files checked by SHA-256.
- **On-chain validation** (devnet 0.14.4, RPC 0.10.2, starknet 11.0.2): DEPLOY_ACCOUNT, INVOKE and DECLARE
  signed in TypeScript accepted by the contract; SNIP-12 message verified on-chain (`is_valid_signature` via
  `verifyMessageInStarknet`); an account created with the falcon-rs WASM reused with the TS signer.
- **Performance** (Node 25): TS keygen 157 ms, sign 14.5 ms, off-chain verify 8.7 ms; falcon-rs WASM keygen
  3 676 ms, sign 5.4 ms.
- **Bundle size** (esbuild IIFE, same shape as starknet 11.0.2 `dist/index.global.js`, which is not
  minified, 990.7 KB): adding Falcon + S2morrow to the global build costs +122.4 KB raw / +33.1 KB gzip /
  +25.0 KB brotli. Minified contribution: noble `falcon.ts` 54.6 KB, `@noble/ciphers` 9.5 KB, NTT roots table
  5.1 KB, S2morrow layer 3.1 KB, `@noble/curves/abstract/fft.js` 1.9 KB. Vendored or upstream noble: same size.
- **Dependencies.** noble post-quantum 0.7.1 needs `@noble/ciphers`, `@noble/curves`, `@noble/hashes` 2.4.0 —
  the versions starknet 11.0.2 already uses, except `@noble/ciphers`, which is **new** for starknet.js.

## 2. Part A — create the signer in starknet.js

Decision already taken by the maintainer: **option C** — the code lives in the starknet.js repo, behind a
dedicated subpath (e.g. `starknet/falcon`), **excluded from `index.global.js`**, so users who do not use Falcon
pay nothing.

### A.1 Explore first (read-only) and report

- Build tool and config (how `dist/index.*` and `index.global.js` are produced), `package.json` `exports`,
  `typesVersions` if any, `files`, `sideEffects`.
- Where signers live (`Signer`, `EthSigner`, `LedgerSigner*`), how they import hash / stark / transaction /
  typedData helpers internally, naming and error conventions (`LibraryError`?), logging.
- Test setup (Jest config, ESM transform of noble 2.x, devnet-based tests and how devnet is started), CI Node
  version(s), lint / prettier config and ignore files, dependency pinning policy.
- Docs site layout (`www/docs/guides/…`, API docs generation).

### A.2 Port the library

- Copy `pureTS/lib/` to the location the maintainer chooses (proposal: `src/falcon/`). Keep the layering:
  `engine/` (vendored noble + `engine.ts`), `s2morrow/` (pure), `Falcon512Signer.ts`, `verify.ts`, `index.ts`.
- Replace the `starknet` imports of `Falcon512Signer.ts` and `verify.ts` by internal imports (or keep
  `starknet` as an external of the `falcon` build entry — explain the trade-off: no duplicated core code in
  `dist/falcon.*` either way).
- Vendored noble: **exclude `engine/noble/` from prettier / eslint / any formatter** — reformatting changes the
  SHA-256 recorded in `PATCH.md` and breaks the integrity test. Adapt the import-specifier rewrite of
  `PATCH.md` change 1 to the repo's module style (extensionless vs `.js`), then regenerate `PATCH.md`
  (the generation script is in the plan, Task 2 Step 10).
- Add `@noble/ciphers` pinned like the other noble packages.
- Build: a second entry `falcon/index.ts` → `dist/falcon.{js,mjs,d.ts}`, `exports["./falcon"]`, `typesVersions`
  for `moduleResolution: node` users; check that `index.global.js` is **byte-identical in content** to a build
  without Falcon (measure before/after: raw, gzip, brotli).
- Mark the subpath **experimental** in docs (Falcon Round 3, not FN-DSA; FIPS-206 may be incompatible).

### A.3 Port the tests

- Port all `pureTS/test/*.test.ts` and `pureTS/test/fixtures/` (keep `fixtures/README.md` provenance).
- `test/helpers/fixtures.ts` reads big JSON numbers with the `JSON.parse` reviver `context.source`
  (Node >= 21 **[Not validated] exact version**). If the CI runs an older Node, switch to a bigint-safe parser
  (starknet.js already depends on `lossless-json`).
- Keep the mutation-proven tests: negated F caught only by the NTRU check; fresh sampler seed with a fixed
  salt; no module-level cache in `s2morrow/`; strict message-hash parsing; import boundaries of the Falcon
  folder (adapt the allowed-packages list).
- Add a devnet integration test if the repo has that pattern: declare the account class, DEPLOY_ACCOUNT
  signed by Falcon, INVOKE, DECLARE from the Falcon account, SNIP-12 + `verifyMessageInStarknet`.
  Fee estimation must use `skipValidate: false` (Falcon validation is expensive).

### A.4 Deferred minors from the final review (decide with the maintainer; fix before the public audit)

1. Unwiped `number[]` secret intermediates in `keys.ts`; constructor copy of the key not wiped when validation throws.
2. `SECURITY.md` says raw-hash signing is not exposed, but `protected signRaw` is callable at runtime through a
   cast (either reword, or make it a `#private` method — diverges from the other signers' `protected signRaw`).
3. JSDoc warning on `fromFalconRs` / `importFalconRsSecretKey` / `exportFalconRsSecretKey` (falcon-rs keys
   may have leaked through the public sampler seed).
4. `toBytes`: check the hex length before decoding (clear message on odd truncation); `instanceof Uint8Array`
   fails across realms (noble uses `isBytes`); cap string length in `parseFelt` (a 1 MB decimal string costs
   ~110 ms, 61 of them in an untrusted signature cost seconds).
5. The import-boundary test misses side-effect imports (`import 'x'`) and dynamic `import()`.
6. The patch places the new types between the JSDoc of `Falcon` and its declaration in vendored `falcon.ts`
   (doc comment detached — visible in an upstream PR).
7. `Falcon512Signer` compares `details.version` as an exact string (`'0x03'` or `3n` from a direct caller are
   rejected; all `Account` paths pass normalized versions).

### A.5 Docs

- A guide page (next to the signature guide `www/docs/guides/account/signature.md`): key generation, account
  deployment (constructor `pk_packed` = 29 felts, address salt = first felt), `skipValidate: false`,
  off-chain and on-chain verification, falcon-rs key import with its warning, security limits (link or copy of
  `SECURITY.md`).

### A.6 Decisions to put to the maintainer (do not decide alone)

Subpath and folder names; experimental label and semver policy; separate `falcon.global.js` for CDN users or
none; `typesVersions`; how to handle Node < 21 in CI; which deferred minors to fix now; whether to open the
noble issue before or after the release.

## 3. Part B — request to Paul Miller (noble-post-quantum)

Goal: replace the vendored patch by an upstream API, so starknet.js depends on `@noble/post-quantum` instead of a
modified copy. No budget: this is a contribution request, not a paid job. The **maintainer posts** everything;
you only draft. The text must **not mention Claude, AI or any assistant**, and must never be posted by you
(no `gh issue create`, no `gh pr create`).

### B.1 Facts to rely on (checked on 2026-09-25 with `gh`, re-check before posting)

- `@noble/post-quantum` 0.7.1 still hard-codes `HashToPoint` (SHAKE256) inside `genFalcon`: no hook.
- Precedent in the same library: ML-DSA exposes `ml_dsa*.internal.sign / internal.verify` with the
  `externalMu` option (the caller supplies the 64-byte µ).
- External PRs are accepted: 10 merged, including a feature (#34 concrete hybrid KEMs, panva) and audit
  follow-ups (#48, #49, Aug 2026).
- Falcon API changes meet caution: issue #44 (Mysten Labs, July 2026, relax keygen seed length) was answered
  the same day with "We should wait until fips 206" and closed.

### B.2 Strategy

- Open an **issue first**, short and concrete; offer the PR with tests if the direction is accepted.
- Frame it as an **internal API**, exactly like ML-DSA `internal` + `externalMu`: no change to the public
  API, no commitment on any standard encoding, the sampler and bounds untouched.
- Pre-empt "wait for FIPS-206": the request is about the sampling layer (sign a given point in Z_q[x]/(x^n+1)),
  which any FN-DSA variant also needs; the SHAKE256 public API stays as is. **[Not validated]** Do not claim
  anything about FIPS-206 content that you have not verified.
- Use case: blockchains that verify Falcon signatures on-chain need a hash-to-point that is cheap in their VM
  (Poseidon on Starknet, account contract S2morrow). Do not claim other projects' plans without a source.
- Offer: the exact diff (from `PATCH.md`, ~110 added lines), the tests (`engine.test.ts`), and mention the
  optional extras separately (iteration cap instead of `while (true)`; hash-point validation and copy).

### B.3 Draft skeleton (to finalize with the real diff, in Paul's concise style)

Title: `Falcon: internal API to sign/verify a caller-provided hash point (like ML-DSA externalMu)`

1. **What:** `falcon512.internal.sign(hashPoint: Uint16Array, secretKey, opts?) → Int16Array` (raw s2) and
   `falcon512.internal.verify(s2, hashPoint, publicKey) → boolean`, on every parameter set.
2. **Why:** on-chain verifiers use a VM-friendly hash-to-point (Poseidon on Starknet); today the only option is
   to fork `falcon.ts`. ML-DSA already offers the equivalent (`internal` + `externalMu`).
3. **How:** `sign` = the `signRaw` sampling loop without nonce, `HashToPoint` and compression; `verify` =
   `verifyRaw` without decoding and hashing. Public API untouched. Diff and tests ready.
4. **Question:** would you accept a PR along these lines? Any naming or shape you prefer?

Before the user posts: re-read the upstream repo (latest version, open issues, CONTRIBUTING / guidelines at
https://github.com/paulmillr/guidelines) and adapt the draft.
