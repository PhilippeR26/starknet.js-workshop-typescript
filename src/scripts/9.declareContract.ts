// Declare a contract.
// launch with npx ts-node src/scripts/9.declareContract.ts
// Coded with Starknet.js v8.5.0 & Devnet 0.5.0

import { Account, CairoBytes31, config, json, RpcProvider, shortString, stark, type EstimateFeeResponseOverhead, type FeeEstimate, type ResourceBoundsOverhead, type SuccessfulTransactionReceiptResponse } from "starknet";
import { Devnet } from "starknet-devnet";
import { DEVNET_PORT, DEVNET_VERSION } from "../constants";
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
        keepAlive: true,
        args: ["--seed", "0", "--port", DEVNET_PORT]
    });
    const myProvider = new RpcProvider({ nodeUrl: devnet.provider.url, specVersion: "0.9.0" });
    config.set("logLevel","FATAL");
    console.log("devnet url =", devnet.provider.url);
    console.log(
        "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(), 
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-devnet");

    // initialize existing pre-deployed account 0 of Devnet
    const devnetAccounts = await devnet.provider.getPredeployedAccounts();
    const account0 = new Account({
        provider: myProvider,
        address: devnetAccounts[0].address,
        signer: devnetAccounts[0].private_key
    });
    console.log("Account 0 connected.\n");

    // Declare Test contract in devnet
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const testCasm = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.casm.json").toString("ascii"));
    const fees: EstimateFeeResponseOverhead = await account0.estimateDeclareFee({ contract: testSierra, casm: testCasm });
    console.log("fees :", fees);
    // If fees are not sufficient, you can increase them for all next transactions (values are additional percentage):
    config.set('feeMarginPercentage', {
        bounds: {
            l1_gas: {
                max_amount: 75,
                max_price_per_unit: 60,
            },
            l2_gas: {
                max_amount: 62,
                max_price_per_unit: 64,
            },
            l1_data_gas: {
                max_amount: 65,
                max_price_per_unit: 70,
            },
        },
        maxFee: 72,
    });

    const declareResponse = await account0.declareIfNot({ contract: testSierra, casm: testCasm });

    console.log('Test Contract Class Hash =', declareResponse.class_hash);
    if (declareResponse.transaction_hash) {
        const txR = await myProvider.waitForTransaction(declareResponse.transaction_hash);
        console.log(txR.value);
        txR.match({
            SUCCEEDED: (txR: SuccessfulTransactionReceiptResponse) => { console.log("Fees paid =", txR.actual_fee) },
            _: () => { }
        });
    }
    console.log(declareResponse);
    
    console.log("✅ Test completed.");

    // *** devnet is not closed, to be able to run script 4
    // outputStream.end();
    // const pid: string[] = await kill(DEVNET_PORT);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });