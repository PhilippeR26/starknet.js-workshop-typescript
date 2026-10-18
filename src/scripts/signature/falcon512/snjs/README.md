# Falcon-512 signer for S2morrow accounts — `starknet/falcon`

Post-quantum signature of the [S2morrow](https://github.com/feltroidprime/s2morrow) Falcon-512
account, with the signer published in starknet.js: the `starknet/falcon` entry point, from
starknet.js v11.4.0. The scripts of [../pureTS](../pureTS) do the same with the development copy of
the library.

- Guide: [Post-quantum signature (Falcon-512)](https://starknet-js.com/docs/guides/account/postQuantum)
- API: [starknet/falcon](https://starknet-js.com/docs/API/falcon)

## Usage

```ts
import { Account } from 'starknet';
import { Falcon512Signer, falcon512 } from 'starknet/falcon';

const { secretKey, publicKey } = falcon512.generateKeyPair(); // NIST formats: 1281 / 897 bytes
const falconSigner = new Falcon512Signer(secretKey);
const pkPacked = falconSigner.getPackedPublicKey(); // 29 felts = constructor `pk_packed`
const falconAccount = new Account({ provider: myProvider, address, signer: falconSigner });
// off-chain verification of a SNIP-12 message (same shape as typedData.verifyMessage)
const isValid = falcon512.verifyMessage(myTypedData, signature, publicKey, address);
```

> [!TIP]
> Validation of a Falcon signature is expensive: always pass `{ skipValidate: false }`. Without
> it, the fee estimate leaves out the validation, and the node rejects the transaction.

An account created with the falcon-rs WASM can be reused with `Falcon512Signer.fromFalconRs(privKey)`
— read the warning of the guide first.

## Demo scripts (devnet on 127.0.0.1:5050)

Launch them from the root of the workshop, for example
`npx ts-node src/scripts/signature/falcon512/snjs/1.declareFalcon512.ts`.

| Script | Content |
|---|---|
| [1.declareFalcon512.ts](1.declareFalcon512.ts) | declare the account class |
| [2.deployFalcon512.ts](2.deployFalcon512.ts) | keygen, fund, DEPLOY_ACCOUNT signed by Falcon; keys saved in `accountKeysSnjs.json` |
| [3.useFalcon512Account.ts](3.useFalcon512Account.ts) | STRK transfer |
| [4.signMessageFalcon512.ts](4.signMessageFalcon512.ts) | SNIP-12 message, verified off-chain and on-chain |
| [5.declareFromFalcon512.ts](5.declareFromFalcon512.ts) | the Falcon account declares, deploys and uses `hello` |
| [6.importFalconRsAccount.ts](6.importFalconRsAccount.ts) | reuse of the falcon-rs account of `../accountKeys.json` (run `../2.deployFalcon512.ts` on the same devnet first) |
| [10.falcon512Benchmark.ts](10.falcon512Benchmark.ts) | timings, `starknet/falcon` versus falcon-rs WASM |

## Performance

Measured with `10.falcon512Benchmark.ts` (starknet.js 11.4.0, Node 25, 2026-10-18, author's
machine):

| | `starknet/falcon` | falcon-rs WASM |
|---|---|---|
| keygen | 184 ms | 3 032 ms |
| sign | 15.7 ms (`signMessage`, including the SNIP-12 hash: 2.5 ms) | 5.3 ms (`sign_for_starknet`, on a hash) |
| verify (off-chain) | 7.9 ms | — |

## Security

Read the "Limits" section of the [guide](https://starknet-js.com/docs/guides/account/postQuantum#limits):
Falcon Round 3 and not FN-DSA, no protection against timing side channels, and the warning about
keys that already signed with the falcon-rs WASM.
