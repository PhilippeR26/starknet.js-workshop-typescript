// create a new OZ account in testnet2
// launch with npx ts-node 

import { Account, ec, json, stark, Provider, hash, } from "starknet";
import { StarknetChainId } from "starknet/src/constants"
import { accountTestnet2ArgentX1Address, accountTestnet2ArgentX1privateKey } from "../../A2priv/A2priv";
import fs from "fs";
import readline from "readline";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();




async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { network: 'goerli-alpha-2' } }) // or 'goerli-alpha'
    console.log("STARKNET_PROVIDER_BASE_URL=https://alpha4-2.starknet.io");

    const privateKeyAX = accountTestnet2ArgentX1privateKey; //testnet2
    const starkKeyPairAX = ec.getKeyPair(privateKeyAX);
    const accountAXAddress: string = accountTestnet2ArgentX1Address; //testnet2


    const account0 = new Account(provider, accountAXAddress, starkKeyPairAX);
    console.log('AX account connected with :');
    console.log('AX_ACCOUNT_ADDRESS=', accountAXAddress);
    console.log('AX_ACCOUNT_PRIVATE_KEY=', privateKeyAX, "\n");

    // new Open Zeppelin account v0.5.1 :

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New OZ account :\nprivateKey=', privateKey);
    const starkKeyPair = ec.getKeyPair(privateKey);
    const starkKeyPub = ec.getStarkKey(starkKeyPair);
    console.log('publicKey=', starkKeyPub);

    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/Account_0_5_1.json").toString("ascii"));
    // Calculate Class Hash (calculated manually outside of this script)
    const OZaccountClashHass = "0x2794ce20e5f2ff0d40e632cb53845b9f4e526ebd8471983f7dbd355b721d5a";
    console.log("declare in progress 😴...");
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ classHash: OZaccountClashHass, contract: compiledOZAccount });
    await provider.waitForTransaction(declTH);
    console.log('OpenZeppelin account class hash =', decCH);

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
    console.log("deployement in progress 😴...");
    const OZaccount = new Account(provider, OZcontractAddress, starkKeyPair);
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({ classHash: OZaccountClashHass, constructorCalldata: OZaccountConstructorCallData, addressSalt: starkKeyPub });
    console.log('✅ New OpenZeppelin account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);
    console.log("script ended 👋.")
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });