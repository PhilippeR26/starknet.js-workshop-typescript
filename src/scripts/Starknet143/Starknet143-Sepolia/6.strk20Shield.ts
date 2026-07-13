// STRK20 SHIELD only, WITHOUT a wallet — SEPOLIA, on our self-deployed pool.
// Companion of 5.strk20ShieldUnshield.ts (same pool, same keys derivation): deploys the
// pool if missing, then SHIELDS `AMOUNT` STRK into a new encrypted note. Each run adds one
// note. Any one-time onboarding still needed (registration/channel/subchannel) is BATCHED
// with the deposit into a SINGLE proof (one apply_actions tx), so a first run costs the
// same one proof as any later run. Unshield with 7.strk20Unshield.ts.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/6.strk20Shield.ts
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
    RpcProvider, Account, Contract, ec, num, hash, stark, cairo,
    constants, CairoBytes31, CairoCustomEnum, CairoOption, CairoOptionVariant,
    CallData, type BigNumberish, type Call, type Abi, type Calldata,
} from "starknet";
import type { INVOKE_TXN_V3 } from "@starknet-io/types-js";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { displayBalances } from "../../utils/displayBalances";
import { accountOZ2SepoliaAddress, accountOZ2SepoliaPrivateKey, accountOZSepoliaAddress, accountOZSepoliaPrivateKey, accountSTRKoz20snip9Address, accountSTRKoz20snip9PrivateKey } from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account acting as STRK20 user for THIS run (fill before execution).
// It pays the Sepolia gas. Change it freely between runs: all accounts share the same pool.
const USER_ADDRESS = accountOZ2SepoliaAddress;
const USER_PRIVATE_KEY = accountOZ2SepoliaPrivateKey;     // its stark private key (standard SRC-6 account: OZ/Ready)
// Governance admin of OUR pool (only used at deployment; admin ops are never needed by
// this script). ⚠️ DO NOT CHANGE THIS VALUE. Part of the deterministic pool address
const POOL_GOVERNANCE_ADMIN = "0x04761f1bf6b5f11f6b5beb2fd862a468e4d7666f674ac544e2a502e4d8483747";
// Official STRK20 pool class — already DECLARED on Sepolia (same hash as Mainnet).
// Constructor (verified on-chain 2026-07-12):
//   (governance_admin, auditor_public_key, screener_public_key, proof_validity_blocks)
const POOL_CLASS_HASH = "0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d";
const PROOF_VALIDITY_BLOCKS = 450;     // same as the public instances (~15 min)
// Fixed screener key pair of OUR pool: the canonical devnet screener test key of the
// official repo (sdk/src/testing + fixtures/screening-vectors.json). PUBLIC knowledge —
// fine for a testnet PoC pool, never do this on Mainnet.
const SCREENER_PRIVATE_KEY = "0xCAFEBABE";
// Fixed auditor key pair of OUR pool (compliance escrow — never used by this script,
// kept here only so the escrowed viewing keys stay decryptable if ever needed).
const AUDITOR_PRIVATE_KEY = "0xa0d17042";
const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // same on all networks
const AMOUNT = 10n ** 18n;             // 1 STRK (18 decimals), u128, shielded into a new note
const PROOF_SERVER_URL = "http://localhost:3030";
const MAX_NOTE_SCAN = 100;             // safety cap for the on-chain note index scan
// true  : read-only — checks env/class/pool/state, displays the plan, sends NOTHING.
// false : REALLY executes on Sepolia (pool deployment if needed + proofs + apply_actions txs).
const CHECK_ONLY = false;
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
// All hashes mirror packages/privacy/src (hashes.cairo / utils.cairo) exactly.
// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const poseidon = (vals: BigNumberish[]) => hash.computePoseidonHashOnElements(vals);
const CURVE_ORDER = BigInt(ec.starkCurve.CURVE.n);
const HALF_ORDER = CURVE_ORDER / 2n;
const TWO_POW_128 = 2n ** 128n;
const TWO_POW_120 = 2n ** 120n;
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
// Encrypted note: amount = (enc - h(ENC_AMOUNT_TAG,...)) mod 2^128 (objects.cairo).
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

// ================== deposit screening (self-signed attestation) ==================
// The pool class REQUIRES a screener-signed SNIP-12 attestation on every Deposit
// (privacy.cairo apply_actions -> _verify_screening; a zero screener key does NOT
// bypass it). Since WE deployed the pool with OUR fixed screener public key, this
// script signs the attestation itself. Recipe from packages/privacy/src/snip12.cairo:
//   msg = poseidon('StarkNet Message', domainHash, screener_pub, structHash)
//   domainHash = poseidon(STARKNET_DOMAIN_TYPE_HASH, 'Screening', 2, chain_id, 1)
//   structHash = poseidon(DEPOSITOR_VALIDATION_TYPE_HASH, depositor, issued_at)
// Freshness on-chain: now - 300s <= issued_at <= now + 60s (utils.cairo constants).
const STARKNET_DOMAIN_TYPE_HASH = "0x1ff2f602e42168014d405a94f75e8a93d640751d71d16311266e140d8b0a210";
const DEPOSITOR_VALIDATION_TYPE_HASH = "0x32d43b7372c9ea8a35daf12b02c5f6f74837910ecbaf2a3ecfe71fec901913d";

function screeningMessageHash(depositor: string, issuedAt: number,
    screenerPubKey: string, chainId: string): string {
    const domainHash = poseidon([
        STARKNET_DOMAIN_TYPE_HASH, TAG("Screening"), 2, chainId, 1]);
    const structHash = poseidon([
        DEPOSITOR_VALIDATION_TYPE_HASH, depositor, issuedAt]);
    return poseidon([TAG("StarkNet Message"), domainHash, screenerPubKey, structHash]);
}

// ScreeningAttestation { issued_at: u64, signature: (felt252, felt252) } — ABI-encoded
// later by pool.populate(); cairo.tuple() carries the (r, s) tuple.
function signScreeningAttestation(depositor: string, issuedAt: number,
    chainId: string): { issued_at: number; signature: object } {
    const msgHash = screeningMessageHash(
        depositor, issuedAt, derivePublicKey(SCREENER_PRIVATE_KEY), chainId);
    const sig = ec.starkCurve.sign(msgHash, SCREENER_PRIVATE_KEY);
    return { issued_at: issuedAt, signature: cairo.tuple(num.toHex(sig.r), num.toHex(sig.s)) };
}

// Golden-vector self-check: reproduces fixtures/screening-vectors.json of the official
// starkware-libs/starknet-privacy repo (same screener key 0xCAFEBABE as our pool). The
// signature is RFC6979-deterministic, so r/s must match exactly too.
function screeningSelfChecks(): void {
    const pub = derivePublicKey(SCREENER_PRIVATE_KEY);
    if (BigInt(pub) !== BigInt("0x7f1fff02c3801d82c9b233faefb45f99631c4c85a3325b785884e38ee56ae46")) {
        throw new Error("selfcheck screening: wrong public key derivation");
    }
    const vectors = [
        {
            chainId: "0x54455354", depositor: "0x1234", issuedAt: 1700000000,
            msg: "0x67b37a2ba91ebf69df6da224d2dfd87b8839c2f7143f2e9fc1bfe2fc7fb746",
            r: "0x22ed8b6e747fa2178001e036376d0771d87080ac911888b67227804041ab6da",
            s: "0x11926cad35e3531bd146b6cc8ad8e3795e7011bd1cdc6b8fe2ded0f2038f6fc",
        },
        {
            chainId: constants.StarknetChainId.SN_SEPOLIA,
            depositor: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
            issuedAt: 1716579600,
            msg: "0x7e976ef67d7e9b0ed475a4b2b0296e6a4bd3875c17ed3b6f28a9539c3d87cbc",
            r: "0xab0ca95b821ea0de5720239a51742b5a86273559e99e962581fbb16b6f9d97",
            s: "0x1f09a3c83a48976ab060358eff680d7668e783a657592351b440149b62dcbd5",
        },
    ];
    for (const v of vectors) {
        const msg = screeningMessageHash(v.depositor, v.issuedAt, pub, v.chainId);
        if (BigInt(msg) !== BigInt(v.msg)) throw new Error("selfcheck screening: hash mismatch");
        const sig = ec.starkCurve.sign(msg, SCREENER_PRIVATE_KEY);
        if (sig.r !== BigInt(v.r) || sig.s !== BigInt(v.s)) {
            throw new Error("selfcheck screening: signature mismatch");
        }
    }
    console.log("Screening self-checks OK ✅ (official golden vectors reproduced)");
}

// ================== ClientAction builders — ABI-encoded by starknet.js ==================
// Encoding is done by Contract.populate() against the pool class ABI (fetched in main),
// per the starknet.js guide (interact): populate() for complex params. Variant and field
// names were verified against the deployed Mainnet pool ABI (same class, 2026-07-11).
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

// The pool pulls STRK from the submitter: the Deposit amount via TransferFrom(user)
// (+ the fee via collect_fee, but OUR pool has fee = 0). STRK Contract uses the real
// ABI fetched on-chain; starknet.js encodes the u256 amount from a plain bigint.
async function ensureAllowance(userAccount: Account, needed: bigint): Promise<void> {
    const strkClass = await myProvider.getClassAt(STRK_ADDRESS);
    const strk = new Contract({ abi: strkClass.abi, address: STRK_ADDRESS, providerOrAccount: userAccount });
    const current: bigint = BigInt(await strk.allowance(userAccount.address, poolAddress));
    console.log(`STRK allowance user->pool: ${formatBalance(current, 18)} (needed: ${formatBalance(needed, 18)})`);
    if (current >= needed) return;
    console.log("Sending approve tx...");
    const { transaction_hash } = await strk.approve(poolAddress, needed);
    await myProvider.waitForTransaction(transaction_hash);
    console.log("Approve OK:", transaction_hash);
}

// One full protocol step: build virtual tx -> prove -> decode message -> populate apply_actions
// -> execute with the proof attached. The screening attestation (SHIELD step only) is signed
// AFTER proving, just before submission, to stay within the 300 s on-chain freshness window.
async function proveAndApply(
    name: string, actions: ClientAction[], userAccount: Account, vk: string,
    needsScreening: boolean,
): Promise<string> {
    console.log(`\n===== ${name} =====`);
    const currentBlock = await myProvider.getBlockNumber();
    const virtualTx = await buildVirtualTx(actions, userAccount.address, USER_PRIVATE_KEY, vk);
    console.log(`Virtual tx built (base block ${currentBlock}). Proving (~40-50 s)...`);
    const proofRes = await requestProof(currentBlock, virtualTx);
    const serverActions = decodeServerActions(proofRes.l2ToL1Messages![0].payload);
    console.log(`Proof OK. ${serverActions.length} server action(s). Submitting apply_actions...`);
    // Deposit txs MUST carry a screening attestation (SCREENING_REQUIRED), all the
    // other txs MUST NOT (UNEXPECTED_SCREENING) — privacy.cairo apply_actions.
    let screening = new CairoOption<object>(CairoOptionVariant.None);
    if (needsScreening) {
        const issuedAt = Number((await myProvider.getBlock("latest")).timestamp);
        screening = new CairoOption<object>(CairoOptionVariant.Some,
            signScreeningAttestation(userAccount.address, issuedAt,
                constants.StarknetChainId.SN_SEPOLIA));
        console.log(`Screening attestation self-signed (issued_at = ${issuedAt}).`);
    }
    const applyCall = pool.populate("apply_actions", {
        actions: serverActions,
        screening,
    });
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

// State of a fresh pool / unknown user — used when the pool is not deployed yet.
const EMPTY_STATE: Strk20State = {
    registeredKey: 0n, channelOpen: false, subchannelOpen: false, notes: [], nextNoteIndex: 0,
};

// Shielded balance = sum of the unspent notes (what wallet_strk20Balances would report).
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
    screeningSelfChecks();
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

    // --- pool class check (read-only; the class must be DECLARED on Sepolia) ---
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

    // ---------- deterministic pool address (same for ALL user accounts) ----------
    const constructorCalldata: Calldata = new CallData(abi).compile("constructor", {
        governance_admin: POOL_GOVERNANCE_ADMIN,
        auditor_public_key: derivePublicKey(AUDITOR_PRIVATE_KEY),
        screener_public_key: derivePublicKey(SCREENER_PRIVATE_KEY),
        proof_validity_blocks: PROOF_VALIDITY_BLOCKS,
    });
    // unique:false UDC deployment => address independent of the deployer (deployer felt = 0).
    // Salt and constructor calldata are script constants => same address at every run,
    // whatever the account => deploy once, then always reuse. Nothing stored on disk.
    poolAddress = hash.calculateContractAddressFromHash(
        POOL_DEPLOY_SALT, POOL_CLASS_HASH, constructorCalldata, 0);
    pool = new Contract({ abi, address: poolAddress, providerOrAccount: myProvider });
    serdeSelfChecks(); // needs the pool ABI, hence after pool creation

    let poolDeployed = false;
    try {
        const onchainClassHash = num.toHex(await myProvider.getClassHashAt(poolAddress));
        if (BigInt(onchainClassHash) !== BigInt(POOL_CLASS_HASH)) {
            throw new Error(`Address ${poolAddress} holds a DIFFERENT class (${onchainClassHash}).`);
        }
        poolDeployed = true;
    } catch (e) {
        if (e instanceof Error && e.message.includes("DIFFERENT class")) throw e;
        // contract not found => not deployed yet
    }
    console.log(`\nOur pool address (deterministic): ${poolAddress}`);
    console.log("Pool deployed:", poolDeployed ? "yes ✅" : "not yet (will be deployed)");

    // ---------- derive user keys & discover on-chain state ----------
    const vk = deriveViewingKey(USER_PRIVATE_KEY);
    const vkPub = derivePublicKey(vk);
    const channelKey = computeChannelKey(USER_ADDRESS, vk, vkPub);
    feeAmount = poolDeployed ? BigInt(await pool.get_fee_amount()) : 0n;
    const state = poolDeployed ? await discoverState(vk, vkPub, channelKey) : EMPTY_STATE;

    if (state.registeredKey !== 0n && state.registeredKey !== BigInt(vkPub)) {
        throw new Error("This account is already registered in the pool with a DIFFERENT " +
            "viewing key. This script cannot manage its notes. Use another dedicated account.");
    }
    console.log("\n--- STRK20 state for", USER_ADDRESS, "---");
    console.log("registered:", state.registeredKey !== 0n,
        "| channel:", state.channelOpen, "| subchannel(STRK):", state.subchannelOpen);
    for (const n of state.notes) {
        console.log(`note #${n.index}: ${formatBalance(n.amount, 18)} STRK ${n.spent ? "(spent)" : "(unspent)"}`);
    }
    console.log(`Shielded balance: ${formatBalance(shieldedBalance(state), 18)} STRK`);

    // ---------- build the single-tx action list (skip steps already applied on-chain) ----------
    // Actions of the SAME tx are applied to storage in order during the virtual execution,
    // so the onboarding (register/channel/subchannel) is visible to the deposit that follows.
    // The phase order is ascending — account(0) -> channel(1) -> subchannel(2) -> deposit(3)
    // -> create-notes(5) — so the whole SHIELD path fits in ONE proof (one screening
    // attestation for the deposit), whatever the number of onboarding steps still needed.
    const shieldIndex = state.nextNoteIndex;
    const shieldActions: ClientAction[] = [];
    const shieldSteps: string[] = [];
    if (state.registeredKey === 0n) {
        shieldActions.push(action.setViewingKey(randomFelt()));                           // phase 0
        shieldSteps.push("SetViewingKey");
    }
    if (!state.channelOpen) {
        shieldActions.push(action.openChannel(USER_ADDRESS, 0, randomFelt(), randomFelt())); // phase 1
        shieldSteps.push("OpenChannel");
    }
    if (!state.subchannelOpen) {
        shieldActions.push(action.openSubchannel(USER_ADDRESS, vkPub, channelKey, 0, STRK_ADDRESS, randomFelt())); // phase 2
        shieldSteps.push("OpenSubchannel");
    }
    shieldActions.push(action.deposit(STRK_ADDRESS, AMOUNT));                             // phase 3
    shieldActions.push(action.createEncNote(USER_ADDRESS, vkPub, STRK_ADDRESS, AMOUNT, shieldIndex, randomNoteSalt())); // phase 5
    shieldSteps.push(`SHIELD ${formatBalance(AMOUNT, 18)} STRK (note #${shieldIndex})`);
    const txPlans: { name: string; actions: ClientAction[]; needsScreening: boolean }[] = [{
        name: shieldSteps.join(" + "),
        actions: shieldActions,
        needsScreening: true, // contains a Deposit => self-signed attestation required
    }];

    // ---------- costs & confirmation ----------
    const totalFees = feeAmount * BigInt(txPlans.length);
    console.log("\n--- Plan ---");
    if (!poolDeployed) console.log(" • Deploy our own pool (once; fixed screener/auditor keys, fee = 0)");
    for (const t of txPlans) console.log(" •", t.name);
    console.log(`Pool fees: ${txPlans.length} x ${formatBalance(feeAmount, 18)} = ${formatBalance(totalFees, 18)} STRK` +
        ` (+ Sepolia gas of ${poolDeployed ? "" : "the deployment tx + "}${txPlans.length} apply_actions tx,` +
        ` + ${formatBalance(AMOUNT, 18)} STRK shielded)`);

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
    await displayBalances(userAccount.address, myProvider);

    if (!poolDeployed) {
        console.log("\n===== Deploy pool =====");
        const deployRes = await userAccount.deployContract({
            classHash: POOL_CLASS_HASH,
            constructorCalldata,
            salt: POOL_DEPLOY_SALT,
            unique: false,
        });
        await myProvider.waitForTransaction(deployRes.transaction_hash);
        if (BigInt(deployRes.contract_address) !== BigInt(poolAddress)) {
            throw new Error(`Deployed at ${deployRes.contract_address}, expected ${poolAddress}!`);
        }
        console.log(`Pool deployed at ${poolAddress} ✅ (tx ${deployRes.transaction_hash})`);
    }

    await ensureAllowance(userAccount, AMOUNT + totalFees);
    for (const t of txPlans) {
        await proveAndApply(t.name, t.actions, userAccount, vk, t.needsScreening);
    }

    // ---------- final report ----------
    const finalState = await discoverState(vk, vkPub, channelKey);
    console.log("\n--- Final state ---");
    for (const n of finalState.notes) {
        console.log(`note #${n.index}: ${formatBalance(n.amount, 18)} STRK ${n.spent ? "(spent)" : "(unspent)"}`);
    }
    console.log(`Shielded balance: ${formatBalance(shieldedBalance(finalState), 18)} STRK`);
    await displayBalances(userAccount.address, myProvider);
    console.log("Shield completed 🎉 (unshield with 7.strk20Unshield.ts)");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
