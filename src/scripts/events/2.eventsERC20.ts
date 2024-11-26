// Test events of an ERC20
// Launch with npx ts-node src/scripts/cairo11-testnet2/5a.events.ts
// Use Starknet.js v6.17.0

import { Provider, Account, Contract, json, constants, GetTransactionReceiptResponse, cairo, CallData, RpcProvider, hash, ec, Calldata, Call, num, events, ParsedEvent } from "starknet";
import fs from "fs";
// import { accountTestnet4privateKey, accountTestnet4Address } from "../../A1priv/A1priv";
// import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey, TonyNode } from "../../A2priv/A2priv";
import { EmittedEvent, Events } from "@starknet-io/types-js";

import * as dotenv from "dotenv";
import { ethAddress } from "../utils/constants";
dotenv.config();


async function main() {
    // ***** Sepolia
    //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
    // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"});
    // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); // local

    // ***** mainnet
    const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" });

    console.log('✅ Connected.');

    // Connect the  contract  :
    const erc20SierraAbi = json.parse(fs.readFileSync("./src/scripts/events/abiETH.json").toString("ascii"));
    const ethContract = new Contract(erc20SierraAbi, ethAddress, myProvider); // ETH contract has not `from` and `to` as keys (only `data`).

    const currentBlock = await myProvider.getBlockNumber();
    console.log("bloc #", currentBlock);

    const keyFilter = [num.toHex(hash.starknetKeccak("Transfer"))];
    const keys = [keyFilter];

    let continuationToken: string | undefined = "0";
    let chunkNum: number = 1;
    let eventsList: EmittedEvent[] = [];
    while (continuationToken) {
        const eventsRes = await myProvider.getEvents({
            from_block: {
                block_number: currentBlock - 1
            },
            to_block: {
                block_number: currentBlock
            },
            address: ethAddress,
            keys: keys,
            chunk_size: 50,
            continuation_token: continuationToken === "0" ? undefined : continuationToken
        });
        const nbEvents = eventsRes.events.length;
        continuationToken = eventsRes.continuation_token;
        console.log("chunk nb =", chunkNum, ".", nbEvents, "events recovered.");
        console.log("continuation_token =", continuationToken);
        eventsList.push(...eventsRes.events);
         chunkNum++;
    }

    console.log("nb of events filtered", eventsList.length);
    console.log("last one=", eventsList[eventsList.length - 1]);

    const abiEvents = events.getAbiEvents(ethContract.abi);
    const abiStructs = CallData.getAbiStruct(ethContract.abi);
    const abiEnums = CallData.getAbiEnum(ethContract.abi);
    const reducedList = eventsList.splice(eventsList.length - 5);
    console.log("length=", reducedList.length);
    const parsed = events.parseEvents(reducedList, abiEvents, abiStructs, abiEnums);
    console.log('parsed events=', parsed);
    const fromAddress = 1993032055077393702903109366595029108494900373109291591845024597260573897227n;
    const filterEvents = parsed.filter((parsedEvent: ParsedEvent) => {
        const prop = Object.keys(parsedEvent);
        return parsedEvent[prop[0]].from === fromAddress
    });
    console.log("filtered numbers =", filterEvents.length);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
