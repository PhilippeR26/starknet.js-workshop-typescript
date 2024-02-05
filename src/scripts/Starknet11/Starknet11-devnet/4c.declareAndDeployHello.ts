// declare & deploy a Cairo 2.0.0 contract, with debug feature.
// use Starknet.js v5.16.0, starknet-devnet 0.5.5
// launch with npx ts-node src/scripts/cairo11-devnet/4b.declareDeployHello.ts

import { Provider, Account, Contract, json, RpcProvider } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --verbose --compiler-args '--allowed-libfuncs-list-file ./contracts/hello/lib_funcs.json --add-pythonic-hints' 2> /dev/null &

//          👆👆👆

async function main() {
    //initialize Provider 
    const provider = new RpcProvider({  nodeUrl: "http://127.0.0.1:5050" } );
    console.log('✅ Connected to devnet.');

    // initialize existing pre-deployed account 0 of Devnet
    const privateKey = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    const accountAddress: string = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Pre-deployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);

    // Declare & deploy Test contract in devnet
    const compiledHelloSierra = json.parse(fs.readFileSync("./compiledContracts/cairo200/hello.sierra.json").toString("ascii"));
    const compiledHelloCasm = json.parse(fs.readFileSync("./compiledContracts/cairo200/hello.casm.json").toString("ascii"));
    const deployResponse = await account0.declareAndDeploy({ contract: compiledHelloSierra, casm: compiledHelloCasm, salt: "0" });

    const contractClassHash = deployResponse.declare.class_hash;
    console.log('✅ Test Contract declared with classHash =', contractClassHash);

    console.log("contract_address =", deployResponse.deploy.contract_address);
    await provider.waitForTransaction(deployResponse.deploy.transaction_hash);

    // Connect the new contract instance :
    const myTestContract = new Contract(compiledHelloSierra.abi, deployResponse.deploy.contract_address, provider);
    myTestContract.connect(account0);
    const th = await myTestContract.Say_HelloPhil126(200);
    await provider.waitForTransaction(th.transaction_hash);
    // see debug result text in devnet window
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });