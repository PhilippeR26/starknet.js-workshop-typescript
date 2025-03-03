// Test events of varied contracts, including old and new ERC20.
// New ERC20 transfer event has more KEY inputs.
// Launch with npx ts-node src/scripts/events/3.testEventSN0134.ts
// Use Starknet.js v6.23.1

import { Contract, GetTransactionReceiptResponse, RpcProvider,  shortString, type SuccessfulTransactionReceiptResponse } from "starknet";
import fs from "fs";
// import { accountTestnet4privateKey, accountTestnet4Address } from "../../A1priv/A1priv";
// import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey, TonyNode } from "../../A2priv/A2priv";

import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    // ***** Sepolia
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local
    const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); // local

    // ***** mainnet
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" });

    console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion(), ", SN version =", (await myProvider.getBlock()).starknet_version);
    console.log('✅ Node connected.');

    const veSTRKAddress = "0x0102918fF8257835E2DceDf4472c364653e88922A598294441B683644A3E94C0"; // veSTRK, new transfer event
    const STRKAddress = "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // STRK, old transfer event


    const txR = await myProvider.getTransactionReceipt("0x420a3b06e5059c83a936770c32c2ad4dcc61a1787b2678924ccfaa158b2075c"); // includes both ERC20 types events
    let addrs: string[] = [];
    txR.match({
        success: (txR: SuccessfulTransactionReceiptResponse) => {
            console.log("raw=", txR.events);
            addrs = txR.events.reduce<string[]>((acc, item, index) => {
                if (acc.indexOf(item.from_address) == -1) acc.push(item.from_address);
                return acc
            }
                , []);
            console.log({ addrs });
        },
        _: () => {
            console.log('Unsuccess');
            process.exit(5);
        },
    });

    for await (const address of addrs) {
        const abi = (await myProvider.getClassAt(address)).abi;
        const contract = new Contract(abi, address, myProvider);
        const parsed = contract.parseEvents(txR as GetTransactionReceiptResponse);
        console.log("For", address, ":", parsed);
    }

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
