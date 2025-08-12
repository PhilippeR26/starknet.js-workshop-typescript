// Deploy an instance of an already declared contract.
// use of universal OZ deployer
// launch with npx ts-node src/scripts/4.deployContractOZ.ts
// Coded with Starknet.js v8.1.2 & Devnet 0.5.0

import { Account, CallData, config, Contract, json, RpcProvider, shortString, type EstimateFeeResponseOverhead } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import * as dotenv from "dotenv";
import { DEVNET_PORT } from "../constants";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨 Before execution of this script, launch the script 9 to launch devnet and declare the Test contract.
// 🚨🚨🚨 After execution of this script, launch the script 11 to test the contract, and to close Devnet.
//          👆👆👆
async function main() {
    // Devnet-rs has already been started in script 9
    const devnet = new DevnetProvider({ url: "http://127.0.0.1:" + DEVNET_PORT }); // running devnet
    const myProvider = new RpcProvider({ nodeUrl: devnet.url, specVersion: "0.9.0" });
    config.set("logLevel", "FATAL");
    console.log(
        "chain Id =", shortString.decodeShortString(await myProvider.getChainId()),
        ", rpc", await myProvider.getSpecVersion(),
        ", SN version =", (await myProvider.getBlock()).starknet_version,
    );
    console.log("Provider connected to Starknet-devnet");

    // initialize existing predeployed account 0 of Devnet
    const devnetAccounts = await devnet.getPredeployedAccounts();
    const account0 = new Account({
        provider: myProvider,
        address: devnetAccounts[0].address,
        signer: devnetAccounts[0].private_key
    });
    console.log("Account 0 connected.\n");

    // Deploy Test instance in Devnet
    const testClassHash = "0xf568733c46280a8c36992fc53808061a877e75dff67b8d2367409a4c9896ce";
    const testSierra = json.parse(fs.readFileSync("./compiledContracts/cairo240/counter.sierra.json").toString("ascii"));
    //estimate fee
    const myCallData = new CallData(testSierra.abi);
    const constructor = myCallData.compile("constructor", { intial_value: 100 });
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
    const suggestedMaxFee: EstimateFeeResponseOverhead = await account0.estimateDeployFee({ classHash: testClassHash, constructorCalldata: constructor });
    const deployResponse = await account0.deployContract({
        classHash: testClassHash, constructorCalldata: constructor
    }, { resourceBounds: suggestedMaxFee.resourceBounds });

    // Connect the new contract :
    const myTestContract = new Contract({ abi: testSierra.abi, address: deployResponse.contract_address, providerOrAccount: myProvider });
    console.log('✅ Test Contract connected at =', myTestContract.address);
    // Devnet is not closed, to be able to run script 11
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });