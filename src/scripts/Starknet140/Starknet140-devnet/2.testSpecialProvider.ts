// Test the status of transactions in Rpc0.9
// launch with : npx ts-node src/scripts/Starknet140/Starknet140-Sepolia/1.testSpeedTx.ts
// Coded with Starknet.js v8.0.0-beta.1

import { RpcProvider, Account, json, Contract, shortString, type CompiledSierra, type CairoAssembly, type RpcProviderOptions, type ProviderInterface, type BlockIdentifier, type TipAnalysisOptions, getTipStatsFromBlocks } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
import { strkAddress } from "../../utils/constants";
import { wait } from "../../utils/utils";
import { account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress } from "../../../A1priv/A1priv";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch Starknet-devnet before using this script.
//          👆👆👆

async function main() {
    // *** devnet
    const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });

    // *** local 
    // const url = "http://192.168.1.34:6070/rpc/v0_9"; // juno
    // const url = "http://192.168.1.34:9545/rpc/v0_9"; // Pathfinder
    // const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Juno Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: url, specVersion: "0.9.0" }); // my local Pathfinder Sepolia Testnet node (Starlink network)
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.0:9545/rpc/v0_9", specVersion: "0.9.0" }); // local Pathfinder Sepolia Testnet node
    // public node
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9", specVersion: "0.9.0" }); // Sepolia Testnet 


    if (!(await l2DevnetProvider.isAlive())) {
        console.log("No l2 devnet.");
        process.exit();
    }
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log("Provider connected to Starknet");

    //const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    //const accountAddress0 = accData[0].address;
    //const privateKey0 = accData[0].private_key;

    // *** initialize existing Sepolia Integration account
    // const accountAddress0 = account3IntegrationOZ17address;
    // const privateKey0 = account3IntegrationOZ17privateKey;
    // **** Sepolia
    const accountAddress0 = account2TestBraavosSepoliaAddress;
    const privateKey0 = account2TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    //const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
    //console.log("Account 0 connected.\n");

    // ***** main code : 

    // extended class is not working:
    class DevnetSpecialProvider extends RpcProvider implements ProviderInterface {

        public async getEstimateTip(blockIdentifier?: BlockIdentifier, options: TipAnalysisOptions = {}) {
            console.log('getEstimateTip from DevnetProvider', options);
            return getTipStatsFromBlocks(this, blockIdentifier, {
                ...options,
                minTxsNecessary: options.minTxsNecessary ?? 3,
            });
        }
    }

    const myProv = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    console.log(myProv);
    const tipRes = await myProv.getEstimateTip();
    console.log(tipRes);
    const account0 = new Account({ provider: myProv, address: accountAddress0, signer: privateKey0 });
    // change the Account class is working 
    account0.getEstimateTip = function async(blockIdentifier?: BlockIdentifier, options: TipAnalysisOptions = {}) {
        console.log('getEstimateTip from DevnetProvider', options);
        return getTipStatsFromBlocks(this, blockIdentifier, {
            ...options,
            minTxsNecessary: options.minTxsNecessary ?? 3,
        });
    }

    const tipRes2 = await account0.getEstimateTip();
    console.log(tipRes2);


    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
