// deploy in testnet a contract.
// launch with npx ts-node src/scripts/Starknet12/Starknet-testnet/2a.deployTestERC721.ts
// Coded with Starknet.js v6.6.6 + starknet devnet-rs 0.0.3

import {  Contract, Account, json, shortString, RpcProvider,   type CompiledSierra } from "starknet";
import fs from "fs";
import axios from "axios";
import { ethAddress, strkAddress } from "../../utils/constants";


async function main() {
    // initialize Provider
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    // const provider = new RpcProvider({ nodeUrl: "https://json-rpc.starknet-testnet.public.lavanet.xyz" }); // testnet
    //const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
    //const provider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });

    // Check that communication with provider is OK
    console.log("chain Id =", shortString.decodeShortString(await provider.getChainId()), ", rpc", await provider.getSpecVersion());

    // //devnet-rs
    const accountAddress0: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";

    // initialize existing Argent X testnet  account
    // const accountAddress0 = account5TestnetAddress
    // const privateKey0 = account5TestnetPrivateKey;

    // // initialize existing Argent X mainnet  account
    // const privateKey0 = account4MainnetPrivateKey;
    // const accountAddress0 = account4MainnetAddress
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log('existing_ACCOUNT_ADDRESS =', account0.address);
    console.log('existing account connected.\n');

    // test of transfer
    const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/erc20OZ070decimals.sierra.json").toString("ascii")) as CompiledSierra;
    const strkContract = new Contract(erc20Sierra.abi, strkAddress, account0);
    const myCall=strkContract.populate("transfer",{
        recipient: "0x78662e7352d062084b0010068b99288486c2d8b914f6e2a55ce945f8792c8b1", 
        amount: 100
    })
    const calls = Array(100).fill(myCall)
    const start0 = new Date().getTime();
    const res0=await account0.execute(myCall);
    const end0 = new Date().getTime();
console.log("duration (ms) =",end0-start0);
    const txR0 = await provider.waitForTransaction(res0.transaction_hash);

    console.log("go!");
    const start1 = new Date().getTime();
    const res1=await account0.execute(calls,{maxFee:10**17});
    const end1 = new Date().getTime();
console.log("duration (ms) =",end1-start1);
    const txR1 = await provider.waitForTransaction(res1.transaction_hash);

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
