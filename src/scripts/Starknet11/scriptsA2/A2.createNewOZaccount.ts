// create a new OZ account in devnet
// launch with npx ts-node src/scripts/2.createNewOZaccount.ts

import { Account, ec, json, stark, Provider, hash } from "starknet";
import fs from "fs";
import axios from "axios";
import readline from "readline";
import * as dotenv from "dotenv";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'starknet-devnet --seed 0' before using this script
//        👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    //if (process.env.STARKNET_PROVIDER_BASE_URL != "http://127.0.0.1:5050") {console.log("This script work only on local devnet.");process.exit(1);}
    const provider = new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL ?? "" } });

    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    // Connect existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT0_ADDRESS=', process.env.OZ_ACCOUNT_ADDRESS);
    console.log('OZ_ACCOUNT0_PRIVATE_KEY=', process.env.OZ_ACCOUNT_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT_PRIVATE_KEY ?? "";
    const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const account0Address: string = process.env.OZ_ACCOUNT_ADDRESS ?? "";
    const account0 = new Account(provider, account0Address, starkKeyPair0);
    console.log('OZ account0 connected.\n');


    // new Open Zeppelin account v0.5.1 :

    // Generate public and private key pair.
    const privateKey = process.env.OZ_NEW_ACCOUNT_PRIVKEY ?? "";
    // or for random private key :
    //const privateKey=stark.randomAddress() ;
    console.log('privateKey=', privateKey);
    const starkKeyPair = ec.getKeyPair(privateKey);
    const starkKeyPub = ec.getStarkKey(starkKeyPair);
    console.log('publicKey=', starkKeyPub);
    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/Account_0_5_1.json").toString("ascii")
    );
    // Calculate Class Hash (calculated manually outside of this script)
    const OZaccountClashHass = "0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f";
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ classHash: OZaccountClashHass, contract: compiledOZAccount });
    console.log('OpenZeppelin account class hash =', decCH);
    await provider.waitForTransaction(declTH);

    // Calculate future address of the account
    const OZaccountConstructorCallData = stark.compileCalldata({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, OZaccountClashHass, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);
    // User input to check if the account contract is funded
    const userInput = readline.createInterface({ input: process.stdin, output: process.stdout, });
    let isFunded = false;
    while (!isFunded) {
        await new Promise<void>((resolve) => {
            userInput.question('Add ETH to this account contract. \nIs the account contract funded? (y/n)',
                (isFundedInput) => {
                    if (isFundedInput === "y") {
                        isFunded = true;
                        userInput.close();
                        resolve();
                    } else {
                        console.log(
                            "Please send funds to the account contract and try again."
                        );
                        resolve();
                    }
                }
            );
        });
    }
    // deploy account
    const OZaccount = new Account(provider, OZcontractAddress, starkKeyPair);
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({ classHash: OZaccountClashHass, constructorCalldata: OZaccountConstructorCallData, addressSalt: starkKeyPub });
    console.log('✅ New OpenZeppelin account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });