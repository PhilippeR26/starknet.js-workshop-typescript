// STRK20 SHIELD with the OFFICIAL SDK — SEPOLIA, on our self-deployed pool.
// SDK variant of ../6.strk20Shield.ts: SHIELDS `AMOUNT` STRK into a new encrypted note.
// One builder call replaces the whole manual pipeline of the parent script: with
// autoRegister/autoSetup, any one-time onboarding (registration/channel/subchannel) is
// batched with the deposit into a SINGLE proof, the surplus handling creates the
// encrypted self note, and our SecureVotyProofProvider (utils.ts) self-signs the
// screening attestation the deposit requires. Unshield with 7.strk20Unshield.ts.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run ../4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/withSTRK20SDK/6.strk20Shield.ts
// Coded with Starknet.js v10.4.0 + the STRK20 SDK (vendored bundle, see utils.ts)
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch it first, configured for SEPOLIA (see ../6.strk20Shield.ts header).
//          👆👆👆

import * as dotenv from "dotenv";
import { createEmptyRegistry } from "./strk20sdk";
import { formatBalance } from "../../../utils/formatBalance";
import { displayBalances } from "../../../utils/displayBalances";
import {
    accountOZ2SepoliaAddress, accountOZ2SepoliaPrivateKey,
    accountOZSepoliaAddress,
    accountOZSepoliaPrivateKey,
} from "../../../../A1priv/A1priv";
import {
    makeProvider, assertSepolia, checkProofServer, assertPoolDeployed,
    createStrk20Context, submitExecuteResult, ensureStrkAllowance, displayShieldedStrk,
    askConfirmation, PROOF_SERVER_URL, STRK_ADDRESS,
} from "./utils";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account acting as STRK20 user for THIS run. It pays the Sepolia gas.
// Change it freely between runs: all accounts share the same pool.
const USER_ADDRESS = accountOZSepoliaAddress;
const USER_PRIVATE_KEY = accountOZSepoliaPrivateKey;    // its stark private key (standard SRC-6 account: OZ/Ready)
const AMOUNT = 10n ** 18n;             // 1 STRK (18 decimals), u128, shielded into a new note
// true  : read-only — checks env/pool/state, displays the plan, sends NOTHING.
// false : REALLY executes on Sepolia (proof + apply_actions tx).
const CHECK_ONLY = false;
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
    if (registeredKey !== 0n && registeredKey !== BigInt(ctx.vkPub)) {
        throw new Error("This account is already registered in the pool with a DIFFERENT " +
            "viewing key. This script cannot manage its notes. Use another dedicated account.");
    }
    const feeAmount = BigInt(await ctx.pool.get_fee_amount());
    if (registeredKey !== 0n) {
        await displayShieldedStrk(ctx, `STRK20 state for ${USER_ADDRESS}`);
    } else {
        console.log(`\n${USER_ADDRESS} not registered yet — the SDK will batch the onboarding.`);
    }

    // ---------- plan & confirmation ----------
    console.log("\n--- Plan (single proof / single apply_actions tx) ---");
    console.log(` • SHIELD ${formatBalance(AMOUNT, 18)} STRK (+ any onboarding still needed,` +
        " auto-added by the SDK: SetViewingKey/OpenChannel/OpenSubchannel)");
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK (+ Sepolia gas of 1 apply_actions tx,` +
        ` + ${formatBalance(AMOUNT, 18)} STRK shielded)`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    if (!await askConfirmation()) return;

    // ---------- execution ----------
    await displayBalances(ctx.account.address, provider);
    await ensureStrkAllowance(ctx, AMOUNT + feeAmount);

    // The builder call: deposit AMOUNT of STRK.
    //  - autoRegister/autoSetup add SetViewingKey/OpenChannel/OpenSubchannel if missing;
    //  - the deposit's surplus handling creates the encrypted note to self;
    //  - our proof provider gets the proof and self-signs the screening attestation.
    // autoSelectNotes "naive" (not "all"): a deposit has no deficit, so no existing note
    // is spent — each run ADDS one note, like the parent script ("all" would sweep and
    // consolidate the existing notes into the new one).
    const result = await ctx.transfers
        .build({
            autoRegister: true,
            autoSetup: true,
            autoDiscover: { notes: "refresh", channels: "refresh" },
            autoSelectNotes: "naive",
            registry: createEmptyRegistry(),
        })
        .with(STRK_ADDRESS).deposit({ amount: AMOUNT }).done()
        .execute();
    await submitExecuteResult(`SHIELD ${formatBalance(AMOUNT, 18)} STRK`, ctx, result);

    // ---------- final report ----------
    await displayShieldedStrk(ctx, "Final state");
    await displayBalances(ctx.account.address, provider);
    console.log("Shield completed 🎉 (unshield with 7.strk20Unshield.ts)");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
