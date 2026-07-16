# Using the STRK20 privacy SDK

The scripts in this folder are the SDK variants of the parent scripts `../4.strk20Register.ts`,
`../6.strk20Shield.ts`, `../7.strk20Unshield.ts` and `../8.strk20Transfer.ts`. They drive the
same PoC pool (deployed once by `../4.init.strk20DeployPool.ts`) with the same accounts and the
same viewing-key derivation — but instead of implementing the STRK20 protocol by hand
(Cairo hashes, note encryption, ECDH channel discovery, action serde, phase ordering…), they
delegate all of it to the **official TypeScript SDK** of
[starkware-libs/starknet-privacy](https://github.com/starkware-libs/starknet-privacy).
Result: ~100-140 lines per script instead of ~600-700.

```
utils.ts             shared wiring: SDK factory, secure-voty proof provider, helpers
4.strk20Register.ts  register a user (SetViewingKey)
6.strk20Shield.ts    deposit STRK into an encrypted note (with auto-onboarding)
7.strk20Unshield.ts  withdraw STRK back to the public balance
8.strk20Transfer.ts  private transfer to another registered user
strk20sdk.js/.d.ts   the SDK itself, vendored as a self-contained CommonJS bundle
```

> **Why a vendored bundle?** The SDK is only published on the GitHub Packages registry
> (auth required) and ships as an ES module (ts-node cannot `require()` it). `strk20sdk.js`
> is a single-file CJS bundle (esbuild, `starknet` kept external so this repo's copy is
> used) + `strk20sdk.d.ts` for the types. Regeneration instructions are in the header of
> [utils.ts](utils.ts). Regular projects would just `npm install @starkware-libs/starknet-privacy-sdk`.

## Prerequisites

1. The pool deployed on Sepolia: run `../4.init.strk20DeployPool.ts` once (already performed).
2. The local SNIP-36 proof server ([secure-voty](https://github.com/PhilippeR26/secure-voty/tree/main/proofServer))
   running on port 3030, configured for Sepolia.
3. A funded Sepolia account (STRK for gas + the shielded amounts).

Launch any script with `npx ts-node src/scripts/.../withSTRK20SDK/<script>.ts`.

## 1. Wiring: `createPrivateTransfers`

Everything starts with the factory. You give it an identity, three providers, and the pool
address; you get back a `PrivateTransfersInterface`. From `utils.ts`:

```ts
const transfers = createPrivateTransfers({
    account,                                            // { address, signer } — a starknet.js Account works
    viewingKeyProvider: { getViewingKey: async () => vk },
    provingProvider: new SecureVotyProofProvider(       // our adapter, see §2
        PROOF_SERVER_URL, provider, poolAddress, constants.StarknetChainId.SN_SEPOLIA),
    // On-chain discovery straight from the pool's view functions (a starknet.js
    // Contract satisfies PoolContractInterface structurally) — production dapps
    // would use the IndexerDiscoveryProvider, but our PoC pool has no indexer.
    discoveryProvider: new ContractDiscoveryProvider(pool as unknown as PoolContractInterface),
    poolContractAddress: poolAddress,
});
```

The three providers are the SDK's extension points:

| Provider | Role | What we plug in |
|---|---|---|
| `viewingKeyProvider` | returns the user's private viewing key | our deterministic derivation from the account key (same tag as the parent scripts, so both families see the same notes) |
| `provingProvider` | turns a signed virtual tx into a STARK proof | the local secure-voty server instead of the official prover |
| `discoveryProvider` | finds the user's channels & unspent notes | `ContractDiscoveryProvider` reading the pool contract directly over RPC |

`utils.ts` bundles this `transfers` object together with everything a script needs to reuse —
the starknet.js `Account`, a `Contract` on the pool (for view calls like `get_public_key`), the
pool address and the derived viewing keys — into a single **`ctx`** (`Strk20Context`), built once
per script by `createStrk20Context(userAddress, userPrivateKey, provider)`. Every code sample
below refers to that object: `ctx.transfers` is the SDK instance, `ctx.account` the submitter,
`ctx.pool` the view contract.

```ts
// at the top of each script:
const ctx = createStrk20Context(USER_ADDRESS, USER_PRIVATE_KEY, provider);
// ctx = { transfers, account, pool, poolAddress, vk, vkPub }
```

## 2. A custom proof provider

The SDK builds and signs the **virtual transaction** (an `INVOKE_TXN_V3` whose sender is the
pool, calling `compile_actions`) and hands it to `provingProvider.prove()`. Implementing
`ProofProviderInterface` is two methods (excerpt from `utils.ts`):

```ts
export class SecureVotyProofProvider implements ProofProviderInterface {
    // The prover replays the virtual tx against real state, so the invocation must carry
    // the pool's REAL nonce (the SDK default is a hardcoded 0).
    async getDefaultDetails(): Promise<ProofInvocationFactoryDetails> {
        if (this.cachedNonce === null) {
            this.cachedNonce = BigInt(await this.provider.getNonceForAddress(this.poolAddress, "latest"));
        }
        return { versions: [ETransactionVersion.V3], nonce: this.cachedNonce,
                 resourceBounds: VIRTUAL_RESOURCE_BOUNDS, tip: 0n, /* ... */ };
    }

    async prove(invocation: ProofInvocation): Promise<Proof> {
        const proofRes = await this.requestProof(blockNumber, invocation);  // SSE /prove
        // Proof.output = the pool's L2->L1 message payload: [class_hash, ...server actions]
        const output = proofRes.l2ToL1Messages![0].payload.map((x) => num.toHex(x));
        const proof: Proof = { data: proofRes.proof, output,
                               proofFacts: proofRes.proofFacts.map((x) => num.toHex(x)) };
        // Deposits MUST carry a screening attestation — on OUR pool we self-sign it
        // with the fixed screener key (the official prover would relay a real screener's
        // signature the same way, in Proof.additionalData).
        const depositor = this.depositorToScreen(invocation);
        if (depositor !== undefined) {
            const signature = signScreeningAttestation(depositor, issuedAt, this.chainId);
            return { ...proof, additionalData: { signature } };
        }
        return proof;
    }
}
```

The SDK then assembles the final `apply_actions` call itself, appending the screening
attestation (`Option<ScreeningAttestation>`) after the proven action span.

## 3. The operations

### Register (4.strk20Register.ts)

Raw actions are plain objects passed to `execute()`. Registration is a single action —
the SDK generates the random, compiles it, proves, and returns the call:

```ts
const result = await ctx.transfers.execute({ setViewingKey: {} });
await submitExecuteResult("REGISTER (SetViewingKey)", ctx, result);
```

### Shield (6.strk20Shield.ts)

The fluent builder, with the "auto" options doing the onboarding bookkeeping. One call =
one proof = one on-chain tx, whatever setup the account still needs:

```ts
const result = await ctx.transfers
    .build({
        autoRegister: true,      // adds SetViewingKey if the user is not registered
        autoSetup: true,         // adds OpenChannel/OpenSubchannel if missing
        autoDiscover: { notes: "refresh", channels: "refresh" },
        autoSelectNotes: "naive",
        registry: createEmptyRegistry(),
    })
    .with(STRK_ADDRESS).deposit({ amount: AMOUNT }).done()
    .execute();
```

The deposit's surplus automatically becomes an encrypted note to self. `autoSelectNotes:
"naive"` matters here: a deposit has no deficit, so no existing note is spent — each run
ADDS one note (`"all"` would sweep and consolidate the existing notes into the new one).

Don't forget the ERC-20 side: the pool pulls the deposit with `transferFrom`, so the user
must `approve` the pool first (`ensureStrkAllowance` in `utils.ts`).

### Unshield (7.strk20Unshield.ts)

For the common cases, `SimplePrivateTransfersImpl` wraps the builder into one-liners.
`All` (a symbol) spends every unspent note with no change note:

```ts
const simple = new SimplePrivateTransfersImpl(ctx.transfers);
const result = await simple.withdraw(STRK_ADDRESS, USER_ADDRESS,
    UNSHIELD_AMOUNT === "ALL" ? All : UNSHIELD_AMOUNT);
```

For a partial amount, the SDK selects notes (largest first — dust-attack protection) and
keeps the surplus as an encrypted change note. Discovery covers ALL incoming channels, so
notes received from third parties (script 8) are spendable too.

### Private transfer (8.strk20Transfer.ts)

```ts
const simple = new SimplePrivateTransfersImpl(ctx.transfers);
const result = await simple.transfer(STRK_ADDRESS, RECIPIENT_ADDRESS, TRANSFER_AMOUNT);
```

The SDK opens the sender→recipient channel/subchannel on first use, spends the sender's
notes, creates the recipient's encrypted note and the change note back to the sender.
The recipient only needs to be **registered** (its public viewing key is read on-chain);
check it first to fail with a clear message:

```ts
const recipientKey: bigint = BigInt(await ctx.pool.get_public_key(RECIPIENT_ADDRESS));
if (recipientKey === 0n) { /* -> run 4.strk20Register.ts for the recipient */ }
```

## 4. Submitting & reading state

`execute()` does NOT touch the chain: it returns an `ExecuteResult` whose
`callAndProof` holds the ready-made `apply_actions` call and the proof. Submitting is the
dapp's job — standard starknet.js, with the proof attached (SNIP-36):

```ts
const { call, proof } = result.callAndProof;
// DEMO SHORTCUT (privacy leak): ctx.account is the token owner, so submitting from it
// publishes its address on-chain. See the note below.
const { transaction_hash } = await ctx.account.execute(call,
    { proof: proof.data, proofFacts: proof.proofFacts });
await ctx.account.provider.waitForTransaction(transaction_hash);
```

⚠️ **Who submits is a privacy decision.** These demos submit from `ctx.account` — the token
owner itself — which puts its address in the block and defeats much of the point of the pool.
`apply_actions` authorizes on the **proof alone** and never checks the caller, so in production
**any** account can submit it: a sponsor / paymaster (AVNU `sponsored_private`) pays the gas from
its own address and is reimbursed by a `withdraw` fee action inserted **inside the proven bundle**,
so the user's account never appears on-chain. The demos use a single account only to keep the code
simple.

Reading the shielded balance is one discovery call — it returns only UNSPENT notes
(spent ones are filtered out via their nullifier):

```ts
const { notes } = await ctx.transfers.discoverNotes({ tokens: [BigInt(STRK_ADDRESS)] });
const strkNotes = notes.get(BigInt(STRK_ADDRESS)) ?? [];
const balance = strkNotes.reduce((acc, n) => acc + n.amount, 0n);
```

## 5. Options cheat sheet

| Option | Values | Effect |
|---|---|---|
| `autoRegister` | boolean | add `SetViewingKey` if the user is not registered |
| `autoSetup` | boolean | add `OpenChannel`/`OpenSubchannel` when missing |
| `autoDiscover.notes/channels` | `"missing"` \| `"refresh"` | when to call the discovery provider (`"refresh"` = always; recommended when you don't persist state) |
| `autoSelectNotes` | `"naive"` \| `"all"` | note selection: just enough (largest first) vs. sweep everything (consolidates notes) |
| `registry` | `PrivateRegistry` | in-memory state (channels + notes); `createEmptyRegistry()` for stateless one-shot scripts |

## Gotchas

- **Proof time & validity**: proving takes ~40-50 s and the proof expires after
  `proof_validity_blocks` (450 ≈ 15 min) — submit promptly.
- **Screening**: every deposit needs a screener-signed attestation; fund-less actions must
  NOT carry one (the SDK/provider pair handles both cases). Works on OUR pool because we
  deployed it with the canonical devnet screener key — on the official pools only the real
  screener can sign.
- **Nonce**: the virtual tx uses the POOL's account nonce; a stale cached nonce fails the
  proof (`invalidateNonceCache()` after errors).
- **Registration is immutable**: one viewing key per account, forever. Keep the derivation
  identical everywhere (this folder and the parent scripts share it on purpose).
