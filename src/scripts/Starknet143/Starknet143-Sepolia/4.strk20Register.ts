// STRK20 REGISTER only, WITHOUT a wallet — SEPOLIA, on our self-deployed pool.
// Companion of scripts 5-8 (same pool, same keys derivation). Registers USER in the
// pool: one SetViewingKey action (publishes the public viewing key + the private key
// escrowed to the auditor). Registration is all an account needs to RECEIVE shielded
// transfers (script 8) — and even to later spend the received notes.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run 4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// ⚠️ Registration is IMMUTABLE (WriteOnce): an account registers ONCE, forever, with the
//    viewing key derived below from its private key. Keep the derivation tag identical
//    across scripts 4-8, or the notes become unmanageable.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/4.strk20Register.ts
// Coded with Starknet.js v10.4.0
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch the secure-voty proof server first, configured for SEPOLIA
//          (proofServer: npm run start, port 3030), with a .env like:
//            PORT=3030
//            STARKNET_RPC_URL="https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/<alchemyKey>"
//            STARKNET_ACCOUNT_ADDRESS="<a funded SEPOLIA account>"
//            STARKNET_PRIVATE_KEY="<its private key>"
//            STARKNET_CHAIN_ID="SN_SEPOLIA"
//          👆👆👆

import {
    RpcProvider, Account, Contract, ec, num, hash, stark,
    constants, CairoBytes31, CairoCustomEnum, CairoOption, CairoOptionVariant,
    CallData, type BigNumberish, type Call, type Abi, type Calldata,
} from "starknet";
import type { INVOKE_TXN_V3 } from "@starknet-io/types-js";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import {
    accountSTRKoz20snip9Address, accountSTRKoz20snip9PrivateKey,
} from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account to REGISTER in the pool (change the import above to register
// another one). It signs the virtual tx and pays the Sepolia gas of apply_actions.
const USER_ADDRESS = accountSTRKoz20snip9Address;
const USER_PRIVATE_KEY = accountSTRKoz20snip9PrivateKey; // its stark private key (standard SRC-6 account: OZ/Ready)
// Governance admin of OUR pool. ⚠️ DO NOT CHANGE THIS VALUE. Part of the deterministic pool address
const POOL_GOVERNANCE_ADMIN = "0x04761f1bf6b5f11f6b5beb2fd862a468e4d7666f674ac544e2a502e4d8483747";
// Official STRK20 pool class — already DECLARED on Sepolia (same hash as Mainnet).
const POOL_CLASS_HASH = "0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d";
const PROOF_VALIDITY_BLOCKS = 450;     // must match 4.init (part of the pool address)
// Fixed screener/auditor public keys of OUR pool — only used to recompute the pool
// address (no deposit here, so the screener private key is never used to sign).
const SCREENER_PRIVATE_KEY = "0xCAFEBABE";
const AUDITOR_PRIVATE_KEY = "0xa0d17042";
const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // same on all networks
const PROOF_SERVER_URL = "http://localhost:3030";
// true  : read-only — checks env/pool/registration state, sends NOTHING.
// false : REALLY executes on Sepolia (proof + apply_actions tx).
const CHECK_ONLY = true;
// =========================================================

const myProvider = new RpcProvider({
    nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
});

// Pool contract objects — assigned once in main() after the class ABI fetch,
// used by the action encoding (populate) and the submission helpers.
let pool: Contract;
let poolAddress: string;
let feeAmount: bigint;

function keysFilled(): boolean {
    return !USER_ADDRESS.includes("FILL") && !USER_PRIVATE_KEY.includes("FILL")
        && !POOL_GOVERNANCE_ADMIN.includes("FILL");
}

// Any HTTP response (even 404) means the server is up; only a network error means it is down.
async function checkProofServer(): Promise<boolean> {
    try {
        await fetch(PROOF_SERVER_URL, { method: "GET", signal: AbortSignal.timeout(3000) });
        return true;
    } catch {
        return false;
    }
}

// ================== STRK20 crypto helpers ==================
// All hashes mirror packages/privacy/src/hashes.cairo exactly.
// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const poseidon = (vals: BigNumberish[]) => hash.computePoseidonHashOnElements(vals);
const CURVE_ORDER = BigInt(ec.starkCurve.CURVE.n);
const HALF_ORDER = CURVE_ORDER / 2n;
// Script-specific domain tag for the deterministic viewing key (NOT part of the protocol).
// ⚠️ Must stay IDENTICAL in scripts 4-8 (same vk => same notes).
const VK_DERIVATION_TAG = TAG("STRK20_VK_FROM_ACCOUNT:V1");
// Salt of the (unique:false) UDC deployment — fixed, so the pool address is deterministic.
const POOL_DEPLOY_SALT = TAG("STRK20_POC_POOL_SALT:V1");

// Deterministic viewing key: same account private key => same vk, nothing stored on disk.
// Canonical requirement of the pool: 0 < vk < ORDER/2 (utils.cairo is_canonical_key).
function deriveViewingKey(accountPrivKey: string): string {
    let h = BigInt(poseidon([VK_DERIVATION_TAG, accountPrivKey]));
    let vk = h % HALF_ORDER;
    while (vk === 0n) { h = BigInt(poseidon([h])); vk = h % HALF_ORDER; } // unreachable in practice
    return num.toHex(vk);
}
// derive_public_key (utils.cairo): x-coordinate of k*G on the Stark curve.
function derivePublicKey(privKey: string): string {
    return num.toHex(ec.starkCurve.getStarkKey(privKey));
}
function randomFelt(): string {
    const r = stark.randomAddress();
    return BigInt(r) === 0n ? randomFelt() : r; // must be non-zero for the pool's asserts
}
// Offline self-checks, run at startup (cheap; catches API/regression issues early).
function cryptoSelfChecks(): void {
    const vk = deriveViewingKey("0x1234");
    if (BigInt(vk) >= HALF_ORDER || BigInt(vk) === 0n) throw new Error("selfcheck: vk not canonical");
    if (vk !== deriveViewingKey("0x1234")) throw new Error("selfcheck: vk not deterministic");
    if (BigInt(derivePublicKey(vk)) === 0n) throw new Error("selfcheck: zero public key");
    console.log("Crypto self-checks OK ✅");
}

// ================== ClientAction builders — ABI-encoded by starknet.js ==================
// Encoding is done by Contract.populate() against the pool class ABI (fetched in main),
// per the starknet.js guide (interact): populate() for complex params. Variant and field
// names were verified against the deployed Mainnet pool ABI (same class, 2026-07-11).
type ClientAction = CairoCustomEnum;

const action = {
    setViewingKey: (random: string): ClientAction =>
        new CairoCustomEnum({ SetViewingKey: { random } }),
    deposit: (token: string, amount: bigint): ClientAction =>
        new CairoCustomEnum({ Deposit: { token, amount } }),
};

// Full Call (contract address + selector + ABI-compiled calldata) for the virtual tx.
function buildCompileActionsCall(userAddr: string, vk: string, actions: ClientAction[]): Call {
    return pool.populate("compile_actions", {
        user_addr: userAddr,
        user_private_key: vk,
        client_actions: actions,
    });
}

// Cross-check: the ABI encoding must match the protocol's Serde layout
// ([user, vk, span_len, variant_idx, ...fields] — actions.cairo). Catches any silent
// enum-encoding regression before anything is sent.
function serdeSelfChecks(): void {
    const call = buildCompileActionsCall("0xaa", "0xbb",
        [action.deposit(STRK_ADDRESS, 5n), action.setViewingKey("0x7")]);
    const got = (call.calldata as string[]).map((x) => BigInt(x));
    // [user, vk, 2, |5(Deposit), token, 5|, |0(SetViewingKey), 7|]
    const expected = [0xaan, 0xbbn, 2n, 5n, BigInt(STRK_ADDRESS), 5n, 0n, 7n];
    if (got.length !== expected.length || got.some((v, i) => v !== expected[i])) {
        throw new Error(`selfcheck serde: got ${JSON.stringify(call.calldata)}`);
    }
    console.log("Serde self-checks OK ✅ (ABI encoding matches protocol layout)");
}

// ================== virtual transaction builder ==================
// The pool contract IS the account of the virtual tx (sender = poolAddress).
// __validate__ requires: version 3, tip = 0, max_price_per_unit = 0 for all resources
// (privacy.cairo). max_amount values are free — give enough l2 gas for compile_actions.
// The signature is checked against the USER's account via SRC-6 is_valid_signature
// (utils.cairo), so we mount an Account at the pool address with the user's signer.
const VIRTUAL_RESOURCE_BOUNDS = {
    l1_gas: { max_amount: 0x100000n, max_price_per_unit: 0n },
    l2_gas: { max_amount: 2_000_000_000n, max_price_per_unit: 0n },
    l1_data_gas: { max_amount: 0x100000n, max_price_per_unit: 0n },
};

async function buildVirtualTx(
    actions: ClientAction[], userAddr: string, userPrivKey: string, vk: string,
): Promise<INVOKE_TXN_V3> {
    // Account at the POOL address, signing with the USER key. getSignedTransaction() then:
    // reads the pool's nonce, builds the execute calldata, hashes and signs — never broadcasts.
    const virtualAccount = new Account({
        provider: myProvider, address: poolAddress, signer: userPrivKey,
    });
    // Call built by Contract.populate() — ABI-encoded calldata.
    const call: Call = buildCompileActionsCall(userAddr, vk, actions);
    const tx: INVOKE_TXN_V3 = await virtualAccount.getSignedTransaction(call, {
        resourceBounds: VIRTUAL_RESOURCE_BOUNDS,
        tip: 0n,
    });
    return tx;
}

// ================== proof server SSE client ==================
// Inlined from secure-voty/scripts/src/RequestProof.ts (single-file constraint).
type ProveResult = {
    proof: string;
    proofFacts: BigNumberish[];
    l2ToL1Messages?: { from_address: BigNumberish; payload: BigNumberish[]; to_address: BigNumberish }[];
};

async function requestProof(currentBlock: number, tx: INVOKE_TXN_V3): Promise<ProveResult> {
    const response = await fetch(`${PROOF_SERVER_URL}/prove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockNumber: currentBlock, tx }),
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let proofRes: ProveResult | undefined;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // an SSE message is delimited by \n\n
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";
        for (const message of messages) {
            if (!message.trim()) continue;
            const eventMatch = message.match(/^event: (\w+)/);
            const dataMatch = message.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const data = JSON.parse(dataMatch[1]);
            if (eventMatch[1] === "log") console.log(`[proof:${data.stream}]`, String(data.line).trimEnd());
            if (eventMatch[1] === "done") proofRes = data;
            if (eventMatch[1] === "error") throw new Error(`Proof server error: ${data.message}`);
        }
    }
    if (!proofRes) throw new Error("No proof result from the proof server!");
    if (!proofRes.l2ToL1Messages?.length) {
        throw new Error("Proof has no L2->L1 message — compile_actions produced no server actions?");
    }
    return proofRes;
}

// ================== on-chain submission ==================
// L2->L1 message payload = [pool_class_hash, ...serde(Span<ServerAction>)] (utils.cairo).
// apply_actions signature: (actions: Span<ServerAction>, screening: Option<ScreeningAttestation>).
function decodeServerActions(payload: BigNumberish[]): CairoCustomEnum[] {
    const poolCallData = new CallData(pool.abi);
    const [classHash, actions] = poolCallData.decodeParameters(
        ["core::starknet::class_hash::ClassHash", "core::array::Span::<privacy::actions::ServerAction>"],
        payload.map((x) => num.toHex(x)),
    ) as [bigint, CairoCustomEnum[]];
    if (BigInt(classHash) !== BigInt(POOL_CLASS_HASH)) {
        throw new Error(`Unexpected class hash in proof message: ${num.toHex(classHash)}`);
    }
    return actions;
}

// One full protocol step: build virtual tx -> prove -> decode message -> populate apply_actions
// -> execute with the proof attached. No Deposit here => screening stays None
// (UNEXPECTED_SCREENING would panic otherwise — privacy.cairo apply_actions).
async function proveAndApply(
    name: string, actions: ClientAction[], userAccount: Account, vk: string,
): Promise<string> {
    console.log(`\n===== ${name} =====`);
    const currentBlock = await myProvider.getBlockNumber();
    const virtualTx = await buildVirtualTx(actions, userAccount.address, USER_PRIVATE_KEY, vk);
    console.log(`Virtual tx built (base block ${currentBlock}). Proving (~40-50 s)...`);
    const proofRes = await requestProof(currentBlock, virtualTx);
    const serverActions = decodeServerActions(proofRes.l2ToL1Messages![0].payload);
    console.log(`Proof OK. ${serverActions.length} server action(s). Submitting apply_actions...`);
    const applyCall = pool.populate("apply_actions", {
        actions: serverActions,
        screening: new CairoOption<object>(CairoOptionVariant.None),
    });
    // DEMO SHORTCUT (privacy leak): the token owner submits and pays this tx itself, so its
    // address is published on-chain. apply_actions authorizes on the proof alone and never
    // checks the caller, so in production ANY account can submit it — a sponsor/paymaster
    // (AVNU sponsored_private), reimbursed by a withdraw fee action inside the proven bundle,
    // keeping the user's account out of the block. One account is used here to keep the demo simple.
    const { transaction_hash } = await userAccount.execute(applyCall,
        { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
    console.log("apply_actions tx:", transaction_hash);
    await myProvider.waitForTransaction(transaction_hash);
    console.log(`${name} DONE ✅`);
    return transaction_hash;
}

async function main() {
    cryptoSelfChecks();
    // --- provider check (same pattern as other scripts of this collection) ---
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    if (await myProvider.getChainId() !== constants.StarknetChainId.SN_SEPOLIA) {
        throw new Error("This script targets SEPOLIA only.");
    }
    console.log("Provider connected to Starknet Sepolia Testnet.");

    // --- proof server check ---
    const serverUp = await checkProofServer();
    if (!serverUp && !CHECK_ONLY) {
        throw new Error(`Proof server not reachable at ${PROOF_SERVER_URL}. ` +
            "Launch it first: secure-voty/proofServer → npm run start (SEPOLIA .env, see header).");
    }
    console.log("Proof server:", serverUp ? "UP ✅" : "DOWN ⚠️ (tolerated in CHECK_ONLY)");

    // --- pool class check (read-only) ---
    const poolClass = await myProvider.getClassByHash(POOL_CLASS_HASH);
    const abi = poolClass.abi as Abi;
    const abiText = JSON.stringify(abi);
    if (!abiText.includes("compile_actions") || !abiText.includes("apply_actions")) {
        throw new Error("Class POOL_CLASS_HASH does not expose compile_actions/apply_actions.");
    }
    console.log("Pool class found on Sepolia ✅ (declared).");

    if (!keysFilled()) {
        console.log("\n⚠️ USER_ADDRESS / USER_PRIVATE_KEY / POOL_GOVERNANCE_ADMIN not filled " +
            "— stopping after env checks.");
        return;
    }

    // ---------- deterministic pool address (same computation as 4.init) ----------
    const constructorCalldata: Calldata = new CallData(abi).compile("constructor", {
        governance_admin: POOL_GOVERNANCE_ADMIN,
        auditor_public_key: derivePublicKey(AUDITOR_PRIVATE_KEY),
        screener_public_key: derivePublicKey(SCREENER_PRIVATE_KEY),
        proof_validity_blocks: PROOF_VALIDITY_BLOCKS,
    });
    poolAddress = hash.calculateContractAddressFromHash(
        POOL_DEPLOY_SALT, POOL_CLASS_HASH, constructorCalldata, 0);
    pool = new Contract({ abi, address: poolAddress, providerOrAccount: myProvider });
    serdeSelfChecks(); // needs the pool ABI, hence after pool creation

    // The pool must already exist (deployed by 4.init.strk20DeployPool.ts).
    let onchainClassHash: string;
    try {
        onchainClassHash = num.toHex(await myProvider.getClassHashAt(poolAddress));
    } catch {
        throw new Error(`Pool not deployed at ${poolAddress}. ` +
            "Deploy it first with 4.init.strk20DeployPool.ts.");
    }
    if (BigInt(onchainClassHash) !== BigInt(POOL_CLASS_HASH)) {
        throw new Error(`Address ${poolAddress} holds a DIFFERENT class (${onchainClassHash}).`);
    }
    console.log(`\nOur pool address (deterministic): ${poolAddress} ✅`);

    // ---------- registration state ----------
    const vk = deriveViewingKey(USER_PRIVATE_KEY);
    const vkPub = derivePublicKey(vk);
    feeAmount = BigInt(await pool.get_fee_amount());
    const registeredKey: bigint = BigInt(await pool.get_public_key(USER_ADDRESS));

    console.log("\n--- Registration state for", USER_ADDRESS, "---");
    if (registeredKey !== 0n) {
        if (registeredKey === BigInt(vkPub)) {
            console.log("Already registered with the expected viewing key ✅ — nothing to do.");
        } else {
            throw new Error("Already registered with a DIFFERENT viewing key (maybe by a wallet " +
                "or another derivation). Registration is immutable — use another account.");
        }
        return;
    }
    console.log("Not registered — will register with public viewing key", vkPub);
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK (+ Sepolia gas of 1 apply_actions tx, paid by ${USER_ADDRESS})`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\nProceed on SEPOLIA (testnet funds)? [y/N] `);
    rl.close();
    if (answer.trim().toLowerCase() !== "y") { console.log("Aborted."); return; }

    // ---------- execution ----------
    const userAccount = new Account({ provider: myProvider, address: USER_ADDRESS, signer: USER_PRIVATE_KEY });
    await proveAndApply("REGISTER (SetViewingKey)", [action.setViewingKey(randomFelt())],
        userAccount, vk);

    // ---------- final report ----------
    const finalKey: bigint = BigInt(await pool.get_public_key(USER_ADDRESS));
    if (finalKey !== BigInt(vkPub)) throw new Error("Registration check failed after tx!");
    console.log(`\n${USER_ADDRESS} is now registered ✅ — it can receive shielded transfers (script 8).`);
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
