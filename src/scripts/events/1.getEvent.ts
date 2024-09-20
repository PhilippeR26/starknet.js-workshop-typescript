// read (without txH) and parse event.
// launch with npx ts-node src/scripts/events/1.getEvent.ts
// Coded with Starknet.js v6.14.0

import { RpcProvider, types, events, num, hash, Contract, CallData, shortString, Account, type ParsedEvent } from "starknet";
import { API } from "@starknet-io/types-js";
import fs from "fs";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../A1priv/A1priv";
import axios from "axios";
// import { WALLET_API } from "starknet-types";
function wait(delay: number) {
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

async function trackResponse (provider:RpcProvider,txH2:string){
    let end: number = 0;
    const start = new Date().getTime();
    console.log("txH2 =", txH2);
    for (let i = 0; i < 20; i++) {
        let txR: any;
        try { txR = await provider.getTransactionReceipt(txH2) }
        catch { txR = i.toString() + ": TxH not yet in memPool." };
        if (!!txR.execution_status) {
            if (!end) { end = new Date().getTime() }
            console.log("txR",i.toString() + ": execution =", txR.execution_status, ",", txR.finality_status);
        } else {
            console.log("txR", txR);
        }
        await wait(200);
    }
    const txR2 = await provider.waitForTransaction(txH2);
    if (!end) { end = new Date().getTime() };
    // console.log("txR2 =", txR2);
    // const response=provider.getTransactionRe(txR2);
    // console.log("response =",response);
    console.log("Duration (s) =", (end - start) / 1000);
}

async function main() {
    // initialize Provider 
    // Starknet-devnet-rs
    // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); 
    // Sepolia Testnet
     const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });
    // local Sepolia Testnet node :
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" });
    // local Sepolia Integration node :
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9550/rpc/v0_7" }); 
    // local juno mainnet :
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:6060/v0_7" }); 
    const ch = await myProvider.getChainId();
    console.log("chain Id =", shortString.decodeShortString(ch), ", rpc", await myProvider.getSpecVersion());

    const privateKey0 = account0OZSepoliaPrivateKey;
    const accountAddress0 = account0OZSepoliaAddress;
    // *** initialize existing Sepolia Integration account
    // const privateKey0 = account1IntegrationOZprivateKey;
    // const accountAddress0 = account1IntegrationOZaddress;
    const account0 = new Account(myProvider, accountAddress0, privateKey0);


    const address = "0x04b96cb7965971b36d0a2d1d0fda1cc1cf7dcfdf6d48a3a589ece1c829b8cc28";
    const eventH = num.toHex(hash.starknetKeccak('ValueChanged'));
    console.log("event name hash =", eventH);
    const myKeys = [[eventH]];
    const result: API.SPEC.EVENTS_CHUNK = await myProvider.getEvents({
        address: address,
        from_block: { block_number: 69842 },
        to_block: { block_number: 69842 },
        keys: myKeys,
        chunk_size: 50,
        continuation_token: undefined,
    });
    console.log("rawEvents=", result.events);
    const sierra = await myProvider.getClassAt(address);
    const abiEvents = events.getAbiEvents(sierra.abi);
    const abiStructs = CallData.getAbiStruct(sierra.abi);
    const abiEnums = CallData.getAbiEnum(sierra.abi);
    const rawEvents: API.SPEC.EMITTED_EVENT[] = result.events;
    console.log("a");
    const parsed = events.parseEvents(rawEvents, abiEvents, abiStructs, abiEnums);
    console.log("b");
    console.log("parsed events=", parsed);

    const simpleStorageContract = new Contract(sierra.abi, address, account0);
    
    const txR = await myProvider.getTransactionReceipt("0x76ca9ed2820f5f7d552a70c0f0eb76905ed5e82477b22f56f786e5b4870835c");
    console.log("txR=",txR);
    const eventInBlock:ParsedEvent[] = await simpleStorageContract.parseEvents(txR);
    console.log("from Contract.parseEvents: eventInBlock =",eventInBlock);

    // pending tx
    // const resTx=await simpleStorageContract.invoke("set",[Math.floor(Math.random() * 10000)]);
    // await trackResponse(myProvider,resTx.transaction_hash);
    // await myProvider.waitForTransaction(resTx.transaction_hash);
    // const txReceipt = await myProvider.getTransactionReceipt(resTx.transaction_hash);
    // const eventInBlock2 = await simpleStorageContract.parseEvents(txReceipt);
    // console.log("from Contract.parseEvents 2: eventInBlock =",eventInBlock);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

