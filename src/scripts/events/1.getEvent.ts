// read (without txH) and parse event.
// launch with npx ts-node src/scripts/events/1.getEvent.ts
// Coded with Starknet.js v6.9.0

import { RpcProvider, types, RPC, events, num, hash, Contract, CallData } from "starknet";
import fs from "fs";
import { infuraKey, account1MainnetAddress, account1MainnetPrivateKey, blastKey } from "../../A-MainPriv/mainPriv";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../A1priv/A1priv";
import axios from "axios";
// import { WALLET_API } from "starknet-types";

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


    const address = "0x04b96cb7965971b36d0a2d1d0fda1cc1cf7dcfdf6d48a3a589ece1c829b8cc28";
    const eventH = num.toHex(hash.starknetKeccak('ValueChanged'));
    console.log("event name hash =", eventH);
    const myKeys = [[eventH]];
    const result = await myProvider.getEvents({
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
const parsed = events.parseEvents(result.events, abiEvents, abiStructs, abiEnums)
console.log("parsed events=", parsed);

    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

