// Interact with a contract that is already deployed on Devnet.
// Launch with npx ts-node src/scripts/11.CallInvokeContract.ts
// Coded with Starknet.js v8.1.2 & Devnet 0.5.0

import { Contract, Account, json, RpcProvider, config, stark, type ResourceBounds, type EstimateFeeResponseOverhead, type ResourceBoundsBN } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { DEVNET_PORT } from "../constants";
import kill from "cross-port-killer";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 Before execution of this script, launch the script 9 then the script 4.
//          👆👆👆
async function main() {
    const devnet = new DevnetProvider({ url: "http://127.0.0.1:" + DEVNET_PORT }); // running Devnet
    const myProvider = new RpcProvider({ nodeUrl: devnet.url });
    config.set("logLevel", "FATAL");
    console.log("Provider connected to Starknet-devnet");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account({
        provider: myProvider,
        address: accountAddress0,
        signer: privateKey0
    });
    console.log("Account 0 connected.\n");

    // Connect the deployed Test instance in Devnet

    //          👇👇👇
    // 🚨🚨🚨 modify in accordance with result of script 4 or 5
    const testAddress = "0x4040e9a2d41609016c58304a5138279b54a14cefb53d61965898372cbc49bac";

    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const myTestContract = new Contract({ abi: compiledTest.abi, address: testAddress, providerOrAccount: account0 });
    console.log('Test Contract connected at =', myTestContract.address);

    // Interactions with the contract with call & invoke
    const bal1 = await myTestContract.get_balance();
    const bal1b = await myTestContract.call("get_balance");
    console.log("Initial balance =", bal1);
    console.log("Initial balance =", bal1b);
    // Estimate fee:
    const suggestedMaxFeeBN: EstimateFeeResponseOverhead = await account0.estimateInvokeFee({
        contractAddress: testAddress,
        entrypoint: "increase_counter",
        calldata: [10]
    });
    console.log("suggestedMaxFeeBN =", suggestedMaxFeeBN);
    // Add 17% to l2 max amount :
    const increasedResourceBounds: ResourceBoundsBN = {
        ...suggestedMaxFeeBN.resourceBounds,
        l2_gas: {
            ...suggestedMaxFeeBN.resourceBounds.l2_gas,
            max_amount: suggestedMaxFeeBN.resourceBounds.l2_gas.max_amount * 117n / 100n
        }
    };
    console.log({ increasedResourceBounds });
    const result = await myTestContract.invoke(
        "increase_counter",
        [10],
        { resourceBounds: increasedResourceBounds }
    );
    await myProvider.waitForTransaction(result.transaction_hash);
    const bal2 = await myTestContract.get_balance();
    console.log("Final balance =", bal2);

    const pid: string[] = await kill(DEVNET_PORT);
    console.log("Devnet stopped. Pid :", pid, "\nYou can close the log window.");
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });