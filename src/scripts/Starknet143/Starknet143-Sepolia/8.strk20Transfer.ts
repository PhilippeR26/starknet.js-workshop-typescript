// STRK20 shielded TRANSFER, WITHOUT a wallet — SEPOLIA, on our self-deployed pool.
// Companion of scripts 5/6/7 (same pool, same keys derivation). Transfers
// TRANSFER_AMOUNT STRK privately inside the pool, from the SENDER's notes to a new
// encrypted note owned by the RECIPIENT — all in ONE tx / one proof, phase order:
//   OpenChannel sender->recipient  (phase 1, only the first time)
//   OpenSubchannel STRK            (phase 2, only the first time)
//   UseNote×n (sender's notes)     (phase 4)
//   CreateEncNote -> recipient     (phase 5)  [+ CreateEncNote change -> sender]
// No Deposit => no screening attestation.
// The sender's notes are discovered across ALL its channels (incoming list + ECDH
// decryption, like script 7): its own shielded notes AND the STRK received from third
// parties are both spendable.
//
// ⚠️ PREREQUISITE: the pool must already be deployed — run 4.init.strk20DeployPool.ts
//    first (once). This script checks it and STOPS if the pool is missing.
//
// ⚠️ The RECIPIENT must already be REGISTERED in the pool (SetViewingKey), otherwise
//    compile_actions panics RECIPIENT_NOT_REGISTERED. Register it first with
//    4.strk20Register.ts. Registration is all a recipient needs to receive (and even
//    to later spend the received note — the sender opens the channel/subchannel).
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/8.strk20Transfer.ts
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
import {
    accountETHoz17snip9Address,
    accountETHoz17snip9PrivateKey,
    accountOZ2SepoliaAddress,
    accountOZ2SepoliaPrivateKey,
    accountOZSepoliaAddress, accountOZSepoliaPrivateKey, accountSTRKoz20snip9Address,
} from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// SENDER: the SEPOLIA account whose shielded notes are spent. It pays the Sepolia gas.
const USER_ADDRESS = accountOZ2SepoliaAddress;
const USER_PRIVATE_KEY = accountOZ2SepoliaPrivateKey;     // its stark private key (standard SRC-6 account: OZ/Ready)
// RECIPIENT: only its ADDRESS is needed (its registered public viewing key is read
// on-chain). Must be registered in the pool — see 4.strk20Register.ts.
const RECIPIENT_ADDRESS = accountSTRKoz20snip9Address;
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
const TRANSFER_AMOUNT = 10n ** 18n;    // 1 STRK (18 decimals), u128, transferred shielded
const PROOF_SERVER_URL = "http://localhost:3030";
const MAX_NOTE_SCAN = 100;             // safety cap for the on-chain index scans
// true  : read-only — checks env/pool/state, displays the plan, sends NOTHING.
// false : REALLY executes on Sepolia (proof + apply_actions tx).
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
        && !RECIPIENT_ADDRESS.includes("FILL") && !POOL_GOVERNANCE_ADMIN.includes("FILL");
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
// General sender->recipient forms (hashes.cairo). Scripts 4/5/6 use the self->self case.
function computeChannelKey(senderAddr: string, senderVk: string,
    recipientAddr: string, recipientPubKey: string): string {
    return poseidon([TAG("CHANNEL_KEY_TAG:V1"), senderAddr, senderVk, recipientAddr, recipientPubKey]);
}
function computeChannelMarker(channelKey: string, senderAddr: string,
    recipientAddr: string, recipientPubKey: string): string {
    return poseidon([TAG("CHANNEL_MARKER_TAG:V1"), channelKey, senderAddr, recipientAddr, recipientPubKey]);
}
function computeSubchannelMarker(channelKey: string, recipientAddr: string,
    recipientPubKey: string, token: string): string {
    return poseidon([TAG("SUBCHANNEL_MARKER_TAG:V1"), channelKey, recipientAddr, recipientPubKey, token]);
}
// outgoing_channel_id = h(TAG, sender_addr, sender_private_key, index, 0) — hashes.cairo.
function computeOutgoingChannelId(senderAddr: string, senderVk: string, index: number): string {
    return poseidon([TAG("OUTGOING_CHANNEL_ID_TAG:V1"), senderAddr, senderVk, index, 0]);
}
// subchannel_id = h(TAG, channel_key, index, 0) — hashes.cairo.
function computeSubchannelId(channelKey: string, index: number): string {
    return poseidon([TAG("SUBCHANNEL_ID_TAG:V1"), channelKey, index, 0]);
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
// Validated (2026-07-12) against a real on-chain EncChannelInfo of a script-8 transfer.
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
    const ck = computeChannelKey("0xabc", vk, "0xabc", pub);
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
// allowance here — no Deposit in a transfer. OUR pool has fee = 0, so this is
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
    const { transaction_hash } = await userAccount.execute(applyCall,
        { proof: proofRes.proof, proofFacts: proofRes.proofFacts });
    console.log("apply_actions tx:", transaction_hash);
    await myProvider.waitForTransaction(transaction_hash);
    console.log(`${name} DONE ✅`);
    return transaction_hash;
}

// ================== on-chain state discovery (read-only) ==================
type NoteInfo = { index: number; amount: bigint; spent: boolean };

// Scan the notes of a channel (any channel key). Spent status needs the OWNER's vk;
// pass undefined when unknown (e.g. sender looking at the recipient's channel).
async function scanNotes(channelKey: string, ownerVk?: string): Promise<NoteInfo[]> {
    const notes: NoteInfo[] = [];
    let i = 0;
    for (; i < MAX_NOTE_SCAN; i++) {
        const note = await pool.get_note(computeNoteId(channelKey, STRK_ADDRESS, i));
        const packed = BigInt(note.packed_value);
        if (packed === 0n) break; // first free index found — stop (scan cost = nb notes + 1)
        const { amount } = decryptNote(packed, channelKey, STRK_ADDRESS, i);
        const spent = ownerVk === undefined ? false : Boolean(await pool.nullifier_exists(
            computeNullifier(channelKey, STRK_ADDRESS, i, ownerVk)));
        notes.push({ index: i, amount, spent });
    }
    if (i === MAX_NOTE_SCAN) throw new Error(`Note scan cap reached (${MAX_NOTE_SCAN}).`);
    return notes;
}

type ChannelState = {
    channelKey: string;
    senderAddr: string;   // ECDH-decrypted; == USER_ADDRESS for the self channel
    isSelf: boolean;
    notes: NoteInfo[];    // STRK notes of this channel, in index order
};
type SpendableNote = { channelKey: string; fromSelf: boolean; note: NoteInfo };

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
            notes: await scanNotes(channelKey, vk),
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

// Next free OUTGOING channel index of the sender (indexes are sequential — privacy.cairo
// INDEX_NOT_SEQUENTIAL). Scans get_outgoing_channel_info until salt == 0.
async function nextOutgoingChannelIndex(senderAddr: string, vk: string): Promise<number> {
    for (let i = 0; i < MAX_NOTE_SCAN; i++) {
        const info = await pool.get_outgoing_channel_info(computeOutgoingChannelId(senderAddr, vk, i));
        if (BigInt(info.salt) === 0n) return i;
    }
    throw new Error(`Outgoing channel scan cap reached (${MAX_NOTE_SCAN}).`);
}

// Next free SUBCHANNEL index within a channel (sequential too).
async function nextSubchannelIndex(channelKey: string): Promise<number> {
    for (let i = 0; i < MAX_NOTE_SCAN; i++) {
        const info = await pool.get_subchannel_info(computeSubchannelId(channelKey, i));
        if (BigInt(info.salt) === 0n) return i;
    }
    throw new Error(`Subchannel scan cap reached (${MAX_NOTE_SCAN}).`);
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
        console.log("\n⚠️ USER / RECIPIENT / POOL_GOVERNANCE_ADMIN not filled " +
            "— stopping after env checks.");
        return;
    }
    if (BigInt(RECIPIENT_ADDRESS) === BigInt(USER_ADDRESS)) {
        throw new Error("RECIPIENT_ADDRESS must differ from USER_ADDRESS (self-transfer is " +
            "pointless: the notes are already yours).");
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

    // ---------- sender keys & state (ALL channels: own notes + received notes) ----------
    const vk = deriveViewingKey(USER_PRIVATE_KEY);
    const vkPub = derivePublicKey(vk);
    feeAmount = BigInt(await pool.get_fee_amount());

    const senderKey: bigint = BigInt(await pool.get_public_key(USER_ADDRESS));
    if (senderKey === 0n) {
        throw new Error("Sender not registered in the pool. Shield first with 6.strk20Shield.ts.");
    }
    if (senderKey !== BigInt(vkPub)) {
        throw new Error("Sender registered with a DIFFERENT viewing key. Use the account of scripts 5/6.");
    }
    const senderChannels = await discoverChannels(vk);
    console.log(`\n--- Sender STRK20 channels: ${USER_ADDRESS} (${senderChannels.length}) ---`);
    displayChannels(senderChannels);
    const unspent: SpendableNote[] = senderChannels
        .flatMap((c) => c.notes.filter((n) => !n.spent)
            .map((n) => ({ channelKey: c.channelKey, fromSelf: c.isSelf, note: n })));
    const balance = shieldedBalance(senderChannels);
    if (balance < TRANSFER_AMOUNT) {
        throw new Error(`Insufficient shielded balance: ${formatBalance(balance, 18)} STRK ` +
            `< ${formatBalance(TRANSFER_AMOUNT, 18)} STRK. Shield first with 6.strk20Shield.ts.`);
    }

    // ---------- recipient checks (must be REGISTERED — compile_actions requirement) ----------
    const recipientPubKey: bigint = BigInt(await pool.get_public_key(RECIPIENT_ADDRESS));
    if (recipientPubKey === 0n) {
        throw new Error(`Recipient ${RECIPIENT_ADDRESS} is NOT registered in the pool ` +
            "(RECIPIENT_NOT_REGISTERED). Register it first with 4.strk20Register.ts.");
    }
    const recipientPub = num.toHex(recipientPubKey);
    console.log("\nRecipient", RECIPIENT_ADDRESS, "is registered ✅");

    // ---------- sender->recipient channel & subchannel discovery ----------
    const transferChannelKey = computeChannelKey(USER_ADDRESS, vk, RECIPIENT_ADDRESS, recipientPub);
    const channelOpen: boolean = Boolean(await pool.channel_exists(
        computeChannelMarker(transferChannelKey, USER_ADDRESS, RECIPIENT_ADDRESS, recipientPub)));
    const subchannelOpen: boolean = Boolean(await pool.subchannel_exists(
        computeSubchannelMarker(transferChannelKey, RECIPIENT_ADDRESS, recipientPub, STRK_ADDRESS)));
    const recipientNotes = await scanNotes(transferChannelKey); // spent status unknown to sender
    console.log(`Channel sender->recipient: ${channelOpen ? "open" : "to open"}` +
        ` | subchannel(STRK): ${subchannelOpen ? "open" : "to open"}` +
        ` | notes already sent: ${recipientNotes.length}`);

    // ---------- build the single-tx action list (fixed phase order) ----------
    const actions: ClientAction[] = [];
    const planLines: string[] = [];
    if (!channelOpen) {
        // Outgoing channel indexes are sequential per sender (self channel was #0).
        const outIndex = await nextOutgoingChannelIndex(USER_ADDRESS, vk);
        actions.push(action.openChannel(RECIPIENT_ADDRESS, outIndex, randomFelt(), randomFelt())); // phase 1
        planLines.push(`OpenChannel -> recipient (outgoing index ${outIndex})`);
    }
    if (!subchannelOpen) {
        const subIndex = channelOpen ? await nextSubchannelIndex(transferChannelKey) : 0;
        actions.push(action.openSubchannel(RECIPIENT_ADDRESS, recipientPub, transferChannelKey,
            subIndex, STRK_ADDRESS, randomFelt()));                                               // phase 2
        planLines.push(`OpenSubchannel STRK (index ${subIndex})`);
    }
    // Spend just enough sender notes (oldest channel/note first) — across ALL channels
    // (own shielded notes AND STRK received from third parties).
    const toSpend: SpendableNote[] = [];
    let spendTotal = 0n;
    for (const u of unspent) {
        toSpend.push(u);
        spendTotal += u.note.amount;
        if (spendTotal >= TRANSFER_AMOUNT) break;
    }
    const change = spendTotal - TRANSFER_AMOUNT;
    // The change note goes to the SELF channel (next free note index there).
    const selfChannel = senderChannels.find((c) => c.isSelf);
    if (change > 0n && selfChannel === undefined) {
        throw new Error("Change needed but no self channel found (open it with script 5 or 6), " +
            "or transfer an exact notes total.");
    }
    for (const u of toSpend) {
        actions.push(action.useNote(u.channelKey, STRK_ADDRESS, u.note.index));                   // phase 4
        planLines.push(`UseNote #${u.note.index} (${formatBalance(u.note.amount, 18)} STRK)` +
            ` from ${u.fromSelf ? "self channel" : "channel " + u.channelKey.slice(0, 12) + "…"}`);
    }
    // The recipient's note: next sequential index in the sender->recipient channel.
    const recipientNoteIndex = recipientNotes.length;
    actions.push(action.createEncNote(RECIPIENT_ADDRESS, recipientPub, STRK_ADDRESS,
        TRANSFER_AMOUNT, recipientNoteIndex, randomNoteSalt()));                                  // phase 5
    planLines.push(`CreateEncNote ${formatBalance(TRANSFER_AMOUNT, 18)} STRK -> recipient (note #${recipientNoteIndex})`);
    if (change > 0n) {
        actions.push(action.createEncNote(USER_ADDRESS, vkPub, STRK_ADDRESS,
            change, selfChannel!.notes.length, randomNoteSalt()));                                // phase 5
        planLines.push(`Change note #${selfChannel!.notes.length}: ${formatBalance(change, 18)} STRK (stays shielded, self channel)`);
    }

    // ---------- plan & confirmation ----------
    console.log("\n--- Plan (single tx) ---");
    for (const l of planLines) console.log(" •", l);
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
        `TRANSFER ${formatBalance(TRANSFER_AMOUNT, 18)} STRK shielded -> ${RECIPIENT_ADDRESS}`,
        actions, userAccount, vk);

    // ---------- final report ----------
    const finalSenderChannels = await discoverChannels(vk);
    console.log("\n--- Sender final state ---");
    displayChannels(finalSenderChannels);
    // The sender knows the channel key, so it can read (not spend) the recipient's notes.
    const finalRecipientNotes = await scanNotes(transferChannelKey);
    console.log("\n--- Notes sent to the recipient (channel sender->recipient) ---");
    for (const n of finalRecipientNotes) {
        console.log(`note #${n.index}: ${formatBalance(n.amount, 18)} STRK (spent status: only the recipient knows)`);
    }
    await displayBalances(userAccount.address, myProvider);
    console.log("Shielded transfer completed 🎉");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
