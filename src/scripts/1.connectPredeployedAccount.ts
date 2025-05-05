// Connect a predeployed OZ account in devnet. 
// Address and PrivKey are displayed when launching starknet-devnet.
// Launch with npx ts-node src/scripts/1.connectPredeployedAccount.ts
// Coded with Starknet.js v7.1.0 & Devnet 0.4.0

import { Account, constants, ETransactionVersion, RpcProvider, shortString } from "starknet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import { Devnet } from "starknet-devnet";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";

async function main() {
    // launch devnet with a new console window
    const outputStream = fs.createWriteStream("./src/scripts/devnet-out.txt");
    await events.once(outputStream, "open");
    // the following line is working in Linux. To adapt or remove for other OS
    cp.spawn("gnome-terminal", ["--", "bash", "-c", "pwd; tail -f ./src/scripts/devnet-out.txt; read"]);
    const devnet = await Devnet.spawnVersion(DEVNET_VERSION, {
        stdout: outputStream,
        stderr: outputStream,
        keepAlive: false,
        args: ["--seed", "0", "--port", DEVNET_PORT]
    });
    const myProvider: RpcProvider = new RpcProvider({ nodeUrl: devnet.provider.url, specVersion:"0.8" });
    console.log("devnet url =", devnet.provider.url);
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-devnet");


    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key,undefined,ETransactionVersion.V3);
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");


    outputStream.end();
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet stopped. Pid :", pid, "\nYou can close the log window.");
    console.log("✅ Account 0 connected.\n");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });