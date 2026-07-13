// STRK20 UNSHIELD with the OFFICIAL SDK — SEPOLIA, on our self-deployed pool.
// SDK variant of ../7.strk20Unshield.ts: withdraws STRK from the pool back to the
// public balance. The SDK's SimplePrivateTransfers wrapper replaces the whole manual
// pipeline of the parent script (channel/note discovery incl. ECDH decryption of
// channels received from third parties, note selection, change note, phase ordering):
//   UNSHIELD_AMOUNT = "ALL"     -> spends ALL unspent notes, withdraws the total.
//   UNSHIELD_AMOUNT = <bigint>  -> spends notes (largest first) and keeps the surplus
//                                  as an encrypted CHANGE note.
// Note vs the parent script: the SDK selects LARGEST-first (dust-attack protection) and,
// for a partial amount, still sweeps with its selection strategy — the change note
// semantics are identical, the picked notes may differ.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run ../4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/withSTRK20SDK/7.strk20Unshield.ts
// Coded with Starknet.js v10.4.0 + the STRK20 SDK (vendored bundle, see utils.ts)
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch it first, configured for SEPOLIA (see ../7.strk20Unshield.ts header).
//          👆👆👆

import * as dotenv from "dotenv";
import { All, SimplePrivateTransfersImpl } from "./strk20sdk";
import { formatBalance } from "../../../utils/formatBalance";
import { displayBalances } from "../../../utils/displayBalances";
import {
    accountETHoz17snip9Address, accountETHoz17snip9PrivateKey,
} from "../../../../A1priv/A1priv";
import {
    makeProvider, assertSepolia, checkProofServer, assertPoolDeployed,
    createStrk20Context, submitExecuteResult, ensureStrkAllowance, displayShieldedStrk,
    askConfirmation, PROOF_SERVER_URL, STRK_ADDRESS,
} from "./utils";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account whose notes are unshielded. It pays the Sepolia gas. Must be the
// account whose notes were shielded/received (same keys as scripts 6/8 — the viewing
// key is derived from the private key).
const USER_ADDRESS = accountETHoz17snip9Address;
const USER_PRIVATE_KEY = accountETHoz17snip9PrivateKey;  // its stark private key (standard SRC-6 account: OZ/Ready)
// "ALL" -> unshield the whole shielded balance (all unspent notes, no change note).
// Or a bigint amount in fri (e.g. 5n * 10n ** 17n = 0.5 STRK) -> keeps the surplus
// as an encrypted change note.
const UNSHIELD_AMOUNT: bigint | "ALL" = "ALL";
// true  : read-only — checks env/pool/state, displays the plan, sends NOTHING.
// false : REALLY executes on Sepolia (proof + apply_actions tx).
const CHECK_ONLY = true;
// =========================================================

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

    // --- pool & SDK context ---
    const ctx = createStrk20Context(USER_ADDRESS, USER_PRIVATE_KEY, provider);
    await assertPoolDeployed(provider, ctx.poolAddress);

    // ---------- on-chain state ----------
    const registeredKey: bigint = BigInt(await ctx.pool.get_public_key(USER_ADDRESS));
    if (registeredKey === 0n) {
        throw new Error("This account is not registered in the pool — nothing to unshield. " +
            "Shield first with 6.strk20Shield.ts.");
    }
    if (registeredKey !== BigInt(ctx.vkPub)) {
        throw new Error("This account is registered in the pool with a DIFFERENT viewing key. " +
            "This script cannot manage its notes. Use the account used in scripts 6/8.");
    }
    const feeAmount = BigInt(await ctx.pool.get_fee_amount());
    // The SDK discovery finds the notes of ALL incoming channels (own shielded notes AND
    // notes received from third parties via script 8) — parent script 7 does this by hand.
    const balance = await displayShieldedStrk(ctx, `STRK20 state for ${USER_ADDRESS}`);
    if (balance === 0n) {
        console.log("\nNo unspent note — nothing to unshield. ✅");
        return;
    }
    const target: bigint = UNSHIELD_AMOUNT === "ALL" ? balance : UNSHIELD_AMOUNT;
    if (target <= 0n) throw new Error("UNSHIELD_AMOUNT must be > 0.");
    if (target > balance) {
        throw new Error(`Insufficient shielded balance: ${formatBalance(balance, 18)} STRK ` +
            `< requested ${formatBalance(target, 18)} STRK.`);
    }

    // ---------- plan & confirmation ----------
    console.log("\n--- Plan (single proof / single apply_actions tx) ---");
    console.log(` • UNSHIELD ${formatBalance(target, 18)} STRK -> ${USER_ADDRESS}` +
        `${UNSHIELD_AMOUNT === "ALL" ? " (ALL notes)" : " (surplus kept as change note)"}`);
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK (+ Sepolia gas of 1 apply_actions tx)`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    if (!await askConfirmation()) return;

    // ---------- execution ----------
    await displayBalances(ctx.account.address, provider);
    await ensureStrkAllowance(ctx, feeAmount); // fee = 0 on our pool: normally a no-op

    // The official one-liner: SimplePrivateTransfers.withdraw discovers the notes,
    // selects them, adds the change note if needed, proves and returns the call.
    const simple = new SimplePrivateTransfersImpl(ctx.transfers);
    const result = await simple.withdraw(STRK_ADDRESS, USER_ADDRESS,
        UNSHIELD_AMOUNT === "ALL" ? All : UNSHIELD_AMOUNT);
    await submitExecuteResult(`UNSHIELD ${formatBalance(target, 18)} STRK`, ctx, result);

    // ---------- final report ----------
    await displayShieldedStrk(ctx, "Final state");
    await displayBalances(ctx.account.address, provider);
    console.log("Unshield completed 🎉");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
