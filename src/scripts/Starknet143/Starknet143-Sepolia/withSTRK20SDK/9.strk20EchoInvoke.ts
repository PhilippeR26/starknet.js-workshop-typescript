// STRK20 ECHO INVOKE round-trip with the OFFICIAL SDK — SEPOLIA, on our self-deployed pool.
// SDK variant of the wallet-repo demo (Strk20Panel.tsx `runEchoInvoke`): it reproduces the
// complex `invoke` case — the SAME shape AMM swaps use — with a trivial "echo" helper:
//   1. withdraw 5 STRK from the pool to the helper,
//   2. create an OPEN note (empty, to self) for the helper's output,
//   3. invoke the helper: it emits an `Invoked` event with the amount and deposits the
//      5 STRK back into the open note.
// Net shielded balance is unchanged (fee = 0 on our pool) — the 5 STRK does a round-trip.
//
// Why the BUILDER tier (like script 6) and not SimplePrivateTransfersImpl: the "Simple"
// facade only covers value moves (deposit/withdraw/transfer/swap), NOT a generic invoke.
// The builder is the highest-level tier that exposes `.invoke(callBuilder)`. The nice part:
// where the wallet API passes literal placeholder strings ("${poolAddress}",
// "${openNoteIds[0]}"), the SDK gives a TYPED callback with the already-resolved values
// (poolAddress, openNotes[0].noteId).
//
// If the account has < 5 STRK shielded, the script SHIELDS 5 STRK first (its own proof/tx,
// same pattern as script 6, autoRegister included) so it is self-contained.
//
// ⚠️ PREREQUISITES: the pool (../4.init.strk20DeployPool.ts) AND the echo helper must be
//    deployed on Sepolia. The script checks both and STOPS if either is missing.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/withSTRK20SDK/9.strk20EchoInvoke.ts
// Coded with Starknet.js v10.4.0 + the STRK20 SDK (vendored bundle, see utils.ts)
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch it first, configured for SEPOLIA (see ../6.strk20Shield.ts header).
//          👆👆👆

import * as dotenv from "dotenv";
import { RpcProvider, hash, num } from "starknet";
import { Open, createEmptyRegistry } from "./strk20sdk";
import { formatBalance } from "../../../utils/formatBalance";
import { displayBalances } from "../../../utils/displayBalances";
import {
    accountOZSepoliaAddress, accountOZSepoliaPrivateKey,
} from "../../../../A1priv/A1priv";
import {
    makeProvider, assertSepolia, checkProofServer, assertPoolDeployed, assertClassDeployed,
    createStrk20Context, submitExecuteResult, ensureStrkAllowance, displayShieldedStrk,
    askConfirmation, PROOF_SERVER_URL, STRK_ADDRESS,
} from "./utils";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account acting as STRK20 user. It pays the Sepolia gas and, if a shield is
// needed, must hold >= 5 STRK in its PUBLIC balance. Same keys as scripts 6/8.
const USER_ADDRESS = accountOZSepoliaAddress;
const USER_PRIVATE_KEY = accountOZSepoliaPrivateKey;    // its stark private key (standard SRC-6 account: OZ/Ready)
// true  : read-only — checks env/pool/helper/state, displays the plan, sends NOTHING.
// false : REALLY executes on Sepolia (proof(s) + apply_actions tx(s)).
const CHECK_ONLY = true;
// =========================================================

// ---- fixed infra (not "to adapt") ----
// Echo helper deployed on SEPOLIA. (The wallet repo cairo/address.md documents the mainnet
// instance 0x78ae66…8735b; this is the Sepolia deployment, same contract class.)
const ECHO_HELPER_ADDRESS = "0x4a51911a44eb4339fdb8704191f3b283bf80860f4ed29431d52592a2d35045e";
const ECHO_HELPER_CLASS_HASH = "0x2a4482a13cb7f70dce6f7ba99c4ee6ce404379abeddd9b831b6bf24eb71e137";
const FIVE_STRK = 5n * 10n ** 18n;    // the amount the echo withdraws, and shields if needed

async function main() {
    const provider = makeProvider();
    await assertSepolia(provider);

    // --- proof server check ---
    const serverUp = await checkProofServer();
    if (!serverUp && !CHECK_ONLY) {
        throw new Error(`Proof server not reachable at ${PROOF_SERVER_URL}. ` +
            "Launch it first: secure-voty/proofServer → npm run start (SEPOLIA .env).");
    }
    console.log("Proof server:", serverUp ? "UP ✅" : "DOWN ⚠️ (tolerated in CHECK_ONLY)");

    if (USER_ADDRESS.includes("FILL") || USER_PRIVATE_KEY.includes("FILL")) {
        console.log("\n⚠️ USER_ADDRESS / USER_PRIVATE_KEY not filled — stopping after env checks.");
        return;
    }

    // --- pool, helper & SDK context ---
    const ctx = createStrk20Context(USER_ADDRESS, USER_PRIVATE_KEY, provider);
    await assertPoolDeployed(provider, ctx.poolAddress);
    await assertClassDeployed(provider, ECHO_HELPER_ADDRESS, ECHO_HELPER_CLASS_HASH, "Echo helper");

    // ---------- on-chain state ----------
    const registeredKey: bigint = BigInt(await ctx.pool.get_public_key(USER_ADDRESS));
    if (registeredKey !== 0n && registeredKey !== BigInt(ctx.vkPub)) {
        throw new Error("This account is registered in the pool with a DIFFERENT viewing key. " +
            "This script cannot manage its notes. Use the account used in scripts 6/8.");
    }
    const feeAmount = BigInt(await ctx.pool.get_fee_amount());
    const balance = await displayShieldedStrk(ctx, `STRK20 state for ${USER_ADDRESS}`);
    const needShield = balance < FIVE_STRK;

    // ---------- plan & confirmation ----------
    console.log("\n--- Plan ---");
    if (needShield) {
        console.log(` • SHIELD ${formatBalance(FIVE_STRK, 18)} STRK first (balance < 5 STRK)` +
            " — 1st proof/tx, onboarding auto-added by the SDK (autoRegister/autoSetup)");
    }
    console.log(` • ECHO round-trip: withdraw ${formatBalance(FIVE_STRK, 18)} STRK -> helper,` +
        " open note to self, invoke helper (fills it back) — 1 proof/tx");
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK per tx (+ Sepolia gas` +
        `${needShield ? `, + ${formatBalance(FIVE_STRK, 18)} STRK shielded` : ""})`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    await displayBalances(ctx.account.address, provider);
    if (!await askConfirmation()) return;

    // ---------- (optional) shield step ----------
    if (needShield) {
        await ensureStrkAllowance(ctx, FIVE_STRK + feeAmount);
        // Same builder pattern as script 6: autoRegister/autoSetup add any missing onboarding,
        // the deposit's surplus creates the encrypted self note, the proof provider self-signs
        // the screening attestation the deposit requires.
        const shieldResult = await ctx.transfers
            .build({
                autoRegister: true,
                autoSetup: true,
                autoDiscover: { notes: "refresh", channels: "refresh" },
                autoSelectNotes: "naive",
                registry: createEmptyRegistry(),
            })
            .with(STRK_ADDRESS).deposit({ amount: FIVE_STRK }).done()
            .execute();
        await submitExecuteResult(`SHIELD ${formatBalance(FIVE_STRK, 18)} STRK`, ctx, shieldResult);
    }

    // ---------- echo round-trip ----------
    const beforeEcho = await displayShieldedStrk(ctx, "Shielded balance before echo");
    await ensureStrkAllowance(ctx, feeAmount); // fee = 0 on our pool: normally a no-op

    // The 3 echo actions, 1-for-1 with the wallet API's runEchoInvoke — but the placeholder
    // strings become resolved values in the typed .invoke() callback.
    const echoResult = await ctx.transfers
        .build({
            autoDiscover: { notes: "refresh", channels: "refresh" },
            autoSelectNotes: "naive",   // select just enough notes to cover the 5 STRK withdraw
            autoSetup: true,            // OpenChannel/OpenSubchannel to self if missing (open note owner)
            registry: createEmptyRegistry(),
        })
        .with(STRK_ADDRESS, (t) => t
            .withdraw({ recipient: ECHO_HELPER_ADDRESS, amount: FIVE_STRK })   // 5 STRK -> helper
            .transfer({ recipient: ctx.account.address, amount: Open }))       // open note (output) to self
        .invoke(({ openNotes, poolAddress }) => ({
            // wallet API calldata was [TOKEN, "${poolAddress}", "${openNoteIds[0]}"]
            contractAddress: ECHO_HELPER_ADDRESS,
            calldata: [STRK_ADDRESS, poolAddress, openNotes[0].noteId],
        }))
        .execute();
    const txHash = await submitExecuteResult("ECHO invoke round-trip (5 STRK)", ctx, echoResult);

    // ---------- verification (event + balance) ----------
    await verifyEchoReceipt(provider, txHash);
    const afterEcho = await displayShieldedStrk(ctx, "Shielded balance after echo");
    const net = afterEcho - beforeEcho;
    console.log(`\nShielded balance change: ${net >= 0n ? "+" : ""}${formatBalance(net, 18)} STRK` +
        ` (expected ≈ 0, i.e. −fee = −${formatBalance(feeAmount, 18)} STRK)`);
    console.log("Echo invoke round-trip completed 🎉");
}

// Fetch the receipt and verify the helper's `Invoked` event: the open note was filled with
// the 5 STRK we withdrew. Port of the wallet repo's verifyEcho (Strk20Panel.tsx), no React.
// Event layout: keys = [selector, note_id (#[key])], data = [amount (u128), caller].
async function verifyEchoReceipt(provider: RpcProvider, txHash: string): Promise<void> {
    const selInvoked = num.toHex(hash.getSelectorFromName("Invoked"));
    const receipt: any = await provider.getTransactionReceipt(txHash);
    if (receipt?.execution_status === "REVERTED" || (receipt?.isReverted?.() === true)) {
        throw new Error(`Echo tx ${txHash} reverted.`);
    }
    const events: any[] = receipt?.events ?? receipt?.value?.events ?? [];
    const ev = events.find((e) => {
        try {
            return e?.keys?.length && e.from_address
                && BigInt(e.from_address) === BigInt(ECHO_HELPER_ADDRESS)
                && BigInt(e.keys[0]) === BigInt(selInvoked);
        } catch { return false; }
    });
    if (!ev) {
        throw new Error(`Invoked event NOT found from the helper (${events.length} events in receipt).`);
    }
    const noteId = num.toHex(ev.keys[1]);
    const amount = BigInt(ev.data[0]);
    console.log(`\nInvoked event ✅ — open note ${noteId} filled with ${formatBalance(amount, 18)} STRK`);
    if (amount !== FIVE_STRK) {
        throw new Error(`Echo amount mismatch: got ${amount}, expected ${FIVE_STRK}.`);
    }
    console.log(`Echo verified: amount == ${formatBalance(FIVE_STRK, 18)} STRK ✅`);
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
