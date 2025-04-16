// Test Rpc providers.
// launch with npx ts-node src/scripts/Starknet135/Starknet135-Sepolia/1.testRpcVersionXXXXXXXXXXX.ts
// Coded with Starknet.js v6.24.1 (do not use v7)

import { constants, Contract, Account, json, shortString, RpcProvider, encode } from "starknet";
//import { account2TestnetAddress, account2TestnetPrivateKey } from "../../../A1priv/A1priv";

import fs from "fs";
import { LogC } from "../../utils/logColors"
import * as dotenv from "dotenv";
import { alchemyKey, blastKey, infuraKey, lavaMainnetKey } from "../../../A-MainPriv/mainPriv";
dotenv.config();


async function testProvider(providerUrl: string): Promise<string> {
    const provider = new RpcProvider({ nodeUrl: providerUrl });
    let chId: string;
    let result: string = LogC.fg.yellow + "*** " + providerUrl;

    try {
        chId = await provider.getChainId();
        if (chId) {
            result = result + LogC.fg.green + "\nProvider is working fine." + LogC.reset;
            try {
                const resp = await provider.getSpecVersion();
                result = result + "\nThis provider use a rpc version " + resp;
            } catch {
                result = result + "\nThis provider use a rpc version 0.4.0 or older.";
            }
        } else {
            result = result + LogC.fg.red + "\nThis provider is not working properly." + LogC.reset;
        }
    } catch {
        result = result + LogC.fg.red + "\nThis provider is not working properly." + LogC.reset;
    }
    return result;
}

async function main() {

    // default node
    // const provider = new RpcProvider();
    // const chId = shortString.decodeShortString(await provider.getChainId());
    // const resp = await provider.getSpecVersion();
    // console.log("default =", chId, resp);

    const listProvider = [
        constants.NetworkName.SN_SEPOLIA, // default Sepolia Testnet
        constants.NetworkName.SN_MAIN, // default Testnet

        // ************** Sepolia testnet
        "https://starknet-sepolia.g.alchemy.com/v2/" + alchemyKey,
        "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0.5/" + alchemyKey,
        "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_6/" + alchemyKey,
        "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0.6/" + alchemyKey,
        "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/" + alchemyKey,
        "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/" + alchemyKey,
        'https://starknet-sepolia.infura.io/v3/' + infuraKey,
        // 'https://starknet-sepolia.blastapi.io/' + blastKey + '/rpc/v0.4',
        // 'https://starknet-sepolia.blastapi.io/' + blastKey + '/rpc/v0.5',
        // 'https://starknet-sepolia.blastapi.io/' + blastKey + '/rpc/v0_6',
        // 'https://starknet-sepolia.blastapi.io/' + blastKey + '/rpc/v0_7',
        // 'https://starknet-sepolia.blastapi.io/' + blastKey + '/rpc/v0_8',
        // "https://starknet-sepolia.public.blastapi.io/rpc/v0.4", // no more
        // "https://starknet-sepolia.public.blastapi.io/rpc/v0.5", // no more
        "https://starknet-sepolia.public.blastapi.io/rpc/v0_6",
        "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
        "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",
        "https://free-rpc.nethermind.io/sepolia-juno",
        // "https://free-rpc.nethermind.io/sepolia-juno/v0_5", // no more
        "https://free-rpc.nethermind.io/sepolia-juno/v0_6",
        "https://free-rpc.nethermind.io/sepolia-juno/v0_7",
        "https://free-rpc.nethermind.io/sepolia-juno/v0_8",
        "https://rpc.starknet-testnet.lava.build",
        "https://rpc.starknet-testnet.lava.build/rpc/v0_6",
        "https://rpc.starknet-testnet.lava.build/rpc/v0_7",
        "https://rpc.starknet-testnet.lava.build/rpc/v0_8",
        // 'http://192.168.1.167:9545/rpc/v0.4', // my local pathfinder 
        // 'http://192.168.1.167:9545/rpc/v0_4', // my local pathfinder 
        // 'http://192.168.1.167:9545/rpc/v0.5', // my local pathfinder 
        // 'http://192.168.1.167:9545/rpc/v0_5', // my local pathfinder 
        'http://192.168.1.167:9545/rpc/v0_6', // my local pathfinder 
        'http://192.168.1.167:9545/rpc/v0_7', // my local pathfinder
        'http://192.168.1.167:9545/rpc/v0_8', // my local pathfinder
        'http://192.168.1.167:6070/rpc/v0_6', // my local Juno 
        'http://192.168.1.167:6070/rpc/v0_7', // my local Juno
        'http://192.168.1.167:6070/rpc/v0_8', // my local Juno
        
        // *************** Mainnet
        "https://starknet-mainnet.g.alchemy.com/v2/" + alchemyKey,
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0.5/" + alchemyKey,
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0.6/" + alchemyKey,
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_6/" + alchemyKey,
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/" + alchemyKey,
        "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_8/" + alchemyKey,
        "https://starknet-mainnet.infura.io/v3/" + infuraKey,
        // 'https://starknet-mainnet.infura.io/rpc/v0.4/' + infuraKey,
        // 'https://starknet-mainnet.infura.io/rpc/v0.5/' + infuraKey,
        // 'https://starknet-mainnet.infura.io/rpc/v0_6/' + infuraKey,
        // 'https://starknet-mainnet.infura.io/rpc/v0_7/' + infuraKey,
        // 'https://starknet-mainnet.infura.io/rpc/v0_8/' + infuraKey,
        // "https://starknet-mainnet.blastapi.io/" + blastKey + "/rpc/v0.5",
        "https://starknet-mainnet.blastapi.io/" + blastKey + "/rpc/v0_6",
        "https://starknet-mainnet.blastapi.io/" + blastKey + "/rpc/v0_7",
        "https://starknet-mainnet.blastapi.io/" + blastKey + "/rpc/v0_8",
        // "https://starknet-mainnet.public.blastapi.io/rpc/v0.4",
        // "https://starknet-mainnet.public.blastapi.io/rpc/v0.5",
        "https://starknet-mainnet.public.blastapi.io/rpc/v0_6",
        "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
        "https://starknet-mainnet.public.blastapi.io/rpc/v0_8",
        // "https://free-rpc.nethermind.io/mainnet-juno/v0_5", // no more
        "https://free-rpc.nethermind.io/mainnet-juno/v0_6",
        "https://free-rpc.nethermind.io/mainnet-juno/v0_7",
        "https://free-rpc.nethermind.io/mainnet-juno/v0_8",
        "https://free-rpc.nethermind.io/mainnet-juno/",
        "https://g.w.lavanet.xyz:443/gateway/strk/rpc-http/" + lavaMainnetKey,
        // "https://json-rpc.starknet-mainnet.public.lavanet.xyz",
        "https://rpc.starknet.lava.build",
        "https://rpc.starknet.lava.build/rpc/v0_6",
        "https://rpc.starknet.lava.build/rpc/v0_7",
        "https://rpc.starknet.lava.build/rpc/v0_8",
        // "http://192.168.1.11:6060/v0_4", // my Juno no more working
        // "http://192.168.1.11:6060/v0_5", // my Juno no more working
        "http://192.168.1.167:6060/v0_6", //my local Juno
        "http://192.168.1.167:6060/v0_7", //my local Juno
        "http://192.168.1.167:6060/v0_8", //my local Juno
    ]

    for (const url of listProvider) {
        console.log(await testProvider(url) + "\n");
    }

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


