# Falcon-512 signer for S2morrow accounts — pure TypeScript

Post-quantum signature of the [S2morrow](https://github.com/feltroidprime/s2morrow) Falcon-512
account, **without the falcon-rs WASM**. The library in `lib/` is written so it can be copied into a
starknet.js fork (future `starknet/falcon` subpath).

## Usage

```ts
import { Account } from 'starknet';
import { Falcon512Signer, falcon512 } from './lib';

const { secretKey, publicKey } = falcon512.generateKeyPair(); // NIST formats: 1281 / 897 bytes
const falconSigner = new Falcon512Signer(secretKey);
const pkPacked = falconSigner.getPackedPublicKey(); // 29 felts = constructor `pk_packed`
const falconAccount = new Account({ provider: myProvider, address, signer: falconSigner });
// off-chain verification of a SNIP-12 message (same shape as typedData.verifyMessage)
const isValid = falcon512.verifyMessage(myTypedData, signature, publicKey, address);
```

> [!TIP]
> Validation of a Falcon signature is expensive: estimate fees with `skipValidate: false`.

An account created with the falcon-rs WASM can be reused with `Falcon512Signer.fromFalconRs(privKey)`
— read the warning in [SECURITY.md](SECURITY.md) first.

## Demo scripts (devnet on 127.0.0.1:5050)

| Script | Content |
|---|---|
| [1.declareFalcon512.ts](1.declareFalcon512.ts) | declare the account class |
| [2.deployFalcon512.ts](2.deployFalcon512.ts) | keygen, fund, DEPLOY_ACCOUNT signed by Falcon; keys saved in `accountKeysTS.json` |
| [3.useFalcon512Account.ts](3.useFalcon512Account.ts) | STRK transfer |
| [4.signMessageFalcon512.ts](4.signMessageFalcon512.ts) | SNIP-12 message, verified off-chain and on-chain |
| [5.declareFromFalcon512.ts](5.declareFromFalcon512.ts) | the Falcon account declares, deploys and uses `hello` |
| [6.importFalconRsAccount.ts](6.importFalconRsAccount.ts) | reuse of the falcon-rs account of `../accountKeys.json` |
| [10.falcon512Benchmark.ts](10.falcon512Benchmark.ts) | timings, TypeScript versus WASM |

## Performance

Measured with `10.falcon512Benchmark.ts` (Node 25, 2026-09-25, author's machine):

| | TypeScript (this lib) | falcon-rs WASM |
|---|---|---|
| keygen | 157 ms | 3 676 ms |
| sign | 14.5 ms | 5.4 ms |
| verify (off-chain) | 8.7 ms | — |

## Layout

- `lib/engine/noble/` — vendored `@noble/post-quantum` 0.7.1 with a small patch (see `PATCH.md`).
- `lib/s2morrow/` — Poseidon hash-to-point, NTT, packing, keys, signature (no `starknet` import).
- `lib/Falcon512Signer.ts`, `lib/verify.ts`, `lib/index.ts` — starknet.js-facing API.
- `test/` — Jest tests and their reference data (`test/fixtures/README.md` gives the provenance).
- `tools/generateFixtures.ts` — regenerates `test/fixtures/falconRs.json` with the WASM.

## Tests

```bash
npx jest src/scripts/signature/falcon512/pureTS
```

## Security

See [SECURITY.md](SECURITY.md): what is covered, what is not (no side-channel protection, Falcon
Round 3 and not FN-DSA), and the falcon-rs key warning.
