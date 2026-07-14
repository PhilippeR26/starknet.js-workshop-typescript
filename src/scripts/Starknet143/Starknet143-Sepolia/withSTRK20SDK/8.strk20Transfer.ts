// STRK20 shielded TRANSFER with the OFFICIAL SDK — SEPOLIA, on our self-deployed pool.
// SDK variant of ../8.strk20Transfer.ts: transfers TRANSFER_AMOUNT STRK privately inside
// the pool, from the SENDER's notes to a new encrypted note owned by the RECIPIENT —
// one proof, one apply_actions tx. The SDK discovers the sender's notes across ALL its
// channels (own shielded notes AND STRK received from third parties), opens the
// sender->recipient channel/subchannel if needed, selects the notes, and creates the
// change note back to the sender — everything the parent script does by hand.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run ../4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// ⚠️ The RECIPIENT must already be REGISTERED in the pool (SetViewingKey), otherwise
//    compile_actions panics RECIPIENT_NOT_REGISTERED. Register it first with
//    4.strk20Register.ts. Registration is all a recipient needs to receive (and even
//    to later spend the received note — the sender opens the channel/subchannel).
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/withSTRK20SDK/8.strk20Transfer.ts
// Coded with Starknet.js v10.4.0 + the STRK20 SDK (vendored bundle, see utils.ts)
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch it first, configured for SEPOLIA (see ../8.strk20Transfer.ts header).
//          👆👆👆

import * as dotenv from "dotenv";
import { SimplePrivateTransfersImpl } from "./strk20sdk";
import { formatBalance } from "../../../utils/formatBalance";
import { displayBalances } from "../../../utils/displayBalances";
import {
    accountOZ2SepoliaAddress, accountOZ2SepoliaPrivateKey, accountSTRKoz20snip9Address,
} from "../../../../A1priv/A1priv";
import {
    makeProvider, assertSepolia, checkProofServer, assertPoolDeployed,
    createStrk20Context, submitExecuteResult, ensureStrkAllowance, displayShieldedStrk,
    askConfirmation, PROOF_SERVER_URL, STRK_ADDRESS,
} from "./utils";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// SENDER: the SEPOLIA account whose shielded notes are spent. It pays the Sepolia gas.
const USER_ADDRESS = accountOZ2SepoliaAddress;
const USER_PRIVATE_KEY = accountOZ2SepoliaPrivateKey;    // its stark private key (standard SRC-6 account: OZ/Ready)
// RECIPIENT: only its ADDRESS is needed (its registered public viewing key is read
// on-chain by the SDK). Must be registered in the pool — see 4.strk20Register.ts.
const RECIPIENT_ADDRESS = accountSTRKoz20snip9Address;
const TRANSFER_AMOUNT = 10n ** 18n;    // 1 STRK (18 decimals), u128, transferred shielded
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

    if (USER_ADDRESS.includes("FILL") || USER_PRIVATE_KEY.includes("FILL")
        || RECIPIENT_ADDRESS.includes("FILL")) {
        console.log("\n⚠️ USER / RECIPIENT not filled — stopping after env checks.");
        return;
    }
    if (BigInt(RECIPIENT_ADDRESS) === BigInt(USER_ADDRESS)) {
        throw new Error("RECIPIENT_ADDRESS must differ from USER_ADDRESS (self-transfer is " +
            "pointless: the notes are already yours).");
    }

    // --- pool & SDK context ---
    const ctx = createStrk20Context(USER_ADDRESS, USER_PRIVATE_KEY, provider);
    await assertPoolDeployed(provider, ctx.poolAddress);

    // ---------- sender state ----------
    const senderKey: bigint = BigInt(await ctx.pool.get_public_key(USER_ADDRESS));
    if (senderKey === 0n) {
        throw new Error("Sender not registered in the pool. Shield first with 6.strk20Shield.ts.");
    }
    if (senderKey !== BigInt(ctx.vkPub)) {
        throw new Error("Sender registered with a DIFFERENT viewing key. Use the account of script 6.");
    }
    const feeAmount = BigInt(await ctx.pool.get_fee_amount());
    const balance = await displayShieldedStrk(ctx, `Sender STRK20 state: ${USER_ADDRESS}`);
    if (balance < TRANSFER_AMOUNT) {
        throw new Error(`Insufficient shielded balance: ${formatBalance(balance, 18)} STRK ` +
            `< ${formatBalance(TRANSFER_AMOUNT, 18)} STRK. Shield first with 6.strk20Shield.ts.`);
    }

    // ---------- recipient check (must be REGISTERED — compile_actions requirement) ----------
    const recipientKey: bigint = BigInt(await ctx.pool.get_public_key(RECIPIENT_ADDRESS));
    if (recipientKey === 0n) {
        throw new Error(`Recipient ${RECIPIENT_ADDRESS} is NOT registered in the pool ` +
            "(RECIPIENT_NOT_REGISTERED). Register it first with 4.strk20Register.ts.");
    }
    console.log("\nRecipient", RECIPIENT_ADDRESS, "is registered ✅");

    // ---------- plan & confirmation ----------
    console.log("\n--- Plan (single proof / single apply_actions tx) ---");
    console.log(` • TRANSFER ${formatBalance(TRANSFER_AMOUNT, 18)} STRK shielded -> ${RECIPIENT_ADDRESS}`);
    console.log("   (+ OpenChannel/OpenSubchannel if first transfer to this recipient," +
        " + change note to self — all auto-added by the SDK)");
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK (+ Sepolia gas of 1 apply_actions tx)`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    await displayBalances(ctx.account.address, provider);
    if (!await askConfirmation()) return;

    // ---------- execution ----------
    await ensureStrkAllowance(ctx, feeAmount); // fee = 0 on our pool: normally a no-op

    // The official one-liner: SimplePrivateTransfers.transfer discovers and selects the
    // sender's notes, opens the recipient channel/subchannel if needed, creates the
    // recipient note + the change note, proves and returns the call.
    const simple = new SimplePrivateTransfersImpl(ctx.transfers);
    const result = await simple.transfer(STRK_ADDRESS, RECIPIENT_ADDRESS, TRANSFER_AMOUNT);
    await submitExecuteResult(
        `TRANSFER ${formatBalance(TRANSFER_AMOUNT, 18)} STRK shielded -> ${RECIPIENT_ADDRESS}`,
        ctx, result);

    // ---------- final report ----------
    await displayShieldedStrk(ctx, "Sender final state");
    await displayBalances(ctx.account.address, provider);
    console.log("Shielded transfer completed 🎉 (the recipient sees the note with its own keys," +
        " e.g. by running 7.strk20Unshield.ts with its account)");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
