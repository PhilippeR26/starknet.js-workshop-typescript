// connect a contract that is already deployed on devnet.
// launch with npx ts-node src/scripts/7.connectContract.ts
// Coded with Starknet.js v5.16.0, Starknet-devnet-rs v0.1.0

import { Contract, json, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          Launch also the script for deployement of Test (script5).
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // Connect the deployed Test instance in devnet
    const testAddress = "0x7667469b8e93faa642573078b6bf8c790d3a6184b2a1bb39c5c923a732862e1";
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const myTestContract = new Contract(testSierra.abi, testAddress, provider);
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });