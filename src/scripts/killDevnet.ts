// interact with a contract that is already deployed on devnet-rs.
// launch with npx ts-node src/scripts/killDevnet.ts
// Coded with Starknet.js v6.23.0, 

import { Contract, Account, json, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { DEVNET_PORT } from "../constants";
import kill from "cross-port-killer";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 To use to kill devnet-rs
//          👆👆👆
async function main() {
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet-rs stopped. Pid :", pid, "\nYou can close the log window.");
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });