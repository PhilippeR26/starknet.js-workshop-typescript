// Test deploy Braavos account v1.1.0 with a transaction v3 in rpc 0.8.
// Launch with npx ts-node src/scripts/Starknet135/Starknet135-devnet/2.deployBraavos110V3rpc08.ts
// Coded with Starknet.js v7.0.1 & devnet v0.3.0 (rpc0.8) & starknet-devnet.js v0.2.2

import { RpcProvider, Account, shortString } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import { deployAccountBraavos } from "./2.deployBraavos120V3rpc08Lib";
import * as dotenv from "dotenv";
import fs from "fs";
import type { DeployAccountResp } from "../../utils/types";
import { ETransactionVersion } from "@starknet-io/types-js";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // **** local Sepolia Testnet node
    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
    // ****  Sepolia Testnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    //  **** Mainnet 
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet");

    const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    const accountAddress0 = accData[0].address;
    const privateKey0 = accData[0].private_key;
    // **** Sepolia
    // const accountAddress0 = account1BraavosSepoliaAddress;
    // const privateKey0 = account1BraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account(myProvider, accountAddress0, privateKey0); // 0x2 (Tx V1) or 0x3 (tx V3), for initial declare/deploy of contracts.
    console.log("Account connected.\n");
    // *******************************
    const resDeploy: DeployAccountResp = await deployAccountBraavos(
        myProvider,
        account0,
        ETransactionVersion.V3 // 👈👈 V1 or V3 deploy transaction
    );
    console.log(resDeploy);


    console.log("✅ Test performed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

