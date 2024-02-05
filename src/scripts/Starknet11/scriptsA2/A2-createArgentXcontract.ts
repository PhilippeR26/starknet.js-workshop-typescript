// Deploy an instance of an already declared contract.
// Use of OZ deployer.

import { Provider, Account, Contract, defaultProvider, ec, json, stark, number, hash } from "starknet";
import { ec as EC } from "elliptic";
import fs from "fs";
import readline from "readline";
import axios from "axios";
import * as dotenv from "dotenv";
import { starknetKeccak } from "starknet/dist/utils/hash";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    if (process.env.STARKNET_PROVIDER_BASE_URL != "https://alpha4-2.starknet.io") {
        console.log("This script work only on testnet-2 devnet.");
        process.exit(1);
    }
    const provider = new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL } });
    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    const argentXaccountClassHash =
        "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";
    const argentXproxyClassHash =
        "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";

    const privateKeyAX = process.env.AX_NEW_ACCOUNT_PRIVKEY ?? "";
    console.log('AX_PRIVATE_KEY=', privateKeyAX);
    const starkKeyPairAX = ec.getKeyPair(privateKeyAX);
    const starkKeyPubAX = ec.getStarkKey(starkKeyPairAX);
    console.log('AX_PUBLIC_KEY=', starkKeyPubAX);
    const AXproxyConstructorCallData = stark.compileCalldata({ implementation: argentXaccountClassHash, selector: hash.getSelectorFromName("initialize"), calldata: stark.compileCalldata({ signer: starkKeyPubAX, guardian: "0" }), });
    const AXcontractAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, argentXproxyClassHash, AXproxyConstructorCallData, 0);
    console.log('Precalculated account address=', AXcontractAddress);

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
    const accountAX = new Account(provider, AXcontractAddress, starkKeyPairAX);

    const deployAccountPayload = {
        classHash: argentXproxyClassHash,
        constructorCalldata: AXproxyConstructorCallData, contractAddress: AXcontractAddress, addressSalt: starkKeyPubAX
    };

    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAdress } = await accountAX.deployAccount(deployAccountPayload);

    console.log(`\nAccount contract deployment in progress...\n`);
    console.log(`Check deployment transaction status at \n\nhttps://testnet-2.starkscan.co/tx/${AXdAth}\n`
    );
    console.log(`Once the transaction is confirmed, the account is deployed at \n\nhttps://testnet.starkscan.co/tx/${AXcontractFinalAdress}\n`
    );
    await provider.waitForTransaction(AXdAth);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });