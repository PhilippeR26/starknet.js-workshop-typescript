// interact with a contract that is already deployed on devnet.
// launch with npx ts-node src/scripts/11.CallInvokeContract.ts
// Coded with Starknet.js v5.16.0, Starknet-devnet-rs v0.1.0

import { Contract, Account, json, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          Before execution, launch the script for deployment of Test (script 4 or 5).
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet-rs
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    // Connect the deployed Test instance in devnet-rs
    //          👇👇👇
    // 🚨🚨🚨 modify in accordance with result of script 5
    const testAddress = "0x2a843f4719d17b03be9fcdaa8d97e96f869e904fc68a271bf178e64ec155554";
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const myTestContract = new Contract(compiledTest.abi, testAddress, provider);
    console.log('Test Contract connected at =', myTestContract.address);

    // Interactions with the contract with call & invoke
    myTestContract.connect(account0);
    const  bal1  = await myTestContract.get_balance();
    const bal1b = await myTestContract.call("get_balance");
    console.log("Initial balance =", bal1);
    console.log("Initial balance =", bal1b);
    // estimate fee
    const { suggestedMaxFee: estimatedFee1 } = await account0.estimateInvokeFee({ contractAddress: testAddress, entrypoint: "increase_counter", calldata: [10] });

    const resu = await myTestContract.invoke("increase_counter", [10]);
    await provider.waitForTransaction(resu.transaction_hash);
    const bal2 = await myTestContract.get_balance();
    console.log("Final balance =", bal2);
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });