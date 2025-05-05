// Estimate fees of a message.
// Launch with npx ts-node src/scripts/12.MessageToL2.ts
// Coded with Starknet.js v7.1.0 & Devnet v0.4.0

import { Account, hash, json, RpcProvider, shortString } from "starknet";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
import fs from "fs";
import cp from "child_process";
import events from "events";
import kill from "cross-port-killer";

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
    console.log("Devnet : url =", devnet.provider.url);
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()), 
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-Devnet");

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account(myProvider, devnetAccounts[0].address, devnetAccounts[0].private_key);
    console.log("Account 0 connected.\nAddress =", account0.address, "\n");

    // deploy contract

    const l1l2sierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/PhilTest2.sierra.json").toString("ascii"));
    const l1l2casm = json.parse(fs.readFileSync("./compiledContracts/cairo200/PhilTest2.casm.json").toString("ascii"));
    const deployResponse = await account0.declareAndDeploy({ contract: l1l2sierra, casm: l1l2casm });

    const entryP = hash.getSelectorFromName("setPublicKey");
    console.log("entryP =", entryP);
    const responseEstimateMessageFee = await myProvider.estimateMessageFee({
        from_address: "0xc662c410C0ECf747543f5bA90660f6ABeBD9C8d", // L1 addr
        to_address: deployResponse.deploy.address, // L2 addr (PhilTest2.cairo)
        entry_point_selector: "increase_bal", // needs to be a Cairo function with decorator @l1_handler, and first parameter named 'from_address'.
        payload: ["0x2b34"] // do not list here 'from_address' parameter.
    })
    console.log("Estimated fee message L1->L2 =", responseEstimateMessageFee);
    //console.log("Estimated fee =", responseEstimateMessageFee.overall_fee);
    console.log('✅ Test completed.');

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