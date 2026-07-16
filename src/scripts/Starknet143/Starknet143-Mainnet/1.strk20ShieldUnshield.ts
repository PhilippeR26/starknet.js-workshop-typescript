// STRK20 shield/unshield WITHOUT a wallet (feasibility PoC) — Mainnet only.
// Reproduces what a STRK20 wallet does: builds the virtual INVOKE_TXN_V3 that calls the
// pool's `compile_actions`, gets a VIRTUAL_SNOS proof from the local SNIP-36 proof server
// (secure-voty), then submits `apply_actions` on-chain with the proof.
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Mainnet/1.strk20ShieldUnshield.ts
// Coded with Starknet.js v10.4.0
//
//          👇👇👇
// 🚨🚨🚨   The SNIP-36 proof server is available here:
//          ➡️  https://github.com/PhilippeR26/secure-voty/tree/main/proofServer  ⬅️
//          Launch the secure-voty proof server first (proofServer: npm run start, port 3030,
//          .env configured for MAINNET) before using this script with CHECK_ONLY = false.
//          👆👆👆

import {
    RpcProvider, Account, Contract, ec, num, hash, stark,
    constants, CairoBytes31, CairoCustomEnum, CairoOption, CairoOptionVariant,
    CallData, type BigNumberish, type Call, type Abi,
} from "starknet";
import type { INVOKE_TXN_V3 } from "@starknet-io/types-js";
import { accountOZMainnetAddress, accountOZMainnetPrivateKey, alchemyKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { displayBalances } from "../../utils/displayBalances";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
const USER_ADDRESS = accountOZMainnetAddress;     // dedicated Mainnet account, NEVER used with STRK20 before
const USER_PRIVATE_KEY = accountOZMainnetPrivateKey; // its stark private key (standard SRC-6 account: OZ/Ready)
// STRK20 privacy pool. Mainnet ONLY. Not officially published — inferred on-chain (2026-06);
// the script verifies at startup that the deployed class exposes compile_actions/apply_actions.
const POOL_ADDRESS = "0x40337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a";
const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // same on all networks
const AMOUNT = 10n ** 18n;             // 1 STRK (18 decimals), u128, shielded then unshielded
const PROOF_SERVER_URL = "http://localhost:3030";
const MAX_NOTE_SCAN = 100;             // safety cap for the on-chain note index scan
// true  : read-only — checks env/pool/state, displays the plan and costs, sends NOTHING.
// false : REALLY executes on Mainnet (proofs + apply_actions txs + fees). Real money!
const CHECK_ONLY = false;
// =========================================================

const myProvider = new RpcProvider({
    nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
});

// Pool contract objects — assigned once in main() after the on-chain ABI fetch,
// used by the action encoding (populate) and the submission helpers.
let pool: Contract;
let poolClassHash: string;
let feeAmount: bigint;

function keysFilled(): boolean {
    return !USER_ADDRESS.includes("FILL") && !USER_PRIVATE_KEY.includes("FILL");
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
// All hashes mirror doc/ekuboContract/packages/privacy/src/hashes.cairo exactly.
// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const poseidon = (vals: BigNumberish[]) => hash.computePoseidonHashOnElements(vals);
const CURVE_ORDER = BigInt(ec.starkCurve.CURVE.n);
const HALF_ORDER = CURVE_ORDER / 2n;
const TWO_POW_128 = 2n ** 128n;
const TWO_POW_120 = 2n ** 120n;
// Script-specific domain tag for the deterministic viewing key (NOT part of the protocol).
const VK_DERIVATION_TAG = TAG("STRK20_VK_FROM_ACCOUNT:V1");

// Deterministic viewing key: same account private key => same vk, nothing stored on disk.
// Canonical requirement of the pool: 0 < vk < ORDER/2 (utils.cairo is_canonical_key).
function deriveViewingKey(accountPrivKey: string): string {
    let h = BigInt(poseidon([VK_DERIVATION_TAG, accountPrivKey]));
    let vk = h % HALF_ORDER;
    while (vk === 0n) { h = BigInt(poseidon([h])); vk = h % HALF_ORDER; } // unreachable in practice
    return num.toHex(vk);
}
// derive_public_key (utils.cairo:231): x-coordinate of vk*G on the Stark curve.
function derivePublicKey(vk: string): string {
    return num.toHex(ec.starkCurve.getStarkKey(vk));
}
function computeChannelKey(userAddr: string, vk: string, vkPub: string): string {
    // self->self channel: sender == recipient == user
    return poseidon([TAG("CHANNEL_KEY_TAG:V1"), userAddr, vk, userAddr, vkPub]);
}
function computeChannelMarker(channelKey: string, userAddr: string, vkPub: string): string {
    return poseidon([TAG("CHANNEL_MARKER_TAG:V1"), channelKey, userAddr, userAddr, vkPub]);
}
function computeSubchannelMarker(channelKey: string, userAddr: string, vkPub: string, token: string): string {
    return poseidon([TAG("SUBCHANNEL_MARKER_TAG:V1"), channelKey, userAddr, vkPub, token]);
}
function computeNoteId(channelKey: string, token: string, index: number): string {
    return poseidon([TAG("NOTE_ID_TAG:V1"), channelKey, token, index, 0]);
}
function computeNullifier(channelKey: string, token: string, index: number, vk: string): string {
    return poseidon([TAG("NULLIFIER_TAG:V1"), channelKey, token, index, 0, vk]);
}
// Note.packed_value = u256{ high: salt, low: enc_amount } (utils.cairo OPEN_NOTE_PACKED_VALUE).
// Encrypted note: amount = (enc - h(ENC_AMOUNT_TAG,...)) mod 2^128 (objects.cairo:96).
function decryptNote(packed: bigint, channelKey: string, token: string, index: number): { salt: bigint; amount: bigint } {
    const salt = packed >> 128n;
    const enc = packed & (TWO_POW_128 - 1n);
    if (salt === 1n) return { salt, amount: enc }; // open note: plaintext amount
    const h = BigInt(poseidon([TAG("ENC_AMOUNT_TAG:V1"), channelKey, token, index, 0, num.toHex(salt)]));
    return { salt, amount: (enc - (h % TWO_POW_128) + TWO_POW_128) % TWO_POW_128 };
}
function randomFelt(): string {
    const r = stark.randomAddress();
    return BigInt(r) === 0n ? randomFelt() : r; // must be non-zero for the pool's asserts
}
// CreateEncNote salt: 1 < salt < 2^120 (actions.cairo SALT_TOO_SMALL / SALT_EXCEEDS_120_BITS).
function randomNoteSalt(): bigint {
    const s = 2n + (BigInt(stark.randomAddress()) % (TWO_POW_120 - 2n));
    return s;
}
// Offline self-checks, run at startup (cheap; catches API/regression issues early).
function cryptoSelfChecks(): void {
    const vk = deriveViewingKey("0x1234");
    if (BigInt(vk) >= HALF_ORDER || BigInt(vk) === 0n) throw new Error("selfcheck: vk not canonical");
    if (vk !== deriveViewingKey("0x1234")) throw new Error("selfcheck: vk not deterministic");
    const pub = derivePublicKey(vk);
    if (BigInt(pub) === 0n) throw new Error("selfcheck: zero public key");
    // encrypt/decrypt round-trip on a synthetic note
    const ck = computeChannelKey("0xabc", vk, pub);
    const salt = randomNoteSalt();
    const amount = 123456789n;
    const h = BigInt(poseidon([TAG("ENC_AMOUNT_TAG:V1"), ck, STRK_ADDRESS, 0, 0, num.toHex(salt)]));
    const packed = (salt << 128n) + ((h + amount) % TWO_POW_128);
    const dec = decryptNote(packed, ck, STRK_ADDRESS, 0);
    if (dec.amount !== amount || dec.salt !== salt) throw new Error("selfcheck: note round-trip failed");
    console.log("Crypto self-checks OK ✅");
}

// ================== ClientAction builders — ABI-encoded by starknet.js ==================
// Encoding is done by Contract.populate() against the DEPLOYED pool ABI (fetched in main),
// per the starknet.js guide (interact): populate() for complex params. Variant and field
// names below were verified against the deployed ABI on-chain (2026-07-11).
type ClientAction = CairoCustomEnum;

const action = {
    setViewingKey: (random: string): ClientAction =>
        new CairoCustomEnum({ SetViewingKey: { random } }),
    openChannel: (recipientAddr: string, index: number, random: string, salt: string): ClientAction =>
        new CairoCustomEnum({ OpenChannel: { recipient_addr: recipientAddr, index, random, salt } }),
    openSubchannel: (recipientAddr: string, recipientPublicKey: string, channelKey: string,
        index: number, token: string, salt: string): ClientAction =>
        new CairoCustomEnum({
            OpenSubchannel: {
                recipient_addr: recipientAddr, recipient_public_key: recipientPublicKey,
                channel_key: channelKey, index, token, salt
            }
        }),
    createEncNote: (recipientAddr: string, recipientPublicKey: string, token: string,
        amount: bigint, index: number, salt: bigint): ClientAction =>
        new CairoCustomEnum({
            CreateEncNote: {
                recipient_addr: recipientAddr, recipient_public_key: recipientPublicKey,
                token, amount, index, salt
            }
        }),
    deposit: (token: string, amount: bigint): ClientAction =>
        new CairoCustomEnum({ Deposit: { token, amount } }),
    useNote: (channelKey: string, token: string, index: number): ClientAction =>
        new CairoCustomEnum({ UseNote: { channel_key: channelKey, token, index } }),
    withdraw: (toAddr: string, token: string, amount: bigint, random: string): ClientAction =>
        new CairoCustomEnum({ Withdraw: { to_addr: toAddr, token, amount, random } }),
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
// enum-encoding regression before real money is involved.
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
// The pool contract IS the account of the virtual tx (sender = POOL_ADDRESS).
// __validate__ requires: version 3, tip = 0, max_price_per_unit = 0 for all resources
// (privacy.cairo:164). max_amount values are free — give enough l2 gas for compile_actions.
// The signature is checked against the USER's account via SRC-6 is_valid_signature
// (utils.cairo:338), so we mount an Account at the pool address with the user's signer.
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
        provider: myProvider, address: POOL_ADDRESS, signer: userPrivKey,
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
// Same pattern as the reference SNIP-36 script (11.testAgeProof.ts L115-136):
// decode the L2->L1 message with CallData.decodeParameters against the pool ABI,
// then re-encode the on-chain call with Contract.populate() — everything through starknet.js.
//
// L2->L1 message payload = [pool_class_hash, ...serde(Span<ServerAction>)] (utils.cairo:349).
// DEPLOYED apply_actions signature (differs from the local source copy!):
//   apply_actions(actions: Span<ServerAction>, screening: Option<ScreeningAttestation>)
// [Not validated] whether the pool accepts Option::None or requires a screening attestation.
function decodeServerActions(payload: BigNumberish[]): CairoCustomEnum[] {
    const poolCallData = new CallData(pool.abi);
    const [classHash, actions] = poolCallData.decodeParameters(
        ["core::starknet::class_hash::ClassHash", "core::array::Span::<privacy::actions::ServerAction>"],
        payload.map((x) => num.toHex(x)),
    ) as [bigint, CairoCustomEnum[]];
    if (BigInt(classHash) !== BigInt(poolClassHash)) {
        throw new Error(`Unexpected class hash in proof message: ${num.toHex(classHash)}`);
    }
    return actions;
}

// The pool pulls STRK from the submitter: fee via collect_fee (transfer_from caller) and
// the Deposit amount via TransferFrom(user). One approve covers both (same account here).
// STRK Contract uses the real ABI fetched on-chain; starknet.js encodes the u256 amount
// from a plain bigint through that ABI (no hand-written ABI, no manual {low, high}).
async function ensureAllowance(userAccount: Account, needed: bigint): Promise<void> {
    const strkClass = await myProvider.getClassAt(STRK_ADDRESS);
    const strk = new Contract({ abi: strkClass.abi, address: STRK_ADDRESS, providerOrAccount: userAccount });
    const current: bigint = BigInt(await strk.allowance(userAccount.address, POOL_ADDRESS));
    console.log(`STRK allowance user->pool: ${formatBalance(current, 18)} (needed: ${formatBalance(needed, 18)})`);
    if (current >= needed) return;
    console.log("Sending approve tx...");
    const { transaction_hash } = await strk.approve(POOL_ADDRESS, needed);
    await myProvider.waitForTransaction(transaction_hash);
    console.log("Approve OK:", transaction_hash);
}

// One full protocol step: build virtual tx -> prove -> decode message -> populate apply_actions
// -> execute with the proof attached (same shape as 11.testAgeProof.ts "verify" step).
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
        screening: new CairoOption(CairoOptionVariant.None), // 🚨🚨🚨 fail, because screening is mandatory (validation that transfer is not blacklisted due to non authorized address)
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

// ================== on-chain state discovery (read-only, all derived from vk) ==================
type Strk20State = {
    registeredKey: bigint;          // 0n = not registered
    channelOpen: boolean;
    subchannelOpen: boolean;
    notes: { index: number; amount: bigint; spent: boolean }[]; // existing notes, in index order
    nextNoteIndex: number;
};

async function discoverState(vk: string, vkPub: string, channelKey: string): Promise<Strk20State> {
    const registeredKey: bigint = BigInt(await pool.get_public_key(USER_ADDRESS));
    const channelOpen: boolean = Boolean(await pool.channel_exists(
        computeChannelMarker(channelKey, USER_ADDRESS, vkPub)));
    const subchannelOpen: boolean = Boolean(await pool.subchannel_exists(
        computeSubchannelMarker(channelKey, USER_ADDRESS, vkPub, STRK_ADDRESS)));
    const notes: Strk20State["notes"] = [];
    let i = 0;
    for (; i < MAX_NOTE_SCAN; i++) {
        const note = await pool.get_note(computeNoteId(channelKey, STRK_ADDRESS, i));
        const packed = BigInt(note.packed_value);
        if (packed === 0n) break; // first free index found — stop (scan cost = nb notes + 1)
        const { amount } = decryptNote(packed, channelKey, STRK_ADDRESS, i);
        const spent = Boolean(await pool.nullifier_exists(
            computeNullifier(channelKey, STRK_ADDRESS, i, vk)));
        notes.push({ index: i, amount, spent });
    }
    if (i === MAX_NOTE_SCAN) throw new Error(`Note scan cap reached (${MAX_NOTE_SCAN}).`);
    return { registeredKey, channelOpen, subchannelOpen, notes, nextNoteIndex: i };
}

async function main() {
    cryptoSelfChecks();
    // --- provider check (same pattern as other scripts of this collection) ---
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    if (await myProvider.getChainId() !== constants.StarknetChainId.SN_MAIN) {
        throw new Error("This script targets MAINNET only (pool address is Mainnet-only).");
    }
    console.log("Provider connected to Starknet Mainnet.");

    // --- proof server check ---
    const serverUp = await checkProofServer();
    if (!serverUp && !CHECK_ONLY) {
        throw new Error(`Proof server not reachable at ${PROOF_SERVER_URL}. ` +
            "Launch it first: secure-voty/proofServer → npm run start (Mainnet .env).");
    }
    console.log("Proof server:", serverUp ? "UP ✅" : "DOWN ⚠️ (tolerated in CHECK_ONLY)");

    // --- pool contract check (read-only) ---
    const poolClass = await myProvider.getClassAt(POOL_ADDRESS);
    const abi = poolClass.abi as Abi;
    const abiText = JSON.stringify(abi);
    if (!abiText.includes("compile_actions") || !abiText.includes("apply_actions")) {
        throw new Error("Contract at POOL_ADDRESS does not expose compile_actions/apply_actions " +
            "— wrong address? (pool address is NOT officially published)");
    }
    poolClassHash = num.toHex(await myProvider.getClassHashAt(POOL_ADDRESS));
    pool = new Contract({ abi, address: POOL_ADDRESS, providerOrAccount: myProvider });
    feeAmount = BigInt(await pool.get_fee_amount());
    const validityBlocks: bigint = BigInt(await pool.get_proof_validity_blocks());
    console.log("Pool OK. class hash =", poolClassHash);
    console.log(`Pool fee = ${Number(feeAmount) / 1e18} STRK per apply_actions; proof validity = ${validityBlocks} blocks.`);

    // ABI-encoding cross-check (needs the pool ABI, hence after pool creation)
    serdeSelfChecks();

    // ---------- derive keys & discover on-chain state ----------
    if (!keysFilled()) {
        console.log("\n⚠️ USER_ADDRESS / USER_PRIVATE_KEY not filled — stopping after env checks.");
        return;
    }
    const vk = deriveViewingKey(USER_PRIVATE_KEY);
    const vkPub = derivePublicKey(vk);
    const channelKey = computeChannelKey(USER_ADDRESS, vk, vkPub);
    const state = await discoverState(vk, vkPub, channelKey);

    if (state.registeredKey !== 0n && state.registeredKey !== BigInt(vkPub)) {
        throw new Error("This account is already registered in the pool with a DIFFERENT " +
            "viewing key (probably set by a wallet). This script cannot manage its notes. " +
            "Use another dedicated account.");
    }
    console.log("\n--- STRK20 state for", USER_ADDRESS, "---");
    console.log("registered:", state.registeredKey !== 0n,
        "| channel:", state.channelOpen, "| subchannel(STRK):", state.subchannelOpen);
    for (const n of state.notes) {
        console.log(`note #${n.index}: ${formatBalance(n.amount, 18)} STRK ${n.spent ? "(spent)" : "(unspent)"}`);
    }

    // ---------- build the transaction plan (skip steps already applied on-chain) ----------
    const txPlans: { name: string; actions: ClientAction[] }[] = [];
    if (state.registeredKey === 0n) {
        txPlans.push({
            name: "1/5 SetViewingKey (registration)",
            actions: [
                action.setViewingKey(randomFelt())]
        });
    }
    if (!state.channelOpen) {
        txPlans.push({
            name: "2/5 OpenChannel (self)",
            actions: [
                action.openChannel(USER_ADDRESS, 0, randomFelt(), randomFelt())]
        });
    }
    if (!state.subchannelOpen) {
        txPlans.push({
            name: "3/5 OpenSubchannel (STRK)",
            actions: [
                action.openSubchannel(USER_ADDRESS, vkPub, channelKey, 0, STRK_ADDRESS, randomFelt())]
        });
    }
    const shieldIndex = state.nextNoteIndex;
    txPlans.push({
        name: `4/5 SHIELD ${formatBalance(AMOUNT, 18)} STRK (note #${shieldIndex})`,
        actions: [
            action.deposit(STRK_ADDRESS, AMOUNT),                                        // phase 3
            action.createEncNote(USER_ADDRESS, vkPub, STRK_ADDRESS, AMOUNT, shieldIndex, randomNoteSalt()), // phase 5
        ]
    });
    txPlans.push({
        name: `5/5 UNSHIELD note #${shieldIndex} -> ${formatBalance(AMOUNT, 18)} STRK`,
        actions: [
            action.useNote(channelKey, STRK_ADDRESS, shieldIndex),                       // phase 4
            action.withdraw(USER_ADDRESS, STRK_ADDRESS, AMOUNT, randomFelt()),           // phase 6
        ]
    });

    // ---------- costs & confirmation ----------
    const totalFees = feeAmount * BigInt(txPlans.length);
    console.log("\n--- Plan ---");
    for (const t of txPlans) console.log(" •", t.name);
    console.log(`Pool fees: ${txPlans.length} x ${formatBalance(feeAmount, 18)} = ${formatBalance(totalFees, 18)} STRK` +
        ` (+ Mainnet gas of ${txPlans.length} apply_actions txs, + ${formatBalance(AMOUNT, 18)} STRK shielded then returned)`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\nProceed on MAINNET (real STRK)? [y/N] `);
    rl.close();
    if (answer.trim().toLowerCase() !== "y") { console.log("Aborted."); return; }

    // ---------- execution ----------
    const userAccount = new Account({ provider: myProvider, address: USER_ADDRESS, signer: USER_PRIVATE_KEY });
    await displayBalances(userAccount.address, myProvider);
    await ensureAllowance(userAccount, AMOUNT + totalFees);
    for (const t of txPlans) {
        await proveAndApply(t.name, t.actions, userAccount, vk);
    }

    // ---------- final report ----------
    const finalState = await discoverState(vk, vkPub, channelKey);
    console.log("\n--- Final state ---");
    for (const n of finalState.notes) {
        console.log(`note #${n.index}: ${formatBalance(n.amount, 18)} STRK ${n.spent ? "(spent)" : "(unspent)"}`);
    }
    await displayBalances(userAccount.address, myProvider);
    console.log("Shield + unshield round-trip completed 🎉");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
