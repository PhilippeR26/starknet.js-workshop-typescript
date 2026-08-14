// Shared utilities for the STRK20-SDK variants of scripts 4/6/7/8 (this folder).
// Same PoC pool as the parent folder — deployed by ../4.init.strk20DeployPool.ts, same
// deterministic address — and the SAME viewing-key derivation tag, so both script
// families see the same registrations, channels and notes.
//
// The official SDK (@starkware-libs/starknet-privacy-sdk) replaces all the protocol
// plumbing the parent scripts implement by hand: Cairo hashes, note encryption/ECDH,
// ClientAction serde, on-chain state discovery, note selection and change notes,
// action phase ordering.
//
// The SDK is NOT an npm dependency of this repo: it is NOT on the public npm registry
// (checked again 2026-08-14 — 404, under every plausible name), only on GitHub Packages
// (auth required), and it is ESM-only (ts-node cannot require it). It is therefore
// vendored here as a self-contained CommonJS bundle + type bundle, built FROM SOURCE —
// which needs no token, since the repo itself is public:
//   strk20sdk.js / strk20sdk.d.ts — starkware-libs/starknet-privacy, tag PRIVACY-0.14.3-RC.5
//   (commit 66e3caa, SDK 0.14.3-rc.5, the release that renamed sub-account → shadow account).
//   `starknet` is kept EXTERNAL: the SDK pins 10.5.0, but this repo's copy is what runs.
// Needs Node >= 24 (ohttp-ts). To regenerate (then delete the clone):
//   git clone --depth 1 --branch PRIVACY-0.14.3-RC.5 \
//       https://github.com/starkware-libs/starknet-privacy.git
//   cd starknet-privacy/sdk && npm install && npm run build
//   # ⚠️ the entry MUST be .ts, not .mjs: it carries an `export type`, which esbuild
//   #    rejects in a .js/.mjs file ("Expected identifier but found \"type\"").
//   echo 'export * from "./dist/index.js";
//         export { ContractDiscoveryProvider } from "./dist/internal/contract-discovery.js";
//         export type { PoolContractInterface } from "./dist/internal/contract-discovery.js";
//         export { PrivacyPoolABI } from "./dist/internal/abi.js";' > bundle-entry.ts
//   npx esbuild bundle-entry.ts --bundle --platform=node --target=node20 --format=cjs \
//       --external:starknet --external:starknet-devnet --outfile=<here>/strk20sdk.js
//   npm i -D --no-save dts-bundle-generator && cp bundle-entry.ts bundle-entry-types.ts \
//       && npx dts-bundle-generator --no-check --external-inlines \
//       "@starknet-io/starknet-types-0101" "ohttp-ts" "zod" -o <here>/strk20sdk.d.ts bundle-entry-types.ts
//
// What this file provides on top of the SDK:
//  - SecureVotyProofProvider: a ProofProviderInterface adapter for the LOCAL secure-voty
//    SNIP-36 proof server (SSE /prove) used instead of the official transaction prover.
//    For deposits it also SELF-SIGNS the SNIP-12 screening attestation with our pool's
//    fixed screener key (the canonical devnet test key), mirroring the SDK's own
//    testing/screening-mock-proving.ts (the official prover would return the signature
//    of a real screener in `additional_data`).
//  - the deterministic pool address computation (identical to ../4.init).
//  - small helpers shared by the 4 scripts (env checks, allowance, submission, display).

import {
    RpcProvider, Account, Contract, ec, num, hash,
    constants, CairoBytes31, CairoCustomEnum, CallData, ETransactionVersion,
    type Abi, type BigNumberish, type Calldata, type Call,
} from "starknet";
import {
    createPrivateTransfers, ContractDiscoveryProvider, PrivacyPoolABI,
    type ExecuteResult, type Proof, type ProofInvocation, type ProofInvocationFactoryDetails,
    type ProofProviderInterface, type PrivateTransfersInterface, type ProvingBlockId,
    type ScreeningSignature, type PoolContractInterface,
} from "./strk20sdk";
import { alchemyKey } from "../../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../../utils/formatBalance";
import * as readline from "node:readline/promises";

// ================== shared pool constants (identical to ../4.init) ==================
// Governance admin of OUR pool. ⚠️ DO NOT CHANGE. Part of the deterministic pool address.
export const POOL_GOVERNANCE_ADMIN = "0x04761f1bf6b5f11f6b5beb2fd862a468e4d7666f674ac544e2a502e4d8483747";
// Official STRK20 pool class — already DECLARED on Sepolia (same hash as Mainnet).
export const POOL_CLASS_HASH = "0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d";
export const PROOF_VALIDITY_BLOCKS = 450;  // must match ../4.init (part of the pool address)
// Fixed screener key pair of OUR pool: the canonical devnet screener test key of the
// official repo. PUBLIC knowledge — fine for a testnet PoC pool, never do this on Mainnet.
export const SCREENER_PRIVATE_KEY = "0xCAFEBABE";
// Fixed auditor key pair of OUR pool (compliance escrow — never used by these scripts).
export const AUDITOR_PRIVATE_KEY = "0xa0d17042";
export const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // same on all networks
export const PROOF_SERVER_URL = "http://localhost:3030";

// ================== crypto (identical derivations to the parent scripts) ==================
// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const poseidon = (vals: BigNumberish[]) => hash.computePoseidonHashOnElements(vals);
const HALF_ORDER = BigInt(ec.starkCurve.CURVE.n) / 2n;
// ⚠️ Must stay IDENTICAL to the parent scripts 4-8 (same vk => same notes).
const VK_DERIVATION_TAG = TAG("STRK20_VK_FROM_ACCOUNT:V1");
// Salt of the (unique:false) UDC deployment — fixed, so the pool address is deterministic.
const POOL_DEPLOY_SALT = TAG("STRK20_POC_POOL_SALT:V1");

// Deterministic viewing key: same account private key => same vk, nothing stored on disk.
// Canonical requirement of the pool: 0 < vk < ORDER/2 (utils.cairo is_canonical_key).
export function deriveViewingKey(accountPrivKey: string): string {
    let h = BigInt(poseidon([VK_DERIVATION_TAG, accountPrivKey]));
    let vk = h % HALF_ORDER;
    while (vk === 0n) { h = BigInt(poseidon([h])); vk = h % HALF_ORDER; } // unreachable in practice
    return num.toHex(vk);
}
// derive_public_key (utils.cairo): x-coordinate of k*G on the Stark curve.
export function derivePublicKey(privKey: string): string {
    return num.toHex(ec.starkCurve.getStarkKey(privKey));
}

// ================== deposit screening (self-signed attestation) ==================
// Same recipe as the parent scripts 5/6 (packages/privacy/src/snip12.cairo), producing
// the SDK's ScreeningSignature shape so it can travel in Proof.additionalData.
const STARKNET_DOMAIN_TYPE_HASH = "0x1ff2f602e42168014d405a94f75e8a93d640751d71d16311266e140d8b0a210";
const DEPOSITOR_VALIDATION_TYPE_HASH = "0x32d43b7372c9ea8a35daf12b02c5f6f74837910ecbaf2a3ecfe71fec901913d";

export function signScreeningAttestation(
    depositor: string, issuedAt: number, chainId: string): ScreeningSignature {
    const domainHash = poseidon([STARKNET_DOMAIN_TYPE_HASH, TAG("Screening"), 2, chainId, 1]);
    const structHash = poseidon([DEPOSITOR_VALIDATION_TYPE_HASH, depositor, issuedAt]);
    const msgHash = poseidon([TAG("StarkNet Message"), domainHash,
        derivePublicKey(SCREENER_PRIVATE_KEY), structHash]);
    const sig = ec.starkCurve.sign(msgHash, SCREENER_PRIVATE_KEY);
    return { issued_at: issuedAt, sig_r: num.toHex(sig.r), sig_s: num.toHex(sig.s) };
}

// ================== provider & environment checks ==================
export function makeProvider(): RpcProvider {
    return new RpcProvider({
        nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
    });
}

export async function assertSepolia(provider: RpcProvider): Promise<void> {
    console.log(
        "chain Id =", new CairoBytes31(await provider.getChainId()).decodeUtf8(),
        ", rpc", await provider.getSpecVersion(),
        ", SN version =", (await provider.getBlock()).starknet_version);
    if (await provider.getChainId() !== constants.StarknetChainId.SN_SEPOLIA) {
        throw new Error("This script targets SEPOLIA only.");
    }
    console.log("Provider connected to Starknet Sepolia Testnet.");
}

// Any HTTP response (even 404) means the server is up; only a network error means it is down.
export async function checkProofServer(): Promise<boolean> {
    try {
        await fetch(PROOF_SERVER_URL, { method: "GET", signal: AbortSignal.timeout(3000) });
        return true;
    } catch {
        return false;
    }
}

// ================== deterministic pool address (same computation as ../4.init) ==================
export function computePoolAddress(): string {
    const constructorCalldata: Calldata = new CallData(PrivacyPoolABI as Abi).compile("constructor", {
        governance_admin: POOL_GOVERNANCE_ADMIN,
        auditor_public_key: derivePublicKey(AUDITOR_PRIVATE_KEY),
        screener_public_key: derivePublicKey(SCREENER_PRIVATE_KEY),
        proof_validity_blocks: PROOF_VALIDITY_BLOCKS,
    });
    // unique:false UDC deployment => address independent of the deployer (deployer felt = 0).
    return hash.calculateContractAddressFromHash(
        POOL_DEPLOY_SALT, POOL_CLASS_HASH, constructorCalldata, 0);
}

// Generic: asserts a contract of the EXPECTED class is deployed at `address`.
// Shared by the pool check below and script 9's echo-helper check. `notDeployedHint`
// is appended to the "not deployed" error (e.g. how to deploy it).
export async function assertClassDeployed(
    provider: RpcProvider, address: string, expectedClassHash: string,
    label: string, notDeployedHint = "",
): Promise<void> {
    let onchainClassHash: string;
    try {
        onchainClassHash = num.toHex(await provider.getClassHashAt(address));
    } catch {
        throw new Error(`${label} not deployed at ${address}.${notDeployedHint}`);
    }
    if (BigInt(onchainClassHash) !== BigInt(expectedClassHash)) {
        throw new Error(`${label} at ${address} holds a DIFFERENT class (${onchainClassHash}).`);
    }
    console.log(`${label} deployed at ${address} ✅`);
}

// The pool must already exist (deployed by ../4.init.strk20DeployPool.ts).
export async function assertPoolDeployed(provider: RpcProvider, poolAddress: string): Promise<void> {
    await assertClassDeployed(provider, poolAddress, POOL_CLASS_HASH,
        "\nOur pool (deterministic address)", " Deploy it first with ../4.init.strk20DeployPool.ts.");
}

// ================== secure-voty proof provider (SDK adapter) ==================
// The virtual tx __validate__ requires: version 3, tip = 0, max_price_per_unit = 0 for
// all resources (privacy.cairo). max_amount values are free — same generous l2 gas as
// the parent scripts (the SDK default of 100M is tighter than needed).
const VIRTUAL_RESOURCE_BOUNDS = {
    l1_gas: { max_amount: 0x100000n, max_price_per_unit: 0n },
    l2_gas: { max_amount: 2_000_000_000n, max_price_per_unit: 0n },
    l1_data_gas: { max_amount: 0x100000n, max_price_per_unit: 0n },
};

type ProveResult = {
    proof: string;
    proofFacts: BigNumberish[];
    l2ToL1Messages?: { from_address: BigNumberish; payload: BigNumberish[]; to_address: BigNumberish }[];
};

// ProofProviderInterface implementation talking to the local secure-voty SNIP-36 proof
// server (SSE /prove), the same server the parent scripts use. The SDK hands us the
// signed virtual INVOKE_TXN_V3 (ProofInvocation) — exactly the payload secure-voty takes.
export class SecureVotyProofProvider implements ProofProviderInterface {
    private cachedNonce: bigint | null = null;

    constructor(
        private readonly serverUrl: string,
        private readonly provider: RpcProvider,
        private readonly poolAddress: string,
        private readonly chainId: constants.StarknetChainId,
    ) { }

    invalidateNonceCache(): void {
        this.cachedNonce = null;
    }

    // The prover replays the virtual tx against real state, so the invocation must carry
    // the pool's REAL nonce (the SDK default is a hardcoded 0).
    async getDefaultDetails(): Promise<ProofInvocationFactoryDetails> {
        if (this.cachedNonce === null) {
            this.cachedNonce = BigInt(await this.provider.getNonceForAddress(this.poolAddress, "latest"));
        }
        return {
            versions: [ETransactionVersion.V3],
            nonce: this.cachedNonce,
            skipValidate: true,
            resourceBounds: VIRTUAL_RESOURCE_BOUNDS,
            tip: 0n,
            paymasterData: [],
            accountDeploymentData: [],
            nonceDataAvailabilityMode: "L1",
            feeDataAvailabilityMode: "L1",
            version: ETransactionVersion.V3,
            chainId: this.chainId,
        } as unknown as ProofInvocationFactoryDetails;
    }

    async prove(invocation: ProofInvocation, blockIdentifier?: ProvingBlockId): Promise<Proof> {
        const blockNumber = typeof blockIdentifier === "number"
            ? blockIdentifier : await this.provider.getBlockNumber();
        console.log(`Virtual tx built (base block ${blockNumber}). Proving (~40-50 s)...`);
        const proofRes = await this.requestProof(blockNumber, invocation);
        // Proof.output = the pool's L2->L1 message payload: [class_hash, ...server actions]
        // (the SDK strips the class_hash prefix when building apply_actions).
        const output = proofRes.l2ToL1Messages![0].payload.map((x) => num.toHex(x));
        if (BigInt(output[0]) !== BigInt(POOL_CLASS_HASH)) {
            throw new Error(`Unexpected class hash in proof message: ${output[0]}`);
        }
        const proof: Proof = {
            data: proofRes.proof,
            output,
            proofFacts: proofRes.proofFacts.map((x) => num.toHex(x)),
        };
        // Deposit txs MUST carry a screening attestation (SCREENING_REQUIRED), the other
        // txs MUST NOT (UNEXPECTED_SCREENING). Signed AFTER proving, just before the SDK
        // packs it into apply_actions, to stay in the 300 s on-chain freshness window.
        const depositor = this.depositorToScreen(invocation);
        if (depositor !== undefined) {
            const issuedAt = Number((await this.provider.getBlock("latest")).timestamp);
            const signature = signScreeningAttestation(depositor, issuedAt, this.chainId);
            console.log(`Screening attestation self-signed (issued_at = ${issuedAt}).`);
            return { ...proof, additionalData: { signature } };
        }
        return proof;
    }

    // SSE client of the secure-voty /prove endpoint (same as the parent scripts).
    private async requestProof(currentBlock: number, tx: ProofInvocation): Promise<ProveResult> {
        const response = await fetch(`${this.serverUrl}/prove`, {
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

    // The depositor to attest, or undefined when the invocation carries no Deposit.
    // Invocation calldata is __execute__ wrapping compile_actions:
    // [1, pool, selector, len, user_addr, viewing_key, ...Span<ClientAction>] — so the
    // depositor is user_addr. Mirrors the SDK's testing/screening-mock-proving.ts.
    private depositorToScreen(invocation: ProofInvocation): string | undefined {
        const calldata = invocation.calldata as string[];
        const innerLen = Number(BigInt(calldata[3]));
        const inner = calldata.slice(4, 4 + innerLen);
        if (inner.length < 3) return undefined;
        try {
            const decoded = new CallData(PrivacyPoolABI as Abi).decodeParameters(
                "core::array::Span::<privacy::actions::ClientAction>",
                inner.slice(2),
            ) as CairoCustomEnum[];
            const hasDeposit = decoded.some((a) => a.activeVariant() === "Deposit");
            return hasDeposit ? num.toHex(inner[0]) : undefined;
        } catch {
            return undefined;
        }
    }
}

// ================== SDK wiring ==================
export type Strk20Context = {
    transfers: PrivateTransfersInterface;
    account: Account;
    pool: Contract;          // pool view calls (get_public_key, get_fee_amount, ...)
    poolAddress: string;
    vk: string;              // viewing key (same derivation as the parent scripts)
    vkPub: string;           // its public counterpart, as registered in the pool
};

export function createStrk20Context(
    userAddress: string, userPrivateKey: string, provider: RpcProvider,
): Strk20Context {
    const poolAddress = computePoolAddress();
    const pool = new Contract({
        abi: PrivacyPoolABI as Abi, address: poolAddress, providerOrAccount: provider,
    });
    const account = new Account({ provider, address: userAddress, signer: userPrivateKey });
    const vk = deriveViewingKey(userPrivateKey);
    const transfers = createPrivateTransfers({
        account,
        viewingKeyProvider: { getViewingKey: async () => vk },
        provingProvider: new SecureVotyProofProvider(
            PROOF_SERVER_URL, provider, poolAddress, constants.StarknetChainId.SN_SEPOLIA),
        // On-chain discovery straight from the pool's view functions (a starknet.js
        // Contract satisfies PoolContractInterface structurally) — production dapps
        // would use the IndexerDiscoveryProvider, but our PoC pool has no indexer.
        discoveryProvider: new ContractDiscoveryProvider(pool as unknown as PoolContractInterface),
        poolContractAddress: poolAddress,
    });
    return { transfers, account, pool, poolAddress, vk, vkPub: derivePublicKey(vk) };
}

// ================== submission & helpers ==================
// The SDK returns the apply_actions Call + the proof; submitting stays the dapp's job
// (starknet.js execute with the proof attached — SNIP-36).
export async function submitExecuteResult(
    name: string, ctx: Strk20Context, result: ExecuteResult,
): Promise<string> {
    for (const w of result.warnings) console.log(`⚠️ SDK warning [${w.code}]: ${w.message}`);
    const { call, proof } = result.callAndProof;
    console.log(`Proof OK. Submitting apply_actions (${name})...`);
    // DEMO SHORTCUT (privacy leak): ctx.account is the token owner, so it submits and pays this
    // tx itself and its address is published on-chain. apply_actions authorizes on the proof alone
    // and never checks the caller, so in production ANY account can submit it — a sponsor/paymaster
    // (AVNU sponsored_private), reimbursed by a withdraw fee action inside the proven bundle,
    // keeping the user's account out of the block. One account is used here to keep the demos simple.
    const { transaction_hash } = await ctx.account.execute(call as Call,
        { proof: proof.data, proofFacts: proof.proofFacts as string[] });
    console.log("apply_actions tx:", transaction_hash);
    await ctx.account.provider.waitForTransaction(transaction_hash);
    console.log(`${name} DONE ✅`);
    return transaction_hash;
}

// The pool pulls STRK from the submitter: the Deposit amount via TransferFrom(user)
// (+ the fee via collect_fee, but OUR pool has fee = 0).
export async function ensureStrkAllowance(ctx: Strk20Context, needed: bigint): Promise<void> {
    if (needed === 0n) return;
    const strkClass = await ctx.account.provider.getClassAt(STRK_ADDRESS);
    const strk = new Contract({
        abi: strkClass.abi, address: STRK_ADDRESS, providerOrAccount: ctx.account,
    });
    const current: bigint = BigInt(await strk.allowance(ctx.account.address, ctx.poolAddress));
    console.log(`STRK allowance user->pool: ${formatBalance(current, 18)} (needed: ${formatBalance(needed, 18)})`);
    if (current >= needed) return;
    console.log("Sending approve tx...");
    const { transaction_hash } = await strk.approve(ctx.poolAddress, needed);
    await ctx.account.provider.waitForTransaction(transaction_hash);
    console.log("Approve OK:", transaction_hash);
}

// Display the user's UNSPENT STRK notes (the SDK's discovery only returns unspent
// notes — spent ones are filtered out by their nullifier) and return the total,
// i.e. the shielded balance (what wallet_strk20Balances would report).
export async function displayShieldedStrk(ctx: Strk20Context, label: string): Promise<bigint> {
    const { notes } = await ctx.transfers.discoverNotes({ tokens: [BigInt(STRK_ADDRESS)] });
    const strkNotes = notes.get(BigInt(STRK_ADDRESS)) ?? [];
    console.log(`\n--- ${label} ---`);
    let total = 0n;
    for (const n of strkNotes) {
        const fromSelf = BigInt(n.sender) === BigInt(ctx.account.address);
        console.log(`unspent note: ${formatBalance(n.amount, 18)} STRK` +
            ` (from ${fromSelf ? "self" : num.toHex(BigInt(n.sender))})`);
        total += n.amount;
    }
    console.log(`Shielded balance: ${formatBalance(total, 18)} STRK`);
    return total;
}

export async function askConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\nProceed on SEPOLIA (testnet funds)? [y/N] `);
    rl.close();
    if (answer.trim().toLowerCase() !== "y") { console.log("Aborted."); return false; }
    return true;
}
