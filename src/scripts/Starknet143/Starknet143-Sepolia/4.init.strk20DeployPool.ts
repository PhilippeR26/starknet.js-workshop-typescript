// ⚠️ ⚠️ ⚠️ Do not run! Already deployed ⚠️ ⚠️ ⚠️ 
// STRK20 pool INITIALIZATION — SEPOLIA. Deploys the shared pool used by scripts 4-8.
// The pool is OUR OWN instance of the official STRK20 pool class (already declared on
// Sepolia, same hash as Mainnet). Its address is deterministic (fixed UDC salt + fixed
// constructor calldata, nothing stored on disk) and is SHARED by all user accounts:
// screener/auditor keys and governance admin are fixed script constants, NOT derived
// from the deployer account. Idempotent: if the pool is already deployed, the script
// just reports its state and exits.
//
// ⚠️ PREREQUISITE of scripts 4-8: they all check that this pool exists and STOP if it
//    does not. Run this script FIRST (once — the pool then serves every later run).
//
// Why our own pool instead of the public Sepolia instance? Deposits must pass the AML
// screening gate, and only the screener can sign the SNIP-12 `DepositorValidation`
// attestation. Our pool is deployed with a screener public key whose PRIVATE key is a
// script constant (0xCAFEBABE, the canonical devnet screener test key of
// starkware-libs/starknet-privacy), so scripts 5/6 can self-sign their attestations.
//
// No proof server needed here: the deployment is a plain UDC transaction.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/4.init.strk20DeployPool.ts
// Coded with Starknet.js v10.4.0

import {
    RpcProvider, Account, Contract, ec, num, hash,
    constants, CairoBytes31, CallData, type Abi, type Calldata,
} from "starknet";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import { formatBalance } from "../../utils/formatBalance";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { displayBalances } from "../../utils/displayBalances";
import { accountOZSepoliaAddress, accountOZSepoliaPrivateKey } from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account paying the deployment gas (any funded account — the pool address
// does NOT depend on it, thanks to the unique:false UDC deployment).
const DEPLOYER_ADDRESS = accountOZSepoliaAddress;
const DEPLOYER_PRIVATE_KEY = accountOZSepoliaPrivateKey;
// Governance admin of OUR pool (admin ops are never needed by scripts 4-8).
// ⚠️ DO NOT CHANGE THIS VALUE. Part of the deterministic pool address
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
// Fixed auditor key pair of OUR pool (compliance escrow — never used by scripts 4-8,
// kept here only so the escrowed viewing keys stay decryptable if ever needed).
const AUDITOR_PRIVATE_KEY = "0xa0d17042";
// true  : read-only — checks env/class/pool state, sends NOTHING.
// false : REALLY deploys on Sepolia if the pool is missing.
const CHECK_ONLY = true;
// =========================================================

const myProvider = new RpcProvider({
    nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
});

function keysFilled(): boolean {
    return !DEPLOYER_ADDRESS.includes("FILL") && !DEPLOYER_PRIVATE_KEY.includes("FILL")
        && !POOL_GOVERNANCE_ADMIN.includes("FILL");
}

// ================== deterministic pool address ==================
// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
// Salt of the (unique:false) UDC deployment — fixed, so the pool address is deterministic.
// ⚠️ Must stay IDENTICAL in scripts 4-8 (they recompute the same address).
const POOL_DEPLOY_SALT = TAG("STRK20_POC_POOL_SALT:V1");

// derive_public_key (utils.cairo): x-coordinate of k*G on the Stark curve.
function derivePublicKey(privKey: string): string {
    return num.toHex(ec.starkCurve.getStarkKey(privKey));
}

async function main() {
    // --- provider check (same pattern as other scripts of this collection) ---
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    if (await myProvider.getChainId() !== constants.StarknetChainId.SN_SEPOLIA) {
        throw new Error("This script targets SEPOLIA only.");
    }
    console.log("Provider connected to Starknet Sepolia Testnet.");

    // --- pool class check (read-only; the class must be DECLARED on Sepolia) ---
    const poolClass = await myProvider.getClassByHash(POOL_CLASS_HASH);
    const abi = poolClass.abi as Abi;
    const abiText = JSON.stringify(abi);
    if (!abiText.includes("compile_actions") || !abiText.includes("apply_actions")) {
        throw new Error("Class POOL_CLASS_HASH does not expose compile_actions/apply_actions.");
    }
    console.log("Pool class found on Sepolia ✅ (declared).");

    if (!keysFilled()) {
        console.log("\n⚠️ DEPLOYER_ADDRESS / DEPLOYER_PRIVATE_KEY / POOL_GOVERNANCE_ADMIN not " +
            "filled — stopping after env checks.");
        return;
    }

    // ---------- deterministic pool address (same computation as scripts 4-8) ----------
    const constructorCalldata: Calldata = new CallData(abi).compile("constructor", {
        governance_admin: POOL_GOVERNANCE_ADMIN,
        auditor_public_key: derivePublicKey(AUDITOR_PRIVATE_KEY),
        screener_public_key: derivePublicKey(SCREENER_PRIVATE_KEY),
        proof_validity_blocks: PROOF_VALIDITY_BLOCKS,
    });
    // unique:false UDC deployment => address independent of the deployer (deployer felt = 0).
    // Salt and constructor calldata are script constants => same address at every run,
    // whatever the account => deploy once, then always reuse. Nothing stored on disk.
    const poolAddress = hash.calculateContractAddressFromHash(
        POOL_DEPLOY_SALT, POOL_CLASS_HASH, constructorCalldata, 0);
    const pool = new Contract({ abi, address: poolAddress, providerOrAccount: myProvider });
    console.log(`\nOur pool address (deterministic): ${poolAddress}`);

    // ---------- deployment state ----------
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

    if (poolDeployed) {
        const feeAmount = BigInt(await pool.get_fee_amount());
        console.log("Pool already deployed ✅ — nothing to do.");
        console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK per apply_actions tx.`);
        console.log("Scripts 4-8 are ready to run against this pool.");
        return;
    }
    console.log("Pool NOT deployed yet — deployment needed.");
    console.log("\n--- Plan ---");
    console.log(" • Deploy our own pool (once; fixed screener/auditor keys, fee = 0)");
    console.log(`(cost: the Sepolia gas of a single deployment tx, paid by ${DEPLOYER_ADDRESS})`);

    if (CHECK_ONLY) {
        console.log("\nCHECK_ONLY = true → nothing sent. Set CHECK_ONLY = false to execute for real.");
        return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\nProceed on SEPOLIA (testnet funds)? [y/N] `);
    rl.close();
    if (answer.trim().toLowerCase() !== "y") { console.log("Aborted."); return; }

    // ---------- deployment ----------
    const deployerAccount = new Account({
        provider: myProvider, address: DEPLOYER_ADDRESS, signer: DEPLOYER_PRIVATE_KEY,
    });
    await displayBalances(deployerAccount.address, myProvider);
    console.log("\n===== Deploy pool =====");
    const deployRes = await deployerAccount.deployContract({
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

    // ---------- final report ----------
    const feeAmount = BigInt(await pool.get_fee_amount());
    console.log(`Pool fee: ${formatBalance(feeAmount, 18)} STRK per apply_actions tx.`);
    await displayBalances(deployerAccount.address, myProvider);
    console.log("Pool initialization completed 🎉 — scripts 4-8 are ready to run.");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
