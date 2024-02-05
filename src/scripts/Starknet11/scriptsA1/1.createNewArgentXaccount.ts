// Deploy a new ArgentX wallet.
// launch with : npx ts-node 

import { Provider, Account, ec, json, stark, hash } from "starknet";
import fs from "fs";
import axios from "axios";
import readline from "readline";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { network: "goerli-alpha" } });

    const privateKey0 = "1202422677688430114213521431078907413426836022101021128058478935525263950730";
    const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const account0Address: string = "0x065A822fBeE1Ae79e898688b5A4282Dc79E0042cbEd12F6169937FdDb4c26641";
    const account0 = new Account(provider, account0Address, starkKeyPair0);
    console.log('existing AX account4 connected.\n');



    // Declare Proxy and ArgentXaccount classes in devnet :
    const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";

    // const ArgentXproxyCompiled = json.parse(fs.readFileSync("./compiledContracts/ArgentProxy_0_2_3.json").toString("ascii"));
    // const ArgentXaccountCompiled = json.parse(fs.readFileSync("./compiledContracts/ArgentAccount_0_2_3.json").toString("ascii"));

    // // declare & deploy ArgentX proxy
    // const { transaction_hash: AXPth, class_hash: AXPch } = await account0.declare({ classHash: argentXproxyClassHash, contract: ArgentXproxyCompiled });
    // // declare ArgentXaccount
    // const { transaction_hash: AXAth, class_hash: AXAch } = await account0.declare({ classHash: argentXaccountClassHash, contract: ArgentXaccountCompiled });
    // await provider.waitForTransaction(AXPth);

    // Calculate future address of the ArgentX account
    const privateKeyAX = stark.randomAddress();
    console.log('AX_ACCOUNT_PRIVATE_KEY=', privateKeyAX);
    const starkKeyPairAX = ec.getKeyPair(privateKeyAX);
    //const starkKeyPairAX = ec.genKeyPair();
    const starkKeyPubAX = ec.getStarkKey(starkKeyPairAX);
    console.log('AX_ACCOUNT_PUBLIC_KEY=', starkKeyPubAX);
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
    // deploy ArgentX account
    const accountAX = new Account(provider, AXcontractAddress, starkKeyPairAX);
    const deployAccountPayload = { classHash: argentXproxyClassHash, constructorCalldata: AXproxyConstructorCallData, contractAddress: AXcontractAddress, addressSalt: starkKeyPubAX };
    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log('Transaction hash =', AXdAth);
    await provider.waitForTransaction(AXdAth);
    console.log('✅ ArgentX wallet deployed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });