// declare & deploy a Cairo 1 contract.
// use of OZ deployer
// launch with npx ts-node src/scripts/cairo11-devnet/4b.declareDeployHello.ts

import { Provider, Account, Contract, json,constants } from "starknet";
import fs from "fs";
import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey } from "../A2priv/A2priv"

import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI2 } });
    console.log("Connected to Testnet-2.");


    // initialize existing account 
    const privateKey = accountTestnet2ArgentX1privateKey;
    const accountAddress = accountTestnet2ArgentX1Address;
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nACCOUNT_ADDRESS=', account0.address);
    // console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);

    // Declare & deploy Test contract in 
    console.log("declare/deploy in progress ...");
    const compiledHelloSierra = json.parse(fs.readFileSync("./compiledContracts/structs2.sierra").toString("ascii"));
    const compiledHelloCasm = json.parse(fs.readFileSync("./compiledContracts/structs2.casm").toString("ascii"));
    const deployResponse = await account0.declareAndDeploy({ contract: compiledHelloSierra, casm: compiledHelloCasm});
    const contractClassHash = deployResponse.declare.class_hash;
    console.log('✅ Test Contract declared with classHash =', contractClassHash);

    console.log("contract_address =", deployResponse.deploy.contract_address);
    await provider.waitForTransaction(deployResponse.deploy.transaction_hash);

    // Connect the new contract instance :
    const myTestContract = new Contract(compiledHelloSierra.abi, deployResponse.deploy.contract_address, provider);
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });