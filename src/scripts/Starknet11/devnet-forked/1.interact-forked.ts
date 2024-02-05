// Test Cairo 1 v0.6.0 contract deployed in Testnet, then forked in devnet.
// use Starknet.js v5.10.2, starknet-devnet 0.5.2
// launch with npx ts-node src/scripts/devnet-forked/1.interact-forked.ts

import { CallData, Provider, Contract, Account, json, uint256, Calldata, num, cairo, Abi } from "starknet";
import { test1Abi } from "../../contracts/abis/test_type1-cairo100.abi";

import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --fork-network alpha-goerli' before using this script.
//          👆👆👆

async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
    console.log('✅ Connected to devnet.');

    // initialize existing predeployed account 0 of Devnet
    const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
    const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);


    // Connect the deployed contract instance in testnet
    const testAddressC0 = "0x05f7cd1fd465baff2ba9d2d1501ad0a2eb5337d9a885be319366b5205a414fdd";
    const testAddressC1 = "0x697d3bc2e38d57752c28be0432771f4312d070174ae54eef67dd29e4afb174";
    const myCairo0prog =await provider.getClassAt(testAddressC0);
    const myCairo0Contract = new Contract(myCairo0prog.abi as Abi, testAddressC0, provider);
    const myCairo1Contract = new Contract(test1Abi, testAddressC1, provider);
    myCairo0Contract.connect(account0);
    myCairo1Contract.connect(account0);


    // Interactions with the contract with call & invoke
    console.log('Test Contract Cairo 0 connected at =', myCairo0Contract.address);
    const res1 = await myCairo0Contract.get_balance();
    console.log("res1 =", res1);
    const res2 = await myCairo0Contract.increase_balance(10, 11);
    console.log("res tx =", res2);
    await provider.waitForTransaction(res2.transaction_hash);
    const res3 = await myCairo0Contract.get_balance();
    console.log("res3 =", res3);

    console.log('Test Contract Cairo 1 connected at =', myCairo1Contract.address);
    const res1b = await myCairo1Contract.get_balance();
    console.log("res1 =", res1b);
    const res2b = await myCairo1Contract.increase_balance(10);
    console.log("res tx =", res2b);
    await provider.waitForTransaction(res2b.transaction_hash);
    const res3b = await myCairo1Contract.get_balance();
    console.log("res3 =", res3b);

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });