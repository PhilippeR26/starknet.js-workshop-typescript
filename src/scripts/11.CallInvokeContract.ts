// Interact with a contract that is already deployed on Devnet.
// Launch with npx ts-node src/scripts/11.CallInvokeContract.ts
// Coded with Starknet.js v8.1.2 & Devnet 0.5.0

import { Contract, Account, json, RpcProvider, config, stark } from "starknet";
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
    const testAddress = "0x483048dda167b33b9508644dff6815e4cdc8db0852184817d9b8ff9ea9eb718";

    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const myTestContract = new Contract({ abi: compiledTest.abi, address: testAddress, providerOrAccount: account0 });
    console.log('Test Contract connected at =', myTestContract.address);

    // Interactions with the contract with call & invoke
    const bal1 = await myTestContract.get_balance();
    const bal1b = await myTestContract.call("get_balance");
    console.log("Initial balance =", bal1);
    console.log("Initial balance =", bal1b);
    // estimate fee
    const suggestedMaxFeeBN = await account0.estimateInvokeFee({ contractAddress: testAddress, entrypoint: "increase_counter", calldata: [10] });
    const suggestedFee=stark.resourceBoundsToHexString(suggestedMaxFeeBN.resourceBounds);
    const increasedFees=stark.toOverheadResourceBounds(suggestedFee,{});
    const resu = await myTestContract.invoke("increase_counter", [10], { resourceBounds: suggestedMaxFee.resourceBounds });
    await myProvider.waitForTransaction(resu.transaction_hash);
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