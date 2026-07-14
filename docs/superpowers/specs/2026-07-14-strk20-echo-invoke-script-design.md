# Design — `9.strk20EchoInvoke.ts` (STRK20 echo invoke round-trip, SDK)

Date: 2026-07-14

## Goal

Add a **script 9** to `src/scripts/Starknet143/Starknet143-Sepolia/withSTRK20SDK/` that
reproduces, with the STRK20 **SDK**, the "echo invoke" round-trip currently demonstrated with
the raw wallet RPC API in the wallet repo
(`Strk20Panel.tsx`, `runEchoInvoke`, ~L418): withdraw 5 STRK to a helper contract, create an
open note for the output, and invoke the helper — which emits an `Invoked` event with the
amount and deposits the 5 STRK back into the open note. Same pattern used by AMM swaps, but
here the helper does a trivial echo instead of a swap.

## API tier

The **fluent builder** (`transfers.build(...).with(...).invoke(callBuilder).execute()`), the same
tier as script 6. `SimplePrivateTransfersImpl` is excluded on purpose: it only exposes
`deposit/withdraw/transfer/swap` and has no generic `invoke`. This is the highest-level tier that
supports an arbitrary invoke. The script comment states this, consistent with scripts 4/6.

## The echo, wallet API → SDK builder

Wallet API (3 actions, string placeholders):
```
withdraw 5 STRK -> helper
transfer OPEN    -> self         (creates open note #0)
invoke helper [TOKEN, ${poolAddress}, ${openNoteIds[0]}]
```
SDK builder (placeholders become typed callback args):
```ts
transfers.build({
  autoDiscover: { notes: "refresh", channels: "refresh" },
  autoSelectNotes: "naive",   // select just enough notes to cover the 5 STRK withdraw
  autoSetup: true,            // OpenChannel/OpenSubchannel to self if missing (open note owner)
  registry: createEmptyRegistry(),
})
  .with(STRK_ADDRESS, (t) => t
    .withdraw({ recipient: ECHO_HELPER, amount: FIVE_STRK })
    .transfer({ recipient: ctx.account.address, amount: Open }))
  .invoke(({ openNotes, poolAddress }) => ({
    contractAddress: ECHO_HELPER,
    calldata: [STRK_ADDRESS, poolAddress, openNotes[0].noteId],
  }))
  .execute();
```
Key pedagogical point (in the script comment): where the wallet API passes the literal strings
`"${poolAddress}"` / `"${openNoteIds[0]}"`, the SDK gives a **typed callback** receiving the
already-resolved values (`poolAddress`, `openNotes[0].noteId`). `CallDetails = { contractAddress,
calldata }` — no entrypoint (the pool fixes `privacy_invoke`).

Net balance effect of the echo: withdraw 5 (spends notes ≥5, surplus → change note) + open note
filled with 5 ⇒ shielded balance returns to its pre-echo value (fee = 0 on our pool).

## Prerequisites — auto-shield if insufficient (MODIFIED 2026-07-14)

Decision reversed from "require script 6" to **auto-shield**: the script is self-contained.

1. Read shielded STRK balance (`displayShieldedStrk`).
2. **If `< 5 STRK`: shield the shortfall first** — a full deposit step in its own proof/tx,
   reusing script 6's builder pattern:
   ```ts
   await ensureStrkAllowance(ctx, SHIELD_AMOUNT + feeAmount);
   await ctx.transfers.build({
     autoRegister: true,   // registers the account if needed (no separate check required)
     autoSetup: true,
     autoDiscover: { notes: "refresh", channels: "refresh" },
     autoSelectNotes: "naive",
     registry: createEmptyRegistry(),
   }).with(STRK_ADDRESS).deposit({ amount: SHIELD_AMOUNT }).done().execute();
   ```
   `SHIELD_AMOUNT` shields enough to reach ≥ 5 STRK (simplest: shield `FIVE_STRK`). The deposit
   requires screening — the `SecureVotyProofProvider` self-signs it, as in script 6. This step
   needs 5 STRK of **public** STRK balance + allowance (`ensureStrkAllowance`).
3. Then run the echo round-trip (2nd proof/tx). Record **balance-before-echo** for verification.
4. **Echo helper deployed** on Sepolia — verified via the new `assertClassDeployed` (see below).

Consequence: script 9 may submit **two** apply_actions txs (shield, then echo) on a fresh account;
on an account that already has ≥ 5 STRK shielded, only the echo tx.

## Echo helper address (Sepolia)

Deployed by the user on Sepolia at **`0x4a51911a44eb4339fdb8704191f3b283bf80860f4ed29431d52592a2d35045e`**
(the wallet repo `cairo/address.md` documents the *mainnet* instance at `0x78ae662e…6f8735b`,
class `0x2a4482a13cb7f70dce6f7ba99c4ee6ce404379abeddd9b831b6bf24eb71e137`). `ECHO_HELPER_CLASS_HASH`
is identical on Sepolia (same contract) — **CONFIRMED** by a real end-to-end run 2026-07-14
(`assertClassDeployed` passed).

## Verification (event + balance)

Local `verifyEchoReceipt(txHash)` in the script (single-use, stays local — NOT in utils), port of
the wallet's `verifyEcho` without React:
- wait for the receipt (long budget — STARK proof), reject if `REVERTED`;
- find the `Invoked` event from the helper (`keys[0] == selector("Invoked")`,
  `from_address == helper`); decode `keys[1]=note_id`, `data[0]=amount`, `data[1]=caller`;
  **assert `amount == 5 STRK`**;
- re-read shielded balance ⇒ expect ≈ balance-before-echo (net = −fee = 0). Print ✅/❌ verdict.

## Shared change — `utils.ts` (one addition, genuinely shared)

The "deployment check with the class hash as a parameter" is used by **two** callers (pool +
helper), so it belongs in `utils.ts`:
```ts
export async function assertClassDeployed(
  provider, address, expectedClassHash, label): Promise<void>
```
`getClassHashAt` → throw `${label} not deployed` on failure → throw on class mismatch → log OK.
`assertPoolDeployed` is **refactored to delegate** to it (keeping its pool-specific "Deploy it
first with ../4.init…" hint and deterministic-address log). No behavior change for existing
scripts.

`ECHO_HELPER_ADDRESS` / `ECHO_HELPER_CLASS_HASH` are **local constants** in script 9 (single use).
`verifyEchoReceipt` is **local** to script 9.

## Files touched

- `utils.ts` — add `assertClassDeployed`; refactor `assertPoolDeployed` to delegate.
- `9.strk20EchoInvoke.ts` — new script (preamble modeled on script 7, optional auto-shield,
  echo via builder, verification).

## Out of scope

Swap variant (the helper is a trivial echo). Deploying the helper (done by the user).
