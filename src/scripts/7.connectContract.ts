// connect a contract that is already deployed in Devnet.
// launch with npx ts-node src/scripts/7.connectContract.ts
// Coded with Starknet.js v7.1.0 & Devnet v0.4.0

import { Contract, json, RpcProvider, shortString } from "starknet";
import { Devnet, DevnetProvider } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";


//          👇👇👇
//   Launch before the script for deployment of Test (script 5).
//          👆👆👆
async function main() {
    // Devnet has already been started in script 9
    const devnet = new DevnetProvider({ url: "http://127.0.0.1:" + DEVNET_PORT }); // running Devnet
    const myProvider = new RpcProvider({ nodeUrl: devnet.url });
    console.log("Provider connected to Starknet-Devnet");
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-Devnet");

    // Connect the deployed Test instance in devnet
    //          👇👇👇
    // 🚨🚨🚨 modify in accordance with result of script 5
    const testAddress = "0x76b387224c1ba560031fd53f9ace0130027ee97234641406f52f4b3b51b0ad4";
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const myTestContract = new Contract({ abi: testSierra.abi, address: testAddress, providerOrAccount: myProvider });

    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet stopped. Pid :", pid, "\nYou can close the log window.");
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });