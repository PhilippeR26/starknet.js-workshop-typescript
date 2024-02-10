// Deploy an instance of an already declared contract.
// use of OZ deployer
// launch with npx ts-node src/scripts/4.deployContractOZ.ts
// Coded with Starknet.js v5.16.0, Starknet-devnet-rs v0.1.0

import { Account, CallData, Contract, json, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          Before execution, launch also before the script for declaration of Test contract : script 9.
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

    // Deploy Test instance in devnet-rs
    const testClassHash = "0xf568733c46280a8c36992fc53808061a877e75dff67b8d2367409a4c9896ce";
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    //estimate fee
    const myCallData = new CallData(testSierra.abi);
    const constructor = myCallData.compile("constructor", { intial_value: 100 });
    const { suggestedMaxFee: estimatedFee1 } = await account0.estimateDeployFee({ classHash: testClassHash, constructorCalldata: constructor });
    const deployResponse = await account0.deployContract({
        classHash: testClassHash, constructorCalldata: constructor
    }, { maxFee: estimatedFee1 * 11n / 10n });

    // Connect the new contract :
    const myTestContract = new Contract(testSierra.abi, deployResponse.contract_address, provider);
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });