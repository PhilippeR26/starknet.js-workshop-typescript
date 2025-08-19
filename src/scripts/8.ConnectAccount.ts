// Connect an existing account in Devnet, using .env file.
// launch with : npx ts-node src/scripts/8.ConnectWallet.ts
// Coded with Starknet.js v8.5.0 & Devnet 0.5.0

import { Account, CairoBytes31, config, RpcProvider, shortString } from "starknet";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    // launch Devnet with a new console window
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
    const myProvider = new RpcProvider({ nodeUrl: devnet.provider.url });
    config.set("logLevel","FATAL");
    console.log("Devnet : url =", devnet.provider.url);
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(), 
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-Devnet");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0 = new Account({
        provider: myProvider,
        address: accountAddress0,
        signer: privateKey0,
    });
    console.log("Account 0 connected.\n");
    console.log('✅ Existing OpenZeppelin account connected.\n   at address =', account0.address);

    outputStream.end();
    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet stopped. Pid :", pid, "\nYou can close the log window.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });