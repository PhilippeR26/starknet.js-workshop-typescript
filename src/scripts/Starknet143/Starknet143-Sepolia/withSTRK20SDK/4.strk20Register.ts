// STRK20 REGISTER with the OFFICIAL SDK — SEPOLIA, on our self-deployed pool.
// SDK variant of ../4.strk20Register.ts: registers USER in the pool (one SetViewingKey
// action). Registration is all an account needs to RECEIVE shielded transfers
// (script 8) — and even to later spend the received notes.
// The SDK compiles the action, our SecureVotyProofProvider (utils.ts) gets the proof
// from the local secure-voty server, and the script submits the returned apply_actions
// call. Compare with the parent script to see everything the SDK does for you.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run ../4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// ⚠️ Registration is IMMUTABLE (WriteOnce): an account registers ONCE, forever, with the
//    viewing key derived in utils.ts from its private key (same derivation as the parent
//    scripts, so both script families manage the same notes).
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/withSTRK20SDK/4.strk20Register.ts
// Coded with Starknet.js v10.4.0 + the STRK20 SDK (vendored bundle, see utils.ts)
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch it first, configured for SEPOLIA (see ../4.strk20Register.ts header).
//          👆👆👆

import * as dotenv from "dotenv";
import {
    accountSTRKoz20snip9Address, accountSTRKoz20snip9PrivateKey,
} from "../../../../A1priv/A1priv";
import {
    makeProvider, assertSepolia, checkProofServer, assertPoolDeployed,
    createStrk20Context, submitExecuteResult, askConfirmation, PROOF_SERVER_URL,
} from "./utils";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account to REGISTER in the pool. It signs the virtual tx and pays the
// Sepolia gas of apply_actions.
const USER_ADDRESS = accountSTRKoz20snip9Address;
const USER_PRIVATE_KEY = accountSTRKoz20snip9PrivateKey; // its stark private key (standard SRC-6 account: OZ/Ready)
// true  : read-only — checks env/pool/registration state, sends NOTHING.
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

    // ---------- registration state ----------
    const registeredKey: bigint = BigInt(await ctx.pool.get_public_key(USER_ADDRESS));
    console.log("\n--- Registration state for", USER_ADDRESS, "---");
    if (registeredKey !== 0n) {
        if (registeredKey === BigInt(ctx.vkPub)) {
            console.log("Already registered with the expected viewing key ✅ — nothing to do.");
        } else {
            throw new Error("Already registered with a DIFFERENT viewing key (maybe by a wallet " +
                "or another derivation). Registration is immutable — use another account.");
        }
        return;
    }
    console.log("Not registered — will register with public viewing key", ctx.vkPub);
    console.log("(Pool fee = 0 on our pool; + Sepolia gas of 1 apply_actions tx.)");

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    if (!await askConfirmation()) return;

    // ---------- execution ----------
    // One raw SDK action: { setViewingKey: {} }. The SDK generates the random, compiles
    // the ClientAction, builds & signs the virtual tx, and calls our proof provider.
    const result = await ctx.transfers.execute({ setViewingKey: {} });
    await submitExecuteResult("REGISTER (SetViewingKey)", ctx, result);

    // ---------- final report ----------
    const finalKey: bigint = BigInt(await ctx.pool.get_public_key(USER_ADDRESS));
    if (finalKey !== BigInt(ctx.vkPub)) throw new Error("Registration check failed after tx!");
    console.log(`\n${USER_ADDRESS} is now registered ✅ — it can receive shielded transfers (script 8).`);
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
