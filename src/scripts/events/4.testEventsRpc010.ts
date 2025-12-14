// Get decoded events of a multi-call transaction that includes 
// txs from varied contracts, including old and new ERC20.
// New ERC20 transfer event has more KEY inputs.
// Uses batch feature to get all abis in one request.
// Launch with npx ts-node src/scripts/events/4.testEventsRpc010.ts
// Use Starknet.js v9.0.0B2

import { CairoBytes31, Contract, GetTransactionReceiptResponse, RpcProvider, shortString, type Abi, type CompiledSierra, type LegacyContractClass, type ParsedEvent, type ParsedEvents, type SuccessfulTransactionReceiptResponse } from "starknet";
import fs from "fs";
// import { accountTestnet4privateKey, accountTestnet4Address } from "../../A1priv/A1priv";
// import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey, TonyNode } from "../../A2priv/A2priv";

import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    // ***** Sepolia
    const url = "http://192.168.1.26:9545/rpc/v0_10";
    const myProvider = new RpcProvider({ nodeUrl: url }); // local Sepolia Testnet node (free, wire)
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local
    // const myProvider = new RpcProvider({ nodeUrl: "http://localhost:9545/rpc/v0_8" }); // local

    // ***** mainnet
    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" });

    const bl = await myProvider.getBlock();
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", bl.starknet_version,
        ", block #", bl.block_number,
    );
    console.log('✅ Node connected.');

    const veSTRKAddress = "0x0102918fF8257835E2DceDf4472c364653e88922A598294441B683644A3E94C0"; // veSTRK, new transfer event
    const STRKAddress = "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // STRK, old transfer event


    const txR = await myProvider.getTransactionReceipt("0x420a3b06e5059c83a936770c32c2ad4dcc61a1787b2678924ccfaa158b2075c"); // includes both ERC20 types events
    // get all addresses of involved contracts
    let addresses: string[] = [];
    txR.match({
        SUCCEEDED: (txR: SuccessfulTransactionReceiptResponse) => {
            console.log("raw=", txR.events);
            addresses = txR.events.reduce<string[]>((acc, item, index) => {
                if (acc.indexOf(item.from_address) == -1) acc.push(item.from_address);
                return acc
            }
                , []);
            console.log({ addrs: addresses });
        },
        _: () => {
            console.log('Unsuccess');
            process.exit(5);
        },
    });

    // batch Provider
    const myBatchProvider = new RpcProvider({
        nodeUrl: url,
        batch: 0,
    });

    type DataExtracted = {
        sierra: LegacyContractClass | Omit<CompiledSierra, "sierra_program_debug_info">,
        fromAddress: string,
    }

    // get all the sierra of all contracts, in one single node request
    const fnArray = addresses.reduce(
        (
            collector: Promise<DataExtracted>[],
            fromAddress: string
        ) => {
            return [
                ...collector,
                new Promise<DataExtracted>(async (resolve, reject) => {
                    const sierra = await myBatchProvider.getClassAt(fromAddress);
                    resolve({ sierra, fromAddress });
                })
            ]
        }, [])
    const classes = await Promise.all(fnArray);
    console.log("classes=", classes);

    // decode raw events with each class
    const decodedEvents = classes.reduce(
        (
            eventsResponses: ParsedEvent[],
            classSierra: DataExtracted
        ) => {
            try {
                const abi = classSierra.sierra.abi;
                const contract = new Contract({ abi, address: classSierra.fromAddress });
                const parsed = contract.parseEvents(txR as GetTransactionReceiptResponse);
                console.log("res:", parsed);
                return [...eventsResponses, ...parsed];
            } catch {
                // class has been upgraded after event creation. Current class abi do not match the abi of the class when the event has been created.
                console.log("*** abi not in accordance with event for contract");
                return eventsResponses;
            }
        },
        []
    );
    console.log("decodedEvents=", decodedEvents);
    console.log("decodedEvents length=", decodedEvents.length);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
