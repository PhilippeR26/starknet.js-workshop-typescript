// Test Blake hash
// launch with npx ts-node src/scripts/Starknet141/Starknet141-devnet/1.hashBlake.ts
// Coded with Starknet.js v8.6.0 & starknet-devnet.js v0.6.1

import { CairoCustomEnum, constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, CairoBytes31, type CompiledContract, type CairoAssembly, config, type BigNumberish, type CompiledSierra, stark } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import type { ResourceBounds } from "@starknet-io/types-js";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { blake2sEncode, blake2sHashMany } from "./1a.tmpBlake";
import { arrayBuffer } from "stream/consumers";
import { Blake2SHasher, Blake2SParam } from "@napi-rs/blake-hash";

dotenv.config();




async function main() {
    // initialize Provider 
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5020/rpc", }); // only starknet-devnet
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }

    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

    // Check that communication with provider is OK
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet Devnet.");

    //process.exit(5);
    // *** Devnet
    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Testnet account
    // const accountAddress0 = account1OZSepoliaAddress;
    // const privateKey0 = account1OZSepoliaPrivateKey;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    // *** initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('existing account connected.\n');


    // ********** main code

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/ArgentXaccount030.sierra.json").toString("ascii")) as CompiledSierra;
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo200/ArgentXaccount030.casm.json").toString("ascii")) as CairoAssembly;
    console.log("Declare...");
    const resDecl = await account0.declareIfNot({ contract: compiledSierra, casm: compiledCasm }, { tip: 0 });
    let classHash = "";
    if (resDecl.transaction_hash) {
        classHash = resDecl.class_hash;
    }
    else {
        console.log("Already declared");
        classHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
    }
    console.log("declared class=", classHash);

    // === 1/3 deploy_account.ts ===

    function toBigIntSafe(value: any): bigint {
        if (typeof value === "bigint") return value;
        if (typeof value === "number") return BigInt(value);
        if (typeof value === "string") return BigInt(value);
        return 0n;
    }

    function toHex0x(value: number | bigint | string) {
        try {
            return `0x${toBigIntSafe(value).toString(16)}`;
        } catch {
            return "0x0";
        }
    }

    function normalizeCalldataToHex(calldata: any[]): string[] {
        return (calldata || []).map((v) => {
            if (typeof v === "string") {
                if (v.startsWith("0x")) return v;
                return toHex0x(v);
            }
            return toHex0x(v as any);
        });
    }

    function toResourceBoundsBN(rb: any) {
        const l1In = rb?.l1_data_gas ?? rb?.l1_gas ?? {};
        const l2In = rb?.l2_gas ?? {};
        const l1 = {
            max_amount: toBigIntSafe(l1In.max_amount ?? "0x0"),
            max_price_per_unit: toBigIntSafe(l1In.max_price_per_unit ?? "0x0"),
        };
        const l2 = {
            max_amount: toBigIntSafe(l2In.max_amount ?? "0x0"),
            max_price_per_unit: toBigIntSafe(l2In.max_price_per_unit ?? "0x0"),
        };
        return { l1_gas: l1, l1_data_gas: l1, l2_gas: l2 };
    }

    interface OfflineDeployAccountInput {
        privateKey: string;
        classHash: string;
        constructorCalldata: BigNumberish[];
        addressSalt: string;
        nonce: string;
        chainId: string;
        contractAddress?: string;
    }
    const privateKey = "0x123456789a"; // hide

    const nonce = "0x0";
    const chainId = constants.StarknetChainId.SN_SEPOLIA;

    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    const constructorCalldata = CallData.compile({ owner: publicKey, guardian: "0" });
    const addressSalt = publicKey;
    const expectedAddress = hash.calculateContractAddressFromHash(addressSalt, classHash, constructorCalldata, 0);
    const myAccount = new Account({ address: expectedAddress, provider: myProvider, signer: privateKey });
    await l2DevnetProvider.mint(expectedAddress, 100n * 10n ** 18n, "FRI"); // 100 STRK
    await myAccount.deployAccount({ classHash, addressSalt, constructorCalldata }, { tip: 0 });

    async function signDeployAccountOffline(i: any) {
        const { privateKey, classHash, constructorCalldata, addressSalt, nonce, chainId, contractAddress } = i;
        const addr = contractAddress || hash.calculateContractAddressFromHash(addressSalt, classHash, constructorCalldata, 0);
        console.log("signDeployAccountOffline-addr=",addr);
        const tx = {
            type: "DEPLOY_ACCOUNT",
            class_hash: classHash,
            contract_address_salt: addressSalt,
            constructor_calldata: constructorCalldata,
            version: "0x3",
            nonce: BigInt(nonce),
            contract_address: addr,
            resource_bounds: {
                l1_gas: { max_amount: 0n, max_price_per_unit: 1500000000n },
                l1_data_gas: { max_amount: 384n, max_price_per_unit: 1500000000n },
                l2_gas: { max_amount: 1044480n, max_price_per_unit: 1500000000n },
            },
            tip: 0n,
            paymaster_data: [],
            nonce_data_availability_mode: 0,
            fee_data_availability_mode: 0,
        };
        //const rb = toResourceBoundsBN(tx.resource_bounds);
        // const rb = stark.resourceBoundsToBigInt(tx.resource_bounds);
        const rb=tx.resource_bounds;
        console.log("signDeployAccountOffline-rb=", rb);
        console.log("signDeployAccountOffline-input for hash=",{
            contractAddress: addr,
            classHash,
            compiledConstructorCalldata: constructorCalldata,
            salt: addressSalt,
            version: "0x3",
            chainId,
            nonce: tx.nonce,
            nonceDataAvailabilityMode: 0,
            feeDataAvailabilityMode: 0,
            resourceBounds: rb,
            tip: 0n,
            paymasterData: []
        });
        const txHash = hash.calculateDeployAccountTransactionHash({
            contractAddress: addr,
            classHash,
            compiledConstructorCalldata: constructorCalldata,
            salt: addressSalt,
            version: "0x3",
            chainId,
            nonce: tx.nonce,
            nonceDataAvailabilityMode: 0,
            feeDataAvailabilityMode: 0,
            resourceBounds: rb,
            tip: 0n,
            paymasterData: []
        });
        const { r, s } = ec.starkCurve.sign(txHash, privateKey);
        console.log("r,s=",r,s);
        return { txHash, signature: `0x${r.toString(16)},0x${s.toString(16)}`, deployAccountTx: tx }
    }

    const { txHash, signature, deployAccountTx } = await signDeployAccountOffline({
        privateKey, classHash, constructorCalldata, addressSalt, nonce, chainId
    });
    console.log("signDeployAccountOffline-txH=", txHash);
    console.log("signDeployAccountOffline-signature=", signature);
    console.log("signDeployAccountOffline-deployAccountTx=", deployAccountTx);

    const teH = hash.calculateDeployAccountTransactionHash({
        tip: 0,
        paymasterData: [],
        nonceDataAvailabilityMode: 0,
        feeDataAvailabilityMode: 0,
        resourceBounds: {
            l2_gas: { max_amount: 1044480n, max_price_per_unit: 1500000000n },
            l1_gas: { max_amount: 0n, max_price_per_unit: 1500000000n },
            l1_data_gas: { max_amount: 384n, max_price_per_unit: 1500000000n }
        },
        nonce: 0n,
        chainId: '0x534e5f5345504f4c4941',
        version: '0x3',
        classHash: '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003',
        contractAddress: '0x7115429866a56017e9dcc8c74593d3ad25697c86b49c21f1dd8a3a20e7feff5',
        salt: '0x2f95af5a1a0edba1c83d3283a464d27db299505838192f7c15d1a09d66668b4',
        compiledConstructorCalldata: [
            '1345198395675976230947659994994543456431422664214833970544408282081276618932',
            '0'
        ]
    });
    console.log({ teH });

    // const rawTx = buildRawDeployAccountTx(deployAccountTx, signature);
    // console.log("deploy account rawTx:", JSON.stringify(rawTx, null, 2));
    // const result = await broadcastDeployAccountTx("rpc", rawTx);
    // console.log("deploy account broadcast result:", result);


    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });