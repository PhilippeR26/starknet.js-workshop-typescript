// Try to read a contract in a network, and to redeploy on an other nerwork.
// Launch with npx ts-node src/scripts/mainnet/7.testgetClass.ts
// Coded with Starknet.js v5.14.1

import { Provider, RpcProvider, Contract, Account, json, uint256, Abi, constants, shortString, CompiledContract, ContractClass, RPC,  ContractClassResponse, stark, contractClassResponseToLegacyCompiledContract, LegacyCompiledContract, hash, num } from "starknet";
import { alchemyKey, infuraKey, blastKey, lavaMainnetKey } from "../../../A-MainPriv/mainPriv";
import { account1MainnetAddress, account1MainnetPrivateKey, junoNMmainnet } from "../../../A-MainPriv/mainPriv";
import { account2TestnetAddress, account2TestnetPrivateKey, junoNMtestnet } from "../../../A1priv/A1priv";
import { resetDevnetNow } from "../../utils/resetDevnetFunc";
import fs from "fs";
import axios from 'axios';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    // ******* MAINNET ************
    // Alchemy node rpc 0.5.0 for Mainnet (do not work today) :
    const providerAlchemyMainnet = new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0.5/" + alchemyKey });
    // Infura node rpc for Mainnet :
    const providerInfuraMainnet = new RpcProvider({ nodeUrl: "https://starknet-mainnet.infura.io/v3/" + infuraKey });
    // Blast node rpc 0.5.1 for mainnet :
    const providerBlastMainnet = new RpcProvider({ nodeUrl: "https://starknet-mainnet.blastapi.io/" + blastKey + "/rpc/v0.5" });
    // Public Blast node rpc 0.5.0 for Mainnet : 
    const providerMainnetBlastPublic = new RpcProvider({ nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0.5" });
    // Lava node rpc for Mainnet : 
    const providerMainnetLava = new RpcProvider({ nodeUrl: "https://g.w.lavanet.xyz:443/gateway/strk/rpc-http/" + lavaMainnetKey });
    // Public Lava node rpc for Mainnet : 
    const providerMainnetLavaPublic = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-mainnet.public.lavanet.xyz" });
    // with your own local Pathfinder node, in your local network : 
    const providerPathfinderMainnetRpcLocNetwork = new RpcProvider({ nodeUrl: "http://192.168.1.7:9545/rpc/v0.5" });
    // with your own local Pathfinder node, in the same computer : 
    const providerPathfinderMainnetRpcLocComputer = new RpcProvider({ nodeUrl: "http://127.0.0.1:9545/rpc/v0.5" });
    // Nethermind Juno node rpc for Mainnet (only whitelisted access) :
    const providerNethermindMainnet = new RpcProvider({ nodeUrl: junoNMmainnet });
    // Public Nethermind node rpc 0.5.1 for Mainnet : 
    const providerMainnetNethermindPublic = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_5" });
    const providerMainnetNethermindPublic2 = new RpcProvider({ nodeUrl: "https://limited-rpc.nethermind.io/mainnet-juno/v0_5" });
    // with your own local Juno node, in the same computer : 
    const providerJunoMainnetRpcLocComputer = new RpcProvider({ nodeUrl: "http://127.0.0.1:6060/v0_5" });
    // with your own local Juno node rpc 0.5.1, in your local network : 
    const providerJunoMainnetRpcLocNetwork = new RpcProvider({ nodeUrl: "http://192.168.1.7:6060/v0_5" });
    

    // ******* GOERLI TESTNET ************
    // Alchemy node rpc 0.5.0 for Testnet (do not work today) :
    const providerAlchemyTestnet = new RpcProvider({ nodeUrl: "https://starknet-goerli.g.alchemy.com/starknet/version/rpc/v0.5/" + alchemyKey });
    // Infura node rpc for Testnet :
    const providerInfuraTestnet = new RpcProvider({ nodeUrl: 'https://starknet-goerli.infura.io/v3/' + infuraKey });
    // Blast node rpc for Testnet :
    const providerBlastTestnet = new RpcProvider({ nodeUrl: 'https://starknet-testnet.blastapi.io/' + blastKey + "/rpc/v0.5" });
    // Public Blast node rpc for Testnet : 
    const providerTestnetBlastPublic = new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0.5" });
    // Nethermind Juno node rpc for Testnet (only whitelisted access) :
    const providerNethermindTestnet = new RpcProvider({ nodeUrl: junoNMtestnet });
    // Public Nethermind node rpc for Testnet : 
    const providerTestnetNethermindPublic = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/goerli-juno" });
    const providerTestnetNethermindPublic2 = new RpcProvider({ nodeUrl: "https://limited-rpc.nethermind.io/goerli-juno" });
    // Public Lava node rpc 0.4.0 for Testnet : 
    const providerTestnetLavaPublic = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" });
    // with your own local Pathfinder node, in your local network : 
    const providerPathfinderTestnetRpcLocNetwork = new RpcProvider({ nodeUrl: 'http://192.168.1.7:9545/rpc/v0.5' });
    // with your own local Pathfinder node, in the same computer : 
    const providerPathfinderTestnetRpcLocComputer = new RpcProvider({ nodeUrl: 'http://127.0.0.1:9545/rpc/v0.5' });

    // ******* SEPOLIA TESTNET ********
    // Public Blast node rpc for Testnet : 
    const providerBlastSepoliaTestnetPublic = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0.5"});
    const providerBlastSepoliaTestnetPublicV6 = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_6"});
    // Public Nethermind node rpc for Testnet : 
    const providerNethermindSepoliaTestnetPublic = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_5"});
    const providerNethermindSepoliaTestnetPublicV6 = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno"});
    // with your own local Pathfinder node, in your local network : 
    const providerPathfinderSepoliaTestnetRpcLocNetwork = new RpcProvider({ nodeUrl: 'http://192.168.1.7:9545/rpc/v0.5' });

    // ******* SEPOLIA INTEGRATION ********
// with your own local Pathfinder node, in your local network : 
const providerPathfinderSepoliaIntegrationRpcLocNetwork = new RpcProvider({ nodeUrl: 'http://192.168.1.7:9550/rpc/v0.5' });

    // ******* DEVNETS ************
    // Starknet-Devnet rpc & Starknet-devnet-rs:
    const providerDevnetRpc = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
    // Katana devnet, but needs today maxFee parameter as mandatory.
    const providerKatanaRpc = new RpcProvider({ nodeUrl: "http://0.0.0.0:5050" });

    // connect account 0 
    const provider = providerMainnetSequencer;
    const account = new Account(provider, account4MainnetAddress, account4MainnetPrivateKey);
    console.log('address', account.address);

    //test
    const usdcProxyAddress = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
    const { abi: usdcProxyAbi } = await provider.getClassAt(usdcProxyAddress);
    if (usdcProxyAbi === undefined) { throw new Error("no abi.") };
    // console.log(usdcAbi);
    const usdcProxyContract = new Contract(usdcProxyAbi, usdcProxyAddress, provider);
    console.log("abi proxy =", usdcProxyContract.functions);
    // usdcContract.connect(account);
    const { implementation_hash_: usdcErcCH } = await usdcProxyContract.implementation();
    console.log("implementation =", num.toHex(usdcErcCH));
    const { abi: usdcErc20Abi } = await provider.getClassByHash(num.toHex(usdcErcCH));
    const usdcContract = new Contract(usdcErc20Abi, usdcProxyAddress, provider);
    const balance = await usdcContract.balanceOf(account4MainnetAddress);
    console.log(balance);

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
