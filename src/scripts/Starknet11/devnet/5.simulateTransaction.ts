// use account.simulateTransaction.
// use Starknet.js v5.6.0, starknet-devnet 0.5.0
// launch with npx ts-node src/scripts/devnet/5.simulateTransaction.ts

import { CallData, Provider, Contract, Account, json, uint256,hash,stark } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          Launch also the script src/starknet_jsExistingAccount.ts.
//          👆👆👆
async function main() {
   //initialize Provider 
   const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
   console.log('✅ Connected to devnet.');

   // initialize existing predeployed account 0 of Devnet
   const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
   const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
   const account0 = new Account(provider, accountAddress, privateKey);
   console.log('✅ Predeployed account deployed\nOZ_ACCOUNT_ADDRESS=', account0.address);
   console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);


    // Connect the deployed Test instance in devnet
    const testAddress = "0x51d5e9464f974ab6afbac0567f06ccd3e47083b06553759b5515ea69ed7b55d"; 
 
const callD=stark.compileCalldata({
    spender:"0x2bcc885342ebbcbcd170ae6cafa8a4bed22bb993479f49806e72d96af94c965",
    amountLow:"0x38d7ea4c68000",
    amountHigh:0
});
    console.log("calldata =",callD);

    const res=await account0.simulateTransaction({
        contractAddress:testAddress,
        entrypoint:"approve",
        calldata:callD
    })
    // console.log("res =",res);
    console.log("calldata =",res.trace.function_invocation?.calldata);

 console.log(hash.getSelectorFromName('approve'))
    
   console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });