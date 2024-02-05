// create a new OZ account in testnet1
// launch with npx ts-node 

import { Account, ec, json, stark, Provider, hash, constants, encode } from "starknet";
import fs from "fs";
import readline from "readline";
import axios from "axios";
import { privateKey0 } from "../../A1priv/A1priv";

import * as dotenv from "dotenv";
dotenv.config();



async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });

    const account0Address: string = "0x065A822fBeE1Ae79e898688b5A4282Dc79E0042cbEd12F6169937FdDb4c26641";
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('existing AX account4 connected.\n');

    // new Open Zeppelin account v0.5.1 :

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New OZ account :\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);

    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/Account_0_5_1.json").toString("ascii"));
    // Calculate Class Hash (calculated manually outside of this script)
    // const OZaccountClashHass = "0x2794ce20e5f2ff0d40e632cb53845b9f4e526ebd8471983f7dbd355b721d5a";
    console.log("declare in progress 😴...");
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ contract: compiledOZAccount });
    await provider.waitForTransaction(declTH);
    console.log('OpenZeppelin account class hash =', decCH);

    // Calculate future address of the account
    const OZaccountConstructorCallData = stark.compileCalldata({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, decCH, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);
    const OZaccount = new Account(provider, OZcontractAddress, privateKey);
    const { suggestedMaxFee: estimatedFee1 } = await OZaccount.estimateAccountDeployFee({ classHash: decCH, addressSalt: starkKeyPub, constructorCalldata: OZaccountConstructorCallData });
        console.log("need",estimatedFee1,"wei");
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
        const { transaction_hash, contract_address } = await OZaccount.deployAccount({ classHash: decCH, constructorCalldata: OZaccountConstructorCallData, addressSalt: starkKeyPub }, { maxFee: estimatedFee1*11n/10n });
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