// STRK20 shadow account anonymizer INITIALIZATION — SEPOLIA. Deploys the anonymizer used
// by script 9, bound to OUR pool (the one deployed by 4.init.strk20DeployPool.ts).
// Same recipe as the pool init: the official ShadowAccountAnonymizer class is ALREADY
// DECLARED on Sepolia, so this is a plain UDC deployment — nothing to declare, nothing
// stored on disk. Fixed salt + fixed constructor calldata => deterministic address, which
// script 9 recomputes instead of hard-coding it. Idempotent: if it is already deployed,
// the script just reports its state and exits.
//
// ⚠️ WHY A NEW DEPLOYMENT AND NOT AN UPGRADE OF THE OLD ONE.
// The previous anonymizer of this workshop (0x597e600b8085453b28a28614e401f88b216cbba679
// ff7fa3ea7d71614da2803) was deployed BEFORE the sub-account → shadow account rename and
// still exposes get_sub_accounts. It IS upgradeable (Replaceability, upgrade delay = 0),
// but the rename moved TWO storage variables, and in Cairo a slot is sn_keccak(name) while
// replacing a class never touches storage: sub_account_class_hash → shadow_account_class_hash
// (the class to deploy) and sub_accounts → shadow_accounts (the registry commitment → address).
// Migrating them needs an EIC — an External Initializer Contract, a class that replace_to
// library-calls INTO the target so its writes land in the target's storage; it is never
// deployed and never becomes the contract's class. StarkWare shipped one per variable
// (packages/shadow_account_anonymizer/src/): ShadowAccountClassHashEIC, and
// ShadowAccountsMigrationEIC which copies the registry. Hence their TWO successive upgrades
// to the same implementation class, verified on-chain on the official Sepolia instance
// (blocks 13352147 and 13352228; the first wrote shadow_account_class_hash = 0x346e143e… in
// the very block the class switched, leaving the stale 0x956ddc41… orphaned in the old slot).
// A bare replace_to (eic_data: None) would leave a null class hash AND an empty registry.
// Upgrading in place is therefore possible — the EIC sources are public — but for a workshop
// instance with no registry worth preserving, redeploying is far simpler. Its only effect is
// that the anonymizer address changes, hence identity_key (which hashes the anonymizer
// ADDRESS) and every shadow account address — harmless, since script 9 funds its shadow
// account on each run.
//
// No proof server needed here: the deployment is a plain UDC transaction.
//
// launch with : npx ts-node src/scripts/Starknet143/Starknet143-Sepolia/9.init.deployAnonymizer.ts
// Coded with Starknet.js v10.7.0

import {
    RpcProvider, Account, Contract, ec, num, hash,
    constants, CairoBytes31, CallData, type Abi, type Calldata,
} from "starknet";
import { alchemyKey } from "../../../A-MainPriv/mainPriv";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { displayBalances } from "../../utils/displayBalances";
import { accountOZSepoliaAddress, accountOZSepoliaPrivateKey } from "../../../A1priv/A1priv";
dotenv.config({ quiet: true });

// ================== constants to adapt ==================
// The SEPOLIA account paying the deployment gas (any funded account — the anonymizer
// address does NOT depend on it, thanks to the unique:false UDC deployment).
const DEPLOYER_ADDRESS = accountOZSepoliaAddress;
const DEPLOYER_PRIVATE_KEY = accountOZSepoliaPrivateKey;
// ⚠️ DO NOT CHANGE these values: they are part of the deterministic address, and script 9
// recomputes it from exactly the same constants.
// Governance admin — same as the pool's (admin ops are never needed by script 9).
const GOVERNANCE_ADMIN = "0x04761f1bf6b5f11f6b5beb2fd862a468e4d7666f674ac544e2a502e4d8483747";
// Official ShadowAccountAnonymizer class — already DECLARED on Sepolia (verified on-chain
// 2026-08-14; same class hash as the two official instances, which were upgraded to it).
// Constructor: (privacy_contract, shadow_account_class_hash, governance_admin)
const ANONYMIZER_CLASS_HASH = "0x7ffaf4f427c8de0ca35d32d44d97a31da3c24641e32b72f340660d5b9e7f5e6";
// The SubAccount class the anonymizer deploys per commitment. ⚠️ NOT renamed: the account
// contract is still starkware_accounts::sub_account::SubAccount, from another repo
// (starkware-libs/starkware-starknet-utils). This is the post-rename build, the one the
// official Sepolia anonymizer holds — already DECLARED on Sepolia.
const SHADOW_ACCOUNT_CLASS_HASH = "0x346e143e3b353473a0d6f681c31ffcf2866537898008027fb3b57335bad7b5f";
// Pool identity — MUST match 4.init.strk20DeployPool.ts (address recomputed below).
const POOL_GOVERNANCE_ADMIN = "0x04761f1bf6b5f11f6b5beb2fd862a468e4d7666f674ac544e2a502e4d8483747";
const POOL_CLASS_HASH = "0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d";
const PROOF_VALIDITY_BLOCKS = 450;
const SCREENER_PRIVATE_KEY = "0xCAFEBABE";
const AUDITOR_PRIVATE_KEY = "0xa0d17042";
// true  : read-only — checks classes/pool/anonymizer state, sends NOTHING.
// false : REALLY deploys on Sepolia if the anonymizer is missing.
const CHECK_ONLY = true;
// =========================================================

const myProvider = new RpcProvider({
    nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey,
});

// Domain tags are Cairo short strings (<= 31 ASCII chars) => bytes31 encoding.
const TAG = (s: string) => new CairoBytes31(s).toHexString();
const POOL_DEPLOY_SALT = TAG("STRK20_POC_POOL_SALT:V1");
// ⚠️ Must stay IDENTICAL in script 9 (it recomputes the same address).
const ANONYMIZER_DEPLOY_SALT = TAG("STRK20_POC_ANONYMIZER_SALT:V1");

function derivePublicKey(privKey: string): string {
    return num.toHex(ec.starkCurve.getStarkKey(privKey));
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

    // --- both classes must be DECLARED on Sepolia (read-only) ---
    const anonymizerAbi = (await myProvider.getClassByHash(ANONYMIZER_CLASS_HASH)).abi as Abi;
    if (!JSON.stringify(anonymizerAbi).includes("get_shadow_accounts")) {
        throw new Error("ANONYMIZER_CLASS_HASH is not a post-rename ShadowAccountAnonymizer " +
            "(no get_shadow_accounts in its ABI).");
    }
    console.log("ShadowAccountAnonymizer class found on Sepolia ✅ (declared).");
    await myProvider.getClassByHash(SHADOW_ACCOUNT_CLASS_HASH);
    console.log("SubAccount class found on Sepolia ✅ (declared).");

    // --- our pool must exist (deterministic address, same computation as scripts 4-9) ---
    const poolAbi = (await myProvider.getClassByHash(POOL_CLASS_HASH)).abi as Abi;
    const poolConstructorCalldata: Calldata = new CallData(poolAbi).compile("constructor", {
        governance_admin: POOL_GOVERNANCE_ADMIN,
        auditor_public_key: derivePublicKey(AUDITOR_PRIVATE_KEY),
        screener_public_key: derivePublicKey(SCREENER_PRIVATE_KEY),
        proof_validity_blocks: PROOF_VALIDITY_BLOCKS,
    });
    const poolAddress = hash.calculateContractAddressFromHash(
        POOL_DEPLOY_SALT, POOL_CLASS_HASH, poolConstructorCalldata, 0);
    try {
        const onchain = num.toHex(await myProvider.getClassHashAt(poolAddress));
        if (BigInt(onchain) !== BigInt(POOL_CLASS_HASH)) throw new Error("wrong class");
    } catch {
        throw new Error(`Pool not deployed at ${poolAddress}. Run 4.init.strk20DeployPool.ts first.`);
    }
    console.log(`Our pool (deterministic): ${poolAddress} ✅`);

    // ---------- deterministic anonymizer address ----------
    const constructorCalldata: Calldata = new CallData(anonymizerAbi).compile("constructor", {
        privacy_contract: poolAddress,
        shadow_account_class_hash: SHADOW_ACCOUNT_CLASS_HASH,
        governance_admin: GOVERNANCE_ADMIN,
    });
    // unique:false UDC deployment => address independent of the deployer (deployer felt = 0).
    const anonymizerAddress = hash.calculateContractAddressFromHash(
        ANONYMIZER_DEPLOY_SALT, ANONYMIZER_CLASS_HASH, constructorCalldata, 0);
    console.log(`\nOur anonymizer address (deterministic): ${anonymizerAddress}`);

    // ---------- deployment state ----------
    let deployed = false;
    try {
        const onchainClassHash = num.toHex(await myProvider.getClassHashAt(anonymizerAddress));
        if (BigInt(onchainClassHash) !== BigInt(ANONYMIZER_CLASS_HASH)) {
            throw new Error(`Address ${anonymizerAddress} holds a DIFFERENT class (${onchainClassHash}).`);
        }
        deployed = true;
    } catch (e) {
        if (e instanceof Error && e.message.includes("DIFFERENT class")) throw e;
        // contract not found => not deployed yet
    }

    if (deployed) {
        const anonymizer = new Contract({
            abi: anonymizerAbi, address: anonymizerAddress, providerOrAccount: myProvider,
        });
        console.log("Anonymizer already deployed ✅ — nothing to do.");
        console.log(`  bound pool               : ${num.toHex(await anonymizer.get_privacy_contract())}`);
        console.log(`  shadow account class hash: ${num.toHex(await anonymizer.get_shadow_account_class_hash())}`);
        console.log("Script 9 is ready to run against this anonymizer.");
        return;
    }
    console.log("Anonymizer NOT deployed yet — deployment needed.");
    console.log("\n--- Plan ---");
    console.log(" • Deploy our own ShadowAccountAnonymizer (once), bound to our pool");
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
    console.log("\n===== Deploy anonymizer =====");
    const deployRes = await deployerAccount.deployContract({
        classHash: ANONYMIZER_CLASS_HASH,
        constructorCalldata,
        salt: ANONYMIZER_DEPLOY_SALT,
        unique: false,
    });
    await myProvider.waitForTransaction(deployRes.transaction_hash);
    if (BigInt(deployRes.contract_address) !== BigInt(anonymizerAddress)) {
        throw new Error(`Deployed at ${deployRes.contract_address}, expected ${anonymizerAddress}!`);
    }
    console.log(`Anonymizer deployed at ${anonymizerAddress} ✅ (tx ${deployRes.transaction_hash})`);

    // ---------- final report ----------
    const anonymizer = new Contract({
        abi: anonymizerAbi, address: anonymizerAddress, providerOrAccount: myProvider,
    });
    console.log(`  bound pool               : ${num.toHex(await anonymizer.get_privacy_contract())}`);
    console.log(`  shadow account class hash: ${num.toHex(await anonymizer.get_shadow_account_class_hash())}`);
    await displayBalances(deployerAccount.address, myProvider);
    console.log("Anonymizer initialization completed 🎉 — script 9 is ready to run.");
}

main()
    .then(() => console.log("✅ Script ended."))
    .catch((e) => { console.error("❌", e); process.exit(1); });
