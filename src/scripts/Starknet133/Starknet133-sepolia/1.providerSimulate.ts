// Verify the status of your account for the STRK airdrop.
// launch with npx ts-node src/scripts/Starknet133/Starknet133-sepolia/1.providerSimulate.ts
// Coded with Starknet.js v6.17.0

import { Contract, shortString, RpcProvider,  Account, type Invocations, TransactionType, AccountInvocations, AccountInvocationItem } from "starknet";
import { account2BraavosMainnetAddress, account2BraavosMainnetPrivateKey } from "../../../A-MainPriv/mainPriv";
import fs from "fs";
import axios from "axios";
import { strkSierra } from "../staking/constants";
import { strkAddress } from "../../utils/constants";
import { account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account3ArgentXSepoliaAddress } from "../../../A1priv/A1priv";


async function main() {
    //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
    // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    // ****  Sepolia Testnet 
    const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
    // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local pathfinder testnet node
    // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
    // if (!(await l2DevnetProvider.isAlive())) {
    //     console.log("No l2 devnet.");
    //     process.exit();
    //   }
    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
    console.log("Provider connected to Starknet");

    //const accData = await l2DevnetProvider.getPredeployedAccounts();
    // *** initialize existing predeployed account 0 of Devnet
    // const accountAddress0 = accData[0].address;
    // const privateKey0 = accData[0].private_key;
    // **** Sepolia
    const accountAddress0 = account1TestBraavosSepoliaAddress;
    const privateKey0 = account1TestBraavosSepoliaPrivateKey;
    // **** Mainnet
    //  const accountAddress0 = account1BraavosMainnetAddress;
    //  const privateKey0 = account1BraavosMainnetPrivateKey;

    const account0 = new Account(myProvider, accountAddress0, "0x01"); // fake private key
    const accountAddress2 = account3ArgentXSepoliaAddress;

    const strkContract = new Contract(strkSierra.abi, strkAddress, myProvider);



    const myCall = strkContract.populate("transfer", {
        recipient: accountAddress2,
        amount: 100,
    });
    console.log({ myCall });

    const invocation1: Invocations = [
        {
            type: TransactionType.INVOKE,
            ...myCall
        },
    ];

    const item: AccountInvocationItem = {
        type: TransactionType.INVOKE,
        ...myCall,
        nonce: 0, // zero for non defined account
        signature: ["0x01", "0x02"], // fake signature
        version: 1,
    }

    const invocation2: AccountInvocations = [item];
     const result0 = await account0.getSimulateTransaction(invocation2);
    console.log("0 OK");
    const result0a = await account0.getSimulateTransaction(invocation2, {skipValidate:true});
    console.log("0a OK");
    // const result0b = await account0.getSimulateTransaction(invocation2, {skipValidate:false});  // is failing due to missing address
    // console.log("0b OK");
    const result1 = await account0.simulateTransaction(invocation1); // skipValidate=true by default
    console.log("1 OK");
    const result1a = await account0.simulateTransaction(invocation1, { skipValidate: true });
    console.log("1a OK");
    // const result1b = await account0.simulateTransaction(invocation1, {skipValidate:false}); // is failing due to false privK
    // console.log("1b OK");
    const result2 = await myProvider.getSimulateTransaction(invocation2);
    console.log("2 OK");
     const result2a = await myProvider.getSimulateTransaction(invocation2, {skipValidate:true});
    console.log("2a OK");
    // const result2b = await myProvider.getSimulateTransaction(invocation2, {skipValidate:false}); // is failing due to missing address
    // console.log("2b OK");

    // console.log("result simulate =", result0);
        //console.log("trace=", result1[0].transaction_trace)

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });