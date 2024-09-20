// declare & deploy a Cairo v2.1.0 contract.
// use Starknet.js v6.11.0 + starknet-devnet 0.5.5
// launch with npx ts-node src/scripts/cairo13-devnet/1.declareThenDeployTest.ts

import { Provider, Account, Contract, json ,constants, GetTransactionReceiptResponse, InvokeFunctionResponse, RpcProvider} from "starknet";
import { DevnetProvider } from "starknet-devnet";

import fs from "fs";
//import {accountTestnet4privateKey, accountTestnet4Address} from "../../A1priv/A1priv"
import * as dotenv from "dotenv";
//import { resetDevnetNow } from "../resetDevnetFunc";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch first devnet-rs
//          👆👆👆


async function main() {
    //initialize Provider 
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050" } );
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
    console.log('✅ Connected to devnet.');
    // const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });

    //resetDevnetNow();
    // initialize existing predeployed account 0 of Devnet
    const preDepl=await l2DevnetProvider.getPredeployedAccounts();
    const privateKey = preDepl[0].private_key;
    const accountAddress: string = preDepl[0].address;
    // const privateKey=accountTestnet4privateKey;
    // const accountAddress=accountTestnet4Address;
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    //console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);

    // Declare & deploy Test contract in devnet
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/PhilTest2.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/PhilTest2.casm.json").toString("ascii"));
    
    const declareResponse = await account0.declare({ contract: compiledSierra, casm: compiledCasm });
    const contractClassHash = declareResponse.class_hash;
    console.log('✅ Test Contract declared with classHash =', contractClassHash);

    await provider.waitForTransaction(declareResponse.transaction_hash);
    
    const { transaction_hash: th2, address } = await account0.deployContract({ classHash: contractClassHash ,constructorCalldata:[100]});
    console.log("contract_address =", address);
    await provider.waitForTransaction(th2);

    // Connect the new contract instance :
    
        const myTestContract = new Contract(compiledSierra.abi, address, provider);
        myTestContract.connect(account0);
        console.log('✅ Test Contract connected at =', myTestContract.address);
        // testnet address = 
        const amount0=await myTestContract.get_counter();
        console.log("counter init =",amount0);
        const {transaction_hash:txh}=await myTestContract.increase_counter(10);
        await provider.waitForTransaction(txh);
        const amount1=await myTestContract.get_counter();
        console.log("counter final =",amount1);
    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });