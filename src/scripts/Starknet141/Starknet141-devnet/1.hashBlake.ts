// Test Blake hash
// launch with npx ts-node src/scripts/Starknet141/Starknet141-devnet/1.hashBlake.ts
// Coded with Starknet.js v8.6.0 & starknet-devnet.js v0.6.1

import { CairoCustomEnum, constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, CairoBytes31, type CompiledContract, type CairoAssembly } from "starknet";
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
import { blake2sHashMany } from "./1a.tmpBlake";
import { arrayBuffer } from "stream/consumers";
dotenv.config();




async function main() {
    // initialize Provider 
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", }); // only starknet-devnet
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

    // const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo2120/enums_test_enums.contract_class.json").toString("ascii")) as CompiledSierra;
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo2120/test_contract_rust.casm").toString("ascii")) as CairoAssembly;
    console.time("blake");
    const hashB = hash.computeCompiledClassHashBlake(compiledCasm);
    console.timeEnd("blake");
    console.log({ hashB });

    const arr: bigint[] = compiledCasm.bytecode.map((n) => BigInt(n));
    // const arr: bigint[] = [258n, 0x0703cd4e9816df01024a07e170fdf303043f0369944686050690ea7a1ec80386n];
    console.log("len =", arr.length, "\n");
    const nbr = 1;
    console.time("blake New Total");
    for (let i = 0; i < nbr; i++) {
        const a = blake2sHashMany(arr);
         console.log("hash normal =", num.toHex(a), "\n");
    }
    console.timeEnd("blake New Total");

    console.time("blake snjs Total");
    for (let i = 0; i < nbr; i++) {
        const b = hash.blake2sHashMany(arr);
         console.log("hash snjs =", num.toHex(b), "");
    }
    console.timeEnd("blake snjs Total");

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });