// Deploy an instance of an already declared contract.
// use of OZ deployer
// launch with npx ts-node src/scripts/4.deployContractOZ.ts
// Coded with Starknet.js v5.1.0

import { Provider, Account, Contract, ec, json,FunctionAbi } from "starknet";
import fs from "fs";
import BN from "bn.js"
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          Launch also the script for declaration of Test contract : script 9.
//          👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    if (process.env.STARKNET_PROVIDER_BASE_URL != "http://127.0.0.1:5050") {
        console.log("This script work only on local devnet.");
        process.exit(1);
    }
    const provider = new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL } });

    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    // connect existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT0_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT0_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0Address: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('existing OZ account0 connected.\n');

    // Deploy Test instance in devnet
    const testClassHash = "0xff0378becffa6ad51c67ac968948dbbd110b8a8550397cf17866afebc6c17d";
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/test.json").toString("ascii"));
    //estimate fee
    // const { suggestedMaxFee: estimatedFee1 } = await account0.estimateDeployFee({ classHash: testClassHash });
    // const deployResponse = await account0.deployContract({ classHash: testClassHash }, { maxFee: estimatedFee1*11n/10n });

    // Connect the new contract :
    //const myTestContract = new Contract(compiledTest.abi, deployResponse.contract_address, provider);
    console.log('abi =', compiledTest.abi[1]);
    const abi1=compiledTest.abi[1] ;
    console.log('abi1.type =', abi1.type,typeof(abi1.type));
    const type1:string=compiledTest.abi[1].type;
    console.log('abi test =', type1==="function");
    //console.log('abi1.type==function =', (abi1.type as unknow)==="function");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });