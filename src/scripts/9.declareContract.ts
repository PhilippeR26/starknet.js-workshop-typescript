// Declare a contract.
// launch with npx ts-node src/scripts/9.declareContract.ts
// Coded with Starknet.js v5.16.0, Starknet-devnet-rs v0.1.0

import { Account, json, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");
    // Declare Test contract in devnet
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    const testCasm = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.casm.json").toString("ascii"));
    const { suggestedMaxFee: fee1 } = await account0.estimateDeclareFee({ contract: testSierra, casm: testCasm });
    console.log("suggestedMaxFee =", fee1.toString(), "wei");
    const declareResponse = await account0.declare({ contract: testSierra, casm: testCasm }, { maxFee: fee1 * 11n / 10n });

    console.log('Test Contract Class Hash =', declareResponse.class_hash);
    await provider.waitForTransaction(declareResponse.transaction_hash);
    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });