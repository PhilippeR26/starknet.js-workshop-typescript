// STRK20 sub-account "sweep" WITHOUT a wallet — SEPOLIA, on the SELF-DEPLOYED pool.
//
// GOAL — prove that funds sitting on a sub-account can be pulled INTO the shielded
// balance WITHOUT any Deposit action, hence WITHOUT an AML screening attestation.
//
// Scenario:
//   1. account0 (the STRK20 user of script 5, already registered) sends a few STRK
//      publicly to its DAPP-"test" sub-account #0 — as if received from the outside.
//   2. We read account0's shielded balance (before).
//   3. In ONE proof, we sweep those STRK back: create an OPEN note owned by account0 +
//      a ComputeAndInvoke action that runs a harmless call AS the sub-account and
//      collects its whole STRK balance into that open note.  → NO Deposit, NO screening.
//   4. We read account0's shielded balance (after): it grew by the swept amount.
//
// Why no screening: the collected tokens enter the pool through the anonymizer's
// OpenNoteDeposit path (privacy_invoke_with_computation → approve → pool), NOT through a
// Deposit ClientAction. apply_actions only demands a ScreeningAttestation for a Deposit
// (privacy.cairo _verify_screening); supplying one here would even panic UNEXPECTED_SCREENING.
//
// PREREQUISITES (run once, in order):
//   - 4.init.strk20DeployPool.ts   → the pool exists.
//   - 5.strk20ShieldUnshield.ts    → account0 is registered (viewing key + STRK channel/subchannel).
//   - the SubAccountAnonymizer is deployed (see ANONYMIZER_ADDRESS below) and bound to OUR pool.
//   - the SNIP-36 proof server (secure-voty) is running on SEPOLIA (port 3030) — see script 5 header.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/9.strk20SubAccountSweep.ts
// Coded with Starknet.js v10.4.0

import {
    RpcProvider, Account, Contract, ec, num, hash, stark, cairo, json, shortString,
    constants, CairoBytes31, CairoCustomEnum, CairoOption, CairoOptionVariant,
    CallData, type BigNumberish, type Call, type Abi, type Calldata,
} from "starknet";
import type { INVOKE_TXN_V3 } from "@starknet-io/types-js";
import fs from "fs";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { displayBalances } from "../../utils/displayBalances";
import { accountOZSepoliaAddress, accountOZSepoliaPrivateKey } from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// account0: same SEPOLIA user as script 5, already registered in the pool.
const USER_ADDRESS = accountOZSepoliaAddress;
const USER_PRIVATE_KEY = accountOZSepoliaPrivateKey;
// Pool identity — MUST match script 5 (deterministic address recomputed below).
const POOL_GOVERNANCE_ADMIN = "0x04761f1bf6b5f11f6b5beb2fd862a468e4d7666f674ac544e2a502e4d8483747";
const POOL_CLASS_HASH = "0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d";
const PROOF_VALIDITY_BLOCKS = 450;
const SCREENER_PRIVATE_KEY = "0xCAFEBABE";
const AUDITOR_PRIVATE_KEY = "0xa0d17042";
// Sub-account anonymizer — self-deployed on Sepolia, bound to OUR pool (constructor:
// privacy_contract = pool, sub_account_class_hash = 0x956ddc..., governance_admin above).
const ANONYMIZER_ADDRESS = "0x597e600b8085453b28a28614e401f88b216cbba679ff7fa3ea7d71614da2803";
const ANONYMIZER_ARTIFACT =
    "compiledContracts/cairo2170/sub_account_anonymizer_SubAccountAnonymizer.contract_class.json";
// The dapp scoping the sub-accounts, and which nonce (identity) we use.
const DAPP_NAME = "test";
const SUBACCOUNT_NONCE = 0n;

const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const AMOUNT = 10n ** 18n;        // 1 STRK sent to the sub-account, then swept back
const PROOF_SERVER_URL = "http://localhost:3030";
const MAX_NOTE_SCAN = 100;
// true  : read-only — checks + plan, sends NOTHING. false : REALLY executes on Sepolia.
const CHECK_ONLY = false;
// =========================================================

const myProvider = new RpcProvider({
    nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
});

let pool: Contract;
let poolAddress: string;
let anonymizerAbi: Abi;

async function checkProofServer(): Promise<boolean> {
    try {
        await fetch(PROOF_SERVER_URL, { method: "GET", signal: AbortSignal.timeout(3000) });
        return true;
    } catch {
        return false;
    }
}

// ================== STRK20 crypto helpers (identical to script 5) ==================
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const poseidon = (vals: BigNumberish[]) => hash.computePoseidonHashOnElements(vals);
const CURVE_ORDER = BigInt(ec.starkCurve.CURVE.n);
const HALF_ORDER = CURVE_ORDER / 2n;
const TWO_POW_128 = 2n ** 128n;
const TWO_POW_120 = 2n ** 120n;
const VK_DERIVATION_TAG = TAG("STRK20_VK_FROM_ACCOUNT:V1");
const POOL_DEPLOY_SALT = TAG("STRK20_POC_POOL_SALT:V1");
// identity_key tag of the anonymizer commitment stack (hashes.cairo IDENTITY_KEY_TAG:V1).
const IDENTITY_KEY_TAG = TAG("IDENTITY_KEY_TAG:V1");

function deriveViewingKey(accountPrivKey: string): string {
    let h = BigInt(poseidon([VK_DERIVATION_TAG, accountPrivKey]));
    let vk = h % HALF_ORDER;
    while (vk === 0n) { h = BigInt(poseidon([h])); vk = h % HALF_ORDER; }
    return num.toHex(vk);
}
function derivePublicKey(privKey: string): string {
    return num.toHex(ec.starkCurve.getStarkKey(privKey));
}
function computeChannelKey(userAddr: string, vk: string, vkPub: string): string {
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
function decryptNote(packed: bigint, channelKey: string, token: string, index: number): { salt: bigint; amount: bigint } {
    const salt = packed >> 128n;
    const enc = packed & (TWO_POW_128 - 1n);
    if (salt === 1n) return { salt, amount: enc }; // open note: plaintext amount
    const h = BigInt(poseidon([TAG("ENC_AMOUNT_TAG:V1"), channelKey, token, index, 0, num.toHex(salt)]));
    return { salt, amount: (enc - (h % TWO_POW_128) + TWO_POW_128) % TWO_POW_128 };
}
function randomFelt(): string {
    const r = stark.randomAddress();
    return BigInt(r) === 0n ? randomFelt() : r;
}

// ================== anonymizer identity (mirrors sdk/src/internal/sub-accounts.ts) ==================
// identity_key = h(IDENTITY_KEY_TAG, user, vk, anonymizer)   (derived by the pool in-proof)
// partial      = h(identity_key, dapp_name)
// commitment   = h(partial, nonce)   = deploy salt → deterministic sub-account address
const dappNameFelt = (): string => num.toHex(shortString.encodeShortString(DAPP_NAME));
function computeIdentityKey(userAddr: string, vk: string): string {
    return poseidon([IDENTITY_KEY_TAG, userAddr, vk, ANONYMIZER_ADDRESS]);
}
function partialCommitment(userAddr: string, vk: string): string {
    // Poseidon hash of exactly two elements (no length prefix) — matches PoseidonTrait chain.
    return num.toHex(ec.starkCurve.poseidonHashMany(
        [BigInt(computeIdentityKey(userAddr, vk)), BigInt(dappNameFelt())]));
}

// ================== ClientAction builders (ABI-encoded by pool.populate) ==================
type ClientAction = CairoCustomEnum;
const collectPolicyAll = (): CairoCustomEnum =>
    new CairoCustomEnum({ All: {}, Diff: undefined, Exact: undefined });

const action = {
    // Empty note (amount 0) owned by `recipient`, filled by the tx's invoke-phase action.
    createOpenNote: (recipientAddr: string, recipientPublicKey: string, token: string,
        index: number, random: string): ClientAction =>
        new CairoCustomEnum({
            CreateOpenNote: {
                recipient_addr: recipientAddr, recipient_public_key: recipientPublicKey,
                token, index, random,
            },
        }),
    // Runs `privacy_compute(identity_key, dapp, nonce)` then feeds its result +
    // invoke_additional_data to the anonymizer's privacy_invoke_with_computation.
    computeAndInvoke: (dappName: string, nonce: bigint, invokeAdditionalData: string[]): ClientAction =>
        new CairoCustomEnum({
            ComputeAndInvoke: {
                contract_address: ANONYMIZER_ADDRESS,
                compute_additional_data: [dappName, num.toHex(nonce)],
                invoke_additional_data: invokeAdditionalData,
            },
        }),
};

// invoke_additional_data = serde(privacy_invoke_with_computation(commitment, calls, open_notes))
// MINUS the leading commitment felt — the pool prepends privacy_compute's result. Encoding done
// with the anonymizer ABI so OpenNote.collect_policy (CollectPolicy enum) is included.
function buildInvokeAdditionalData(calls: Call[], openNotes: { note_id: string; token: string }[]): string[] {
    const anonymizerCalls = calls.map((c) => ({
        to: c.contractAddress,
        selector: hash.getSelectorFromName(c.entrypoint),
        calldata: CallData.compile(c.calldata ?? []),
    }));
    const notes = openNotes.map((n) => ({
        note_id: n.note_id, token: n.token, collect_policy: collectPolicyAll(),
    }));
    return new CallData(anonymizerAbi)
        .compile("privacy_invoke_with_computation", [0n, anonymizerCalls, notes])
        .slice(1);
}

function buildCompileActionsCall(userAddr: string, vk: string, actions: ClientAction[]): Call {
    return pool.populate("compile_actions", {
        user_addr: userAddr, user_private_key: vk, client_actions: actions,
    });
}

// ================== virtual tx + proof + submission (identical pipeline to script 5) ==================
const VIRTUAL_RESOURCE_BOUNDS = {
    l1_gas: { max_amount: 0x100000n, max_price_per_unit: 0n },
    l2_gas: { max_amount: 2_000_000_000n, max_price_per_unit: 0n },
    l1_data_gas: { max_amount: 0x100000n, max_price_per_unit: 0n },
};

async function buildVirtualTx(actions: ClientAction[], userAddr: string, userPrivKey: string, vk: string): Promise<INVOKE_TXN_V3> {
    const virtualAccount = new Account({ provider: myProvider, address: poolAddress, signer: userPrivKey });
    const call: Call = buildCompileActionsCall(userAddr, vk, actions);
    return virtualAccount.getSignedTransaction(call, { resourceBounds: VIRTUAL_RESOURCE_BOUNDS, tip: 0n });
}

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

// The sweep tx carries NO Deposit → screening MUST be None (UNEXPECTED_SCREENING otherwise).
async function proveAndApply(name: string, actions: ClientAction[], userAccount: Account, vk: string): Promise<string> {
    console.log(`\n===== ${name} =====`);
    const currentBlock = await myProvider.getBlockNumber();
    const virtualTx = await buildVirtualTx(actions, userAccount.address, USER_PRIVATE_KEY, vk);
    console.log(`Virtual tx built (base block ${currentBlock}). Proving (~40-50 s)...`);
    const proofRes = await requestProof(currentBlock, virtualTx);
    const serverActions = decodeServerActions(proofRes.l2ToL1Messages![0].payload);
    console.log(`Proof OK. ${serverActions.length} server action(s). Submitting apply_actions (no screening)...`);
    const applyCall = pool.populate("apply_actions", {
        actions: serverActions,
        screening: new CairoOption<object>(CairoOptionVariant.None),
    });
    const { transaction_hash } = await userAccount.execute(applyCall,
        { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
    console.log("apply_actions tx:", transaction_hash);
    await myProvider.waitForTransaction(transaction_hash);
    console.log(`${name} DONE ✅`);
    return transaction_hash;
}

// ================== on-chain state discovery (identical to script 5) ==================
type Strk20State = {
    registeredKey: bigint;
    channelOpen: boolean;
    subchannelOpen: boolean;
    notes: { index: number; amount: bigint; spent: boolean }[];
    nextNoteIndex: number;
};

function shieldedBalance(state: Strk20State): bigint {
    return state.notes.filter((n) => !n.spent).reduce((acc, n) => acc + n.amount, 0n);
}

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
        if (packed === 0n) break;
        const { amount } = decryptNote(packed, channelKey, STRK_ADDRESS, i);
        const spent = Boolean(await pool.nullifier_exists(
            computeNullifier(channelKey, STRK_ADDRESS, i, vk)));
        notes.push({ index: i, amount, spent });
    }
    if (i === MAX_NOTE_SCAN) throw new Error(`Note scan cap reached (${MAX_NOTE_SCAN}).`);
    return { registeredKey, channelOpen, subchannelOpen, notes, nextNoteIndex: i };
}

// ERC-20 helpers (public balances of the sub-account / user).
let strk: Contract;
async function strkBalance(addr: string): Promise<bigint> {
    return BigInt(await strk.balance_of(addr));
}

async function main() {
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    if (await myProvider.getChainId() !== constants.StarknetChainId.SN_SEPOLIA) {
        throw new Error("This script targets SEPOLIA only.");
    }
    console.log("Provider connected to Starknet Sepolia Testnet.");

    const serverUp = await checkProofServer();
    if (!serverUp && !CHECK_ONLY) {
        throw new Error(`Proof server not reachable at ${PROOF_SERVER_URL}. Launch secure-voty first.`);
    }
    console.log("Proof server:", serverUp ? "UP ✅" : "DOWN ⚠️ (tolerated in CHECK_ONLY)");

    // --- pool class + deterministic address (must match script 5) ---
    const poolClass = await myProvider.getClassByHash(POOL_CLASS_HASH);
    const abi = poolClass.abi as Abi;
    const constructorCalldata: Calldata = new CallData(abi).compile("constructor", {
        governance_admin: POOL_GOVERNANCE_ADMIN,
        auditor_public_key: derivePublicKey(AUDITOR_PRIVATE_KEY),
        screener_public_key: derivePublicKey(SCREENER_PRIVATE_KEY),
        proof_validity_blocks: PROOF_VALIDITY_BLOCKS,
    });
    poolAddress = hash.calculateContractAddressFromHash(POOL_DEPLOY_SALT, POOL_CLASS_HASH, constructorCalldata, 0);
    pool = new Contract({ abi, address: poolAddress, providerOrAccount: myProvider });
    try {
        const onchain = num.toHex(await myProvider.getClassHashAt(poolAddress));
        if (BigInt(onchain) !== BigInt(POOL_CLASS_HASH)) throw new Error("wrong class");
    } catch {
        throw new Error(`Pool not deployed at ${poolAddress}. Run 4.init.strk20DeployPool.ts first.`);
    }
    console.log(`Pool address (deterministic): ${poolAddress} ✅`);

    // --- anonymizer: load ABI, check it is deployed and bound to OUR pool ---
    anonymizerAbi = json.parse(fs.readFileSync(ANONYMIZER_ARTIFACT).toString("ascii")).abi as Abi;
    let anonClassHash: string;
    try {
        anonClassHash = num.toHex(await myProvider.getClassHashAt(ANONYMIZER_ADDRESS));
    } catch {
        throw new Error(`Anonymizer not deployed at ${ANONYMIZER_ADDRESS}.`);
    }
    const anonymizer = new Contract({ abi: anonymizerAbi, address: ANONYMIZER_ADDRESS, providerOrAccount: myProvider });
    const boundPool: bigint = BigInt(await anonymizer.get_privacy_contract());
    if (boundPool !== BigInt(poolAddress)) {
        throw new Error(`Anonymizer is bound to pool ${num.toHex(boundPool)}, not ours (${poolAddress}).`);
    }
    console.log(`Anonymizer ${ANONYMIZER_ADDRESS} deployed (class ${anonClassHash}), bound to our pool ✅`);

    // --- derive user keys, locate the DAPP-"test" sub-account #0 ---
    const vk = deriveViewingKey(USER_PRIVATE_KEY);
    const vkPub = derivePublicKey(vk);
    const channelKey = computeChannelKey(USER_ADDRESS, vk, vkPub);
    const partial = partialCommitment(USER_ADDRESS, vk);
    // Deterministic address of sub-account #0 (deployed lazily on first sweep).
    const [info] = await anonymizer.get_sub_accounts(partial, SUBACCOUNT_NONCE, SUBACCOUNT_NONCE + 1n);
    const subAccountAddress = num.toHex(info.address);
    console.log(`\nDAPP "${DAPP_NAME}" sub-account #${SUBACCOUNT_NONCE}: ${subAccountAddress}` +
        ` (deployed: ${info.is_deployed})`);

    // --- state BEFORE ---
    const state = await discoverState(vk, vkPub, channelKey);
    if (state.registeredKey === 0n) {
        throw new Error("account0 is NOT registered in the pool. Run 5.strk20ShieldUnshield.ts first.");
    }
    if (!state.subchannelOpen) {
        throw new Error("account0 has no STRK subchannel. Run 5.strk20ShieldUnshield.ts first.");
    }
    const shieldedBefore = shieldedBalance(state);
    strk = new Contract({ abi: (await myProvider.getClassAt(STRK_ADDRESS)).abi, address: STRK_ADDRESS, providerOrAccount: myProvider });
    const subBalBefore = await strkBalance(subAccountAddress);
    console.log("\n--- BEFORE ---");
    console.log(`account0 shielded STRK balance : ${formatBalance(shieldedBefore, 18)}`);
    console.log(`sub-account public STRK balance: ${formatBalance(subBalBefore, 18)}`);

    // --- plan ---
    const openIndex = state.nextNoteIndex;
    console.log("\n--- Plan ---");
    console.log(` 1. public transfer ${formatBalance(AMOUNT, 18)} STRK: account0 → sub-account`);
    console.log(` 2. sweep (1 proof, NO screening): CreateOpenNote #${openIndex} + ComputeAndInvoke(collect All)`);
    console.log(`    → account0 shielded balance grows by the sub-account's whole STRK balance`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent.");
        return;
    }
    const userAccount = new Account({ provider: myProvider, address: USER_ADDRESS, signer: USER_PRIVATE_KEY });
    await displayBalances(userAccount.address, myProvider);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\nProceed on SEPOLIA (testnet funds)? [y/N] `);
    rl.close();
    if (answer.trim().toLowerCase() !== "y") { console.log("Aborted."); return; }



    // --- step 1: public ERC-20 transfer to the (not-yet-deployed) sub-account ---
    console.log("\n===== 1/2 public transfer to sub-account =====");
    const strkUser = new Contract({ abi: strk.abi, address: STRK_ADDRESS, providerOrAccount: userAccount });
    const t = await strkUser.transfer(subAccountAddress, cairo.uint256(AMOUNT));
    console.log("transfer tx:", t.transaction_hash);
    await myProvider.waitForTransaction(t.transaction_hash);
    const subBal = await strkBalance(subAccountAddress);
    console.log(`sub-account public STRK balance now: ${formatBalance(subBal, 18)} ✅`);

    // --- step 2: the sweep, in ONE proof (no Deposit, no screening) ---
    // A harmless call executed AS the sub-account (satisfies the "≥ 1 call" rule); its
    // return value is ignored. collect_policy = All → grab the sub-account's whole STRK.
    const harmlessCall: Call = {
        contractAddress: STRK_ADDRESS,
        entrypoint: "balance_of",
        calldata: [subAccountAddress],
    };
    const openNoteId = computeNoteId(channelKey, STRK_ADDRESS, openIndex);
    const invokeAdditionalData = buildInvokeAdditionalData(
        [harmlessCall], [{ note_id: openNoteId, token: STRK_ADDRESS }]);
    const sweepActions: ClientAction[] = [
        action.createOpenNote(USER_ADDRESS, vkPub, STRK_ADDRESS, openIndex, randomFelt()), // phase 5
        action.computeAndInvoke(dappNameFelt(), SUBACCOUNT_NONCE, invokeAdditionalData),    // phase 7
    ];
    await proveAndApply(`2/2 SWEEP sub-account → shielded (open note #${openIndex})`,
        sweepActions, userAccount, vk);

    // --- state AFTER ---
    const finalState = await discoverState(vk, vkPub, channelKey);
    const shieldedAfter = shieldedBalance(finalState);
    const subBalAfter = await strkBalance(subAccountAddress);
    console.log("\n--- AFTER ---");
    for (const n of finalState.notes) {
        console.log(`note #${n.index}: ${formatBalance(n.amount, 18)} STRK ${n.spent ? "(spent)" : "(unspent)"}`);
    }
    console.log(`account0 shielded STRK balance : ${formatBalance(shieldedAfter, 18)}` +
        `  (was ${formatBalance(shieldedBefore, 18)}, +${formatBalance(shieldedAfter - shieldedBefore, 18)})`);
    console.log(`sub-account public STRK balance: ${formatBalance(subBalAfter, 18)}`);
    console.log("\nSwept sub-account funds into the shielded balance WITHOUT any Deposit / AML screening 🎉");
    await displayBalances(userAccount.address, myProvider);

}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
