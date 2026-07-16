// STRK20 UNSHIELD only, WITHOUT a wallet — SEPOLIA, on our self-deployed pool.
// Companion of 5.strk20ShieldUnshield.ts / 6.strk20Shield.ts (same pool, same keys
// derivation). Discovers ALL the notes owned by USER — its own shielded notes AND the
// notes RECEIVED from other users (script 8) — then withdraws STRK back to the public
// balance:
//   UNSHIELD_AMOUNT = "ALL"     -> spends ALL unspent notes, withdraws the total.
//   UNSHIELD_AMOUNT = <bigint>  -> spends just enough notes (oldest first) and creates
//                                  an encrypted CHANGE note for the surplus.
// Discovery reproduces the real wallet flow, from the account key ONLY:
//   1. `get_num_of_channels(user)` / `get_channel_info(user, i)` — the on-chain list of
//      incoming channels (the self channel of scripts 5/6 is in the list too).
//   2. ECDH decryption with the viewing key: R recovered from `ephemeral_pubkey` (x only
//      — either parity gives the same shared x), S = vk * R, then
//      channel_key = enc_channel_key - h(ENC_CHANNEL_KEY_TAG, S.x)   (mod PRIME)
//      sender     = enc_sender_addr - h(ENC_SENDER_ADDR_TAG, S.x)    (mod PRIME)
//   3. STRK note scan per channel + spent status (USER owns these notes' nullifiers).
// Everything in ONE tx / one proof: UseNote×n (phase 4) -> CreateEncNote change (phase 5)
// -> Withdraw (phase 6). No Deposit => no screening attestation needed.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run 4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/7.strk20Unshield.ts
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
import { displayBalances } from "../../utils/displayBalances";
import { accountETHoz17snip9Address, accountETHoz17snip9PrivateKey, accountOZSepoliaAddress, accountOZSepoliaPrivateKey, accountSTRKoz20snip9Address, accountSTRKoz20snip9PrivateKey } from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account acting as STRK20 user for THIS run (fill before execution).
// It pays the Sepolia gas. Must be the account whose notes were shielded/received (same
// keys as in scripts 5/6 — the viewing key is derived from the private key).
const USER_ADDRESS = accountETHoz17snip9Address;
const USER_PRIVATE_KEY = accountETHoz17snip9PrivateKey;     // its stark private key (standard SRC-6 account: OZ/Ready)
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
// "ALL" -> unshield the whole shielded balance (all unspent notes, no change note).
// Or a bigint amount in fri (e.g. 5n * 10n ** 17n = 0.5 STRK) -> spends just enough
// notes and creates a change note for the surplus.
const UNSHIELD_AMOUNT: bigint | "ALL" = "ALL";
const PROOF_SERVER_URL = "http://localhost:3030";
const MAX_NOTE_SCAN = 100;             // safety cap for the on-chain note index scan
// true  : read-only — checks env/pool/state, displays the plan, sends NOTHING.
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
// All hashes mirror packages/privacy/src (hashes.cairo / utils.cairo) exactly.
// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const poseidon = (vals: BigNumberish[]) => hash.computePoseidonHashOnElements(vals);
const CURVE_ORDER = BigInt(ec.starkCurve.CURVE.n);
const HALF_ORDER = CURVE_ORDER / 2n;
const TWO_POW_128 = 2n ** 128n;
const TWO_POW_120 = 2n ** 120n;
const PRIME = 2n ** 251n + 17n * 2n ** 192n + 1n;    // Stark felt252 prime
const mod = (a: bigint) => ((a % PRIME) + PRIME) % PRIME;
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
function computeNoteId(channelKey: string, token: string, index: number): string {
    return poseidon([TAG("NOTE_ID_TAG:V1"), channelKey, token, index, 0]);
}
function computeNullifier(channelKey: string, token: string, index: number, vk: string): string {
    return poseidon([TAG("NULLIFIER_TAG:V1"), channelKey, token, index, 0, vk]);
}
// Note.packed_value = (salt, enc_amount) packed in a felt (objects.cairo).
// Encrypted note: amount = (enc - h(ENC_AMOUNT_TAG,...)) mod 2^128.
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

// ---- recipient-side ECDH decryption (utils.cairo encrypt_channel_info, reversed) ----
// R is recovered from its x-coordinate only. The parity of the recovered point does not
// matter: S = vk * (±R) = ±(vk * R), and only S.x is used as shared secret material.
// Validated (2026-07-12) against the real on-chain EncChannelInfo of the script-8 transfer.
function sharedXFromEphemeral(ephemeralPubX: bigint, vk: string): string {
    const R = ec.starkCurve.ProjectivePoint.fromHex(
        "02" + ephemeralPubX.toString(16).padStart(64, "0"));
    const S = R.multiply(BigInt(vk));
    return num.toHex(S.toAffine().x);
}
// EncChannelInfo { ephemeral_pubkey, enc_channel_key, enc_sender_addr } — objects.cairo.
function decryptChannelInfo(
    info: { ephemeral_pubkey: BigNumberish; enc_channel_key: BigNumberish; enc_sender_addr: BigNumberish },
    vk: string): { channelKey: string; senderAddr: string } {
    const sharedX = sharedXFromEphemeral(BigInt(info.ephemeral_pubkey), vk);
    const channelKey = mod(BigInt(info.enc_channel_key)
        - BigInt(poseidon([TAG("ENC_CHANNEL_KEY_TAG:V1"), sharedX])));
    const senderAddr = mod(BigInt(info.enc_sender_addr)
        - BigInt(poseidon([TAG("ENC_SENDER_ADDR_TAG:V1"), sharedX])));
    return { channelKey: num.toHex(channelKey), senderAddr: num.toHex(senderAddr) };
}

// Offline self-checks, run at startup (cheap; catches API/regression issues early).
function cryptoSelfChecks(): void {
    const vk = deriveViewingKey("0x1234");
    if (BigInt(vk) >= HALF_ORDER || BigInt(vk) === 0n) throw new Error("selfcheck: vk not canonical");
    if (vk !== deriveViewingKey("0x1234")) throw new Error("selfcheck: vk not deterministic");
    const pub = derivePublicKey(vk);
    if (BigInt(pub) === 0n) throw new Error("selfcheck: zero public key");
    // encrypt/decrypt round-trip on a synthetic note
    const ck = "0x777";
    const salt = randomNoteSalt();
    const amount = 123456789n;
    const h = BigInt(poseidon([TAG("ENC_AMOUNT_TAG:V1"), ck, STRK_ADDRESS, 0, 0, num.toHex(salt)]));
    const packed = (salt << 128n) + ((h + amount) % TWO_POW_128);
    const dec = decryptNote(packed, ck, STRK_ADDRESS, 0);
    if (dec.amount !== amount || dec.salt !== salt) throw new Error("selfcheck: note round-trip failed");
    // ECDH channel-info round-trip: encrypt like the contract, decrypt like this script.
    const r = "0xabcdef";                                    // sender's ephemeral scalar
    const Rx = BigInt(ec.starkCurve.getStarkKey(r));         // (rG).x
    const K = ec.starkCurve.ProjectivePoint.fromHex("02" + BigInt(pub).toString(16).padStart(64, "0"));
    const sharedSender = num.toHex(K.multiply(BigInt(r)).toAffine().x); // (rK).x
    const encInfo = {
        ephemeral_pubkey: Rx,
        enc_channel_key: mod(BigInt(poseidon([TAG("ENC_CHANNEL_KEY_TAG:V1"), sharedSender])) + 0x777n),
        enc_sender_addr: mod(BigInt(poseidon([TAG("ENC_SENDER_ADDR_TAG:V1"), sharedSender])) + 0xaaan),
    };
    const decCh = decryptChannelInfo(encInfo, vk);
    if (BigInt(decCh.channelKey) !== 0x777n || BigInt(decCh.senderAddr) !== 0xaaan) {
        throw new Error("selfcheck: ECDH channel-info round-trip failed");
    }
    console.log("Crypto self-checks OK ✅ (incl. ECDH channel-info round-trip)");
}

// ================== ClientAction builders — ABI-encoded by starknet.js ==================
// Encoding is done by Contract.populate() against the pool class ABI (fetched in main),
// per the starknet.js guide (interact): populate() for complex params. Variant and field
// names were verified against the deployed Mainnet pool ABI (same class, 2026-07-11).
type ClientAction = CairoCustomEnum;

const action = {
    setViewingKey: (random: string): ClientAction =>
        new CairoCustomEnum({ SetViewingKey: { random } }),
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

// Only the pool fee (collect_fee: STRK transfer_from the submitter) may need an
// allowance here — no Deposit in an unshield. OUR pool has fee = 0, so this is
// normally a no-op, kept for completeness.
async function ensureAllowance(userAccount: Account, needed: bigint): Promise<void> {
    if (needed === 0n) return;
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

// ================== on-chain state discovery (read-only, wallet-like) ==================
type NoteInfo = { index: number; amount: bigint; spent: boolean };
type ChannelState = {
    channelKey: string;
    senderAddr: string;   // ECDH-decrypted; == USER_ADDRESS for the self channel
    isSelf: boolean;
    notes: NoteInfo[];    // STRK notes of this channel, in index order
};

// Scan the STRK notes of one channel. USER owns these notes (it is the channel's
// recipient) => spent status is computable from its own vk (nullifier).
async function scanStrkNotes(channelKey: string, vk: string): Promise<NoteInfo[]> {
    const notes: NoteInfo[] = [];
    for (let i = 0; i < MAX_NOTE_SCAN; i++) {
        const note = await pool.get_note(computeNoteId(channelKey, STRK_ADDRESS, i));
        const packed = BigInt(note.packed_value);
        if (packed === 0n) return notes; // first free index found — stop
        const { amount } = decryptNote(packed, channelKey, STRK_ADDRESS, i);
        const spent = Boolean(await pool.nullifier_exists(
            computeNullifier(channelKey, STRK_ADDRESS, i, vk)));
        notes.push({ index: i, amount, spent });
    }
    throw new Error(`Note scan cap reached (${MAX_NOTE_SCAN}).`);
}

// Discovers ALL the channels where USER is the recipient — its own self channel
// (opened by scripts 5/6) AND the channels opened by other senders (script 8) —
// from the on-chain incoming list + ECDH decryption. Real wallet discovery flow.
async function discoverChannels(vk: string): Promise<ChannelState[]> {
    const nChannels = Number(await pool.get_num_of_channels(USER_ADDRESS));
    const channels: ChannelState[] = [];
    for (let i = 0; i < nChannels; i++) {
        const rawInfo = await pool.get_channel_info(USER_ADDRESS, i);
        const { channelKey, senderAddr } = decryptChannelInfo(rawInfo, vk);
        channels.push({
            channelKey, senderAddr,
            isSelf: BigInt(senderAddr) === BigInt(USER_ADDRESS),
            notes: await scanStrkNotes(channelKey, vk),
        });
    }
    return channels;
}

// Shielded balance = sum of the unspent notes of all channels
// (what wallet_strk20Balances would report).
function shieldedBalance(channels: ChannelState[]): bigint {
    return channels.flatMap((c) => c.notes)
        .filter((n) => !n.spent).reduce((acc, n) => acc + n.amount, 0n);
}

function displayChannels(channels: ChannelState[]): void {
    for (const [i, ch] of channels.entries()) {
        console.log(`channel #${i} from ${ch.isSelf ? "self" : ch.senderAddr}:` +
            `${ch.notes.length ? "" : " (no STRK note)"}`);
        for (const n of ch.notes) {
            console.log(`  note #${n.index}: ${formatBalance(n.amount, 18)} STRK ${n.spent ? "(spent)" : "(unspent)"}`);
        }
    }
    console.log(`Shielded balance (all channels): ${formatBalance(shieldedBalance(channels), 18)} STRK`);
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

    // The pool must already exist (deployed by 4.init.strk20DeployPool.ts) — nothing to
    // unshield otherwise.
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

    // ---------- derive user keys & discover on-chain state ----------
    const vk = deriveViewingKey(USER_PRIVATE_KEY);
    const vkPub = derivePublicKey(vk);
    feeAmount = BigInt(await pool.get_fee_amount());

    const registeredKey: bigint = BigInt(await pool.get_public_key(USER_ADDRESS));
    if (registeredKey === 0n) {
        throw new Error("This account is not registered in the pool — nothing to unshield. " +
            "Shield first with 6.strk20Shield.ts.");
    }
    if (registeredKey !== BigInt(vkPub)) {
        throw new Error("This account is registered in the pool with a DIFFERENT viewing key. " +
            "This script cannot manage its notes. Use the account used in scripts 5/6.");
    }
    const channels = await discoverChannels(vk);
    console.log(`\n--- STRK20 channels of ${USER_ADDRESS} (${channels.length}) ---`);
    displayChannels(channels);
    const balance = shieldedBalance(channels);

    // ---------- note selection (across ALL channels, oldest channel/note first) ----------
    const unspent: { channelKey: string; fromSelf: boolean; note: NoteInfo }[] = channels
        .flatMap((c) => c.notes.filter((n) => !n.spent)
            .map((n) => ({ channelKey: c.channelKey, fromSelf: c.isSelf, note: n })));
    if (unspent.length === 0) {
        console.log("\nNo unspent note — nothing to unshield. ✅");
        return;
    }
    const target: bigint = UNSHIELD_AMOUNT === "ALL" ? balance : UNSHIELD_AMOUNT;
    if (target <= 0n) throw new Error("UNSHIELD_AMOUNT must be > 0.");
    if (target > balance) {
        throw new Error(`Insufficient shielded balance: ${formatBalance(balance, 18)} STRK ` +
            `< requested ${formatBalance(target, 18)} STRK.`);
    }
    const toSpend: typeof unspent = [];
    let spendTotal = 0n;
    for (const u of unspent) {
        toSpend.push(u);
        spendTotal += u.note.amount;
        if (spendTotal >= target) break;
    }
    const change = spendTotal - target;
    // The change note goes to the SELF channel (next free note index there).
    const selfChannel = channels.find((c) => c.isSelf);
    if (change > 0n && selfChannel === undefined) {
        throw new Error("Change needed but no self channel found (open it with script 5 or 6), " +
            "or unshield \"ALL\" / an exact notes total.");
    }

    // One tx, fixed phase order: UseNote×n (phase 4) -> change CreateEncNote (phase 5)
    // -> Withdraw (phase 6). UseNote gives the mandatory replay protection (WriteOnce).
    const actions: ClientAction[] = toSpend.map((u) =>
        action.useNote(u.channelKey, STRK_ADDRESS, u.note.index));
    if (change > 0n) {
        actions.push(action.createEncNote(
            USER_ADDRESS, vkPub, STRK_ADDRESS, change, selfChannel!.notes.length, randomNoteSalt()));
    }
    actions.push(action.withdraw(USER_ADDRESS, STRK_ADDRESS, target, randomFelt()));

    // ---------- plan & confirmation ----------
    console.log("\n--- Plan (single tx) ---");
    for (const u of toSpend) {
        console.log(` • UseNote #${u.note.index} (${formatBalance(u.note.amount, 18)} STRK)` +
            ` from ${u.fromSelf ? "self channel" : "channel " + u.channelKey.slice(0, 12) + "…"}`);
    }
    if (change > 0n) console.log(` • Change note #${selfChannel!.notes.length}: ${formatBalance(change, 18)} STRK (stays shielded, self channel)`);
    console.log(` • Withdraw ${formatBalance(target, 18)} STRK -> ${USER_ADDRESS}`);
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK (+ Sepolia gas of 1 apply_actions tx)`);

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
    await ensureAllowance(userAccount, feeAmount);
    await proveAndApply(
        `UNSHIELD ${formatBalance(target, 18)} STRK (${toSpend.length} note(s)` +
        `${change > 0n ? " + change" : ""})`,
        actions, userAccount, vk);

    // ---------- final report ----------
    const finalChannels = await discoverChannels(vk);
    console.log("\n--- Final state ---");
    displayChannels(finalChannels);
    await displayBalances(userAccount.address, myProvider);
    console.log("Unshield completed 🎉");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
